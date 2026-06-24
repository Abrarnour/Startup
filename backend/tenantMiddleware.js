// backend/tenantMiddleware.js
// ─────────────────────────────────────────────────────────────
// يُحدد هوية المدرسة من كل request
// يُضيف req.tenant و req.db لكل route
//
// BUG 7 FIX (tenantMiddleware — add pending block):
//   Previously only 'suspended' and 'cancelled' were blocked.
//   A tenant with status='pending' (not yet approved by SuperAdmin)
//   could still log in and use the school routes because pending
//   wasn't checked. Now status='pending' returns 403.
// ─────────────────────────────────────────────────────────────

import { platformPool, getPool } from './db.js'

const tenantCache = new Map()
const CACHE_TTL = 60 * 1000 // 1 minute (reduced from 5 to detect approval faster)

async function getTenantBySlug(slug) {
  const cached = tenantCache.get(slug)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data
  }

  const result = await platformPool.query(
    `SELECT t.id, t.slug, t.school_name, t.school_name_ar, t.db_name,
            t.logo_url, t.primary_color, t.secondary_color, t.status, t.plan_id,
            t.trial_ends_at,
            COALESCE(p.max_students, 30)   AS max_students,
            COALESCE(p.max_teachers, 3)    AS max_teachers,
            COALESCE(p.name, 'trial')      AS plan_name,
            COALESCE(p.name_ar, 'تجريبية') AS plan_name_ar,
            COALESCE(p.price_dzd, 0)       AS plan_price_dzd
     FROM tenants t
     LEFT JOIN plans p ON p.id = t.plan_id
     WHERE t.slug = $1`,
    [slug],
  )

  const tenant = result.rows[0] || null
  if (tenant) {
    tenantCache.set(slug, { data: tenant, fetchedAt: Date.now() })
  }
  return tenant
}

export async function tenantMiddleware(req, res, next) {
  try {
    let slug = req.headers['x-tenant-slug'] || req.query.tenant || extractSubdomain(req.hostname)

    if (!slug) {
      return res.status(400).json({ error: 'Tenant not specified' })
    }

    slug = slug.toLowerCase().trim()

    const tenant = await getTenantBySlug(slug)

    if (!tenant) {
      // 'mudar' and 'belmahi' are the built-in demo school — always resolve to project db
      if (slug === 'belmahi' || slug === 'mudar') {
        req.tenant = {
          id: 0,
          slug: slug,
          school_name: 'MUDAR',
          school_name_ar: 'منصة مودار',
          db_name: 'project',
          logo_url: null,
          primary_color: '#7c3aed',
          secondary_color: '#5b21b6',
          status: 'active',
        }
        req.db = getPool('project')
        return next()
      }
      return res.status(404).json({ error: 'School not found' })
    }

    // BUG 7 FIX: block 'pending' tenants — db doesn't exist yet
    if (tenant.status === 'pending') {
      return res.status(403).json({
        error: 'School registration is pending SuperAdmin approval',
      })
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({ error: 'School subscription suspended' })
    }

    if (tenant.status === 'cancelled') {
      return res.status(403).json({ error: 'School subscription cancelled' })
    }

    // db_name must be set (it's empty for pending tenants)
    if (!tenant.db_name) {
      return res.status(503).json({ error: 'School database not provisioned yet' })
    }

    req.tenant = tenant
    req.db = getPool(tenant.db_name) // BUG 5 FIX: all routes use req.db

    next()
  } catch (err) {
    console.error('tenantMiddleware error:', err.message)
    res.status(500).json({ error: 'Server error resolving tenant' })
  }
}

function extractSubdomain(hostname) {
  if (!hostname) return null
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]
  return null
}

export function invalidateTenantCache(slug) {
  tenantCache.delete(slug)
}