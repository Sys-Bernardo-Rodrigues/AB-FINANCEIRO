'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, Archive, Trash2, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  actionUrl?: string
  createdAt: string
  readAt?: string
}

export default function NotificationsList() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const status = filter !== 'ALL' ? `?status=${filter}` : ''
      const response = await fetch(`/api/notifications${status}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
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

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      fetchNotifications()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const archiveNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Erro ao arquivar notificação:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta notificação?')) {
      return
    }
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      fetchNotifications()
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DANGER':
        return <AlertCircle className="w-5 h-5 text-danger-600" />
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      default:
        return <Info className="w-5 h-5 text-primary-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DANGER':
        return 'bg-danger-50 border-danger-200'
      case 'WARNING':
        return 'bg-warning-50 border-warning-200'
      case 'SUCCESS':
        return 'bg-success-50 border-success-200'
      default:
        return 'bg-primary-50 border-primary-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
              filter === 'ALL'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
              filter === 'UNREAD'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            Não Lidas
          </button>
          <button
            onClick={() => setFilter('READ')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
              filter === 'READ'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50'
            }`}
          >
            Lidas
          </button>
        </div>
        {filter === 'UNREAD' && notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista de Notificações */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-card">
          <Bell className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-500">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl border-2 p-4 shadow-card hover:shadow-card-hover transition-all ${
                notification.status === 'UNREAD'
                  ? getTypeColor(notification.type)
                  : 'border-secondary-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-secondary-900">
                      {notification.title}
                    </h3>
                    {notification.status === 'UNREAD' && (
                      <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full flex-shrink-0 ml-2">
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {notification.status === 'UNREAD' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => archiveNotification(notification.id)}
                    className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors touch-manipulation"
                    title="Arquivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors touch-manipulation"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

