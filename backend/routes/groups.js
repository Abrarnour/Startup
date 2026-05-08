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
// 🔔 NOTIFICATIONS:
//   → Responsible teacher: "A new group was created for your course"
//   → All admins:          "New group created"
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

    // 🔔 Notify responsible teacher (if admin created the group)
    if (courseInfo.teacher_id && req.user.role === 'admin') {
      await sendNotif(
        pool,
        courseInfo.teacher_id,
        `group_created_teacher_${newGroup.id}_${ts}`,
        `📋 تم إنشاء مجموعة جديدة "${group_name}" لمادتك "${courseInfo.title}" ${dayLabel} ${timeLabel}.`,
        'assignment',
      )
    }

    // 🔔 Notify all admins (if teacher created the group)
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
// 🔔 NOTIFICATIONS:
//   → Teacher: "Group schedule was updated"
//   → Students in group: "Your group schedule changed"
//   → Parents of students: same
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
    // Get group info before update (for notifications)
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

    // Detect if schedule actually changed
    const scheduleChanged =
      (day_of_week && day_of_week !== oldInfo.day_of_week) ||
      (session_start_time && session_start_time !== oldInfo.session_start_time) ||
      (salle && salle !== oldInfo.salle)

    if (scheduleChanged) {
      const changedMsg = `📅 تم تعديل جدول المجموعة "${newName}" في مادة "${oldInfo.course_title}": يوم ${newDay} الساعة ${newTime}، ${newSalle ? 'القاعة ' + newSalle : ''}.`

      // 🔔 Notify teacher
      if (oldInfo.teacher_id) {
        await sendNotif(
          pool,
          oldInfo.teacher_id,
          `group_updated_teacher_${req.params.id}_${ts}`,
          changedMsg,
          'info',
        )
      }

      // 🔔 Notify all students in group + their parents
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
// 🔔 NOTIFICATIONS:
//   → Teacher: "Your group was removed"
//   → Students: "Your group was removed"
//   → Parents: same
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

    // 🔔 Notify teacher
    if (gi.teacher_id) {
      await sendNotif(
        pool,
        gi.teacher_id,
        `group_deleted_teacher_${req.params.id}_${ts}`,
        `🗑️ تم حذف المجموعة "${gi.group_name}" من مادة "${gi.course_title}".`,
        'warning',
      )
    }

    // 🔔 Notify students + parents
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
// 🔔 NOTIFICATIONS:
//   → Teacher: registrations opened/closed for their group
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
// 🔔 NOTIFICATIONS:
//   → Student enrolled:  "You have been enrolled in a course"
//   → Parent:            "Your child was enrolled in a course"
//   → Teacher:           "A new student joined your group"
//   → Admin (if teacher did it): "Teacher added a student"
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

        // 🔔 Notify new student about their account
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
      `INSERT INTO group_students (group_id, student_id, status, payment_status, amount_paid, payment_due,
        enrollment_type, requested_by, last_payment_date)
       VALUES ($1,$2,'active','paid',0,$3,'direct',$4,CURRENT_DATE) RETURNING *`,
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

    // 🔔 Notify student
    await sendNotif(
      pool,
      studentId,
      `enrolled_student_${groupId}_${studentId}_${ts}`,
      `🎓 تم تسجيلك في مادة "${info.title}" — ${dayLabel} ${timeLabel}${salleLabel}. أستاذك: ${teacherTitle} ${info.teacher_name} ${info.teacher_last_name}.`,
      'assignment',
    )

    // 🔔 Notify parents of the student
    await notifyParentsOf(
      pool,
      studentId,
      `enrolled_parent_${groupId}_${studentId}_${ts}`,
      `🎓 تم تسجيل ابنك ${info.student_name} ${info.student_last_name} في مادة "${info.title}" — ${dayLabel} ${timeLabel}${salleLabel}. الأستاذ: ${teacherTitle} ${info.teacher_name} ${info.teacher_last_name}.`,
      'assignment',
    )

    // 🔔 Notify teacher
    if (info.teacher_id) {
      await sendNotif(
        pool,
        info.teacher_id,
        `enrolled_teacher_${groupId}_${studentId}_${ts}`,
        `👤 انضم طالب جديد "${info.student_name} ${info.student_last_name}" إلى مجموعتك "${info.group_name}" في مادة "${info.title}".`,
        'info',
      )
    }

    // 🔔 Notify admins if teacher added the student
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
// 🔔 NOTIFICATIONS:
//   → Student: "You have been removed from a group"
//   → Parent: same
//   → Teacher: "A student was removed from your group"
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

        // 🔔 Notify student
        await sendNotif(
          pool,
          studentId,
          `unenrolled_s${studentId}_${groupId}_${ts}`,
          msg,
          'warning',
        )

        // 🔔 Notify parents
        await notifyParentsOf(
          pool,
          studentId,
          `unenrolled_parent_${studentId}_${groupId}_${ts}`,
          `❌ تم إلغاء تسجيل ابنك ${gi.student_name} ${gi.student_last_name} من مجموعة "${gi.group_name}" لمادة "${gi.title}".`,
          'warning',
        )

        // 🔔 Notify teacher
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
// 🔔 NOTIFICATIONS:
//   → Student: "Your payment status was updated"
//   → Parent: same
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

        // 🔔 Notify student
        await sendNotif(pool, studentId, `payment_${studentId}_${groupId}_${ts}`, msg, 'info')

        // 🔔 Notify parents
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
// 🔔 NOTIFICATIONS:
//   → Student: "Your teacher left a note on your record"
//   → Parent:  "Teacher left a note about your child"
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

      // Only notify if note is not private
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

          // 🔔 Notify student
          await sendNotif(
            pool,
            studentId,
            `note_student_${noteId.rows[0].id}_${ts}`,
            `📝 أضاف أستاذك ملاحظة جديدة${importance} في مادة "${gi.title}": "${note_text.substring(0, 60)}${note_text.length > 60 ? '...' : ''}"`,
            is_important ? 'warning' : 'info',
          )

          // 🔔 Notify parents
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

// ─── CALENDAR / SESSIONS (unchanged logic) ───────────────────────────────────
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
// 🔔 NOTIFICATIONS:
//   → All students in group + their parents
//   → Teacher
router.patch(
  '/sessions/:sessionId/cancel',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { sessionId } = req.params
    const { reason } = req.body
    try {
      // Get session info before cancelling
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

        // 🔔 Notify students + parents
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

        // 🔔 Notify teacher (if admin cancelled it)
        if (si.teacher_id && req.user.role === 'admin') {
          await sendNotif(
            pool,
            si.teacher_id,
            `session_cancel_t${si.teacher_id}_${sessionId}_${ts}`,
            `❌ تم إلغاء حصتك "${si.session_title || si.course_title}" بتاريخ ${dateStr} من قبل الإدارة. ${reasonText}`,
            'warning',
          )
        }

        // 🔔 Notify admins if teacher cancelled
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

// 1. مسار تغيير حالة الطالب من الإدارة
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
    // تحديث عدد الطلاب الفعليين (النشطين فقط يحجزون مكاناً)
    await pool.query(
      `UPDATE groups SET current_students = (SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active') WHERE id = $1`,
      [groupId],
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 2. مسار التنظيف الشامل للطلاب المعلقين أكثر من 14 يوم
router.delete('/cleanup/pending-enrollments', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' })
  try {
    const result = await pool.query(`
      DELETE FROM group_students
      WHERE status = 'inactive'
      AND enrollment_date < NOW() - INTERVAL '14 days'
    `)
    res.json({ deleted: result.rowCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Add inside backend/routes/groups.js
router.get(
  '/:groupId/scan/:studentId',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.last_name, u.birthday, u.gender, u.photo_url,
              gs.status as enrollment_status, gs.payment_status, g.group_name
       FROM users u
       LEFT JOIN group_students gs ON u.id = gs.student_id AND gs.group_id = $1
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

      if (!data.enrollment_status) data.access = 'NOT_ENROLLED'
      else if (data.enrollment_status === 'inactive') data.access = 'INACTIVE'
      else if (data.payment_status !== 'paid') data.access = 'NOT_PAID'
      else data.access = 'GRANTED'

      res.json(data)
    } catch (error) {
      console.error('Scan Error:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)
export default router
