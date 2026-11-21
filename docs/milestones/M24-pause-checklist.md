# M24 — F-22 Pause switch & F-21 completeness checklist
Phase: E   Depends on: M23   Est: 1 day
Mock domains after this milestone: none (MSW handlers added so `pnpm dev:mock` keeps working)

## Goal
Busy providers can pause new requests from the dashboard header or Settings; their profile stays listed with "Not taking requests" and Request Service is disabled until they resume. The dashboard shows a profile-completeness checklist that links to whatever is missing. Full stack; flags `pause` and `checklist` turned on.

## Scope
- PRODUCT F-22 (Should, priority 2), F-21 (Should, priority 3); BR-15.
- SPEC S20.E4 availability switch (desktop header; phone full-width row), S20.E15 Profile completeness (5 checks, %, todo links `Add` / `Verify` / `Fix`, `In review`), S28 Provider settings (Availability, Account, Emails cards), L3 Settings nav item, §6.5 optimistic pause with revert, §6.8 paused banner if listed there, §8.1 A28; S2/S3/S12 paused displays (already built) now driven by real toggles.
- ARCHITECTURE §3.3 `PUT /me/provider/pause` (`PauseBody`), `GET /me/provider/dashboard` checklist field; `checkCreateRequest` `provider_paused` already enforced (M18).

## Out of scope
- Scheduling a pause, auto-resume.

## Acceptance criteria
1. The authorization matrix row for `PUT /me/provider/pause` passes; the dashboard row's privacy probe still passes with the checklist.
2. At 1440px as Marcus (real data and `pnpm dev:mock`): the S20 header switch reads `Taking requests`; turning it off flips instantly to `Paused` (warning text) with toast `You're not taking new requests.`; the public profile shows `Not taking requests` and a disabled Request Service with `Bell & Sons isn't taking new requests right now.`; Discover cards show the pill; S12 shows the paused blocked state; a direct `POST /me/requests` → 422 `provider_paused`. Existing requests are unaffected. Resume → toast `You're taking requests again.`
3. Forced failure on the toggle reverts the switch and shows an error toast.
4. `/dashboard/settings`: Availability switch mirrors the header with the on/off help copy; Account card links to `/account`; Emails card text.
5. Profile completeness for Hank (not submitted, no photo): the percentage of the 5 checks done, `ID verified` with `Verify` → `/dashboard/verification`, `Profile photo` with `Add` → `/dashboard/profile#photo`; after submitting documents it shows `In review` with no link; a rejected provider sees `Fix`.
6. At 390px: full-width availability row (48 high) under the header, completeness card stacked; S28 cards full width; no horizontal scroll. Loading skeleton for the checklist card; forced 500 → section error.
7. S18 for providers shows the pause hint linking to settings (copy already in SPEC S18.E3).

## Notes for the planner
- Pause is optimistic (SPEC §6.5); use `lib/optimistic.ts`. Invalidate `catalog` provider queries and eligibility after success.
- The checklist is computed server-side in the dashboard endpoint (and in the mock) — no client-side rule logic.
