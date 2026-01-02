import { useState, useCallback } from 'react'
import { isOnline, savePendingAction } from './offline-sync'

interface FetchOptions extends RequestInit {
  skipOfflineQueue?: boolean
}

export function useOfflineFetch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWithOfflineSupport = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      setLoading(true)
      setError(null)

      const { skipOfflineQueue, ...fetchOptions } = options

      try {
        // Se estiver online, fazer requisição normalmente
        if (isOnline()) {
          const response = await fetch(url, fetchOptions)

          if (!response.ok && !skipOfflineQueue) {
            // Se falhar e não for para pular a fila offline, tentar salvar como pendente
            const data = await response.json().catch(() => ({}))
            throw new Error(data.error || 'Erro na requisição')
          }

          return response
        } else {
          // Se estiver offline e não for para pular a fila
          if (!skipOfflineQueue && fetchOptions.method && fetchOptions.method !== 'GET') {
            // Salvar como ação pendente
            const body = fetchOptions.body
              ? typeof fetchOptions.body === 'string'
                ? JSON.parse(fetchOptions.body)
                : fetchOptions.body
              : {}

            const actionType =
              fetchOptions.method === 'DELETE'
                ? 'DELETE'
                : fetchOptions.method === 'PUT' || fetchOptions.method === 'PATCH'
                ? 'UPDATE'
                : 'CREATE'

            savePendingAction({
              type: actionType,
              endpoint: url,
              data: body,
            })

            // Retornar resposta simulada de sucesso
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Ação salva para sincronização quando voltar online',
                pending: true,
              }),
              {
                status: 202,
                statusText: 'Accepted',
                headers: { 'Content-Type': 'application/json' },
              }
            )
          } else {
            // Para GET requests offline, tentar buscar do cache
            throw new Error('Sem conexão com a internet')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro na requisição')
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { fetchWithOfflineSupport, loading, error }
}


