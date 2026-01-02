import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { logToRedis } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar categoria
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Buscar todas as transações desta categoria
    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: params.id,
        userId: user.id,
        isScheduled: false,
      },
      orderBy: {
        date: 'desc',
      },
    })

    if (transactions.length === 0) {
      return NextResponse.json({
        category: {
          id: category.id,
          name: category.name,
          type: category.type,
        },
        insights: {
          totalTransactions: 0,
          totalAmount: 0,
          averageAmount: 0,
          trend: 'NONE',
          trendPercent: 0,
          recommendations: [
            'Esta categoria ainda não possui transações. Comece a registrar suas movimentações!',
          ],
        },
      })
    }

    // Calcular totais
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    const averageAmount = totalAmount / transactions.length

    // Calcular tendência (comparar últimos 30 dias com período anterior)
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

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

    // Calcular maior e menor transação
    const amounts = transactions.map((t) => t.amount)
    const maxAmount = Math.max(...amounts)
    const minAmount = Math.min(...amounts)

    // Calcular frequência mensal média
    const firstTransaction = transactions[transactions.length - 1]
    const lastTransaction = transactions[0]
    const daysDiff =
      (lastTransaction.date.getTime() - firstTransaction.date.getTime()) /
      (1000 * 60 * 60 * 24)
    const monthsDiff = daysDiff / 30
    const avgMonthlyFrequency =
      monthsDiff > 0 ? transactions.length / monthsDiff : transactions.length

    // Comparar com outras categorias do mesmo tipo
    const allCategories = await prisma.category.findMany({
      where: {
        userId: user.id,
        type: category.type,
      },
    })

    const categoryComparisons = await Promise.all(
      allCategories.map(async (cat) => {
        if (cat.id === params.id) return null

        const catTransactions = await prisma.transaction.findMany({
          where: {
            categoryId: cat.id,
            userId: user.id,
            isScheduled: false,
          },
        })

        const catTotal = catTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        )

        return {
          id: cat.id,
          name: cat.name,
          total: catTotal,
          count: catTransactions.length,
        }
      })
    )

    const validComparisons = categoryComparisons.filter(
      (c) => c !== null
    ) as Array<{
      id: string
      name: string
      total: number
      count: number
    }>

    const avgCategoryTotal =
      validComparisons.length > 0
        ? validComparisons.reduce((sum, c) => sum + c.total, 0) /
          validComparisons.length
        : 0

    const isAboveAverage = totalAmount > avgCategoryTotal

    // Gerar recomendações
    const recommendations: string[] = []

    if (category.type === 'EXPENSE') {
      if (trend === 'INCREASING' && trendPercent > 20) {
        recommendations.push(
          `⚠️ Atenção: Seus gastos em ${category.name} aumentaram ${trendPercent.toFixed(1)}% nos últimos 30 dias. Considere revisar seus hábitos de consumo.`
        )
      }

      if (isAboveAverage && avgCategoryTotal > 0) {
        const percentAbove =
          ((totalAmount - avgCategoryTotal) / avgCategoryTotal) * 100
        if (percentAbove > 30) {
          recommendations.push(
            `💡 Você gasta ${percentAbove.toFixed(1)}% acima da média em ${category.name} comparado a outras categorias de despesas.`
          )
        }
      }

      if (avgMonthlyFrequency > 15) {
        recommendations.push(
          `📊 Você usa esta categoria com frequência (${avgMonthlyFrequency.toFixed(1)} vezes por mês). Considere criar uma transação recorrente para facilitar.`
        )
      }

      if (totalAmount > averageAmount * 3) {
        recommendations.push(
          `🎯 Sua maior transação nesta categoria foi ${((maxAmount / averageAmount) * 100).toFixed(0)}% acima da média. Revise se há oportunidades de economia.`
        )
      }
    } else {
      if (trend === 'DECREASING' && trendPercent < -20) {
        recommendations.push(
          `⚠️ Suas receitas em ${category.name} diminuíram ${Math.abs(trendPercent).toFixed(1)}% nos últimos 30 dias.`
        )
      }

      if (isAboveAverage && avgCategoryTotal > 0) {
        recommendations.push(
          `✅ Excelente! Suas receitas em ${category.name} estão acima da média de outras categorias de receitas.`
        )
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `📈 Continue monitorando esta categoria para identificar padrões e oportunidades de melhoria.`
      )
    }

    await logToRedis('info', 'Insights de categoria consultados', {
      userId: user.id,
      categoryId: params.id,
    })

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description,
      },
      insights: {
        totalTransactions: transactions.length,
        totalAmount,
        averageAmount,
        maxAmount,
        minAmount,
        avgMonthlyFrequency: Math.round(avgMonthlyFrequency * 10) / 10,
        trend,
        trendPercent: Math.round(trendPercent * 10) / 10,
        isAboveAverage,
        comparisonWithAverage: avgCategoryTotal > 0
          ? ((totalAmount - avgCategoryTotal) / avgCategoryTotal) * 100
          : 0,
        recommendations,
        recentPeriod: {
          total: recentTotal,
          count: recentTransactions.length,
          average: recentTransactions.length > 0
            ? recentTotal / recentTransactions.length
            : 0,
        },
        previousPeriod: {
          total: previousTotal,
          count: previousTransactions.length,
          average: previousTransactions.length > 0
            ? previousTotal / previousTransactions.length
            : 0,
        },
      },
    })
  } catch (error) {
    await logToRedis('error', 'Erro ao calcular insights de categoria', {
      categoryId: params.id,
      error: String(error),
    })
    return NextResponse.json(
      { error: 'Erro ao calcular insights' },
      { status: 500 }
    )
  }
}




