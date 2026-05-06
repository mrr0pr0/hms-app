import type { NextApiRequest, NextApiResponse } from "next";
import sql, { initDB } from "@/lib/db";

const ADMIN_CODES = ["ADMIN123", "HMS-ADMIN", "DROEMTORP"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // gir amdmin en kode for å oppgradere seg selv til admin, for testing
  if (req.method !== "POST") return res.status(405).end(); //dette burde endres i produksjon pga veriavelre admin koder

  try {
    await initDB(); // sørg for at DB er initiert
    const { hash, code } = req.body; // hent hash og kode fra request body

    if (!hash || !code)
      return res.status(400).json({ error: "Missing hash or code" }); // hvis en manger så returner 400

    if (!ADMIN_CODES.includes(code.trim().toUpperCase())) {
      // hvis koden ikke er gyldig så returner 403
      return res.status(403).json({ error: "Ugyldig kode" }); // dette burde endres i produksjon for å ikke lekke admin koder
    }

    // lager sql for a sette has
    const rows = await sql` 
      UPDATE users SET is_admin = true WHERE hash = ${hash}
      RETURNING *
    `;
    // hvis ikke ble laged endring så 40r5
    if (!rows.length)
      return res.status(404).json({ error: "Bruker ikke funnet" });

    return res.status(200).json(rows[0]); // returner den oppdaterte brukeren
  } catch (err: any) {
    // hvis det skjer en feil så returner 500
    res.status(500).json({ error: err.message });
  }
}
