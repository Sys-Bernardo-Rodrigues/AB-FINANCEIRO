'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiRequest } from '@/lib/utils/api'
import { formatDateForAPI, formatDateForInput } from '@/lib/utils/date-helpers'
import { useAuth } from '@/lib/hooks/useAuth'
import { ArrowLeft, Users } from 'lucide-react'

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
  scheduledDate?: string
  creditCardId?: string
  planId?: string
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

interface Plan {
  id: string
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

interface FamilyGroupMember {
  userId: string
  userName: string
  userEmail: string
}

interface FamilyGroup {
  id: string
  name: string
  members: FamilyGroupMember[]
}

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([])
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    date: '',
    creditCardId: '',
    planId: '',
    isScheduled: false,
    scheduledDate: '',
    assignedUserId: '',
    userId: '',
  })

  useEffect(() => {
    loadTransaction()
    loadCreditCards()
    loadFamilyGroups()
    if (formData.type === 'EXPENSE') {
      loadPlans()
    }
  }, [id])

  useEffect(() => {
    loadCategories()
  }, [formData.type])

  const loadTransaction = async () => {
    try {
      const data = await apiRequest<Transaction & { userId?: string; user?: { id: string; name: string } }>(`/transactions/${id}`)
      const transactionUserId = data.userId || data.user?.id || ''
      setFormData({
        description: data.description,
        amount: data.amount.toString(),
        type: data.type,
        categoryId: data.category.id,
        date: formatDateForInput(data.date),
        creditCardId: data.creditCardId || '',
        planId: data.planId || '',
        isScheduled: data.isScheduled,
        scheduledDate: data.scheduledDate
          ? formatDateForInput(data.scheduledDate)
          : '',
        assignedUserId: transactionUserId,
        userId: transactionUserId,
      })
    } catch (error) {
      console.error('Erro ao carregar transação:', error)
      router.push('/transactions')
    }
  }

  const loadCategories = async () => {
    try {
      const data = await apiRequest<Category[]>(
        `/categories?type=${formData.type}`
      )
      setCategories(data)
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

  const loadPlans = async () => {
    try {
      const data = await apiRequest<Plan[]>('/plans?status=ACTIVE')
      setPlans(data)
    } catch (error) {
      console.error('Erro ao carregar planejamentos:', error)
    }
  }

  const loadFamilyGroups = async () => {
    try {
      const groups = await apiRequest<FamilyGroup[]>('/family-groups')
      // Filtrar apenas grupos com mais de 1 membro
      const groupsWithMultipleMembers = groups.filter(
        (group) => group.members.length > 1
      )
      setFamilyGroups(groupsWithMultipleMembers)
    } catch (error) {
      console.error('Erro ao carregar grupos de família:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId,
        date: formatDateForAPI(formData.date),
      }

      if (formData.creditCardId) {
        payload.creditCardId = formData.creditCardId
      } else {
        payload.creditCardId = null
      }

      if (formData.planId) {
        payload.planId = formData.planId
      } else {
        payload.planId = null
      }

      if (formData.isScheduled && formData.scheduledDate) {
        payload.isScheduled = true
        payload.scheduledDate = formatDateForAPI(formData.scheduledDate)
      } else {
        payload.isScheduled = false
      }

      // Se houver usuário selecionado e for diferente do atual, atualizar
      if (formData.assignedUserId && formData.assignedUserId !== formData.userId) {
        payload.userId = formData.assignedUserId
      }

      await apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      router.push(`/transactions/${id}`)
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao atualizar transação'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Editar Transação</h1>
          <p className="text-slate-600 mt-1">Atualize os dados da transação</p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'INCOME', categoryId: '' }))
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === 'INCOME'
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold">Receita</p>
              <p className="text-sm mt-1">Dinheiro recebido</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'EXPENSE', categoryId: '' }))
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === 'EXPENSE'
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold">Despesa</p>
              <p className="text-sm mt-1">Dinheiro gasto</p>
            </button>
          </div>

          <Input
            label="Descrição"
            placeholder="Ex: Compra no supermercado"
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
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
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

          <Input
            label="Data"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
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

          {formData.type === 'EXPENSE' && plans.length > 0 && (
            <Select
              label="Vincular a Planejamento (opcional)"
              value={formData.planId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, planId: e.target.value }))
              }
              options={[
                { value: '', label: 'Nenhum' },
                ...plans.map((plan) => ({
                  value: plan.id,
                  label: plan.name,
                })),
              ]}
            />
          )}

          {/* Atribuição a membro do grupo familiar */}
          {familyGroups.length > 0 && (
            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Atribuir a (Grupo Familiar)
              </label>
              <Select
                value={formData.assignedUserId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignedUserId: e.target.value }))
                }
                options={(() => {
                  const allMembers = new Map<string, { value: string; label: string }>()
                  
                  if (user) {
                    allMembers.set(user.id, {
                      value: user.id,
                      label: `Eu (${user.name})`,
                    })
                  }
                  
                  familyGroups.forEach((group) => {
                    group.members.forEach((member) => {
                      if (!allMembers.has(member.userId)) {
                        allMembers.set(member.userId, {
                          value: member.userId,
                          label: member.userName,
                        })
                      }
                    })
                  })
                  
                  return Array.from(allMembers.values())
                })()}
              />
              <p className="text-xs text-slate-500">
                Selecione a quem atribuir esta transação. Membros do grupo podem visualizar todas as transações.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isScheduled"
              checked={formData.isScheduled}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isScheduled: e.target.checked }))
              }
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isScheduled" className="text-sm text-slate-700">
              Agendar transação
            </label>
          </div>

          {formData.isScheduled && (
            <Input
              label="Data Agendada"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
              }
              required={formData.isScheduled}
            />
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              fullWidth
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading} fullWidth>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

