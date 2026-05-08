// backend/routes/students.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = './uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `student_${req.user.id}_${Date.now()}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  },
})
const router = express.Router()

const studentMiddleware = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Accès réservé aux étudiants' })
  }
  next()
}

// GET /api/students/my-courses - جلب دروس الطالب
router.get('/my-courses', authMiddleware, studentMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id

    const query = `
      SELECT
        c.id as course_id,
        c.title,
        c.description,
        c.education_level,
        c.year_level,
        c.branch,
        c.price,
        c.course_type,
        t.name as teacher_name,
        t.last_name as teacher_last_name,
        t.gender as teacher_gender,
        g.id as group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        g.salle,
        gs.id as enrollment_id,
        gs.enrollment_date,
        gs.payment_status,
        gs.status as enrollment_status
      FROM group_students gs
      JOIN groups g ON gs.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE gs.student_id = $1
      ORDER BY c.title, g.group_name
    `

    const result = await pool.query(query, [studentId])

    console.log(`Student ${studentId} fetching courses. Found: ${result.rows.length}`)

    res.json(result.rows)
  } catch (error) {
    console.error('CRITICAL SQL ERROR in students.js:', error.message)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des cours' })
  }
})

// GET /api/students/my-groups
router.get('/my-groups', authMiddleware, studentMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id

    const query = `
      SELECT
        g.*,
        c.title as course_title,
        gs.enrollment_date,
        gs.payment_status
      FROM group_students gs
      JOIN groups g ON gs.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      WHERE gs.student_id = $1
    `
    const result = await pool.query(query, [studentId])
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching student groups:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/:id/admin-enrollments', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
  try {
    const result = await pool.query(
      `SELECT gs.id as enrollment_id, gs.group_id, gs.student_id, gs.status, gs.payment_status, gs.enrollment_date,
              c.title as course_title, g.group_name
       FROM group_students gs
       JOIN groups g ON gs.group_id = g.id
       JOIN courses c ON g.course_id = c.id
       WHERE gs.student_id = $1
       ORDER BY gs.enrollment_date DESC`,
      [req.params.id],
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Add inside backend/routes/students.js
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, last_name, email, birthday, gender, city, phone, photo_url
       FROM users WHERE id = $1`,
      [req.user.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Étudiant non trouvé' })

    const student = result.rows[0]
    if (student.birthday) {
      const birthDate = new Date(student.birthday)
      const diff = Date.now() - birthDate.getTime()
      const ageDate = new Date(diff)
      student.age = Math.abs(ageDate.getUTCFullYear() - 1970)
    } else {
      student.age = 'N/A'
    }
    res.json(student)
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/upload-photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Build the public URL (Railway serves static files from /uploads)
    const BASE_URL = process.env.BASE_URL || 'https://belmahi-school-production.up.railway.app'
    const photoUrl = `${BASE_URL}/uploads/${req.file.filename}`

    // Update in database
    await pool.query('UPDATE users SET photo_url = $1 WHERE id = $2', [photoUrl, req.user.id])

    res.json({ photo_url: photoUrl, message: 'Photo updated successfully' })
  } catch (error) {
    console.error('Photo upload error:', error)
    res.status(500).json({ error: 'Upload failed: ' + error.message })
  }
})
export default router
