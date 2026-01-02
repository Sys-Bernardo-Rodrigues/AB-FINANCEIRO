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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Calcular início e fim do mês
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Buscar transações do mês
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

    // Agrupar transações por dia
    const transactionsByDay: Record<string, any[]> = {}
    
    transactions.forEach((transaction) => {
      const dateKey = transaction.date.toISOString().split('T')[0]
      if (!transactionsByDay[dateKey]) {
        transactionsByDay[dateKey] = []
      }
      transactionsByDay[dateKey].push(transaction)
    })

    // Calcular totais por dia
    const dailyTotals: Record<string, { income: number; expense: number; balance: number }> = {}
    
    Object.entries(transactionsByDay).forEach(([date, dayTransactions]) => {
      const income = dayTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = dayTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)
      
      dailyTotals[date] = {
        income,
        expense,
        balance: income - expense,
      }
    })

    await logToRedis('info', 'Calendário financeiro consultado', {
      userId: user.id,
      year,
      month,
      transactionCount: transactions.length,
    })

    return NextResponse.json({
      year,
      month,
      transactionsByDay,
      dailyTotals,
      totalTransactions: transactions.length,
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao buscar calendário financeiro', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao buscar calendário financeiro' },
      { status: 500 }
    )
  }
}

