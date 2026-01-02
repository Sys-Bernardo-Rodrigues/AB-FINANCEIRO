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
      include: { 
        category: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
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

    // Buscar transação existente com relacionamentos
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        plan: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    // Se amount ou planId mudou, precisamos atualizar o plano
    const amountChanged = data.amount !== undefined && data.amount !== existingTransaction.amount
    const wasExpense = existingTransaction.type === 'EXPENSE'
    const isStillExpense = data.type === undefined || data.type === 'EXPENSE'
    const hadPlan = existingTransaction.planId !== null

    // Atualizar transação
    const updateData: any = {}
    if (data.description) updateData.description = data.description
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.type) updateData.type = data.type
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.date) updateData.date = new Date(data.date)

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        plan: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    })

    // Atualizar Plan.currentAmount se necessário
    if (hadPlan && (amountChanged || wasExpense || isStillExpense)) {
      const plan = existingTransaction.plan
      if (plan) {
        // Recalcular currentAmount baseado em todas as transações do plano
        const planTransactions = await prisma.transaction.findMany({
          where: {
            planId: plan.id,
            type: 'EXPENSE',
          },
        })

        const newCurrentAmount = planTransactions.reduce((sum, t) => sum + t.amount, 0)
        const isCompleted = newCurrentAmount >= plan.targetAmount

        await prisma.plan.update({
          where: { id: plan.id },
          data: {
            currentAmount: newCurrentAmount,
            status: isCompleted ? 'COMPLETED' : plan.status,
          },
        })

        await logToRedis('info', 'Plano atualizado após atualizar transação', {
          planId: plan.id,
          newCurrentAmount,
          previousAmount: plan.currentAmount,
        })
      }
    }

    await logToRedis('info', 'Transação atualizada', {
      userId: user.id,
      transactionId: transaction.id,
      amountChanged,
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

    // Buscar transação com relacionamentos
    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id: params.id,
      },
      include: {
        plan: true,
        installment: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    // Deletar transação
    await prisma.transaction.delete({
      where: { id: params.id },
    })

    // Atualizar Plan.currentAmount se transação estava vinculada a um plano
    if (existingTransaction.planId && existingTransaction.type === 'EXPENSE') {
      const plan = existingTransaction.plan
      if (plan) {
        const newCurrentAmount = Math.max(0, plan.currentAmount - existingTransaction.amount)
        const wasCompleted = plan.status === 'COMPLETED'
        const shouldBeActive = newCurrentAmount < plan.targetAmount

        await prisma.plan.update({
          where: { id: existingTransaction.planId },
          data: {
            currentAmount: newCurrentAmount,
            status: shouldBeActive && wasCompleted ? 'ACTIVE' : plan.status,
          },
        })

        await logToRedis('info', 'Plano atualizado após deletar transação', {
          planId: existingTransaction.planId,
          newCurrentAmount,
          previousAmount: plan.currentAmount,
        })
      }
    }

    // Atualizar Installment.currentInstallment se transação era de parcelamento
    if (existingTransaction.installmentId && existingTransaction.isInstallment) {
      const installment = existingTransaction.installment
      if (installment) {
        // Recalcular currentInstallment baseado nas transações restantes
        const remainingTransactions = await prisma.transaction.findMany({
          where: {
            installmentId: existingTransaction.installmentId,
          },
          orderBy: { date: 'asc' },
        })

        const newCurrentInstallment = remainingTransactions.length
        const isCompleted = newCurrentInstallment >= installment.installments
        const wasCompleted = installment.status === 'COMPLETED'

        await prisma.installment.update({
          where: { id: existingTransaction.installmentId },
          data: {
            currentInstallment: Math.max(0, newCurrentInstallment),
            status: isCompleted ? 'COMPLETED' : (wasCompleted && !isCompleted ? 'ACTIVE' : installment.status),
          },
        })

        await logToRedis('info', 'Parcelamento atualizado após deletar transação', {
          installmentId: existingTransaction.installmentId,
          previousInstallment: installment.currentInstallment,
          newCurrentInstallment,
          isCompleted,
        })
      }
    }

    await logToRedis('info', 'Transação deletada', {
      deletedBy: user.id,
      transactionId: params.id,
      transactionUserId: existingTransaction.userId,
      hadPlan: !!existingTransaction.planId,
      hadInstallment: !!existingTransaction.installmentId,
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
