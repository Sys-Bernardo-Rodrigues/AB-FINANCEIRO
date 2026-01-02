'use client'

import { Target, Calendar, TrendingUp, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface SavingsGoalCardProps {
  goal: {
    id: string
    name: string
    description?: string
    targetAmount: number
    currentAmount: number
    period: string
    startDate: string
    endDate: string
    status: string
    progress: number
    remaining: number
    daysRemaining: number
    isOverdue?: boolean
    isCompleted?: boolean
  }
  onAddAmount?: (id: string, amount: number) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const periodLabels: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
  CUSTOM: 'Personalizado',
}

export default function SavingsGoalCard({
  goal,
  onAddAmount,
  onEdit,
  onDelete,
}: SavingsGoalCardProps) {
  const [showAddAmount, setShowAddAmount] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleAddAmount = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    setLoading(true)
    try {
      if (onAddAmount) {
        await onAddAmount(goal.id, parseFloat(amount))
        setAmount('')
        setShowAddAmount(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar valor:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = () => {
    if (goal.isCompleted) return 'bg-gradient-success'
    if (goal.isOverdue) return 'bg-gradient-danger'
    if (goal.progress >= 80) return 'bg-warning-500'
    return 'bg-gradient-primary'
  }

  return (
    <div className={`bg-white rounded-xl p-5 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all ${
      goal.isCompleted ? 'border-success-200' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-5 h-5 ${
              goal.isCompleted ? 'text-success-600' : 'text-primary-600'
            }`} />
            <h3 className="font-semibold text-secondary-900 text-lg">
              {goal.name}
            </h3>
            {goal.isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-success-600" />
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-secondary-600 mb-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-secondary-500">
            <span>{periodLabels[goal.period]}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(goal.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-secondary-600">
            {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
          </span>
          <span className={`font-semibold ${
            goal.isCompleted ? 'text-success-600' : 'text-primary-600'
          }`}>
            {goal.progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-secondary-100 rounded-full h-3 overflow-hidden">
          <div
            className={`${getProgressColor()} h-3 rounded-full transition-all`}
            style={{ width: `${Math.min(goal.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Informações */}
      <div className="flex items-center justify-between mb-4">
        <div className={goal.remaining < 0 ? 'text-danger-600' : 'text-secondary-700'}>
          {goal.remaining < 0 ? (
            <span className="font-semibold">
              Excedido em {formatCurrency(Math.abs(goal.remaining))}
            </span>
          ) : (
            <span>
              <span className="font-semibold text-success-600">{formatCurrency(goal.remaining)}</span>
              <span className="text-secondary-500"> restantes</span>
            </span>
          )}
        </div>
        <div className="text-secondary-500 text-sm flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {goal.daysRemaining > 0 ? `${goal.daysRemaining} dias` : 'Vencida'}
          </span>
        </div>
      </div>

      {/* Adicionar Valor */}
      {goal.status === 'ACTIVE' && !goal.isCompleted && (
        <div className="space-y-2">
          {showAddAmount ? (
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                className="flex-1 px-4 py-2.5 bg-white border border-secondary-300 rounded-xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                autoFocus
              />
              <button
                onClick={handleAddAmount}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'OK'}
              </button>
              <button
                onClick={() => {
                  setShowAddAmount(false)
                  setAmount('')
                }}
                className="px-4 py-2.5 bg-secondary-200 text-secondary-700 rounded-xl font-semibold hover:bg-secondary-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddAmount(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-success-50 text-success-700 rounded-xl font-semibold hover:bg-success-100 border border-success-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Valor
            </button>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-secondary-200">
        {onEdit && (
          <button
            onClick={() => onEdit(goal.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors font-medium text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(goal.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-danger-600 hover:bg-danger-50 rounded-xl transition-colors font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </button>
        )}
      </div>
    </div>
  )
}





