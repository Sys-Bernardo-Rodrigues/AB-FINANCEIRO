import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getFamilyGroupUserIds } from '@/lib/family-groups'
import { parseLocalDate } from '@/lib/utils/format'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().uuid().optional(),
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

    const plan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        userId: { in: familyUserIds },
      },
      include: {
        category: true,
        transactions: {
          where: {
            type: 'EXPENSE',
            isScheduled: false,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Calcular progresso
    const totalSpent = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
    const progress = (totalSpent / plan.targetAmount) * 100
    const remaining = plan.targetAmount - totalSpent
    const daysRemaining = Math.ceil(
      (new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      ...plan,
      currentAmount: totalSpent,
      progress: Math.min(progress, 100),
      remaining,
      daysRemaining: Math.max(0, daysRemaining),
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar plano', {
      planId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
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
    const data = updatePlanSchema.parse(body)

    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
            isScheduled: false,
          },
        },
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Validações
    if (data.endDate && data.startDate) {
      const startDate = parseLocalDate(data.startDate)
      const endDate = parseLocalDate(data.endDate)
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'A data final deve ser posterior à data inicial' },
          { status: 400 }
        )
      }
    } else if (data.endDate) {
      const endDate = parseLocalDate(data.endDate)
      if (endDate <= existingPlan.startDate) {
        return NextResponse.json(
          { error: 'A data final deve ser posterior à data inicial' },
          { status: 400 }
        )
      }
    } else if (data.startDate) {
      const startDate = parseLocalDate(data.startDate)
      if (existingPlan.endDate <= startDate) {
        return NextResponse.json(
          { error: 'A data final deve ser posterior à data inicial' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.status) updateData.status = data.status
    if (data.startDate) updateData.startDate = parseLocalDate(data.startDate)
    if (data.endDate) updateData.endDate = parseLocalDate(data.endDate)

    // Se mudou targetAmount, recalcular status baseado em currentAmount
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = data.targetAmount
      
      // Recalcular currentAmount baseado nas transações
      const totalSpent = existingPlan.transactions.reduce((sum, t) => sum + t.amount, 0)
      const isCompleted = totalSpent >= data.targetAmount
      
      // Atualizar status se necessário
      if (isCompleted && existingPlan.status !== 'COMPLETED') {
        updateData.status = 'COMPLETED'
      } else if (!isCompleted && existingPlan.status === 'COMPLETED') {
        updateData.status = 'ACTIVE'
      }
    }

    const updated = await prisma.plan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        transactions: {
          where: {
            type: 'EXPENSE',
            isScheduled: false,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    await logToRedis('info', 'Plano atualizado', {
      userId: user.id,
      planId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar plano', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar plano', {
      planId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
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

    const plan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: true,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há transações vinculadas
    if (plan.transactions.length > 0) {
      // Remover vínculo das transações (não deletar as transações)
      await prisma.transaction.updateMany({
        where: {
          planId: params.id,
        },
        data: {
          planId: null,
        },
      })
    }

    // Deletar plano
    await prisma.plan.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Plano deletado', {
      userId: user.id,
      planId: params.id,
      transactionsUnlinked: plan.transactions.length,
    })

    return NextResponse.json({ message: 'Plano deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar plano', {
      planId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar plano' },
      { status: 500 }
    )
  }
}




