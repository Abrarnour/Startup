import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()
export const authMiddleware = (req, res, next) => {
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

// Middleware admin (à ajouter au début du fichier)
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé - Admin uniquement' })
  }
  next()
}
// 📝 1. مسار التسجيل (Inscription)
router.post('/register', async (req, res) => {
  const { name, last_name, email, password, role, birthday, city } = req.body

  try {
    // التحقق من الحقول الأساسية
    if (!name || !last_name || !email || !password || !role) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' })
    }

    // التأكد من أن البريد الإلكتروني غير مستخدم مسبقاً
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' })
    }

    // إدخال المستخدم الجديد في قاعدة البيانات
    // ملاحظة: قمنا بإضافة الأعمدة الجديدة (last_name, birthday, city)
    const newUser = await pool.query(
      `INSERT INTO users (name, last_name, email, password, role, birthday, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, last_name, email, role`,
      [name, last_name, email, password, role, birthday, city],
    )

    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: newUser.rows[0],
    })
  } catch (err) {
    console.error('خطأ أثناء التسجيل:', err.message)
    res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// 🔐 2. مسار تسجيل الدخول (Connexion)
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // التحقق من المدخلات
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' })
    }

    // البحث عن المستخدم
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' })
    }

    const user = result.rows[0]

    // التحقق من كلمة المرور
    if (password !== user.password) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' })
    }

    // إنشاء توكن JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    // إرسال البيانات (بدون كلمة المرور)
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

router.post('/register-teacher', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, last_name, email, password, phone, gender, birthday, city } = req.body

  try {
    // Validation des champs obligatoires
    if (!name || !last_name || !email || !password || !phone || !gender) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' })
    }

    // Validation du genre
    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ error: 'Le genre doit être M (Monsieur) ou F (Madame)' })
    }

    // Vérifier que l'email n'existe pas
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Créer l'enseignant avec le rôle "teacher"
    const newTeacher = await pool.query(
      `INSERT INTO users (name, last_name, email, password, role, phone, gender, birthday, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, last_name, email, role, phone, gender`,
      [name, last_name, email, password, 'teacher', phone, gender, birthday, city],
    )

    res.status(201).json({
      message: 'Enseignant créé avec succès',
      teacher: newTeacher.rows[0],
    })
  } catch (err) {
    console.error('Erreur création enseignant:', err.message)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    // Vérifie que l'utilisateur existe
    const userCheck = await pool.query(
      'SELECT id, role, name, last_name FROM users WHERE id = $1',
      [id],
    )

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const userToDelete = userCheck.rows[0]

    // Sécurité: ne pas supprimer un admin
    if (userToDelete.role === 'admin') {
      return res.status(403).json({ error: 'Impossible de supprimer un compte admin' })
    }

    // Si c'est un enseignant, remettre ses cours sans enseignant ou les supprimer
    if (userToDelete.role === 'teacher') {
      // Option: remettre teacher_id à null pour ne pas casser les cours existants
      await pool.query('UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1', [id])
    }

    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = $1', [id])

    res.json({
      message: `${userToDelete.name} ${userToDelete.last_name} supprimé avec succès`,
      deletedId: id,
    })
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error)
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' })
  }
})

// ═══════════════════════════════════════
// GET /api/auth/users/teachers — Liste des enseignants (Admin)
// ═══════════════════════════════════════
router.get('/users/teachers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        u.gender,
        u.birthday,
        u.created_at,
        COUNT(DISTINCT c.id) AS course_count,
        COUNT(DISTINCT gs.student_id) AS student_count
      FROM users u
      LEFT JOIN courses c ON c.teacher_id = u.id
      LEFT JOIN groups g ON g.course_id = c.id
      LEFT JOIN group_students gs ON gs.group_id = g.id AND gs.status = 'active'
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.last_name, u.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur liste enseignants:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// GET /api/auth/users/students — Liste des étudiants (Admin)
// ═══════════════════════════════════════
router.get('/users/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.last_name,
        u.email,
        u.phone,
        u.city,
        u.gender,
        u.birthday,
        u.parent_phone,
        u.created_at,
        COUNT(DISTINCT gs.group_id) AS enrolled_courses
      FROM users u
      LEFT JOIN group_students gs ON gs.student_id = u.id AND gs.status = 'active'
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.last_name, u.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur liste étudiants:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ═══════════════════════════════════════
// DELETE /api/auth/users/:id — Supprimer un utilisateur (Admin)
// Supprime aussi toutes ses données liées (CASCADE dans la BDD)
// ═══════════════════════════════════════
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id)

  // Sécurité : ne pas se supprimer soi-même
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
  }

  try {
    // Vérifier que l'utilisateur existe
    const check = await pool.query('SELECT id, role, name, last_name FROM users WHERE id = $1', [
      userId,
    ])
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    const targetUser = check.rows[0]

    // Supprimer (CASCADE géré par les FK en BDD)
    await pool.query('DELETE FROM users WHERE id = $1', [userId])

    console.log(`✅ User deleted: ${targetUser.name} ${targetUser.last_name} (${targetUser.role})`)
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

// backend/routes/auth.js

// ═══════════════════════════════════════
// DELETE /api/auth/users/cleanup/inactive-students
// Supprimer les étudiants sans cours depuis > 60 jours
// ═══════════════════════════════════════
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

      console.log(`✅ Cleanup finished: ${result.rowCount} inactive students removed.`)
      res.json({
        success: true,
        count: result.rowCount,
        message: `${result.rowCount} étudiants inactifs supprimés avec succès.`,
      })
    } catch (error) {
      console.error('Erreur cleanup étudiants:', error)
      res.status(500).json({ error: 'Erreur lors du nettoyage des données' })
    }
  },
)
export default router
