// backend/routes/materials.js

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../db.js'
import { authMiddleware } from './auth.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non autorisé!'), false)
  }
}

// ✅ CHANGED: 250MB limit (was 50MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB max
  },
})

// =============================================
// POST - Upload course material
// =============================================
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { course_id, title, description } = req.body
    const teacher_id = req.user.id

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' })
    }

    // Verify teacher owns the course or is admin
    const courseCheck = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND (teacher_id = $2 OR $3 = $4)',
      [course_id, teacher_id, req.user.role, 'admin'],
    )

    if (courseCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path)
      return res.status(403).json({ error: 'Accès refusé à ce cours' })
    }

    const fileName = req.file.filename
    const filePath = `/uploads/${fileName}`
    const fileType = req.file.mimetype
    const fileSize = req.file.size

    const result = await pool.query(
      `INSERT INTO course_materials
      (course_id, teacher_id, title, description, file_name, file_path, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [course_id, teacher_id, title, description, fileName, filePath, fileType, fileSize],
    )

    res.status(201).json({
      message: 'Fichier téléchargé avec succès',
      material: result.rows[0],
    })
  } catch (error) {
    console.error('Upload error:', error)
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Erreur lors du téléchargement' })
  }
})

// =============================================
// GET - Get all materials for a course
// =============================================
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params
    if (!courseId || courseId === 'undefined') {
      return res.status(400).json({ error: 'Invalid Course ID' })
    }

    const result = await pool.query(
      `SELECT cm.*, u.name as teacher_name, u.last_name as teacher_last_name
      FROM course_materials cm
      JOIN users u ON cm.teacher_id = u.id
      WHERE cm.course_id = $1
      ORDER BY cm.uploaded_at DESC`,
      [courseId],
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Get materials error:', error)
    res.status(500).json({ error: 'Erreur récupération matériaux' })
  }
})

// =============================================
// GET - Stream a video securely (no download, watch in browser)
// Supports HTTP Range requests for seeking
// Also accepts ?token= query param because <video> src can't send Auth headers
// =============================================
router.get(
  '/stream/:materialId',
  (req, res, next) => {
    // Allow token from query param for <video> tags
    if (req.query.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${req.query.token}`
    }
    next()
  },
  authMiddleware,
  async (req, res) => {
    try {
      const { materialId } = req.params

      const result = await pool.query('SELECT * FROM course_materials WHERE id = $1', [materialId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Matériau non trouvé' })
      }

      const material = result.rows[0]

      // Only allow streaming for video files
      if (!material.file_type.startsWith('video/')) {
        return res.status(400).json({ error: "Ce fichier n'est pas une vidéo" })
      }

      const filePath = path.join(__dirname, '..', 'uploads', material.file_name)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier non trouvé sur le serveur' })
      }

      const stat = fs.statSync(filePath)
      const fileSize = stat.size
      const range = req.headers.range

      if (range) {
        // Handle Range requests (for video seeking)
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        const file = fs.createReadStream(filePath, { start, end })

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': material.file_type,
          // NO Content-Disposition → browser plays inline
        })

        file.pipe(res)
      } else {
        // No range request — send full file for inline playback
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': material.file_type,
          'Accept-Ranges': 'bytes',
          // NO Content-Disposition → browser plays inline
        })

        fs.createReadStream(filePath).pipe(res)
      }
    } catch (error) {
      console.error('Stream error:', error)
      res.status(500).json({ error: 'Erreur streaming vidéo' })
    }
  },
)

// =============================================
// GET - Download a specific material (non-video files)
// =============================================
router.get('/download/:materialId', authMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params

    const result = await pool.query('SELECT * FROM course_materials WHERE id = $1', [materialId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matériau non trouvé' })
    }

    const material = result.rows[0]
    const filePath = path.join(__dirname, '..', 'uploads', material.file_name)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé sur le serveur' })
    }

    res.download(filePath, material.file_name)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Erreur téléchargement' })
  }
})

// =============================================
// DELETE - Delete a material (teacher/admin only)
// =============================================
router.delete('/:materialId', authMiddleware, async (req, res) => {
  try {
    const { materialId } = req.params
    const teacher_id = req.user.id

    const result = await pool.query(
      'SELECT * FROM course_materials WHERE id = $1 AND (teacher_id = $2 OR $3 = $4)',
      [materialId, teacher_id, req.user.role, 'admin'],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matériau non trouvé ou accès refusé' })
    }

    const material = result.rows[0]
    const filePath = path.join(__dirname, '..', 'uploads', material.file_name)

    await pool.query('DELETE FROM course_materials WHERE id = $1', [materialId])

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.json({ message: 'Matériau supprimé avec succès' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Erreur suppression' })
  }
})

export default router
