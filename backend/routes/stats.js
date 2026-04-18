// backend/routes/stats.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// 📊 GET /api/stats - Statistiques globales (Admin)
router.get('/', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users')

    const usersByRole = await pool.query(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `)

    const totalCourses = await pool.query('SELECT COUNT(*) FROM courses')

    // ✅ FIX: was SUM(hours) — correct column is duration_hours
    const totalHours = await pool.query(
      'SELECT COALESCE(SUM(duration_hours), 0) as total FROM courses',
    )

    // ✅ FIX: was COUNT(DISTINCT teacher) — correct column is teacher_id
    const uniqueTeachers = await pool.query(
      'SELECT COUNT(DISTINCT teacher_id) as count FROM courses',
    )

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      students: parseInt(usersByRole.rows.find((r) => r.role === 'student')?.count || 0),
      parents: parseInt(usersByRole.rows.find((r) => r.role === 'Parent')?.count || 0),
      teachers: parseInt(usersByRole.rows.find((r) => r.role === 'teacher')?.count || 0),
      admins: parseInt(usersByRole.rows.find((r) => r.role === 'admin')?.count || 0),
      totalCourses: parseInt(totalCourses.rows[0].count),
      totalHours: parseInt(totalHours.rows[0].total || 0),
      uniqueTeachers: parseInt(uniqueTeachers.rows[0].count),
    })
  } catch (error) {
    console.error('Erreur récupération stats:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 📊 GET /api/stats/teacher - Statistiques enseignant
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.user.id

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Nombre de cours de l'enseignant
    // ✅ FIX: removed AND is_active = true — NULL is_active causes false negatives
    const coursesResult = await pool.query(
      'SELECT COUNT(*) as count FROM courses WHERE teacher_id = $1',
      [teacherId],
    )

    // Nombre total d'étudiants inscrits
    // ✅ FIX: removed gs.status='active', g.is_active, c.is_active filters
    //         NULL values in those columns returned 0 even with real enrolled students
    const studentsResult = await pool.query(
      `
      SELECT COUNT(DISTINCT gs.student_id) as count
      FROM group_students gs
      INNER JOIN groups g ON gs.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      WHERE c.teacher_id = $1
      `,
      [teacherId],
    )

    // Nombre de groupes total du professeur
    const sessionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE c.teacher_id = $1
      `,
      [teacherId],
    )

    // Places disponibles
    // ✅ FIX: removed is_active and status filters
    const seatsResult = await pool.query(
      `
      SELECT
    COALESCE(SUM(c.max_students_per_group), 0) as total_seats,
        COUNT(gs.student_id) as occupied_seats
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      WHERE c.teacher_id = $1
      GROUP BY g.id
      `,
      [teacherId],
    )

    const totalSeats = seatsResult.rows.reduce((sum, r) => sum + parseInt(r.total_seats || 0), 0)
    const occupiedSeats = seatsResult.rows.reduce(
      (sum, r) => sum + parseInt(r.occupied_seats || 0),
      0,
    )

    res.json({
      totalCourses: parseInt(coursesResult.rows[0].count),
      totalStudents: parseInt(studentsResult.rows[0].count),
      totalSessionsPerWeek: parseInt(sessionsResult.rows[0].count),
      availableSeats: totalSeats - occupiedSeats,
    })
  } catch (error) {
    console.error('Erreur stats enseignant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
