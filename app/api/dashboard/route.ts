import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { notifyLowBalance, notifyHighExpense } from '@/lib/notifications'

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

    // Métricas avançadas
    const incomeTransactions = transactions.filter((t) => t.type === 'INCOME')
    const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE')
    
    // Maior receita e despesa
    const maxIncome = incomeTransactions.length > 0
      ? Math.max(...incomeTransactions.map((t) => t.amount))
      : 0
    const maxExpense = expenseTransactions.length > 0
      ? Math.max(...expenseTransactions.map((t) => t.amount))
      : 0

    // Taxa de poupança (se houver receitas)
    const savingsRate = totalIncome > 0
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0

    // Saldo médio (média dos últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTransactions30Days = transactions.filter(
      (t) => t.date >= thirtyDaysAgo
    )
    
    const dailyBalances: number[] = []
    const days = 30
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayTransactions = transactions.filter(
        (t) => t.date >= dayStart && t.date <= dayEnd
      )
      
      const dayIncome = dayTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const dayExpenses = dayTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      
      dailyBalances.push(dayIncome - dayExpenses)
    }
    
    const averageBalance = dailyBalances.length > 0
      ? dailyBalances.reduce((sum, b) => sum + b, 0) / dailyBalances.length
      : 0

    // Categoria mais usada
    const categoryCount: Record<string, number> = {}
    transactions.forEach((t) => {
      const catName = t.category.name
      categoryCount[catName] = (categoryCount[catName] || 0) + 1
    })
    
    const mostUsedCategory = Object.entries(categoryCount).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || 'Nenhuma'

    // Projeção de dias até saldo zero (baseado na média diária de despesas)
    const avgDailyExpense = expenseTransactions.length > 0
      ? totalExpenses / expenseTransactions.length
      : 0
    const daysUntilZero = avgDailyExpense > 0 && balance > 0
      ? Math.floor(balance / avgDailyExpense)
      : null

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
      // Métricas avançadas
      metrics: {
        maxIncome,
        maxExpense,
        savingsRate: Math.round(savingsRate * 100) / 100,
        averageBalance: Math.round(averageBalance * 100) / 100,
        mostUsedCategory,
        daysUntilZero,
        totalTransactions: transactions.length,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
      },
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
