# M15 — Auth API
Phase: C   Depends on: M14   Est: 1½ days
Mock domains after this milestone: all except `auth` (`VITE_MOCK_DOMAINS=catalog,providers,requests,reviews,admin`)

## Goal
Real accounts: registration with emailed confirmation, email/password and Google sign-in, admin sign-in, rotating refresh cookies with theft detection, password reset and change, profile updates and rate limits. Every M04 screen works unchanged against the API, and the still-mocked domains accept the real JWTs.

## Scope
- PRODUCT F-01, F-02, F-03, F-04, F-30; BR-23, BR-35, BR-41/42 (suspended login/refresh); §8 emails: confirmation, password reset.
- ARCHITECTURE §3.1 all 14 auth endpoints; §6.1 flows (argon2id, hashed single-use tokens 24 h / 1 h, constant-time missing-user verify, suspended checked after password, Google state + PKCE cookie, account linking), §6.2 tokens (`fx_rt` cookie attributes, family rotation, reuse → revoke family), §6.3 `JwtAuthGuard` (PK lookup each request, roles derived fresh) + `RolesGuard` + rate limits table, `NotificationsService` with the two auth templates (subjects per SPEC §8.6), D5, D11, D13, D20.
- Matrix rows for every auth endpoint; integration tests per endpoint (happy path + main rule failures).

## Out of scope
- `admin:create` CLI (M22) — the dev seed already has `admin@fixit.test`. Suspension *action* (M20); here only its effect on login/refresh/guard.

## Acceptance criteria
1. The authorization matrix rows for all §3.1 endpoints pass (anon/customer/provider/admin/other personas + suspended persona → 401 on non-public).
2. With `VITE_MOCK_DOMAINS=catalog,providers,requests,reviews,admin` and `pnpm dev`, every M04 acceptance criterion passes on real data, at 1440px and 390px: sign up → confirmation email appears in Mailpit → its link confirms (S8) → log in; forgot password → Mailpit reset email → S10 → old password rejected; S18 name/mobile/password changes persist across API restarts.
3. Wrong password → S5 banner; Olivia logs in → `/`, Marcus → `/dashboard`; admin via `/admin/login`; Olivia via `/admin/login` → same generic error. A suspended DB user (set by SQL) gets the suspended banner only after a correct password.
4. Session: reload keeps the session (refresh cookie, `HttpOnly; SameSite=Lax; Path=/api/auth`); access token is never in localStorage; replaying an already-rotated refresh token returns 401 and revokes the family (integration test); password reset and change revoke other sessions.
5. Mixed mode: signed in for real, Discover, profile, booking and dashboard still work against MSW (mock `resolveActor` decodes the real JWT; D2).
6. Rate limit: the 6th login attempt within a minute for the same IP+email → S5 `Too many attempts. Wait a few minutes and try again.`; resend confirmation twice within 60 s → 429.
7. Google: with `GOOGLE_CLIENT_ID/SECRET` set, `Continue with Google` completes the OAuth round trip to `/auth/google/done` and lands on `next`; with them unset `/api/auth/google` returns 404 and the button is hidden (`VITE_GOOGLE_ENABLED=false`). Integration tests cover callback state mismatch, linking by email, new confirmed user, admin email refused, suspended → `/login?error=suspended` (Google client faked).
8. Refresh requires same-origin `Origin`/`Sec-Fetch-Site`; a cross-origin POST → 401.

## Notes for the planner
- Responses go through `respond()`; `Me` is built by a mapper with `deriveRoles()`; `openRequestCount` and `provider.pendingRequestCount` come from queries (they'll be 0/seeded until requests are real — fine).
- Emails are sent after commit and never fail the request (MemoryMail in tests; assert outbox contents).
- Admins get 403 on U routes (`PATCH /me`), per ARCHITECTURE §3.
- At the end, click through the M04 flows by hand against the real API and record the result in the review.
