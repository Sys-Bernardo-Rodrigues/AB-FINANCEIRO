import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateFamilyGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
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

    const membership = await prisma.familyGroupMember.findFirst({
      where: {
        familyGroupId: params.id,
        userId: user.id,
      },
      include: {
        familyGroup: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Grupo não encontrado ou você não é membro' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: membership.familyGroup.id,
      name: membership.familyGroup.name,
      description: membership.familyGroup.description,
      createdBy: membership.familyGroup.createdBy,
      role: membership.role,
      members: membership.familyGroup.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: membership.familyGroup.createdAt,
      updatedAt: membership.familyGroup.updatedAt,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar grupo de família', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar grupo de família' },
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
        { error: 'Você não tem permissão para editar este grupo' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = updateFamilyGroupSchema.parse(body)

    const updatedGroup = await prisma.familyGroup.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    await logToRedis('info', 'Grupo de família atualizado', {
      groupId: params.id,
      userId: user.id,
    })

    return NextResponse.json({
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      createdBy: updatedGroup.createdBy,
      members: updatedGroup.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar grupo de família', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar grupo de família' },
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
        { error: 'Você não tem permissão para deletar este grupo' },
        { status: 403 }
      )
    }

    await prisma.familyGroup.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Grupo de família deletado', {
      groupId: params.id,
      userId: user.id,
    })

    return NextResponse.json({ message: 'Grupo deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar grupo de família', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar grupo de família' },
      { status: 500 }
    )
  }
}

