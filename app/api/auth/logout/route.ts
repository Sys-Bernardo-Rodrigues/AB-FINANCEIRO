import { NextRequest, NextResponse } from 'next/server'
import { logToRedis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    await logToRedis('info', 'Usuário fez logout')

    const response = NextResponse.json({ message: 'Logout realizado com sucesso' })

    // Remover cookie com as mesmas configurações usadas no login
    const isSecure = request.url.startsWith('https://') || process.env.FORCE_SECURE_COOKIES === 'true'
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/',
    })

    return response
  } catch (error) {
    await logToRedis('error', 'Erro ao fazer logout', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}

