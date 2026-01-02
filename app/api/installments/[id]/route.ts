import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateInstallmentSchema = z.object({
  description: z.string().min(1).optional(),
  totalAmount: z.number().positive().optional(),
  installments: z.number().int().min(2).optional(),
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

    const installment = await prisma.installment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      )
    }

    // Calcular progresso
    const progress = (installment.currentInstallment / installment.installments) * 100
    const remaining = installment.installments - installment.currentInstallment
    const installmentAmount = installment.totalAmount / installment.installments

    return NextResponse.json({
      ...installment,
      progress: Math.min(progress, 100),
      remaining,
      installmentAmount,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar parcelamento', {
      installmentId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar parcelamento' },
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
    const data = updateInstallmentSchema.parse(body)

    const existingInstallment = await prisma.installment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: true,
      },
    })

    if (!existingInstallment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      )
    }

    // Se mudou o número de parcelas ou valor total, recalcular valores das transações
    const updateData: any = {}
    if (data.description) updateData.description = data.description
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.status) updateData.status = data.status

    // Se mudou totalAmount ou installments, recalcular currentInstallment baseado nas transações
    if (data.totalAmount !== undefined || data.installments !== undefined) {
      const newTotalAmount = data.totalAmount ?? existingInstallment.totalAmount
      const newInstallments = data.installments ?? existingInstallment.installments
      const newInstallmentAmount = newTotalAmount / newInstallments

      updateData.totalAmount = newTotalAmount
      updateData.installments = newInstallments

      // Recalcular currentInstallment baseado nas transações existentes
      const calculatedInstallment = existingInstallment.transactions.length
      updateData.currentInstallment = Math.min(calculatedInstallment, newInstallments)

      // Atualizar status se necessário
      if (updateData.currentInstallment >= newInstallments) {
        updateData.status = 'COMPLETED'
      } else if (existingInstallment.status === 'COMPLETED' && updateData.currentInstallment < newInstallments) {
        updateData.status = 'ACTIVE'
      }
    }

    const updated = await prisma.installment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    await logToRedis('info', 'Parcelamento atualizado', {
      userId: user.id,
      installmentId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar parcelamento', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar parcelamento', {
      installmentId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar parcelamento' },
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

    const installment = await prisma.installment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: true,
      },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há transações vinculadas
    if (installment.transactions.length > 0) {
      // Opção 1: Deletar todas as transações vinculadas
      // Opção 2: Apenas remover o vínculo (installmentId = null)
      // Vamos usar a opção 2 para não perder histórico
      await prisma.transaction.updateMany({
        where: {
          installmentId: params.id,
        },
        data: {
          installmentId: null,
          isInstallment: false,
        },
      })
    }

    // Deletar parcelamento
    await prisma.installment.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Parcelamento deletado', {
      userId: user.id,
      installmentId: params.id,
      transactionsUnlinked: installment.transactions.length,
    })

    return NextResponse.json({ message: 'Parcelamento deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar parcelamento', {
      installmentId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar parcelamento' },
      { status: 500 }
    )
  }
}

