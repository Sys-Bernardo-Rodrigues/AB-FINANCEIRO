'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[44px]',
    md: 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base min-h-[44px]',
    lg: 'px-7 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[48px]',
  }

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } touch-manipulation ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

