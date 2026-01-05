'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Plus, RefreshCw, Calendar, Edit, Trash2, Play, Pause } from 'lucide-react'

interface RecurringTransaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'
  startDate: string
  endDate?: string
  nextDueDate: string
  isActive: boolean
  category: {
    id: string
    name: string
  }
  creditCard?: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface CreditCard {
  id: string
  name: string
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
}

export default function RecurringTransactionsPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    frequency: 'MONTHLY',
    categoryId: '',
    startDate: '',
    endDate: '',
    creditCardId: '',
  })

  useEffect(() => {
    loadRecurring()
    loadCategories()
    loadCreditCards()
  }, [formData.type])

  const loadRecurring = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<RecurringTransaction[]>('/recurring-transactions')
      setRecurring(data)
    } catch (error) {
      console.error('Erro ao carregar recorrentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await apiRequest<Category[]>(`/categories?type=${formData.type}`)
      setCategories(data)
      if (data.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: data[0].id }))
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const loadCreditCards = async () => {
    try {
      const data = await apiRequest<CreditCard[]>('/credit-cards')
      setCreditCards(data)
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/recurring-transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          creditCardId: formData.creditCardId || undefined,
        }),
      })
      setFormData({
        description: '',
        amount: '',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        categoryId: '',
        startDate: '',
        endDate: '',
        creditCardId: '',
      })
      setShowForm(false)
      loadRecurring()
    } catch (error) {
      console.error('Erro ao criar recorrente:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar recorrente')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/recurring-transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      loadRecurring()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const executeNow = async (id: string) => {
    try {
      await apiRequest(`/recurring-transactions/${id}/execute`, {
        method: 'POST',
      })
      loadRecurring()
      alert('Transação executada com sucesso!')
    } catch (error) {
      console.error('Erro ao executar:', error)
      alert('Erro ao executar transação')
    }
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação recorrente?')) return
    try {
      await apiRequest(`/recurring-transactions/${id}`, { method: 'DELETE' })
      loadRecurring()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir transação recorrente')
    }
  }

  const activeRecurring = recurring.filter((r) => r.isActive)
  const inactiveRecurring = recurring.filter((r) => !r.isActive)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Transações Recorrentes</h1>
          <p className="text-slate-600 mt-1">
            Gerencie transações que se repetem periodicamente
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Nova Recorrente
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Criar Transação Recorrente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: 'INCOME', categoryId: '' }))
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'INCOME'
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold">Receita</p>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: 'EXPENSE', categoryId: '' }))
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'EXPENSE'
                    ? 'border-danger-500 bg-danger-50 text-danger-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold">Despesa</p>
              </button>
            </div>
            <Input
              label="Descrição"
              placeholder="Ex: Salário mensal"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              required
            />
            <Select
              label="Frequência"
              value={formData.frequency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, frequency: e.target.value }))
              }
              options={Object.entries(frequencyLabels).map(([value, label]) => ({
                value,
                label,
              }))}
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
            <Input
              label="Data de Início"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              required
            />
            <Input
              label="Data de Término (opcional)"
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
            {creditCards.length > 0 && (
              <Select
                label="Cartão de Crédito (opcional)"
                value={formData.creditCardId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, creditCardId: e.target.value }))
                }
                options={[
                  { value: '', label: 'Nenhum' },
                  ...creditCards.map((card) => ({
                    value: card.id,
                    label: card.name,
                  })),
                ]}
              />
            )}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    description: '',
                    amount: '',
                    type: 'EXPENSE',
                    frequency: 'MONTHLY',
                    categoryId: '',
                    startDate: '',
                    endDate: '',
                    creditCardId: '',
                  })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Recorrente
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
          {activeRecurring.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Ativas</h2>
              <div className="space-y-3">
                {activeRecurring.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            item.type === 'INCOME'
                              ? 'bg-success-100 text-success-600'
                              : 'bg-danger-100 text-danger-600'
                          }`}
                        >
                          <RefreshCw className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span>{frequencyLabels[item.frequency]}</span>
                            <span>•</span>
                            <span>{item.category.name}</span>
                            {item.creditCard && (
                              <>
                                <span>•</span>
                                <span>{item.creditCard.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              item.type === 'INCOME'
                                ? 'text-success-600'
                                : 'text-danger-600'
                            }`}
                          >
                            {item.type === 'INCOME' ? '+' : '-'}
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Próxima: {formatDate(item.nextDueDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => executeNow(item.id)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Executar agora"
                          >
                            <Play className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => toggleActive(item.id, item.isActive)}
                            className="p-2 rounded-lg hover:bg-warning-50 transition-colors"
                            title="Pausar"
                          >
                            <Pause className="w-4 h-4 text-warning-600" />
                          </button>
                          <button
                            onClick={() => deleteRecurring(item.id)}
                            className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {inactiveRecurring.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Pausadas</h2>
              <div className="space-y-3">
                {inactiveRecurring.map((item) => (
                  <Card key={item.id} className="p-4 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <RefreshCw className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.description}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {frequencyLabels[item.frequency]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-600">
                          {formatCurrency(item.amount)}
                        </p>
                        <button
                          onClick={() => toggleActive(item.id, item.isActive)}
                          className="p-2 rounded-lg hover:bg-success-50 transition-colors"
                          title="Ativar"
                        >
                          <Play className="w-4 h-4 text-success-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recurring.length === 0 && (
            <Card className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">
                Nenhuma transação recorrente cadastrada
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-5 h-5" />
                Criar Primeira Recorrente
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}




