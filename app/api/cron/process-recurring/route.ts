import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logToRedis } from '@/lib/redis'
import { notifyUpcomingRecurring } from '@/lib/notifications'

// Função para calcular próxima data de vencimento
function calculateNextDueDate(
  frequency: string,
  lastDate: Date,
  startDate: Date
): Date {
  const next = new Date(lastDate || startDate)
  
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      break
    case 'SEMIANNUAL':
      next.setMonth(next.getMonth() + 6)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  
  return next
}

// Endpoint para processar transações recorrentes vencidas
// Pode ser chamado por um cron job ou manualmente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (pode ser um token de API ou header especial)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    // Buscar transações recorrentes ativas que estão vencidas ou próximas
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lte: now, // Vencidas ou vencendo hoje
        },
        OR: [
          { endDate: null }, // Sem data de término
          { endDate: { gte: now } }, // Ainda dentro do período
        ],
      },
      include: {
        user: true,
        category: true,
      },
    })

    let processedCount = 0
    let notificationCount = 0

    for (const recurring of recurringTransactions) {
      try {
        // Verificar se já passou da data de vencimento
        if (recurring.nextDueDate <= now) {
          // Criar transação automaticamente
          await prisma.transaction.create({
            data: {
              description: recurring.description,
              amount: recurring.amount,
              type: recurring.type,
              categoryId: recurring.categoryId,
              userId: recurring.userId,
              date: recurring.nextDueDate,
            },
          })

          // Calcular próxima data de vencimento
          const nextDueDate = calculateNextDueDate(
            recurring.frequency,
            recurring.nextDueDate,
            recurring.startDate
          )

          // Verificar se passou da data de término
          const isExpired = recurring.endDate && nextDueDate > recurring.endDate

          // Atualizar transação recorrente
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: {
              nextDueDate,
              lastExecuted: now,
              isActive: !isExpired,
            },
          })

          processedCount++

          await logToRedis('info', 'Transação recorrente processada automaticamente', {
            recurringTransactionId: recurring.id,
            userId: recurring.userId,
            nextDueDate: nextDueDate.toISOString(),
          })
        }

        // Criar notificação para transações que vencem em até 3 dias
        if (recurring.nextDueDate <= threeDaysFromNow && recurring.nextDueDate > now) {
          await notifyUpcomingRecurring(
            recurring.userId,
            recurring.description,
            recurring.nextDueDate
          )
          notificationCount++
        }
      } catch (error) {
        await logToRedis('error', 'Erro ao processar transação recorrente', {
          recurringTransactionId: recurring.id,
          error: String(error),
        })
        // Continuar processando outras transações mesmo se uma falhar
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Processamento concluído',
      processed: processedCount,
      notifications: notificationCount,
      total: recurringTransactions.length,
    })
  } catch (error) {
    await logToRedis('error', 'Erro no processamento automático de recorrentes', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao processar transações recorrentes' },
      { status: 500 }
    )
  }
}

// GET para verificar status (sem processar)
export async function GET() {
  try {
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const dueRecurring = await prisma.recurringTransaction.count({
      where: {
        isActive: true,
        nextDueDate: {
          lte: now,
        },
      },
    })

    const upcomingRecurring = await prisma.recurringTransaction.count({
      where: {
        isActive: true,
        nextDueDate: {
          gt: now,
          lte: threeDaysFromNow,
        },
      },
    })

    return NextResponse.json({
      due: dueRecurring,
      upcoming: upcomingRecurring,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}




