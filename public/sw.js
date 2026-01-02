const CACHE_NAME = 'sistema-financeiro-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'
const API_CACHE = 'api-cache-v1'

// Arquivos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/manifest.json',
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== API_CACHE
            )
          })
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  return self.clients.claim()
})

// Estratégia de cache: Network First com fallback para cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return
  }

  // Cache de API calls
  if (url.pathname.startsWith('/api/')) {
    // Para APIs, usar network first com cache
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // Para páginas e assets estáticos
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/_next/image') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
      })
    )
    return
  }

  // Para páginas HTML, usar network first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE))
    return
  }

  // Fallback padrão
  event.respondWith(fetch(request))
})

// Sincronização em background quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions())
  }
})

// Função para sincronizar transações pendentes
async function syncTransactions() {
  // Esta função será chamada quando o dispositivo voltar online
  // Pode ser implementada para sincronizar dados pendentes
  try {
    const response = await fetch('/api/sync')
    if (response.ok) {
      console.log('Sincronização concluída')
    }
  } catch (error) {
    console.error('Erro na sincronização:', error)
  }
}

// Notificações push
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Sistema Financeiro'
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})


