'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  gradient?: boolean
  onClick?: () => void
  hover?: boolean
}

export function Card({
  children,
  className = '',
  gradient = false,
  onClick,
  hover = false,
}: CardProps) {
  const baseClass = gradient ? 'card-gradient' : 'card'
  const cursorClass = onClick ? 'cursor-pointer' : ''
  const hoverClass = hover ? 'transition-transform hover:scale-[1.02]' : ''

  return (
    <div
      className={`${baseClass} ${className} ${cursorClass} ${hoverClass}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'purple'
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  onClick,
}: MetricCardProps) {
  const variants = {
    default: 'bg-gradient-primary',
    success: 'bg-gradient-success',
    danger: 'bg-gradient-danger',
    warning: 'bg-gradient-warning',
    purple: 'bg-gradient-purple',
  }

  return (
    <Card
      gradient
      onClick={onClick}
      hover={!!onClick}
      className={`${variants[variant]} text-white animate-fade-in p-4 sm:p-6 ${onClick ? 'touch-manipulation active:scale-95' : ''}`}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold mb-1 truncate">{value}</h3>
          {subtitle && (
            <p className="text-white/70 text-xs mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-white/80 flex-shrink-0 ml-2 sm:ml-4">{icon}</div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs sm:text-sm flex-wrap">
          <span
            className={
              trend.isPositive
                ? 'text-success-200'
                : 'text-danger-200'
            }
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-white/70 hidden sm:inline">vs mês anterior</span>
          <span className="text-white/70 sm:hidden">vs anterior</span>
        </div>
      )}
    </Card>
  )
}

