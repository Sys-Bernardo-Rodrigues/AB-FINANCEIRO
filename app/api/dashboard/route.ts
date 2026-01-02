import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'
import { notifyLowBalance } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Obter parâmetros de data (mês e ano) ou usar mês atual
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()

    // Calcular início e fim do mês
    const startOfMonth = new Date(year, month - 1, 1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date(year, month, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    // Buscar transações do mês atual (apenas confirmadas, não agendadas)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        isScheduled: false, // Apenas transações confirmadas
      },
      include: {
        category: true,
        receipts: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    // Verificar saldo negativo e criar notificação (apenas se não existir uma recente)
    if (balance < 0) {
      try {
        const recentNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: 'DANGER',
            title: 'Saldo Baixo',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
        })

        if (!recentNotification) {
          await notifyLowBalance(user.id, balance)
        }
      } catch (error) {
        // Não falhar o dashboard se a notificação falhar
        console.error('Erro ao criar notificação de saldo negativo:', error)
      }
    }

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

    // Calcular saldo médio diário do mês
    const daysInMonth = endOfMonth.getDate()
    const dailyBalances: number[] = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)
      
      const dayTransactions = transactions.filter(
        (t) => {
          const tDate = new Date(t.date)
          return tDate >= dayStart && tDate <= dayEnd
        }
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

    // Calcular média diária de receitas e despesas do mês
    const avgDailyIncome = totalIncome / daysInMonth
    const avgDailyExpense = totalExpenses / daysInMonth

    // Categoria mais usada
    const categoryCount: Record<string, number> = {}
    transactions.forEach((t) => {
      const catName = t.category.name
      categoryCount[catName] = (categoryCount[catName] || 0) + 1
    })
    
    const mostUsedCategory = Object.entries(categoryCount).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || 'Nenhuma'

    // Projeção de dias até saldo zero (baseado na média diária de despesas do mês)
    const daysUntilZero = avgDailyExpense > 0 && balance > 0
      ? Math.floor(balance / avgDailyExpense)
      : null

    // Calcular dias restantes no mês
    const today = new Date()
    const currentDay = today.getDate()
    const daysRemainingInMonth = daysInMonth - currentDay

    const recentTransactions = transactions.slice(0, 10)

    // Buscar dados do mês anterior para comparação
    const previousMonth = month === 1 ? 12 : month - 1
    const previousYear = month === 1 ? year - 1 : year
    const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1)
    const endOfPreviousMonth = new Date(previousYear, previousMonth, 0)
    endOfPreviousMonth.setHours(23, 59, 59, 999)

    const previousMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth,
        },
        isScheduled: false,
      },
    })

    const previousMonthIncome = previousMonthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const previousMonthExpenses = previousMonthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular variação percentual
    const incomeVariation = previousMonthIncome > 0
      ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100
      : 0
    
    const expenseVariation = previousMonthExpenses > 0
      ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
      : 0

    await logToRedis('info', 'Dashboard consultado', {
      userId: user.id,
      totalTransactions: transactions.length,
    })

    return NextResponse.json({
      balance,
      income: totalIncome,
      expenses: totalExpenses,
      recentTransactions,
      month,
      year,
      daysInMonth,
      daysRemainingInMonth,
      avgDailyIncome,
      avgDailyExpense,
      previousMonth: {
        income: previousMonthIncome,
        expenses: previousMonthExpenses,
      },
      variations: {
        income: Math.round(incomeVariation * 100) / 100,
        expense: Math.round(expenseVariation * 100) / 100,
      },
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
