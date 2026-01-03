'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Calendar, DollarSign } from 'lucide-react'
import Card from '@/components/ui/Card'

interface SavingsGoalFormProps {
  onSuccess?: () => void
}

export default function SavingsGoalForm({ onSuccess }: SavingsGoalFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [period, setPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'>('MONTHLY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calcular data final baseada no período
  const calculateEndDate = (period: string, start: string) => {
    if (!start) return ''
    const startDateObj = new Date(start)
    const endDateObj = new Date(startDateObj)

    switch (period) {
      case 'MONTHLY':
        endDateObj.setMonth(endDateObj.getMonth() + 1)
        break
      case 'QUARTERLY':
        endDateObj.setMonth(endDateObj.getMonth() + 3)
        break
      case 'YEARLY':
        endDateObj.setFullYear(endDateObj.getFullYear() + 1)
        break
      default:
        return endDate
    }

    return endDateObj.toISOString().split('T')[0]
  }

  const handlePeriodChange = (newPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM') => {
    setPeriod(newPeriod)
    if (newPeriod !== 'CUSTOM' && startDate) {
      setEndDate(calculateEndDate(newPeriod, startDate))
    }
  }

  const handleStartDateChange = (date: string) => {
    setStartDate(date)
    if (period !== 'CUSTOM' && date) {
      setEndDate(calculateEndDate(period, date))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!endDate) {
      setError('Data final é obrigatória')
      setLoading(false)
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('A data final deve ser posterior à data inicial')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          targetAmount: parseFloat(targetAmount),
          period,
          startDate,
          endDate,
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/savings-goals')
          router.refresh()
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar meta de economia')
      }
    } catch (error) {
      setError('Erro ao criar meta de economia. Tente novamente.')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const periodLabels = {
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    YEARLY: 'Anual',
    CUSTOM: 'Personalizado',
  }

  return (
    <Card variant="default" padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Nome da Meta
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Economia para viagem, Reserva de emergência..."
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
          className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
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

      <div>
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          Período
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodChange(p)}
              className={`py-2.5 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
                period === p
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-50 text-secondary-700 border border-secondary-300 hover:bg-secondary-100'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Data Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
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
            disabled={period !== 'CUSTOM'}
            className={`w-full px-4 py-3 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base ${
              period !== 'CUSTOM' ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
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
          {loading ? 'Criando...' : 'Criar Meta de Economia'}
        </button>
      </div>
      </form>
    </Card>
  )
}






