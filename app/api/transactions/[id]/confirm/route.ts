import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isScheduled: true,
      },
      include: {
        plan: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação agendada não encontrada' },
        { status: 404 }
      )
    }

    // Confirmar transação agendada: atualizar data e remover flag de agendada
    const confirmed = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        date: transaction.scheduledDate || new Date(),
        isScheduled: false,
        scheduledDate: null,
      },
      include: {
        category: true,
        plan: true,
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
            isScheduled: false, // Apenas transações confirmadas
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

        await logToRedis('info', 'Plano atualizado após confirmar transação agendada', {
          planId: plan.id,
          newCurrentAmount,
          previousAmount: plan.currentAmount,
        })
      }
    }

    await logToRedis('info', 'Transação agendada confirmada', {
      userId: user.id,
      transactionId: params.id,
      hadPlan: !!transaction.planId,
    })

    return NextResponse.json(confirmed)
  } catch (error) {
    await logToRedis('error', 'Erro ao confirmar transação agendada', {
      transactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao confirmar transação agendada' },
      { status: 500 }
    )
  }
}



