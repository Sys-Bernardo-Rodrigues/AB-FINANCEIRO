import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

// Endpoint para sincronizar Plan.currentAmount com as transações reais
// Útil para corrigir inconsistências ou após importações de dados
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

    const plan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Calcular currentAmount baseado nas transações reais
    const calculatedAmount = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
    const previousAmount = plan.currentAmount
    const isCompleted = calculatedAmount >= plan.targetAmount

    // Atualizar plano
    const updated = await prisma.plan.update({
      where: { id: params.id },
      data: {
        currentAmount: calculatedAmount,
        status: isCompleted ? 'COMPLETED' : plan.status,
      },
    })

    await logToRedis('info', 'Plano sincronizado', {
      userId: user.id,
      planId: params.id,
      previousAmount,
      newAmount: calculatedAmount,
      difference: calculatedAmount - previousAmount,
      transactionCount: plan.transactions.length,
    })

    return NextResponse.json({
      success: true,
      plan: updated,
      sync: {
        previousAmount,
        calculatedAmount,
        difference: calculatedAmount - previousAmount,
        transactionCount: plan.transactions.length,
      },
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao sincronizar plano', {
      planId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao sincronizar plano' },
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

    const plan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    const calculatedAmount = plan.transactions.reduce((sum, t) => sum + t.amount, 0)
    const difference = calculatedAmount - plan.currentAmount
    const isSynced = Math.abs(difference) < 0.01 // Tolerância para erros de ponto flutuante

    return NextResponse.json({
      planId: plan.id,
      currentAmount: plan.currentAmount,
      calculatedAmount,
      difference,
      isSynced,
      transactionCount: plan.transactions.length,
      needsSync: !isSynced,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar sincronização' },
      { status: 500 }
    )
  }
}



