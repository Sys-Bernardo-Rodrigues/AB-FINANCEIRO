import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logToRedis } from '@/lib/redis'
import { notifyLowBalance, notifyUpcomingRecurring } from '@/lib/notifications'

// Endpoint para verificar e criar notificações automaticamente
// Pode ser chamado por um cron job ou manualmente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    // Buscar todos os usuários ativos
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    })

    let notificationsCreated = 0

    for (const user of users) {
      try {
        // 1. Verificar saldo negativo
        const transactions = await prisma.transaction.findMany({
          where: { userId: user.id },
        })

        const totalIncome = transactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0)

        const balance = totalIncome - totalExpenses

        if (balance < 0) {
          // Verificar se já existe notificação recente de saldo negativo
          const recentNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'DANGER',
              title: 'Saldo Baixo',
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Últimas 24 horas
              },
            },
          })

          if (!recentNotification) {
            await notifyLowBalance(user.id, balance)
            notificationsCreated++
          }
        }

        // 2. Verificar transações recorrentes próximas
        const upcomingRecurring = await prisma.recurringTransaction.findMany({
          where: {
            userId: user.id,
            isActive: true,
            nextDueDate: {
              gt: now,
              lte: threeDaysFromNow,
            },
          },
        })

        for (const recurring of upcomingRecurring) {
          // Verificar se já existe notificação recente
          const recentNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              relatedId: recurring.id,
              relatedType: 'recurring_transaction',
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Últimas 24 horas
              },
            },
          })

          if (!recentNotification) {
            await notifyUpcomingRecurring(
              user.id,
              recurring.description,
              recurring.nextDueDate
            )
            notificationsCreated++
          }
        }
      } catch (error) {
        await logToRedis('error', 'Erro ao verificar notificações para usuário', {
          userId: user.id,
          error: String(error),
        })
        // Continuar processando outros usuários mesmo se um falhar
      }
    }

    await logToRedis('info', 'Verificação automática de notificações concluída', {
      notificationsCreated,
      usersProcessed: users.length,
    })

    return NextResponse.json({
      success: true,
      message: 'Verificação concluída',
      notificationsCreated,
      usersProcessed: users.length,
    })
  } catch (error) {
    await logToRedis('error', 'Erro na verificação automática de notificações', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao verificar notificações' },
      { status: 500 }
    )
  }
}

// GET para verificar status (sem criar notificações)
export async function GET() {
  try {
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const users = await prisma.user.findMany({
      select: { id: true },
    })

    let usersWithNegativeBalance = 0
    let upcomingRecurringCount = 0

    for (const user of users) {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
      })

      const balance = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0) -
        transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0)

      if (balance < 0) {
        usersWithNegativeBalance++
      }

      const upcoming = await prisma.recurringTransaction.count({
        where: {
          userId: user.id,
          isActive: true,
          nextDueDate: {
            gt: now,
            lte: threeDaysFromNow,
          },
        },
      })

      upcomingRecurringCount += upcoming
    }

    return NextResponse.json({
      usersWithNegativeBalance,
      upcomingRecurringCount,
      totalUsers: users.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}




