'use client'

import { Target, Calendar, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PlanCardProps {
  plan: {
    id: string
    name: string
    description?: string
    targetAmount: number
    currentAmount: number
    progress: number
    remaining: number
    endDate: string | Date
    category: { name: string }
  }
  onDelete?: () => void
}

export default function PlanCard({ plan, onDelete }: PlanCardProps) {
  const isOverBudget = plan.currentAmount > plan.targetAmount
  const daysRemaining = Math.ceil(
    (new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const getProgressColor = () => {
    if (isOverBudget) return 'gradient-danger'
    if (plan.progress >= 80) return 'bg-warning-500'
    return 'gradient-success'
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="truncate">{plan.name}</span>
            </h3>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 touch-manipulation flex-shrink-0"
                title="Deletar planejamento"
                aria-label="Deletar planejamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {plan.description && (
            <p className="text-sm text-secondary-600 mb-2 line-clamp-2">{plan.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-secondary-500">
            <span>{plan.category.name}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={isOverBudget ? 'text-danger-600 font-semibold' : 'text-secondary-600'}>
            {formatCurrency(plan.currentAmount)} de {formatCurrency(plan.targetAmount)}
          </span>
          <span className={isOverBudget ? 'text-danger-600 font-semibold' : 'text-primary-600 font-semibold'}>
            {plan.progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-secondary-100 rounded-full h-2 overflow-hidden">
          <div
            className={`${getProgressColor()} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(plan.progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className={plan.remaining < 0 ? 'text-danger-600' : 'text-secondary-700'}>
          {plan.remaining < 0 ? (
            <span className="font-semibold">
              Excedido em {formatCurrency(Math.abs(plan.remaining))}
            </span>
          ) : (
            <span>
              <span className="font-semibold text-success-600">{formatCurrency(plan.remaining)}</span>
              <span className="text-secondary-500"> restantes</span>
            </span>
          )}
        </div>
        <div className="text-secondary-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {daysRemaining > 0 ? `${daysRemaining} dias` : 'Encerrado'}
          </span>
        </div>
      </div>
    </div>
  )
}
