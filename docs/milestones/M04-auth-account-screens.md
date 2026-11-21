# M04 — Auth & account screens
Phase: B   Depends on: M03   Est: 1½ days
Mock domains after this milestone: all

## Goal
Guests can sign up, confirm their email, log in (email or simulated Google), reset a forgotten password and log out; signed-in users manage their name, mobile and password; admins sign in on their own page. Redirects (`next`, provider intent, role home) and session expiry behave exactly as SPEC §8.4 / §6.6 describe.

## Scope
- PRODUCT F-01, F-02, F-03 (S18 part), F-04 (the `next` round trip), F-30; BR-23 (provider mobile required), BR-35, BR-41/42 (suspended login message).
- SPEC S5 Log in, S6 Sign up (incl. `?intent=provider`), S7 Check your email (60 s resend cooldown), S8 Confirm email (success / already / expired / loading), S9 Forgot password, S10 Reset password, S18 Account settings (details, password, "I offer services" card; F-40 line only), S29 Admin sign-in; §6.6 session expired (banner + `useFormDraft`), §6.7 discard-changes confirm, §6.8 unconfirmed-email banner, §8.1 A1–A9, §8.4.
- ARCHITECTURE §3.1 endpoints as MSW handlers: register, admin/login, confirm-email, resend-confirmation, forgot-password, reset-password, `PATCH /me`, `POST /me/password`, Google start/callback (simulated), plus the `/auth/google/done` route; §4.1 `mapApiErrorToForm` + `lib/error-copy.ts`; §6 auth flows; `VITE_GOOGLE_ENABLED`.
- Contracts: `RegisterBody`, `ConfirmEmailBody/Result`, `ForgotPasswordBody`, `ResetPasswordBody`, `UpdateMeBody`, `ChangePasswordBody` with SPEC copy.
- DevPanel "Last email link" shows the confirmation/reset link.

## Out of scope
- Real email delivery, rate limiting, Google OAuth (M15). The mock simulates "Continue with Google" through the MSW-only route `POST /api/auth/google/mock` when `isMocked('auth')` (ARCHITECTURE §6.1), signing in a fixture Google user.
- Onboarding steps behind "I offer services" (M11) — the switch navigates to `/become-a-provider/{step}`, which is a placeholder until M11.

## Acceptance criteria
1. At 1440px and 390px: on `/signup`, submitting empty shows `Enter your full name.`, `Enter your email address.`, `Use at least 8 characters with a letter and a number.` under the fields with focus on the first; `olivia@fixit.test` shows `This email already has an account.` + `Log in instead`.
2. Sign up a new email → S7 shows the email; `Resend email` → toast `Email sent again.` and the button reads `Resend in 0:59`… counting down. DevPanel "Last email link" → S8 `Email confirmed` → `Continue` goes to `/`. With `?intent=provider` it goes to `/become-a-provider/1`. Reopening the link → `Your email is already confirmed`; a tampered token → `This link has expired`.
3. Log in with a wrong password → banner `That email and password don't match. Try again or reset your password.` Log in as Olivia → `/`; as Marcus → `/dashboard`; from `/login?next=/requests` → `/requests`. Log in as Nimal (unconfirmed) → home with the unconfirmed-email banner under the nav containing a resend action.
4. A suspended fixture account (or DevPanel forced `ACCOUNT_SUSPENDED`) → `Your account is suspended. If you think this is a mistake, email us at hello@fixit.test.`
5. `/forgot-password` → `Send reset link` → sent state `If an account exists for {email}…` for both existing and unknown emails. Reset link → S10: mismatched confirm shows `Passwords don't match.`; success → `/login` + toast `Password updated. Log in with your new password.`; the old password no longer works. Expired token → `This reset link has expired`.
6. `/account` as Olivia at 1440px and 390px: change name and mobile `077 123 4567` → toast `Changes saved.` and the nav avatar initials update; invalid mobile shows the S12 message; Marcus clearing his mobile → `Providers need a mobile number — customers use it after you accept.`; wrong current password → `Current password is incorrect.`; a Google-only fixture user sees `You sign in with Google.` "I offer services": Olivia's switch is off and turning it on goes to `/become-a-provider/1`; Marcus's is on and disabled with `You're listed as Bell & Sons.`
7. `/admin/login` (no link to it anywhere in the public UI): Olivia's credentials → `That email and password don't match.`; admin → `/admin`. No Google button, no sign-up link.
8. Session expiry: DevPanel forced 401 on refresh while filling S18 → redirect to `/login?next=/account` with `Your session expired. Log in again to continue.`; after login the typed name is restored (password fields are not).
9. Loading/error: S8 shows its skeleton while confirming; any auth form shows `Logging in…`/`Creating account…`/`Saving…` and is disabled while submitting; forced 500 shows the §6.3 form banner. Signed-in user opening `/login`, `/signup` or `/forgot-password` is redirected away (wrong-role check).
10. Vitest: form schemas show SPEC copy; server `fieldErrors` map onto fields; `next` must be same-site (an absolute `https://evil.test` `next` is ignored).

## Notes for the planner
- Validation copy lives in contracts schemas; form-level banner copy in `lib/error-copy.ts` keyed by `RuleCode` / `ErrorCode` (written once).
- Google button is shown only when `VITE_GOOGLE_ENABLED=true`; in mock mode set it on in `.env.development` so it can be demoed.
- `/auth/google/done` is a technical route: refresh → go to `next`.
- Admin logout → `/admin/login`.
- S5.E2 context banner needs the provider name from `next=/providers/{id}/request`; the provider lookup handler arrives in M07, so render the banner only if the name is available (no new endpoint here).
