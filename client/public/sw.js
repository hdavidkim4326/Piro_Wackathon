const CACHE_NAME = 'ddang-pwa-v1'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './pwa-192x192.png', './pwa-512x512.png']

const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'image', 'font'])
const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '::1'])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/games/')) return
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

  const isLocalhost = LOCALHOST_NAMES.has(self.location.hostname)
  if (isLocalhost) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', responseClone))
          return networkResponse
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  if (!STATIC_DESTINATIONS.has(request.destination)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        })
        .catch(() => cached)

      return cached || networkFetch
    })
  )
})
