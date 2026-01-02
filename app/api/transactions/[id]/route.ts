import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const transactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId: z.string().uuid().optional(),
  date: z.string().optional(),
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: { category: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar transação', {
      transactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar transação' },
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
    const data = transactionSchema.parse(body)

    // Verificar se a transação pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.description) updateData.description = data.description
    if (data.amount) updateData.amount = data.amount
    if (data.type) updateData.type = data.type
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.date) updateData.date = new Date(data.date)

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: updateData,
      include: { category: true },
    })

    await logToRedis('info', 'Transação atualizada', {
      userId: user.id,
      transactionId: transaction.id,
    })

    return NextResponse.json(transaction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar transação', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar transação', {
      transactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
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

    // Verificar se a transação existe (permitir deletar transações de qualquer usuário)
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Transação deletada', {
      deletedBy: user.id,
      transactionId: params.id,
      transactionUserId: existingTransaction.userId,
    })

    return NextResponse.json({ message: 'Transação deletada com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar transação', {
      transactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar transação' },
      { status: 500 }
    )
  }
}
