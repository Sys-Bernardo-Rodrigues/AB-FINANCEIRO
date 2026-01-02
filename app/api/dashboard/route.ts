import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        category: true,
      },
    })

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    const recentTransactions = transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)

    await logToRedis('info', 'Dashboard consultado', {
      userId: user.id,
      totalTransactions: transactions.length,
    })

    return NextResponse.json({
      balance,
      income: totalIncome,
      expenses: totalExpenses,
      recentTransactions,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar dados do dashboard', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}
