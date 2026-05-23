// src/composables/useTenant.js
// ─────────────────────────────────────────────────────────────
// يجلب config المدرسة من الـ API ويطبق الألوان والشعار
// يُستدعى مرة واحدة في App.vue عند التحميل
// ─────────────────────────────────────────────────────────────

import { ref, readonly } from 'vue'
import { tenantSlug } from '../router/index.js'

const tenant = ref(null)
const loading = ref(true)
const error = ref(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useTenant() {
  async function loadTenant() {
    if (!tenantSlug) {
      loading.value = false
      return
    }

    try {
      const res = await fetch(`${API}/api/tenant-config`, {
        headers: { 'X-Tenant-Slug': tenantSlug },
      })

      if (!res.ok) throw new Error('School not found')

      const data = await res.json()
      tenant.value = data

      // ── تطبيق CSS Variables على الـ :root ────────────────
      applyTheme(data)

      // ── تحديث favicon وعنوان الصفحة ──────────────────────
      document.title = data.school_name_ar || data.school_name
      if (data.logo_url) {
        const favicon = document.querySelector("link[rel*='icon']")
        if (favicon) favicon.href = data.logo_url
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to load tenant config:', err.message)
    } finally {
      loading.value = false
    }
  }

  return {
    tenant: readonly(tenant),
    loading: readonly(loading),
    error: readonly(error),
    tenantSlug,
    loadTenant,
  }
}

// ── تطبيق ألوان المدرسة كـ CSS Variables ─────────────────────
function applyTheme(config) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.primary_color || '#1a73e8')
  root.style.setProperty('--color-secondary', config.secondary_color || '#f0f4ff')
  root.style.setProperty('--color-primary-dark', darkenColor(config.primary_color || '#1a73e8', 20))
  root.style.setProperty(
    '--color-primary-light',
    lightenColor(config.primary_color || '#1a73e8', 40),
  )
}

// ── Hex color helpers ─────────────────────────────────────────
function darkenColor(hex, amount) {
  return shiftColor(hex, -amount)
}
function lightenColor(hex, amount) {
  return shiftColor(hex, amount)
}
function shiftColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
