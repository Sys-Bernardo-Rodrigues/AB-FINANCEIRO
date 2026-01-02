'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Calendar, Target, CreditCard, Repeat, BarChart3, PiggyBank, CalendarDays } from 'lucide-react'
import TransactionList from './TransactionList'
import BalanceCard from './BalanceCard'
import InstallmentCard from './InstallmentCard'
import PlanCard from './PlanCard'
import RecurringTransactionCard from './RecurringTransactionCard'
import SavingsGoalCard from './SavingsGoalCard'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  balance: number
  income: number
  expenses: number
  recentTransactions: any[]
  metrics?: {
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [installments, setInstallments] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([])
  const [savingsGoals, setSavingsGoals] = useState<any[]>([])
  const [scheduledTransactions, setScheduledTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      fetchDashboardData()
      fetchInstallments()
      fetchPlans()
      fetchRecurringTransactions()
      fetchSavingsGoals()
      fetchScheduledTransactions()
    }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstallments = async () => {
    try {
      const response = await fetch('/api/installments?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setInstallments(data.slice(0, 3))
      }
    } catch (error) {
      console.error('Erro ao buscar parcelamentos:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.slice(0, 3))
      }
    } catch (error) {
      console.error('Erro ao buscar planejamentos:', error)
    }
  }

  const fetchRecurringTransactions = async () => {
    try {
      const response = await fetch('/api/recurring-transactions?isActive=true')
      if (response.ok) {
        const data = await response.json()
        // Ordenar por próxima data de vencimento e pegar as 3 mais próximas
        const sorted = data.sort((a: any, b: any) => 
          new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        )
        setRecurringTransactions(sorted.slice(0, 3))
      }
    } catch (error) {
      console.error('Erro ao buscar transações recorrentes:', error)
    }
  }

  const fetchSavingsGoals = async () => {
    try {
      const response = await fetch('/api/savings-goals?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        // Ordenar por progresso e pegar as 3 mais próximas de completar
        const sorted = data.sort((a: any, b: any) => b.progress - a.progress)
        setSavingsGoals(sorted.slice(0, 3))
      }
    } catch (error) {
      console.error('Erro ao buscar metas de economia:', error)
    }
  }

  const fetchScheduledTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/scheduled?status=PENDING&limit=3')
      if (response.ok) {
        const data = await response.json()
        setScheduledTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações agendadas:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-danger-600">Erro ao carregar dados</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <BalanceCard 
          title="Saldo Total"
          amount={data.balance}
          icon={data.balance < 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          type={data.balance < 0 ? "negative" : "balance"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <BalanceCard 
          title="Receitas"
          amount={data.income}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          type="income"
        />
        <BalanceCard 
          title="Despesas"
          amount={data.expenses}
          icon={<ArrowDownCircle className="w-5 h-5" />}
          type="expense"
        />
      </div>

      {/* Transações Agendadas Próximas */}
      {scheduledTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Transações Agendadas
            </h2>
            <Link href="/scheduled" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {scheduledTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl p-4 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-secondary-500 mt-1">
                      <span>{transaction.category.name}</span>
                      <span>•</span>
                      <span>{formatDateShort(transaction.scheduledDate)}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === 'INCOME'
                          ? 'text-success-600'
                          : 'text-danger-600'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transações Recorrentes Próximas */}
      {recurringTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary-600" />
              Próximas Recorrentes
            </h2>
            <Link href="/recurring" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recurringTransactions.map((transaction) => (
              <RecurringTransactionCard key={transaction.id} recurringTransaction={transaction} />
            ))}
          </div>
        </div>
      )}

      {/* Metas de Economia Ativas */}
      {savingsGoals.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              Metas de Economia
            </h2>
            <Link href="/savings-goals" className="text-sm sm:text-base text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {savingsGoals.map((goal) => (
              <SavingsGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Parcelamentos Ativos */}
      {installments.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              Parcelamentos Ativos
            </h2>
            <Link href="/installments" className="text-sm sm:text-base text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {installments.map((installment) => (
              <InstallmentCard key={installment.id} installment={installment} />
            ))}
          </div>
        </div>
      )}

      {/* Planejamentos Ativos */}
      {plans.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-secondary-900 flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              Planejamentos
            </h2>
            <Link href="/plans" className="text-sm sm:text-base text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Métricas Avançadas */}
      {data.metrics && (
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            Métricas e Insights
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-secondary-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Taxa de Poupança</div>
              <div className={`text-xl font-bold ${data.metrics.savingsRate >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {data.metrics.savingsRate >= 0 ? '+' : ''}{data.metrics.savingsRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Saldo Médio</div>
              <div className="text-xl font-bold text-secondary-900">
                {formatCurrency(data.metrics.averageBalance)}
              </div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Maior Receita</div>
              <div className="text-xl font-bold text-success-600">
                {formatCurrency(data.metrics.maxIncome)}
              </div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-xl">
              <div className="text-xs text-secondary-600 mb-1">Maior Despesa</div>
              <div className="text-xl font-bold text-danger-600">
                {formatCurrency(data.metrics.maxExpense)}
              </div>
            </div>
          </div>
          {data.metrics.daysUntilZero !== null && data.metrics.daysUntilZero > 0 && (
            <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-warning-800">Projeção de Saldo</div>
                  <div className="text-xs text-warning-600">
                    Baseado na média diária de despesas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-warning-700">
                    {data.metrics.daysUntilZero}
                  </div>
                  <div className="text-xs text-warning-600">dias restantes</div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Categoria mais usada: </span>
                <span className="font-semibold text-secondary-900">{data.metrics.mostUsedCategory}</span>
              </div>
              <div>
                <span className="text-secondary-600">Total de transações: </span>
                <span className="font-semibold text-secondary-900">{data.metrics.totalTransactions}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/calendar"
          className="gradient-primary rounded-3xl p-6 sm:p-8 text-white shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group"
        >
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Calendário Financeiro</h3>
          </div>
          <p className="text-sm text-white/90">
            Visualize suas transações em formato de calendário
          </p>
        </Link>
        <Link
          href="/reports"
          className="gradient-primary rounded-3xl p-6 sm:p-8 text-white shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Relatórios</h3>
          </div>
          <p className="text-sm text-white/90">
            Gráficos e análises detalhadas das suas finanças
          </p>
        </Link>
        <Link
          href="/trends"
          className="gradient-success rounded-3xl p-6 sm:p-8 text-white shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift group"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Tendências</h3>
          </div>
          <p className="text-sm text-white/90">
            Análise de tendências e previsões financeiras
          </p>
        </Link>
      </div>

      {/* Lista de Transações */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-secondary-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            Transações Recentes
          </h2>
          <Link href="/transactions" className="text-sm sm:text-base text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
            Ver todas →
          </Link>
        </div>
        <TransactionList transactions={data.recentTransactions} />
      </div>
    </div>
  )
}
