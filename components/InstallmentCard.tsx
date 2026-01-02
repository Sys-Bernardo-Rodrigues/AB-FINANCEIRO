'use client'

import { CreditCard, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InstallmentCardProps {
  installment: {
    id: string
    description: string
    totalAmount: number
    installments: number
    currentInstallment: number
    category: { name: string }
    startDate: string | Date
  }
}

export default function InstallmentCard({ installment }: InstallmentCardProps) {
  const progress = (installment.currentInstallment / installment.installments) * 100
  const remaining = installment.installments - installment.currentInstallment
  const installmentAmount = installment.totalAmount / installment.installments

  return (
    <div className="bg-white rounded-xl p-5 border border-secondary-200 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 mb-1 truncate">{installment.description}</h3>
          <div className="flex items-center gap-2 text-sm text-secondary-500">
            <span>{installment.category.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-primary-600" />
              {installment.currentInstallment}/{installment.installments} parcelas
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="font-bold text-danger-600">{formatCurrency(installmentAmount)}</p>
          <p className="text-xs text-secondary-500">por parcela</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-secondary-600 mb-2">
          <span>Progresso</span>
          <span className="text-primary-600 font-semibold">{remaining} parcelas restantes</span>
        </div>
        <div className="w-full bg-secondary-100 rounded-full h-2 overflow-hidden">
          <div
            className="gradient-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-secondary-700">
          <span className="font-semibold">{formatCurrency(installment.totalAmount)}</span>
          <span className="text-secondary-500"> total</span>
        </div>
        <div className="text-secondary-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {new Date(installment.startDate).toLocaleDateString('pt-BR', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
