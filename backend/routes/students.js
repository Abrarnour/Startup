// backend/routes/students.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// Middleware للتحقق من أن المستخدم طالب
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

export default router
