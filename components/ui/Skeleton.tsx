'use client'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-secondary-200 via-secondary-100 to-secondary-200 bg-[length:200%_100%] animate-shimmer rounded'

  const variants = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-2xl',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  if (lines && variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variants.text} ${className}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
    />
  )
}

// Componentes pré-configurados
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-secondary-200 shadow-card">
      <Skeleton variant="text" width="60%" className="mb-4" />
      <Skeleton variant="text" width="40%" className="mb-6" />
      <Skeleton variant="rectangular" height={40} className="mb-2" />
      <Skeleton variant="rectangular" height={40} />
    </div>
  )
}

export function SkeletonTransaction() {
  return (
    <div className="glass rounded-2xl p-4 border border-secondary-200/50 flex items-center gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <Skeleton variant="text" width={80} height={24} />
    </div>
  )
}

export function SkeletonBalanceCard() {
  return (
    <div className="gradient-primary rounded-3xl p-6 sm:p-8">
      <Skeleton variant="text" width="40%" height={20} className="mb-4 bg-white/20" />
      <Skeleton variant="text" width="60%" height={40} className="bg-white/20" />
    </div>
  )
}



