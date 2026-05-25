// backend/routes/platform.js
// ─────────────────────────────────────────────────────────────
// Super-Admin API — لوحة تحكم المنصة فقط
//
// POST   /api/platform/login             → تسجيل دخول SuperAdmin
// GET    /api/platform/stats             → إحصائيات عامة
// GET    /api/platform/tenants           → قائمة كل المدارس
// PATCH  /api/platform/tenants/:id/status→ تفعيل/تعليق
// POST   /api/platform/tenants/:id/approve → الموافقة + إنشاء DB
// GET    /api/platform/invoices          → كل الفواتير
// POST   /api/platform/invoices          → إنشاء فاتورة
//
// BUG 4 FIX: approve endpoint now reads pending_hash from tenant.details
//            column (which is where onboarding.js saves it). Previously
//            it read tenant.details.pending_hash but "details" column
//            didn't exist → crash with "column details does not exist".
//
// BUG 6 FIX: platformAuth uses PLATFORM_JWT_SECRET (not JWT_SECRET).
//            The original .env was missing PLATFORM_JWT_SECRET entirely,
//            so every SuperAdmin request returned 401. Now fixed in .env too.
// ─────────────────────────────────────────────────────────────

import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { platformPool, closePool } from '../db.js'
import { dropTenantDB, provisionTenant } from '../tenantProvisioner.js'

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
        COUNT(*)                                          AS total_schools,
        COUNT(*) FILTER (WHERE status = 'active')        AS active_schools,
        COUNT(*) FILTER (WHERE status = 'trial')         AS trial_schools,
        COUNT(*) FILTER (WHERE status = 'suspended')     AS suspended_schools,
        COUNT(*) FILTER (WHERE status = 'pending')       AS pending_schools,
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
    })

    // 2. Set status='trial', save db_name, clear pending details
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    await platformPool.query(
      `UPDATE tenants
         SET status = 'trial',
             db_name = $1,
             trial_ends_at = $2,
             onboarding_done = true,
             details = NULL,
             updated_at = NOW()
       WHERE id = $3`,
      [dbName, trialEnds, tenant.id],
    )

    // 3. Log the action
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
  const { tenantId, planId, amountDzd, dueDate, note } = req.body
  try {
    const result = await platformPool.query(
      `INSERT INTO invoices (tenant_id, plan_id, amount_dzd, due_date, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, planId, amountDzd, dueDate, note],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/platform/invoices ────────────────────────────────
router.get('/invoices', platformAuth, async (req, res) => {
  try {
    const result = await platformPool.query(`
      SELECT i.*, t.school_name, t.slug, p.name AS plan_name
      FROM invoices i
      JOIN tenants t ON t.id = i.tenant_id
      LEFT JOIN plans p ON p.id = i.plan_id
      ORDER BY i.created_at DESC
      LIMIT 100
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
