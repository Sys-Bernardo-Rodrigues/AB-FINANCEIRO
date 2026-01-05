'use client'

import { Wallet, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-secondary-100 sticky top-0 z-40 safe-area-top">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título - Mobile Optimized */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 gradient-nubank rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-primary-600 truncate">
                AB Financeiro
              </h1>
            </div>
          </div>

          {/* Ações - Mobile Optimized */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <>
                <NotificationBell />
                <button
                  onClick={logout}
                  className="p-2.5 text-secondary-500 hover:text-primary-600 active:scale-95 rounded-xl transition-all touch-feedback"
                  title="Sair"
                  aria-label="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
