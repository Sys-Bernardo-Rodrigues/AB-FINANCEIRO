import { createClient } from 'redis'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Conectar ao Redis de forma assíncrona
let isConnecting = false
let connectionPromise: Promise<void> | null = null

async function ensureConnection() {
  if (redis.isOpen) return
  
  if (isConnecting && connectionPromise) {
    return connectionPromise
  }

  isConnecting = true
  connectionPromise = redis.connect().catch((err) => {
    console.error('Erro ao conectar ao Redis:', err)
    isConnecting = false
    connectionPromise = null
    throw err
  }).then(() => {
    isConnecting = false
    connectionPromise = null
  })

  return connectionPromise
}

export async function logToRedis(
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, any>
) {
  try {
    await ensureConnection()

    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    }

    const key = `logs:${level}:${Date.now()}`
    await redis.setEx(key, 86400 * 7, JSON.stringify(logEntry)) // 7 dias de retenção

    // Adicionar à lista de logs recentes
    await redis.lPush('logs:recent', JSON.stringify(logEntry))
    await redis.lTrim('logs:recent', 0, 99) // Manter apenas os 100 mais recentes
  } catch (error) {
    // Não quebrar a aplicação se o Redis falhar
    console.error('Erro ao salvar log no Redis:', error)
  }
}

