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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📡 CORS autorisé pour: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`)
})

export default app
