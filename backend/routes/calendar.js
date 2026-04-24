// backend/routes/calendar.js
// ─────────────────────────────────────────────────────────────────────────────
// FIXED VERSION — all courses appear correctly
//
// ROOT CAUSES OF MISSING COURSES (all fixed below):
//
//  BUG 1 — generateRecurringDates() only generated dates for "current month +1"
//           → Fixed: now accepts year/month params and generates for ANY month
//
//  BUG 2 — session_schedule table was IGNORED completely
//           → Fixed: we now join session_schedule so manual/one-time sessions appear
//
//  BUG 3 — courses with no day_of_week AND no session_schedule were silently dropped
//           → Fixed: fallback row is generated from group start_date / start_time
//
//  BUG 4 — WHERE c.is_active = true filtered out courses where the column is NULL
//           → Fixed: changed to (c.is_active IS NOT FALSE) — NULL treated as active
//
//  BUG 5 — Frontend fetched once on mount, never on month change
//           → Fixed: API now accepts ?year=&month= query params; frontend passes them
//
//  BUG 6 — Multiple groups of the same course on the same day merged into one event
//           → Fixed: each group is its own event row keyed by group_id
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token manquant' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide' })
  }
}

// ─── Helper: target year/month from query (defaults to current) ───────────────
function getTargetMonth(query) {
  const now = new Date()
  const year = parseInt(query.year) || now.getFullYear()
  const month = parseInt(query.month) || now.getMonth() + 1 // 1-based
  return { year, month }
}

// ─── Helper: generate all occurrences of a weekday within a given month ───────
// dayOfWeek: 'monday' | 'tuesday' | ... (case-insensitive)
function generateRecurringDates(dayOfWeek, startTime, endTime, year, month) {
  if (!dayOfWeek) return []

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = dayNames.indexOf(dayOfWeek.toLowerCase())
  if (targetDay === -1) return []

  const dates = []
  // Iterate every day of the target month
  const daysInMonth = new Date(year, month, 0).getDate() // month is 1-based, so Date(y, m, 0) = last day
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    if (date.getDay() === targetDay) {
      dates.push({
        date: date.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
      })
    }
  }
  return dates
}

// ─── Helper: format teacher name ─────────────────────────────────────────────
function teacherName(row) {
  if (!row.teacher_name) return null
  const title = row.teacher_gender === 'F' ? 'Mme' : 'Mr'
  return `${title} ${row.teacher_name} ${row.teacher_last_name || ''}`.trim()
}

