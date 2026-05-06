import type { NextApiRequest, NextApiResponse } from 'next'
import { initDB } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) { // denne API-ruten brukes for å initiere DB-skjemaet ved første kall
  if (req.method !== 'POST') return res.status(405).end() // tallter kun post
  try { 
    await initDB() //interger db
    res.status(200).json({ ok: true }) // returner suksess
  } catch (err: any) { // hvis det skjer en feil så returner 500
    res.status(500).json({ error: err.message })
  }
}
