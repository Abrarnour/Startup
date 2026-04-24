// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// ─── Service Worker Registration ─────────────────────────────────────────────
// The SW polls notifications every 2 minutes — even when tab is closed.
// This makes notifications appear like YouTube/Instagram desktop notifications.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(async (registration) => {
      console.log('[App] Service Worker registered:', registration.scope)

      // Wait until SW is active
      if (registration.active) {
        syncTokenToSW(registration)
      } else {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          navigator.serviceWorker.ready.then(syncTokenToSW)
        })
      }
    })
    .catch((err) => {
      console.warn('[App] SW registration failed:', err)
    })
}

// ─── Sync current user's token to SW on page load ────────────────────────────
// If the user is already logged in (token in localStorage), tell the SW
// immediately so background polling starts right away.
async function syncTokenToSW(registration) {
  const token = localStorage.getItem('token')
  const apiUrl =
    import.meta.env.VITE_API_URL || 'https://belmahi-school-production.up.railway.app/api'

  if (token && registration?.active) {
    registration.active.postMessage({
      type: 'BELMAHI_SET_STATE',
      payload: { token, apiUrl },
    })
  }
}
