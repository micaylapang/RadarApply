# DropNoti

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
  - URL: `https://YOUR_APP.vercel.app/api/cron/poll`
  - Header: `Authorization: Bearer YOUR_CRON_SECRET`
  - Schedule: every 1 minute

## Test SMS

1. Sign up with **DropNoti Demo** selected  
2. Click **Send me a test text**

## Stack

- Next.js App Router
- Supabase Postgres
- Twilio SMS
- Greenhouse / Lever / Ashby board polling
- Vercel Cron (production) / in-process loop (local)