// ─── Helper: build events from a DB result row ────────────────────────────────
// Strategy (in priority order):
//   1. If group has session_schedule rows in the target month → use those exact dates
//   2. If course_type = 'continuous' and day_of_week set → generate recurring dates
//   3. If start_date is set → one-time event on that date
//   4. Fallback: show on the 1st of the month so it's at least visible
function buildEvents(row, year, month, extraFields = {}) {
  const events = []

  const base = {
    group_id: row.group_id,
    group_name: row.group_name,
    course_id: row.course_id,
    course_title: row.course_title,
    course_type: row.course_type,
    education_level: row.education_level,
    year_level: row.year_level,
    branch: row.branch,
    teacher_name: teacherName(row),
    salle: row.salle,
    current_students: row.current_students,
    max_students: row.max_students_per_group,
    ...extraFields,
  }

  // ── Strategy 1: actual session_schedule rows ────────────────────────────────
  if (row.session_dates && row.session_dates.length > 0) {
    for (const s of row.session_dates) {
      if (!s.session_date) continue
      const d = new Date(s.session_date)
      if (d.getFullYear() === year && d.getMonth() + 1 === month && !s.is_cancelled) {
        events.push({
          ...base,
          date: s.session_date.toISOString
            ? s.session_date.toISOString().split('T')[0]
            : String(s.session_date).split('T')[0],
          start_time: s.start_time || row.session_start_time,
          end_time: s.end_time || row.session_end_time,
          is_recurring: false,
          session_id: s.id,
          session_number: s.session_number,
          is_cancelled: s.is_cancelled || false,
        })
      }
    }
    if (events.length > 0) return events
  }

  // ── Strategy 2: recurring weekly from day_of_week ──────────────────────────
  if (row.course_type === 'continuous' && row.day_of_week) {
    const dates = generateRecurringDates(
      row.day_of_week,
      row.session_start_time,
      row.session_end_time,
      year,
      month,
    )
    for (const d of dates) {
      events.push({ ...base, ...d, is_recurring: true })
    }
    if (events.length > 0) return events
  }

  // ── Strategy 3: one-time event on start_date ────────────────────────────────
  if (row.start_date) {
    const d = new Date(row.start_date)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      events.push({
        ...base,
        date: String(row.start_date).split('T')[0],
        start_time: row.start_time || row.session_start_time,
        end_time: row.end_time || row.session_end_time,
        is_recurring: false,
      })
    }
    // Even if it's not this month, return it so it's at least visible somewhere
    if (events.length > 0) return events
    // show it on its real date even if outside target month
    events.push({
      ...base,
      date: String(row.start_date).split('T')[0],
      start_time: row.start_time || row.session_start_time,
      end_time: row.end_time || row.session_end_time,
      is_recurring: false,
    })
    return events
  }

  // ── Strategy 4: fallback — show on 1st of requested month ──────────────────
  // This ensures every course is ALWAYS visible even if schedule isn't configured yet.
  const fallbackDate = `${year}-${String(month).padStart(2, '0')}-01`
  events.push({
    ...base,
    date: fallbackDate,
    start_time: row.session_start_time || row.start_time || null,
    end_time: row.session_end_time || row.end_time || null,
    is_recurring: false,
    is_fallback: true, // frontend can show a "⚠ schedule not set" hint
  })
  return events
}

