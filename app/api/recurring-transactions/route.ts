import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const recurringTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY']),
  categoryId: z.string().uuid('Categoria inválida'),
  startDate: z.string(),
  endDate: z.string().optional(),
  userId: z.string().uuid('Usuário inválido').optional(),
  creditCardId: z.string().uuid('Cartão de crédito inválido').optional(),
})

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
    const isActive = searchParams.get('isActive')

    const where: any = { userId: user.id }
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    })

    await logToRedis('info', 'Transações recorrentes listadas', {
      userId: user.id,
      count: recurringTransactions.length,
    })

    return NextResponse.json(recurringTransactions)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar transações recorrentes', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar transações recorrentes' },
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
    const data = recurringTransactionSchema.parse(body)

    // Validação de datas
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
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

    // Verificar se creditCardId é válido (se fornecido)
    if (data.creditCardId) {
      const creditCard = await prisma.creditCard.findFirst({
        where: {
          id: data.creditCardId,
          userId: targetUserId,
        },
      })
      
      if (!creditCard) {
        return NextResponse.json(
          { error: 'Cartão de crédito não encontrado' },
          { status: 404 }
        )
      }
    }

    const startDate = new Date(data.startDate)
    const nextDueDate = calculateNextDueDate(data.frequency, startDate, startDate)

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        frequency: data.frequency,
        categoryId: data.categoryId,
        userId: targetUserId,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextDueDate,
        creditCardId: data.creditCardId || null,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await logToRedis('info', 'Transação recorrente criada', {
      userId: user.id,
      recurringTransactionId: recurringTransaction.id,
    })

    return NextResponse.json(recurringTransaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar transação recorrente', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar transação recorrente', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar transação recorrente' },
      { status: 500 }
    )
  }
}



