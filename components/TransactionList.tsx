'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string | Date
  category: Category
}

interface TransactionListProps {
  transactions?: Transaction[]
}

export default function TransactionList({ transactions: propTransactions }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(!propTransactions)

  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions)
      setLoading(false)
    } else {
      fetchTransactions()
    }
  }, [propTransactions])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?limit=50')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-secondary-500">Carregando transações...</div>
      </div>
    )
  }

      if (transactions.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
            <div className="text-secondary-500 mb-2">Nenhuma transação encontrada</div>
            <div className="text-sm text-secondary-400">Tente ajustar os filtros de busca</div>
          </div>
        )
      }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'INCOME'
        return (
          <div
            key={transaction.id}
            className="bg-white rounded-xl p-4 border border-secondary-200 hover:border-primary-300 hover:shadow-card-hover transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                <p className="font-semibold text-secondary-900 truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-secondary-500">
                  <span>{transaction.category.name}</span>
                  <span>•</span>
                  <span>{formatDateShort(transaction.date)}</span>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <p
                className={`font-bold text-lg ${
                  isIncome 
                    ? 'text-success-600' 
                    : 'text-danger-600'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
