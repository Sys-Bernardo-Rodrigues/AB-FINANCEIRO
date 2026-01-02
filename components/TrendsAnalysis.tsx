'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TrendsData {
  period: string
  averages: {
    dailyIncome: number
    dailyExpense: number
    monthlyIncome: number
    monthlyExpense: number
  }
  projections: {
    balance7Days: number
    balance30Days: number
  }
  categoryTrends: Array<{
    name: string
    current: number
    previous: number
    change: number
    changePercent: number
  }>
  anomalies: Array<{
    id: string
    description: string
    amount: number
    category: string
    date: string
    deviation: string
  }>
  yearlyComparison: {
    currentYear: {
      income: number
      expenses: number
      balance: number
    }
    lastYear: {
      income: number
      expenses: number
      balance: number
    }
    incomeChange: number
    expenseChange: number
  } | null
}

export default function TrendsAnalysis() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [period])

  const fetchTrends = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/trends?period=${period}`)
      if (response.ok) {
        const trendsData = await response.json()
        setData(trendsData)
      }
    } catch (error) {
      console.error('Erro ao buscar tendências:', error)
    } finally {
      setLoading(false)
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
        <div className="text-danger-600">Erro ao carregar análise de tendências</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Período de Análise</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
                period === p
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
              }`}
            >
              {p === 'week' && '7 dias'}
              {p === 'month' && '30 dias'}
              {p === 'quarter' && '3 meses'}
              {p === 'year' && '1 ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Médias e Projeções */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-sm font-semibold text-secondary-700 mb-3">Médias Diárias</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Receita:</span>
              <span className="font-semibold text-success-600">
                {formatCurrency(data.averages.dailyIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Despesa:</span>
              <span className="font-semibold text-danger-600">
                {formatCurrency(data.averages.dailyExpense)}
              </span>
            </div>
            <div className="pt-2 border-t border-secondary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary-700">Saldo Diário:</span>
                <span
                  className={`font-bold ${
                    data.averages.dailyIncome - data.averages.dailyExpense >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}
                >
                  {formatCurrency(data.averages.dailyIncome - data.averages.dailyExpense)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-sm font-semibold text-secondary-700 mb-3">Projeções de Saldo</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-secondary-600">Em 7 dias:</span>
                <span
                  className={`font-semibold ${
                    data.projections.balance7Days >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}
                >
                  {formatCurrency(data.projections.balance7Days)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-secondary-600">Em 30 dias:</span>
                <span
                  className={`font-semibold ${
                    data.projections.balance30Days >= 0
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}
                >
                  {formatCurrency(data.projections.balance30Days)}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-secondary-200">
              <p className="text-xs text-secondary-500">
                Baseado na média diária dos últimos 30 dias
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo Anual */}
      {data.yearlyComparison && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            Comparativo Anual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-3">Ano Atual</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Receitas:</span>
                  <span className="font-semibold text-success-600">
                    {formatCurrency(data.yearlyComparison.currentYear.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Despesas:</span>
                  <span className="font-semibold text-danger-600">
                    {formatCurrency(data.yearlyComparison.currentYear.expenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
                  <span className="text-sm font-semibold text-secondary-700">Saldo:</span>
                  <span
                    className={`font-bold ${
                      data.yearlyComparison.currentYear.balance >= 0
                        ? 'text-success-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {formatCurrency(data.yearlyComparison.currentYear.balance)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-3">Ano Anterior</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Receitas:</span>
                  <span className="font-semibold text-success-600">
                    {formatCurrency(data.yearlyComparison.lastYear.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Despesas:</span>
                  <span className="font-semibold text-danger-600">
                    {formatCurrency(data.yearlyComparison.lastYear.expenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
                  <span className="text-sm font-semibold text-secondary-700">Saldo:</span>
                  <span
                    className={`font-bold ${
                      data.yearlyComparison.lastYear.balance >= 0
                        ? 'text-success-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {formatCurrency(data.yearlyComparison.lastYear.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-secondary-200 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-secondary-600 mb-1">Variação de Receitas</div>
              <div className={`flex items-center gap-2 ${
                data.yearlyComparison.incomeChange >= 0
                  ? 'text-success-600'
                  : 'text-danger-600'
              }`}>
                {data.yearlyComparison.incomeChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {data.yearlyComparison.incomeChange >= 0 ? '+' : ''}
                  {data.yearlyComparison.incomeChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-secondary-600 mb-1">Variação de Despesas</div>
              <div className={`flex items-center gap-2 ${
                data.yearlyComparison.expenseChange <= 0
                  ? 'text-success-600'
                  : 'text-danger-600'
              }`}>
                {data.yearlyComparison.expenseChange <= 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {data.yearlyComparison.expenseChange >= 0 ? '+' : ''}
                  {data.yearlyComparison.expenseChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tendências por Categoria */}
      {data.categoryTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Tendências por Categoria
          </h3>
          <div className="space-y-3">
            {data.categoryTrends.slice(0, 10).map((trend) => (
              <div
                key={trend.name}
                className="p-3 bg-secondary-50 rounded-lg border border-secondary-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-secondary-900">{trend.name}</span>
                  <div className={`flex items-center gap-1 ${
                    trend.changePercent >= 0 ? 'text-danger-600' : 'text-success-600'
                  }`}>
                    {trend.changePercent >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {trend.changePercent >= 0 ? '+' : ''}
                      {trend.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-secondary-600">Atual: </span>
                    <span className="font-semibold text-secondary-900">
                      {formatCurrency(trend.current)}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Anterior: </span>
                    <span className="font-semibold text-secondary-900">
                      {formatCurrency(trend.previous)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalias Detectadas */}
      {data.anomalies.length > 0 && (
        <div className="bg-warning-50 rounded-xl border border-warning-200 shadow-card p-5">
          <h3 className="text-lg font-semibold text-warning-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            Gastos Atípicos Detectados
          </h3>
          <p className="text-sm text-warning-700 mb-4">
            Transações com valores significativamente acima da média (mais de 2 desvios padrão)
          </p>
          <div className="space-y-2">
            {data.anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="bg-white rounded-lg p-3 border border-warning-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 truncate">
                      {anomaly.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary-500 mt-1">
                      <span>{anomaly.category}</span>
                      <span>•</span>
                      <span>
                        {new Date(anomaly.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-warning-700">
                        {anomaly.deviation}σ acima da média
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="font-bold text-lg text-danger-600">
                      {formatCurrency(anomaly.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



