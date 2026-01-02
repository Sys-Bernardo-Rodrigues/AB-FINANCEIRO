'use client'

import { Wallet, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-secondary-200 sticky top-0 z-50 shadow-sm safe-area-top">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-secondary-900 truncate">
                Sistema Financeiro
              </h1>
              <p className="text-xs text-secondary-500 hidden sm:block">
                Controle suas finanças
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {user && (
              <>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                  <p className="text-xs text-secondary-500">{user.email}</p>
                </div>
                <NotificationBell />
                <button
                  onClick={logout}
                  className="p-2.5 sm:p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 active:bg-secondary-200 rounded-lg transition-colors touch-manipulation"
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
