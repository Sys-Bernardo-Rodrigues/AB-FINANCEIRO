'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { formatDateForAPI } from '@/lib/utils/date-helpers'
import { Plus, CreditCard, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface Installment {
  id: string
  description: string
  totalAmount: number
  installments: number
  currentInstallment: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  category: {
    id: string
    name: string
  }
  creditCard?: {
    id: string
    name: string
  }
  transactions: Array<{
    id: string
    amount: number
    date: string
  }>
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

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    installments: '2',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    creditCardId: '',
  })

  useEffect(() => {
    loadInstallments()
    loadCategories()
    loadCreditCards()
  }, [])

  const loadInstallments = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Installment[]>('/installments')
      setInstallments(data)
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error)
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
      await apiRequest('/installments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          installments: parseInt(formData.installments),
          startDate: formData.startDate,
          creditCardId: formData.creditCardId || undefined,
        }),
      })
      setFormData({
        description: '',
        totalAmount: '',
        installments: '2',
        categoryId: '',
        startDate: new Date().toISOString().split('T')[0],
        creditCardId: '',
      })
      setShowForm(false)
      loadInstallments()
    } catch (error) {
      console.error('Erro ao criar parcelamento:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar parcelamento')
    }
  }

  const activeInstallments = installments.filter((i) => i.status === 'ACTIVE')
  const completedInstallments = installments.filter((i) => i.status === 'COMPLETED')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Parcelamentos</h1>
          <p className="text-slate-600 mt-1">
            Acompanhe suas compras parceladas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Novo Parcelamento
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Criar Parcelamento
            </h2>
            <Input
              label="Descrição"
              placeholder="Ex: Compra de geladeira"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
            <Input
              label="Valor Total"
              type="number"
              step="0.01"
              placeholder="2000.00"
              value={formData.totalAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))
              }
              required
            />
            <Input
              label="Número de Parcelas"
              type="number"
              min="2"
              placeholder="12"
              value={formData.installments}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, installments: e.target.value }))
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
              label="Data de Início"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
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
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    description: '',
                    totalAmount: '',
                    installments: '2',
                    categoryId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    creditCardId: '',
                  })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Parcelamento
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
          {activeInstallments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Em Aberto</h2>
              <div className="space-y-3">
                {activeInstallments.map((installment) => {
                  const installmentAmount =
                    installment.totalAmount / installment.installments
                  const progress =
                    (installment.currentInstallment / installment.installments) * 100
                  return (
                    <Card key={installment.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex-1 ml-4">
                          <h3 className="text-xl font-bold text-slate-800">
                            {installment.description}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span>{installment.category.name}</span>
                            {installment.creditCard && (
                              <>
                                <span>•</span>
                                <span>{installment.creditCard.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">Progresso</span>
                            <span className="font-medium text-slate-800">
                              {installment.currentInstallment} de{' '}
                              {installment.installments} parcelas
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-gradient-primary h-3 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Total</p>
                            <p className="font-bold text-slate-800">
                              {formatCurrency(installment.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Parcela</p>
                            <p className="font-bold text-slate-800">
                              {formatCurrency(installmentAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Restante</p>
                            <p className="font-bold text-slate-800">
                              {formatCurrency(
                                installment.totalAmount -
                                  installmentAmount * installment.currentInstallment
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Início: {formatDate(installment.startDate)}
                          </span>
                          <span className="badge badge-info">
                            {installment.status === 'ACTIVE' ? 'Ativo' : 'Concluído'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completedInstallments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Concluídos</h2>
              <div className="space-y-3">
                {completedInstallments.map((installment) => (
                  <Card key={installment.id} className="p-6 opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-success flex items-center justify-center text-white">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {installment.description}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {installment.installments} parcelas de{' '}
                            {formatCurrency(
                              installment.totalAmount / installment.installments
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">
                          {formatCurrency(installment.totalAmount)}
                        </p>
                        <span className="badge badge-success text-xs">Concluído</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {installments.length === 0 && (
            <Card className="text-center py-12">
              <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhum parcelamento cadastrado</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-5 h-5" />
                Criar Primeiro Parcelamento
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}




