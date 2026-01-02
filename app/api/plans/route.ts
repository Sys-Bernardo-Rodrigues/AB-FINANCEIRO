import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const planSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Valor deve ser positivo'),
  startDate: z.string(),
  endDate: z.string(),
  categoryId: z.string().uuid('Categoria inválida'),
  userId: z.string().uuid('Usuário inválido').optional(),
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
    const status = searchParams.get('status')

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calcular progresso de cada plano
    const plansWithProgress = plans.map((plan) => {
      const totalSpent = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
      const progress = (totalSpent / plan.targetAmount) * 100
      const remaining = plan.targetAmount - totalSpent

      return {
        ...plan,
        currentAmount: totalSpent,
        progress: Math.min(progress, 100),
        remaining,
      }
    })

    await logToRedis('info', 'Planejamentos listados', {
      userId: user.id,
      count: plans.length,
    })

    return NextResponse.json(plansWithProgress)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar planejamentos', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao buscar planejamentos' },
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
    const data = planSchema.parse(body)

    // Validação de datas
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return NextResponse.json(
        { error: 'A data final deve ser posterior à data inicial' },
        { status: 400 }
      )
    }

    // Usar o userId fornecido ou o do usuário autenticado
    const targetUserId = data.userId || user.id

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe e pertence ao usuário
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId: targetUserId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        categoryId: data.categoryId,
        userId: targetUserId,
      },
      include: {
        category: true,
      },
    })

    await logToRedis('info', 'Planejamento criado', {
      userId: user.id,
      planId: plan.id,
      targetAmount: data.targetAmount,
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar planejamento', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar planejamento', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao criar planejamento' },
      { status: 500 }
    )
  }
}
