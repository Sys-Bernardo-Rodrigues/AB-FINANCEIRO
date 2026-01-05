'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Plus, Target, TrendingUp } from 'lucide-react'

interface SavingsGoal {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  endDate: string
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    endDate: '',
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<SavingsGoal[]>('/savings-goals')
      setGoals(data)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/savings-goals', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          targetAmount: parseFloat(formData.targetAmount),
          period: 'CUSTOM',
          startDate: new Date().toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      })
      setFormData({ name: '', description: '', targetAmount: '', endDate: '' })
      setShowForm(false)
      loadGoals()
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar meta')
    }
  }

  const addAmount = async (id: string, amount: number) => {
    try {
      await apiRequest(`/savings-goals/${id}/add-amount`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      })
      loadGoals()
    } catch (error) {
      console.error('Erro ao adicionar valor:', error)
      alert('Erro ao adicionar valor')
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'ACTIVE')
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Metas de Economia</h1>
          <p className="text-slate-600 mt-1">
            Acompanhe suas metas financeiras
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Nova Meta
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Criar Nova Meta
            </h2>
            <Input
              label="Nome da Meta"
              placeholder="Ex: Viagem para Europa"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Descreva sua meta"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Input
              label="Valor Alvo"
              type="number"
              step="0.01"
              placeholder="10000.00"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
              }
              required
            />
            <Input
              label="Data Limite"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              required
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    name: '',
                    description: '',
                    targetAmount: '',
                    endDate: '',
                  })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Meta
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Em Andamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  return (
                    <Card key={goal.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                          <Target className="w-6 h-6" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {goal.name}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-slate-600 mb-4">
                          {goal.description}
                        </p>
                      )}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">Progresso</span>
                            <span className="font-medium text-slate-800">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-gradient-primary h-3 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {formatCurrency(goal.currentAmount)}
                          </span>
                          <span className="font-medium text-slate-800">
                            {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => {
                            const amount = prompt(
                              'Quanto deseja adicionar?',
                              '100'
                            )
                            if (amount) {
                              addAmount(goal.id, parseFloat(amount))
                            }
                          }}
                        >
                          Adicionar Valor
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Concluídas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="p-6 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center text-white">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {goal.name}
                    </h3>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Meta atingida!</span>
                      <span className="font-bold text-success-600">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <Card className="text-center py-12">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhuma meta cadastrada</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-5 h-5" />
                Criar Primeira Meta
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}




