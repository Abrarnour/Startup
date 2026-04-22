// src/composables/useNotifications.js
import { ref, watch, onUnmounted } from 'vue'
import {
  getNotifications,
  markNotificationsAsRead,
  deleteNotificationApi,
  clearAllNotificationsApi,
} from '../services/api.js'

export function useNotifications(user) {
  const notifications = ref([])
  const unreadCount = ref(0)
  const showNotifPanel = ref(false)
  const toastNotif = ref(null)
  let pollingInterval = null
  let toastTimer = null

  // ─── Request browser permission for OS notifications ────────────────────────
  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  // ─── Show in-app toast + native OS notification ─────────────────────────────
  const showOsNotification = (message, type = 'default') => {
    // In-app toast (floating banner inside the app)
    toastNotif.value = { message, type }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastNotif.value = null
    }, 7000)

    // OS/Device notification (works when tab is open; Service Worker needed for background)
    if ('Notification' in window && Notification.permission === 'granted') {
      const icon = '/belmahilogo.jpg'
      const title =
        type === 'welcome'
          ? '👋 مرحباً بك — Belmahi School'
          : type === 'reminder'
            ? '⏰ تذكير بالدرس — Belmahi School'
            : '🔔 Belmahi School'
      new Notification(title, { body: message, icon })
    }
  }

  // ─── Fetch from API and detect new unread notifications ─────────────────────
  const fetchAndSyncNotifications = async () => {
    // Guard: only fetch when a real user is logged in
    if (!user?.value?.id) return
    try {
      const data = await getNotifications()

      // Detect brand-new notifications to trigger OS popup
      const existingIds = new Set(notifications.value.map((n) => n.id))
      data.forEach((notif) => {
        if (!existingIds.has(notif.id) && !notif.is_read) {
          showOsNotification(notif.message, notif.type || 'default')
        }
      })

      notifications.value = data
      unreadCount.value = data.filter((n) => !n.is_read).length
    } catch (e) {
      // Silently fail — no console spam when offline
    }
  }

  // ─── Start polling (every 30 s) ─────────────────────────────────────────────
  const startPolling = () => {
    if (pollingInterval) return // already running
    requestPermission()
    fetchAndSyncNotifications()
    pollingInterval = setInterval(fetchAndSyncNotifications, 30_000)
  }

  // ─── Stop polling and reset state ───────────────────────────────────────────
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    notifications.value = []
    unreadCount.value = 0
    showNotifPanel.value = false
  }

  // ─── Toggle panel — mark as read when opened ────────────────────────────────
  const togglePanel = async () => {
    showNotifPanel.value = !showNotifPanel.value
    if (showNotifPanel.value && unreadCount.value > 0) {
      // Optimistic UI: zero the badge immediately
      unreadCount.value = 0
      notifications.value.forEach((n) => (n.is_read = true))
      await markNotificationsAsRead()
    }
  }

  // ─── Delete a single notification ───────────────────────────────────────────
  const removeNotification = async (notifId) => {
    try {
      notifications.value = notifications.value.filter((n) => n.id !== notifId)
      unreadCount.value = notifications.value.filter((n) => !n.is_read).length
      await deleteNotificationApi(notifId)
    } catch (e) {
      console.error('Erreur suppression notification', e)
    }
  }

  // ─── Clear ALL notifications ─────────────────────────────────────────────────
  const clearAllNotifications = async () => {
    try {
      await clearAllNotificationsApi()
      notifications.value = []
      unreadCount.value = 0
    } catch (e) {
      console.error('Erreur clear all notifications', e)
    }
  }

  // ─── Watch user login/logout — start or stop polling automatically ──────────
  watch(
    () => user?.value?.id,
    (newId) => {
      if (newId) {
        startPolling()
      } else {
        stopPolling()
      }
    },
    { immediate: true }, // Run immediately on mount
  )

  // ─── Clean up on component unmount ──────────────────────────────────────────
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
  }
}
