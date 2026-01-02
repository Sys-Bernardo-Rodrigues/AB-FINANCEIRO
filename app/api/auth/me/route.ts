import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { logToRedis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    await logToRedis('error', 'Erro ao verificar autenticação', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
}

