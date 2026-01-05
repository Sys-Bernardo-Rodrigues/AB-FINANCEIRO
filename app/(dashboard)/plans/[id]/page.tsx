'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { ArrowLeft, Target, Calendar } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  progress: number
  remaining: number
  daysRemaining: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  category: {
    id: string
    name: string
  }
  transactions: Array<{
    id: string
    description: string
    amount: number
    date: string
  }>
}

export default function PlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
  }, [id])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Plan>(`/plans/${id}`)
      setPlan(data)
    } catch (error) {
      console.error('Erro ao carregar planejamento:', error)
      router.push('/plans')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800">{plan.name}</h1>
          <p className="text-slate-600 mt-1">Detalhes do planejamento</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white">
            <Target className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{plan.name}</h2>
            {plan.description && (
              <p className="text-slate-600 mt-1">{plan.description}</p>
            )}
            <p className="text-sm text-slate-500 mt-1">{plan.category.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-600">
              {plan.progress.toFixed(1)}%
            </p>
            <p className="text-sm text-slate-500">Concluído</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progresso</span>
            <span className="font-medium text-slate-800">
              {formatCurrency(plan.currentAmount)} de {formatCurrency(plan.targetAmount)}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div
              className="bg-gradient-primary h-4 rounded-full transition-all"
              style={{ width: `${Math.min(plan.progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-1">Meta</p>
            <p className="text-xl font-bold text-slate-800">
              {formatCurrency(plan.targetAmount)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-1">Gasto</p>
            <p className="text-xl font-bold text-slate-800">
              {formatCurrency(plan.currentAmount)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-1">Restante</p>
            <p className="text-xl font-bold text-slate-800">
              {formatCurrency(plan.remaining)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
          <div>
            <p className="text-sm text-slate-600 mb-1">Data de Início</p>
            <p className="font-medium text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(plan.startDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Data Final</p>
            <p className="font-medium text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(plan.endDate)}
            </p>
          </div>
          {plan.status === 'ACTIVE' && (
            <div className="col-span-2">
              <p className="text-sm text-slate-600 mb-1">Dias Restantes</p>
              <p className="font-medium text-slate-800">
                {plan.daysRemaining} dias
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Transações ({plan.transactions.length})
        </h2>
        {plan.transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Nenhuma transação vinculada a este planejamento
          </div>
        ) : (
          <div className="space-y-3">
            {plan.transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => router.push(`/transactions/${transaction.id}`)}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <p className="font-bold text-danger-600">
                  -{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}




