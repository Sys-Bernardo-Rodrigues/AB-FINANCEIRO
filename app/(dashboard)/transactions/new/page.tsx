'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiRequest, apiRequestFormData } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { ArrowLeft, Upload, FileText, X, Users } from 'lucide-react'

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

export default function NewTransactionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    creditCardId: '',
    planId: '',
    isScheduled: false,
    scheduledDate: '',
    assignedUserId: '', // ID do usuário ao qual atribuir a transação
  })

  useEffect(() => {
    loadCategories()
    loadCreditCards()
    loadFamilyGroups()
    if (formData.type === 'EXPENSE') {
      loadPlans()
    }
  }, [formData.type])

  useEffect(() => {
    // Se não houver userId selecionado e houver grupos, usar o usuário atual
    if (!formData.assignedUserId && user) {
      setFormData((prev) => ({ ...prev, assignedUserId: user.id }))
    }
  }, [user, familyGroups])

  const loadCategories = async () => {
    try {
      const data = await apiRequest<Category[]>(
        `/categories?type=${formData.type}`
      )
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
      
      // Se houver grupos, usar o usuário atual como padrão
      if (groupsWithMultipleMembers.length > 0 && user) {
        setFormData((prev) => ({ ...prev, assignedUserId: user.id }))
      }
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
        date: new Date(formData.date).toISOString(),
      }

      if (formData.creditCardId) {
        payload.creditCardId = formData.creditCardId
      }

      if (formData.planId) {
        payload.planId = formData.planId
      }

      if (formData.isScheduled && formData.scheduledDate) {
        payload.isScheduled = true
        payload.scheduledDate = new Date(formData.scheduledDate).toISOString()
      }

      // Se houver usuário selecionado e for diferente do usuário atual, atribuir a ele
      if (formData.assignedUserId && formData.assignedUserId !== user?.id) {
        payload.userId = formData.assignedUserId
      }

      // Criar transação
      const transaction = await apiRequest<{ id: string }>('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      // Se houver arquivo selecionado, fazer upload do comprovante
      if (selectedFile && transaction.id) {
        setUploading(true)
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', selectedFile)
          formDataUpload.append('transactionId', transaction.id)

          await apiRequestFormData('/receipts', formDataUpload)
        } catch (error) {
          console.error('Erro ao fazer upload do comprovante:', error)
          // Não bloquear o fluxo se o upload falhar
          alert('Transação criada, mas houve erro ao fazer upload do comprovante')
        } finally {
          setUploading(false)
        }
      }

      router.push('/transactions')
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao criar transação'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 10MB')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      // Validar tipo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Tipo de arquivo inválido. Use JPG, PNG ou PDF')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Nova Transação</h1>
          <p className="text-slate-600 mt-1">Adicione uma nova receita ou despesa</p>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, planId: e.target.value }))}
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
                  // Coletar todos os membros únicos de todos os grupos
                  const allMembers = new Map<string, { value: string; label: string }>()
                  
                  // Adicionar "Eu" primeiro
                  if (user) {
                    allMembers.set(user.id, {
                      value: user.id,
                      label: `Eu (${user.name})`,
                    })
                  }
                  
                  // Adicionar membros de todos os grupos
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

          {/* Upload de Comprovante */}
          <div className="space-y-2 pt-2">
            <label className="label">Comprovante (opcional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {!selectedFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                Anexar Comprovante
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors touch-manipulation"
                  aria-label="Remover arquivo"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-danger-600" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              fullWidth
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading || uploading} fullWidth>
              {uploading ? 'Enviando comprovante...' : 'Criar Transação'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

