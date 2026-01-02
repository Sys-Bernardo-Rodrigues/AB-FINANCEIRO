'use client'

import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  const baseClasses = 'w-full bg-white border rounded-2xl text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base outline-none'

  const errorClasses = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 bg-danger-50/50'
    : 'border-secondary-200 focus:border-primary-500'

  const paddingClasses = leftIcon ? 'pl-12' : 'pl-4'
  const paddingRightClasses = rightIcon ? 'pr-12' : 'pr-4'

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          className={`${baseClasses} ${errorClasses} ${paddingClasses} ${paddingRightClasses} py-3.5 min-h-[48px] ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  )
}
