import { NextResponse } from 'next/server'
import { logToRedis } from '@/lib/redis'

export async function POST() {
  try {
    await logToRedis('info', 'Usuário fez logout')

    const response = NextResponse.json({ message: 'Logout realizado com sucesso' })

    // Remover cookie
    response.cookies.delete('token')

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

