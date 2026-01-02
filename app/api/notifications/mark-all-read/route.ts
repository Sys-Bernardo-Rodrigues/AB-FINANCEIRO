import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })

    await logToRedis('info', 'Todas as notificações marcadas como lidas', {
      userId: user.id,
      count: result.count,
    })

    return NextResponse.json({
      message: `${result.count} notificações marcadas como lidas`,
      count: result.count,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao marcar notificações como lidas', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao marcar notificações como lidas' },
      { status: 500 }
    )
  }
}



