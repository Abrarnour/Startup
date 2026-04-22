// public/sw.js
// ─── Belmahi School — Service Worker ─────────────────────────────────────────
// This file enables notifications to appear even when the browser tab is closed.
// It must be placed in the /public folder so it is served at the root URL: /sw.js

const CACHE_NAME = 'belmahi-v1'

// ─── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// ─── Activate: clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// ─── Push event: show OS notification when a push arrives ────────────────────
// This fires even when the tab/browser is closed (requires Web Push subscription)
self.addEventListener('push', (event) => {
  let data = { title: '🔔 Belmahi School', body: 'Vous avez une nouvelle notification.' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Belmahi School', {
      body: data.body,
      icon: '/belmahilogo.jpg',
      badge: '/belmahilogo.jpg',
      tag: data.tag || 'belmahi-notif',
      requireInteraction: false,
      data: { url: data.url || '/' },
    }),
  )
})

// ─── Notification click: open/focus the app ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})
