'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Se autenticado e tentando acessar login, redirecionar para dashboard
    if (!loading && isAuthenticated && pathname === '/login') {
      router.push('/')
    }
  }, [isAuthenticated, loading, router, pathname])

  return <>{children}</>
}

