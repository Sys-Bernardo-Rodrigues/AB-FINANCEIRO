import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

async function ensureConnection() {
  if (!redis.isOpen) {
    await redis.connect().catch((err) => {
      console.error('Erro ao conectar ao Redis:', err)
      throw err
    })
  }
}

export async function GET() {
  try {
    await ensureConnection()
    const logs = await redis.lRange('logs:recent', 0, 99)
    const parsedLogs = logs.map((log) => JSON.parse(log))
    
    return NextResponse.json(parsedLogs.reverse()) // Mais recentes primeiro
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar logs. Verifique se o Redis está rodando.' },
      { status: 500 }
    )
  }
}

