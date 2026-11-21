# M25 — F-36 Admin metrics
Phase: E   Depends on: M24   Est: 1 day
Mock domains after this milestone: none (MSW handler updated so `pnpm dev:mock` keeps working)

## Goal
The admin overview adds a "This month" section: customer and provider totals (by verification state), completion rate, expired share and requests this month by status, each linking to the matching list. Full stack; flag `metrics` turned on.

## Scope
- PRODUCT F-36 (Should, priority 4); BR-50.
- SPEC S30.E3–E7 (4 tiles + "Requests this month" card with status rows and total), phone 2×2.
- ARCHITECTURE §3.6 `GET /admin/overview` metrics part (`AdminOverview`); month boundaries in Asia/Colombo via contracts date helpers and the injected clock.

## Out of scope
- Charts, date-range pickers, exports.

## Acceptance criteria
1. The authorization matrix row for `GET /admin/overview` still passes.
2. At 1440px as Admin (real data and `pnpm dev:mock`): `/admin` shows the Needs-attention tiles plus Customers, Providers (`{v} verified · {p} in review · {u} not submitted`), Completion rate (`{82%}` / `of accepted jobs this month`), Expired requests (`{9%}` / `of new requests this month`) and the Requests this month card with one row per status and a Total.
3. Integration test with FakeClock and a known world: numbers equal BR-50 definitions (completion = Completed ÷ Accepted-or-later this month; expired share = Expired ÷ Pending created this month); a request created 23:59 on the last day of the month (Colombo) counts in that month. No data → `—`.
4. Tiles link to `/admin/users?role=customer|provider`; each status row links to `/admin/requests?status={s}` (M23 list).
5. At 390px tiles are 2×2 and the card full width; no horizontal scroll. Loading skeletons; forced 500 → section error while the attention tiles still render if already loaded.

## Notes for the planner
- If M23 was cut, render status rows without links (flag check) rather than linking to a hidden page.
