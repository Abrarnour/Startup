// backend/routes/onboarding.js
// ─────────────────────────────────────────────────────────────
// POST /api/onboarding/register  → تسجيل مدرسة جديدة
// GET  /api/onboarding/check-slug → التحقق من توفر الـ slug
// ─────────────────────────────────────────────────────────────

import express from 'express'
import { platformPool } from '../db.js'
import { provisionTenant } from '../tenantProvisioner.js'

const router = express.Router()

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

// ── تسجيل مدرسة جديدة (Onboarding Wizard) ───────────────────
router.post('/register', async (req, res) => {
  const {
    schoolName,
    schoolNameAr,
    slug,
    adminEmail,
    adminPassword,
    adminPhone,
    city,
    primaryColor,
    secondaryColor,
    planId,
  } = req.body

  // Validation أساسي
  if (!schoolName || !slug || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')

  try {
    // التحقق من عدم تكرار الـ slug
    const existing = await platformPool.query('SELECT id FROM tenants WHERE slug = $1', [cleanSlug])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Slug already taken' })
    }

    // 1. إنشاء DB المدرسة
    const dbName = await provisionTenant({
      slug: cleanSlug,
      adminEmail,
      adminPassword,
      schoolName,
    })

    // 2. إنشاء سجل في platform_db
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14) // 14 يوم تجريبي

    const insertResult = await platformPool.query(
      `INSERT INTO tenants
         (slug, school_name, school_name_ar, db_name, plan_id, status,
          trial_ends_at, admin_email, admin_phone, city,
          primary_color, secondary_color, onboarding_done)
       VALUES ($1,$2,$3,$4,$5,'trial',$6,$7,$8,$9,$10,$11,true)
       RETURNING id, slug, school_name`,
      [
        cleanSlug,
        schoolName,
        schoolNameAr || schoolName,
        dbName,
        planId || 1,
        trialEnds,
        adminEmail,
        adminPhone || null,
        city || null,
        primaryColor || '#1a73e8',
        secondaryColor || '#f5f5f5',
      ],
    )

    const tenant = insertResult.rows[0]

    // 3. سجل الحدث
    await platformPool.query(
      `INSERT INTO platform_logs (tenant_id, action, details)
       VALUES ($1, 'tenant_created', $2)`,
      [tenant.id, JSON.stringify({ email: adminEmail, plan: planId })],
    )

    res.status(201).json({
      success: true,
      message: 'School registered successfully',
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        schoolName: tenant.school_name,
        loginUrl: `https://${cleanSlug}.yourdomain.dz`,
      },
    })
  } catch (err) {
    console.error('Onboarding error:', err.message)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

export default router
