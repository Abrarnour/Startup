// backend/tenantProvisioner.js
// ─────────────────────────────────────────────────────────────
// يُنشئ قاعدة بيانات جديدة لكل مدرسة عند التسجيل
// الخطوات:
//   1. CREATE DATABASE school_{slug}
//   2. تنفيذ schema المدرسة (نفس الجداول الحالية)
//   3. إنشاء حساب admin للمدرسة
// ─────────────────────────────────────────────────────────────

import pg from 'pg'
import bcrypt from 'bcrypt'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const { Pool, Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── اتصال postgres عام (بدون DB محدد) لإنشاء DBs جديدة ──────
function getRootClient() {
  return new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // الـ default DB
    ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
  })
}

// ── إنشاء DB + schema + admin للمدرسة الجديدة ───────────────
export async function provisionTenant({ slug, adminEmail, adminPassword, schoolName }) {
  const dbName = `school_${slug.replace(/-/g, '_')}`

  // 1. إنشاء قاعدة البيانات
  const rootClient = getRootClient()
  await rootClient.connect()
  try {
    await rootClient.query(`CREATE DATABASE "${dbName}"`)
    console.log(`✅ Created database: ${dbName}`)
  } catch (err) {
    if (err.code === '42P04') {
      console.warn(`⚠️  Database ${dbName} already exists, skipping creation`)
    } else {
      throw err
    }
  } finally {
    await rootClient.end()
  }

  // 2. تطبيق الـ schema
  const schemaPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
  })

  const schemaSQL = readFileSync(path.join(__dirname, 'tenant_schema.sql'), 'utf-8')

  await schemaPool.query(schemaSQL)
  console.log(`✅ Schema applied to ${dbName}`)

  // 3. إنشاء حساب admin للمدرسة
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await schemaPool.query(
    `INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
     VALUES ($1, $2, 'admin', 'Admin', $3, true)`,
    [adminEmail, hashedPassword, schoolName],
  )
  console.log(`✅ Admin user created for ${dbName}`)

  await schemaPool.end()
  return dbName
}

// ── حذف DB مدرسة (عند الإلغاء النهائي) ──────────────────────
export async function dropTenantDB(dbName) {
  const rootClient = getRootClient()
  await rootClient.connect()
  try {
    // إنهاء كل الاتصالات المفتوحة أولاً
    await rootClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
      [dbName],
    )
    await rootClient.query(`DROP DATABASE IF EXISTS "${dbName}"`)
    console.log(`🗑️  Dropped database: ${dbName}`)
  } finally {
    await rootClient.end()
  }
}