// ─── Shared SQL fragment: fetch session_schedule for groups in a month ─────────
// Returns an object: { group_id → [session rows] }
async function fetchSessionsByGroupIds(groupIds, year, month) {
  if (!groupIds.length) return {}
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  const result = await pool.query(
    `SELECT group_id, id, session_number, session_date, start_time, end_time, is_cancelled
     FROM session_schedule
     WHERE group_id = ANY($1::int[])
       AND session_date BETWEEN $2 AND $3
       AND (is_cancelled IS NOT TRUE)
     ORDER BY group_id, session_date, start_time`,
    [groupIds, firstDay, lastDay],
  )

  const map = {}
  for (const row of result.rows) {
    if (!map[row.group_id]) map[row.group_id] = []
    map[row.group_id].push(row)
  }
  return map
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CALENDAR  GET /api/calendar/admin?year=2026&month=4
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

    const { year, month } = getTargetMonth(req.query)

    // ✅ BUG4 FIX: (c.is_active IS NOT FALSE) instead of c.is_active = true
    const result = await pool.query(`
      SELECT
        g.id          AS group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        g.current_students,
        g.salle,
        c.id          AS course_id,
        c.title       AS course_title,
        c.course_type,
        c.education_level,
        c.year_level,
        c.branch,
        c.max_students_per_group,
        u.name        AS teacher_name,
        u.last_name   AS teacher_last_name,
        u.gender      AS teacher_gender
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      LEFT  JOIN users   u ON c.teacher_id = u.id
      WHERE (g.is_active IS NOT FALSE)
        AND (c.is_active IS NOT FALSE)
      ORDER BY c.title, g.group_name
    `)

    const groupIds = result.rows.map((r) => r.group_id)
    const sessionMap = await fetchSessionsByGroupIds(groupIds, year, month)

    const events = []
    for (const row of result.rows) {
      row.session_dates = sessionMap[row.group_id] || []
      events.push(...buildEvents(row, year, month))
    }

    res.json({ events, year, month })
  } catch (err) {
    console.error('Erreur calendar admin:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER CALENDAR  GET /api/calendar/teacher?year=2026&month=4
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Accès refusé' })

    const { year, month } = getTargetMonth(req.query)

    const result = await pool.query(
      `SELECT
        g.id          AS group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        g.current_students,
        g.salle,
        c.id          AS course_id,
        c.title       AS course_title,
        c.course_type,
        c.education_level,
        c.year_level,
        c.branch,
        c.max_students_per_group
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE c.teacher_id = $1
        AND (g.is_active IS NOT FALSE)
        AND (c.is_active IS NOT FALSE)
      ORDER BY c.title, g.group_name`,
      [req.user.id],
    )

    const groupIds = result.rows.map((r) => r.group_id)
    const sessionMap = await fetchSessionsByGroupIds(groupIds, year, month)

    const events = []
    for (const row of result.rows) {
      row.session_dates = sessionMap[row.group_id] || []
      // Teacher has no teacher_name fields — leave null (they know who they are)
      row.teacher_name = null
      events.push(...buildEvents(row, year, month))
    }

    res.json({ events, year, month })
  } catch (err) {
    console.error('Erreur calendar teacher:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PARENT CALENDAR  GET /api/calendar/parent?year=2026&month=4
// Shows all enrolled children's courses, one event per child+group
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/parent', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Parent') return res.status(403).json({ error: 'Accès refusé' })

    const { year, month } = getTargetMonth(req.query)

    const result = await pool.query(
      `SELECT
        u.name        AS student_name,
        u.last_name   AS student_last_name,
        g.id          AS group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        g.salle,
        c.id          AS course_id,
        c.title       AS course_title,
        c.course_type,
        c.education_level,
        c.year_level,
        c.branch,
        t.name        AS teacher_name,
        t.last_name   AS teacher_last_name,
        t.gender      AS teacher_gender
      FROM parent_students ps
      INNER JOIN users          u  ON ps.student_id    = u.id
      INNER JOIN group_students gs ON u.id             = gs.student_id
      INNER JOIN groups         g  ON gs.group_id      = g.id
      INNER JOIN courses        c  ON g.course_id      = c.id
      LEFT  JOIN users          t  ON c.teacher_id     = t.id
      WHERE ps.parent_id = $1
        AND gs.status = 'active'
        AND (g.is_active IS NOT FALSE)
        AND (c.is_active IS NOT FALSE)
      ORDER BY u.name, c.title, g.group_name`,
      [req.user.id],
    )

    const groupIds = [...new Set(result.rows.map((r) => r.group_id))]
    const sessionMap = await fetchSessionsByGroupIds(groupIds, year, month)

    const events = []
    for (const row of result.rows) {
      row.session_dates = sessionMap[row.group_id] || []
      const studentFullName = `${row.student_name} ${row.student_last_name}`.trim()
      events.push(...buildEvents(row, year, month, { student_name: studentFullName }))
    }

    res.json({ events, year, month })
  } catch (err) {
    console.error('Erreur calendar parent:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT CALENDAR  GET /api/calendar/student?year=2026&month=4
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/student', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Accès refusé' })

    const { year, month } = getTargetMonth(req.query)

    const result = await pool.query(
      `SELECT
        g.id          AS group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        g.salle,
        c.id          AS course_id,
        c.title       AS course_title,
        c.course_type,
        c.education_level,
        c.year_level,
        c.branch,
        u.name        AS teacher_name,
        u.last_name   AS teacher_last_name,
        u.gender      AS teacher_gender
      FROM group_students gs
      INNER JOIN groups   g  ON gs.group_id   = g.id
      INNER JOIN courses  c  ON g.course_id   = c.id
      LEFT  JOIN users    u  ON c.teacher_id  = u.id
      WHERE gs.student_id = $1
        AND gs.status = 'active'
        AND (g.is_active IS NOT FALSE)
        AND (c.is_active IS NOT FALSE)
      ORDER BY c.title, g.group_name`,
      [req.user.id],
    )

    const groupIds = result.rows.map((r) => r.group_id)
    const sessionMap = await fetchSessionsByGroupIds(groupIds, year, month)

    const events = []
    for (const row of result.rows) {
      row.session_dates = sessionMap[row.group_id] || []
      events.push(...buildEvents(row, year, month))
    }

    res.json({ events, year, month })
  } catch (err) {
    console.error('Erreur calendar student:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
