'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowDownCircle, ArrowUpCircle, User } from 'lucide-react'

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

export default function TransactionForm() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          type,
          categoryId,
          date: isScheduled && scheduledDate ? scheduledDate : date,
          userId: userId || undefined,
          isScheduled: isScheduled && scheduledDate ? true : false,
          scheduledDate: isScheduled && scheduledDate ? scheduledDate : null,
        }),
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar transação')
      }
    } catch (error) {
      setError('Erro ao criar transação. Tente novamente.')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
          {/* Seletor de Tipo */}
          <div className="glass rounded-3xl p-2 flex gap-2 border border-secondary-200/50 shadow-card backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setType('EXPENSE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation hover-lift ${
                type === 'EXPENSE'
                  ? 'bg-danger-50 text-danger-700 border-2 border-danger-300 shadow-md'
                  : 'text-secondary-600 hover:text-danger-600 hover:bg-danger-50/50'
              }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setType('INCOME')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation hover-lift ${
                type === 'INCOME'
                  ? 'bg-success-50 text-success-700 border-2 border-success-300 shadow-md'
                  : 'text-secondary-600 hover:text-success-600 hover:bg-success-50/50'
              }`}
        >
          <ArrowUpCircle className="w-5 h-5" />
          Receita
        </button>
      </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-secondary-700 mb-2 sm:mb-3">
                Descrição
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Salário..."
                className="w-full px-4 sm:px-5 py-3 sm:py-4 glass border border-secondary-300/50 rounded-2xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base sm:text-lg backdrop-blur-xl"
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
                className="w-full px-4 sm:px-5 py-3 sm:py-4 glass border border-secondary-300/50 rounded-2xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base sm:text-lg backdrop-blur-xl"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            Data
          </label>
          <div className="space-y-3">
            <input
              type="date"
              value={isScheduled ? scheduledDate : date}
              onChange={(e) => {
                if (isScheduled) {
                  setScheduledDate(e.target.value)
                } else {
                  setDate(e.target.value)
                }
              }}
              className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
              required
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => {
                  setIsScheduled(e.target.checked)
                  if (e.target.checked) {
                    setScheduledDate(date)
                  }
                }}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">
                Agendar para data futura
              </span>
            </label>
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
                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 glass border border-secondary-300/50 rounded-2xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base sm:text-lg backdrop-blur-xl"
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
              className={`w-full py-4 sm:py-5 rounded-2xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover-lift text-base sm:text-lg ${
                type === 'INCOME'
                  ? 'gradient-success'
                  : 'gradient-danger'
              }`}
            >
              {loading ? 'Adicionando...' : 'Adicionar Transação'}
            </button>
      </form>
    </div>
  )
}
