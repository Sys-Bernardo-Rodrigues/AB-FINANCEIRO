'use client'

import { ReactNode } from 'react'
import { formatCurrency } from '@/lib/utils'

interface BalanceCardProps {
  title: string
  amount: number
  icon: ReactNode
  type: 'balance' | 'income' | 'expense' | 'negative'
}

export default function BalanceCard({ title, amount, icon, type }: BalanceCardProps) {
  const getCardStyles = () => {
    switch (type) {
      case 'balance':
        return {
          bg: 'gradient-nubank-card',
          text: 'text-white',
          iconBg: 'bg-white/20',
          border: '',
          titleColor: 'text-white/90',
        }
      case 'negative':
        return {
          bg: 'bg-gradient-to-br from-danger-600 to-danger-700',
          text: 'text-white',
          iconBg: 'bg-white/20',
          border: '',
          titleColor: 'text-white/90',
        }
      case 'income':
        return {
          bg: 'bg-white',
          text: 'text-success-600',
          iconBg: 'bg-success-50',
          border: 'border-0',
          titleColor: 'text-secondary-500',
        }
      case 'expense':
        return {
          bg: 'bg-white',
          text: 'text-danger-600',
          iconBg: 'bg-danger-50',
          border: 'border-0',
          titleColor: 'text-secondary-500',
        }
      default:
        return {
          bg: 'bg-white',
          text: 'text-secondary-700',
          iconBg: 'bg-secondary-100',
          border: 'border-0',
          titleColor: 'text-secondary-500',
        }
    }
  }

  const styles = getCardStyles()
  const isMainCard = type === 'balance' || type === 'negative'

  return (
    <div className={`${styles.bg} ${styles.border} rounded-3xl p-6 sm:p-8 shadow-lg transition-all duration-200 animate-fade-in ${isMainCard ? 'shadow-xl' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${styles.titleColor}`}>
          {title}
        </span>
        {!isMainCard && (
          <div className={`${styles.iconBg} p-2.5 rounded-xl`}>
            <div className={styles.text}>
              {icon}
            </div>
          </div>
        )}
      </div>
      <p className={`${isMainCard ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} font-bold ${styles.text} leading-tight tracking-tight`}>
        {formatCurrency(Math.abs(amount))}
      </p>
      {isMainCard && (
        <div className="mt-4 flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-xl">
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
