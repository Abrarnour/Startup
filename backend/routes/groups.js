// backend/routes/groups.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

import { sendNotif, notifyAllAdmins, notifyParentsOf } from '../notifHelper.js'

const router = express.Router()

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Accès refusé - Admin uniquement' })
  next()
}

const adminOrTeacherMiddleware = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role))
    return res.status(403).json({ error: 'Accès refusé - Admin ou enseignant uniquement' })
  next()
}

// ─── GET groups of a course ───────────────────────────────────────────────────
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id AND status = 'active') as enrolled_students
       FROM groups g WHERE g.course_id = $1 ORDER BY g.group_name`,
      [req.params.courseId],
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET one group ────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, c.title as course_title, c.course_type, c.max_students_per_group,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id AND status = 'active') as enrolled_students
       FROM groups g INNER JOIN courses c ON g.course_id = c.id WHERE g.id = $1`,
      [req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── CREATE GROUP ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Accès refusé' })
  }

  const {
    course_id,
    group_name,
    salle,
    start_date,
    start_time,
    end_time,
    calendar_type,
    total_weeks,
    total_sessions,
    sessions_per_week,
    repeat_calendar,
    sessions,
    day_of_week,
    session_start_time,
    session_end_time,
    registration_open = true,
  } = req.body

  try {
    if (!course_id || !group_name) {
      return res.status(400).json({ error: 'course_id et group_name requis' })
    }

    const courseCheck = await pool.query(
      `SELECT c.course_type, c.title, c.teacher_id,
              u.name as teacher_name, u.last_name as teacher_last_name
       FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.id = $1`,
      [course_id],
    )
    if (courseCheck.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' })

    const courseInfo = courseCheck.rows[0]

    const result = await pool.query(
      `INSERT INTO groups (
        course_id, group_name, salle,
        start_date, start_time, end_time,
        day_of_week, session_start_time, session_end_time,
        calendar_type, total_weeks, total_sessions, sessions_per_week,
        repeat_calendar, registration_open, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true) RETURNING *`,
      [
        course_id,
        group_name,
        salle || null,
        start_date || null,
        start_time || null,
        end_time || null,
        day_of_week || null,
        session_start_time || null,
        session_end_time || null,
        calendar_type || 'manual',
        total_weeks || 4,
        total_sessions,
        sessions_per_week || 1,
        repeat_calendar || false,
        registration_open,
      ],
    )

    const newGroup = result.rows[0]

    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      const validSessions = sessions.filter(
        (s) => s.date && s.date !== '' && s.start_time && s.start_time !== '',
      )
      if (validSessions.length > 0) {
        await pool.query(`SELECT create_manual_sessions_v2($1, $2)`, [
          newGroup.id,
          JSON.stringify(validSessions),
        ])
      }
    }

    const ts = Date.now()
    const dayLabel = day_of_week ? `يوم ${day_of_week}` : ''
    const timeLabel = session_start_time ? `الساعة ${session_start_time}` : ''

    if (courseInfo.teacher_id && req.user.role === 'admin') {
      await sendNotif(
        pool,
        courseInfo.teacher_id,
        `group_created_teacher_${newGroup.id}_${ts}`,
        `📋 تم إنشاء مجموعة جديدة "${group_name}" لمادتك "${courseInfo.title}" ${dayLabel} ${timeLabel}.`,
        'assignment',
      )
    }

    if (req.user.role === 'teacher') {
      await notifyAllAdmins(
        pool,
        `group_created_admin_${newGroup.id}_${ts}`,
        `📋 الأستاذ ${courseInfo.teacher_name} ${courseInfo.teacher_last_name} أنشأ مجموعة جديدة "${group_name}" لمادة "${courseInfo.title}".`,
        'info',
      )
    }

    res.status(201).json(newGroup)
  } catch (error) {
    console.error('Erreur création groupe:', error)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Un groupe avec ce nom existe déjà pour ce cours.' })
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── UPDATE GROUP ─────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const {
    group_name,
    salle,
    start_date,
    start_time,
    end_time,
    day_of_week,
    session_start_time,
    session_end_time,
    calendar_type,
    total_weeks,
    repeat_calendar,
    registration_open,
  } = req.body

  try {
    const before = await pool.query(
      `SELECT g.group_name, g.salle, g.day_of_week, g.session_start_time,
              c.title as course_title, c.teacher_id
       FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.id = $1`,
      [req.params.id],
    )
    if (before.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })

    const oldInfo = before.rows[0]

    const result = await pool.query(
      `UPDATE groups SET
        group_name=COALESCE($1,group_name), salle=COALESCE($2,salle),
        start_date=COALESCE($3,start_date), start_time=COALESCE($4,start_time),
        end_time=COALESCE($5,end_time), day_of_week=COALESCE($6,day_of_week),
        session_start_time=COALESCE($7,session_start_time), session_end_time=COALESCE($8,session_end_time),
        calendar_type=COALESCE($9,calendar_type), total_weeks=COALESCE($10,total_weeks),
        repeat_calendar=COALESCE($11,repeat_calendar), registration_open=COALESCE($12,registration_open),
        updated_at=CURRENT_TIMESTAMP
       WHERE id=$13 RETURNING *`,
      [
        group_name,
        salle,
        start_date,
        start_time,
        end_time,
        day_of_week,
        session_start_time,
        session_end_time,
        calendar_type,
        total_weeks,
        repeat_calendar,
        registration_open,
        req.params.id,
      ],
    )

    const ts = Date.now()
    const newDay = day_of_week || oldInfo.day_of_week
    const newTime = session_start_time || oldInfo.session_start_time
    const newName = group_name || oldInfo.group_name
    const newSalle = salle || oldInfo.salle

    const scheduleChanged =
      (day_of_week && day_of_week !== oldInfo.day_of_week) ||
      (session_start_time && session_start_time !== oldInfo.session_start_time) ||
      (salle && salle !== oldInfo.salle)

    if (scheduleChanged) {
      const changedMsg = `📅 تم تعديل جدول المجموعة "${newName}" في مادة "${oldInfo.course_title}": يوم ${newDay} الساعة ${newTime}، ${newSalle ? 'القاعة ' + newSalle : ''}.`

      if (oldInfo.teacher_id) {
        await sendNotif(
          pool,
          oldInfo.teacher_id,
          `group_updated_teacher_${req.params.id}_${ts}`,
          changedMsg,
          'info',
        )
      }

      const students = await pool.query(
        `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
        [req.params.id],
      )
      for (const st of students.rows) {
        await sendNotif(
          pool,
          st.student_id,
          `group_updated_student_${req.params.id}_${st.student_id}_${ts}`,
          changedMsg,
          'info',
        )
        await notifyParentsOf(
          pool,
          st.student_id,
          `group_updated_parent_${req.params.id}_${st.student_id}_${ts}`,
          changedMsg,
          'info',
        )
      }
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification groupe:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── DELETE GROUP ─────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const info = await pool.query(
      `SELECT g.group_name, c.title as course_title, c.teacher_id
       FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.id = $1`,
      [req.params.id],
    )
    if (info.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    const gi = info.rows[0]

    const students = await pool.query(
      `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
      [req.params.id],
    )

    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id])

    const ts = Date.now()

    if (gi.teacher_id) {
      await sendNotif(
        pool,
        gi.teacher_id,
        `group_deleted_teacher_${req.params.id}_${ts}`,
        `🗑️ تم حذف المجموعة "${gi.group_name}" من مادة "${gi.course_title}".`,
        'warning',
      )
    }

    for (const st of students.rows) {
      const msg = `⚠️ المجموعة "${gi.group_name}" في مادة "${gi.course_title}" تم حذفها. يرجى التواصل مع الإدارة.`
      await sendNotif(
        pool,
        st.student_id,
        `group_deleted_s${st.student_id}_${req.params.id}_${ts}`,
        msg,
        'warning',
      )
      await notifyParentsOf(
        pool,
        st.student_id,
        `group_deleted_p${st.student_id}_${req.params.id}_${ts}`,
        msg,
        'warning',
      )
    }

    res.json({ message: 'Groupe supprimé avec succès', group: info.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── TOGGLE REGISTRATION ──────────────────────────────────────────────────────
router.patch('/:id/toggle-registration', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE groups SET registration_open = NOT registration_open, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 RETURNING *`,
      [req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })

    const g = result.rows[0]
    const info = await pool.query(
      `SELECT c.title, c.teacher_id FROM courses c JOIN groups gr ON gr.course_id = c.id WHERE gr.id = $1`,
      [req.params.id],
    )

    if (info.rows[0]?.teacher_id) {
      const status = g.registration_open ? 'مفتوحة ✅' : 'مغلقة 🔒'
      await sendNotif(
        pool,
        info.rows[0].teacher_id,
        `reg_toggle_${req.params.id}_${Date.now()}`,
        `🔔 التسجيلات في مجموعة "${g.group_name}" لمادة "${info.rows[0].title}" أصبحت ${status}.`,
        'info',
      )
    }

    res.json(g)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET STUDENTS IN GROUP ────────────────────────────────────────────────────
router.get('/:groupId/students', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM v_group_students_detailed WHERE group_id = $1 ORDER BY last_name, name`,
      [req.params.groupId],
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── ADD STUDENT TO GROUP ─────────────────────────────────────────────────────
router.post('/:groupId/students', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { groupId } = req.params
  const {
    student_id,
    email,
    name,
    last_name,
    birthday,
    gender,
    parent_phone,
    create_if_not_exists,
  } = req.body

  try {
    let studentId = student_id

    if (create_if_not_exists && email && name && last_name) {
      const existingStudent = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (existingStudent.rows.length > 0) {
        studentId = existingStudent.rows[0].id
      } else {
        const password = 'student' + Math.random().toString(36).substring(7)
        const newStudent = await pool.query(
          `INSERT INTO users (name, last_name, email, password, role, birthday, gender, parent_phone)
           VALUES ($1,$2,$3,$4,'student',$5,$6,$7) RETURNING id`,
          [name, last_name, email, password, birthday, gender, parent_phone],
        )
        studentId = newStudent.rows[0].id

        await sendNotif(
          pool,
          studentId,
          `account_created_${studentId}_${Date.now()}`,
          `🎉 تم إنشاء حسابك في مدرسة بلماحي! بريدك: ${email}. يمكنك الآن تسجيل الدخول.`,
          'welcome',
        )
      }
    }

    if (!studentId) {
      return res.status(400).json({ error: 'student_id requis' })
    }

    const alreadyEnrolled = await pool.query(
      'SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2',
      [groupId, studentId],
    )
    if (alreadyEnrolled.rows.length > 0) {
      return res.status(400).json({ error: 'Cet étudiant est déjà inscrit dans ce groupe' })
    }

    const courseInfo = await pool.query(
      `SELECT c.price, c.title, c.teacher_id,
              g.group_name, g.day_of_week, g.session_start_time, g.salle,
              t.name as teacher_name, t.last_name as teacher_last_name, t.gender as teacher_gender,
              s.name as student_name, s.last_name as student_last_name
       FROM groups g
       JOIN courses c ON g.course_id = c.id
       LEFT JOIN users t ON c.teacher_id = t.id
       LEFT JOIN users s ON s.id = $2
       WHERE g.id = $1`,
      [groupId, studentId],
    )

    if (courseInfo.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    const info = courseInfo.rows[0]

    const result = await pool.query(
      `INSERT INTO group_students
         (group_id, student_id, status, payment_status, amount_paid, payment_due,
          enrollment_type, requested_by, last_payment_date, sessions_attended, cycle_start_date)
       VALUES ($1,$2,'active','paid',0,$3,'direct',$4,CURRENT_DATE,0,NOW()) RETURNING *`,
      [groupId, studentId, info.price, req.user.id],
    )

    await pool.query(
      `UPDATE groups SET current_students = (
        SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active'
      ) WHERE id = $1`,
      [groupId],
    )

    const ts = Date.now()
    const dayLabel = info.day_of_week ? `يوم ${info.day_of_week}` : ''
    const timeLabel = info.session_start_time ? `الساعة ${info.session_start_time}` : ''
    const salleLabel = info.salle ? `، القاعة: ${info.salle}` : ''
    const teacherTitle = info.teacher_gender === 'F' ? 'أ.' : 'أ.'

    await sendNotif(
      pool,
      studentId,
      `enrolled_student_${groupId}_${studentId}_${ts}`,
      `🎓 تم تسجيلك في مادة "${info.title}" — ${dayLabel} ${timeLabel}${salleLabel}. أستاذك: ${teacherTitle} ${info.teacher_name} ${info.teacher_last_name}.`,
      'assignment',
    )

    await notifyParentsOf(
      pool,
      studentId,
      `enrolled_parent_${groupId}_${studentId}_${ts}`,
      `🎓 تم تسجيل ابنك ${info.student_name} ${info.student_last_name} في مادة "${info.title}" — ${dayLabel} ${timeLabel}${salleLabel}. الأستاذ: ${teacherTitle} ${info.teacher_name} ${info.teacher_last_name}.`,
      'assignment',
    )

    if (info.teacher_id) {
      await sendNotif(
        pool,
        info.teacher_id,
        `enrolled_teacher_${groupId}_${studentId}_${ts}`,
        `👤 انضم طالب جديد "${info.student_name} ${info.student_last_name}" إلى مجموعتك "${info.group_name}" في مادة "${info.title}".`,
        'info',
      )
    }

    if (req.user.role === 'teacher') {
      await notifyAllAdmins(
        pool,
        `enrolled_admin_${groupId}_${studentId}_${ts}`,
        `👤 الأستاذ ${info.teacher_name} ${info.teacher_last_name} أضاف الطالب "${info.student_name} ${info.student_last_name}" إلى مجموعة "${info.group_name}" في مادة "${info.title}".`,
        'info',
      )
    }

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erreur ajout étudiant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── REMOVE STUDENT FROM GROUP ────────────────────────────────────────────────
router.delete(
  '/:groupId/students/:studentId',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    try {
      const info = await pool.query(
        `SELECT c.title, c.teacher_id, g.group_name, g.day_of_week, g.session_start_time,
              s.name as student_name, s.last_name as student_last_name
       FROM groups g JOIN courses c ON g.course_id = c.id
       LEFT JOIN users s ON s.id = $2
       WHERE g.id = $1`,
        [groupId, studentId],
      )

      const result = await pool.query(
        'DELETE FROM group_students WHERE group_id=$1 AND student_id=$2 RETURNING *',
        [groupId, studentId],
      )
      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Étudiant non trouvé dans ce groupe' })

      await pool.query(
        `UPDATE groups SET current_students = (
        SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active'
      ) WHERE id = $1`,
        [groupId],
      )

      if (info.rows.length > 0) {
        const gi = info.rows[0]
        const ts = Date.now()
        const msg = `❌ تم إلغاء تسجيلك في مجموعة "${gi.group_name}" لمادة "${gi.title}". يرجى التواصل مع الإدارة.`

        await sendNotif(
          pool,
          studentId,
          `unenrolled_s${studentId}_${groupId}_${ts}`,
          msg,
          'warning',
        )

        await notifyParentsOf(
          pool,
          studentId,
          `unenrolled_parent_${studentId}_${groupId}_${ts}`,
          `❌ تم إلغاء تسجيل ابنك ${gi.student_name} ${gi.student_last_name} من مجموعة "${gi.group_name}" لمادة "${gi.title}".`,
          'warning',
        )

        if (gi.teacher_id) {
          await sendNotif(
            pool,
            gi.teacher_id,
            `unenrolled_teacher_${studentId}_${groupId}_${ts}`,
            `👤 تم إلغاء تسجيل الطالب "${gi.student_name} ${gi.student_last_name}" من مجموعتك "${gi.group_name}" في مادة "${gi.title}".`,
            'info',
          )
        }
      }

      res.json({ message: 'Étudiant retiré avec succès' })
    } catch (error) {
      console.error('Erreur retrait étudiant:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// ─── UPDATE PAYMENT ───────────────────────────────────────────────────────────
router.patch(
  '/:groupId/students/:studentId/payment',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    const { payment_status } = req.body

    if (!['paid', 'pending'].includes(payment_status)) {
      return res.status(400).json({ error: 'payment_status must be "paid" or "pending"' })
    }

    try {
      const result = await pool.query(
        `UPDATE group_students SET payment_status=$1,
        last_payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE last_payment_date END
       WHERE group_id=$2 AND student_id=$3 RETURNING *`,
        [payment_status, groupId, studentId],
      )
      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Inscription non trouvée' })

      const info = await pool.query(
        `SELECT c.title, g.group_name FROM groups g JOIN courses c ON g.course_id = c.id WHERE g.id = $1`,
        [groupId],
      )

      if (info.rows.length > 0) {
        const ts = Date.now()
        const statusAr = payment_status === 'paid' ? 'مدفوع ✅' : 'في الانتظار ⏳'
        const msg = `💳 تم تحديث حالة دفعتك في مادة "${info.rows[0].title}" (${info.rows[0].group_name}) إلى: ${statusAr}.`

        await sendNotif(pool, studentId, `payment_${studentId}_${groupId}_${ts}`, msg, 'info')

        await notifyParentsOf(
          pool,
          studentId,
          `payment_parent_${studentId}_${groupId}_${ts}`,
          `💳 تم تحديث حالة دفع ابنك في مادة "${info.rows[0].title}" إلى: ${statusAr}.`,
          'info',
        )
      }

      res.json(result.rows[0])
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// ─── NOTES ────────────────────────────────────────────────────────────────────
router.get('/:groupId/students/:studentId/notes', authMiddleware, async (req, res) => {
  try {
    const { groupId, studentId } = req.params
    const userRole = req.user.role

    if (userRole === 'Parent') {
      const childCheck = await pool.query(
        'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, studentId],
      )
      if (childCheck.rows.length === 0)
        return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })
    }

    const enrollment = await pool.query(
      'SELECT id FROM group_students WHERE group_id=$1 AND student_id=$2',
      [groupId, studentId],
    )
    if (enrollment.rows.length === 0)
      return res.status(404).json({ error: 'Inscription non trouvée' })

    let query = `
      SELECT sn.id, sn.note_text, sn.note_type, sn.is_important, sn.is_private, sn.created_at,
             u.name as author_name, u.last_name as author_last_name, u.role as author_role
      FROM student_notes sn LEFT JOIN users u ON sn.author_id = u.id
      WHERE sn.group_student_id = $1`
    if (userRole !== 'admin') query += ' AND sn.is_private = false'
    query += ' ORDER BY sn.created_at DESC'

    const result = await pool.query(query, [enrollment.rows[0].id])
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── ADD NOTE ─────────────────────────────────────────────────────────────────
router.post(
  '/:groupId/students/:studentId/notes',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    const { note_text, note_type, is_important, is_private } = req.body

    try {
      if (!note_text) return res.status(400).json({ error: 'note_text requis' })

      const enrollment = await pool.query(
        'SELECT id FROM group_students WHERE group_id=$1 AND student_id=$2',
        [groupId, studentId],
      )
      if (enrollment.rows.length === 0)
        return res.status(404).json({ error: 'Inscription non trouvée' })

      const noteId = await pool.query('SELECT add_student_note($1,$2,$3,$4,$5,$6) as id', [
        enrollment.rows[0].id,
        req.user.id,
        note_text,
        note_type || 'general',
        is_important || false,
        is_private || false,
      ])

      const result = await pool.query(
        `SELECT sn.*, u.name as author_name, u.last_name as author_last_name, u.role as author_role
       FROM student_notes sn LEFT JOIN users u ON sn.author_id = u.id WHERE sn.id = $1`,
        [noteId.rows[0].id],
      )

      if (!is_private) {
        const info = await pool.query(
          `SELECT c.title, g.group_name, s.name as sname, s.last_name as slast
         FROM groups g JOIN courses c ON g.course_id = c.id
         LEFT JOIN users s ON s.id = $2 WHERE g.id = $1`,
          [groupId, studentId],
        )

        if (info.rows.length > 0) {
          const gi = info.rows[0]
          const ts = Date.now()
          const importance = is_important ? ' ⚠️ مهم' : ''

          await sendNotif(
            pool,
            studentId,
            `note_student_${noteId.rows[0].id}_${ts}`,
            `📝 أضاف أستاذك ملاحظة جديدة${importance} في مادة "${gi.title}": "${note_text.substring(0, 60)}${note_text.length > 60 ? '...' : ''}"`,
            is_important ? 'warning' : 'info',
          )

          await notifyParentsOf(
            pool,
            studentId,
            `note_parent_${noteId.rows[0].id}_${ts}`,
            `📝 ملاحظة جديدة${importance} على سجل ابنك ${gi.sname} ${gi.slast} في مادة "${gi.title}": "${note_text.substring(0, 60)}${note_text.length > 60 ? '...' : ''}"`,
            is_important ? 'warning' : 'info',
          )
        }
      }

      res.status(201).json(result.rows[0])
    } catch (error) {
      res.status(500).json({ error: error.message || 'Erreur serveur' })
    }
  },
)

// ─── DELETE NOTE ──────────────────────────────────────────────────────────────
router.delete('/:groupId/students/:studentId/notes/:noteId', authMiddleware, async (req, res) => {
  try {
    const noteCheck = await pool.query('SELECT author_id FROM student_notes WHERE id = $1', [
      req.params.noteId,
    ])
    if (noteCheck.rows.length === 0) return res.status(404).json({ error: 'Note non trouvée' })
    if (req.user.role !== 'admin' && noteCheck.rows[0].author_id !== req.user.id)
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres notes' })

    await pool.query('DELETE FROM student_notes WHERE id = $1', [req.params.noteId])
    res.json({ message: 'Note supprimée avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── CALENDAR / SESSIONS ──────────────────────────────────────────────────────
router.get('/:groupId/calendar', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM get_group_calendar($1)', [req.params.groupId])
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/:groupId/calendar', authMiddleware, adminMiddleware, async (req, res) => {
  const { sessions } = req.body
  try {
    if (!sessions || !Array.isArray(sessions))
      return res.status(400).json({ error: 'sessions requis' })
    await pool.query('SELECT create_manual_sessions($1, $2)', [
      req.params.groupId,
      JSON.stringify(sessions),
    ])
    const result = await pool.query('SELECT * FROM get_group_calendar($1)', [req.params.groupId])
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── SESSION CANCEL ───────────────────────────────────────────────────────────
router.patch(
  '/sessions/:sessionId/cancel',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { sessionId } = req.params
    const { reason } = req.body
    try {
      const sessionInfo = await pool.query(
        `SELECT ss.session_date, ss.start_time, ss.session_title,
              g.id as group_id, g.group_name, g.salle,
              c.title as course_title, c.teacher_id,
              t.name as teacher_name, t.last_name as teacher_last_name
       FROM session_schedule ss
       JOIN groups g ON ss.group_id = g.id
       JOIN courses c ON g.course_id = c.id
       LEFT JOIN users t ON c.teacher_id = t.id
       WHERE ss.id = $1`,
        [sessionId],
      )

      await pool.query('SELECT cancel_session($1, $2)', [sessionId, reason || 'Annulée'])

      if (sessionInfo.rows.length > 0) {
        const si = sessionInfo.rows[0]
        const ts = Date.now()
        const reasonText = reason ? `السبب: ${reason}` : ''
        const dateStr = si.session_date ? new Date(si.session_date).toLocaleDateString('ar-DZ') : ''
        const cancelMsg = `❌ تم إلغاء الحصة "${si.session_title || si.course_title}" بتاريخ ${dateStr} ${si.start_time || ''} (${si.group_name}). ${reasonText}`

        const students = await pool.query(
          `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
          [si.group_id],
        )
        for (const st of students.rows) {
          await sendNotif(
            pool,
            st.student_id,
            `session_cancel_s${st.student_id}_${sessionId}_${ts}`,
            cancelMsg,
            'warning',
          )
          await notifyParentsOf(
            pool,
            st.student_id,
            `session_cancel_p${st.student_id}_${sessionId}_${ts}`,
            cancelMsg,
            'warning',
          )
        }

        if (si.teacher_id && req.user.role === 'admin') {
          await sendNotif(
            pool,
            si.teacher_id,
            `session_cancel_t${si.teacher_id}_${sessionId}_${ts}`,
            `❌ تم إلغاء حصتك "${si.session_title || si.course_title}" بتاريخ ${dateStr} من قبل الإدارة. ${reasonText}`,
            'warning',
          )
        }

        if (req.user.role === 'teacher') {
          await notifyAllAdmins(
            pool,
            `session_cancel_admin_${sessionId}_${ts}`,
            `❌ الأستاذ ${si.teacher_name} ${si.teacher_last_name} ألغى الحصة "${si.session_title || si.course_title}" بتاريخ ${dateStr}. ${reasonText}`,
            'warning',
          )
        }
      }

      const result = await pool.query('SELECT * FROM session_schedule WHERE id = $1', [sessionId])
      res.json(result.rows[0])
    } catch (error) {
      console.error('Erreur annulation session:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

router.patch('/sessions/:sessionId', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { sessionId } = req.params
  const { actual_date, start_time, end_time, session_title } = req.body
  try {
    await pool.query('SELECT modify_session($1,$2,$3,$4,$5)', [
      sessionId,
      actual_date,
      start_time,
      end_time,
      session_title,
    ])
    const result = await pool.query('SELECT * FROM session_schedule WHERE id = $1', [sessionId])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/students/available', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, last_name, email, parent_phone, gender, birthday FROM users WHERE role = 'student' ORDER BY last_name, name`,
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/:id/sessions-config', authMiddleware, adminMiddleware, async (req, res) => {
  const { total_sessions, total_weeks, sessions_per_week } = req.body
  try {
    const result = await pool.query(
      `UPDATE groups SET total_sessions=COALESCE($1,total_sessions), total_weeks=COALESCE($2,total_weeks),
        sessions_per_week=COALESCE($3,sessions_per_week), updated_at=CURRENT_TIMESTAMP
       WHERE id=$4 RETURNING *`,
      [total_sessions, total_weeks, sessions_per_week, req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/:id/max-students', authMiddleware, adminMiddleware, async (req, res) => {
  const { max_students } = req.body
  try {
    const currentCount = await pool.query(
      `SELECT COUNT(*) as count FROM group_students WHERE group_id = $1 AND status = 'active'`,
      [req.params.id],
    )
    if (max_students < parseInt(currentCount.rows[0].count)) {
      return res
        .status(400)
        .json({ error: `Il y a déjà ${currentCount.rows[0].count} étudiants inscrits.` })
    }
    const result = await pool.query(
      `UPDATE courses c SET max_students_per_group=$1 FROM groups g WHERE c.id=g.course_id AND g.id=$2 RETURNING g.*, c.max_students_per_group`,
      [max_students, req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post(
  '/:id/next-cycle-modifications',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { reason, total_weeks, total_sessions, sessions, return_to_normal } = req.body
    try {
      if (!reason || !total_weeks || !total_sessions || !sessions) {
        return res.status(400).json({ error: 'Paramètres manquants' })
      }
      await pool.query(`SELECT save_next_cycle_modifications($1,$2,$3,$4,$5,$6)`, [
        req.params.id,
        reason,
        total_weeks,
        total_sessions,
        JSON.stringify(sessions),
        return_to_normal !== undefined ? return_to_normal : true,
      ])
      const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
        req.params.id,
      ])
      res.json({ message: 'Modifications enregistrées', group: result.rows[0] })
    } catch (error) {
      res.status(500).json({ error: error.message || 'Erreur serveur' })
    }
  },
)

router.post('/:id/apply-next-cycle', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT has_next_cycle_modifications FROM groups WHERE id = $1',
      [req.params.id],
    )
    if (!check.rows[0]?.has_next_cycle_modifications)
      return res.status(400).json({ error: 'Aucune modification de cycle en attente' })
    await pool.query('SELECT apply_next_cycle_modifications($1)', [req.params.id])
    const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
      req.params.id,
    ])
    res.json({ message: 'Cycle appliqué', group: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.delete(
  '/:id/next-cycle-modifications',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE groups SET has_next_cycle_modifications=false, next_cycle_modifications=NULL,
        return_to_normal_after_cycle=true WHERE id=$1 RETURNING *`,
        [req.params.id],
      )
      res.json({ message: 'Modifications annulées', group: result.rows[0] })
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

router.post('/:id/return-to-normal', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    await pool.query('SELECT return_to_normal_cycle($1)', [req.params.id])
    const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
      req.params.id,
    ])
    res.json({ message: 'Retour au cycle normal', group: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.get('/:id/cycle-info', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, (SELECT COUNT(*) FROM session_schedule WHERE group_id=g.id) as current_sessions_count,
        (SELECT COUNT(*) FROM group_students WHERE group_id=g.id AND status='active') as enrolled_students,
        c.max_students_per_group, c.price
       FROM groups g INNER JOIN courses c ON g.course_id=c.id WHERE g.id=$1`,
      [req.params.id],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.patch('/:id/sessions', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { sessions } = req.body
  try {
    if (!sessions || !Array.isArray(sessions))
      return res.status(400).json({ error: 'sessions requis' })
    await pool.query('SELECT create_manual_sessions_v2($1,$2)', [
      req.params.id,
      JSON.stringify(sessions),
    ])
    const result = await pool.query(
      'SELECT * FROM v_sessions_detailed WHERE group_id=$1 ORDER BY session_number',
      [req.params.id],
    )
    res.json({ message: 'Sessions mises à jour', sessions: result.rows })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

router.patch('/:groupId/students/:studentId/state', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
  const { groupId, studentId } = req.params
  const { status, payment_status } = req.body
  try {
    await pool.query(
      `UPDATE group_students SET status = $1, payment_status = $2
       WHERE group_id = $3 AND student_id = $4`,
      [status, payment_status, groupId, studentId],
    )
    await pool.query(
      `UPDATE groups SET current_students = (SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active') WHERE id = $1`,
      [groupId],
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/cleanup/pending-enrollments', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })

  const rawDays = parseInt(req.query.days, 10)
  const days = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 14

  try {
    const result = await pool.query(
      `DELETE FROM group_students
       WHERE status = 'inactive'
         AND enrollment_date < NOW() - ($1 || ' days')::INTERVAL
       RETURNING id`,
      [days],
    )
    console.log(
      `[CLEANUP] Admin ${req.user.id} removed ${result.rowCount} pending enrollments (threshold: ${days} days)`,
    )
    res.json({ deleted: result.rowCount, days })
  } catch (err) {
    console.error('Pending cleanup error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// TICKET SYSTEM ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /:groupId/scan/:studentId ──────────────────────────────────────────
// Replaces the old GET version. Changed to POST because this route has a
// side-effect: it increments sessions_attended and inserts into attendance_log.
// Double-scan protection: a unique index on (group_id, student_id, date) in
// attendance_log prevents the counter from incrementing more than once per day.
router.post(
  '/:groupId/scan/:studentId',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params

    try {
      const result = await pool.query(
        `SELECT
           u.id, u.name, u.last_name, u.birthday, u.gender, u.photo_url,
           gs.status          AS enrollment_status,
           gs.payment_status,
           gs.sessions_attended,
           gs.cycle_start_date,
           g.group_name,
           g.day_of_week,
           g.total_sessions
         FROM users u
         LEFT JOIN group_students gs
               ON u.id = gs.student_id AND gs.group_id = $1
         LEFT JOIN groups g ON g.id = $1
         WHERE u.id = $2`,
        [groupId, studentId],
      )

      if (result.rows.length === 0) return res.status(404).json({ error: 'Étudiant non trouvé' })

      const data = result.rows[0]

      if (data.birthday) {
        const ageDiff = Date.now() - new Date(data.birthday).getTime()
        data.age = Math.abs(new Date(ageDiff).getUTCFullYear() - 1970)
      }

      // ─── Day-of-week security check ──────────────────────────────────────────
      if (data.day_of_week) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const todayDay = days[new Date().getDay()]
        if (todayDay !== data.day_of_week) {
          return res.json({
            ...data,
            access: 'WRONG_DAY',
            scheduled_day: data.day_of_week,
            today_day: todayDay,
          })
        }
      }

      if (!data.enrollment_status) data.access = 'NOT_ENROLLED'
      else if (data.enrollment_status === 'inactive') data.access = 'INACTIVE'
      else if (data.payment_status !== 'paid') data.access = 'NOT_PAID'
      else data.access = 'GRANTED'

      if (data.access === 'GRANTED') {
        const today = new Date().toISOString().split('T')[0]

        const alreadyScanned = await pool.query(
          `SELECT id FROM attendance_log
           WHERE group_id   = $1
             AND student_id = $2
             AND scanned_at::date = $3::date`,
          [groupId, studentId, today],
        )

        if (alreadyScanned.rows.length === 0) {
          // First scan today — increment ticket counter
          const updated = await pool.query(
            `UPDATE group_students
             SET sessions_attended = sessions_attended + 1
             WHERE group_id = $1 AND student_id = $2
             RETURNING sessions_attended`,
            [groupId, studentId],
          )
          data.sessions_attended = updated.rows[0].sessions_attended

          await pool.query(
            `INSERT INTO attendance_log (group_id, student_id, session_number, scanned_by)
             SELECT $1, $2, $3, $4
             WHERE NOT EXISTS (
               SELECT 1 FROM attendance_log
               WHERE group_id = $1 AND student_id = $2
                 AND scanned_at::date = CURRENT_DATE
             )`,
            [groupId, studentId, data.sessions_attended, req.user.id],
          )

          data.already_scanned_today = false

          // ─── Auto-flip to pending when cycle is complete ──────────────────
          if (data.total_sessions && data.sessions_attended >= data.total_sessions) {
            await pool.query(
              `UPDATE group_students SET payment_status = 'pending'
               WHERE group_id = $1 AND student_id = $2`,
              [groupId, studentId],
            )
            data.cycle_completed = true
            data.payment_status = 'pending'
            const ts = Date.now()
            const courseInfo = await pool.query(
              `SELECT c.title FROM groups g JOIN courses c ON c.id = g.course_id WHERE g.id = $1`,
              [groupId],
            )
            if (courseInfo.rows.length > 0) {
              await sendNotif(
                pool,
                Number(studentId),
                `cycle_done_${groupId}_${studentId}_${ts}`,
                `\u{1F514} انتهت دورتك في مادة "${courseInfo.rows[0].title}" (${data.sessions_attended}/${data.total_sessions} جلسات). يرجى تجديد الاشتراك.`,
                'payment',
              )
              await notifyAllAdmins(
                pool,
                `cycle_done_admin_${groupId}_${studentId}_${ts}`,
                `\u{1F514} الطالب ${data.name} ${data.last_name} أتم دورته في "${courseInfo.rows[0].title}" — يحتاج تجديد.`,
                'payment',
              )
            }
          }
        } else {
          // Already scanned today — return current count, do NOT increment
          data.already_scanned_today = true
        }

        data.session_number = data.sessions_attended
      }

      res.json(data)
    } catch (error) {
      console.error('Scan Error:', error)
      if (error.code === '42703' || error.code === '42P01') {
        return res.status(503).json({
          error: 'Migration DB manquante',
          detail:
            "Exécutez railway_migration.sql sur votre base Railway avant d'utiliser le système de tickets.",
        })
      }
      res.status(500).json({ error: 'Erreur serveur lors du scan' })
    }
  },
)

// ─── PATCH /:groupId/students/:studentId/mark-paid ────────────────────────────
// Admin marks a student as paid → resets sessions_attended to 0 and starts a
// new billing cycle (cycle_start_date = NOW()).
router.patch(
  '/:groupId/students/:studentId/mark-paid',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params

    try {
      const result = await pool.query(
        `UPDATE group_students
         SET
           payment_status    = 'paid',
           sessions_attended = 0,
           cycle_start_date  = NOW(),
           last_payment_date = CURRENT_DATE
         WHERE group_id = $1 AND student_id = $2
         RETURNING *`,
        [groupId, studentId],
      )

      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Inscription non trouvée' })

      // Notify student
      const ts = Date.now()
      const studentInfo = await pool.query(
        `SELECT u.name, u.last_name, c.title
         FROM users u
         JOIN group_students gs ON gs.student_id = u.id
         JOIN groups g          ON g.id = gs.group_id
         JOIN courses c         ON c.id = g.course_id
         WHERE gs.group_id = $1 AND gs.student_id = $2`,
        [groupId, studentId],
      )
      if (studentInfo.rows.length > 0) {
        const si = studentInfo.rows[0]
        await sendNotif(
          pool,
          Number(studentId),
          `paid_cycle_${groupId}_${studentId}_${ts}`,
          `✅ تم تسجيل دفعتك لمادة "${si.title}". دورة جديدة بدأت — حضورك يُحسب من الجلسة القادمة.`,
          'payment',
        )
      }

      res.json({ success: true, enrollment: result.rows[0] })
    } catch (err) {
      console.error('Mark-paid error:', err)
      if (err.code === '42703' || err.code === '42P01') {
        return res.status(503).json({
          error: 'Migration DB manquante',
          detail: 'Exécutez railway_migration.sql sur votre base Railway.',
        })
      }
      res.status(500).json({ error: err.message })
    }
  },
)

// ─── POST /:groupId/students/:studentId/pay-and-scan ─────────────────────
// Admin: mark student as paid + count today as session #1 of the new cycle.
router.post(
  '/:groupId/students/:studentId/pay-and-scan',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    const ts = Date.now()

    try {
      const result = await pool.query(
        `UPDATE group_students
         SET
           payment_status    = 'paid',
           sessions_attended = 1,
           cycle_start_date  = NOW(),
           last_payment_date = CURRENT_DATE
         WHERE group_id = $1 AND student_id = $2
         RETURNING *`,
        [groupId, studentId],
      )

      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Inscription non trouvée' })

      await pool.query(
        `INSERT INTO attendance_log (group_id, student_id, session_number, scanned_by)
         SELECT $1, $2, 1, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM attendance_log
           WHERE group_id = $1 AND student_id = $2
             AND scanned_at::date = CURRENT_DATE
         )`,
        [groupId, studentId, req.user.id],
      )

      const studentInfo = await pool.query(
        `SELECT u.name, u.last_name, c.title, g.total_sessions
         FROM users u
         JOIN group_students gs ON gs.student_id = u.id
         JOIN groups g          ON g.id = gs.group_id
         JOIN courses c         ON c.id = g.course_id
         WHERE gs.group_id = $1 AND gs.student_id = $2`,
        [groupId, studentId],
      )
      if (studentInfo.rows.length > 0) {
        const si = studentInfo.rows[0]
        const cycleStr = si.total_sessions ? `/${si.total_sessions}` : ''
        await sendNotif(
          pool,
          Number(studentId),
          `pay_scan_${groupId}_${studentId}_${ts}`,
          `✅ تم تسجيل دفعتك لمادة "${si.title}". دورة جديدة — الجلسة 1${cycleStr} سُجّلت اليوم.`,
          'payment',
        )
      }

      res.json({ success: true, enrollment: result.rows[0], session_number: 1 })
    } catch (err) {
      console.error('Pay-and-scan error:', err)
      if (err.code === '42703' || err.code === '42P01') {
        return res
          .status(503)
          .json({ error: 'Migration DB manquante', detail: 'Exécutez railway_migration.sql.' })
      }
      res.status(500).json({ error: err.message })
    }
  },
)

// ─── GET /:groupId/absent-today ───────────────────────────────────────────────
// Returns all active students in the group who have NOT been scanned today.
// Used by the AbsentStudentsModal in GroupManagement.vue.
router.get('/:groupId/absent-today', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { groupId } = req.params
  const today = new Date().toISOString().split('T')[0]

  try {
    const result = await pool.query(
      `SELECT
           u.id,
           u.name,
           u.last_name,
           u.photo_url,
           gs.payment_status,
           COALESCE(gs.sessions_attended, 0) AS sessions_attended,
           gs.status AS enrollment_status
         FROM group_students gs
         JOIN users u ON gs.student_id = u.id
         WHERE gs.group_id = $1
           AND gs.status   = 'active'
           AND u.id NOT IN (
             SELECT student_id
             FROM   attendance_log
             WHERE  group_id         = $1
               AND  scanned_at::date = $2::date
           )
         ORDER BY u.last_name, u.name`,
      [groupId, today],
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Absent-today error:', err)
    // 42703 = undefined_column  |  42P01 = undefined_table
    // Both mean the migration hasn't been applied yet on this Railway DB.
    if (err.code === '42703' || err.code === '42P01') {
      return res.status(503).json({
        error: 'Migration DB requise — exécutez railway_migration.sql',
        detail: err.message,
        fix: 'Railway → Postgres → Data (Query tab) → collez railway_migration.sql → Run',
      })
    }
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /:groupId/bulk-remove-students ────────────────────────────────────
// Permanently removes multiple students from a group in one request.
// Body: { student_ids: [1, 2, 3] }
// Uses a distinct URL (/bulk-remove-students) to avoid Express conflicts with
// the existing DELETE /:groupId/students/:studentId route.
router.delete(
  '/:groupId/bulk-remove-students',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId } = req.params
    const { student_ids } = req.body

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'student_ids (array) requis' })
    }

    const ids = student_ids.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Aucun identifiant valide fourni' })
    }

    try {
      // Fetch info for notifications before deletion
      const infoRes = await pool.query(
        `SELECT
           u.id AS student_id,
           u.name, u.last_name,
           c.title  AS course_title,
           c.teacher_id,
           g.group_name
         FROM group_students gs
         JOIN users   u ON gs.student_id = u.id
         JOIN groups  g ON g.id = gs.group_id
         JOIN courses c ON c.id = g.course_id
         WHERE gs.group_id = $1 AND gs.student_id = ANY($2)`,
        [groupId, ids],
      )

      const delRes = await pool.query(
        `DELETE FROM group_students
         WHERE group_id = $1 AND student_id = ANY($2)
         RETURNING student_id`,
        [groupId, ids],
      )

      // Recount active students
      await pool.query(
        `UPDATE groups
         SET current_students = (
           SELECT COUNT(*) FROM group_students
           WHERE group_id = $1 AND status = 'active'
         )
         WHERE id = $1`,
        [groupId],
      )

      // Send notifications
      const ts = Date.now()
      for (const si of infoRes.rows) {
        const msg = `❌ تم إلغاء تسجيلك في مجموعة "${si.group_name}" لمادة "${si.course_title}". يرجى التواصل مع الإدارة.`
        await sendNotif(
          pool,
          si.student_id,
          `bulk_removed_s${si.student_id}_${groupId}_${ts}`,
          msg,
          'warning',
        )
        await notifyParentsOf(
          pool,
          si.student_id,
          `bulk_removed_p${si.student_id}_${groupId}_${ts}`,
          `❌ تم إلغاء تسجيل ابنك ${si.name} ${si.last_name} من مجموعة "${si.group_name}" لمادة "${si.course_title}".`,
          'warning',
        )
      }

      res.json({
        deleted: delRes.rowCount,
        removed_ids: delRes.rows.map((r) => r.student_id),
      })
    } catch (err) {
      console.error('Bulk-remove error:', err)
      res.status(500).json({ error: err.message })
    }
  },
)

export default router
