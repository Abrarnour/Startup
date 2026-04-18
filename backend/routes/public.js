// backend/routes/public.js
import express from 'express'
import pool from '../db.js'

const router = express.Router()

// 📋 GET /api/public/courses - Tous les cours (page publique)
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        u.name as teacher_name,
        u.last_name as teacher_last_name,
        u.gender as teacher_gender,
        COUNT(DISTINCT g.id) as total_groups,
        COUNT(DISTINCT g.id) FILTER (WHERE g.registration_open = true) as open_groups
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN groups g ON c.id = g.course_id
      WHERE c.is_active = true
      GROUP BY c.id, u.name, u.last_name, u.gender
      ORDER BY c.education_level, c.year_level, c.title
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Erreur récupération cours publics:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 📖 GET /api/public/courses/:id - Détails d'un cours
router.get('/courses/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.*,
        u.name as teacher_name,
        u.last_name as teacher_last_name,
        u.gender as teacher_gender
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1 AND c.is_active = true
    `,
      [req.params.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Erreur récupération cours:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
