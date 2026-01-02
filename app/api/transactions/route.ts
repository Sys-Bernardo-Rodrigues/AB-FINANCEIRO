import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid('Categoria inválida'),
  date: z.string().optional(),
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
    const type = searchParams.get('type')
    const allUsers = searchParams.get('allUsers') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Se allUsers for true, não filtrar por userId (mostrar todas)
    const where: any = allUsers ? {} : { userId: user.id }
    if (type) {
      where.type = type as 'INCOME' | 'EXPENSE'
    }

    const transactions = await prisma.transaction.findMany({
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
        date: 'desc',
      },
      take: limit,
    })

    await logToRedis('info', 'Transações listadas', {
      userId: user.id,
      count: transactions.length,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar transações', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
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
    const data = transactionSchema.parse(body)

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

    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        userId: targetUserId,
        date: data.date ? new Date(data.date) : new Date(),
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

    await logToRedis('info', 'Transação criada', {
      userId: user.id,
      transactionId: transaction.id,
      type: transaction.type,
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar transação', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar transação', { error: String(error) })
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    )
  }
}
