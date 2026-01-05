'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Calendar, Clock, ArrowUpCircle, ArrowDownCircle, Check, X } from 'lucide-react'

interface ScheduledTransaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  scheduledDate: string
  date: string
  category: {
    id: string
    name: string
  }
}

export default function ScheduledTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    loadTransactions()
  }, [filter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const status = filter === 'pending' ? 'pending' : undefined
      const params = status ? `?status=${status}` : ''
      const data = await apiRequest<ScheduledTransaction[]>(
        `/transactions/scheduled${params}`
      )
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações agendadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmTransaction = async (id: string) => {
    try {
      await apiRequest(`/transactions/${id}/confirm`, {
        method: 'POST',
      })
      loadTransactions()
    } catch (error) {
      console.error('Erro ao confirmar transação:', error)
      alert('Erro ao confirmar transação')
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta transação agendada?'))
      return
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' })
      loadTransactions()
    } catch (error) {
      console.error('Erro ao cancelar transação:', error)
      alert('Erro ao cancelar transação')
    }
  }

  const pendingTransactions = transactions.filter(
    (t) => new Date(t.scheduledDate) >= new Date()
  )
  const pastTransactions = transactions.filter(
    (t) => new Date(t.scheduledDate) < new Date()
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Transações Agendadas
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie suas transações programadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'primary' : 'ghost'}
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {pendingTransactions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Pendentes</h2>
              <div className="space-y-3">
                {pendingTransactions.map((transaction) => {
                  const isPast = new Date(transaction.scheduledDate) < new Date()
                  return (
                    <Card
                      key={transaction.id}
                      className={`p-4 ${isPast ? 'border-warning-300 bg-warning-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              transaction.type === 'INCOME'
                                ? 'bg-success-100 text-success-600'
                                : 'bg-danger-100 text-danger-600'
                            }`}
                          >
                            {transaction.type === 'INCOME' ? (
                              <ArrowUpCircle className="w-6 h-6" />
                            ) : (
                              <ArrowDownCircle className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                              <span>{transaction.category.name}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(transaction.scheduledDate)}
                              </span>
                              {isPast && (
                                <span className="badge badge-warning text-xs">
                                  Atrasada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p
                            className={`text-lg font-bold ${
                              transaction.type === 'INCOME'
                                ? 'text-success-600'
                                : 'text-danger-600'
                            }`}
                          >
                            {transaction.type === 'INCOME' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmTransaction(transaction.id)}
                              className="p-2 rounded-lg hover:bg-success-50 transition-colors"
                              title="Confirmar"
                            >
                              <Check className="w-4 h-4 text-success-600" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4 text-danger-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {pastTransactions.length > 0 && filter === 'all' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Passadas</h2>
              <div className="space-y-3">
                {pastTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDate(transaction.scheduledDate)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <Card className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                Nenhuma transação agendada encontrada
              </p>
              <Button onClick={() => router.push('/transactions/new')}>
                Criar Transação Agendada
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}




