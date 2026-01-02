import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
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

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar categoria', {
      categoryId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar categoria' },
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
    const data = updateCategorySchema.parse(body)

    // Verificar se a categoria pertence ao usuário
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Se está atualizando o nome, verificar se já existe para este usuário
    if (data.name && data.name !== existingCategory.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: data.name,
          userId: user.id,
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type) updateData.type = data.type

    const category = await prisma.category.update({
      where: { id: params.id },
      data: updateData,
    })

    await logToRedis('info', 'Categoria atualizada', {
      userId: user.id,
      categoryId: category.id,
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao atualizar categoria', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao atualizar categoria', {
      categoryId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
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

    // Verificar se a categoria pertence ao usuário
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: true,
        installments: true,
        plans: true,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a categoria está em uso
    const hasTransactions = existingCategory.transactions.length > 0
    const hasInstallments = existingCategory.installments.length > 0
    const hasPlans = existingCategory.plans.length > 0

    if (hasTransactions || hasInstallments || hasPlans) {
      return NextResponse.json(
        { 
          error: 'Não é possível deletar esta categoria pois ela está sendo usada em transações, parcelamentos ou planejamentos' 
        },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    await logToRedis('info', 'Categoria deletada', {
      userId: user.id,
      categoryId: params.id,
    })

    return NextResponse.json({ message: 'Categoria deletada com sucesso' })
  } catch (error) {
    await logToRedis('error', 'Erro ao deletar categoria', {
      categoryId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao deletar categoria' },
      { status: 500 }
    )
  }
}

