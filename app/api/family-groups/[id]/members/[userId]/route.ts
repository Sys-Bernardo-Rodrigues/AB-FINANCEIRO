import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin do grupo ou está removendo a si mesmo
    const membership = await prisma.familyGroupMember.findFirst({
      where: {
        familyGroupId: params.id,
        userId: user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Você não é membro deste grupo' },
        { status: 403 }
      )
    }

    // Verificar se é admin ou está removendo a si mesmo
    const isAdmin = membership.role === 'ADMIN'
    const isRemovingSelf = params.userId === user.id

    if (!isAdmin && !isRemovingSelf) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este membro' },
        { status: 403 }
      )
    }

    // Não permitir remover o último admin
    if (isAdmin && params.userId !== user.id) {
      const adminCount = await prisma.familyGroupMember.count({
        where: {
          familyGroupId: params.id,
          role: 'ADMIN',
        },
      })

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Não é possível remover o último administrador do grupo' },
          { status: 400 }
        )
      }
    }

    await prisma.familyGroupMember.deleteMany({
      where: {
        familyGroupId: params.id,
        userId: params.userId,
      },
    })

    await logToRedis('info', 'Membro removido do grupo de família', {
      groupId: params.id,
      removedUserId: params.userId,
      removedBy: user.id,
    })

    return NextResponse.json({ message: 'Membro removido com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao remover membro do grupo', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao remover membro' },
      { status: 500 }
    )
  }
}

