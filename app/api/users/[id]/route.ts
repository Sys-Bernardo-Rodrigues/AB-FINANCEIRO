import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { hashPassword } from '@/lib/auth'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
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

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar usuário', {
      userId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
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
    const data = updateUserSchema.parse(body)

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Se está atualizando o email, verificar se já existe
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        )
      }
    }

    // Preparar dados de atualização
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logToRedis('info', 'Usuário atualizado', {
      updatedBy: user.id,
      targetUserId: params.id,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar usuário', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar usuário', {
      userId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
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

    // Não permitir deletar a si mesmo
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Usuário deletado', {
      deletedBy: user.id,
      deletedUserId: params.id,
    })

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar usuário', {
      userId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}

