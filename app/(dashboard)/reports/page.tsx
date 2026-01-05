'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ReportData {
  summary: {
    totalIncome: number
    totalExpenses: number
    balance: number
    transactionCount: number
  }
  expensesByCategory: Array<{
    name: string
    amount: number
  }>
  incomeByCategory: Array<{
    name: string
    amount: number
  }>
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
}

const COLORS = ['#0ea5e9', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<ReportData>(
        `/reports?startDate=${startDate}&endDate=${endDate}`
      )
      setReport(data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Combinar despesas e receitas por categoria
  const totalAmount = report.summary.totalExpenses + report.summary.totalIncome
  const pieData = [
    ...report.expensesByCategory.map((item) => ({
      name: item.name,
      value: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
      type: 'EXPENSE' as const,
    })),
    ...report.incomeByCategory.map((item) => ({
      name: item.name,
      value: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
      type: 'INCOME' as const,
    })),
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-slate-600 mt-1">Análise detalhada das suas finanças</p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Data Inicial"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Data Final"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={loadReport} fullWidth>
              <TrendingUp className="w-5 h-5" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-slate-600 mb-2">Total de Receitas</p>
          <p className="text-3xl font-bold text-success-600">
            {formatCurrency(report.summary.totalIncome)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {report.summary.transactionCount} transações
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 mb-2">Total de Despesas</p>
          <p className="text-3xl font-bold text-danger-600">
            {formatCurrency(report.summary.totalExpenses)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 mb-2">Saldo</p>
          <p
            className={`text-3xl font-bold ${
              report.summary.balance >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}
          >
            {formatCurrency(report.summary.balance)}
          </p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Por Categoria
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(1)}%`
                  }
                  outerRadius={100}
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
                <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Saldo ao Longo do Tempo
          </h2>
          {report.balanceOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.balanceOverTime.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Receitas" />
                <Bar dataKey="expense" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Tabela de categorias */}
      <Card>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Detalhamento por Categoria
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-600 font-medium">
                  Categoria
                </th>
                <th className="text-right py-3 px-4 text-slate-600 font-medium">
                  Total
                </th>
                <th className="text-right py-3 px-4 text-slate-600 font-medium">
                  Percentual
                </th>
              </tr>
            </thead>
            <tbody>
              {pieData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    Nenhuma categoria encontrada no período selecionado
                  </td>
                </tr>
              ) : (
                pieData.map((item, index) => (
                  <tr
                    key={`${item.type}-${item.name}`}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div>
                          <span className="font-medium text-slate-800">
                            {item.name}
                          </span>
                          <span
                            className={`ml-2 badge badge-${
                              item.type === 'INCOME' ? 'success' : 'danger'
                            }`}
                          >
                            {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-800">
                      {formatCurrency(item.value)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-600">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

