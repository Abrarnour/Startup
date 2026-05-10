// backend/server.js
import pool from './db.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import statsRoutes from './routes/stats.js'
import groupsRoutes from './routes/groups.js'
import parentsRoutes from './routes/parents.js'
import publicRoutes from './routes/public.js'
import studentsRoutes from './routes/students.js'
import materialsRoutes from './routes/materials.js'
import calendarRouter from './routes/calendar.js'
import notificationsRouter from './routes/notifications.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ─── Monthly payment reset ───────────────────────────────────────────────────
const runCircleResetIfFirstOfMonth = async () => {
  const today = new Date()
  if (today.getDate() !== 1) return

  try {
    const result = await pool.query(
      `UPDATE group_students SET payment_status = 'pending' WHERE payment_status = 'paid'`,
    )
    if (result.rowCount > 0) {
      console.log(`🔄 CIRCLE RESET: ${result.rowCount} students reset to non-paid (1st of month)`)
    }
  } catch (err) {
    console.error('Circle reset error:', err.message)
  }
}

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/calendar', calendarRouter)
app.use('/api/students', studentsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/parents', parentsRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/notifications', notificationsRouter)
app.use('/uploads', express.static('./uploads'))
app.get('/', (req, res) => {
  res.json({
    message: '🎓 API Portail Belmahi School - Serveur actif !',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth/login',
      courses: '/api/courses',
      stats: '/api/stats',
      groups: '/api/groups',
      parents: '/api/parents',
      public: '/api/public/courses',
      materials: '/api/materials',
      notifications: '/api/notifications',
    },
  })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// ─── Notification cron: runs every minute ────────────────────────────────────
// Finds sessions starting in exactly 15 minutes and notifies all stakeholders
const generateUpcomingNotifications = async () => {
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
      // ✅ FIX: Use a per-group per-day notif_key that is globally unique
      const notifKey = `session_15min_${session.group_id}_${today}_${timeString.replace(/:/g, '')}`
      const roomStr = session.salle ? `القاعة: ${session.salle}` : 'القاعة غير محددة'

      // 1. Student notifications
      const students = await pool.query(
        `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
        [session.group_id],
      )
      for (const st of students.rows) {
        const msg = `⏰ درس "${session.course_title}" يبدأ خلال 15 دقيقة — ${roomStr}`
        // ✅ FIX: ON CONFLICT must specify the column — use (notif_key) which is globally UNIQUE
        await pool.query(
          `INSERT INTO notifications (user_id, notif_key, message, type)
           VALUES ($1, $2, $3, 'reminder')
           ON CONFLICT (notif_key) DO NOTHING`,
          [`${st.student_id}`, `${notifKey}_s${st.student_id}`, msg],
        )
      }

      // 2. Parent notifications
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

      // 3. Teacher notification
      if (session.teacher_id) {
        const msg = `⏰ حصتك "${session.course_title}" تبدأ خلال 15 دقيقة — ${roomStr}`
        await pool.query(
          `INSERT INTO notifications (user_id, notif_key, message, type)
           VALUES ($1, $2, $3, 'reminder')
           ON CONFLICT (notif_key) DO NOTHING`,
          [session.teacher_id, `${notifKey}_t${session.teacher_id}`, msg],
        )
      }

      // 4. Admin notifications
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
  } catch (error) {
    console.error('Cron Job Error (Notifications):', error)
  }
}

setInterval(generateUpcomingNotifications, 60 * 1000)
console.log('⏰ Notification engine started — polling local DB every minute.')

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📡 CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`)
})

export default app
