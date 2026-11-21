# M08 — Request form & confirmation
Phase: B   Depends on: M07   Est: 1 day
Mock domains after this milestone: all

## Goal
A signed-in customer can send one request to one provider for one listed service, with date, slot, town, address and description, and sees a confirmation with the reference and reply deadline. Every blocking rule (own listing, paused, unconfirmed email, limits, date window, town not served) is enforced by the shared contracts function and shown with SPEC copy.

## Scope
- PRODUCT F-11, F-14, F-04, F-03 (inline mobile); §6.2 request fields; BR-11, BR-16, BR-23, BR-31 (expiresAt shown), BR-33, BR-34.
- SPEC S12 (layouts, blocked states table, E1–E7, field table), S13 Request sent, §6.7 discard confirm, §8.1 A11.
- ARCHITECTURE §2.5 `CreateRequestBody` + `makeCreateRequestSchema(now)`, §2.8 `checkCreateRequest()` (+ one test per RuleCode in S12 order), `expiresAt`, `RequestRecord`, `toCustomerView()` projection + test; §3.4 `POST /me/requests`, `GET /me/requests/:ref` MSW handlers; §7.5 ref format `FX-####` (mock `refSeq`).

## Out of scope
- My requests list and the full S15 detail (M09) — `View request` can link to a placeholder detail.
- Request photos (F-39, Backlog). Emails (M18).

## Acceptance criteria
1. At 1440px as Olivia, `/providers/p03/request` (no open request): back link `Back to {Business}`, form card + sticky summary card (provider mini row, selected service and price, BR-11 note, "What happens next" with 3 lines). Service radio cards show each listed service with its price label; Town select lists only the provider's areas (base first) and is prefilled from the last Discover `loc` if served.
2. Submitting empty shows `Choose a service.`, `Choose a date.`, `Choose a time slot.`, `Choose your town.`, `Enter your address.`, `Describe the job in at least 20 characters.`; focus moves to the first. The date picker allows tomorrow … today+60 (Colombo) only; an out-of-range date shows `Choose a date from {tomorrow} to {max}.` The description counter reads `{n} / 1,000`.
3. Valid submit → button `Sending…` → `/requests/FX-####/sent` showing `Request sent to {Business}`, the reply deadline (`{Sat, 21 Nov, 3:42 PM}` = min(72 h, 00:00 preferred date)), reference in mono, service, date · slot, town, Pending pill; `View request` and `Back to search` work.
4. A customer without a mobile sees a `+94` mobile input; `077 123 4567` is accepted and afterwards appears in `/account`. A customer with a mobile sees `Your mobile: +94 77 123 4567` + `Change`.
5. Blocked states replace the form card: Marcus on his own listing → `You can't request your own listing`; paused provider → `{Business} isn't taking new requests right now` + `Find another provider`; Nimal (unconfirmed) → `Confirm your email first` + `Resend email`; existing open request → `View request`; 5 open → `Go to my requests`; unknown/suspended provider → S39 provider variant. Admin → S40; guest → `/login?next=…`.
6. Server-side race: DevPanel forces `RULE_VIOLATION provider_paused` on submit → banner `{Business} can't take requests right now. Your request wasn't sent.` and the form keeps its values.
7. At 390px: compact provider row, full-width service cards, 3-column 48-high slot control, "What happens next" below the form, sticky `Send request` bar; no horizontal scroll. Leaving a dirty form (`Cancel` or back) asks `Discard this request?`.
8. Loading: form skeleton while provider + eligibility load; forced 500 on submit shows the §6.3 form banner and keeps values. Opening S13 for a request that's no longer Pending redirects to S15; another customer's ref → S39 request variant.

## Notes for the planner
- The form uses `zodResolver(makeCreateRequestSchema(now))`; the mock handler calls `checkCreateRequest()` with the same inputs the API will gather under a row lock — no rule duplicated in the form.
- `mobile_missing` is not a block (S12 asks inline); the handler saves the mobile onto the user.
- The mock bumps the provider's pending count so the L3 badge reflects it after switching to Marcus.
- Store `RequestRecord` in the mock db and project with `toCustomerView` so privacy logic exists once (D18).
