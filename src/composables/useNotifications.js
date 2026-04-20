// src/composables/useNotifications.js
import { ref, onMounted, onUnmounted } from 'vue'

const API_URL =
  import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'

export function useNotifications(user) {
  const notifications = ref([]) // notifications du jour
  const unreadCount = ref(0)
  const showNotifPanel = ref(false)
  const toastNotif = ref(null) // toast affiché
  let pollingInterval = null

  // ── Clés déjà affichées aujourd'hui (localStorage) ──
  const getSeenKeys = () => {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('notif_seen')
    if (!raw) return {}
    try {
      const data = JSON.parse(raw)
      // Effacer si c'est un autre jour
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

  // ── Afficher un toast temporaire ──
  const showToast = (message) => {
    toastNotif.value = message
    setTimeout(() => {
      toastNotif.value = null
    }, 7000)
  }

  // ── Requête backend ──
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

      for (const notif of data.notifications) {
        if (!seen[notif.key]) {
          // Nouvelle notification !
          markKeySeen(notif.key)

          // Ajouter à la liste locale
          notifications.value.unshift({
            ...notif,
            id: Date.now() + Math.random(),
            is_read: false,
          })
          unreadCount.value++

          // Afficher le toast
          showToast(notif.message)

          // Sauvegarder en BDD (sans bloquer)
          fetch(`${API_URL}/notifications/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              notif_key: notif.key,
              message: notif.message,
            }),
          }).catch(() => {})
        }
      }
    } catch (e) {
      // Erreur silencieuse (pas de connexion, etc.)
    }
  }

  // ── Charger l'historique du jour ──
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
    loadHistory()
    checkUpcoming() // Check immédiat
    pollingInterval = setInterval(checkUpcoming, 60 * 1000) // Chaque minute
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
