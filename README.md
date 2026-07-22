# RadarApply

SMS alerts when internship applications open. Backend: **Supabase**. SMS: **Twilio**.

## Supabase setup

1. Create a project at [https://supabase.com](https://supabase.com)
2. Open **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql)
3. Copy keys from **Project Settings → API** into `.env`
4. Seed: `npm run db:seed`

## Run locally

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

Locally, a built-in ~1s watch loop starts with the Next.js server.

## Deploy on Vercel (~1-minute watch)

1. Push the repo and import it in Vercel
2. Add env vars from `.env` (including `CRON_SECRET`)
3. Deploy — [`vercel.json`](vercel.json) defines `GET /api/cron/poll`

**Cron frequency**
- **Vercel Pro:** every-minute cron in `vercel.json` works as written
- **Vercel Hobby:** native cron is once/day max — use a free external ping instead, e.g. [cron-job.org](https://cron-job.org), hitting:
  - URL: `https://www.radarapply.com/api/cron/poll`
  - Header: `Authorization: Bearer YOUR_CRON_SECRET`
  - Schedule: every 1 minute

Each tick fetches **each unique board once** (Greenhouse / Lever / Ashby / Amazon) and applies every role filter in memory — so 8 Akuna watches = 1 HTTP call, not 8.

## Stack

- Next.js App Router
- Supabase Postgres
- Twilio SMS
- Greenhouse / Lever / Ashby board polling (deduped per tick)
- Vercel Cron (production) / in-process loop (local)
