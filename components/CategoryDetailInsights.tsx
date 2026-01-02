'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, ArrowLeft, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CategoryDetailInsights {
  category: {
    id: string
    name: string
    type: 'INCOME' | 'EXPENSE'
    description?: string
  }
  insights: {
    totalTransactions: number
    totalAmount: number
    averageAmount: number
    maxAmount: number
    minAmount: number
    avgMonthlyFrequency: number
    trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'NONE'
    trendPercent: number
    isAboveAverage: boolean
    comparisonWithAverage: number
    recommendations: string[]
    recentPeriod: {
      total: number
      count: number
      average: number
    }
    previousPeriod: {
      total: number
      count: number
      average: number
    }
  }
}

interface CategoryDetailInsightsProps {
  categoryId: string
}

export default function CategoryDetailInsights({
  categoryId,
}: CategoryDetailInsightsProps) {
  const router = useRouter()
  const [data, setData] = useState<CategoryDetailInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [categoryId])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/categories/${categoryId}/insights`)
      if (response.ok) {
        const insightsData = await response.json()
        setData(insightsData)
      }
    } catch (error) {
      console.error('Erro ao buscar insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <TrendingUp className="w-5 h-5" />
      case 'DECREASING':
        return <TrendingDown className="w-5 h-5" />
      case 'STABLE':
        return <Minus className="w-5 h-5" />
      default:
        return null
    }
  }

  const getTrendColor = (trend: string, categoryType: string) => {
    if (trend === 'NONE') return 'text-secondary-500'
    
    if (categoryType === 'EXPENSE') {
      return trend === 'INCREASING' ? 'text-danger-600' : 'text-success-600'
    } else {
      return trend === 'INCREASING' ? 'text-success-600' : 'text-danger-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-danger-600">Erro ao carregar insights</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-secondary-900">
              {data.category.name}
            </h2>
            {data.category.description && (
              <p className="text-sm text-secondary-500">{data.category.description}</p>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.category.type === 'INCOME'
              ? 'bg-success-100 text-success-700'
              : 'bg-danger-100 text-danger-700'
          }`}
        >
          {data.category.type === 'INCOME' ? 'Receita' : 'Despesa'}
        </span>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="text-xs text-secondary-600 mb-1">Total</div>
          <div className="text-lg font-bold text-secondary-900">
            {formatCurrency(data.insights.totalAmount)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="text-xs text-secondary-600 mb-1">Média</div>
          <div className="text-lg font-bold text-secondary-900">
            {formatCurrency(data.insights.averageAmount)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="text-xs text-secondary-600 mb-1">Transações</div>
          <div className="text-lg font-bold text-secondary-900">
            {data.insights.totalTransactions}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="text-xs text-secondary-600 mb-1">Freq. Mensal</div>
          <div className="text-lg font-bold text-secondary-900">
            {data.insights.avgMonthlyFrequency.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Valores Extremos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-success-50 rounded-xl border border-success-200 shadow-card p-4">
          <div className="text-sm text-success-700 mb-1">Maior Transação</div>
          <div className="text-2xl font-bold text-success-600">
            {formatCurrency(data.insights.maxAmount)}
          </div>
        </div>
        <div className="bg-secondary-50 rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="text-sm text-secondary-700 mb-1">Menor Transação</div>
          <div className="text-2xl font-bold text-secondary-900">
            {formatCurrency(data.insights.minAmount)}
          </div>
        </div>
      </div>

      {/* Tendência */}
      {data.insights.trend !== 'NONE' && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Análise de Tendência
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <span className="text-sm text-secondary-700">Tendência (últimos 30 dias):</span>
              <div
                className={`flex items-center gap-2 font-semibold text-lg ${getTrendColor(
                  data.insights.trend,
                  data.category.type
                )}`}
              >
                {getTrendIcon(data.insights.trend)}
                <span>
                  {data.insights.trendPercent >= 0 ? '+' : ''}
                  {data.insights.trendPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                <div className="text-xs text-primary-700 mb-1">Período Recente (30 dias)</div>
                <div className="font-semibold text-primary-900">
                  {formatCurrency(data.insights.recentPeriod.total)}
                </div>
                <div className="text-xs text-primary-600 mt-1">
                  {data.insights.recentPeriod.count} transações
                </div>
              </div>
              <div className="p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                <div className="text-xs text-secondary-700 mb-1">Período Anterior (30 dias)</div>
                <div className="font-semibold text-secondary-900">
                  {formatCurrency(data.insights.previousPeriod.total)}
                </div>
                <div className="text-xs text-secondary-600 mt-1">
                  {data.insights.previousPeriod.count} transações
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparação com Média */}
      {data.insights.comparisonWithAverage !== 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Comparação com Outras Categorias
          </h3>
          <div className="p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-700">
                Comparado à média de outras categorias de {data.category.type === 'INCOME' ? 'receitas' : 'despesas'}:
              </span>
              <span
                className={`font-semibold text-lg ${
                  data.insights.isAboveAverage
                    ? data.category.type === 'EXPENSE'
                      ? 'text-danger-600'
                      : 'text-success-600'
                    : 'text-secondary-600'
                }`}
              >
                {data.insights.comparisonWithAverage >= 0 ? '+' : ''}
                {data.insights.comparisonWithAverage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recomendações */}
      {data.insights.recommendations.length > 0 && (
        <div className="bg-primary-50 rounded-xl border border-primary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary-600" />
            Recomendações e Insights
          </h3>
          <div className="space-y-3">
            {data.insights.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-primary-200"
              >
                <AlertTriangle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-secondary-900 flex-1">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}






