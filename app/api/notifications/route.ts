import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const notificationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['INFO', 'WARNING', 'DANGER', 'SUCCESS']).optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
  actionUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'UNREAD' | 'READ' | 'ARCHIVED' | null
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        status: 'UNREAD',
      },
    })

    await logToRedis('info', 'Notificações listadas', {
      userId: user.id,
      count: notifications.length,
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao listar notificações', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = notificationSchema.parse(body)

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        userId: user.id,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
      },
    })

    await logToRedis('info', 'Notificação criada', {
      userId: user.id,
      notificationId: notification.id,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar notificação', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar notificação', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    )
  }
}

