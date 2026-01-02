import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { notifyUpcomingRecurring } from '@/lib/notifications'

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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        isScheduled: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação agendada não encontrada' },
        { status: 404 }
      )
    }

    // Confirmar transação agendada: atualizar data e remover flag de agendada
    const confirmed = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        date: transaction.scheduledDate || new Date(),
        isScheduled: false,
        scheduledDate: null,
      },
      include: {
        category: true,
      },
    })

    await logToRedis('info', 'Transação agendada confirmada', {
      userId: user.id,
      transactionId: params.id,
    })

    return NextResponse.json(confirmed)
  } catch (error) {
    await logToRedis('error', 'Erro ao confirmar transação agendada', {
      transactionId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao confirmar transação agendada' },
      { status: 500 }
    )
  }
}

