// Utilitário para gerenciar sincronização offline

interface PendingAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  data: any
  timestamp: number
}

const STORAGE_KEY = 'pending-actions'

export function savePendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
  const pendingActions = getPendingActions()
  const newAction: PendingAction = {
    ...action,
    id: `action-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  }
  
  pendingActions.push(newAction)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions))
  
  return newAction.id
}

export function getPendingActions(): PendingAction[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function removePendingAction(id: string) {
  const pendingActions = getPendingActions()
  const filtered = pendingActions.filter((action) => action.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export async function syncPendingActions(): Promise<number> {
  const pendingActions = getPendingActions()
  if (pendingActions.length === 0) return 0

  let syncedCount = 0
  const errors: string[] = []

  for (const action of pendingActions) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.type === 'DELETE' ? 'DELETE' : action.type === 'UPDATE' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.type !== 'DELETE' ? JSON.stringify(action.data) : undefined,
      })

      if (response.ok) {
        removePendingAction(action.id)
        syncedCount++
      } else {
        errors.push(`Erro ao sincronizar ação ${action.id}`)
      }
    } catch (error) {
      console.error(`Erro ao sincronizar ação ${action.id}:`, error)
      errors.push(`Erro ao sincronizar ação ${action.id}`)
    }
  }

  if (errors.length > 0) {
    console.warn('Algumas ações não foram sincronizadas:', errors)
  }

  return syncedCount
}

export function clearPendingActions() {
  localStorage.removeItem(STORAGE_KEY)
}

// Verificar status online/offline
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// Escutar mudanças de status online/offline
export function onOnlineStatusChange(callback: (isOnline: boolean) => void) {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}


