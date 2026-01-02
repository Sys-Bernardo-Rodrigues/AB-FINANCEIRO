'use client'

import { Wallet, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="glass border-b border-secondary-200/50 sticky top-0 z-50 shadow-sm safe-area-top backdrop-blur-xl bg-white/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 hover-lift">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">
                Sistema Financeiro
              </h1>
              <p className="text-xs sm:text-sm text-secondary-500 hidden sm:block">
                Controle suas finanças
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {user && (
              <>
                <div className="hidden lg:block text-right pr-4 border-r border-secondary-200">
                  <p className="text-sm font-semibold text-secondary-900">{user.name}</p>
                  <p className="text-xs text-secondary-500 truncate max-w-[200px]">{user.email}</p>
                </div>
                <NotificationBell />
                <button
                  onClick={logout}
                  className="p-2.5 sm:p-3 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-xl transition-all duration-200 touch-manipulation hover-lift"
                  title="Sair"
                  aria-label="Sair"
                >
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
