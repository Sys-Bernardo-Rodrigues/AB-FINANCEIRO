'use client'

import { useEffect, useState } from 'react'
import { Calendar, Check, X, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface ScheduledTransaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  scheduledDate: string | Date
  category: Category
}

export default function ScheduledTransactionsList() {
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScheduledTransactions()
  }, [])

  const fetchScheduledTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transactions/scheduled?status=pending')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações agendadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}/confirm`, {
        method: 'POST',
      })

      if (response.ok) {
        // Remover da lista
        setTransactions(transactions.filter((t) => t.id !== id))
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao confirmar transação')
      }
    } catch (error) {
      console.error('Erro ao confirmar transação:', error)
      alert('Erro ao confirmar transação')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta transação agendada?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error('Erro ao cancelar transação:', error)
      alert('Erro ao cancelar transação')
    }
  }

  const isUpcoming = (date: string | Date) => {
    const scheduledDate = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    scheduledDate.setHours(0, 0, 0, 0)
    const diffTime = scheduledDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary-500">Carregando transações agendadas...</div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
        <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
        <p className="text-secondary-500 text-lg font-medium mb-2">
          Nenhuma transação agendada
        </p>
        <p className="text-secondary-400 text-sm">
          Transações agendadas aparecerão aqui quando você criar uma com data futura.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'INCOME'
        const upcoming = isUpcoming(transaction.scheduledDate)

        return (
          <div
            key={transaction.id}
            className={`bg-white rounded-xl p-4 border-2 transition-all ${
              upcoming
                ? 'border-warning-300 bg-warning-50'
                : 'border-secondary-200 hover:border-primary-300 hover:shadow-card-hover'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isIncome
                    ? 'bg-success-50 text-success-600'
                    : 'bg-danger-50 text-danger-600'
                }`}
              >
                {isIncome ? (
                  <ArrowUpCircle className="w-5 h-5" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-secondary-900 truncate">
                    {transaction.description}
                  </p>
                  {upcoming && (
                    <span className="px-2 py-0.5 bg-warning-200 text-warning-800 text-xs font-medium rounded-full flex-shrink-0">
                      Próxima
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-500">
                  <span>{transaction.category.name}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateShort(transaction.scheduledDate)}</span>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 text-right">
                <p
                  className={`font-bold text-lg ${
                    isIncome ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-secondary-200">
              <button
                onClick={() => handleConfirm(transaction.id)}
                className="flex-1 px-4 py-2 bg-success-600 text-white rounded-lg font-semibold hover:bg-success-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar
              </button>
              <button
                onClick={() => handleCancel(transaction.id)}
                className="px-4 py-2 bg-danger-50 text-danger-600 rounded-lg font-semibold hover:bg-danger-100 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}



