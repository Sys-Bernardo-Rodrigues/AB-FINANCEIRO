'use client'

import { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  fullWidth?: boolean
  options: Array<{ value: string; label: string }>
}

export default function Select({
  label,
  error,
  helperText,
  leftIcon,
  fullWidth = true,
  options,
  className = '',
  ...props
}: SelectProps) {
  const baseClasses = 'glass border rounded-2xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base backdrop-blur-xl appearance-none bg-white cursor-pointer'

  const errorClasses = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
    : 'border-secondary-300/50'

  const paddingClasses = leftIcon ? 'pl-10 sm:pl-12' : 'pl-4 sm:pl-5'

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm sm:text-base font-semibold text-secondary-700 mb-2 sm:mb-3">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        <select
          className={`${baseClasses} ${errorClasses} ${paddingClasses} pr-10 sm:pr-12 py-3 sm:py-4 ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

