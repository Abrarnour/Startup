import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { platformPool, closePool } from '../db.js'
import { dropTenantDB, provisionTenant } from '../tenantProvisioner.js'
import { invalidateTenantCache } from '../tenantMiddleware.js'

const router = express.Router()

// ── Middleware: التحقق من Super Admin JWT ─────────────────────
function platformAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    // BUG 6 FIX: use PLATFORM_JWT_SECRET (separate from school JWT_SECRET)
    req.platformAdmin = jwt.verify(token, process.env.PLATFORM_JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid platform token' })
  }
}

// ── POST /api/platform/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await platformPool.query(
      'SELECT * FROM platform_admins WHERE email = $1 AND is_active = true',
      [email],
    )
    const admin = result.rows[0]
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    // BUG 6 FIX: sign with PLATFORM_JWT_SECRET
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.PLATFORM_JWT_SECRET,
      { expiresIn: '8h' },
    )
    res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } })
  } catch (err) {
    console.error('Platform login error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/platform/stats ───────────────────────────────────
router.get('/stats', platformAuth, async (req, res) => {
  try {
    const stats = await platformPool.query(`
      SELECT
        COUNT(DISTINCT t.id)                                 AS total_schools,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active')    AS active_schools,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'trial')     AS trial_schools,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'suspended') AS suspended_schools,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'pending')   AS pending_schools,
        COALESCE(SUM(i.amount_dzd) FILTER (WHERE i.status = 'paid'), 0) AS total_revenue
      FROM tenants t
      LEFT JOIN invoices i ON i.tenant_id = t.id
    `)
    res.json(stats.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// ── GET /api/platform/tenants ─────────────────────────────────
router.get('/tenants', platformAuth, async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  let where = []
  let params = []

  if (status) {
    params.push(status)
    where.push(`t.status = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    where.push(`(t.school_name ILIKE $${params.length} OR t.admin_email ILIKE $${params.length})`)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  params.push(limit, offset)

  try {
    const result = await platformPool.query(
      `
      SELECT t.id, t.slug, t.school_name, t.school_name_ar,
             t.admin_email, t.city, t.status, t.plan_id, p.name AS plan_name,
             t.trial_ends_at, t.created_at, t.logo_url, t.primary_color
      FROM tenants t
      LEFT JOIN plans p ON p.id = t.plan_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
      params,
    )

    const countResult = await platformPool.query(
      `SELECT COUNT(*) FROM tenants t ${whereClause}`,
      params.slice(0, -2),
    )

    res.json({ tenants: result.rows, total: parseInt(countResult.rows[0].count) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/platform/tenants/:id/status ───────────────────
router.patch('/tenants/:id/status', platformAuth, async (req, res) => {
  const { status } = req.body
  const valid = ['active', 'suspended', 'cancelled', 'trial', 'pending']
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  try {
    const result = await platformPool.query(
      `UPDATE tenants SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING slug, school_name, status`,
      [status, req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' })

    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, admin_id, action, details)
       VALUES ($1, $2, 'status_changed', $3)`,
      [req.params.id, req.platformAdmin.id, JSON.stringify({ newStatus: status })],
    )

    res.json({ success: true, tenant: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/platform/tenants/:id/approve ────────────────────
// BUG 4 FIX: reads pending_hash from the "details" JSONB column correctly
router.post('/tenants/:id/approve', platformAuth, async (req, res) => {
  try {
    const result = await platformPool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id])
    const tenant = result.rows[0]

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' })
    if (tenant.status !== 'pending') {
      return res.status(400).json({ error: 'Tenant is not in pending state' })
    }

    // BUG 4 FIX: details is a JSONB column; access pending_hash correctly
    const details = tenant.details || {}
    const pendingHash = details.pending_hash

    if (!pendingHash) {
      return res.status(400).json({
        error: 'No password hash found for this tenant. Ask them to re-register.',
      })
    }

    // 1. Provision the school database
    const dbName = await provisionTenant({
      slug: tenant.slug,
      adminEmail: tenant.admin_email,
      adminPasswordHash: pendingHash, // BUG 4 FIX: pass the saved hash directly
      schoolName: tenant.school_name,
      adminFirstName: details.admin_first_name || 'Admin',
      adminLastName: details.admin_last_name || tenant.school_name,
    })

    // 2. Set status='trial', save db_name, promote logo_url from details, clear pending details
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    // Promote logo_url from registration details to the main column before clearing details
    const logoUrl = details.logo_url || tenant.logo_url || null
    const aboutPhoto1 = details.about_photo1 || null
    const aboutPhoto2 = details.about_photo2 || null
    const instagramUrl = details.instagram_url || null
    const whatsappNumber = details.whatsapp_number || null
    const mapLink = details.map_link || null
    const address = details.address || null
    const description = details.description || null
    const openHours = details.open_hours || null

    await platformPool.query(
      `UPDATE tenants
         SET status = 'trial',
             db_name = $1,
             trial_ends_at = $2,
             onboarding_done = true,
             logo_url = $4,
             about_photo1 = $5,
             about_photo2 = $6,
             instagram_url = $7,
             whatsapp_number = $8,
             map_link = $9,
             address = $10,
             description = $11,
             open_hours = $12,
             admin_password_hash = $13,
             details = NULL,
             updated_at = NOW()
       WHERE id = $3`,
      [
        dbName,
        trialEnds,
        tenant.id,
        logoUrl,
        aboutPhoto1,
        aboutPhoto2,
        instagramUrl,
        whatsappNumber,
        mapLink,
        address,
        description,
        openHours,
        pendingHash,
      ],
    )

    // 3. Invalidate tenant cache so middleware picks up new status immediately
    invalidateTenantCache(tenant.slug)

    // 4. Log the action
    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, admin_id, action, details)
       VALUES ($1, $2, 'tenant_approved', $3)`,
      [tenant.id, req.platformAdmin.id, JSON.stringify({ dbName })],
    )

    res.json({
      success: true,
      message: 'Tenant approved. Database created and trial started.',
      dbName,
    })
  } catch (err) {
    console.error('Approval error:', err.message)
    res.status(500).json({ error: 'Failed to approve tenant: ' + err.message })
  }
})

// ── POST /api/platform/invoices ───────────────────────────────
router.post('/invoices', platformAuth, async (req, res) => {
  const { tenantId, planId, amountDzd, dueDate, note, paymentMethod, periodStart, periodEnd } =
    req.body
  const validMethods = ['manual', 'ccp', 'baridimob', 'virement']
  const method = validMethods.includes(paymentMethod) ? paymentMethod : 'manual'
  try {
    const result = await platformPool.query(
      `INSERT INTO invoices (tenant_id, plan_id, amount_dzd, due_date, note, payment_method, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, planId, amountDzd, dueDate, note, method, periodStart || null, periodEnd || null],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/platform/invoices/:id/paid ─────────────────────
router.patch('/invoices/:id/paid', platformAuth, async (req, res) => {
  const { paymentMethod } = req.body
  const validMethods = ['manual', 'ccp', 'baridimob', 'virement']
  const method = validMethods.includes(paymentMethod) ? paymentMethod : 'manual'
  try {
    const result = await platformPool.query(
      `UPDATE invoices SET status = 'paid', paid_at = NOW(), payment_method = $1
       WHERE id = $2 RETURNING *`,
      [method, req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })

    // Get tenant to log
    const inv = result.rows[0]
    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, admin_id, action, details)
       VALUES ($1, $2, 'invoice_paid', $3)`,
      [inv.tenant_id, req.platformAdmin.id, JSON.stringify({ invoiceId: inv.id, method })],
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/platform/tenants/:id/plan ─────────────────────
// SuperAdmin upgrades/downgrades a school's plan
router.patch('/tenants/:id/plan', platformAuth, async (req, res) => {
  const { planId } = req.body
  if (!planId) return res.status(400).json({ error: 'planId required' })
  try {
    const planRes = await platformPool.query('SELECT * FROM plans WHERE id = $1', [planId])
    if (planRes.rows.length === 0) return res.status(404).json({ error: 'Plan not found' })
    const plan = planRes.rows[0]

    const result = await platformPool.query(
      `UPDATE tenants SET plan_id = $1, updated_at = NOW()
       WHERE id = $2 RETURNING slug, school_name, plan_id`,
      [planId, req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' })

    const t = result.rows[0]
    // Invalidate cache
    const { invalidateTenantCache } = await import('../tenantMiddleware.js')
    invalidateTenantCache(t.slug)

    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, admin_id, action, details)
       VALUES ($1, $2, 'plan_changed', $3)`,
      [
        req.params.id,
        req.platformAdmin.id,
        JSON.stringify({ newPlanId: planId, planName: plan.name }),
      ],
    )
    res.json({ success: true, tenant: t, plan })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/platform/plans ───────────────────────────────────
router.get('/plans', platformAuth, async (req, res) => {
  try {
    const result = await platformPool.query(
      'SELECT * FROM plans WHERE is_active = true ORDER BY price_dzd ASC',
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/platform/tenants/:id/plan-status ────────────────
// Returns current plan usage stats for a tenant
router.get('/tenants/:id/plan-status', platformAuth, async (req, res) => {
  try {
    const tenantRes = await platformPool.query(
      `SELECT t.*, p.max_students, p.max_teachers, p.name AS plan_name, p.name_ar AS plan_name_ar, p.price_dzd
       FROM tenants t LEFT JOIN plans p ON p.id = t.plan_id
       WHERE t.id = $1`,
      [req.params.id],
    )
    if (!tenantRes.rows[0]) return res.status(404).json({ error: 'Tenant not found' })
    const tenant = tenantRes.rows[0]
    if (!tenant.db_name) return res.json({ ...tenant, student_count: 0, teacher_count: 0 })

    const { getPool } = await import('../db.js')
    const pool = getPool(tenant.db_name)
    const [sc, tc] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'teacher'`),
    ])
    res.json({
      ...tenant,
      student_count: parseInt(sc.rows[0].count),
      teacher_count: parseInt(tc.rows[0].count),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/platform/tenants/:id ─────────────────────────
router.delete('/tenants/:id', platformAuth, async (req, res) => {
  try {
    const result = await platformPool.query(
      `SELECT slug, db_name, status FROM tenants WHERE id = $1`,
      [req.params.id],
    )
    const tenant = result.rows[0]
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' })

    // Drop the school database if it exists
    if (tenant.db_name) {
      try {
        await dropTenantDB(tenant.db_name)
      } catch (e) {
        console.error(`dropTenantDB warning (non-fatal): ${e.message}`)
      }
    }

    // ✅ Delete logs FIRST, then the tenant
    await platformPool.query(`DELETE FROM platform_logs WHERE tenant_id = $1`, [req.params.id])
    await platformPool.query(`DELETE FROM invoices WHERE tenant_id = $1`, [req.params.id])
    await platformPool.query(`DELETE FROM tenants WHERE id = $1`, [req.params.id])

    // ✅ No log insert after deletion (tenant_id no longer exists)
    res.json({ success: true, message: `Tenant "${tenant.slug}" deleted.` })
  } catch (err) {
    console.error('Delete tenant error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/platform/invoices/summary ───────────────────────
// Per-tenant billing summary: last invoice, next due, trial info
router.get('/invoices/summary', platformAuth, async (req, res) => {
  try {
    const result = await platformPool.query(`
      SELECT
        t.id, t.slug, t.school_name, t.school_name_ar, t.logo_url,
        t.primary_color, t.status AS tenant_status, t.trial_ends_at,
        t.plan_id, p.name AS plan_name, p.name_ar AS plan_name_ar,
        p.price_dzd AS plan_price_dzd,
        COALESCE(stats.total_paid, 0)     AS total_paid,
        COALESCE(stats.total_pending, 0)  AS total_pending,
        stats.last_paid_at,
        stats.next_due_date,
        stats.overdue_count,
        stats.pending_count
      FROM tenants t
      LEFT JOIN plans p ON p.id = t.plan_id
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(amount_dzd) FILTER (WHERE status = 'paid'), 0)     AS total_paid,
          COALESCE(SUM(amount_dzd) FILTER (WHERE status = 'pending'), 0)  AS total_pending,
          MAX(paid_at) FILTER (WHERE status = 'paid')                      AS last_paid_at,
          MIN(due_date) FILTER (WHERE status = 'pending')                  AS next_due_date,
          COUNT(*) FILTER (WHERE status = 'overdue')                       AS overdue_count,
          COUNT(*) FILTER (WHERE status = 'pending')                       AS pending_count
        FROM invoices WHERE tenant_id = t.id
      ) stats ON true
      WHERE t.status NOT IN ('pending', 'cancelled')
      ORDER BY t.school_name
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/platform/invoices ────────────────────────────────
router.get('/invoices', platformAuth, async (req, res) => {
  const { tenant_id, status } = req.query
  let where = []
  let params = []

  if (tenant_id) {
    params.push(tenant_id)
    where.push(`i.tenant_id = $${params.length}`)
  }
  if (status) {
    params.push(status)
    where.push(`i.status = $${params.length}`)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const result = await platformPool.query(
      `
      SELECT
        i.*,
        i.payment_method,
        i.period_start,
        i.period_end,
        t.school_name,
        t.school_name_ar,
        t.slug,
        t.logo_url,
        t.primary_color,
        t.status        AS tenant_status,
        t.trial_ends_at,
        t.plan_id       AS tenant_plan_id,
        p.name          AS plan_name,
        p.name_ar       AS plan_name_ar,
        p.price_dzd     AS plan_price_dzd
      FROM invoices i
      JOIN tenants t ON t.id = i.tenant_id
      LEFT JOIN plans p ON p.id = i.plan_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT 200
    `,
      params,
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
