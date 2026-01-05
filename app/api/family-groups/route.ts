import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const familyGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
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

    // Buscar grupos onde o usuário é membro
    const memberships = await prisma.familyGroupMember.findMany({
      where: { userId: user.id },
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

    const groups = memberships.map((membership) => ({
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
    }))

    return NextResponse.json(groups)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar grupos de família', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar grupos de família' },
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
    const data = familyGroupSchema.parse(body)

    // Criar grupo e adicionar criador como admin
    const familyGroup = await prisma.familyGroup.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
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

    await logToRedis('info', 'Grupo de família criado', {
      groupId: familyGroup.id,
      userId: user.id,
    })

    return NextResponse.json({
      id: familyGroup.id,
      name: familyGroup.name,
      description: familyGroup.description,
      createdBy: familyGroup.createdBy,
      role: 'ADMIN',
      members: familyGroup.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: familyGroup.createdAt,
      updatedAt: familyGroup.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar grupo de família', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar grupo de família', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar grupo de família' },
      { status: 500 }
    )
  }
}


