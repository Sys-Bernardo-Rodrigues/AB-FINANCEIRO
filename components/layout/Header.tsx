'use client'

import { Bell, Menu, X, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'
import { apiRequest } from '@/lib/utils/api'

interface HeaderProps {
  balance?: number
  showNotifications?: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  createdAt: string
}

export function Header({ balance, showNotifications = true }: HeaderProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (showNotifications && notificationsOpen) {
      loadNotifications()
    }
  }, [showNotifications, notificationsOpen])

  const loadNotifications = async () => {
    if (!user) return // Não carregar se não estiver autenticado
    try {
      const data = await apiRequest<Notification[]>('/notifications?limit=10', {}, true)
      setNotifications(data)
      setUnreadCount(data.filter((n) => n.status === 'UNREAD').length)
    } catch (error) {
      // Ignorar erros silenciosamente (usuário pode não estar autenticado)
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const markAsRead = async (id: string) => {
    if (!user) return
    try {
      await apiRequest(`/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'READ' }),
      }, true)
      loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificação:', error)
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-soft sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo e saldo */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
                AB
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">AB Financeiro</h1>
                {balance !== undefined && (
                  <p className="text-xs text-slate-500 truncate">
                    Saldo: {formatCurrency(balance)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notificações e perfil */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {showNotifications && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Notificações"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto scrollbar-thin">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Notificações</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            Nenhuma notificação
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => {
                                markAsRead(notification.id)
                                setNotificationsOpen(false)
                              }}
                              className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                                notification.status === 'UNREAD' ? 'bg-primary-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    notification.status === 'UNREAD'
                                      ? 'bg-primary-500'
                                      : 'bg-transparent'
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-slate-800">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Menu do usuário */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block text-sm font-medium text-slate-700 truncate max-w-[120px]">
                  {user?.name}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-scale-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

