import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateRecurringTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY']).optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
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

    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
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

    if (!recurringTransaction) {
      return NextResponse.json(
        { error: 'Transação recorrente não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(recurringTransaction)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar transação recorrente', {
      recurringTransactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar transação recorrente' },
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
    const data = updateRecurringTransactionSchema.parse(body)

    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação recorrente não encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.description) updateData.description = data.description
    if (data.amount) updateData.amount = data.amount
    if (data.type) updateData.type = data.type
    if (data.frequency) updateData.frequency = data.frequency
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    // Recalcular nextDueDate se frequency ou startDate mudou
    if (data.frequency || data.startDate) {
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate
      const lastExecuted = existing.lastExecuted || startDate
      updateData.nextDueDate = calculateNextDueDate(
        data.frequency || existing.frequency,
        lastExecuted,
        startDate
      )
    }

    const updated = await prisma.recurringTransaction.update({
      where: { id: params.id },
      data: updateData,
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

    await logToRedis('info', 'Transação recorrente atualizada', {
      userId: user.id,
      recurringTransactionId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar transação recorrente', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar transação recorrente', {
      recurringTransactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar transação recorrente' },
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

    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transação recorrente não encontrada' },
        { status: 404 }
      )
    }

    await prisma.recurringTransaction.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Transação recorrente deletada', {
      userId: user.id,
      recurringTransactionId: params.id,
    })

    return NextResponse.json({ message: 'Transação recorrente deletada com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar transação recorrente', {
      recurringTransactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar transação recorrente' },
      { status: 500 }
    )
  }
}




