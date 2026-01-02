import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

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

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(notification)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar notificação', {
      notificationId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar notificação' },
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
    const { status } = body

    const existing = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'READ' && !existing.readAt) {
        updateData.readAt = new Date()
      }
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: updateData,
    })

    await logToRedis('info', 'Notificação atualizada', {
      userId: user.id,
      notificationId: params.id,
    })

    return NextResponse.json(updated)
  } catch (error) {
    await logToRedis('error', 'Erro ao atualizar notificação', {
      notificationId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
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

    const existing = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    await prisma.notification.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Notificação deletada', {
      userId: user.id,
      notificationId: params.id,
    })

    return NextResponse.json({ message: 'Notificação deletada com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar notificação', {
      notificationId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar notificação' },
      { status: 500 }
    )
  }
}



