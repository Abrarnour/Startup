// backend/routes/courses.js
import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { sendNotif, notifyAllAdmins } from '../notifHelper.js'

const router = express.Router()

// ===== MIDDLEWARES =====
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

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Accès refusé - Admin uniquement' })
  next()
}

// ===== GET ALL COURSES =====
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    let query = `
      SELECT
        c.*,
        u.name as teacher_name,
        u.last_name as teacher_last_name,
        u.gender as teacher_gender,
        COALESCE(
          (SELECT true FROM favorites WHERE user_id = $1 AND course_id = c.id LIMIT 1),
          false
        ) as is_favorite,
        COALESCE(
          (SELECT COUNT(DISTINCT gs.student_id)
           FROM groups g
           INNER JOIN group_students gs ON gs.group_id = g.id
           WHERE g.course_id = c.id),
          0
        )::integer as current_students,
        COALESCE(
          (SELECT COUNT(DISTINCT gs.student_id)
           FROM groups g
           INNER JOIN group_students gs ON gs.group_id = g.id
           WHERE g.course_id = c.id),
          0
        )::integer as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
    `
    let params = [userId]

    if (userRole === 'teacher') {
      query += ' WHERE c.teacher_id = $1'
      params = [userId]
    }

    query += ' ORDER BY c.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération cours:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== GET ONE COURSE =====
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as teacher_name, u.last_name as teacher_last_name, u.gender as teacher_gender
       FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.id = $1`,
      [req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== GET TEACHERS LIST =====
router.get('/teachers/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, last_name, gender, email FROM users WHERE role = 'teacher' ORDER BY last_name, name`,
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== CREATE COURSE =====
// 🔔 NOTIFICATIONS:
//   → Teacher assigned: "Admin assigned you to a new course"
//   → All admins:       "New course created"
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Accès refusé' })
  }

  const {
    title,
    teacher_id,
    description,
    education_level,
    year_level,
    branch,
    course_type,
    sessions_per_month,
    duration_hours,
    price,
    max_students_per_group,
    salle,
  } = req.body

  try {
    if (!title || !teacher_id || !education_level || !year_level || !course_type) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' })
    }

    const teacherCheck = await pool.query(
      'SELECT id, name, last_name FROM users WHERE id = $1 AND role = $2',
      [teacher_id, 'teacher'],
    )
    if (teacherCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Enseignant non trouvé' })
    }

    const maxYear = { primaire: 5, moyen: 4, secondaire: 3 }
    if (year_level < 1 || year_level > maxYear[education_level]) {
      return res.status(400).json({ error: `Année invalide pour ${education_level}` })
    }

    const result = await pool.query(
      `INSERT INTO courses (title, teacher_id, description, education_level, year_level,
        branch, course_type, sessions_per_month, duration_hours, price, max_students_per_group, salle)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        title,
        teacher_id,
        description || '',
        education_level,
        year_level,
        branch || null,
        course_type,
        sessions_per_month || null,
        duration_hours || null,
        price || 0,
        max_students_per_group || 30,
        salle || null,
      ],
    )

    const newCourse = result.rows[0]
    const teacher = teacherCheck.rows[0]
    const ts = Date.now()

    // ─── 🔔 Notify the assigned teacher ──────────────────────────────────────
    if (parseInt(teacher_id) !== req.user.id) {
      // Admin created and assigned to teacher
      await sendNotif(
        pool,
        teacher_id,
        `course_assigned_${newCourse.id}_${ts}`,
        `📚 تم تعيينك كأستاذ لمادة جديدة: "${title}" — يمكنك الآن رؤيتها في لوحة القيادة.`,
        'assignment',
      )
    } else {
      // Teacher created their own course — notify admins
      await notifyAllAdmins(
        pool,
        `course_created_teacher_${newCourse.id}_${ts}`,
        `📚 الأستاذ ${teacher.name} ${teacher.last_name} أنشأ مادة جديدة: "${title}".`,
        'info',
      )
    }

    // ─── 🔔 Notify all admins when admin creates a course ────────────────────
    if (req.user.role === 'admin') {
      await notifyAllAdmins(
        pool,
        `course_new_admin_${newCourse.id}_${ts}`,
        `✅ تم إنشاء مادة جديدة: "${title}" وتعيينها للأستاذ ${teacher.name} ${teacher.last_name}.`,
        'info',
      )
    }

    res.status(201).json(newCourse)
  } catch (error) {
    console.error('Erreur création cours:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== UPDATE COURSE =====
// 🔔 NOTIFICATIONS:
//   → Teacher: "Your course details were updated"
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, description, salle, price } = req.body

  try {
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Le titre du cours est obligatoire' })
    }

    const existing = await pool.query('SELECT id, title, teacher_id FROM courses WHERE id = $1', [
      req.params.id,
    ])
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' })

    const result = await pool.query(
      `UPDATE courses SET title=$1, description=$2, salle=$3, price=$4, updated_at=CURRENT_TIMESTAMP
       WHERE id=$5 RETURNING *`,
      [title.trim(), description || '', salle || null, parseFloat(price) || 0, req.params.id],
    )

    const oldCourse = existing.rows[0]
    const ts = Date.now()

    // 🔔 Notify the teacher that their course was modified
    if (oldCourse.teacher_id) {
      await sendNotif(
        pool,
        oldCourse.teacher_id,
        `course_updated_${req.params.id}_${ts}`,
        `✏️ تم تعديل بيانات مادتك "${oldCourse.title}" من قبل الإدارة. تحقق من التفاصيل الجديدة.`,
        'info',
      )
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification cours:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== DELETE COURSE =====
// 🔔 NOTIFICATIONS:
//   → Teacher: "Your course was removed"
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get course info before deleting
    const info = await pool.query('SELECT id, title, teacher_id FROM courses WHERE id = $1', [
      req.params.id,
    ])
    if (info.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' })

    const course = info.rows[0]

    // Get all students enrolled in this course's groups to notify them
    const enrolledStudents = await pool.query(
      `SELECT DISTINCT gs.student_id
       FROM group_students gs
       JOIN groups g ON gs.group_id = g.id
       WHERE g.course_id = $1 AND gs.status = 'active'`,
      [req.params.id],
    )

    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id])

    const ts = Date.now()

    // 🔔 Notify teacher
    if (course.teacher_id) {
      await sendNotif(
        pool,
        course.teacher_id,
        `course_deleted_${req.params.id}_${ts}`,
        `🗑️ تم حذف المادة "${course.title}" من قبل الإدارة.`,
        'warning',
      )
    }

    // 🔔 Notify enrolled students and their parents
    for (const st of enrolledStudents.rows) {
      await sendNotif(
        pool,
        st.student_id,
        `course_deleted_student_${req.params.id}_${st.student_id}_${ts}`,
        `⚠️ المادة "${course.title}" التي كنت مسجلاً فيها تم حذفها من قبل الإدارة.`,
        'warning',
      )
      // Notify their parents too
      const parents = await pool.query(
        `SELECT parent_id FROM parent_students WHERE student_id = $1`,
        [st.student_id],
      )
      for (const p of parents.rows) {
        await sendNotif(
          pool,
          p.parent_id,
          `course_deleted_parent_${req.params.id}_${p.parent_id}_${ts}`,
          `⚠️ المادة "${course.title}" التي كان ابنك مسجلاً فيها تم حذفها من قبل الإدارة.`,
          'warning',
        )
      }
    }

    res.json({ message: 'Cours supprimé avec succès' })
  } catch (error) {
    console.error('Erreur suppression cours:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== TOGGLE FAVORITE =====
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  const courseId = req.params.id
  const userId = req.user.id
  try {
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId])
    if (courseExists.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' })

    const existing = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND course_id = $2',
      [userId, courseId],
    )

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND course_id = $2', [
        userId,
        courseId,
      ])
      res.json({ isFavorite: false })
    } else {
      await pool.query('INSERT INTO favorites (user_id, course_id) VALUES ($1, $2)', [
        userId,
        courseId,
      ])
      res.json({ isFavorite: true })
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
