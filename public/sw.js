// public/sw.js
// ─── Belmahi School Service Worker ───────────────────────────────────────────
// Enables OS-level notifications even when the browser is closed or the user
// is logged out — exactly like YouTube / Instagram desktop notifications.
//
// HOW IT WORKS:
//   1. On install, the SW caches nothing but registers itself immediately.
//   2. Every 2 minutes (via setInterval in the SW itself), it polls the
//      /api/notifications endpoint with the stored JWT token.
//   3. Any NEW unread notification triggers a native OS toast.
//   4. When the user clicks the toast, the app opens/focuses on /notifications.
//
// IMPORTANT: The SW runs in its own thread — it has NO access to Vue state.
//            All it needs is the JWT token and the API URL from IndexedDB.
// ─────────────────────────────────────────────────────────────────────────────

const SW_VERSION = 'belmahi-sw-v3'
const API_BASE = self.location.origin // Same origin as frontend

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting()
  console.log('[SW] Installed — Belmahi School notification worker ready')
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
  console.log('[SW] Activated — taking control of all clients')
})

// ─── Web Push (server-sent push) ─────────────────────────────────────────────
// This fires when the backend sends a real Web Push via VAPID.
// Currently the backend uses polling, but this handler is ready for future use.
self.addEventListener('push', (event) => {
  let data = { title: '🔔 Belmahi School', body: 'لديك إشعار جديد.' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Belmahi School', {
      body: data.body,
      icon: '/belmahilogo.jpg',
      badge: '/belmahilogo.jpg',
      tag: data.tag || `belmahi-push-${Date.now()}`,
      requireInteraction: false,
      silent: false,
      data: { url: data.url || '/' },
    }),
  )
})

// ─── Periodic Polling (replaces Web Push for offline detection) ───────────────
// This is the KEY feature: poll the API every 2 min inside the SW so that
// notifications appear even when the user's tab is closed.
//
// STORAGE: The frontend saves token + last seen IDs in IndexedDB key "belmahi_sw_state".
// The SW reads from this to know which notifications are already shown.

let pollingTimer = null

function startPolling() {
  if (pollingTimer) return
  pollingTimer = setInterval(pollNotifications, 2 * 60 * 1000) // every 2 minutes
  pollNotifications() // run immediately on startup
}

async function getSwState() {
  return new Promise((resolve) => {
    const req = indexedDB.open('belmahi_sw_db', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('state', { keyPath: 'key' })
    }
    req.onsuccess = (e) => {
      const db = e.target.result
      const tx = db.transaction('state', 'readonly')
      const store = tx.objectStore('state')
      const getReq = store.get('belmahi_sw_state')
      getReq.onsuccess = () => resolve(getReq.result?.value || null)
      getReq.onerror = () => resolve(null)
    }
    req.onerror = () => resolve(null)
  })
}

async function setSwState(value) {
  return new Promise((resolve) => {
    const req = indexedDB.open('belmahi_sw_db', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('state', { keyPath: 'key' })
    }
    req.onsuccess = (e) => {
      const db = e.target.result
      const tx = db.transaction('state', 'readwrite')
      tx.objectStore('state').put({ key: 'belmahi_sw_state', value })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    }
    req.onerror = () => resolve()
  })
}

async function pollNotifications() {
  try {
    const state = await getSwState()
    if (!state?.token) return // Not logged in — no polling

    const apiUrl = state.apiUrl || API_BASE + '/api'
    const response = await fetch(`${apiUrl}/notifications`, {
      headers: {
        Authorization: `Bearer ${state.token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Token expired or invalid — stop polling
      if (response.status === 401) {
        await setSwState({ ...state, token: null })
      }
      return
    }

    const notifications = await response.json()
    const shownIds = new Set(state.shownIds || [])
    const newNotifs = notifications.filter((n) => !n.is_read && !shownIds.has(n.id))

    for (const notif of newNotifs) {
      const type = notif.type || 'default'
      const title =
        type === 'welcome'
          ? '👋 مرحباً — Belmahi School'
          : type === 'reminder'
            ? '⏰ تذكير بالدرس — Belmahi School'
            : type === 'assignment'
              ? '📚 تعيين جديد — Belmahi School'
              : type === 'warning'
                ? '⚠️ تنبيه — Belmahi School'
                : '🔔 Belmahi School'

      await self.registration.showNotification(title, {
        body: notif.message,
        icon: '/belmahilogo.jpg',
        badge: '/belmahilogo.jpg',
        tag: `belmahi-notif-${notif.id}`,
        requireInteraction: false,
        silent: false,
        timestamp: new Date(notif.created_at).getTime(),
        data: { notifId: notif.id, url: '/' },
      })

      shownIds.add(notif.id)
    }

    // Persist the updated shown IDs (keep last 200)
    const updatedIds = [...shownIds].slice(-200)
    await setSwState({ ...state, shownIds: updatedIds })
  } catch (err) {
    // Network error — will retry next interval
    console.log('[SW] Poll error (will retry):', err.message)
  }
}

// ─── Message from main thread ─────────────────────────────────────────────────
// The frontend sends messages to update the SW state (token, apiUrl, shownIds)
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {}

  if (type === 'BELMAHI_SET_STATE') {
    // Frontend is passing the auth token so SW can poll
    const current = (await getSwState()) || {}
    await setSwState({ ...current, ...payload })
    startPolling()
    event.ports?.[0]?.postMessage({ ok: true })
  }

  if (type === 'BELMAHI_LOGOUT') {
    // User logged out — clear token and stop polling
    await setSwState({ token: null, shownIds: [] })
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    event.ports?.[0]?.postMessage({ ok: true })
  }

  if (type === 'BELMAHI_PING') {
    event.ports?.[0]?.postMessage({ alive: true, version: SW_VERSION })
  }
})

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})

// ─── Start polling when SW activates ─────────────────────────────────────────
self.addEventListener('activate', () => {
  startPolling()
})
