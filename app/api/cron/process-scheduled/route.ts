import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logToRedis } from '@/lib/redis'

// Endpoint para processar transações agendadas vencidas automaticamente
// Pode ser chamado por um cron job ou manualmente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Buscar transações agendadas que já venceram
    const scheduledTransactions = await prisma.transaction.findMany({
      where: {
        isScheduled: true,
        scheduledDate: {
          lte: now, // Já passou da data agendada
        },
      },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    let processedCount = 0
    let errorsCount = 0

    for (const transaction of scheduledTransactions) {
      try {
        // Confirmar transação automaticamente
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            date: transaction.scheduledDate || now,
            isScheduled: false,
            scheduledDate: null,
          },
        })

        // Se transação estava vinculada a um plano, atualizar Plan.currentAmount
        if (transaction.planId && transaction.type === 'EXPENSE') {
          const plan = transaction.plan
          if (plan) {
            // Recalcular currentAmount baseado em todas as transações do plano
            const planTransactions = await prisma.transaction.findMany({
              where: {
                planId: plan.id,
                type: 'EXPENSE',
                isScheduled: false,
              },
            })

            const newCurrentAmount = planTransactions.reduce((sum, t) => sum + t.amount, 0)
            const isCompleted = newCurrentAmount >= plan.targetAmount

            await prisma.plan.update({
              where: { id: plan.id },
              data: {
                currentAmount: newCurrentAmount,
                status: isCompleted ? 'COMPLETED' : plan.status,
              },
            })
          }
        }

        processedCount++

        await logToRedis('info', 'Transação agendada processada automaticamente', {
          transactionId: transaction.id,
          userId: transaction.userId,
          scheduledDate: transaction.scheduledDate?.toISOString(),
        })
      } catch (error) {
        errorsCount++
        await logToRedis('error', 'Erro ao processar transação agendada', {
          transactionId: transaction.id,
          error: String(error),
        })
        // Continuar processando outras transações mesmo se uma falhar
      }
    }

    await logToRedis('info', 'Processamento automático de transações agendadas concluído', {
      total: scheduledTransactions.length,
      processed: processedCount,
      errors: errorsCount,
    })

    return NextResponse.json({
      success: true,
      message: 'Processamento concluído',
      total: scheduledTransactions.length,
      processed: processedCount,
      errors: errorsCount,
    })
  } catch (error) {
    await logToRedis('error', 'Erro no processamento automático de transações agendadas', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao processar transações agendadas' },
      { status: 500 }
    )
  }
}

// GET para verificar status (sem processar)
export async function GET() {
  try {
    const now = new Date()

    const dueScheduled = await prisma.transaction.count({
      where: {
        isScheduled: true,
        scheduledDate: {
          lte: now,
        },
      },
    })

    const upcomingScheduled = await prisma.transaction.count({
      where: {
        isScheduled: true,
        scheduledDate: {
          gt: now,
        },
      },
    })

    return NextResponse.json({
      due: dueScheduled,
      upcoming: upcomingScheduled,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}



