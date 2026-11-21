# M21 — E2E golden journeys & hardening
Phase: D   Depends on: M20   Est: 1½ days
Mock domains after this milestone: none

## Goal
Prove the core loop end to end for all three roles with Playwright against the built web and the real API, at phone and desktop sizes, and close the remaining production-readiness gaps: security headers, rate-limit coverage, error pages, accessibility checks and a performance pass on the public pages.

## Scope
- PRODUCT §1 v1 success statement; F-38.
- ARCHITECTURE §9.5 Playwright (customer journey at 390, provider journey at 1440, admin journey at 1440 + queue at 390, smoke over every static route at 390 and 1440 with no horizontal scroll and no console errors), `e2e/helpers` (`mailpit.ts`, `login.ts`), e2e env (`vite preview` :4173 + API :3001 on `fixit_e2e`, reset + seed in `globalSetup`); §6.3 helmet/CSP, body limits, throttler coverage for every RL route in §3; §5.1 lazy chunks per area.
- SPEC §9 accessibility & quality bar (focus order, labels, 44px targets, reduced motion, contrast tokens), §6.1–§6.4 states spot-check, S39–S41 in production build.

## Out of scope
- Deploying (M22). Should features (Phase E). New features or refactors — only fixes for defects the journeys reveal (each with a failing test first).

## Acceptance criteria
1. `pnpm e2e` passes locally: (1) customer — guest searches "plumb" + Dehiwala-Mount Lavinia → 4.5+ & verified → profile → Request Service → log in as Olivia → back on S12 → submit → S13 → My requests shows Pending; then reviews the seeded completed request and the profile rating/count change (390px). (2) provider — sign up → confirm via the Mailpit link → 5-step onboarding → "Not yet verified" listing → upload NIC front/back → Pending review; as Marcus accept a pending request with an agreed price → customer contact visible; complete the accepted-today request (1440px). (3) admin — approve the journey-2 provider → Verified badge public; suspend p08 → its customer sees Declined "Provider unavailable" and the profile 404s; hide a review → rating changes (1440px, queue at 390px).
2. Smoke: every static route at 390 and 1440 renders its H1, `scrollWidth <= innerWidth`, no console errors.
3. Response headers on `/api/*` include helmet defaults and a strict CSP; a 200 kB JSON body → 413; every RL endpoint in §3 returns 429 past its limit (integration tests).
4. Production build: MSW absent; public routes load only the `entry` + `public` chunks (no `admin`/`provider` code on `/`); Lighthouse (mobile, local `vite preview`) on `/`, `/discover`, `/providers/p01` scores ≥ 90 Performance and ≥ 95 Accessibility, or the gaps are listed in the review with a decision.
5. Keyboard-only: each journey's main path is completable with Tab/Enter/Space/Esc; focus is visible everywhere; dialogs trap and return focus; `prefers-reduced-motion` removes slide animations.
6. Forcing an API 500 in the e2e build shows S41 with an `Error ID` equal to the response `x-request-id`.

## Notes for the planner
- Journeys rely on the fixtures listed in ARCHITECTURE §8.3 (accepted-today, completed-in-window, p02 pending_review, p08). Don't add fixtures without updating that section via a decision record.
- E2E is not part of `pnpm verify`; it runs here and in each later backend-touching review.
- Any defect found is fixed with a regression test in the right layer, not only in Playwright.
