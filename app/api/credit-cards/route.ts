import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().positive('Limite deve ser positivo'),
  paymentDay: z.number().int().min(1, 'Dia de pagamento deve ser entre 1 e 31').max(31, 'Dia de pagamento deve ser entre 1 e 31'),
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

    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
            isScheduled: false, // Apenas transações confirmadas
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calcular limite usado e restante para cada cartão
    const creditCardsWithUsage = creditCards.map((card) => {
      const usedAmount = card.transactions.reduce((sum, t) => sum + t.amount, 0)
      const remainingAmount = card.limit - usedAmount
      const usagePercentage = (usedAmount / card.limit) * 100

      const { transactions, ...cardWithoutTransactions } = card

      return {
        ...cardWithoutTransactions,
        usedAmount,
        remainingAmount,
        usagePercentage: Math.min(usagePercentage, 100),
      }
    })

    await logToRedis('info', 'Cartões de crédito listados', {
      userId: user.id,
      count: creditCards.length,
    })

    return NextResponse.json(creditCardsWithUsage)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar cartões de crédito', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao buscar cartões de crédito' },
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
    const data = creditCardSchema.parse(body)

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

    const creditCard = await prisma.creditCard.create({
      data: {
        name: data.name,
        limit: data.limit,
        paymentDay: data.paymentDay,
        userId: targetUserId,
      },
    })

    await logToRedis('info', 'Cartão de crédito criado', {
      userId: user.id,
      creditCardId: creditCard.id,
      name: data.name,
    })

    return NextResponse.json(creditCard, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar cartão de crédito', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar cartão de crédito:', error)
    await logToRedis('error', 'Erro ao criar cartão de crédito', { 
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Erro ao criar cartão de crédito',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

