'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={`
        ${styles[toast.type]}
        border rounded-2xl p-4 shadow-lg backdrop-blur-sm
        flex items-start gap-3 min-w-[300px] max-w-md
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => {
          setIsLeaving(true)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/5"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        ...event.detail,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      }
      setToasts((prev) => [...prev, newToast])
    }

    window.addEventListener('toast' as any, handleToast as EventListener)
    return () => window.removeEventListener('toast' as any, handleToast as EventListener)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 safe-area-top pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const event = new CustomEvent('toast', {
    detail: { message, type, duration },
  })
  window.dispatchEvent(event)
}

