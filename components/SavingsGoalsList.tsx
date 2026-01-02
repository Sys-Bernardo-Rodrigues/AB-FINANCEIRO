'use client'

import { useEffect, useState } from 'react'
import { Target, Plus } from 'lucide-react'
import SavingsGoalCard from './SavingsGoalCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SavingsGoalsList() {
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL')

  useEffect(() => {
    fetchGoals()
  }, [filter])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const status = filter !== 'ALL' ? `?status=${filter}` : ''
      const response = await fetch(`/api/savings-goals${status}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Erro ao buscar metas de economia:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAmount = async (id: string, amount: number) => {
    try {
      const response = await fetch(`/api/savings-goals/${id}/add-amount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (response.ok) {
        fetchGoals()
        router.refresh()
      }
    } catch (error) {
      console.error('Erro ao adicionar valor:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta meta de economia?')) {
      return
    }

    try {
      const response = await fetch(`/api/savings-goals/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchGoals()
      }
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
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
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            filter === 'COMPLETED'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
          }`}
        >
          Concluídas
        </button>
      </div>

      {/* Botão Adicionar */}
      <Link
        href="/add?type=savings-goal"
        className="flex items-center justify-center gap-2 w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Nova Meta de Economia
      </Link>

      {/* Lista */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <Target className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhuma meta de economia encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onAddAmount={handleAddAmount}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

