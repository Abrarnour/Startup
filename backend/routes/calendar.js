// backend/routes/calendar.js
import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' })
  }
}

// Generate dates for continuous courses (recurring weekly)
const generateRecurringDates = (dayOfWeek, startTime, endTime) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = days.indexOf(dayOfWeek.toLowerCase())

  const dates = []
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  for (let week = 0; week < 6; week++) {
    const date = new Date(firstDayOfMonth)
    date.setDate(
      firstDayOfMonth.getDate() + week * 7 + ((targetDay - firstDayOfMonth.getDay() + 7) % 7),
    )

    if (date.getMonth() >= today.getMonth() && date.getMonth() <= today.getMonth() + 1) {
      dates.push({
        date: date.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
      })
    }
  }

  return dates
}

// ADMIN CALENDAR
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(`
      SELECT
        g.id as group_id, g.group_name, g.day_of_week,
        g.session_start_time, g.session_end_time,
        g.start_date, g.start_time, g.end_time,
        g.current_students, g.salle,
        c.id as course_id, c.title as course_title, c.course_type,
        c.education_level, c.year_level, c.branch, c.max_students_per_group,
        u.name as teacher_name, u.last_name as teacher_last_name, u.gender as teacher_gender
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE g.is_active = true AND c.is_active = true
      ORDER BY g.id
    `)

    const events = []

    for (const row of result.rows) {
      if (row.course_type === 'continuous' && row.day_of_week) {
        const dates = generateRecurringDates(
          row.day_of_week,
          row.session_start_time,
          row.session_end_time,
        )

        dates.forEach((dateInfo) => {
          events.push({
            group_id: row.group_id,
            group_name: row.group_name,
            course_id: row.course_id,
            course_title: row.course_title,
            course_type: row.course_type,
            education_level: row.education_level,
            year_level: row.year_level,
            branch: row.branch,
            teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
            date: dateInfo.date,
            start_time: dateInfo.start_time,
            end_time: dateInfo.end_time,
            current_students: row.current_students,
            max_students: row.max_students_per_group,
            salle: row.salle,
            is_recurring: true,
          })
        })
      } else if (row.course_type === 'one_time' && row.start_date) {
        events.push({
          group_id: row.group_id,
          group_name: row.group_name,
          course_id: row.course_id,
          course_title: row.course_title,
          course_type: row.course_type,
          education_level: row.education_level,
          year_level: row.year_level,
          branch: row.branch,
          teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
          date: row.start_date,
          start_time: row.start_time,
          end_time: row.end_time,
          current_students: row.current_students,
          max_students: row.max_students_per_group,
          salle: row.salle,
          is_recurring: false,
        })
      }
    }

    res.json({ events })
  } catch (err) {
    console.error('Erreur calendar admin:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// TEACHER CALENDAR
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(
      `
      SELECT
        g.id as group_id, g.group_name, g.day_of_week,
        g.session_start_time, g.session_end_time,
        g.start_date, g.start_time, g.end_time,
        g.current_students, g.salle,
        c.id as course_id, c.title as course_title, c.course_type,
        c.education_level, c.year_level, c.branch, c.max_students_per_group
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE c.teacher_id = $1 AND g.is_active = true AND c.is_active = true
      ORDER BY g.id
    `,
      [req.user.id],
    )

    const events = []

    for (const row of result.rows) {
      if (row.course_type === 'continuous' && row.day_of_week) {
        const dates = generateRecurringDates(
          row.day_of_week,
          row.session_start_time,
          row.session_end_time,
        )

        dates.forEach((dateInfo) => {
          events.push({
            group_id: row.group_id,
            group_name: row.group_name,
            course_id: row.course_id,
            course_title: row.course_title,
            course_type: row.course_type,
            education_level: row.education_level,
            year_level: row.year_level,
            branch: row.branch,
            date: dateInfo.date,
            start_time: dateInfo.start_time,
            end_time: dateInfo.end_time,
            current_students: row.current_students,
            max_students: row.max_students_per_group,
            salle: row.salle,
            is_recurring: true,
          })
        })
      } else if (row.course_type === 'one_time' && row.start_date) {
        events.push({
          group_id: row.group_id,
          group_name: row.group_name,
          course_id: row.course_id,
          course_title: row.course_title,
          course_type: row.course_type,
          education_level: row.education_level,
          year_level: row.year_level,
          branch: row.branch,
          date: row.start_date,
          start_time: row.start_time,
          end_time: row.end_time,
          current_students: row.current_students,
          max_students: row.max_students_per_group,
          salle: row.salle,
          is_recurring: false,
        })
      }
    }

    res.json({ events })
  } catch (err) {
    console.error('Erreur calendar teacher:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PARENT CALENDAR
router.get('/parent', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Parent') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(
      `
      SELECT
        u.name as student_name, u.last_name as student_last_name,
        g.id as group_id, g.group_name, g.day_of_week,
        g.session_start_time, g.session_end_time,
        g.start_date, g.start_time, g.end_time, g.salle,
        c.id as course_id, c.title as course_title, c.course_type,
        c.education_level, c.year_level, c.branch,
        t.name as teacher_name, t.last_name as teacher_last_name, t.gender as teacher_gender
      FROM parent_students ps
      INNER JOIN users u ON ps.student_id = u.id
      INNER JOIN group_students gs ON u.id = gs.student_id
      INNER JOIN groups g ON gs.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE ps.parent_id = $1 AND gs.status = 'active'
        AND g.is_active = true AND c.is_active = true
      ORDER BY u.name, g.id
    `,
      [req.user.id],
    )

    const events = []

    for (const row of result.rows) {
      if (row.course_type === 'continuous' && row.day_of_week) {
        const dates = generateRecurringDates(
          row.day_of_week,
          row.session_start_time,
          row.session_end_time,
        )

        dates.forEach((dateInfo) => {
          events.push({
            student_name: `${row.student_name} ${row.student_last_name}`,
            group_id: row.group_id,
            group_name: row.group_name,
            course_id: row.course_id,
            course_title: row.course_title,
            course_type: row.course_type,
            education_level: row.education_level,
            year_level: row.year_level,
            branch: row.branch,
            teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
            date: dateInfo.date,
            start_time: dateInfo.start_time,
            end_time: dateInfo.end_time,
            salle: row.salle,
            is_recurring: true,
          })
        })
      } else if (row.course_type === 'one_time' && row.start_date) {
        events.push({
          student_name: `${row.student_name} ${row.student_last_name}`,
          group_id: row.group_id,
          group_name: row.group_name,
          course_id: row.course_id,
          course_title: row.course_title,
          course_type: row.course_type,
          education_level: row.education_level,
          year_level: row.year_level,
          branch: row.branch,
          teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
          date: row.start_date,
          start_time: row.start_time,
          end_time: row.end_time,
          salle: row.salle,
          is_recurring: false,
        })
      }
    }

    res.json({ events })
  } catch (err) {
    console.error('Erreur calendar parent:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// STUDENT CALENDAR
router.get('/student', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    const result = await pool.query(
      `
      SELECT
        g.id as group_id, g.group_name, g.day_of_week,
        g.session_start_time, g.session_end_time,
        g.start_date, g.start_time, g.end_time, g.salle,
        c.id as course_id, c.title as course_title, c.course_type,
        c.education_level, c.year_level, c.branch,
        u.name as teacher_name, u.last_name as teacher_last_name, u.gender as teacher_gender
      FROM group_students gs
      INNER JOIN groups g ON gs.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE gs.student_id = $1 AND gs.status = 'active'
        AND g.is_active = true AND c.is_active = true
      ORDER BY g.id
    `,
      [req.user.id],
    )

    const events = []

    for (const row of result.rows) {
      if (row.course_type === 'continuous' && row.day_of_week) {
        const dates = generateRecurringDates(
          row.day_of_week,
          row.session_start_time,
          row.session_end_time,
        )

        dates.forEach((dateInfo) => {
          events.push({
            group_id: row.group_id,
            group_name: row.group_name,
            course_id: row.course_id,
            course_title: row.course_title,
            course_type: row.course_type,
            education_level: row.education_level,
            year_level: row.year_level,
            branch: row.branch,
            teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
            date: dateInfo.date,
            start_time: dateInfo.start_time,
            end_time: dateInfo.end_time,
            salle: row.salle,
            is_recurring: true,
          })
        })
      } else if (row.course_type === 'one_time' && row.start_date) {
        events.push({
          group_id: row.group_id,
          group_name: row.group_name,
          course_id: row.course_id,
          course_title: row.course_title,
          course_type: row.course_type,
          education_level: row.education_level,
          year_level: row.year_level,
          branch: row.branch,
          teacher_name: `${row.teacher_gender === 'M' ? 'Mr' : 'Mme'} ${row.teacher_name} ${row.teacher_last_name}`,
          date: row.start_date,
          start_time: row.start_time,
          end_time: row.end_time,
          salle: row.salle,
          is_recurring: false,
        })
      }
    }

    res.json({ events })
  } catch (err) {
    console.error('Erreur calendar student:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
