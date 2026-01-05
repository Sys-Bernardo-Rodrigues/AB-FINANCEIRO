'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Sidebar, Navigation } from '@/components/layout/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Evitar redirecionamento em loop - só redirecionar uma vez
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Login está em (auth) group, não precisa verificar aqui

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pb-24 lg:pb-8 pt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  )
}

