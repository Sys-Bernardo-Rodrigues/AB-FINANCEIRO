'use client'

import { Wallet, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="glass border-b border-white/50 sticky top-0 z-40 shadow-mobile safe-area-top bg-white/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo e Título - Mobile Optimized */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">
                Financeiro
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
                  className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-xl transition-all touch-feedback"
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
