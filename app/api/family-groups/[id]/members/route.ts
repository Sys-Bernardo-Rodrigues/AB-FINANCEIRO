import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const addMemberSchema = z.object({
  userEmail: z.string().email('Email inválido'),
})

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

    // Verificar se é admin do grupo
    const membership = await prisma.familyGroupMember.findFirst({
      where: {
        familyGroupId: params.id,
        userId: user.id,
        role: 'ADMIN',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar membros' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = addMemberSchema.parse(body)

    // Buscar usuário pelo email
    const userToAdd = await prisma.user.findUnique({
      where: { email: data.userEmail },
    })

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já é membro
    const existingMember = await prisma.familyGroupMember.findFirst({
      where: {
        familyGroupId: params.id,
        userId: userToAdd.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Usuário já é membro deste grupo' },
        { status: 400 }
      )
    }

    // Adicionar membro
    const newMember = await prisma.familyGroupMember.create({
      data: {
        familyGroupId: params.id,
        userId: userToAdd.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await logToRedis('info', 'Membro adicionado ao grupo de família', {
      groupId: params.id,
      userId: userToAdd.id,
      addedBy: user.id,
    })

    return NextResponse.json({
      id: newMember.id,
      userId: newMember.userId,
      userName: newMember.user.name,
      userEmail: newMember.user.email,
      role: newMember.role,
      joinedAt: newMember.joinedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao adicionar membro ao grupo', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao adicionar membro' },
      { status: 500 }
    )
  }
}

