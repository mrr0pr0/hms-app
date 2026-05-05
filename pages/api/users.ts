import type { NextApiRequest, NextApiResponse } from 'next'
import sql, { initDB } from '@/lib/db'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initDB()

    // GET /api/users — get user by hash
    if (req.method === 'GET') {
      const { hash } = req.query
      if (!hash || typeof hash !== 'string') return res.status(400).json({ error: 'Missing hash' })

      let rows = await sql`SELECT * FROM users WHERE hash = ${hash} LIMIT 1`

      if (rows.length === 0) {
        rows = await sql`
          INSERT INTO users (hash) VALUES (${hash})
          RETURNING *
        `
      }

      return res.status(200).json(rows[0])
    }

    // POST /api/users/login — login with username/password
    if (req.method === 'POST') {
      const { username, password } = req.body
      if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })

      const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })

      const user = rows[0]
      if (!user.password_hash) return res.status(401).json({ error: 'Invalid credentials' })

      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

      // Generate new hash for session
      const newHash = crypto.randomBytes(32).toString('hex')
      await sql`UPDATE users SET hash = ${newHash} WHERE id = ${user.id}`

      return res.status(200).json({ ...user, hash: newHash })
    }

    // POST /api/users/register — register new user (for testing, make first user admin)
    if (req.method === 'PUT') {
      const { username, password } = req.body
      if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })

      const hashedPassword = await bcrypt.hash(password, 10)
      const hash = crypto.randomBytes(32).toString('hex')

      // Check if any users exist, if not, make admin
      const existingUsers = await sql`SELECT COUNT(*) as count FROM users`
      const isAdmin = existingUsers[0].count === 0

      const rows = await sql`
        INSERT INTO users (username, password_hash, hash, is_admin)
        VALUES (${username}, ${hashedPassword}, ${hash}, ${isAdmin})
        RETURNING *
      `

      return res.status(201).json(rows[0])
    }

    return res.status(405).end()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
