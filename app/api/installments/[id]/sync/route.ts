import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

// Endpoint para sincronizar Installment.currentInstallment com as transações reais
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
      include: {
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

    // Calcular currentInstallment baseado nas transações reais
    const calculatedInstallment = installment.transactions.length
    const previousInstallment = installment.currentInstallment
    const isCompleted = calculatedInstallment >= installment.installments

    // Atualizar parcelamento
    const updated = await prisma.installment.update({
      where: { id: params.id },
      data: {
        currentInstallment: calculatedInstallment,
        status: isCompleted ? 'COMPLETED' : installment.status,
      },
    })

    await logToRedis('info', 'Parcelamento sincronizado', {
      userId: user.id,
      installmentId: params.id,
      previousInstallment,
      newInstallment: calculatedInstallment,
      difference: calculatedInstallment - previousInstallment,
      transactionCount: installment.transactions.length,
    })

    return NextResponse.json({
      success: true,
      installment: updated,
      sync: {
        previousInstallment,
        calculatedInstallment,
        difference: calculatedInstallment - previousInstallment,
        transactionCount: installment.transactions.length,
        isCompleted,
      },
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao sincronizar parcelamento', {
      installmentId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao sincronizar parcelamento' },
      { status: 500 }
    )
  }
}

// GET para verificar status de sincronização sem atualizar
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
        transactions: true,
      },
    })

    if (!installment) {
      return NextResponse.json(
        { error: 'Parcelamento não encontrado' },
        { status: 404 }
      )
    }

    const calculatedInstallment = installment.transactions.length
    const difference = calculatedInstallment - installment.currentInstallment
    const isSynced = difference === 0

    return NextResponse.json({
      installmentId: installment.id,
      currentInstallment: installment.currentInstallment,
      calculatedInstallment,
      difference,
      isSynced,
      transactionCount: installment.transactions.length,
      needsSync: !isSynced,
      status: installment.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar sincronização' },
      { status: 500 }
    )
  }
}




