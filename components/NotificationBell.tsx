'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetchNotifications()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?status=UNREAD&limit=5')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READ' }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setShowDropdown(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DANGER':
        return 'bg-danger-100 text-danger-700 border-danger-200'
      case 'WARNING':
        return 'bg-warning-100 text-warning-700 border-warning-200'
      case 'SUCCESS':
        return 'bg-success-100 text-success-700 border-success-200'
      default:
        return 'bg-primary-100 text-primary-700 border-primary-200'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 active:bg-secondary-200 rounded-lg transition-colors touch-manipulation"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-secondary-200 shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await fetch('/api/notifications/mark-all-read', { method: 'POST' })
                    fetchNotifications()
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-secondary-50 transition-colors border-l-4 ${
                        notification.status === 'UNREAD'
                          ? getTypeColor(notification.type)
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-secondary-900 text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-secondary-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {notification.status === 'UNREAD' && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-secondary-200">
                <button
                  onClick={() => {
                    router.push('/notifications')
                    setShowDropdown(false)
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}





