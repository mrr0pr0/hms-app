import type { NextApiRequest, NextApiResponse } from "next";
import sql, { initDB } from "@/lib/db";

const ADMIN_CODES = ["ADMIN2024", "HMS-ADMIN", "DROEMTORP"]; // Disse kodene kan brukes for å oppgradere en bruker til admin, i produksjon dette er ikke sikkert

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await initDB(); // int db

    // GET /api/issues
    if (req.method === "GET") {
      const rows = await sql`
        SELECT * FROM issues ORDER BY created_at DESC
      `;
      return res.status(200).json(rows); // returner issues
    }

    // POST /api/issues
    if (req.method === "POST") {
      const { title, description, created_by, avvik_type } = req.body; // hent data fra request body
      if (!title || !created_by)
        return res.status(400).json({ error: "Missing title or created_by" }); // title og created_by er påkrevd

      const rows = await sql`
        INSERT INTO issues (title, description, created_by, avvik_type)
        VALUES (${title}, ${description || ""}, ${created_by}, ${avvik_type || ""})
        RETURNING *
      `;
      return res.status(201).json(rows[0]); // returner den opprettede issue
    }

    // PATCH /api/issues — update status or solution (admin only)
    if (req.method === "PATCH") {
      const { id, status, solution, hash } = req.body; // hent data fra request body

      // Verify the user is admin in DB
      if (!hash) return res.status(401).json({ error: "Unauthorized" }); // hash er påkrevd for å verifisere admin
      const users =
        await sql`SELECT is_admin FROM users WHERE hash = ${hash} LIMIT 1`; // hent is_admin for brukeren med gitt hash
      if (!users.length || !users[0].is_admin) {
        // hvis ingen bruker funnet eller ikke admin så returner 403
        return res.status(403).json({ error: "Forbidden: not admin" }); // dette burde endres i produksjon for å ikke lekke admin koder
      }

      if (!id) return res.status(400).json({ error: "Missing id" }); // id er påkrevd

      const validStatuses = [
        "",
        "oppfattet",
        "blir_gjort",
        "fullfort",
        "ikke_viktig",
      ];

      if (status !== undefined) {
        if (!validStatuses.includes(status))
          return res.status(400).json({ error: "Invalid status" }); // hvis status er gitt så må den være gyldig
        await sql`UPDATE issues SET status = ${status} WHERE id = ${id}`; // oppdater status hvis gitt
      }

      if (solution !== undefined) {
        await sql`UPDATE issues SET solution = ${solution} WHERE id = ${id}`; // oppdater solution hvis gitt
      }

      const rows = await sql`SELECT * FROM issues WHERE id = ${id} LIMIT 1`; // hent den oppdaterte issue
      return res.status(200).json(rows[0]); // returner den oppdaterte issue
    }

    return res.status(405).end(); // hvis metoden ikke er håndtert så returner 405
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
