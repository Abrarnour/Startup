// backend/routes/parents.js
// Routes pour la gestion des parents et leurs enfants

import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = express.Router()

// ===== MIDDLEWARES =====
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

const parentMiddleware = (req, res, next) => {
  if (req.user.role !== 'Parent') {
    return res.status(403).json({ error: 'Accès réservé aux parents' })
  }
  next()
}

// ===== ROUTES GET =====

// 📋 GET /api/parents/children - Obtenir tous les enfants d'un parent
// GET /api/parents/children

router.get('/children', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const parentId = req.user.id

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.last_name,
        u.email,
        u.birthday,
        u.city,
        u.gender,
        ps.relationship,
        ps.is_primary,
        ps.created_at as link_date
      FROM users u
      INNER JOIN parent_students ps ON u.id = ps.student_id
      WHERE ps.parent_id = $1
      ORDER BY ps.is_primary DESC, u.name
    `,
      [parentId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération enfants:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 📚 GET /api/parents/children/:studentId/courses - Obtenir les cours d'un enfant
router.get('/children/:studentId/courses', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const parentId = req.user.id
    const studentId = req.params.studentId

    // Vérifier que l'enfant appartient bien au parent
    const checkChild = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, studentId],
    )

    if (checkChild.rows.length === 0) {
      return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })
    }

    // Récupérer les cours de l'enfant
    const result = await pool.query(
      `
      SELECT
        gs.id as enrollment_id,
        c.id as course_id,
        c.title as course_title,
        c.description,
        c.education_level,
        c.year_level,
        c.branch,
        c.price,
        c.salle,
        u.name as teacher_name,
        u.last_name as teacher_last_name,
        u.gender as teacher_gender,
        g.id as group_id,
        g.group_name,
        g.day_of_week,
        g.session_start_time,
        g.session_end_time,
        g.start_date,
        g.start_time,
        g.end_time,
        gs.status,
        gs.payment_status,
        gs.amount_paid,
        gs.enrollment_date,
        gs.enrollment_type
      FROM group_students gs
      INNER JOIN groups g ON gs.group_id = g.id
      INNER JOIN courses c ON g.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE gs.student_id = $1
      ORDER BY gs.enrollment_date DESC
    `,
      [studentId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération cours enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 🔍 GET /api/parents/check-student/:email - Vérifier si un email existe
router.get('/check-student/:email', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const email = req.params.email

    const result = await pool.query(
      `
      SELECT id, name, last_name, email, birthday, city, gender
      FROM users
      WHERE email = $1 AND role = 'student'
    `,
      [email],
    )

    if (result.rows.length === 0) {
      return res.json({ exists: false, student: null })
    }

    res.json({ exists: true, student: result.rows[0] })
  } catch (error) {
    console.error('Erreur vérification étudiant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===== ROUTES POST =====

// ➕ POST /api/parents/register-child - Inscrire un nouvel enfant
router.post('/register-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { name, last_name, email, password, birthday, city, gender } = req.body
  const parentId = req.user.id

  try {
    // Validation
    if (!name || !last_name || !email || !password || !birthday || !gender) {
      return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' })
    }

    // Vérifier que l'email n'existe pas
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Créer l'enfant
    const newStudent = await pool.query(
      `
      INSERT INTO users (name, last_name, email, password, birthday, city, gender, role, parent_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'student', $8)
      RETURNING id, name, last_name, email, birthday, city, gender
    `,
      [name, last_name, email, password, birthday, city, gender, req.user.phone || null],
    )

    const studentId = newStudent.rows[0].id

    // Lier l'enfant au parent
    await pool.query(
      `
      INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
      VALUES ($1, $2, 'parent', true)
    `,
      [parentId, studentId],
    )

    res.status(201).json({
      message: 'Enfant créé et lié avec succès',
      student: newStudent.rows[0],
    })
  } catch (error) {
    console.error('Erreur création enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 🔗 POST /api/parents/link-child - Lier un enfant existant
router.post('/link-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { student_email } = req.body
  const parentId = req.user.id

  try {
    // Trouver l'étudiant
    const studentResult = await pool.query(
      `SELECT id, name, last_name FROM users WHERE email = $1 AND role = 'student'`,
      [student_email],
    )

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' })
    }

    const studentId = studentResult.rows[0].id

    // Vérifier que le lien n'existe pas déjà
    const linkCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, studentId],
    )

    if (linkCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cet enfant est déjà lié à votre compte' })
    }

    // Créer le lien
    await pool.query(
      `
      INSERT INTO parent_students (parent_id, student_id, relationship, is_primary)
      VALUES ($1, $2, 'parent', true)
    `,
      [parentId, studentId],
    )

    res.status(201).json({
      message: 'Enfant lié avec succès',
      student: studentResult.rows[0],
    })
  } catch (error) {
    console.error('Erreur liaison enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 📝 POST /api/parents/enroll-child - Inscrire un enfant à un cours
router.post('/enroll-child', authMiddleware, parentMiddleware, async (req, res) => {
  const { student_id, group_id } = req.body
  const parentId = req.user.id

  try {
    // Vérifier que l'enfant appartient au parent
    const childCheck = await pool.query(
      'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
      [parentId, student_id],
    )

    if (childCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })
    }

    // Vérifier que le groupe existe et est ouvert
    const groupCheck = await pool.query(
      `
      SELECT
        g.id, g.course_id, g.registration_open,
        g.current_students, c.max_students_per_group, c.price
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.id = $1
    `,
      [group_id],
    )

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    const group = groupCheck.rows[0]

    if (!group.registration_open) {
      return res.status(400).json({ error: 'Les inscriptions sont fermées pour ce groupe' })
    }

    if (group.current_students >= group.max_students_per_group) {
      return res.status(400).json({ error: 'Le groupe est complet' })
    }

    // Vérifier que l'étudiant n'est pas déjà inscrit
    const enrollmentCheck = await pool.query(
      'SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2',
      [group_id, student_id],
    )

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cet enfant est déjà inscrit à ce groupe' })
    }

    // Créer l'inscription
    const enrollment = await pool.query(
      `
   INSERT INTO group_students
     (group_id, student_id, status, payment_status, enrollment_type, requested_by, request_date, last_payment_date)
    VALUES ($1, $2, 'active', 'paid', 'parent_request', $3, CURRENT_TIMESTAMP, CURRENT_DATE)
    RETURNING *
  `,
      [group_id, student_id, parentId],
    )
    // Incrémenter le compteur d'étudiants du groupe
    await pool.query('UPDATE groups SET current_students = current_students + 1 WHERE id = $1', [
      group_id,
    ])

    res.status(201).json({
      message: 'Inscription réussie',
      enrollment: enrollment.rows[0],
    })
  } catch (error) {
    console.error('Erreur inscription enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ❌ DELETE /api/parents/children/:studentId/enrollments/:enrollmentId - Retirer un enfant d'un cours
router.delete(
  '/children/:studentId/enrollments/:enrollmentId',
  authMiddleware,
  parentMiddleware,
  async (req, res) => {
    try {
      const parentId = req.user.id
      const { studentId, enrollmentId } = req.params

      // Vérifier que l'enfant appartient au parent
      const childCheck = await pool.query(
        'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
        [parentId, studentId],
      )

      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })
      }

      // Vérifier que l'inscription existe
      const enrollmentCheck = await pool.query(
        'SELECT group_id FROM group_students WHERE id = $1 AND student_id = $2',
        [enrollmentId, studentId],
      )

      if (enrollmentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' })
      }

      const groupId = enrollmentCheck.rows[0].group_id

      // Supprimer l'inscription
      await pool.query('DELETE FROM group_students WHERE id = $1', [enrollmentId])

      // Décrémenter le compteur du groupe
      await pool.query(
        'UPDATE groups SET current_students = GREATEST(current_students - 1, 0) WHERE id = $1',
        [groupId],
      )

      res.json({ message: 'Inscription annulée avec succès' })
    } catch (error) {
      console.error('Erreur annulation inscription:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// 🔓 DELETE /api/parents/unlink-child/:studentId - Délier un enfant
router.delete('/unlink-child/:studentId', authMiddleware, parentMiddleware, async (req, res) => {
  try {
    const parentId = req.user.id
    const studentId = req.params.studentId

    const result = await pool.query(
      'DELETE FROM parent_students WHERE parent_id = $1 AND student_id = $2 RETURNING *',
      [parentId, studentId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lien parent-enfant non trouvé' })
    }

    res.json({ message: 'Enfant délié avec succès' })
  } catch (error) {
    console.error('Erreur délier enfant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
