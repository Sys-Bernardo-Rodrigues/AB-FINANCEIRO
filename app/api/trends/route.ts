import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month' // week, month, quarter, year

    // Calcular período
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
        },
        isScheduled: false, // Apenas transações confirmadas
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Separar receitas e despesas
    const incomeTransactions = transactions.filter((t) => t.type === 'INCOME')
    const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE')

    // Calcular médias móveis (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTransactions = transactions.filter(
      (t) => t.date >= thirtyDaysAgo
    )
    
    const recentIncome = recentTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const recentExpenses = recentTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const avgDailyIncome = recentIncome / 30
    const avgDailyExpense = recentExpenses / 30

    // Calcular tendências por categoria
    const categoryTrends: Record<string, {
      name: string
      current: number
      previous: number
      change: number
      changePercent: number
    }> = {}

    // Período atual
    const currentPeriodStart = new Date(startDate)
    const currentPeriodEnd = new Date(now)
    const currentPeriodMid = new Date(
      (currentPeriodStart.getTime() + currentPeriodEnd.getTime()) / 2
    )

    // Período anterior (mesmo tamanho)
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setTime(
      previousPeriodStart.getTime() - (currentPeriodEnd.getTime() - currentPeriodStart.getTime())
    )
    const previousPeriodEnd = new Date(startDate)

    expenseTransactions.forEach((t) => {
      const catName = t.category.name
      if (!categoryTrends[catName]) {
        categoryTrends[catName] = {
          name: catName,
          current: 0,
          previous: 0,
          change: 0,
          changePercent: 0,
        }
      }

      if (t.date >= currentPeriodMid) {
        categoryTrends[catName].current += t.amount
      } else {
        categoryTrends[catName].previous += t.amount
      }
    })

    // Calcular mudanças percentuais
    Object.values(categoryTrends).forEach((trend) => {
      trend.change = trend.current - trend.previous
      trend.changePercent =
        trend.previous > 0
          ? ((trend.change / trend.previous) * 100)
          : trend.current > 0
          ? 100
          : 0
    })

    // Previsão de saldo (próximos 30 dias)
    const currentBalance = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) -
      expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    
    const projectedBalance30Days = currentBalance + (avgDailyIncome - avgDailyExpense) * 30
    const projectedBalance7Days = currentBalance + (avgDailyIncome - avgDailyExpense) * 7

    // Detectar anomalias (gastos acima de 2 desvios padrão)
    const expenseAmounts = expenseTransactions.map((t) => t.amount)
    const mean = expenseAmounts.reduce((sum, a) => sum + a, 0) / expenseAmounts.length
    const variance =
      expenseAmounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) /
      expenseAmounts.length
    const stdDev = Math.sqrt(variance)
    const threshold = mean + 2 * stdDev

    const anomalies = expenseTransactions
      .filter((t) => t.amount > threshold)
      .map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        category: t.category.name,
        date: t.date,
        deviation: ((t.amount - mean) / stdDev).toFixed(2),
      }))
      .slice(0, 5) // Top 5 anomalias

    // Comparativo anual (se período for ano)
    let yearlyComparison = null
    if (period === 'year') {
      const currentYear = now.getFullYear()
      const lastYear = currentYear - 1

      const currentYearTransactions = transactions.filter(
        (t) => new Date(t.date).getFullYear() === currentYear
      )
      const lastYearTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: new Date(`${lastYear}-01-01`),
            lt: new Date(`${currentYear}-01-01`),
          },
          isScheduled: false,
        },
      })

      const currentYearIncome = currentYearTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const currentYearExpenses = currentYearTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      const lastYearIncome = lastYearTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const lastYearExpenses = lastYearTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      yearlyComparison = {
        currentYear: {
          income: currentYearIncome,
          expenses: currentYearExpenses,
          balance: currentYearIncome - currentYearExpenses,
        },
        lastYear: {
          income: lastYearIncome,
          expenses: lastYearExpenses,
          balance: lastYearIncome - lastYearExpenses,
        },
        incomeChange: lastYearIncome > 0
          ? ((currentYearIncome - lastYearIncome) / lastYearIncome) * 100
          : 0,
        expenseChange: lastYearExpenses > 0
          ? ((currentYearExpenses - lastYearExpenses) / lastYearExpenses) * 100
          : 0,
      }
    }

    await logToRedis('info', 'Análise de tendências consultada', {
      userId: user.id,
      period,
    })

    return NextResponse.json({
      period,
      averages: {
        dailyIncome: avgDailyIncome,
        dailyExpense: avgDailyExpense,
        monthlyIncome: avgDailyIncome * 30,
        monthlyExpense: avgDailyExpense * 30,
      },
      projections: {
        balance7Days: projectedBalance7Days,
        balance30Days: projectedBalance30Days,
      },
      categoryTrends: Object.values(categoryTrends).sort(
        (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
      ),
      anomalies,
      yearlyComparison,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao calcular tendências', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao calcular tendências' },
      { status: 500 }
    )
  }
}




