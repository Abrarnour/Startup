// backend/server.js — Multi-Tenant Version
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// DB
import { platformPool, getPool } from './db.js'

// Middlewares
import { tenantMiddleware } from './tenantMiddleware.js'

// Routes — المدرسة (تحتاج tenantMiddleware)
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import statsRoutes from './routes/stats.js'
import groupsRoutes from './routes/groups.js'
import parentsRoutes from './routes/parents.js'
import studentsRoutes from './routes/students.js'
import materialsRoutes from './routes/materials.js'
import calendarRouter from './routes/calendar.js'
import notificationsRouter from './routes/notifications.js'

// Routes — المنصة (لا تحتاج tenantMiddleware)
import platformRoutes from './routes/platform.js'
import onboardingRoutes from './routes/onboarding.js'
import publicRoutes from './routes/public.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ── Middlewares ───────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Routes المنصة (بدون tenant) ──────────────────────────────
app.use('/api/platform', platformRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/public', publicRoutes)

// ── Route: جلب config المدرسة للـ frontend ───────────────────
app.get('/api/tenant-config', async (req, res) => {
  const slug = req.headers['x-tenant-slug'] || req.query.tenant || extractSubdomain(req.hostname)
  if (!slug) return res.status(400).json({ error: 'No tenant' })

  try {
    const result = await platformPool.query(
      `SELECT slug, school_name, school_name_ar, logo_url, primary_color, secondary_color, status
       FROM tenants WHERE slug = $1`,
      [slug.toLowerCase()],
    )
    if (!result.rows[0]) {
      // belmahi is the built-in demo — always return hardcoded config
      if (slug === 'belmahi') {
        return res.json({
          slug: 'belmahi',
          school_name: 'Belmahi School',
          school_name_ar: 'مدرسة بلماحي',
          logo_url: null,
          primary_color: '#0255ae',
          secondary_color: '#f4f3ef',
          status: 'active',
        })
      }
      return res.status(404).json({ error: 'School not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Routes المدرسة (مع tenantMiddleware) ─────────────────────
app.use('/api/auth', tenantMiddleware, authRoutes)
app.use('/api/courses', tenantMiddleware, coursesRoutes)
app.use('/api/stats', tenantMiddleware, statsRoutes)
app.use('/api/groups', tenantMiddleware, groupsRoutes)
app.use('/api/parents', tenantMiddleware, parentsRoutes)
app.use('/api/students', tenantMiddleware, studentsRoutes)
app.use('/api/materials', tenantMiddleware, materialsRoutes)
app.use('/api/calendar', tenantMiddleware, calendarRouter)
app.use('/api/notifications', tenantMiddleware, notificationsRouter)

// ── Serve Frontend ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist')))
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// ── Helper: subdomain extractor ───────────────────────────────
function extractSubdomain(hostname) {
  if (!hostname) return null
  const parts = hostname.split('.')
  if (parts.length >= 3) return parts[0]
  return null
}

// ── Helper: get all active tenant pools ──────────────────────
async function getActiveTenants() {
  try {
    const result = await platformPool.query(
      `SELECT db_name FROM tenants WHERE status IN ('active', 'trial')`,
    )
    return result.rows
  } catch (err) {
    console.error('Failed to fetch tenants for cron:', err.message)
    return []
  }
}

// ── Auto-seed: ensure the demo Belmahi school exists in platform_db ──
// This runs once at startup. If 'belmahi' is already in tenants it does nothing.
// This is what makes /school/belmahi work out of the box without manual SQL.
async function seedDemoTenant() {
  try {
    await platformPool.query(`
      INSERT INTO tenants
        (slug, school_name, school_name_ar, logo_url, primary_color, secondary_color,
         db_name, status, admin_email, admin_phone, city, country, onboarding_done)
      VALUES
        ('belmahi', 'Belmahi School', 'مدرسة بلماحي',
         NULL, '#0255ae', '#f4f3ef',
         'project', 'active',
         'admin@belmahi.dz', '0550000001', 'Oran', 'DZ', true)
      ON CONFLICT (slug) DO UPDATE
        SET db_name        = EXCLUDED.db_name,
            status         = EXCLUDED.status,
            school_name    = EXCLUDED.school_name,
            school_name_ar = EXCLUDED.school_name_ar,
            primary_color  = EXCLUDED.primary_color,
            updated_at     = NOW()
    `)
    console.log('✅ Demo tenant "belmahi" seeded → project')
  } catch (err) {
    console.error('⚠️  seedDemoTenant error (non-fatal):', err.message)
  }
}

// ── Cron: Upcoming session notifications (every minute) ───────
const generateUpcomingNotifications = async () => {
  const tenants = await getActiveTenants()

  for (const tenant of tenants) {
    const pool = getPool(tenant.db_name)
    try {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const now = new Date()
      const targetTime = new Date(now.getTime() + 15 * 60 * 1000)
      const targetDay = days[targetTime.getDay()]
      const hours = String(targetTime.getHours()).padStart(2, '0')
      const minutes = String(targetTime.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}:00`

      const sessions = await pool.query(
        `SELECT
          g.id AS group_id, g.group_name, g.salle, g.session_start_time,
          c.title AS course_title,
          t.id AS teacher_id, t.name AS teacher_name, t.last_name AS teacher_last_name
         FROM groups g
         JOIN courses c ON g.course_id = c.id
         LEFT JOIN users t ON c.teacher_id = t.id
         WHERE g.day_of_week = $1
           AND g.session_start_time = $2
           AND g.is_active = true`,
        [targetDay, timeString],
      )

      for (const session of sessions.rows) {
        const today = now.toISOString().split('T')[0]
        const notifKey = `session_15min_${session.group_id}_${today}_${timeString.replace(/:/g, '')}`
        const roomStr = session.salle ? `القاعة: ${session.salle}` : 'القاعة غير محددة'

        const students = await pool.query(
          `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
          [session.group_id],
        )
        for (const st of students.rows) {
          const msg = `⏰ درس "${session.course_title}" يبدأ خلال 15 دقيقة — ${roomStr}`
          await pool.query(
            `INSERT INTO notifications (user_id, notif_key, message, type)
             VALUES ($1, $2, $3, 'reminder')
             ON CONFLICT (notif_key) DO NOTHING`,
            [`${st.student_id}`, `${notifKey}_s${st.student_id}`, msg],
          )
        }

        for (const st of students.rows) {
          const parents = await pool.query(
            `SELECT parent_id FROM parent_students WHERE student_id = $1`,
            [st.student_id],
          )
          for (const p of parents.rows) {
            const msg = `⏰ درس ابنك "${session.course_title}" يبدأ خلال 15 دقيقة — ${roomStr}`
            await pool.query(
              `INSERT INTO notifications (user_id, notif_key, message, type)
               VALUES ($1, $2, $3, 'reminder')
               ON CONFLICT (notif_key) DO NOTHING`,
              [p.parent_id, `${notifKey}_p${p.parent_id}`, msg],
            )
          }
        }

        if (session.teacher_id) {
          const msg = `⏰ حصتك "${session.course_title}" تبدأ خلال 15 دقيقة — ${roomStr}`
          await pool.query(
            `INSERT INTO notifications (user_id, notif_key, message, type)
             VALUES ($1, $2, $3, 'reminder')
             ON CONFLICT (notif_key) DO NOTHING`,
            [session.teacher_id, `${notifKey}_t${session.teacher_id}`, msg],
          )
        }

        const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`)
        for (const admin of admins.rows) {
          const msg = `⏰ درس "${session.course_title}" للأستاذ ${session.teacher_last_name} يبدأ خلال 15 دقيقة — ${roomStr}`
          await pool.query(
            `INSERT INTO notifications (user_id, notif_key, message, type)
             VALUES ($1, $2, $3, 'reminder')
             ON CONFLICT (notif_key) DO NOTHING`,
            [admin.id, `${notifKey}_a${admin.id}`, msg],
          )
        }
      }
    } catch (err) {
      console.error(`Cron notifications error for ${tenant.db_name}:`, err.message)
    }
  }
}

// ── Cron: Attendance notifications (every minute) ─────────────
const generateAttendanceNotifications = async () => {
  const tenants = await getActiveTenants()

  for (const tenant of tenants) {
    const pool = getPool(tenant.db_name)
    try {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const now = new Date()
      const currentDay = days[now.getDay()]
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}:00`
      const today = now.toISOString().split('T')[0]

      const sessions = await pool.query(
        `SELECT
           g.id        AS group_id,
           g.group_name,
           g.salle,
           g.session_end_time,
           c.title     AS course_title
         FROM groups g
         JOIN courses c ON g.course_id = c.id
         WHERE g.day_of_week      = $1
           AND g.session_end_time = $2
           AND g.is_active        = true`,
        [currentDay, timeString],
      )

      for (const session of sessions.rows) {
        const enrolled = await pool.query(
          `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
          [session.group_id],
        )

        for (const { student_id } of enrolled.rows) {
          const scanCheck = await pool.query(
            `SELECT id FROM attendance_log
             WHERE student_id = $1 AND group_id = $2 AND scanned_at::date = $3
             LIMIT 1`,
            [student_id, session.group_id, today],
          )
          const isPresent = scanCheck.rows.length > 0

          const studentRow = await pool.query(`SELECT name, last_name FROM users WHERE id = $1`, [
            student_id,
          ])
          if (studentRow.rows.length === 0) continue
          const { name, last_name } = studentRow.rows[0]

          const parents = await pool.query(
            `SELECT parent_id FROM parent_students WHERE student_id = $1`,
            [student_id],
          )

          for (const { parent_id } of parents.rows) {
            const notifKey = isPresent
              ? `att_present_${session.group_id}_${student_id}_${today}`
              : `att_absent_${session.group_id}_${student_id}_${today}`

            const msg = isPresent
              ? `✅ ابنك/ابنتك ${name} ${last_name} كان حاضراً في درس "${session.course_title}" اليوم.`
              : `❌ ابنك/ابنتك ${name} ${last_name} كان غائباً عن درس "${session.course_title}" اليوم.`

            const type = isPresent ? 'success' : 'warning'

            await pool.query(
              `INSERT INTO notifications (user_id, notif_key, message, type)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (notif_key) DO NOTHING`,
              [parent_id, notifKey, msg, type],
            )
          }
        }
      }
    } catch (err) {
      console.error(`Cron attendance error for ${tenant.db_name}:`, err.message)
    }
  }
}

// ── Monthly payment reset (1st of each month) ─────────────────
const runCircleResetIfFirstOfMonth = async () => {
  const today = new Date()
  if (today.getDate() !== 1) return

  const tenants = await getActiveTenants()
  for (const tenant of tenants) {
    const pool = getPool(tenant.db_name)
    try {
      const result = await pool.query(
        `UPDATE group_students SET payment_status = 'pending' WHERE payment_status = 'paid'`,
      )
      if (result.rowCount > 0) {
        console.log(`🔄 CIRCLE RESET [${tenant.db_name}]: ${result.rowCount} students reset`)
      }
    } catch (err) {
      console.error(`Circle reset error for ${tenant.db_name}:`, err.message)
    }
  }
}

// ── Start cron jobs ───────────────────────────────────────────
setInterval(generateUpcomingNotifications, 60 * 1000)
setInterval(generateAttendanceNotifications, 60 * 1000)
setInterval(runCircleResetIfFirstOfMonth, 60 * 60 * 1000)

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Platform API: /api/platform`)
  console.log(`🏫 School API:   /api/auth  (+ X-Tenant-Slug header)`)
  console.log(`⏰ Cron jobs started`)
  // Seed the demo tenant after DB is ready
  seedDemoTenant()
})

export default app
