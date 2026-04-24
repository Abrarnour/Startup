// backend/routes/auth.js
import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { sendNotif, notifyAllAdmins } from '../notifHelper.js'

const router = express.Router()

export const authMiddleware = (req, res, next) => {
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

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, last_name, email, password, role, birthday, city } = req.body
  try {
    if (!name || !last_name || !email || !password || !role) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' })
    }
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' })
    }
    const newUser = await pool.query(
      `INSERT INTO users (name, last_name, email, password, role, birthday, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, last_name, email, role`,
      [name, last_name, email, password, role, birthday, city],
    )
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    // 🔔 Welcome notification for new user
    await sendNotif(
      pool,
      newUser.rows[0].id,
      `welcome_register_${newUser.rows[0].id}`,
      ` مرحباً بك ${name}! تم إنشاء حسابك في مدرسة بلماحي بنجاح. يمكنك الآن تسجيل الدخول والاطلاع على إشعاراتك.`,
      'welcome',
    )

    // 🔔 Notify admins of new registration
    await notifyAllAdmins(
      pool,
      `new_register_${newUser.rows[0].id}_${Date.now()}`,
      ` مستخدم جديد سجّل: ${name} ${last_name} (${role}) — ${email}.`,
      'info',
    )

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', token, user: newUser.rows[0] })
  } catch (err) {
    console.error('خطأ أثناء التسجيل:', err.message)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' })
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' })
    }
    const user = result.rows[0]
    if (password !== user.password) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    // 🔔 Daily welcome notification (once per day)
    const today = new Date().toISOString().split('T')[0]
    const notifKey = `welcome_${user.id}_${today}`
    const welcomeMessages = {
      admin: `مرحباً بك في لوحة الإدارة! يمكنك الآن رؤية إشعاراتك هنا وعلى جهازك.`,
      teacher: ` مرحباً أستاذ ${user.name}! ستصلك إشعارات الحصص قبل 15 دقيقة من بدئها.`,
      student: ` مرحباً ${user.name}! ستصلك تذكيرات دروسك قبل 15 دقيقة. يمكنك رؤية إشعاراتك هنا.`,
      Parent: ` مرحباً! ستصلك إشعارات مواعيد دروس أبنائك قبل 15 دقيقة.`,
    }
    const welcomeMsg = welcomeMessages[user.role] || ` مرحباً بك في مدرسة بلماحي!`
    await sendNotif(pool, user.id, notifKey, welcomeMsg, 'welcome')

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        city: user.city,
      },
    })
  } catch (err) {
    console.error('خطأ أثناء تسجيل الدخول:', err.message)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// ─── REGISTER TEACHER (admin only) ────────────────────────────────────────────
// 🔔 NOTIFICATIONS:
//   → New teacher: "Your account has been created"
//   → All admins:  "New teacher was added"
router.post('/register-teacher', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, last_name, email, password, phone, gender, birthday, city } = req.body
  try {
    if (!name || !last_name || !email || !password || !phone || !gender) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' })
    }
    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ error: 'Le genre doit être M ou F' })
    }
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    const newTeacher = await pool.query(
      `INSERT INTO users (name, last_name, email, password, role, phone, gender, birthday, city)
       VALUES ($1,$2,$3,$4,'teacher',$5,$6,$7,$8)
       RETURNING id, name, last_name, email, role, phone, gender`,
      [name, last_name, email, password, phone, gender, birthday, city],
    )

    const teacherId = newTeacher.rows[0].id
    const ts = Date.now()

    // 🔔 Welcome notification for new teacher
    await sendNotif(
      pool,
      teacherId,
      `teacher_created_${teacherId}`,
      ` مرحباً أستاذ ${name} ${last_name}! تم إنشاء حسابك في مدرسة بلماحي. بريدك: ${email}. ستصلك إشعارات حصصك تلقائياً.`,
      'welcome',
    )

    // 🔔 Notify all admins
    await notifyAllAdmins(
      pool,
      `teacher_added_admin_${teacherId}_${ts}`,
      ` تم إضافة أستاذ جديد: ${name} ${last_name} — ${email}.`,
      'info',
    )

    res.status(201).json({ message: 'Enseignant créé avec succès', teacher: newTeacher.rows[0] })
  } catch (err) {
    console.error('Erreur création enseignant:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── DELETE USER ──────────────────────────────────────────────────────────────
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id)
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
  }
  try {
    const check = await pool.query('SELECT id, role, name, last_name FROM users WHERE id = $1', [
      userId,
    ])
    if (check.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    const targetUser = check.rows[0]
    if (targetUser.role === 'admin')
      return res.status(403).json({ error: 'Impossible de supprimer un admin' })

    // If teacher, notify their students before deletion
    if (targetUser.role === 'teacher') {
      const affectedGroups = await pool.query(
        `SELECT DISTINCT gs.student_id, c.title, g.group_name
         FROM courses c JOIN groups g ON g.course_id = c.id
         JOIN group_students gs ON gs.group_id = g.id
         WHERE c.teacher_id = $1 AND gs.status = 'active'`,
        [userId],
      )
      for (const row of affectedGroups.rows) {
        const ts = Date.now()
        await sendNotif(
          pool,
          row.student_id,
          `teacher_removed_s${row.student_id}_${userId}_${ts}`,
          `الأستاذ ${targetUser.name} ${targetUser.last_name} لم يعد متاحاً في مادة "${row.title}". ستصلك تحديثات من الإدارة قريباً.`,
          'warning',
        )
      }
      await pool.query('UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1', [userId])
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId])

    res.json({
      success: true,
      message: `${targetUser.name} ${targetUser.last_name} supprimé avec succès`,
      deleted_role: targetUser.role,
    })
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
})

