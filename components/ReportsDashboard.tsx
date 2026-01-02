'use client'

import { useEffect, useState } from 'react'
import { Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ReportData {
  summary: {
    totalIncome: number
    totalExpenses: number
    balance: number
    transactionCount: number
  }
  balanceOverTime: Array<{
    date: string
    income: number
    expense: number
    balance: number
  }>
  monthlyComparison: Array<{
    month: string
    income: number
    expense: number
  }>
  expensesByCategory: Array<{
    name: string
    amount: number
  }>
  incomeByCategory: Array<{
    name: string
    amount: number
  }>
  period: {
    startDate: string
    endDate: string
  }
}

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface ReportsDashboardProps {
  onDateRangeChange?: (range: { startDate?: string; endDate?: string }) => void
}

export default function ReportsDashboard({ onDateRangeChange }: ReportsDashboardProps = {}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [period])

  useEffect(() => {
    if (onDateRangeChange && data) {
      onDateRangeChange({
        startDate: data.period.startDate,
        endDate: data.period.endDate,
      })
    }
  }, [data, onDateRangeChange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports?period=${period}`)
      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
        <div className="text-danger-600">Erro ao carregar relatório</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Período</h2>
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
        <div className="mt-3 text-sm text-secondary-600">
          {new Date(data.period.startDate).toLocaleDateString('pt-BR')} até{' '}
          {new Date(data.period.endDate).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-success-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success-600" />
            <span className="text-sm font-medium text-secondary-600">Total de Receitas</span>
          </div>
          <p className="text-2xl font-bold text-success-600">
            {formatCurrency(data.summary.totalIncome)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-danger-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-danger-600" />
            <span className="text-sm font-medium text-secondary-600">Total de Despesas</span>
          </div>
          <p className="text-2xl font-bold text-danger-600">
            {formatCurrency(data.summary.totalExpenses)}
          </p>
        </div>
        <div className={`bg-white rounded-xl border shadow-card p-5 ${
          data.summary.balance >= 0 ? 'border-success-200' : 'border-danger-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {data.summary.balance >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-danger-600" />
            )}
            <span className="text-sm font-medium text-secondary-600">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${
            data.summary.balance >= 0 ? 'text-success-600' : 'text-danger-600'
          }`}>
            {formatCurrency(data.summary.balance)}
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução do Saldo */}
      {data.balanceOverTime.length > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Evolução do Saldo
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.balanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => formatDate(label)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={2}
                name="Saldo"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Comparação Mensal */}
      {data.monthlyComparison.length > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Comparativo Mensal
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => formatMonth(label)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Receitas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráficos de Pizza - Despesas e Receitas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        {data.expensesByCategory.length > 0 && (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Despesas por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.expensesByCategory.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-secondary-700">{category.name}</span>
                  </div>
                  <span className="font-semibold text-secondary-900">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receitas por Categoria */}
        {data.incomeByCategory.length > 0 && (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Receitas por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.incomeByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.incomeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.incomeByCategory.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-secondary-700">{category.name}</span>
                  </div>
                  <span className="font-semibold text-secondary-900">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

