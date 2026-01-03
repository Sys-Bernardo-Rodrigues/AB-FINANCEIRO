import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

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

    const installment = await prisma.installment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: { transactions: true },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      )
    }

    if (installment.currentInstallment >= installment.installments) {
      return NextResponse.json(
        { error: 'Todas as parcelas já foram pagas' },
        { status: 400 }
      )
    }

    const installmentAmount = installment.totalAmount / installment.installments
    const nextInstallment = installment.currentInstallment + 1

    // Calcular data da próxima parcela (30 dias após a última)
    const lastTransaction = installment.transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
    const nextDate = new Date(lastTransaction.date)
    nextDate.setMonth(nextDate.getMonth() + 1)

    // Criar próxima parcela
    const transaction = await prisma.transaction.create({
      data: {
        description: `${installment.description} (${nextInstallment}/${installment.installments})`,
        amount: installmentAmount,
        type: 'EXPENSE',
        categoryId: installment.categoryId,
        userId: user.id,
        date: nextDate,
        isInstallment: true,
        installmentId: installment.id,
        creditCardId: installment.creditCardId || null,
      },
    })

    // Atualizar parcelamento
    const updatedInstallment = await prisma.installment.update({
      where: { id: params.id },
      data: {
        currentInstallment: nextInstallment,
        status: nextInstallment >= installment.installments ? 'COMPLETED' : 'ACTIVE',
      },
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    await logToRedis('info', 'Próxima parcela criada', {
      userId: user.id,
      installmentId: installment.id,
      installment: nextInstallment,
    })

    return NextResponse.json(updatedInstallment)
  } catch (error) {
    await logToRedis('error', 'Erro ao criar próxima parcela', {
      installmentId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar próxima parcela' },
      { status: 500 }
    )
  }
}
