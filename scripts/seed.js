const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const env = fs.readFileSync(envPath, 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (!key) continue
    process.env[key] = rest.join('=').trim()
  }
}

loadEnv()

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment or .env file')
  process.exit(1)
}

const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      hash TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
  `

  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
  `

  await sql`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT '',
      solution TEXT NOT NULL DEFAULT '',
      avvik_type TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE issues ADD COLUMN IF NOT EXISTS avvik_type TEXT NOT NULL DEFAULT ''
  `
}

async function main() {
  console.log('Seeding Neon DB...')
  await initDB()
  console.log('Database schema initialized successfully.')
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
