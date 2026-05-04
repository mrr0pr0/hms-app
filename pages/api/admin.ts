import type { NextApiRequest, NextApiResponse } from 'next'
import sql, { initDB } from '@/lib/db'

const ADMIN_CODES = ['ADMIN123', 'HMS-ADMIN', 'DROEMTORP']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    await initDB()
    const { hash, code } = req.body

    if (!hash || !code) return res.status(400).json({ error: 'Missing hash or code' })

    if (!ADMIN_CODES.includes(code.trim().toUpperCase())) {
      return res.status(403).json({ error: 'Ugyldig kode' })
    }

    const rows = await sql`
      UPDATE users SET is_admin = true WHERE hash = ${hash}
      RETURNING *
    `

    if (!rows.length) return res.status(404).json({ error: 'Bruker ikke funnet' })

    return res.status(200).json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
