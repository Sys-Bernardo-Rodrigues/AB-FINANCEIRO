'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface CategoryInsight {
  categoryId: string
  categoryName: string
  categoryType: 'INCOME' | 'EXPENSE'
  totalAmount: number
  totalTransactions: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'NONE'
  trendPercent: number
}

export default function CategoryInsights() {
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>('ALL')
  const [insights, setInsights] = useState<CategoryInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [type])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const params = type !== 'ALL' ? `?type=${type}` : ''
      const response = await fetch(`/api/categories/insights${params}`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
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
        return <TrendingUp className="w-4 h-4" />
      case 'DECREASING':
        return <TrendingDown className="w-4 h-4" />
      case 'STABLE':
        return <Minus className="w-4 h-4" />
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

  if (insights.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
        <BarChart3 className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
        <p className="text-secondary-500 text-lg font-medium mb-2">
          Nenhuma categoria encontrada
        </p>
        <p className="text-secondary-400 text-sm">
          Crie categorias e adicione transações para ver insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Filtrar por Tipo</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
                type === t
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
              }`}
            >
              {t === 'ALL' && 'Todas'}
              {t === 'INCOME' && 'Receitas'}
              {t === 'EXPENSE' && 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.categoryId}
            className="bg-white rounded-xl border border-secondary-200 shadow-card hover:shadow-card-hover transition-all p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {insight.categoryName}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      insight.categoryType === 'INCOME'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}
                  >
                    {insight.categoryType === 'INCOME' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-secondary-600">
                  <span>
                    {insight.totalTransactions} transação
                    {insight.totalTransactions !== 1 ? 'ões' : ''}
                  </span>
                  <span>•</span>
                  <span>Total: {formatCurrency(insight.totalAmount)}</span>
                </div>
              </div>
              <Link
                href={`/categories/${insight.categoryId}/insights`}
                className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg font-semibold hover:bg-primary-100 transition-colors text-sm flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Ver Detalhes
              </Link>
            </div>

            {/* Tendência */}
            {insight.trend !== 'NONE' && (
              <div className="pt-4 border-t border-secondary-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Tendência (últimos 30 dias):</span>
                  <div
                    className={`flex items-center gap-1 font-semibold ${getTrendColor(
                      insight.trend,
                      insight.categoryType
                    )}`}
                  >
                    {getTrendIcon(insight.trend)}
                    <span>
                      {insight.trendPercent >= 0 ? '+' : ''}
                      {insight.trendPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}






