import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { notifyUpcomingRecurring } from '@/lib/notifications'

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

    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!recurringTransaction) {
      return NextResponse.json(
        { error: 'Transação recorrente não encontrada' },
        { status: 404 }
      )
    }

    if (!recurringTransaction.isActive) {
      return NextResponse.json(
        { error: 'Transação recorrente está inativa' },
        { status: 400 }
      )
    }

    // Verificar se já passou da data de vencimento
    const now = new Date()
    if (recurringTransaction.nextDueDate > now) {
      return NextResponse.json(
        { error: 'Ainda não é a data de execução desta transação' },
        { status: 400 }
      )
    }

    // Criar a transação
    const transaction = await prisma.transaction.create({
      data: {
        description: recurringTransaction.description,
        amount: recurringTransaction.amount,
        type: recurringTransaction.type,
        categoryId: recurringTransaction.categoryId,
        userId: recurringTransaction.userId,
        date: recurringTransaction.nextDueDate,
        creditCardId: recurringTransaction.creditCardId || null,
      },
      include: {
        category: true,
      },
    })

    // Atualizar a próxima data de vencimento
    const nextDueDate = calculateNextDueDate(
      recurringTransaction.frequency,
      recurringTransaction.nextDueDate,
      recurringTransaction.startDate
    )

    // Verificar se passou da data de término
    const isExpired = recurringTransaction.endDate && nextDueDate > recurringTransaction.endDate

    await prisma.recurringTransaction.update({
      where: { id: params.id },
      data: {
        nextDueDate,
        lastExecuted: now,
        isActive: !isExpired,
      },
    })

    await logToRedis('info', 'Transação recorrente executada', {
      userId: user.id,
      recurringTransactionId: params.id,
      transactionId: transaction.id,
    })

    return NextResponse.json({
      transaction,
      message: 'Transação criada com sucesso',
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao executar transação recorrente', {
      recurringTransactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao executar transação recorrente' },
      { status: 500 }
    )
  }
}

