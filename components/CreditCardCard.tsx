'use client'

import { CreditCard, Calendar, Trash2, Edit } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CreditCardCardProps {
  creditCard: {
    id: string
    name: string
    limit: number
    paymentDay: number
    createdAt: string | Date
    usedAmount?: number
    remainingAmount?: number
    usagePercentage?: number
  }
  onDelete?: () => void
  onEdit?: () => void
}

export default function CreditCardCard({ creditCard, onDelete, onEdit }: CreditCardCardProps) {
  const usedAmount = creditCard.usedAmount || 0
  const remainingAmount = creditCard.remainingAmount ?? creditCard.limit
  const usagePercentage = creditCard.usagePercentage || 0
  const isOverLimit = remainingAmount < 0
  const isNearLimit = usagePercentage >= 80 && !isOverLimit

  const getProgressColor = () => {
    if (isOverLimit) return 'gradient-danger'
    if (isNearLimit) return 'bg-warning-500'
    return 'gradient-primary'
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="truncate">{creditCard.name}</span>
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 touch-manipulation flex-shrink-0"
                  title="Editar cartão"
                  aria-label="Editar cartão"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all duration-200 touch-manipulation flex-shrink-0"
                  title="Deletar cartão"
                  aria-label="Deletar cartão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso do limite */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={isOverLimit ? 'text-danger-600 font-semibold' : 'text-secondary-600'}>
            {formatCurrency(usedAmount)} de {formatCurrency(creditCard.limit)}
          </span>
          <span className={isOverLimit ? 'text-danger-600 font-semibold' : isNearLimit ? 'text-warning-600 font-semibold' : 'text-primary-600 font-semibold'}>
            {usagePercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-secondary-100 rounded-full h-2 overflow-hidden">
          <div
            className={`${getProgressColor()} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary-600">Limite Restante:</span>
          <span className={`text-lg font-semibold ${isOverLimit ? 'text-danger-600' : 'text-success-600'}`}>
            {isOverLimit ? (
              <>-{formatCurrency(Math.abs(remainingAmount))}</>
            ) : (
              formatCurrency(remainingAmount)
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Dia de Pagamento:
          </span>
          <span className="text-base font-semibold text-primary-600">
            Dia {creditCard.paymentDay}
          </span>
        </div>
      </div>
    </div>
  )
}

