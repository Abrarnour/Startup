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

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
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

export default router
