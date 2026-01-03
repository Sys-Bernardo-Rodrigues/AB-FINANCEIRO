'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Target, User } from 'lucide-react'
import Card from '@/components/ui/Card'

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

export default function PlanForm() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    return date.toISOString().split('T')[0]
  })
  const [categoryId, setCategoryId] = useState('')
  const [userId, setUserId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchUsers()
  }, [])

  useEffect(() => {
    // Definir usuário atual como padrão
    if (currentUser && !userId) {
      setUserId(currentUser.id)
    }
  }, [currentUser, userId])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const expenseCategories = data.filter((cat: Category) => cat.type === 'EXPENSE')
        setCategories(expenseCategories)
        if (expenseCategories.length > 0) {
          setCategoryId(expenseCategories[0].id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (new Date(endDate) <= new Date(startDate)) {
      setError('A data final deve ser posterior à data inicial')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          targetAmount: parseFloat(targetAmount),
          startDate,
          endDate,
          categoryId,
          userId: userId || undefined,
        }),
      })

      if (response.ok) {
        router.push('/plans')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar planejamento')
      }
    } catch (error) {
      setError('Erro ao criar planejamento. Tente novamente.')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="default" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Nome do Planejamento
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Economia para viagem, Reforma da casa..."
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Descrição (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adicione uma descrição..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Valor Meta
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="0,00"
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            Data Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            Data Fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            required
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
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
          required
        >
          {categories.length === 0 ? (
            <option value="">Carregando categorias...</option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="pt-4 pb-4 border-t border-secondary-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Target className="w-5 h-5" />
          {loading ? 'Criando...' : 'Criar Planejamento'}
        </button>
      </div>
      </form>
    </Card>
  )
}
