'use client'

import { useState, useEffect } from 'react'
import { Trash2, Search, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string
  category: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
  }
}

export default function TransactionsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, filterType])

  const loadTransactions = async () => {
    try {
      // Buscar todas as transações (de todos os usuários)
      const response = await fetch('/api/transactions?limit=100&allUsers=true')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (err) {
      console.error('Erro ao carregar transações:', err)
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Filtrar por tipo
    if (filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.category.name.toLowerCase().includes(term) ||
        (t.user && t.user.name.toLowerCase().includes(term))
      )
    }

    // Ordenar por data (mais recente primeiro)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    setFilteredTransactions(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar transação')
      }

      setSuccess('Transação deletada com sucesso!')
      loadTransactions()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar transação')
      setTimeout(() => setError(''), 5000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-secondary-900">Gerenciar Transações</h2>
        <div className="text-sm text-secondary-600">
          Total: {filteredTransactions.length} transação(ões)
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, categoria ou usuário..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros de Tipo */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all ${
              filterType === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('INCOME')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all flex items-center gap-2 ${
              filterType === 'INCOME'
              ? 'bg-success-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Receitas
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap touch-manipulation transition-all flex items-center gap-2 ${
              filterType === 'EXPENSE'
              ? 'bg-danger-600 text-white'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Despesas
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="px-4 py-8 text-center text-secondary-500">
            {searchTerm || filterType !== 'ALL'
              ? 'Nenhuma transação encontrada com os filtros aplicados'
              : 'Nenhuma transação encontrada'}
          </div>
        ) : (
          <div className="divide-y divide-secondary-200 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="px-4 py-3 hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'INCOME'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-danger-100 text-danger-700'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-secondary-900 truncate">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-secondary-500 flex items-center gap-2 flex-wrap">
                        <span>{transaction.category.name}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.user && (
                          <>
                            <span>•</span>
                            <span>{transaction.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`text-right ${transaction.type === 'INCOME' ? 'text-success-700' : 'text-danger-700'}`}>
                      <div className="font-bold text-lg">
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                      title="Deletar transação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

