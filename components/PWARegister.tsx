'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Registrar service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope)
            
            // Verificar atualizações periodicamente
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000) // A cada hora
          })
          .catch((error) => {
            console.error('Erro ao registrar Service Worker:', error)
          })
      })

      // Gerenciar atualizações do service worker
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  return null
}


