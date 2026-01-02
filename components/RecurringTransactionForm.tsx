'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Repeat, User, Calendar } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface UserData {
  id: string
  name: string
  email: string
}

export default function RecurringTransactionForm() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'>('MONTHLY')
  const [categoryId, setCategoryId] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (currentUser && !userId) {
      setUserId(currentUser.id)
    }
  }, [currentUser, userId])

  useEffect(() => {
    if (categories.length > 0) {
      const filteredCategories = categories.filter(cat => cat.type === type)
      if (filteredCategories.length > 0 && !filteredCategories.find(cat => cat.id === categoryId)) {
        setCategoryId(filteredCategories[0].id)
      }
    }
  }, [type, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        const filtered = data.filter((cat: Category) => cat.type === type)
        if (filtered.length > 0) {
          setCategoryId(filtered[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const filteredCategories = categories.filter(cat => cat.type === type)

  const frequencyLabels = {
    DAILY: 'Diária',
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quinzenal',
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    SEMIANNUAL: 'Semestral',
    YEARLY: 'Anual',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/recurring-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          type,
          frequency,
          categoryId,
          startDate,
          endDate: endDate || undefined,
          userId: userId || undefined,
        }),
      })

      if (response.ok) {
        router.push('/recurring')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar transação recorrente')
      }
    } catch (error) {
      setError('Erro ao criar transação recorrente. Tente novamente.')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Tipo
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all touch-manipulation ${
              type === 'EXPENSE'
                ? 'bg-danger-50 text-danger-700 border-2 border-danger-200'
                : 'bg-secondary-50 text-secondary-600 border-2 border-secondary-200'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all touch-manipulation ${
              type === 'INCOME'
                ? 'bg-success-50 text-success-700 border-2 border-success-200'
                : 'bg-secondary-50 text-secondary-600 border-2 border-secondary-200'
            }`}
          >
            Receita
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Descrição
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Salário, Aluguel, Netflix..."
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Valor
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Frequência
        </label>
        <div className="relative">
          <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            required
          >
            {Object.entries(frequencyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Data de Início
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Data de Término (opcional)
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Usuário
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            required
          >
            {users.length === 0 ? (
              <option value="">Carregando usuários...</option>
            ) : (
              users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.id === currentUser?.id && '(Você)'}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Categoria
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        >
          {filteredCategories.length === 0 ? (
            <option value="">Carregando categorias...</option>
          ) : (
            filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Repeat className="w-5 h-5" />
        {loading ? 'Criando...' : 'Criar Transação Recorrente'}
      </button>
    </form>
  )
}

