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
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null

    // Buscar todas as categorias do usuário
    const where: any = { userId: user.id }
    if (type) {
      where.type = type
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        transactions: {
          where: {
            isScheduled: false,
          },
        },
      },
    })

    // Calcular insights para cada categoria
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const insights = await Promise.all(
      categories.map(async (category) => {
        const transactions = category.transactions

        if (transactions.length === 0) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            categoryType: category.type,
            totalAmount: 0,
            totalTransactions: 0,
            trend: 'NONE' as const,
            trendPercent: 0,
          }
        }

        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
        const recentTransactions = transactions.filter(
          (t) => t.date >= thirtyDaysAgo
        )
        const previousTransactions = transactions.filter(
          (t) => t.date >= sixtyDaysAgo && t.date < thirtyDaysAgo
        )

        const recentTotal = recentTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        )
        const previousTotal = previousTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        )

        let trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'NONE' = 'NONE'
        let trendPercent = 0

        if (previousTotal > 0) {
          trendPercent = ((recentTotal - previousTotal) / previousTotal) * 100
          if (trendPercent > 10) {
            trend = 'INCREASING'
          } else if (trendPercent < -10) {
            trend = 'DECREASING'
          } else {
            trend = 'STABLE'
          }
        } else if (recentTotal > 0) {
          trend = 'INCREASING'
          trendPercent = 100
        }

        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryType: category.type,
          totalAmount,
          totalTransactions: transactions.length,
          trend,
          trendPercent: Math.round(trendPercent * 10) / 10,
        }
      })
    )

    // Ordenar por total (maior primeiro)
    insights.sort((a, b) => b.totalAmount - a.totalAmount)

    await logToRedis('info', 'Insights de todas as categorias consultados', {
      userId: user.id,
      count: insights.length,
    })

    return NextResponse.json(insights)
  } catch (error) {
    await logToRedis('error', 'Erro ao calcular insights de categorias', {
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao calcular insights' },
      { status: 500 }
    )
  }
}





