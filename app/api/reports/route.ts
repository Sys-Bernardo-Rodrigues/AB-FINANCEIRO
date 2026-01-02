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
    const period = searchParams.get('period') || 'month' // month, quarter, year
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let startDate: Date
    let endDate: Date = new Date()

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Calcular período baseado no parâmetro
      switch (period) {
        case 'week':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'quarter':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case 'year':
          startDate = new Date()
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
      }
    }

    // Buscar transações no período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Agrupar por categoria (despesas)
    const expensesByCategory: Record<string, number> = {}
    const incomeByCategory: Record<string, number> = {}

    transactions.forEach((transaction) => {
      const categoryName = transaction.category.name
      if (transaction.type === 'EXPENSE') {
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + transaction.amount
      } else {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + transaction.amount
      }
    })

    // Agrupar por data (para gráfico de linha)
    const dailyData: Record<string, { income: number; expense: number; balance: number }> = {}
    
    transactions.forEach((transaction) => {
      const dateKey = transaction.date.toISOString().split('T')[0]
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { income: 0, expense: 0, balance: 0 }
      }
      if (transaction.type === 'INCOME') {
        dailyData[dateKey].income += transaction.amount
      } else {
        dailyData[dateKey].expense += transaction.amount
      }
    })

    // Calcular saldo acumulado por dia
    const sortedDates = Object.keys(dailyData).sort()
    let runningBalance = 0
    const balanceOverTime = sortedDates.map((date) => {
      const dayData = dailyData[date]
      runningBalance += dayData.income - dayData.expense
      dayData.balance = runningBalance
      return {
        date,
        ...dayData,
      }
    })

    // Agrupar por mês (para comparação mensal)
    const monthlyData: Record<string, { income: number; expense: number }> = {}
    
    transactions.forEach((transaction) => {
      const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 }
      }
      if (transaction.type === 'INCOME') {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expense += transaction.amount
      }
    })

    const monthlyComparison = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Top categorias de despesas
    const topExpenseCategories = Object.entries(expensesByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Top categorias de receitas
    const topIncomeCategories = Object.entries(incomeByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Resumo geral
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    await logToRedis('info', 'Relatório consultado', {
      userId: user.id,
      period,
      transactionCount: transactions.length,
    })

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: transactions.length,
      },
      balanceOverTime,
      monthlyComparison,
      expensesByCategory: topExpenseCategories,
      incomeByCategory: topIncomeCategories,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao gerar relatório', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

