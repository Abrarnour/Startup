// src/composables/useNotifications.js
import { ref, onMounted, onUnmounted } from 'vue'

const API_URL =
  import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'

export function useNotifications(user) {
  const notifications = ref([])
  const unreadCount = ref(0)
  const showNotifPanel = ref(false)
  const toastNotif = ref(null)
  let pollingInterval = null

  // 1. Demande de permission au système d'exploitation
  const requestOsNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications système.')
      return
    }
    // Demander la permission si elle n'a pas encore été accordée ou refusée
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission()
    }
  }

  const getSeenKeys = () => {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('notif_seen')
    if (!raw) return {}
    try {
      const data = JSON.parse(raw)
      if (data.date !== today) return {}
      return data.keys || {}
    } catch {
      return {}
    }
  }

  const markKeySeen = (key) => {
    const today = new Date().toDateString()
    const seen = getSeenKeys()
    seen[key] = true
    localStorage.setItem('notif_seen', JSON.stringify({ date: today, keys: seen }))
  }

  // 2. Afficher la notification dans la plateforme ET sur le bureau (OS)
  const showToast = (message) => {
    toastNotif.value = message
    setTimeout(() => {
      toastNotif.value = null
    }, 7000)

    // Déclenchement de la notification native
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Belmahi School', {
        body: message,
        icon: '/belmahilogo.jpg', // L'icône de l'école
        requireInteraction: false,
      })
    }
  }

  const checkUpcoming = async () => {
    if (!user?.value?.id) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/notifications/upcoming`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) return
      const data = await res.json()
      const seen = getSeenKeys()

      // Déterminer la langue actuelle pour afficher le bon message
      const currentLang = localStorage.getItem('app_lang') || 'fr'

      for (const notif of data.notifications) {
        if (!seen[notif.key]) {
          markKeySeen(notif.key)

          notifications.value.unshift({
            ...notif,
            id: Date.now() + Math.random(),
            is_read: false,
          })
          unreadCount.value++

          // 3. Sélectionner le message selon la langue (Arabe ou Français)
          const displayMessage =
            currentLang === 'ar' && notif.ar_message ? notif.ar_message : notif.message
          showToast(displayMessage)

          fetch(`${API_URL}/notifications/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              notif_key: notif.key,
              message: displayMessage,
            }),
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadHistory = async () => {
    if (!user?.value?.id) return
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      notifications.value = data
      unreadCount.value = data.filter((n) => !n.is_read).length
    } catch {}
  }

  const markAllRead = () => {
    notifications.value.forEach((n) => {
      n.is_read = true
    })
    unreadCount.value = 0
  }

  const togglePanel = () => {
    showNotifPanel.value = !showNotifPanel.value
    if (showNotifPanel.value) markAllRead()
  }

  onMounted(() => {
    // Demander l'autorisation dès que le composant est monté
    requestOsNotificationPermission()
    loadHistory()
    checkUpcoming()
    pollingInterval = setInterval(checkUpcoming, 60 * 1000)
  })

  onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval)
  })

  return {
    notifications,
    unreadCount,
    showNotifPanel,
    toastNotif,
    togglePanel,
    markAllRead,
  }
}
