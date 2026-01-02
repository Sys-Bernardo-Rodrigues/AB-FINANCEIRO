import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar categorias', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
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
    const data = categorySchema.parse(body)

    // Verificar se já existe uma categoria com o mesmo nome para este usuário
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: data.name,
        userId: user.id,
      },
    })

    if (existingCategory) {
      await logToRedis('warn', 'Tentativa de criar categoria duplicada', {
        userId: user.id,
        categoryName: data.name,
      })
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        userId: user.id,
      },
    })

    await logToRedis('info', 'Categoria criada', {
      userId: user.id,
      categoryId: category.id,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar categoria', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar categoria', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}
