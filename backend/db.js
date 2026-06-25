// backend/db.js
// ─────────────────────────────────────────────────────────────
// Dynamic multi-tenant connection manager
// - platformPool  → platform_db  (tenants, plans, invoices)
// - getPool(slug) → school_{slug} DB
// ─────────────────────────────────────────────────────────────

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

// ── اتصال ثابت بقاعدة البيانات المركزية ─────────────────────
export const platformPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME || 'platform_db',
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
})

platformPool.connect((err, client, release) => {
  if (err) console.error('❌ Platform DB connection failed:', err.message)
  else {
    console.log('✅ Connected to platform_db')
    release()
  }
})

// ── Cache للـ pools المفتوحة ──────────────────────────────────
const poolCache = new Map()

// ── إنشاء أو استرداد pool لمدرسة معينة ──────────────────────
export function getPool(dbName) {
  if (!dbName) throw new Error('dbName is required')

  if (poolCache.has(dbName)) return poolCache.get(dbName)

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
  })

  pool.on('error', (err) => {
    console.error(`❌ Pool error for ${dbName}:`, err.message)
    poolCache.delete(dbName) // أعد الإنشاء في المرة القادمة
  })

  poolCache.set(dbName, pool)
  return pool
}

// ── إغلاق pool مدرسة (عند تعليق الاشتراك مثلاً) ─────────────
export async function closePool(dbName) {
  if (poolCache.has(dbName)) {
    await poolCache.get(dbName).end()
    poolCache.delete(dbName)
    console.log(`🔒 Pool closed for ${dbName}`)
  }
}
