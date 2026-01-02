'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'rounded-2xl transition-all duration-300'

  const variants = {
    default: 'bg-white border border-secondary-200 shadow-card',
    glass: 'glass border border-secondary-200/50 backdrop-blur-xl',
    elevated: 'bg-white border border-secondary-200 shadow-elevated',
    outlined: 'bg-white border-2 border-secondary-300',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  const hoverClasses = hover ? 'hover:shadow-card-hover hover-lift cursor-pointer' : ''

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

