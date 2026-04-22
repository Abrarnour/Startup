import { ref, onMounted, onUnmounted } from 'vue'
import {
  getNotifications,
  markNotificationsAsRead,
  deleteNotificationApi,
} from '../services/api.js'

export function useNotifications(user) {
  const notifications = ref([])
  const unreadCount = ref(0)
  const showNotifPanel = ref(false)
  const toastNotif = ref(null)
  let pollingInterval = null

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }
  }

  const showOsNotification = (message) => {
    toastNotif.value = message
    setTimeout(() => {
      toastNotif.value = null
    }, 7000)

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('مدرسة بلماحي', {
        body: message,
        icon: '/belmahilogo.jpg',
      })
    }
  }

  const fetchAndSyncNotifications = async () => {
    if (!user?.value?.id) return
    try {
      const data = await getNotifications()

      // الكشف عن الإشعارات الجديدة لعرضها في نظام التشغيل
      const existingIds = new Set(notifications.value.map((n) => n.id))
      data.forEach((notif) => {
        if (!existingIds.has(notif.id) && !notif.is_read) {
          showOsNotification(notif.message)
        }
      })

      notifications.value = data
      unreadCount.value = data.filter((n) => !n.is_read).length
    } catch (e) {
      console.error(e)
    }
  }

  const togglePanel = async () => {
    showNotifPanel.value = !showNotifPanel.value
    if (showNotifPanel.value && unreadCount.value > 0) {
      // إذا فتحنا القائمة، نعلمها كمقروءة فوراً ونصفر العداد الأحمر
      unreadCount.value = 0
      notifications.value.forEach((n) => (n.is_read = true))
      await markNotificationsAsRead()
    }
  }

  const removeNotification = async (notifId) => {
    try {
      // إزالة من الواجهة فوراً (Optimistic UI Update)
      notifications.value = notifications.value.filter((n) => n.id !== notifId)
      unreadCount.value = notifications.value.filter((n) => !n.is_read).length
      // إرسال طلب الحذف للخادم
      await deleteNotificationApi(notifId)
    } catch (e) {
      console.error('Erreur suppression', e)
    }
  }

  onMounted(() => {
    requestPermission()
    fetchAndSyncNotifications()
    pollingInterval = setInterval(fetchAndSyncNotifications, 30000) // فحص كل 30 ثانية
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
    removeNotification,
  }
}
