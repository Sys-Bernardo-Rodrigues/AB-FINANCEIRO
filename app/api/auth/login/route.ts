import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { logToRedis } from '@/lib/redis'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      await logToRedis('warn', 'Tentativa de login com email inexistente', {
        email: data.email,
      })
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(data.password, user.password)
    if (!isValidPassword) {
      await logToRedis('warn', 'Tentativa de login com senha incorreta', {
        email: data.email,
      })
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Gerar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    await logToRedis('info', 'Usuário fez login', {
      userId: user.id,
      email: user.email,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    })

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
      await logToRedis('warn', 'Validação falhou no login', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    await logToRedis('error', 'Erro ao fazer login', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}

