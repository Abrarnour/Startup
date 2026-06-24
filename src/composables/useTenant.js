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
  // Skip platform routes — they handle their own auth
  const path = window.location.pathname
  if (path.startsWith('/platform') || path.startsWith('/register-school')) return null
  // Root or unknown path → default to MUDAR demo
  return 'mudar'
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
        // Try by ID first, then by rel selector
        const favicon =
          document.getElementById('dynamic-favicon') || document.querySelector("link[rel*='icon']")
        if (favicon) {
          favicon.href = logoSrc + '?v=' + Date.now()
        }
      }
    } catch (err) {
      if (slug === 'belmahi' || slug === 'mudar') {
        const fallback = {
          slug: slug,
          school_name: 'MUDAR',
          school_name_ar: 'منصة مودار',
          logo_url: null,
          primary_color: '#7c3aed',
          secondary_color: '#5b21b6',
          status: 'active',
          about_photo1: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=85',
          about_photo2: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=85',
          admin_email: 'support@mudar.dz',
          city: 'Oran',
          admin_phone: null,
          instagram_url: null,
          whatsapp_number: null,
          map_link: null,
          address: null,
        }
        tenant.value = fallback
        applyTheme(fallback)
        console.warn(`useTenant: ${slug} not in platform_db — using MUDAR fallback`)
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
  const p = config.primary_color || '#7c3aed'
  const s = config.secondary_color || '#5b21b6'

  // Parse hex to HSL for hue-aware gradients
  function hexToHsl(hex) {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
    const max = Math.max(r,g,b), min = Math.min(r,g,b)
    let h, s, l = (max+min)/2
    if (max===min) { h=s=0 } else {
      const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min)
      switch(max){ case r:h=((g-b)/d+(g<b?6:0))/6;break; case g:h=((b-r)/d+2)/6;break; case b:h=((r-g)/d+4)/6;break }
    }
    return [h*360, s*100, l*100]
  }
  function hslToHex(h,s,l) {
    h/=360; s/=100; l/=100
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p }
    let r,g,b
    if(s===0){r=g=b=l}else{const q=l<0.5?l*(1+s):l+s-l*s,pp=2*l-q;r=hue2rgb(pp,q,h+1/3);g=hue2rgb(pp,q,h);b=hue2rgb(pp,q,h-1/3)}
    return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')
  }

  const [ph, ps, pl] = hexToHsl(p)

  // 4 gradient stops: dark deep → slightly shifted → base → bright light
  // slight hue rotation (+5°) on lighter stops for organic feel
  const stop1 = hslToHex(ph - 5,  ps + 5,  Math.max(5,  pl - 28))   // very dark, slightly cooler
  const stop2 = hslToHex(ph,       ps,      Math.max(15, pl - 12))   // dark base
  const stop3 = hslToHex(ph + 3,   ps - 5,  pl)                      // exact base
  const stop4 = hslToHex(ph + 8,   ps - 15, Math.min(85, pl + 22))   // lighter, warmer hue

  // secondary 4-stop
  const [sh, ss, sl] = hexToHsl(s)
  const ss1 = hslToHex(sh - 5, ss + 5,  Math.max(5,  sl - 28))
  const ss2 = hslToHex(sh,      ss,      Math.max(15, sl - 12))
  const ss3 = hslToHex(sh + 3,  ss - 5,  sl)
  const ss4 = hslToHex(sh + 8,  ss - 15, Math.min(85, sl + 22))

  const g4  = `linear-gradient(135deg, ${stop1} 0%, ${stop2} 33%, ${stop3} 66%, ${stop4} 100%)`
  const g4y = `linear-gradient(155deg, ${stop1} 0%, ${stop2} 30%, ${stop3} 65%, ${stop4} 100%)`  // steeper angle variant
  const sg4 = `linear-gradient(135deg, ${ss1} 0%, ${ss2} 33%, ${ss3} 66%, ${ss4} 100%)`

  root.style.setProperty('--color-primary',          p)
  root.style.setProperty('--color-secondary',        s)
  root.style.setProperty('--color-primary-dark',     stop1)
  root.style.setProperty('--color-primary-mid',      stop2)
  root.style.setProperty('--color-primary-light',    stop4)
  root.style.setProperty('--color-primary-lighter',  hslToHex(ph+10, ps-20, Math.min(92, pl+35)))
  root.style.setProperty('--gradient-primary-4',     g4)
  root.style.setProperty('--gradient-primary-4y',    g4y)
  root.style.setProperty('--gradient-secondary-4',   sg4)
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