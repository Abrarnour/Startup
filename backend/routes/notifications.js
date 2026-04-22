// backend/routes/notifications.js
import express from 'express'
import pool from '../db.js'
import { authMiddleware } from './auth.js'

const router = express.Router()

// ─── 1. GET all notifications for logged-in user ──────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, notif_key, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id],
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── 2. Mark ALL as read (clears red badge) ───────────────────────────────────
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id],
    )
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── 3. Delete ONE notification ───────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification introuvable' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── 4. Delete ALL notifications (clear all button) ───────────────────────────
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notifications WHERE user_id = $1 RETURNING id', [
      req.user.id,
    ])
    res.json({ success: true, deleted: result.rowCount })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
