import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getFamilyGroupUserIds } from '@/lib/family-groups'
import { parseLocalDate } from '@/lib/utils/format'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentAmount: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

export async function GET(
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

    // Obter IDs de todos os membros do grupo familiar
    const familyUserIds = await getFamilyGroupUserIds()

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: { in: familyUserIds },
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Meta de economia não encontrada' },
        { status: 404 }
      )
    }

    const progress = (goal.currentAmount / goal.targetAmount) * 100
    const remaining = goal.targetAmount - goal.currentAmount
    const daysRemaining = Math.ceil(
      (new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      ...goal,
      progress: Math.min(progress, 100),
      remaining,
      daysRemaining: Math.max(0, daysRemaining),
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar meta de economia', {
      goalId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar meta de economia' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const data = updateSavingsGoalSchema.parse(body)

    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta de economia não encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.targetAmount) updateData.targetAmount = data.targetAmount
    if (data.period) updateData.period = data.period
    if (data.startDate) updateData.startDate = parseLocalDate(data.startDate)
    if (data.endDate) updateData.endDate = parseLocalDate(data.endDate)
    if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount
    if (data.status) updateData.status = data.status

    // Se a meta foi completada, atualizar status automaticamente
    if (data.currentAmount !== undefined && data.currentAmount >= existing.targetAmount) {
      updateData.status = 'COMPLETED'
    }

    const updated = await prisma.savingsGoal.update({
      where: { id: params.id },
      data: updateData,
    })

    await logToRedis('info', 'Meta de economia atualizada', {
      userId: user.id,
      goalId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar meta de economia', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar meta de economia', {
      goalId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar meta de economia' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta de economia não encontrada' },
        { status: 404 }
      )
    }

    await prisma.savingsGoal.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Meta de economia deletada', {
      userId: user.id,
      goalId: params.id,
    })

    return NextResponse.json({ message: 'Meta de economia deletada com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar meta de economia', {
      goalId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar meta de economia' },
      { status: 500 }
    )
  }
}






