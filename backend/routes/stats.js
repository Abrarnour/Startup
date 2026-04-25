// backend/routes/stats.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users')
    const usersByRole = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
    const totalCourses = await pool.query('SELECT COUNT(*) FROM courses')
    const totalHours = await pool.query(
      'SELECT COALESCE(SUM(duration_hours),0) as total FROM courses',
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
  } catch (err) {
    console.error('Erreur stats:', err)
    res.status(500).json({ error: 'Erreur serveur', detail: err.message })
  }
})

// ── GET /api/stats/dashboard ───────────────────────────────────────────────────
// ⚠️ IMPORTANT: PostgreSQL does NOT allow SELECT aliases in GROUP BY.
//    All GROUP BY clauses must repeat the full expression.
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

    // ── 1. Payment distribution (paid / pending / inactive) ──────────────────
    // Real data: payment_status ∈ {paid, pending}  — no inactive in bdd
    const paymentDist = await pool.query(`
      SELECT
        COALESCE(payment_status, 'pending') AS payment_status,
        COUNT(*)::integer AS count
      FROM group_students
      GROUP BY COALESCE(payment_status, 'pending')
      ORDER BY count DESC
    `)

    // ── 2. Enrolled students vs total capacity ────────────────────────────────
    const capacityData = await pool.query(`
      SELECT
        COALESCE(SUM(c.max_students_per_group), 0)::integer AS total_capacity,
        COUNT(DISTINCT gs.student_id)::integer              AS enrolled_students
      FROM courses c
      LEFT JOIN groups  g  ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id
    `)

    // ── 3. Students by education level ────────────────────────────────────────
    const byLevel = await pool.query(`
      SELECT
        c.education_level,
        COUNT(DISTINCT gs.student_id)::integer AS student_count
      FROM courses c
      LEFT JOIN groups  g  ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      WHERE c.education_level IS NOT NULL
      GROUP BY c.education_level
      ORDER BY student_count DESC
    `)

    // ── 4. Monthly enrollments trend (last 7 months) ──────────────────────────
    // enrollment_date is a TIMESTAMP column in group_students
    // ⚠️ GROUP BY uses the full expression — NOT the alias
    const monthlyEnrollments = await pool.query(`
      SELECT
        TO_CHAR(enrollment_date, 'Mon YYYY') AS month,
        TO_CHAR(enrollment_date, 'YYYY-MM')  AS month_key,
        COUNT(*)::integer                    AS count
      FROM group_students
      WHERE enrollment_date IS NOT NULL
        AND enrollment_date >= NOW() - INTERVAL '7 months'
      GROUP BY
        TO_CHAR(enrollment_date, 'Mon YYYY'),
        TO_CHAR(enrollment_date, 'YYYY-MM')
      ORDER BY
        TO_CHAR(enrollment_date, 'YYYY-MM') ASC
    `)

    // ── 5. Top courses by enrollment ──────────────────────────────────────────
    const topCourses = await pool.query(`
      SELECT
        c.title,
        COUNT(DISTINCT gs.student_id)::integer        AS student_count,
        COALESCE(c.max_students_per_group, 25)::integer AS capacity
      FROM courses c
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      GROUP BY c.id, c.title, c.max_students_per_group
      ORDER BY student_count DESC
      LIMIT 6
    `)

    // ── 6. Monthly revenue (paid enrollments, last 6 months) ──────────────────
    // last_payment_date is a DATE column
    // ⚠️ GROUP BY uses the full expression — NOT the alias
    const monthlyRevenue = await pool.query(`
      SELECT
        TO_CHAR(gs.last_payment_date, 'Mon YYYY') AS month,
        TO_CHAR(gs.last_payment_date, 'YYYY-MM')  AS month_key,
        COALESCE(SUM(c.price), 0)::float           AS revenue
      FROM group_students gs
      JOIN groups  g ON g.id = gs.group_id
      JOIN courses c ON c.id = g.course_id
      WHERE gs.payment_status = 'paid'
        AND gs.last_payment_date IS NOT NULL
        AND gs.last_payment_date >= (CURRENT_DATE - INTERVAL '6 months')::date
      GROUP BY
        TO_CHAR(gs.last_payment_date, 'Mon YYYY'),
        TO_CHAR(gs.last_payment_date, 'YYYY-MM')
      ORDER BY
        TO_CHAR(gs.last_payment_date, 'YYYY-MM') ASC
    `)

    // ── 7. Teacher performance ────────────────────────────────────────────────
    const teacherPerf = await pool.query(`
      SELECT
        (u.name || ' ' || u.last_name) AS teacher_name,
        COUNT(DISTINCT c.id)::integer          AS course_count,
        COUNT(DISTINCT gs.student_id)::integer AS student_count
      FROM users u
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN groups g  ON g.course_id  = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name, u.last_name
      ORDER BY student_count DESC
      LIMIT 5
    `)

    // ── 8. Revenue this month ─────────────────────────────────────────────────
    const revenueThisMonth = await pool.query(`
      SELECT COALESCE(SUM(c.price), 0)::float AS revenue
      FROM group_students gs
      JOIN groups  g ON g.id = gs.group_id
      JOIN courses c ON c.id = g.course_id
      WHERE gs.payment_status = 'paid'
        AND gs.last_payment_date >= DATE_TRUNC('month', CURRENT_DATE)::date
    `)

    // ── 9. Average group fill rate ────────────────────────────────────────────
    const fillRate = await pool.query(`
      SELECT
        ROUND(
          AVG(
            CASE WHEN sub.max_students_per_group > 0
              THEN (sub.gs_count::float / sub.max_students_per_group * 100)
              ELSE 0
            END
          )
        )::integer AS avg_fill_rate
      FROM (
        SELECT
          g.id,
          c.max_students_per_group,
          COUNT(gs.student_id)::integer AS gs_count
        FROM groups g
        JOIN courses c ON c.id = g.course_id
        LEFT JOIN group_students gs ON gs.group_id = g.id
        GROUP BY g.id, c.max_students_per_group
      ) sub
    `)

    // ── 10. Total materials uploaded ──────────────────────────────────────────
    const totalMaterials = await pool.query(`
      SELECT COUNT(*)::integer AS count FROM course_materials
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
      totalMaterials: parseInt(totalMaterials.rows[0]?.count || 0),
    })
  } catch (err) {
    console.error('Erreur dashboard stats:', err.message)
    res.status(500).json({ error: 'Erreur serveur', detail: err.message })
  }
})

// ── GET /api/stats/teacher ────────────────────────────────────────────────────
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    const tid = req.user.id
    if (req.user.role !== 'teacher' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Accès refusé' })

    const [courses, students, groups, seats, mats] = await Promise.all([
      pool.query('SELECT COUNT(*)::integer AS count FROM courses WHERE teacher_id = $1', [tid]),
      pool.query(
        `SELECT COUNT(DISTINCT gs.student_id)::integer AS count
         FROM group_students gs
         JOIN groups  g ON gs.group_id = g.id
         JOIN courses c ON  g.course_id = c.id
         WHERE c.teacher_id = $1`,
        [tid],
      ),
      pool.query(
        `SELECT COUNT(*)::integer AS count
         FROM groups g JOIN courses c ON g.course_id = c.id
         WHERE c.teacher_id = $1`,
        [tid],
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(c.max_students_per_group), 0)::integer AS total_seats,
           COUNT(gs.student_id)::integer                       AS occupied_seats
         FROM groups g
         JOIN courses c ON g.course_id = c.id
         LEFT JOIN group_students gs ON gs.group_id = g.id
         WHERE c.teacher_id = $1
         GROUP BY g.id`,
        [tid],
      ),
      pool.query('SELECT COUNT(*)::integer AS count FROM course_materials WHERE teacher_id = $1', [
        tid,
      ]),
    ])

    const totalSeats = seats.rows.reduce((s, r) => s + r.total_seats, 0)
    const occupiedSeats = seats.rows.reduce((s, r) => s + r.occupied_seats, 0)

    res.json({
      totalCourses: courses.rows[0].count,
      totalStudents: students.rows[0].count,
      totalSessionsPerWeek: groups.rows[0].count,
      availableSeats: totalSeats - occupiedSeats,
      totalMaterials: mats.rows[0].count,
    })
  } catch (err) {
    console.error('Erreur stats enseignant:', err.message)
    res.status(500).json({ error: 'Erreur serveur', detail: err.message })
  }
})

export default router
