'use client'

import { ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
}: EmptyStateProps) {
  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className={`${iconSizes[size]} text-secondary-300 mb-4 flex items-center justify-center`}>
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm sm:text-base text-secondary-600 max-w-md mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}



