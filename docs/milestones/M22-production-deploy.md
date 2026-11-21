# M22 — Production deploy
Phase: D   Depends on: M21   Est: 1 day
Mock domains after this milestone: none

## Goal
Fixit v1 (all Must features) runs on a public HTTPS origin with a managed database, private file storage and real email, with a hand-created super admin and demo data, and a README that lets someone else run, test and deploy it.

## Scope
- ARCHITECTURE §10.2 prod environment and topology (one origin, Caddy serving `dist/` with SPA fallback + proxying `/api`, one API container on Node 22, `prisma migrate deploy` on release, managed Postgres 16, S3-compatible private bucket via `S3StorageService`, SMTP provider), §10.3 prod env values (`COOKIE_SECURE=true`, `TRUST_PROXY=true`, `STORAGE_DRIVER=s3`), §6.3 `admin:create` script, §7.8 S3 storage, §8.3 seed rules (dev seed refuses production), D16.
- Demo data in production: a production-safe demo seed path decided in the plan (e.g. a separate `demo:seed` with non-`demo1234` passwords) — see notes.
- README: setup, commands table, mock switch, env vars, deploy steps, demo logins policy.
- SPEC §10.2 inputs resolved: Privacy body copy, contact email, hero photo (M00 gaps #1–#3, #5).

## Out of scope
- Should features (Phase E). Scaling beyond one API instance (D7/D15 would need revisiting).

## Acceptance criteria
1. `https://<prod domain>/` serves the app over TLS; `/api/health` returns `{"ok":true,"db":true}`; a deep link like `/providers/p01` loads (SPA fallback); hashed assets have long cache headers, `index.html` doesn't.
2. A super admin created with `pnpm --filter @fixit/api admin:create --email … --name …` signs in at `/admin/login`; no other route can create admins.
3. The three golden journeys from M21 are repeated by hand on production at 390px (phone browser) and 1440px with real emails arriving (confirmation, new request, accepted, completed, verification approved) — results recorded in the review.
4. Uploaded NIC documents are not reachable by direct bucket URL; `/api/files/documents/:id` works for the owner and admin only. The refresh cookie is `Secure; HttpOnly; SameSite=Lax`.
5. `/privacy` shows the final policy text (no `Content coming before launch.`), `/contact` shows the real contact email, and the hero shows the supplied photo (or the approved placeholder decision is recorded).
6. Restarting the API container keeps sessions working (refresh cookie) and runs `prisma migrate deploy` idempotently; the expiry job runs (a test pending request with a past deadline flips to Expired within ~1 minute).
7. README lets a fresh clone reach `pnpm verify` green and `pnpm dev` running in under 15 minutes following it literally.

## Notes for the planner
- Hosting choices are `[ASSUMED]` in ARCHITECTURE §10.2 (Fly.io / Render / VPS, Neon, R2, Postmark/Resend). The user must pick and provide credentials before this milestone starts; if they're missing, write a Blocker rather than choosing.
- The dev seed refuses `NODE_ENV=production`. Demo data on production needs its own decision (what, which passwords); if not decided, write a Blocker.
- Never commit `.env`; add any new variable to `.env.example` and ARCHITECTURE §10.3 (with a decision record if it changes an approved shape).
