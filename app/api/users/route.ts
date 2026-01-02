import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { hashPassword } from '@/lib/auth'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    await logToRedis('info', 'Usuários listados', {
      userId: user.id,
      count: users.length,
    })

    return NextResponse.json(users)
  } catch (error) {
    await logToRedis('error', 'Erro ao listar usuários', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
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
    const data = createUserSchema.parse(body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      await logToRedis('warn', 'Tentativa de criar usuário com email existente', {
        userId: user.id,
        email: data.email,
      })
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Criar usuário
    const hashedPassword = await hashPassword(data.password)
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Criar categorias padrão para o novo usuário
    const defaultCategories = [
      { name: 'Salário', description: 'Rendimento do trabalho', type: 'INCOME' },
      { name: 'Freelance', description: 'Trabalhos freelancer', type: 'INCOME' },
      { name: 'Alimentação', description: 'Gastos com comida', type: 'EXPENSE' },
      { name: 'Transporte', description: 'Gastos com transporte', type: 'EXPENSE' },
      { name: 'Utilidades', description: 'Contas de água, luz, internet', type: 'EXPENSE' },
      { name: 'Lazer', description: 'Gastos com entretenimento', type: 'EXPENSE' },
    ]

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: newUser.id,
      })),
    })

    await logToRedis('info', 'Usuário criado', {
      createdBy: user.id,
      newUserId: newUser.id,
      email: newUser.email,
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou ao criar usuário', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao criar usuário', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}

