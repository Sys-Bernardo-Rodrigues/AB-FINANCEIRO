'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    id: string
    name: string
  }
  date: string
  isScheduled: boolean
  creditCardId?: string
}

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>(
    'ALL'
  )
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadTransactions()
    loadCategories()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [search, typeFilter, categoryFilter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      if (categoryFilter !== 'ALL') params.append('categoryId', categoryFilter)
      params.append('limit', '100')

      const data = await apiRequest<Transaction[]>(
        `/transactions?${params.toString()}`
      )
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await apiRequest<Category[]>('/categories')
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' })
      loadTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  const filteredCategories = categories.filter(
    (cat) => typeFilter === 'ALL' || cat.type === typeFilter
  )

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Transações</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''} encontrada{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => router.push('/transactions/new')}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-600 mb-1">Total de Receitas</p>
          <p className="text-lg sm:text-2xl font-bold text-success-600 truncate">
            {formatCurrency(totalIncome)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-600 mb-1">Total de Despesas</p>
          <p className="text-lg sm:text-2xl font-bold text-danger-600 truncate">
            {formatCurrency(totalExpenses)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-600 mb-1">Saldo</p>
          <p
            className={`text-lg sm:text-2xl font-bold truncate ${
              totalIncome - totalExpenses >= 0
                ? 'text-success-600'
                : 'text-danger-600'
            }`}
          >
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              size="sm"
              className="min-w-[44px]"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200">
              <Select
                label="Tipo"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')
                }
                options={[
                  { value: 'ALL', label: 'Todos' },
                  { value: 'INCOME', label: 'Receitas' },
                  { value: 'EXPENSE', label: 'Despesas' },
                ]}
              />
              <Select
                label="Categoria"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Todas' },
                  ...filteredCategories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Lista de transações */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500 mb-4">Nenhuma transação encontrada</p>
          <Button onClick={() => router.push('/transactions/new')}>
            <Plus className="w-5 h-5" />
            Criar Primeira Transação
          </Button>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {transactions.map((transaction) => (
            <Card
              key={transaction.id}
              hover
              onClick={() => router.push(`/transactions/${transaction.id}`)}
              className="p-3 sm:p-4 touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'INCOME'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-danger-100 text-danger-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? (
                      <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm sm:text-base truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                      <span className="text-xs sm:text-sm text-slate-500 truncate">
                        {transaction.category.name}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">{formatDate(transaction.date)}</span>
                        <span className="sm:hidden">{formatDate(transaction.date).split('/')[0]}/{formatDate(transaction.date).split('/')[1]}</span>
                      </span>
                      {transaction.isScheduled && (
                        <>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="badge badge-warning text-xs">
                            Agendada
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <p
                    className={`text-base sm:text-lg font-bold ${
                      transaction.type === 'INCOME'
                        ? 'text-success-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    <span className="hidden sm:inline">{formatCurrency(transaction.amount)}</span>
                    <span className="sm:hidden">{formatCurrency(transaction.amount).replace('R$', 'R$ ').split(',')[0]}</span>
                  </p>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/transactions/${transaction.id}/edit`)
                      }}
                      className="p-2 sm:p-2.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTransaction(transaction.id)
                      }}
                      className="p-2 sm:p-2.5 rounded-lg hover:bg-danger-50 active:bg-danger-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-danger-600" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

