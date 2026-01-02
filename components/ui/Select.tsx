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
  const baseClasses = 'w-full bg-white border rounded-2xl text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base outline-none appearance-none cursor-pointer'

  const errorClasses = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 bg-danger-50/50'
    : 'border-secondary-200 focus:border-primary-500'

  const paddingClasses = leftIcon ? 'pl-12' : 'pl-4'
  const paddingRightClasses = 'pr-12'

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
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        <select
          className={`${baseClasses} ${errorClasses} ${paddingClasses} ${paddingRightClasses} py-3.5 min-h-[48px] ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 pointer-events-none">
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