// ─── LIST TEACHERS (admin) ─────────────────────────────────────────────────────
router.get('/users/teachers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.last_name, u.email, u.phone, u.city, u.gender, u.birthday, u.created_at,
        COUNT(DISTINCT c.id) AS course_count,
        COUNT(DISTINCT gs.student_id) AS student_count
      FROM users u
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
      WHERE u.role = 'teacher'
      GROUP BY u.id ORDER BY u.last_name, u.name
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── LIST STUDENTS (admin) ────────────────────────────────────────────────────
router.get('/users/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.last_name, u.email, u.phone, u.city, u.gender, u.birthday,
        u.parent_phone, u.created_at,
        COUNT(DISTINCT gs.group_id) AS enrolled_courses
      FROM users u
      LEFT JOIN group_students gs ON gs.student_id = u.id AND gs.status = 'active'
      WHERE u.role = 'student'
      GROUP BY u.id ORDER BY u.last_name, u.name
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── CLEANUP INACTIVE STUDENTS ────────────────────────────────────────────────
router.delete(
  '/users/cleanup/inactive-students',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
      DELETE FROM users
      WHERE role = 'student'
      AND id NOT IN (SELECT student_id FROM group_students)
      AND created_at < NOW() - INTERVAL '60 days'
      RETURNING id
    `)
      res.json({
        success: true,
        count: result.rowCount,
        message: `${result.rowCount} étudiants inactifs supprimés.`,
      })
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors du nettoyage des données' })
    }
  },
)

// ─── SET / RESET TEACHER PASSWORD (admin only) ──────────────────────────────
router.patch('/teacher/:id/set-password', authMiddleware, adminMiddleware, async (req, res) => {
  const teacherId = parseInt(req.params.id)
  const { new_password } = req.body
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' })
  }
  try {
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 AND role = $3 RETURNING id, name, last_name, email',
      [new_password, teacherId, 'teacher'],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enseignant non trouvé' })
    }
    await sendNotif(
      pool,
      teacherId,
      `pwd_reset_${teacherId}_${Date.now()}`,
      ` Votre mot de passe a été modifié par l'administrateur. Veuillez contacter l'administration si ce n'était pas prévu.`,
      'warning',
    )
    res.json({ message: 'Mot de passe défini avec succès' })
  } catch (err) {
    console.error('Erreur set-password:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── ADMIN CHANGES OWN PASSWORD ──────────────────────────────────────────────
router.patch('/change-my-password', authMiddleware, async (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Champs manquants ou mot de passe trop court (min 8)' })
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const user = result.rows[0]
    // Plain-text comparison (your app stores passwords as plain text currently)
    if (user.password !== old_password) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' })
    }
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [new_password, req.user.id])
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    console.error('Erreur change-password:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── CHANGE OWN PASSWORD (teacher, admin, parent, student) ───────────────────
router.patch('/change-my-password', authMiddleware, async (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Champs manquants ou mot de passe trop court (min 8)' })
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const user = result.rows[0]
    if (user.password !== old_password) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' })
    }
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [new_password, req.user.id])
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    console.error('Erreur change-password:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})
export default router
