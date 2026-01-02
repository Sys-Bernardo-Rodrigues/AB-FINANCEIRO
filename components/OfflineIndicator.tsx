'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { isOnline, onOnlineStatusChange, syncPendingActions } from '@/lib/offline-sync'

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncedCount, setSyncedCount] = useState(0)

  useEffect(() => {
    setOnline(isOnline())

    const unsubscribe = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline)
      
      // Quando voltar online, sincronizar ações pendentes
      if (isOnline) {
        handleSync()
      }
    })

    return unsubscribe
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const count = await syncPendingActions()
      if (count > 0) {
        setSyncedCount(count)
        setTimeout(() => setSyncedCount(0), 3000)
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (online && syncedCount === 0) {
    return null
  }

  return (
    <div className="fixed top-16 sm:top-20 left-0 right-0 z-50 px-4 pt-2 animate-slide-up">
      <div className="max-w-md mx-auto">
        {!online ? (
          <div className="glass rounded-xl shadow-card p-3 border border-warning-200/50 backdrop-blur-xl flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-warning-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning-900">Modo Offline</p>
              <p className="text-xs text-warning-700">
                Você está offline. As alterações serão sincronizadas quando voltar online.
              </p>
            </div>
          </div>
        ) : syncing ? (
          <div className="glass rounded-xl shadow-card p-3 border border-info-200/50 backdrop-blur-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-info-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm font-semibold text-info-900">Sincronizando...</p>
          </div>
        ) : syncedCount > 0 ? (
          <div className="glass rounded-xl shadow-card p-3 border border-success-200/50 backdrop-blur-xl flex items-center gap-3">
            <Wifi className="w-5 h-5 text-success-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-success-900">
              {syncedCount} ação(ões) sincronizada(s) com sucesso!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}


