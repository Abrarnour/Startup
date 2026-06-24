// backend/routes/onboarding.js
// ─────────────────────────────────────────────────────────────
// POST /api/onboarding/register  → تسجيل مدرسة جديدة (حالة pending)
// GET  /api/onboarding/check-slug → التحقق من توفر الـ slug
//
// BUG 1 FIX: removed duplicate SchoolRegister form — only OnboardingWizard
//            calls this endpoint now (SchoolRegister.vue should be removed)
//
// BUG 2 FIX: registration now saves status='pending' + hashed password
//            stored in a details JSONB column. NO database is created here.
//            The SuperAdmin must click "Approve" to trigger provisionTenant().
// ─────────────────────────────────────────────────────────────

import express from 'express'
import { platformPool } from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logos')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`)
  },
})
const logoUpload = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 } })
const multiUpload = multer({ storage: logoStorage, limits: { fileSize: 5 * 1024 * 1024 } }).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'about_photo1', maxCount: 1 },
  { name: 'about_photo2', maxCount: 1 },
])
const router = express.Router()
router.get('/plans', async (req, res) => {
  try {
    const result = await platformPool.query(
      'SELECT id, name, name_ar, price_dzd, max_students, max_teachers, features FROM plans WHERE is_active = true ORDER BY price_dzd ASC',
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// ── التحقق من توفر الـ slug ───────────────────────────────────
router.get('/check-slug', async (req, res) => {
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'slug required' })

  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (clean.length < 3) return res.json({ available: false, reason: 'Too short' })

  const reserved = ['admin', 'api', 'www', 'app', 'platform', 'support']
  if (reserved.includes(clean)) return res.json({ available: false, reason: 'Reserved' })

  const result = await platformPool.query('SELECT id FROM tenants WHERE slug = $1', [clean])
  res.json({ available: result.rows.length === 0, slug: clean })
})

// ── تسجيل مدرسة جديدة → status = 'pending', NO DB created yet ──
router.post('/register', multiUpload, async (req, res) => {
  const {
    schoolName,
    schoolNameAr,
    slug,
    adminEmail,
    adminPassword,
    adminPhone,
    city,
    firstName,
    lastName,
    wilaya,
    primaryColor,
    secondaryColor,
    planId,
    instagram_url,
    whatsapp_number,
    map_link,
    address,
    description,
    open_hours,
  } = req.body
  const logoUrl = req.files?.logo?.[0] ? `/uploads/logos/${req.files.logo[0].filename}` : null
  const aboutPhoto1Url = req.files?.about_photo1?.[0]
    ? `/uploads/logos/${req.files.about_photo1[0].filename}`
    : null
  const aboutPhoto2Url = req.files?.about_photo2?.[0]
    ? `/uploads/logos/${req.files.about_photo2[0].filename}`
    : null
  // Validation أساسي
  if (!schoolName || !slug || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  // Derive city from wilaya when city not provided (wizard sends wilaya like "31 - Oran")
  const effectiveCity = city || (wilaya ? wilaya.replace(/^\d+\s*-\s*/, '').trim() : null)

  try {
    // التحقق من عدم تكرار الـ slug أو البريد
    const existing = await platformPool.query(
      'SELECT id FROM tenants WHERE slug = $1 OR admin_email = $2',
      [cleanSlug, adminEmail],
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Slug or email already registered' })
    }

    // BUG 2 FIX: hash the password NOW and store it — do NOT provision DB yet
    const pendingHash = await bcrypt.hash(adminPassword, 10)

    // Insert with status='pending' and NO db_name (will be filled on approval)
    const insertResult = await platformPool.query(
      `INSERT INTO tenants
         (slug, school_name, school_name_ar, db_name, plan_id, status,
          admin_email, admin_phone, city,
          primary_color, secondary_color, onboarding_done,
          details)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10,false,$11)
       RETURNING id, slug, school_name`,
      [
        cleanSlug,
        schoolName,
        schoolNameAr || schoolName,

        '', // db_name empty until approved
        planId || 1,
        adminEmail,
        adminPhone || null,

        effectiveCity || null,
        primaryColor || '#1a73e8',
        secondaryColor || '#f5f5f5',
        JSON.stringify({
          pending_hash: pendingHash,
          admin_first_name: firstName || '',
          admin_last_name: lastName || '',
          logo_url: logoUrl,
          about_photo1: aboutPhoto1Url,
          about_photo2: aboutPhoto2Url,
          wilaya: wilaya || null,
          instagram_url: instagram_url || null,
          whatsapp_number: whatsapp_number || null,
          map_link: map_link || null,
          address: address || null,
          description: description || null,
          open_hours: open_hours || null,
        }),
      ],
    )

    const tenant = insertResult.rows[0]

    // سجل الحدث
    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, action, details)
       VALUES ($1, 'tenant_registered_pending', $2)`,
      [tenant.id, JSON.stringify({ email: adminEmail })],
    )

    res.status(201).json({
      success: true,
      message: 'Registration received. Awaiting SuperAdmin approval.',
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        schoolName: tenant.school_name,
        status: 'pending',
      },
    })
  } catch (err) {
    console.error('Onboarding error:', err.message)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

// Middleware – validate client JWT (stored as client_token in localStorage)
function clientAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    req.clientTenant = jwt.verify(token, process.env.PLATFORM_JWT_SECRET + '_client')
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /api/onboarding/client-login
router.post('/client-login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const result = await platformPool.query('SELECT * FROM tenants WHERE admin_email = $1', [email])
    const tenant = result.rows[0]
    if (!tenant) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    // Password is stored in details.pending_hash (pre-approval) OR in admin_password_hash (post-approval)
    const details = tenant.details || {}
    const hash = details.pending_hash || tenant.admin_password_hash || null

    if (!hash) {
      return res.status(401).json({ error: 'Compte introuvable ou mot de passe non défini' })
    }

    const valid = await bcrypt.compare(password, hash)
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const token = jwt.sign(
      { tenantId: tenant.id, email: tenant.admin_email, slug: tenant.slug },
      process.env.PLATFORM_JWT_SECRET + '_client',
      { expiresIn: '24h' },
    )

    res.json({
      token,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        school_name: tenant.school_name,
        school_name_ar: tenant.school_name_ar,
        status: tenant.status,
        admin_email: tenant.admin_email,
        logo_url: tenant.logo_url || details.logo_url || null,
        primary_color: tenant.primary_color,
        city: tenant.city,
        trial_ends_at: tenant.trial_ends_at,
        created_at: tenant.created_at,
      },
    })
  } catch (err) {
    console.error('Client login error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/onboarding/client-status
router.get('/client-status', clientAuth, async (req, res) => {
  try {
    const result = await platformPool.query(
      `SELECT t.*, p.name AS plan_name, p.name_ar AS plan_name_ar, p.price_dzd
       FROM tenants t
       LEFT JOIN plans p ON p.id = t.plan_id
       WHERE t.id = $1`,
      [req.clientTenant.tenantId],
    )
    const tenant = result.rows[0]
    if (!tenant) return res.status(404).json({ error: 'Not found' })

    const invoices = await platformPool.query(
      `SELECT i.*, p.name AS plan_name, p.name_ar AS plan_name_ar
       FROM invoices i
       LEFT JOIN plans p ON p.id = i.plan_id
       WHERE i.tenant_id = $1
       ORDER BY i.created_at DESC`,
      [tenant.id],
    )

    const details = tenant.details || {}
    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        school_name: tenant.school_name,
        school_name_ar: tenant.school_name_ar,
        status: tenant.status,
        admin_email: tenant.admin_email,
        logo_url: tenant.logo_url || details.logo_url || null,
        primary_color: tenant.primary_color,
        city: tenant.city,
        trial_ends_at: tenant.trial_ends_at,
        created_at: tenant.created_at,
        plan_name: tenant.plan_name,
        plan_name_ar: tenant.plan_name_ar,
        price_dzd: tenant.price_dzd,
        db_name: tenant.db_name || null,
        onboarding_done: tenant.onboarding_done,
      },
      invoices: invoices.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
