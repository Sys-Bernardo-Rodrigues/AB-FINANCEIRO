'use client'

import { Repeat, Calendar, PlayCircle, Pause, Play, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface RecurringTransactionCardProps {
  recurringTransaction: {
    id: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    frequency: string
    startDate?: string
    endDate?: string | null
    nextDueDate: string
    isActive: boolean
    category: { name: string }
    user?: { name: string }
  }
  onExecute?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleActive?: (id: string) => void
  showActions?: boolean
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

export default function RecurringTransactionCard({
  recurringTransaction,
  onExecute,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = false,
}: RecurringTransactionCardProps) {
  const [executing, setExecuting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: showActions ? 'numeric' : undefined,
    })
  }

  const isOverdue = new Date(recurringTransaction.nextDueDate) < new Date()

  const handleExecute = async () => {
    if (!onExecute) return
    setExecuting(true)
    try {
      await onExecute(recurringTransaction.id)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className={`bg-white rounded-xl p-4 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all ${
      !recurringTransaction.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className={`w-4 h-4 flex-shrink-0 ${
              recurringTransaction.type === 'INCOME' ? 'text-success-600' : 'text-danger-600'
            }`} />
            <h3 className={`font-semibold text-secondary-900 truncate ${showActions ? 'text-base' : 'text-sm'}`}>
              {recurringTransaction.description}
            </h3>
            {!recurringTransaction.isActive && (
              <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 text-xs font-medium rounded-full">
                Inativa
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 text-secondary-500 ${showActions ? 'text-sm' : 'text-xs'}`}>
            <span>{recurringTransaction.category.name}</span>
            <span>•</span>
            <span>{frequencyLabels[recurringTransaction.frequency]}</span>
            {recurringTransaction.user && (
              <>
                <span>•</span>
                <span>{recurringTransaction.user.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className={`font-bold ${showActions ? 'text-lg' : 'text-base'} ${
            recurringTransaction.type === 'INCOME' ? 'text-success-600' : 'text-danger-600'
          }`}>
            {recurringTransaction.type === 'INCOME' ? '+' : '-'}
            {formatCurrency(recurringTransaction.amount)}
          </p>
        </div>
      </div>
      <div className={`flex items-center gap-1 ${showActions ? 'text-sm' : 'text-xs'} ${
        isOverdue ? 'text-danger-600 font-semibold' : 'text-secondary-600'
      }`}>
        <Calendar className="w-3 h-3" />
        <span>
          {isOverdue ? 'Vencida: ' : 'Próxima: '}
          {formatDate(recurringTransaction.nextDueDate)}
        </span>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-secondary-200">
          {recurringTransaction.isActive && isOverdue && onExecute && (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm touch-manipulation disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              {executing ? 'Executando...' : 'Executar Agora'}
            </button>
          )}
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(recurringTransaction.id)}
              className={`p-2 rounded-lg transition-colors touch-manipulation ${
                recurringTransaction.isActive
                  ? 'text-warning-600 hover:bg-warning-50'
                  : 'text-success-600 hover:bg-success-50'
              }`}
              title={recurringTransaction.isActive ? 'Pausar' : 'Ativar'}
            >
              {recurringTransaction.isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(recurringTransaction.id)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(recurringTransaction.id)}
              className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
