import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'
import { notifyGoalProgress, notifyGoalCompleted } from '@/lib/notifications'

const addAmountSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
})

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

    const body = await request.json()
    const data = addAmountSchema.parse(body)

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Meta de economia não encontrada' },
        { status: 404 }
      )
    }

    if (goal.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Apenas metas ativas podem receber valores' },
        { status: 400 }
      )
    }

    const newAmount = goal.currentAmount + data.amount
    const isCompleted = newAmount >= goal.targetAmount

    const updated = await prisma.savingsGoal.update({
      where: { id: params.id },
      data: {
        currentAmount: newAmount,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
      },
    })

    // Criar notificações
    if (isCompleted) {
      await notifyGoalCompleted(user.id, goal.name)
    } else {
      const progress = (newAmount / goal.targetAmount) * 100
      await notifyGoalProgress(user.id, goal.name, progress)
    }

    await logToRedis('info', 'Valor adicionado à meta de economia', {
      userId: user.id,
      goalId: params.id,
      amount: data.amount,
      completed: isCompleted,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao adicionar valor à meta', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao adicionar valor à meta de economia', {
      goalId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao adicionar valor à meta de economia' },
      { status: 500 }
    )
  }
}

