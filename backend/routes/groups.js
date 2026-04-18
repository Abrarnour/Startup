// backend/routes/groups.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// Middleware admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé - Admin uniquement' })
  }
  next()
}

// Middleware admin ou teacher
const adminOrTeacherMiddleware = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé - Admin ou enseignant uniquement' })
  }
  next()
}

// ============================================
// ROUTES GROUPES
// ============================================

// GET /api/groups/course/:courseId - Récupérer tous les groupes d'un cours
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id AND status = 'active') as enrolled_students
      FROM groups g
      WHERE g.course_id = $1
      ORDER BY g.group_name`,
      [req.params.courseId],
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération groupes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/groups/:id - Récupérer un groupe spécifique
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        g.*,
        c.title as course_title,
        c.course_type,
        c.max_students_per_group,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id AND status = 'active') as enrolled_students
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.id = $1`,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur récupération groupe:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/groups/:id - Modifier un groupe
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
    const result = await pool.query(
      `UPDATE groups SET
        group_name = COALESCE($1, group_name),
        salle = COALESCE($2, salle),
        start_date = COALESCE($3, start_date),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        day_of_week = COALESCE($6, day_of_week),
        session_start_time = COALESCE($7, session_start_time),
        session_end_time = COALESCE($8, session_end_time),
        calendar_type = COALESCE($9, calendar_type),
        total_weeks = COALESCE($10, total_weeks),
        repeat_calendar = COALESCE($11, repeat_calendar),
        registration_open = COALESCE($12, registration_open),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification groupe:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/groups/:id - Supprimer un groupe
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING *', [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json({ message: 'Groupe supprimé avec succès', group: result.rows[0] })
  } catch (error) {
    console.error('Erreur suppression groupe:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/groups/:id/toggle-registration - Ouvrir/Fermer inscriptions
router.patch('/:id/toggle-registration', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE groups
      SET registration_open = NOT registration_open,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur toggle registration:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ============================================
// ROUTES ÉTUDIANTS DU GROUPE
// ============================================

// GET /api/groups/:groupId/students - Récupérer les étudiants d'un groupe
router.get('/:groupId/students', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM v_group_students_detailed WHERE group_id = $1 ORDER BY last_name, name`,
      [req.params.groupId],
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération étudiants:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/groups/:groupId/students - Ajouter un étudiant au groupe
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

    // Si l'étudiant n'existe pas et qu'on doit le créer
    if (create_if_not_exists && email && name && last_name) {
      // Vérifier si l'étudiant existe déjà
      const existingStudent = await pool.query('SELECT id FROM users WHERE email = $1', [email])

      if (existingStudent.rows.length > 0) {
        studentId = existingStudent.rows[0].id
      } else {
        // Créer un nouveau compte étudiant avec mot de passe temporaire
        const password = 'student' + Math.random().toString(36).substring(7)
        const newStudent = await pool.query(
          `INSERT INTO users (name, last_name, email, password, role, birthday, gender, parent_phone)
          VALUES ($1, $2, $3, $4, 'student', $5, $6, $7)
          RETURNING id`,
          [name, last_name, email, password, birthday, gender, parent_phone],
        )
        studentId = newStudent.rows[0].id
      }
    }

    if (!studentId) {
      return res
        .status(400)
        .json({ error: "student_id requis ou informations insuffisantes pour créer l'étudiant" })
    }

    // Vérifier si l'étudiant est déjà inscrit
    const alreadyEnrolled = await pool.query(
      'SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2',
      [groupId, studentId],
    )

    if (alreadyEnrolled.rows.length > 0) {
      return res.status(400).json({ error: 'Cet étudiant est déjà inscrit dans ce groupe' })
    }

    // Récupérer le prix du cours
    const coursePrice = await pool.query(
      `SELECT c.price FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.id = $1`,
      [groupId],
    )

    const price = coursePrice.rows[0]?.price || 0

    // Ajouter l'étudiant au groupe
    const result = await pool.query(
      `INSERT INTO group_students (
     group_id, student_id, status, payment_status, amount_paid, payment_due,
     enrollment_type, requested_by, last_payment_date
    ) VALUES ($1, $2, 'active', 'paid', 0, $3, 'direct', $4, CURRENT_DATE)
    RETURNING *`,
      [groupId, studentId, price, req.user.id],
    )

    // Mettre à jour le compteur d'étudiants
    await pool.query(
      `UPDATE groups SET current_students = (
        SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active'
      ) WHERE id = $1`,
      [groupId],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Erreur ajout étudiant:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/groups/:groupId/students/:studentId - Retirer un étudiant du groupe
router.delete(
  '/:groupId/students/:studentId',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params

    try {
      const result = await pool.query(
        'DELETE FROM group_students WHERE group_id = $1 AND student_id = $2 RETURNING *',
        [groupId, studentId],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Étudiant non trouvé dans ce groupe' })
      }

      // Mettre à jour le compteur
      await pool.query(
        `UPDATE groups SET current_students = (
        SELECT COUNT(*) FROM group_students WHERE group_id = $1 AND status = 'active'
      ) WHERE id = $1`,
        [groupId],
      )

      res.json({ message: 'Étudiant retiré avec succès' })
    } catch (error) {
      console.error('Erreur retrait étudiant:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// PATCH /api/groups/:groupId/students/:studentId/payment - Mettre à jour le paiement
router.patch(
  '/:groupId/students/:studentId/payment',
  authMiddleware,
  adminOrTeacherMiddleware, // ← was adminMiddleware, now teacher can too
  async (req, res) => {
    const { groupId, studentId } = req.params
    const { payment_status } = req.body

    if (!['paid', 'pending'].includes(payment_status)) {
      return res.status(400).json({ error: 'payment_status must be "paid" or "pending"' })
    }

    try {
      const result = await pool.query(
        `UPDATE group_students
         SET payment_status = $1,
             last_payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE last_payment_date END
         WHERE group_id = $2 AND student_id = $3
         RETURNING *`,
        [payment_status, groupId, studentId],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)
// ============================================
// ROUTES NOTES/REMARQUES
// ============================================

// GET /api/groups/:groupId/students/:studentId/notes - Récupérer les notes d'un étudiant

router.get('/:groupId/students/:studentId/notes', authMiddleware, async (req, res) => {
  try {
    const { groupId, studentId } = req.params
    const userRole = req.user.role

    // If the caller is a Parent, verify the student is their child
    if (userRole === 'Parent') {
      const childCheck = await pool.query(
        'SELECT id FROM parent_students WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, studentId],
      )
      if (childCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Cet enfant ne vous appartient pas' })
      }
    }

    // Get enrollment id
    const enrollment = await pool.query(
      'SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2',
      [groupId, studentId],
    )

    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' })
    }

    const enrollmentId = enrollment.rows[0].id

    let query = `
      SELECT
        sn.id,
        sn.note_text,
        sn.note_type,
        sn.is_important,
        sn.is_private,
        sn.created_at,
        u.name as author_name,
        u.last_name as author_last_name,
        u.role as author_role
      FROM student_notes sn
      LEFT JOIN users u ON sn.author_id = u.id
      WHERE sn.group_student_id = $1
    `

    // Parents and teachers cannot see private notes — only admin can
    if (userRole !== 'admin') {
      query += ' AND sn.is_private = false'
    }

    query += ' ORDER BY sn.created_at DESC'

    const result = await pool.query(query, [enrollmentId])
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération notes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/groups/:groupId/students/:studentId/notes - Ajouter une note
router.post(
  '/:groupId/students/:studentId/notes',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { groupId, studentId } = req.params
    const { note_text, note_type, is_important, is_private } = req.body

    try {
      if (!note_text) {
        return res.status(400).json({ error: 'note_text requis' })
      }

      // Récupérer l'enrollment_id
      const enrollment = await pool.query(
        'SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2',
        [groupId, studentId],
      )

      if (enrollment.rows.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' })
      }

      const enrollmentId = enrollment.rows[0].id

      // Ajouter la note
      const noteId = await pool.query('SELECT add_student_note($1, $2, $3, $4, $5, $6) as id', [
        enrollmentId,
        req.user.id,
        note_text,
        note_type || 'general',
        is_important || false,
        is_private || false,
      ])

      // Récupérer la note créée
      const result = await pool.query(
        `SELECT
        sn.*,
        u.name as author_name,
        u.last_name as author_last_name,
        u.role as author_role
      FROM student_notes sn
      LEFT JOIN users u ON sn.author_id = u.id
      WHERE sn.id = $1`,
        [noteId.rows[0].id],
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Erreur ajout note:', error)
      res.status(500).json({ error: error.message || 'Erreur serveur' })
    }
  },
)

// DELETE /api/groups/:groupId/students/:studentId/notes/:noteId - Supprimer une note
router.delete('/:groupId/students/:studentId/notes/:noteId', authMiddleware, async (req, res) => {
  try {
    // Vérifier que la note existe et que l'utilisateur a le droit de la supprimer
    const noteCheck = await pool.query('SELECT author_id FROM student_notes WHERE id = $1', [
      req.params.noteId,
    ])

    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Note non trouvée' })
    }

    // Seul l'auteur ou un admin peut supprimer
    if (req.user.role !== 'admin' && noteCheck.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres notes' })
    }

    await pool.query('DELETE FROM student_notes WHERE id = $1', [req.params.noteId])
    res.json({ message: 'Note supprimée avec succès' })
  } catch (error) {
    console.error('Erreur suppression note:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ============================================
// ROUTES SESSIONS/CALENDRIER
// ============================================

// GET /api/groups/:groupId/calendar - Récupérer le calendrier d'un groupe
router.get('/:groupId/calendar', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM get_group_calendar($1)', [req.params.groupId])
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération calendrier:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/groups/:groupId/calendar - Créer/Remplacer le calendrier d'un groupe
router.post('/:groupId/calendar', authMiddleware, adminMiddleware, async (req, res) => {
  const { sessions } = req.body

  try {
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: 'sessions (array) requis' })
    }

    await pool.query('SELECT create_manual_sessions($1, $2)', [
      req.params.groupId,
      JSON.stringify(sessions),
    ])

    // Récupérer le calendrier créé
    const result = await pool.query('SELECT * FROM get_group_calendar($1)', [req.params.groupId])
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur création calendrier:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/groups/sessions/:sessionId - Modifier une session
router.patch('/sessions/:sessionId', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { sessionId } = req.params
  const { actual_date, start_time, end_time, session_title } = req.body

  try {
    await pool.query('SELECT modify_session($1, $2, $3, $4, $5)', [
      sessionId,
      actual_date,
      start_time,
      end_time,
      session_title,
    ])

    const result = await pool.query('SELECT * FROM session_schedule WHERE id = $1', [sessionId])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification session:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/groups/sessions/:sessionId/cancel - Annuler une session
router.patch(
  '/sessions/:sessionId/cancel',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { sessionId } = req.params
    const { reason } = req.body

    try {
      await pool.query('SELECT cancel_session($1, $2)', [sessionId, reason || 'Annulée'])

      const result = await pool.query('SELECT * FROM session_schedule WHERE id = $1', [sessionId])
      res.json(result.rows[0])
    } catch (error) {
      console.error('Erreur annulation session:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// GET /api/groups/students/available - Récupérer les étudiants disponibles (non inscrits au groupe)
router.get('/students/available', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, last_name, email, parent_phone, gender, birthday
      FROM users
      WHERE role = 'student'
      ORDER BY last_name, name`,
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération étudiants disponibles:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ============================================
// AJOUTS AU FICHIER backend/routes/groups.js
// À ajouter aux routes existantes
// ============================================

// ============================================
// GESTION DES SÉANCES ET CYCLES
// ============================================

// PATCH /api/groups/:id/sessions-config - Modifier la configuration des séances
router.patch('/:id/sessions-config', authMiddleware, adminMiddleware, async (req, res) => {
  const { total_sessions, total_weeks, sessions_per_week, max_students_per_group } = req.body

  try {
    const result = await pool.query(
      `UPDATE groups SET
        total_sessions = COALESCE($1, total_sessions),
        total_weeks = COALESCE($2, total_weeks),
        sessions_per_week = COALESCE($3, sessions_per_week),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *`,
      [total_sessions, total_weeks, sessions_per_week, req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification config séances:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/groups/:id/max-students - Modifier le nombre maximum d'étudiants
router.patch('/:id/max-students', authMiddleware, adminMiddleware, async (req, res) => {
  const { max_students } = req.body

  try {
    // Vérifier que le nouveau max est >= au nombre actuel d'étudiants
    const currentCount = await pool.query(
      `SELECT COUNT(*) as count FROM group_students WHERE group_id = $1 AND status = 'active'`,
      [req.params.id],
    )

    const enrolledCount = parseInt(currentCount.rows[0].count)

    if (max_students < enrolledCount) {
      return res.status(400).json({
        error: `Impossible de réduire à ${max_students}. Il y a déjà ${enrolledCount} étudiants inscrits.`,
      })
    }

    // Mettre à jour dans courses (car max_students_per_group est dans courses)
    const result = await pool.query(
      `UPDATE courses c
      SET max_students_per_group = $1
      FROM groups g
      WHERE c.id = g.course_id AND g.id = $2
      RETURNING g.*, c.max_students_per_group`,
      [max_students, req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur modification max étudiants:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/groups/:id/next-cycle-modifications - Enregistrer les modifications du prochain cycle
router.post(
  '/:id/next-cycle-modifications',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    const { reason, total_weeks, total_sessions, sessions, return_to_normal } = req.body

    try {
      if (!reason || !total_weeks || !total_sessions || !sessions || !Array.isArray(sessions)) {
        return res.status(400).json({
          error: 'Paramètres manquants: reason, total_weeks, total_sessions, sessions requis',
        })
      }

      // Valider que les sessions sont bien numérotées
      const sessionNumbers = sessions.map((s) => s.session_number).sort((a, b) => a - b)
      if (sessionNumbers.length !== total_sessions) {
        return res.status(400).json({
          error: `Incohérence: ${sessionNumbers.length} séances fournies mais total_sessions=${total_sessions}`,
        })
      }

      await pool.query(`SELECT save_next_cycle_modifications($1, $2, $3, $4, $5, $6)`, [
        req.params.id,
        reason,
        total_weeks,
        total_sessions,
        JSON.stringify(sessions),
        return_to_normal !== undefined ? return_to_normal : true,
      ])

      // Récupérer le groupe mis à jour
      const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
        req.params.id,
      ])

      res.json({
        message: 'Modifications du prochain cycle enregistrées avec succès',
        group: result.rows[0],
      })
    } catch (error) {
      console.error('Erreur enregistrement modifications cycle:', error)
      res.status(500).json({ error: error.message || 'Erreur serveur' })
    }
  },
)

// POST /api/groups/:id/apply-next-cycle - Appliquer les modifications du prochain cycle maintenant
router.post('/:id/apply-next-cycle', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    // Vérifier qu'il y a des modifications
    const check = await pool.query(
      'SELECT has_next_cycle_modifications FROM groups WHERE id = $1',
      [req.params.id],
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    if (!check.rows[0].has_next_cycle_modifications) {
      return res.status(400).json({ error: 'Aucune modification de cycle en attente' })
    }

    // Appliquer les modifications
    await pool.query('SELECT apply_next_cycle_modifications($1)', [req.params.id])

    // Récupérer le groupe mis à jour
    const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
      req.params.id,
    ])

    res.json({
      message: 'Cycle modifié appliqué avec succès',
      group: result.rows[0],
    })
  } catch (error) {
    console.error('Erreur application cycle:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

// DELETE /api/groups/:id/next-cycle-modifications - Annuler les modifications du prochain cycle
router.delete(
  '/:id/next-cycle-modifications',
  authMiddleware,
  adminOrTeacherMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE groups
      SET has_next_cycle_modifications = false,
          next_cycle_modifications = NULL,
          return_to_normal_after_cycle = true
      WHERE id = $1
      RETURNING *`,
        [req.params.id],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Groupe non trouvé' })
      }

      res.json({
        message: 'Modifications du prochain cycle annulées',
        group: result.rows[0],
      })
    } catch (error) {
      console.error('Erreur annulation modifications cycle:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  },
)

// POST /api/groups/:id/return-to-normal - Retourner au cycle normal
router.post('/:id/return-to-normal', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  try {
    await pool.query('SELECT return_to_normal_cycle($1)', [req.params.id])

    const result = await pool.query('SELECT * FROM v_groups_with_cycles WHERE id = $1', [
      req.params.id,
    ])

    res.json({
      message: 'Retour au cycle normal effectué',
      group: result.rows[0],
    })
  } catch (error) {
    console.error('Erreur retour cycle normal:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

// GET /api/groups/:id/cycle-info - Obtenir les informations complètes sur les cycles
router.get('/:id/cycle-info', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        g.*,
        (SELECT COUNT(*) FROM session_schedule WHERE group_id = g.id) as current_sessions_count,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id AND status = 'active') as enrolled_students,
        c.max_students_per_group,
        c.price,
        CASE
          WHEN g.has_next_cycle_modifications THEN
            g.next_cycle_modifications
          ELSE
            NULL
        END as next_cycle_info
      FROM groups g
      INNER JOIN courses c ON g.course_id = c.id
      WHERE g.id = $1`,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Groupe non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur récupération info cycle:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/groups/:id/sessions - Mettre à jour toutes les sessions d'un coup
router.patch('/:id/sessions', authMiddleware, adminOrTeacherMiddleware, async (req, res) => {
  const { sessions } = req.body

  try {
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: 'sessions (array) requis' })
    }

    // Utiliser la fonction create_manual_sessions_v2
    await pool.query('SELECT create_manual_sessions_v2($1, $2)', [
      req.params.id,
      JSON.stringify(sessions),
    ])

    // Récupérer les sessions créées
    const result = await pool.query(
      'SELECT * FROM v_sessions_detailed WHERE group_id = $1 ORDER BY session_number',
      [req.params.id],
    )

    res.json({
      message: 'Sessions mises à jour avec succès',
      sessions: result.rows,
    })
  } catch (error) {
    console.error('Erreur mise à jour sessions:', error)
    res.status(500).json({ error: error.message || 'Erreur serveur' })
  }
})

// ============================================
// ROUTES MISES À JOUR
// ============================================

// POST /api/groups - Créer un nouveau groupe (admin ou teacher)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Accès refusé' })
  }
  const {
    course_id,
    group_name,
    salle,
    // Pour cours unique
    start_date,
    start_time,
    end_time,
    // Pour cours continu avec calendrier flexible
    calendar_type,
    total_weeks,
    total_sessions, // NOUVEAU
    sessions_per_week, // NOUVEAU
    repeat_calendar,
    sessions,
    // Legacy pour compatibilité
    day_of_week,
    session_start_time,
    session_end_time,
    registration_open = true,
  } = req.body

  try {
    if (!course_id || !group_name) {
      return res.status(400).json({ error: 'course_id et group_name requis' })
    }

    const courseCheck = await pool.query('SELECT course_type FROM courses WHERE id = $1', [
      course_id,
    ])
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' })
    }

    const courseType = courseCheck.rows[0].course_type

    // Créer le groupe
    const result = await pool.query(
      `INSERT INTO groups (
        course_id, group_name, salle,
        start_date, start_time, end_time,
        day_of_week, session_start_time, session_end_time,
        calendar_type, total_weeks, total_sessions, sessions_per_week,
        repeat_calendar, registration_open, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
      RETURNING *`,
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
        total_sessions, // peut être null
        sessions_per_week || 1,
        repeat_calendar || false,
        registration_open,
      ],
    )

    const newGroup = result.rows[0]

    // Si des sessions manuelles sont fournies, les créer
    // ✅ FIX: filter out sessions with empty/missing dates before passing to DB
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

    res.status(201).json(newGroup)
  } catch (error) {
    console.error('Erreur création groupe:', error)
    // Duplicate name (23505) — after dropping the constraint this won't fire,
    // but kept as fallback just in case
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Un groupe avec ce nom existe déjà pour ce cours.' })
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ============================================
// EXPORT (garder celui existant)
// ============================================
// export default router
export default router
