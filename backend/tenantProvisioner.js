// backend/tenantProvisioner.js
import pg from 'pg'
import bcrypt from 'bcrypt'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const { Pool, Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getRootClient() {
  return new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
  })
}

export async function provisionTenant({
  slug,
  adminEmail,
  adminPassword,
  adminPasswordHash,
  schoolName,
}) {
  const dbName = `school_${slug.replace(/-/g, '_')}`

  // 1. Drop if exists (clean retry), then create fresh
  const rootClient = getRootClient()
  await rootClient.connect()
  try {
    // Terminate any open connections first
    await rootClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
      [dbName],
    )
    await rootClient.query(`DROP DATABASE IF EXISTS "${dbName}"`)
    await rootClient.query(`CREATE DATABASE "${dbName}"`)
    console.log(`✅ Created database: ${dbName}`)
  } finally {
    await rootClient.end()
  }

  // 2. Apply schema
  const schemaPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
  })

  const rawSQL = readFileSync(path.join(__dirname, 'tenant_schema.sql'), 'utf-8')

  // Strip COPY ... FROM stdin blocks (psql-only, not supported by node-postgres)
  const schemaSQL = rawSQL.replace(/COPY\s+[\s\S]*?FROM\s+stdin;[\s\S]*?\\\.((\r?\n)|$)/gim, '')

  const schemaClient = await schemaPool.connect()
  try {
    await schemaClient.query(schemaSQL)
    console.log(`✅ Schema applied to ${dbName}`)
  } catch (err) {
    console.error(`❌ Schema error in ${dbName}:`, err.message)
    throw err
  } finally {
    schemaClient.release()
  }

  // 3. Create school admin user
  // FIX: tenant_schema.sql sets search_path='' (pg_dump default).
  // Must reset search_path and use public.users explicitly.
  const hashToUse = adminPasswordHash ? adminPasswordHash : await bcrypt.hash(adminPassword, 10)

  const adminClient = await schemaPool.connect()
  try {
    await adminClient.query(`SET search_path = public`)
    await adminClient.query(
      `INSERT INTO public.users (name, last_name, email, password, role)
       VALUES ('Admin', $1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [schoolName, adminEmail, hashToUse],
    )
    console.log(`✅ Admin user created for ${dbName}`)
  } finally {
    adminClient.release()
  }

  await schemaPool.end()
  return dbName
}

export async function dropTenantDB(dbName) {
  const rootClient = getRootClient()
  await rootClient.connect()
  try {
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
