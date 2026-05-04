import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export default sql

// ---------------------------------------------------------------------------
// Init schema — run once on first API call
// ---------------------------------------------------------------------------
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      hash      TEXT UNIQUE NOT NULL,
      is_admin  BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS issues (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT '',
      solution    TEXT NOT NULL DEFAULT '',
      created_by  TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Issue = {
  id: number
  title: string
  description: string
  status: '' | 'oppfattet' | 'blir_gjort' | 'fullfort' | 'ikke_viktig'
  solution: string
  created_by: string
  created_at: string
}

export type User = {
  id: number
  hash: string
  is_admin: boolean
  created_at: string
}
