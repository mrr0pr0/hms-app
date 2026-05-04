import type { NextApiRequest, NextApiResponse } from 'next'
import sql, { initDB } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initDB()


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

    return res.status(405).end()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
