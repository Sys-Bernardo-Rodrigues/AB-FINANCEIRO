'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Evitar redirecionamento em rotas públicas
    const publicRoutes = ['/login', '/register']
    if (publicRoutes.includes(pathname)) {
      return
    }

    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/login')
    }
  }, [user, loading, router, pathname, isRedirecting])

  // Mostrar loading durante verificação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  // Se não está em rota pública e não tem usuário, mostrar nada (já está redirecionando)
  const publicRoutes = ['/login', '/register']
  if (!publicRoutes.includes(pathname) && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

