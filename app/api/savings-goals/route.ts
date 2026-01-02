import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Valor meta deve ser positivo'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string(),
  endDate: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | null

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const goals = await prisma.savingsGoal.findMany({
      where,
      orderBy: {
        endDate: 'asc',
      },
    })

    // Calcular progresso e informações adicionais
    const goalsWithProgress = goals.map((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100
      const remaining = goal.targetAmount - goal.currentAmount
      const daysRemaining = Math.ceil(
        (new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      const isOverdue = daysRemaining < 0 && goal.status === 'ACTIVE'
      const isCompleted = goal.currentAmount >= goal.targetAmount

      return {
        ...goal,
        progress: Math.min(progress, 100),
        remaining,
        daysRemaining: Math.max(0, daysRemaining),
        isOverdue,
        isCompleted,
      }
    })

    await logToRedis('info', 'Metas de economia listadas', {
      userId: user.id,
      count: goals.length,
    })

    return NextResponse.json(goalsWithProgress)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar metas de economia', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar metas de economia' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = savingsGoalSchema.parse(body)

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return NextResponse.json(
        { error: 'A data final deve ser posterior à data inicial' },
        { status: 400 }
      )
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        userId: user.id,
      },
    })

    await logToRedis('info', 'Meta de economia criada', {
      userId: user.id,
      goalId: goal.id,
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar meta de economia', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar meta de economia', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar meta de economia' },
      { status: 500 }
    )
  }
}





