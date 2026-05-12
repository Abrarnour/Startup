// backend/routes/parents.js
import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { sendNotif, notifyAllAdmins, notifyParentsOf } from '../notifHelper.js'

const router = express.Router()

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

const parentMiddleware = (req, res, next) => {
  if (req.user.role !== 'Parent')
    return res.status(403).json({ error: 'Accès réservé aux parents' })
  next()
}

// ─── GET CHILDREN ─────────────────────────────────────────────────────────────
router.get('/children', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.last_name, u.email, u.birthday, u.city, u.gender,
              ps.relationship, ps.is_primary, ps.created_at as link_date
       FROM users u INNER JOIN parent_students ps ON u.id = ps.student_id
       WHERE ps.parent_id = $1 ORDER BY ps.is_primary DESC, u.name`,
      [req.user.id],
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET CHILD COURSES ────────────────────────────────────────────────────────
router.get('/children/:studentId/courses', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const checkChild = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id=$1 AND student_id=$2',
      [req.user.id, req.params.studentId],
    )
    if (checkChild.rows.length === 0)
      return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })

    const result = await pool.query(
      `SELECT gs.id as enrollment_id, c.id as course_id, c.title as course_title,
              c.description, c.education_level, c.year_level, c.branch, c.price, c.salle,
              u.name as teacher_name, u.last_name as teacher_last_name, u.gender as teacher_gender,
              g.id as group_id, g.group_name, g.day_of_week, g.session_start_time, g.session_end_time,
              g.start_date, g.start_time, g.end_time,
              gs.status, gs.payment_status, gs.amount_paid, gs.enrollment_date, gs.enrollment_type
       FROM group_students gs
       INNER JOIN groups g ON gs.group_id = g.id
       INNER JOIN courses c ON g.course_id = c.id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE gs.student_id = $1 ORDER BY gs.enrollment_date DESC`,
      [req.params.studentId],
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── CHECK STUDENT ────────────────────────────────────────────────────────────
router.get('/check-student/:email', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, last_name, email, birthday, city, gender FROM users WHERE email=$1 AND role='student'`,
      [req.params.email],
    )
    if (result.rows.length === 0) return res.json({ exists: false, student: null })
    res.json({ exists: true, student: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── REGISTER CHILD ───────────────────────────────────────────────────────────
// 🔔 NOTIFICATIONS:
//   → New student: "Your account was created"
//   → Parent: "Your child account is ready"
//   → Admins: "New student registered by parent"
router.post('/register-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { name, last_name, email, password, birthday, city, gender } = req.body
  const parentId = req.user.id
  try {
    if (!name || !last_name || !email || !password || !birthday || !gender) {
      return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' })
    }
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (emailCheck.rows.length > 0)
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })

    const newStudent = await pool.query(
      `INSERT INTO users (name, last_name, email, password, birthday, city, gender, role, parent_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'student',$8)
       RETURNING id, name, last_name, email, birthday, city, gender`,
      [name, last_name, email, password, birthday, city, gender, req.user.phone || null],
    )
    const studentId = newStudent.rows[0].id

    await pool.query(
      `INSERT INTO parent_students (parent_id, student_id, relationship, is_primary) VALUES ($1,$2,'parent',true)`,
      [parentId, studentId],
    )

    const ts = Date.now()

    // 🔔 Welcome student
    await sendNotif(
      pool,
      studentId,
      `child_created_${studentId}`,
      `🎓 مرحباً ${name}! تم إنشاء حسابك في مدرسة بلماحي. يمكنك تسجيل الدخول بالبريد: ${email}.`,
      'welcome',
    )

    // 🔔 Confirm to parent
    await sendNotif(
      pool,
      parentId,
      `child_created_parent_${studentId}_${ts}`,
      `✅ تم إنشاء حساب ابنك/ابنتك ${name} ${last_name} بنجاح. يمكنك الآن تسجيله في الدروس.`,
      'success',
    )

    // 🔔 Notify admins
    await notifyAllAdmins(
      pool,
      `child_created_admin_${studentId}_${ts}`,
      `👤 ولي أمر أنشأ حساباً لطالب جديد: ${name} ${last_name}.`,
      'info',
    )

    res.status(201).json({ message: 'Enfant créé et lié avec succès', student: newStudent.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── LINK CHILD ───────────────────────────────────────────────────────────────
// 🔔 NOTIFICATIONS:
//   → Student: "A parent linked to your account"
//   → Parent: confirmation
router.post('/link-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { student_email } = req.body
  const parentId = req.user.id
  try {
    const studentResult = await pool.query(
      `SELECT id, name, last_name FROM users WHERE email=$1 AND role='student'`,
      [student_email],
    )
    if (studentResult.rows.length === 0)
      return res.status(404).json({ error: 'Étudiant non trouvé' })

    const studentId = studentResult.rows[0].id
    const linkCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id=$1 AND student_id=$2',
      [parentId, studentId],
    )
    if (linkCheck.rows.length > 0) return res.status(400).json({ error: 'Cet enfant est déjà lié' })

    await pool.query(
      `INSERT INTO parent_students (parent_id, student_id, relationship, is_primary) VALUES ($1,$2,'parent',true)`,
      [parentId, studentId],
    )

    const ts = Date.now()
    const st = studentResult.rows[0]

    // 🔔 Notify student
    await sendNotif(
      pool,
      studentId,
      `parent_linked_${studentId}_${parentId}_${ts}`,
      `👨‍👩‍👦 تم ربط حسابك بولي الأمر. سيتلقى إشعارات بمواعيد دروسك.`,
      'info',
    )

    // 🔔 Confirm to parent
    await sendNotif(
      pool,
      parentId,
      `parent_linked_parent_${parentId}_${studentId}_${ts}`,
      `✅ تم ربط حساب الطالب ${st.name} ${st.last_name} بحسابك بنجاح.`,
      'success',
    )

    res.status(201).json({ message: 'Enfant lié avec succès', student: st })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── ENROLL CHILD ─────────────────────────────────────────────────────────────
// 🔔 NOTIFICATIONS:
//   → Student: "You've been enrolled"
//   → Parent: confirmation
//   → Teacher: "New student in your group"
//   → Admins: "Parent enrolled a child"
router.post('/enroll-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { student_id, group_id } = req.body
  const parentId = req.user.id
  try {
    const childCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id=$1 AND student_id=$2',
      [parentId, student_id],
    )
    if (childCheck.rows.length === 0)
      return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })

    const groupCheck = await pool.query(
      `SELECT g.id, g.group_name, g.day_of_week, g.session_start_time, g.salle,
              g.registration_open, g.current_students, c.max_students_per_group, c.price,
              c.title as course_title, c.teacher_id,
              t.name as teacher_name, t.last_name as teacher_last_name, t.gender as teacher_gender,
              s.name as student_name, s.last_name as student_last_name
       FROM groups g INNER JOIN courses c ON g.course_id = c.id
       LEFT JOIN users t ON c.teacher_id = t.id
       LEFT JOIN users s ON s.id = $2
       WHERE g.id = $1`,
      [group_id, student_id],
    )
    if (groupCheck.rows.length === 0) return res.status(404).json({ error: 'Groupe non trouvé' })

    const group = groupCheck.rows[0]
    if (!group.registration_open) return res.status(400).json({ error: 'Inscriptions fermées' })
    if (group.current_students >= group.max_students_per_group)
      return res.status(400).json({ error: 'Groupe complet' })

    const enrollmentCheck = await pool.query(
      'SELECT id FROM group_students WHERE group_id=$1 AND student_id=$2',
      [group_id, student_id],
    )
    if (enrollmentCheck.rows.length > 0) return res.status(400).json({ error: 'Déjà inscrit' })

    const enrollment = await pool.query(
      `INSERT INTO group_students (group_id, student_id, status, payment_status, enrollment_type, requested_by, request_date, last_payment_date)
       VALUES ($1,$2,'inactive','pending','parent_request',$3,CURRENT_TIMESTAMP,CURRENT_DATE) RETURNING *`,
      [group_id, student_id, parentId],
    )

    await pool.query('UPDATE groups SET current_students = current_students + 1 WHERE id = $1', [
      group_id,
    ])

    const ts = Date.now()
    const dayLabel = group.day_of_week ? `يوم ${group.day_of_week}` : ''
    const timeLabel = group.session_start_time ? `الساعة ${group.session_start_time}` : ''
    const salleLabel = group.salle ? `، القاعة: ${group.salle}` : ''
    const teacherTitle = group.teacher_gender === 'F' ? 'أ.' : 'أ.'

    // 🔔 Notify student
    await sendNotif(
      pool,
      student_id,
      `parent_enrolled_s${student_id}_${group_id}_${ts}`,
      `🎓 سجّلك ولي أمرك في مادة "${group.course_title}" — ${dayLabel} ${timeLabel}${salleLabel}. الأستاذ: ${teacherTitle} ${group.teacher_name} ${group.teacher_last_name}.`,
      'assignment',
    )

    // 🔔 Confirm to parent
    await sendNotif(
      pool,
      parentId,
      `parent_enrolled_p${parentId}_${group_id}_${ts}`,
      `✅ تم تسجيل ${group.student_name} ${group.student_last_name} في مادة "${group.course_title}" (${group.group_name}) — ${dayLabel} ${timeLabel}${salleLabel}.`,
      'success',
    )

    // 🔔 Notify teacher
    if (group.teacher_id) {
      await sendNotif(
        pool,
        group.teacher_id,
        `parent_enrolled_t${group.teacher_id}_${group_id}_${student_id}_${ts}`,
        `👤 انضم طالب جديد "${group.student_name} ${group.student_last_name}" إلى مجموعتك "${group.group_name}" في مادة "${group.course_title}" (تسجيل من الولي).`,
        'info',
      )
    }

    // 🔔 Notify admins
    await notifyAllAdmins(
      pool,
      `parent_enrolled_admin_${group_id}_${student_id}_${ts}`,
      `👤 ولي أمر سجّل الطالب "${group.student_name} ${group.student_last_name}" في مادة "${group.course_title}" — المجموعة: ${group.group_name}.`,
      'info',
    )

    res.status(201).json({ message: 'Inscription réussie', enrollment: enrollment.rows[0] })
  } catch (error) {
    console.error('Erreur inscription enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── UNENROLL CHILD ───────────────────────────────────────────────────────────
// 🔔 NOTIFICATIONS:
//   → Student: "You were unenrolled"
//   → Teacher: "A student left your group"
//   → Admins: "Parent unenrolled a child"
router.delete(
  '/children/:studentId/enrollments/:enrollmentId',
  authMiddleware,
  parentMiddleware,
  async (req, res) => {
    try {
      const parentId = req.user.id
      const { studentId, enrollmentId } = req.params

      const childCheck = await pool.query(
        'SELECT id FROM parent_students WHERE parent_id=$1 AND student_id=$2',
        [parentId, studentId],
      )
      if (childCheck.rows.length === 0)
        return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })

      const enrollmentCheck = await pool.query(
        `SELECT gs.group_id, c.title as course_title, c.teacher_id,
              g.group_name, s.name as sname, s.last_name as slast
       FROM group_students gs
       JOIN groups g ON gs.group_id = g.id
       JOIN courses c ON g.course_id = c.id
       LEFT JOIN users s ON s.id = $2
       WHERE gs.id = $1 AND gs.student_id = $2`,
        [enrollmentId, studentId],
      )
      if (enrollmentCheck.rows.length === 0)
        return res.status(404).json({ error: 'Inscription non trouvée' })

      const info = enrollmentCheck.rows[0]
      await pool.query('DELETE FROM group_students WHERE id = $1', [enrollmentId])
      await pool.query(
        'UPDATE groups SET current_students = GREATEST(current_students - 1, 0) WHERE id = $1',
        [info.group_id],
      )

      const ts = Date.now()

      // 🔔 Notify student
      await sendNotif(
        pool,
        studentId,
        `unenroll_s${studentId}_${enrollmentId}_${ts}`,
        `❌ تم إلغاء تسجيلك في مادة "${info.course_title}" (${info.group_name}) من قبل ولي أمرك.`,
        'warning',
      )

      // 🔔 Notify teacher
      if (info.teacher_id) {
        await sendNotif(
          pool,
          info.teacher_id,
          `unenroll_t${info.teacher_id}_${enrollmentId}_${ts}`,
          `👤 تم إلغاء تسجيل الطالب "${info.sname} ${info.slast}" من مجموعتك "${info.group_name}" (طلب ولي الأمر).`,
          'info',
        )
      }

      // 🔔 Notify admins
      await notifyAllAdmins(
        pool,
        `unenroll_admin_${enrollmentId}_${ts}`,
        `👤 ولي أمر ألغى تسجيل "${info.sname} ${info.slast}" من مادة "${info.course_title}" — ${info.group_name}.`,
        'info',
      )

      res.json({ message: 'Inscription annulée avec succès' })
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// ─── UNLINK CHILD ─────────────────────────────────────────────────────────────
router.delete('/unlink-child/:studentId', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM parent_students WHERE parent_id=$1 AND student_id=$2 RETURNING *',
      [req.user.id, req.params.studentId],
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lien non trouvé' })
    res.json({ message: 'Enfant délié avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET CHILD HISTORY ────────────────────────────────────────────────────────
router.get('/children/:studentId/history', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params

    // Ownership check — parent must be linked to this student
    const childCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id=$1 AND student_id=$2',
      [req.user.id, studentId],
    )
    if (childCheck.rows.length === 0)
      return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })

    // 1. Profile
    const student = await pool.query(
      `SELECT id, name, last_name, email, phone, gender, city, birthday, created_at, photo_url
       FROM users WHERE id = $1 AND role = 'student'`,
      [studentId],
    )
    if (student.rows.length === 0) return res.status(404).json({ error: 'Étudiant introuvable' })
    const profile = student.rows[0]

    // 2. Enrollments
    const enrollments = await pool.query(
      `SELECT
         gs.id AS enrollment_id, gs.enrollment_date, gs.enrollment_type,
         gs.status AS enrollment_status, gs.payment_status, gs.amount_paid,
         gs.payment_due, gs.payment_deadline, gs.last_payment_date, gs.sessions_attended,
         g.id AS group_id, g.group_name, g.start_date AS group_start_date,
         g.day_of_week, g.session_start_time, g.session_end_time,
         g.total_sessions AS group_total_sessions, g.salle,
         c.id AS course_id, c.title AS course_title,
         c.education_level, c.year_level, c.branch, c.price,
         (u.name || ' ' || u.last_name) AS teacher_name
       FROM group_students gs
       JOIN groups  g ON g.id = gs.group_id
       JOIN courses c ON c.id = g.course_id
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE gs.student_id = $1
       ORDER BY gs.enrollment_date DESC`,
      [studentId],
    )

    // 3. Payments
    const payments = await pool.query(
      `SELECT gs.id, gs.last_payment_date AS payment_date, gs.amount_paid,
              gs.payment_status, gs.payment_due, c.title AS course_title, c.price
       FROM group_students gs
       JOIN groups  g ON g.id = gs.group_id
       JOIN courses c ON c.id = g.course_id
       WHERE gs.student_id = $1 AND gs.last_payment_date IS NOT NULL
       ORDER BY gs.last_payment_date DESC`,
      [studentId],
    )

    // 4. Attendance log
    const attQ = await pool.query(
      `SELECT al.id, al.scanned_at, al.session_number, al.group_id,
              g.group_name, g.day_of_week, g.session_start_time, g.salle,
              c.title AS course_title,
              (u.name || ' ' || u.last_name) AS scanned_by_name
       FROM attendance_log al
       JOIN groups  g ON g.id = al.group_id
       JOIN courses c ON c.id = g.course_id
       LEFT JOIN users u ON u.id = al.scanned_by
       WHERE al.student_id = $1
       ORDER BY al.scanned_at DESC`,
      [studentId],
    )

    // 5. Absences (last 90 days, active enrollments only)
    const absQ = await pool.query(
      `WITH active_enroll AS (
         SELECT gs.group_id, gs.enrollment_date,
                g.day_of_week, g.session_start_time,
                g.group_name, c.title AS course_title
         FROM group_students gs
         JOIN groups  g ON g.id = gs.group_id
         JOIN courses c ON c.id = g.course_id
         WHERE gs.student_id = $1 AND gs.status = 'active'
       ),
       scheduled AS (
         SELECT ae.group_id, ae.group_name, ae.course_title, ae.session_start_time,
                d::date AS session_date
         FROM active_enroll ae
         CROSS JOIN LATERAL generate_series(
           GREATEST(ae.enrollment_date::date, CURRENT_DATE - INTERVAL '90 days'),
           CURRENT_DATE - INTERVAL '1 day',
           '1 day'::interval
         ) AS d
         WHERE TO_CHAR(d, 'day') ILIKE ae.day_of_week || '%'
       )
       SELECT s.group_id, s.group_name, s.course_title, s.session_start_time, s.session_date
       FROM scheduled s
       WHERE NOT EXISTS (
         SELECT 1 FROM attendance_log al
         WHERE al.group_id = s.group_id AND al.student_id = $1
           AND al.scanned_at::date = s.session_date
       )
       ORDER BY s.session_date DESC`,
      [studentId],
    )

    // 6. Timeline
    const timeline = []
    timeline.push({
      type: 'account_created',
      date: profile.created_at,
      label: 'Compte créé',
      detail: `Inscription de ${profile.name} ${profile.last_name}`,
      icon: '👤',
    })
    for (const e of enrollments.rows) {
      timeline.push({
        type: 'enrollment',
        date: e.enrollment_date,
        label: 'Inscription au cours',
        detail: `${e.course_title} — ${e.group_name}`,
        icon: '📚',
        meta: {
          course_title: e.course_title,
          group_name: e.group_name,
          teacher_name: e.teacher_name,
          education_level: e.education_level,
          year_level: e.year_level,
          branch: e.branch,
          enrollment_type: e.enrollment_type,
          status: e.enrollment_status,
          payment_status: e.payment_status,
          price: e.price,
        },
      })
      if (e.last_payment_date) {
        timeline.push({
          type: 'payment',
          date: e.last_payment_date,
          label: 'Paiement enregistré',
          detail: `${e.course_title} — ${e.amount_paid} DA`,
          icon: '💳',
          meta: {
            course_title: e.course_title,
            amount_paid: e.amount_paid,
            payment_due: e.payment_due,
            payment_status: e.payment_status,
          },
        })
      }
    }
    for (const a of attQ.rows) {
      timeline.push({
        type: 'attendance',
        date: a.scanned_at,
        label: `Présent — ${a.course_title}`,
        detail: `${a.group_name} · Séance #${a.session_number}`,
        icon: '✅',
        group_id: a.group_id,
        session_number: a.session_number,
      })
    }
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({
      profile,
      student: profile,
      timeline,
      enrollments: enrollments.rows,
      payments: payments.rows,
      attendance: attQ.rows,
      absences: absQ.rows,
    })
  } catch (error) {
    console.error('Erreur child-history:', error.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
