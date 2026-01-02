'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Calendar, Target, CreditCard } from 'lucide-react'
import TransactionList from './TransactionList'
import BalanceCard from './BalanceCard'
import InstallmentCard from './InstallmentCard'
import PlanCard from './PlanCard'
import Link from 'next/link'

interface DashboardData {
  balance: number
  income: number
  expenses: number
  recentTransactions: any[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [installments, setInstallments] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchInstallments()
    fetchPlans()
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
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4">
        <BalanceCard 
          title="Saldo Total"
          amount={data.balance}
          icon={data.balance < 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          type={data.balance < 0 ? "negative" : "balance"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      {/* Parcelamentos Ativos */}
      {installments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Parcelamentos Ativos
            </h2>
            <Link href="/installments" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {installments.map((installment) => (
              <InstallmentCard key={installment.id} installment={installment} />
            ))}
          </div>
        </div>
      )}

      {/* Planejamentos Ativos */}
      {plans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              Planejamentos
            </h2>
            <Link href="/plans" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Transações */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Transações Recentes
          </h2>
          <Link href="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
            Ver todas →
          </Link>
        </div>
        <TransactionList transactions={data.recentTransactions} />
      </div>
    </div>
  )
}
