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
router.post('/register', logoUpload.single('logo'), async (req, res) => {
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
  } = req.body
  const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null
  // Validation أساسي
  if (!schoolName || !slug || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')

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

        city || null,
        primaryColor || '#1a73e8',
        secondaryColor || '#f5f5f5',
        JSON.stringify({
          pending_hash: pendingHash,
          admin_first_name: firstName || '', // ← ADD
          admin_last_name: lastName || '',
          logo_url: logoUrl,
          wilaya: wilaya || null,
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

export default router
