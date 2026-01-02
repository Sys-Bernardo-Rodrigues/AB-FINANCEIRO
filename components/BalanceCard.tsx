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
          bg: 'bg-gradient-to-br from-primary-600 to-primary-700',
          text: 'text-white',
          iconBg: 'bg-white/20',
          border: '',
        }
      case 'negative':
        return {
          bg: 'bg-gradient-to-br from-danger-600 to-danger-700',
          text: 'text-white',
          iconBg: 'bg-white/20',
          border: '',
        }
      case 'income':
        return {
          bg: 'bg-white',
          text: 'text-success-700',
          iconBg: 'bg-success-50',
          border: 'border border-success-200',
        }
      case 'expense':
        return {
          bg: 'bg-white',
          text: 'text-danger-700',
          iconBg: 'bg-danger-50',
          border: 'border border-danger-200',
        }
      default:
        return {
          bg: 'bg-white',
          text: 'text-secondary-700',
          iconBg: 'bg-secondary-100',
          border: 'border border-secondary-200',
        }
    }
  }

  const styles = getCardStyles()

  return (
    <div className={`${styles.bg} ${styles.border} rounded-2xl p-5 shadow-mobile transition-all duration-200 animate-fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${type === 'balance' || type === 'negative' ? 'text-white/90' : 'text-secondary-600'}`}>
          {title}
        </span>
        <div className={`${styles.iconBg} p-2.5 rounded-xl`}>
          <div className={styles.text}>
            {icon}
          </div>
        </div>
      </div>
      <p className={`text-2xl font-bold ${styles.text} leading-tight`}>
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}
