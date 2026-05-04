import type { NextApiRequest, NextApiResponse } from 'next'
import sql, { initDB } from '@/lib/db'

const ADMIN_CODES = ['ADMIN2024', 'HMS-ADMIN', 'DROEMTORP']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initDB()

    // GET /api/issues — list all issues newest first
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM issues ORDER BY created_at DESC
      `
      return res.status(200).json(rows)
    }

    // POST /api/issues — create new issue
    if (req.method === 'POST') {
      const { title, description, created_by } = req.body
      if (!title || !created_by) return res.status(400).json({ error: 'Missing title or created_by' })

      const rows = await sql`
        INSERT INTO issues (title, description, created_by)
        VALUES (${title}, ${description || ''}, ${created_by})
        RETURNING *
      `
      return res.status(201).json(rows[0])
    }

    // PATCH /api/issues — update status or solution (admin only)
    if (req.method === 'PATCH') {
      const { id, status, solution, hash } = req.body

      // Verify the user is admin in DB
      if (!hash) return res.status(401).json({ error: 'Unauthorized' })
      const users = await sql`SELECT is_admin FROM users WHERE hash = ${hash} LIMIT 1`
      if (!users.length || !users[0].is_admin) {
        return res.status(403).json({ error: 'Forbidden: not admin' })
      }

      if (!id) return res.status(400).json({ error: 'Missing id' })

      const validStatuses = ['', 'oppfattet', 'blir_gjort', 'fullfort', 'ikke_viktig']

      if (status !== undefined) {
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' })
        await sql`UPDATE issues SET status = ${status} WHERE id = ${id}`
      }

      if (solution !== undefined) {
        await sql`UPDATE issues SET solution = ${solution} WHERE id = ${id}`
      }

      const rows = await sql`SELECT * FROM issues WHERE id = ${id} LIMIT 1`
      return res.status(200).json(rows[0])
    }

    return res.status(405).end()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
