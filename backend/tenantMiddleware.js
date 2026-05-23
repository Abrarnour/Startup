// backend/tenantMiddleware.js
// ─────────────────────────────────────────────────────────────
// يُحدد هوية المدرسة من كل request
// يُضيف req.tenant و req.db لكل route
//
// طرق التعرف على المدرسة:
//   1. Header:     X-Tenant-Slug: belmahi
//   2. Subdomain:  belmahi.yourdomain.dz
//   3. Query:      ?tenant=belmahi  (للتطوير فقط)
// ─────────────────────────────────────────────────────────────

import { platformPool, getPool } from './db.js'

// Cache لبيانات المدارس (تُحدَّث كل 5 دقائق)
const tenantCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getTenantBySlug(slug) {
  const cached = tenantCache.get(slug)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data
  }

  const result = await platformPool.query(
    `SELECT id, slug, school_name, school_name_ar, db_name,
            logo_url, primary_color, secondary_color, status, plan_id
     FROM tenants WHERE slug = $1`,
    [slug],
  )

  const tenant = result.rows[0] || null
  if (tenant) {
    tenantCache.set(slug, { data: tenant, fetchedAt: Date.now() })
  }
  return tenant
}

// ── Middleware الرئيسي ────────────────────────────────────────
export async function tenantMiddleware(req, res, next) {
  try {
    // 1. استخرج الـ slug
    let slug = req.headers['x-tenant-slug'] || req.query.tenant || extractSubdomain(req.hostname)

    if (!slug) {
      return res.status(400).json({ error: 'Tenant not specified' })
    }

    slug = slug.toLowerCase().trim()

    // 2. جلب بيانات المدرسة
    const tenant = await getTenantBySlug(slug)

    if (!tenant) {
      return res.status(404).json({ error: 'School not found' })
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({ error: 'School subscription suspended' })
    }

    if (tenant.status === 'cancelled') {
      return res.status(403).json({ error: 'School subscription cancelled' })
    }

    // 3. أضف للـ request
    req.tenant = tenant
    req.db = getPool(tenant.db_name) // pool خاص بهذه المدرسة

    next()
  } catch (err) {
    console.error('tenantMiddleware error:', err.message)
    res.status(500).json({ error: 'Server error resolving tenant' })
  }
}

// ── استخراج subdomain من الـ hostname ───────────────────────
function extractSubdomain(hostname) {
  if (!hostname) return null
  const parts = hostname.split('.')
  // belmahi.yourdomain.dz → ['belmahi','yourdomain','dz'] → parts[0]
  // localhost → لا يوجد subdomain
  if (parts.length >= 3) return parts[0]
  return null
}

// ── مسح الـ cache لمدرسة (بعد تعديل بياناتها) ───────────────
export function invalidateTenantCache(slug) {
  tenantCache.delete(slug)
}
