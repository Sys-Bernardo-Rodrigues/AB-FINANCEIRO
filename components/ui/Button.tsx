'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'gradient-primary text-white shadow-lg hover:shadow-xl focus:ring-primary-500',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
    success: 'gradient-success text-white shadow-lg hover:shadow-xl focus:ring-success-500',
    danger: 'gradient-danger text-white shadow-lg hover:shadow-xl focus:ring-danger-500',
    warning: 'gradient-warning text-white shadow-lg hover:shadow-xl focus:ring-warning-500',
    ghost: 'text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

