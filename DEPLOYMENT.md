# CampusIQ — Going Live

This gets everyone on your team talking to **one shared, hosted database**,
instead of each person running Postgres on their own laptop.

## Overview

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Frontend   │  HTTPS │     Backend       │  TLS   │   Postgres      │
│  (Vercel)   │ ─────▶ │  (Render/Railway) │ ─────▶ │  (Neon/Supabase)│
└─────────────┘        └──────────────────┘        └─────────────────┘
```

Everyone's browser talks to the same deployed frontend → same deployed
backend → same hosted database. Nobody needs Postgres installed locally
anymore (though you still can, for local dev).

---

## Step 1 — Host the database (Neon, free tier)

Neon is recommended here: serverless Postgres, generous free tier, standard
`DATABASE_URL` connection string, no server to manage.

1. Go to https://neon.tech → sign up → **New Project**.
2. Name it (e.g. `campusiq`), pick a region close to your users.
3. Neon gives you a connection string immediately, e.g.:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-forest-12345.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy that. This is your **one shared `DATABASE_URL`**.

(Supabase or Railway Postgres work the same way if you prefer those.)

### Push your schema to it

From `backend/`:
```bash
cd backend
cp .env.example .env
# paste the Neon connection string into DATABASE_URL in .env
# generate a real JWT_SECRET (see .env.example comment) and paste it in too

npx prisma migrate deploy   # applies all existing migrations to the live DB
npx prisma generate
```

Your live database now has the full schema. Run your seed scripts if you
want starter data:
```bash
node prisma/seed-departments.js
node prisma/seed-academic-years.js
# etc — whichever seeds you need
```

---

## Step 2 — Deploy the backend (Render, free tier works for low traffic)

1. Push this repo to GitHub if it isn't already.
2. https://render.com → **New → Web Service** → connect your repo, root
   directory `backend`.
3. Build command: `npm ci && npx prisma generate`
   Start command: `node src/server.js`
4. Under **Environment**, add every variable from `backend/.env.example`
   with real values — **use the same `DATABASE_URL` from Step 1** and the
   same `JWT_SECRET` you generated. This is what makes it "the same
   credentials for everyone": one backend, one DB, one secret.
5. Set `CORS_ORIGIN` to your frontend's URL once you have it from Step 3
   (you can come back and set this after).
6. Deploy. Render gives you a URL like `https://campusiq-api.onrender.com`.
   Check `https://campusiq-api.onrender.com/health` — should return
   `{"status":"ok","database":"connected"}`.

(Railway works essentially the same way, also has a free/low-cost tier.)

---

## Step 3 — Deploy the frontend (Vercel, free tier)

1. https://vercel.com → **New Project** → import the repo, root directory
   `frontend`.
2. Framework preset: Vite.
3. Environment variable: `VITE_API_URL` = `https://campusiq-api.onrender.com/api/v1`
   (your Render URL from Step 2, with `/api/v1` on the end).
4. Deploy. Vercel gives you a URL like `https://campusiq.vercel.app`.
5. Go back to Render (Step 2) and set `CORS_ORIGIN` to this Vercel URL,
   then redeploy the backend so it accepts requests from it.

---

## Step 4 — Sharing access with your team

- **Database credentials, JWT secret, registration key**: share the actual
  values via a password manager (1Password, Bitwarden) shared vault, or
  your hosting provider's team/org feature (Render, Vercel, and Neon all
  support inviting teammates directly — prefer this over sharing raw
  secrets at all). Never paste secrets into Slack, email, or a public repo.
- **App logins**: each real user (teacher, admin, student, parent) should
  still get their own account via the `/register` endpoint — the app
  already supports this per-tenant, with bcrypt-hashed passwords and
  role-based access. Multiple people should not share one login; the app's
  authorization logic depends on knowing who is making each request.

---

## Local development after this

Each developer's `backend/.env` and `frontend/.env` can now point at the
**same live Neon database** (fastest, everyone sees the same data) or at
their own local Postgres (safer for destructive testing — use
`DATABASE_URL=postgresql://localhost:5432/campusiq_dev`). Either way, keep
`.env` out of git (already gitignored).

---

## What changed in this pass

- Fixed the frontend's API client, which had the backend URL **hardcoded**
  to `localhost:8000` — this was the actual blocker preventing any deployed
  frontend from reaching a real backend. It now reads `VITE_API_URL`.
- Removed several duplicated/dead files and folders left over from a bad
  copy or merge (`api/api/`, `components/ui/ui/`, `components/cards/cards/`,
  `context/context/`, an unused `AppRoutes.jsx`, two stale duplicate
  Dashboard files).
- Fixed two broken import paths (`Roles Section/Roles` → `Roles Section/roles`,
  `Roles.css` → `roles.css`) that were silently breaking the production
  build (case-sensitive on Linux hosts, even though it worked on macOS).
- Added `backend/.env.example` and `frontend/.env.example` so setup is
  explicit and repeatable for every teammate.
- Added `backend/src/utils/validateEnv.js`, run at boot, so a missing
  `DATABASE_URL` or weak `JWT_SECRET` fails immediately with a clear
  message instead of crashing mysteriously later.
- Added a `/health` endpoint that also checks DB connectivity (used by
  Render/Railway health checks and uptime monitoring).
- Fixed `docker-compose.yml`, which was only forwarding `DATABASE_URL` into
  the container and silently dropping `JWT_SECRET`, `CORS_ORIGIN`, and
  `REGISTRATION_KEY`.
