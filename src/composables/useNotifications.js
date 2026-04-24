// src/composables/useNotifications.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles all frontend notification logic:
//   • Polls API every 30s while tab is open
//   • Syncs JWT token to Service Worker so it can poll when tab is CLOSED
//   • Shows OS-level toasts via SW registration.showNotification()
//   • Exposes panel state, unread count, and CRUD actions to NavBar
// ─────────────────────────────────────────────────────────────────────────────
import { ref, watch, onUnmounted } from 'vue'
import {
  getNotifications,
  markNotificationsAsRead,
  deleteNotificationApi,
  clearAllNotificationsApi,
} from '../services/api.js'

// ─── SW state sync ────────────────────────────────────────────────────────────
// Sends the current JWT + API URL to the Service Worker via IndexedDB so that
// it can poll for notifications even when the browser tab is closed.
async function syncTokenToSW(token) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const apiUrl =
      import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'

    // Use MessageChannel for a clean request/response
    const channel = new MessageChannel()
    reg.active?.postMessage({ type: 'BELMAHI_SET_STATE', payload: { token, apiUrl } }, [
      channel.port2,
    ])
  } catch (e) {
    // SW not ready yet — will sync on next poll
  }
}

async function clearTokenFromSW() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'BELMAHI_LOGOUT' })
  } catch (e) {
    // ignore
  }
}

export function useNotifications(user) {
  const notifications = ref([])
  const unreadCount = ref(0)
  const showNotifPanel = ref(false)
  const toastNotif = ref(null)
  let pollingInterval = null
  let toastTimer = null

  // ─── Request browser OS notification permission ───────────────────────────
  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  // ─── Close toast (exposed to NavBar template) ────────────────────────────
  const closeToast = () => {
    toastNotif.value = null
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
  }

  // ─── Show in-app toast + OS notification ─────────────────────────────────
  const showOsNotification = (message, type = 'default') => {
    // In-app floating banner
    toastNotif.value = { message, type }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastNotif.value = null
      toastTimer = null
    }, 8000)

    // OS notification via Service Worker (works even when tab loses focus)
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = '/belmahilogo.jpg'
      const titleMap = {
        welcome: '👋 مرحباً — Belmahi School',
        reminder: '⏰ تذكير بالدرس — Belmahi School',
        assignment: '📚 تعيين جديد — Belmahi School',
        warning: '⚠️ تنبيه — Belmahi School',
        success: '✅ تم بنجاح — Belmahi School',
        info: '🔔 Belmahi School',
      }
      const title = titleMap[type] || '🔔 Belmahi School'

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, {
              body: message,
              icon,
              badge: icon,
              tag: `belmahi-${Date.now()}`,
              requireInteraction: false,
              silent: false,
            })
          })
          .catch(() => {
            new Notification(title, { body: message, icon })
          })
      } else {
        new Notification(title, { body: message, icon })
      }
    }
  }

  // ─── Fetch notifications and detect new ones ──────────────────────────────
  const fetchAndSyncNotifications = async () => {
    if (!user?.value?.id) return
    try {
      const data = await getNotifications()
      const existingIds = new Set(notifications.value.map((n) => n.id))

      // Fire OS popup for brand-new unread notifications
      data.forEach((notif) => {
        if (!existingIds.has(notif.id) && !notif.is_read) {
          showOsNotification(notif.message, notif.type || 'info')
        }
      })

      notifications.value = data
      unreadCount.value = data.filter((n) => !n.is_read).length
    } catch {
      // Silently fail — network error, will retry
    }
  }

  // ─── Start polling ────────────────────────────────────────────────────────
  const startPolling = () => {
    if (pollingInterval) return
    requestPermission()

    // Sync token to SW so it can poll when tab is closed
    const token = localStorage.getItem('token')
    if (token) syncTokenToSW(token)

    fetchAndSyncNotifications()
    pollingInterval = setInterval(fetchAndSyncNotifications, 30_000)
  }

  // ─── Stop polling ─────────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    notifications.value = []
    unreadCount.value = 0
    showNotifPanel.value = false

    // Tell SW to clear token (user logged out)
    clearTokenFromSW()
  }

  // ─── Toggle notification panel ────────────────────────────────────────────
  const togglePanel = async () => {
    showNotifPanel.value = !showNotifPanel.value
    if (showNotifPanel.value && unreadCount.value > 0) {
      unreadCount.value = 0
      notifications.value.forEach((n) => (n.is_read = true))
      await markNotificationsAsRead()
    }
  }

  // ─── Delete one notification ──────────────────────────────────────────────
  const removeNotification = async (notifId) => {
    try {
      notifications.value = notifications.value.filter((n) => n.id !== notifId)
      unreadCount.value = notifications.value.filter((n) => !n.is_read).length
      await deleteNotificationApi(notifId)
    } catch (e) {
      console.error('Erreur suppression notification', e)
    }
  }

  // ─── Clear all notifications ──────────────────────────────────────────────
  const clearAllNotifications = async () => {
    try {
      await clearAllNotificationsApi()
      notifications.value = []
      unreadCount.value = 0
    } catch (e) {
      console.error('Erreur clear all', e)
    }
  }

  // ─── Watch user login/logout ──────────────────────────────────────────────
  watch(
    () => user?.value?.id,
    (newId) => {
      if (newId) {
        startPolling()
      } else {
        stopPolling()
      }
    },
    { immediate: true },
  )

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  onUnmounted(() => {
    stopPolling()
    if (toastTimer) clearTimeout(toastTimer)
  })

  return {
    notifications,
    unreadCount,
    showNotifPanel,
    toastNotif,
    togglePanel,
    removeNotification,
    clearAllNotifications,
    closeToast,
  }
}
