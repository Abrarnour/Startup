// src/composables/useTenant.js
// ─────────────────────────────────────────────────────────────
// Fetches school config from API and applies colors/logo
// Called once in App.vue on load
// ─────────────────────────────────────────────────────────────

import { ref, readonly } from 'vue'
import { tenantSlug } from '../router/index.js'

const tenant = ref(null)
const loading = ref(true)
const error = ref(null)

// Strip trailing /api so we don't get double /api/api in the URL
const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '')

// ── Detect slug — also handles /school/:slug path ─────────────
function resolveSlug() {
  // Try tenantSlug (set at startup from subdomain, path, or query)
  if (tenantSlug) return tenantSlug
  // Try path at runtime (for late navigation to /school/:slug)
  const pathMatch = window.location.pathname.match(/^\/school\/([a-z0-9-]+)(\/|$)/i)
  if (pathMatch) return pathMatch[1].toLowerCase()
  return null
}

export function useTenant() {
  async function loadTenant(slugOverride) {
    const slug = slugOverride || resolveSlug()

    if (!slug) {
      loading.value = false
      return
    }

    try {
      const res = await fetch(`${API}/api/tenant-config`, {
        headers: { 'X-Tenant-Slug': slug },
      })

      if (!res.ok) throw new Error('School not found')

      const data = await res.json()
      tenant.value = data

      // Apply CSS Variables to :root
      applyTheme(data)

      // Update favicon and page title
      document.title = data.school_name_ar || data.school_name || 'School Platform'
      if (data.logo_url) {
        // Build absolute URL for logo
        const logoSrc = data.logo_url.startsWith('http')
          ? data.logo_url
          : `${API.replace('/api', '')}${data.logo_url}`
        const favicon = document.querySelector("link[rel*='icon']")
        if (favicon) favicon.href = logoSrc
      }
    } catch (err) {
      // If this is the demo/product slug, use hardcoded fallback
      // so the product always renders even without a platform_db entry
      if (slug === 'belmahi') {
        tenant.value = {
          slug: 'belmahi',
          school_name: 'Belmahi School',
          school_name_ar: 'مدرسة بلماحي',
          logo_url: null,
          primary_color: '#0255ae',
          secondary_color: '#f4f3ef',
          status: 'active',
        }
        console.warn('useTenant: belmahi not in platform_db — using hardcoded fallback')
      } else {
        error.value = err.message
        console.error('Failed to load tenant config:', err.message)
      }
    } finally {
      loading.value = false
    }
  }

  function markLoaded() {
    loading.value = false
  }

  return {
    tenant: readonly(tenant),
    loading: readonly(loading),
    error: readonly(error),
    tenantSlug: resolveSlug(),
    loadTenant,
    markLoaded,
  }
}

// ── Apply school colors as CSS Variables ─────────────────────
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
