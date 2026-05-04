# HMS Avvikssystem – Drømtorp vgs

Enkel web-app for å registrere og behandle HMS-avvik. Bygget med Next.js og Neon (PostgreSQL).

---

## Oppsett

### 1. Opprett Neon-database

1. Gå til [console.neon.tech](https://console.neon.tech) og lag en gratis konto
2. Opprett et nytt prosjekt (velg nærmeste region, f.eks. EU Central)
3. Kopier **Connection string** — den ser slik ut:
   ```
   postgres://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Konfigurer miljøvariabler

```bash
cp .env.local.example .env.local
```

Åpne `.env.local` og lim inn din connection string:

```env
DATABASE_URL=postgres://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Installer og kjør

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000)

Databasetabellene opprettes **automatisk** første gang du åpner appen (via `initDB()`).

---

## Deploy til Vercel (valgfritt)

```bash
npm install -g vercel
vercel
```

Legg til `DATABASE_URL` som environment variable i Vercel-dashboardet.

---

## Roller og tilgang

| Rolle | Hash | Admin-kode |
|-------|------|------------|
| Vanlig bruker | Genereres automatisk | — |
| Admin | Genereres automatisk | `ADMIN2024` |

**Slik logger du inn som admin:**
1. Klikk på bruker-hashen øverst til høyre (f.eks. `usr_A3F9X2`)
2. Skriv inn koden `ADMIN2024`
3. Du får nå admin-badge og kan endre status og skrive løsninger

Andre gyldige koder: `HMS-ADMIN`, `DROEMTORP`

For å bytte koder, rediger `ADMIN_CODES`-arrayen i:
- `pages/api/admin.ts`
- `pages/api/issues.ts`

---

## Databasestruktur

```sql
-- Brukere
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  hash       TEXT UNIQUE NOT NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saker
CREATE TABLE issues (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT '',
  solution    TEXT NOT NULL DEFAULT '',
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## API-endepunkter

| Metode | URL | Beskrivelse |
|--------|-----|-------------|
| `GET` | `/api/users?hash=xxx` | Hent eller opprett bruker |
| `GET` | `/api/issues` | List alle saker |
| `POST` | `/api/issues` | Opprett ny sak |
| `PATCH` | `/api/issues` | Oppdater status/løsning (kun admin) |
| `POST` | `/api/admin` | Gjør bruker til admin via kode |
