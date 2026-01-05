'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import { apiRequest } from '@/lib/utils/api'
import { Plus, CreditCard, Edit, Trash2 } from 'lucide-react'

interface CreditCardData {
  id: string
  name: string
  limit: number
  paymentDay: number
}

export default function CreditCardsPage() {
  const router = useRouter()
  const [cards, setCards] = useState<CreditCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    paymentDay: '10',
  })

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<CreditCardData[]>('/credit-cards')
      setCards(data)
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/credit-cards', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          limit: parseFloat(formData.limit),
          paymentDay: parseInt(formData.paymentDay),
        }),
      })
      setFormData({ name: '', limit: '', paymentDay: '10' })
      setShowForm(false)
      loadCards()
    } catch (error) {
      console.error('Erro ao criar cartão:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar cartão')
    }
  }

  const deleteCard = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return
    try {
      await apiRequest(`/credit-cards/${id}`, { method: 'DELETE' })
      loadCards()
    } catch (error) {
      console.error('Erro ao excluir cartão:', error)
      alert('Erro ao excluir cartão')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cartões de Crédito</h1>
          <p className="text-slate-600 mt-1">
            Gerencie seus cartões de crédito
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Novo Cartão
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Adicionar Cartão
            </h2>
            <Input
              label="Nome do Cartão"
              placeholder="Ex: Nubank"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Limite"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={formData.limit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, limit: e.target.value }))
              }
              required
            />
            <Input
              label="Dia de Vencimento"
              type="number"
              min="1"
              max="31"
              placeholder="10"
              value={formData.paymentDay}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paymentDay: e.target.value }))
              }
              required
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ name: '', limit: '', paymentDay: '10' })
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                Criar Cartão
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : cards.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Nenhum cartão cadastrado</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Adicionar Primeiro Cartão
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="p-2 rounded-lg hover:bg-danger-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-danger-600" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {card.name}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Limite</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(card.limit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Vencimento</span>
                  <span className="font-medium text-slate-800">
                    Dia {card.paymentDay}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

