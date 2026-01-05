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
  const baseClasses = 'rounded-2xl transition-all duration-200'

  const variants = {
    default: 'bg-white border-0 shadow-md',
    glass: 'glass-card border border-white/50',
    elevated: 'bg-white border-0 shadow-lg',
    outlined: 'bg-white border-2 border-secondary-200',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  const hoverClasses = hover 
    ? 'hover:shadow-mobile-lg active:scale-[0.98] cursor-pointer' 
    : ''

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
