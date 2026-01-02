'use client'

import { useEffect, useState } from 'react'
import { Repeat, Plus } from 'lucide-react'
import RecurringTransactionCard from './RecurringTransactionCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RecurringTransactionsList() {
  const router = useRouter()
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  useEffect(() => {
    fetchRecurringTransactions()
  }, [filter])

  const fetchRecurringTransactions = async () => {
    try {
      setLoading(true)
      const isActive = filter === 'ALL' ? null : filter === 'ACTIVE'
      const url = isActive !== null 
        ? `/api/recurring-transactions?isActive=${isActive}`
        : '/api/recurring-transactions'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRecurringTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar transações recorrentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async (id: string) => {
    try {
      const response = await fetch(`/api/recurring-transactions/${id}/execute`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchRecurringTransactions()
        router.refresh()
      }
    } catch (error) {
      console.error('Erro ao executar transação recorrente:', error)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const transaction = recurringTransactions.find(t => t.id === id)
      if (!transaction) return

      const response = await fetch(`/api/recurring-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !transaction.isActive }),
      })
      if (response.ok) {
        fetchRecurringTransactions()
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transação recorrente?')) {
      return
    }

    try {
      const response = await fetch(`/api/recurring-transactions/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchRecurringTransactions()
      }
    } catch (error) {
      console.error('Erro ao deletar transação recorrente:', error)
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'ALL'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'ACTIVE'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Ativas
        </button>
        <button
          onClick={() => setFilter('INACTIVE')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'INACTIVE'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Inativas
        </button>
      </div>

      {/* Botão Adicionar */}
      <Link
        href="/add?type=recurring"
        className="flex items-center justify-center gap-2 w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Nova Transação Recorrente
      </Link>

      {/* Lista */}
      {recurringTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <Repeat className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhuma transação recorrente encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((transaction) => (
            <RecurringTransactionCard
              key={transaction.id}
              recurringTransaction={transaction}
              onExecute={handleExecute}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

