// ═══════════════════════════════════════════════════════
// FILE: backend/routes/stats.js
// CHANGE: Added comprehensive dashboard stats endpoint
// ═══════════════════════════════════════════════════════

import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// 📊 GET /api/stats - Statistiques globales (Admin)
router.get('/', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users')
    const usersByRole = await pool.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`)
    const totalCourses = await pool.query('SELECT COUNT(*) FROM courses')
    const totalHours = await pool.query(
      'SELECT COALESCE(SUM(duration_hours), 0) as total FROM courses',
    )
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

// 📊 GET /api/stats/dashboard - Full Power BI-like dashboard data (Admin)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

    // ── 1. Payment distribution ─────────────────────────────────────────
    const paymentDist = await pool.query(`
      SELECT
        payment_status,
        COUNT(*) as count
      FROM group_students
      GROUP BY payment_status
    `)

    // ── 2. Students enrolled vs total capacity ───────────────────────────
    const capacityData = await pool.query(`
      SELECT
        COALESCE(SUM(c.max_students_per_group), 0) as total_capacity,
        COUNT(DISTINCT gs.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
    `)

    // ── 3. Students by education level ──────────────────────────────────
    const byLevel = await pool.query(`
      SELECT
        c.education_level,
        COUNT(DISTINCT gs.student_id) as student_count
      FROM courses c
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
      GROUP BY c.education_level
    `)

    // ── 4. Monthly enrollments trend (last 7 months) ─────────────────────
    const monthlyEnrollments = await pool.query(`
      SELECT
        TO_CHAR(enrollment_date, 'Mon YYYY') as month,
        TO_CHAR(enrollment_date, 'YYYY-MM') as month_key,
        COUNT(*) as count
      FROM group_students
      WHERE enrollment_date >= NOW() - INTERVAL '7 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `)

    // ── 5. Top courses by enrollment ─────────────────────────────────────
    const topCourses = await pool.query(`
      SELECT
        c.title,
        COUNT(DISTINCT gs.student_id) as student_count,
        c.max_students_per_group as capacity
      FROM courses c
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
      GROUP BY c.id, c.title, c.max_students_per_group
      ORDER BY student_count DESC
      LIMIT 6
    `)

    // ── 6. Monthly revenue estimate ──────────────────────────────────────
    const monthlyRevenue = await pool.query(`
      SELECT
        TO_CHAR(gs.last_payment_date, 'Mon YYYY') as month,
        TO_CHAR(gs.last_payment_date, 'YYYY-MM') as month_key,
        COALESCE(SUM(c.price), 0) as revenue
      FROM group_students gs
      JOIN groups g ON g.id = gs.group_id
      JOIN courses c ON c.id = g.course_id
      WHERE gs.payment_status = 'paid'
        AND gs.last_payment_date >= NOW() - INTERVAL '6 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `)

    // ── 7. Teacher performance ────────────────────────────────────────────
    const teacherPerf = await pool.query(`
      SELECT
        u.name || ' ' || u.last_name as teacher_name,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT gs.student_id) as student_count
      FROM users u
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name, u.last_name
      ORDER BY student_count DESC
      LIMIT 5
    `)

    // ── 8. Total revenue this month ───────────────────────────────────────
    const revenueThisMonth = await pool.query(`
      SELECT COALESCE(SUM(c.price), 0) as revenue
      FROM group_students gs
      JOIN groups g ON g.id = gs.group_id
      JOIN courses c ON c.id = g.course_id
      WHERE gs.payment_status = 'paid'
        AND gs.last_payment_date >= DATE_TRUNC('month', NOW())
    `)

    // ── 9. Groups fill rate ────────────────────────────────────────────────
    const fillRate = await pool.query(`
      SELECT
        ROUND(
          AVG(
            CASE WHEN c.max_students_per_group > 0
            THEN (gs_count::float / c.max_students_per_group * 100)
            ELSE 0 END
          )
        ) as avg_fill_rate
      FROM (
        SELECT g.id, c.max_students_per_group,
          COUNT(gs.student_id) as gs_count
        FROM groups g
        JOIN courses c ON c.id = g.course_id
        LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
        GROUP BY g.id, c.max_students_per_group
      ) sub
    `)

    res.json({
      paymentDistribution: paymentDist.rows,
      capacityData: capacityData.rows[0],
      byLevel: byLevel.rows,
      monthlyEnrollments: monthlyEnrollments.rows,
      topCourses: topCourses.rows,
      monthlyRevenue: monthlyRevenue.rows,
      teacherPerformance: teacherPerf.rows,
      revenueThisMonth: parseFloat(revenueThisMonth.rows[0]?.revenue || 0),
      avgFillRate: parseInt(fillRate.rows[0]?.avg_fill_rate || 0),
    })
  } catch (error) {
    console.error('Erreur dashboard stats:', error)
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

    const coursesResult = await pool.query(
      'SELECT COUNT(*) as count FROM courses WHERE teacher_id = $1',
      [teacherId],
    )
    const studentsResult = await pool.query(
      `SELECT COUNT(DISTINCT gs.student_id) as count
       FROM group_students gs
       INNER JOIN groups g ON gs.group_id = g.id
       INNER JOIN courses c ON g.course_id = c.id
       WHERE c.teacher_id = $1`,
      [teacherId],
    )
    const sessionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM groups g
       INNER JOIN courses c ON g.course_id = c.id WHERE c.teacher_id = $1`,
      [teacherId],
    )
    const seatsResult = await pool.query(
      `SELECT COALESCE(SUM(c.max_students_per_group), 0) as total_seats,
         COUNT(gs.student_id) as occupied_seats
       FROM groups g
       INNER JOIN courses c ON g.course_id = c.id
       LEFT JOIN group_students gs ON gs.group_id = g.id
       WHERE c.teacher_id = $1 GROUP BY g.id`,
      [teacherId],
    )

    // ── Materials count per course ─────────────────────────────────────
    const materialsResult = await pool.query(
      `SELECT COUNT(*) as count FROM course_materials WHERE teacher_id = $1`,
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
      totalMaterials: parseInt(materialsResult.rows[0].count),
    })
  } catch (error) {
    console.error('Erreur stats enseignant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
