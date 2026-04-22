// =============================================
// STEP 3: UPDATE server.js
// backend/server.js
// Add materials route and serve static files
// =============================================
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
import materialsRoutes from './routes/materials.js' // ⭐ NEW
import calendarRouter from './routes/calendar.js'
import notificationsRouter from './routes/notifications.js' // ⬅️ AJOUTER

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const runCircleResetIfFirstOfMonth = async () => {
  const today = new Date()

  // Only run on the 1st of the month
  if (today.getDate() !== 1) return

  try {
    const result = await pool.query(
      `UPDATE group_students
       SET payment_status = 'pending'
       WHERE payment_status = 'paid'`,
    )
    if (result.rowCount > 0) {
      console.log(`🔄 CIRCLE RESET: ${result.rowCount} students reset to non-paid (1st of month)`)
    }
  } catch (err) {
    console.error('Circle reset error:', err.message)
  }
}

// Run check every 24 hours at midnight
const scheduleCircleReset = () => {
  // Calculate ms until next midnight
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0) // next midnight
  const msUntilMidnight = midnight - now

  // First tick: at next midnight
  setTimeout(() => {
    runCircleResetIfFirstOfMonth()
    // Then repeat every 24h
    setInterval(runCircleResetIfFirstOfMonth, 24 * 60 * 60 * 1000)
  }, msUntilMidnight)

  console.log(`⏰ Circle reset scheduled — runs daily at midnight, resets on 1st of each month`)
}

scheduleCircleReset()
// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ⭐ IMPORTANT: Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/calendar', calendarRouter)
// Routes
app.use('/api/students', studentsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/parents', parentsRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/materials', materialsRoutes) // ⭐ NEW ROUTE
app.use('/api/notifications', notificationsRouter)
// Route de test
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
      materials: '/api/materials', // ⭐ NEW
    },
  })
})

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// أضف هذا في backend/server.js قبل app.listen مباشرة

const generateUpcomingNotifications = async () => {
  try {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const now = new Date()
    // نبحث عن الحصص التي تبدأ بعد 30 دقيقة بالضبط
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000)
    const targetDay = days[targetTime.getDay()]

    // تنسيق الوقت HH:MM للبحث في قاعدة البيانات
    const hours = String(targetTime.getHours()).padStart(2, '0')
    const minutes = String(targetTime.getMinutes()).padStart(2, '0')
    const timeString = `${hours}:${minutes}:00`

    // استعلام يجلب كل الحصص التي تبدأ في هذه الدقيقة
    const sessions = await pool.query(
      `
      SELECT
        g.id AS group_id, g.group_name, g.salle, g.session_start_time,
        c.title AS course_title,
        t.id AS teacher_id, t.name AS teacher_name, t.last_name AS teacher_last_name
      FROM groups g
      JOIN courses c ON g.course_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE g.day_of_week = $1
      AND g.session_start_time = $2
      AND g.is_active = true
    `,
      [targetDay, timeString],
    )

    for (const session of sessions.rows) {
      const notifKey = `session_${session.group_id}_${now.toISOString().split('T')[0]}`
      const roomStr = session.salle ? `القاعة: ${session.salle}` : 'القاعة غير محددة'

      // 1. إشعارات الطلاب
      const students = await pool.query(
        `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
        [session.group_id],
      )
      for (const st of students.rows) {
        const msg = `اقترب موعد الدرس أيها الطالب! درس "${session.course_title}" يبدأ خلال 30 دقيقة — ${roomStr}`
        await pool.query(
          `INSERT INTO notifications (user_id, notif_key, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [st.student_id, notifKey, msg],
        )
      }

      // 2. إشعارات أولياء الأمور
      for (const st of students.rows) {
        const parents = await pool.query(
          `SELECT parent_id FROM parent_students WHERE student_id = $1`,
          [st.student_id],
        )
        for (const p of parents.rows) {
          const msg = `اقترب موعد الدرس أيها الولي! درس ابنك "${session.course_title}" يبدأ خلال 30 دقيقة — ${roomStr}`
          await pool.query(
            `INSERT INTO notifications (user_id, notif_key, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [p.parent_id, notifKey, msg],
          )
        }
      }

      // 3. إشعار الأستاذ
      if (session.teacher_id) {
        const msg = `اقترب موعد الدرس أيها الأستاذ! حصتك "${session.course_title}" تبدأ خلال 30 دقيقة — ${roomStr}`
        await pool.query(
          `INSERT INTO notifications (user_id, notif_key, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [session.teacher_id, notifKey, msg],
        )
      }

      // 4. إشعارات المشرفين (Admins)
      const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`)
      for (const admin of admins.rows) {
        const msg = `اقترب موعد الدرس أيها المشرف! درس "${session.course_title}" للأستاذ ${session.teacher_last_name} يبدأ خلال 30 دقيقة — ${roomStr}`
        await pool.query(
          `INSERT INTO notifications (user_id, notif_key, message) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [admin.id, notifKey, msg],
        )
      }
    }
  } catch (error) {
    console.error('Cron Job Error (Notifications):', error)
  }
}

// تشغيل الوظيفة كل 60 ثانية (دقيقة واحدة)
setInterval(generateUpcomingNotifications, 60 * 1000)
console.log('⏰ Notification engine started — polling local DB every minute.')

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📡 CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`)
})

export default app
