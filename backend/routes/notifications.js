// backend/routes/notifications.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// ═══════════════════════════════════════
// HELPER : convertir jour JS → format BDD
// ═══════════════════════════════════════
const getDayName = (dayIndex) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[dayIndex]
}

// ═══════════════════════════════════════
// GET /api/notifications/upcoming
// Séances qui commencent dans les 30 prochaines minutes
// ═══════════════════════════════════════
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    // Heure actuelle + fenêtre de 25 à 35 minutes (zone de déclenchement)
    const now = new Date()
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000) // +25 min
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000) // +35 min

    const todayDay = getDayName(now.getDay())

    // Format HH:MM:SS pour PostgreSQL
    const toTimeStr = (d) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`

    const timeStart = toTimeStr(windowStart)
    const timeEnd = toTimeStr(windowEnd)

    let query = ''
    let params = []
    let notifications = []

    // ──────────────────────────────────────────
    // CAS 1 : ÉTUDIANT
    // ──────────────────────────────────────────
    if (userRole === 'student') {
      const result = await pool.query(
        `
        SELECT
          g.id         AS group_id,
          g.group_name,
          g.session_start_time,
          g.salle,
          g.day_of_week,
          c.title      AS course_title,
          u.name       AS teacher_name,
          u.last_name  AS teacher_last_name,
          u.gender     AS teacher_gender
        FROM group_students gs
        JOIN groups g   ON gs.group_id   = g.id
        JOIN courses c  ON g.course_id   = c.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE gs.student_id = $1
          AND gs.status = 'active'
          AND g.day_of_week = $2
          AND g.session_start_time::TIME >= $3::TIME
          AND g.session_start_time::TIME <= $4::TIME
      `,
        [userId, todayDay, timeStart, timeEnd],
      )

      notifications = result.rows.map((row) => {
        const gender = row.teacher_gender === 'F' ? 'Mme' : 'M.'
        return {
          key: `student_${row.group_id}_${todayDay}_${row.session_start_time}`,
          message: `📚 Votre cours "${row.course_title}" commence dans 30 minutes — Salle ${row.salle || 'à confirmer'} avec ${gender} ${row.teacher_last_name}`,
          ar_message: `📚 يبدأ درسك "${row.course_title}" خلال 30 دقيقة — القاعة: ${row.salle || 'غير محدد'}`,
          group_id: row.group_id,
          course: row.course_title,
          time: row.session_start_time,
          salle: row.salle,
        }
      })
    }

    // ──────────────────────────────────────────
    // CAS 2 : ENSEIGNANT
    // ──────────────────────────────────────────
    else if (userRole === 'teacher') {
      const result = await pool.query(
        `
        SELECT
          g.id          AS group_id,
          g.group_name,
          g.session_start_time,
          g.salle,
          g.day_of_week,
          c.title       AS course_title,
          COUNT(gs.student_id) AS student_count
        FROM groups g
        JOIN courses c ON g.course_id = c.id
        LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
        WHERE c.teacher_id = $1
          AND g.day_of_week = $2
          AND g.session_start_time::TIME >= $3::TIME
          AND g.session_start_time::TIME <= $4::TIME
        GROUP BY g.id, g.group_name, g.session_start_time, g.salle, g.day_of_week, c.title
      `,
        [userId, todayDay, timeStart, timeEnd],
      )

      notifications = result.rows.map((row) => ({
        key: `teacher_${row.group_id}_${todayDay}_${row.session_start_time}`,
        message: `🎓 Votre séance "${row.course_title}" (${row.group_name}) commence dans 30 minutes — Salle ${row.salle || 'à confirmer'} — ${row.student_count} étudiant(s)`,
        ar_message: `🎓 تبدأ حصتك "${row.course_title}" (${row.group_name}) خلال 30 دقيقة — القاعة: ${row.salle || 'غير محدد'}`,
        group_id: row.group_id,
        course: row.course_title,
        time: row.session_start_time,
        salle: row.salle,
      }))
    }

    // ──────────────────────────────────────────
    // CAS 3 : PARENT
    // ──────────────────────────────────────────
    else if (userRole === 'Parent') {
      const result = await pool.query(
        `
        SELECT
          child.name    AS child_name,
          child.last_name AS child_last_name,
          g.id          AS group_id,
          g.group_name,
          g.session_start_time,
          g.salle,
          g.day_of_week,
          c.title       AS course_title,
          u.name        AS teacher_name,
          u.last_name   AS teacher_last_name,
          u.gender      AS teacher_gender
        FROM parent_students ps
        JOIN users child   ON ps.student_id = child.id
        JOIN group_students gs ON gs.student_id = ps.student_id AND gs.status = 'active'
        JOIN groups g   ON gs.group_id  = g.id
        JOIN courses c  ON g.course_id  = c.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE ps.parent_id = $1
          AND g.day_of_week = $2
          AND g.session_start_time::TIME >= $3::TIME
          AND g.session_start_time::TIME <= $4::TIME
      `,
        [userId, todayDay, timeStart, timeEnd],
      )

      notifications = result.rows.map((row) => {
        const gender = row.teacher_gender === 'F' ? 'Mme' : 'M.'
        return {
          key: `parent_${row.group_id}_${row.child_name}_${todayDay}_${row.session_start_time}`,
          message: `👨‍👩‍👦 Le cours de ${row.child_name} "${row.course_title}" commence dans 30 minutes — Salle ${row.salle || 'à confirmer'}`,
          ar_message: `👨‍👩‍👦 يبدأ درس ${row.child_name} "${row.course_title}" خلال 30 دقيقة — القاعة: ${row.salle || 'غير محدد'}`,
          group_id: row.group_id,
          child: row.child_name,
          course: row.course_title,
          time: row.session_start_time,
          salle: row.salle,
        }
      })
    }

    res.json({ notifications })
  } catch (error) {
    console.error('Erreur notifications upcoming:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// GET /api/notifications — Historique du jour
// ═══════════════════════════════════════
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 20
    `,
      [req.user.id],
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// POST /api/notifications/save — Sauvegarder (évite doublons)
// ═══════════════════════════════════════
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { notif_key, message, type } = req.body
    await pool.query(
      `
      INSERT INTO notifications (user_id, notif_key, message, type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, notif_key) DO NOTHING
    `,
      [req.user.id, notif_key, message, type || 'upcoming_session'],
    )

    res.json({ saved: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// PUT /api/notifications/:id/read
// ═══════════════════════════════════════
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ])
    res.json({ updated: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// DELETE /api/notifications/clear
// ═══════════════════════════════════════
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id])
    res.json({ cleared: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
