import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      await logToRedis('warn', 'Tentativa de registro com email existente', {
        email: data.email,
      })
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Criar usuário
    const hashedPassword = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Criar categorias padrão para o usuário
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
        userId: user.id,
      })),
    })

    // Gerar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    await logToRedis('info', 'Usuário registrado', {
      userId: user.id,
      email: user.email,
    })

    const response = NextResponse.json(
      { user, token },
      { status: 201 }
    )

    // Definir cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      await logToRedis('warn', 'Validação falhou no registro', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao registrar usuário', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}

