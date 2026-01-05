'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Plus, Calendar, Target, TrendingUp, Edit, Trash2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  progress: number
  remaining: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  category: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    categoryId: '',
  })

  useEffect(() => {
    loadPlans()
    loadCategories()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Plan[]>('/plans')
      setPlans(data)
    } catch (error) {
      console.error('Erro ao carregar planejamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await apiRequest<Category[]>('/categories?type=EXPENSE')
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/plans', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      })
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        startDate: '',
        endDate: '',
        categoryId: '',
      })
      setShowForm(false)
      loadPlans()
    } catch (error) {
      console.error('Erro ao criar planejamento:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar planejamento')
    }
  }

  const deletePlan = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este planejamento?')) return
    try {
      await apiRequest(`/plans/${id}`, { method: 'DELETE' })
      loadPlans()
    } catch (error) {
      console.error('Erro ao excluir planejamento:', error)
      alert('Erro ao excluir planejamento')
    }
  }

  const activePlans = plans.filter((p) => p.status === 'ACTIVE')
  const completedPlans = plans.filter((p) => p.status === 'COMPLETED')
  const cancelledPlans = plans.filter((p) => p.status === 'CANCELLED')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Planejamentos</h1>
          <p className="text-slate-600 mt-1">
            Planeje seus gastos e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Novo Planejamento
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Criar Novo Planejamento
            </h2>
            <Input
              label="Nome do Planejamento"
              placeholder="Ex: Férias 2026"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Descrição (opcional)"
              placeholder="Descreva o planejamento"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Input
              label="Valor Alvo"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
              }
              required
            />
            <Select
              label="Categoria"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
              }
              options={
                categories.length > 0
                  ? categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))
                  : [{ value: '', label: 'Carregando...' }]
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data Inicial"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
              <Input
                label="Data Final"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                required
              />
            </div>
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
                    startDate: '',
                    endDate: '',
                    categoryId: '',
                  })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Planejamento
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
          {activePlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Em Andamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activePlans.map((plan) => {
                  const daysRemaining = Math.ceil(
                    (new Date(plan.endDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  return (
                    <Card key={plan.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                          <Target className="w-6 h-6" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/plans/${plan.id}`)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver detalhes"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-slate-600 mb-4">
                          {plan.description}
                        </p>
                      )}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">Progresso</span>
                            <span className="font-medium text-slate-800">
                              {plan.progress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-gradient-primary h-3 rounded-full transition-all"
                              style={{ width: `${Math.min(plan.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Gasto</p>
                            <p className="font-bold text-slate-800">
                              {formatCurrency(plan.currentAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Meta</p>
                            <p className="font-bold text-slate-800">
                              {formatCurrency(plan.targetAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(plan.endDate)}
                          </span>
                          <span>{daysRemaining} dias restantes</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/plans/${plan.id}`)}
                        className="mt-4 w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver detalhes →
                      </button>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completedPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Concluídos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedPlans.map((plan) => (
                  <Card key={plan.id} className="p-6 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center text-white">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Meta atingida!</span>
                      <span className="font-bold text-success-600">
                        {formatCurrency(plan.targetAmount)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {plans.length === 0 && (
            <Card className="text-center py-12">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhum planejamento criado</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-5 h-5" />
                Criar Primeiro Planejamento
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

