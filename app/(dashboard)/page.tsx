'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MetricCard } from '@/components/ui/Card'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardData {
  balance: number
  income: number
  expenses: number
  recentTransactions: Transaction[]
  month: number
  year: number
  daysInMonth: number
  daysRemainingInMonth: number
  avgDailyIncome: number
  avgDailyExpense: number
  previousMonth: {
    income: number
    expenses: number
  }
  variations: {
    income: number
    expense: number
  }
  metrics: {
    maxIncome: number
    maxExpense: number
    savingsRate: number
    averageBalance: number
    mostUsedCategory: string
    daysUntilZero: number | null
    totalTransactions: number
    incomeCount: number
    expenseCount: number
  }
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    id: string
    name: string
  }
  date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadDashboard()
  }, [currentMonth, currentYear])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<DashboardData>(
        `/dashboard?month=${currentMonth}&year=${currentYear}`
      )
      setDashboard(data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const pieData = [
    { name: 'Receitas', value: dashboard.income },
    { name: 'Despesas', value: dashboard.expenses },
  ]

  const COLORS = ['#22c55e', '#ef4444']

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header com navegação de mês */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
            {monthNames[currentMonth - 1]} {currentYear}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {dashboard.daysRemainingInMonth} dias restantes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => changeMonth('prev')}
            className="p-2 min-w-[40px]"
            size="sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => changeMonth('next')}
            className="p-2 min-w-[40px]"
            size="sm"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <MetricCard
          title="Saldo"
          value={formatCurrency(dashboard.balance)}
          subtitle={`${dashboard.daysRemainingInMonth} dias restantes`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant={
            dashboard.balance >= 0 ? 'default' : 'danger'
          }
        />
        <MetricCard
          title="Receitas"
          value={formatCurrency(dashboard.income)}
          subtitle={`Média diária: ${formatCurrency(dashboard.avgDailyIncome)}`}
          icon={<ArrowUpCircle className="w-6 h-6" />}
          variant="success"
          trend={{
            value: dashboard.variations.income,
            isPositive: dashboard.variations.income >= 0,
          }}
        />
        <MetricCard
          title="Despesas"
          value={formatCurrency(dashboard.expenses)}
          subtitle={`Média diária: ${formatCurrency(dashboard.avgDailyExpense)}`}
          icon={<ArrowDownCircle className="w-6 h-6" />}
          variant="danger"
          trend={{
            value: dashboard.variations.expense,
            isPositive: dashboard.variations.expense <= 0,
          }}
        />
        <MetricCard
          title="Taxa de Economia"
          value={`${dashboard.metrics.savingsRate.toFixed(1)}%`}
          subtitle={`${dashboard.metrics.totalTransactions} transações`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="purple"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">
            Receitas vs Despesas
          </h2>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">Métricas</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Maior Receita</span>
              <span className="font-bold text-success-600">
                {formatCurrency(dashboard.metrics.maxIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Maior Despesa</span>
              <span className="font-bold text-danger-600">
                {formatCurrency(dashboard.metrics.maxExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Categoria Mais Usada</span>
              <span className="font-bold text-slate-800">
                {dashboard.metrics.mostUsedCategory || 'N/A'}
              </span>
            </div>
            {dashboard.metrics.daysUntilZero && (
              <div className="flex items-center justify-between p-4 bg-warning-50 rounded-xl border border-warning-200">
                <span className="text-warning-700">Dias até saldo zero</span>
                <span className="font-bold text-warning-700">
                  {dashboard.metrics.daysUntilZero} dias
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Transações recentes */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Transações Recentes</h2>
          <Button
            variant="ghost"
            onClick={() => router.push('/transactions')}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Ver todas
          </Button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {dashboard.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhuma transação encontrada
            </div>
          ) : (
            dashboard.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => router.push(`/transactions/${transaction.id}`)}
                className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'INCOME'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-danger-100 text-danger-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm sm:text-base truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {transaction.category.name} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p
                    className={`font-bold text-sm sm:text-base ${
                      transaction.type === 'INCOME'
                        ? 'text-success-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Botão flutuante para mobile */}
      <button
        onClick={() => router.push('/transactions/new')}
        className="fixed bottom-28 right-4 lg:hidden w-14 h-14 rounded-full bg-gradient-primary text-white shadow-xl hover:shadow-glow flex items-center justify-center transition-all active:scale-90 touch-manipulation z-30"
        aria-label="Nova Transação"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

