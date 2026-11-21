# Prompt 07 — Review & verify a milestone

> **Build loop** · once per milestone, after 06 finishes · **Model:** Opus 5.5 · new session
> **Inputs:** milestone, plan, `git diff mxx-start`, screens, running app
> **Output:** `docs/reviews/REVIEW-Mxx.md` + fix tasks appended to the plan

## When to use
When every task in the plan is ticked. A milestone is done when its acceptance
criteria are shown working in the running app, and the executor saying "done"
doesn't count.

## Variables
```
{{MILESTONE}}  — docs/milestones/M06-booking-customer.md
{{PLAN}}       — docs/plans/PLAN-M06-booking-customer.md
{{START_TAG}}  — m06-start
```

## The prompt
````text
You are a strict reviewer verifying a milestone before it is accepted.

### Inputs
`{{MILESTONE}}`, `{{PLAN}}`, `CLAUDE.md`, `docs/PRODUCT.md`, `docs/SPEC.md`,
and the diff `git diff {{START_TAG}}..HEAD`.

### Process
1. Run Verify-all (typecheck, lint, unit + integration tests, build).
   Report the results.
2. Check each acceptance criterion: PASS / FAIL / CAN'T VERIFY, with evidence.
3. UI milestones: start the app in the mode the milestone specifies
   (mock domains), use Playwright (a small script under `tools/` or
   `pnpm exec playwright`) to take screenshots of each affected route at
   1440x900 AND 390x844, logged in as each relevant role. Compare against
   `reference/screens/` (PROTOTYPE screens) or the SPEC description
   (INFERRED screens). List visible differences: layout, spacing, color,
   type, copy, missing states. At 390px, check: no horizontal scroll,
   everything reachable, targets ≥ 44px. Force loading, empty and error
   states (MSW latency/error switches) and check that they render.
   Check that a wrong role gets the 403/redirect.
4. Backend milestones:
   - Run the authorization matrix. Confirm every endpoint added in the
     diff has rows for anon, customer, provider, other provider, and admin.
   - Try at least 3 hostile requests by hand (curl/Supertest): another
     user's id in the path, a forbidden status transition, an extra field
     in the body (e.g. `role`, `verified`, `rating`). They must be rejected.
   - Confirm the domain is off in VITE_MOCK_DOMAINS and the frontend
     criteria pass on real data.
5. Code review of the diff. Look only for: missing zod at a boundary,
   Prisma types leaking into responses, status changes bypassing the state
   machine, missing ownership checks, raw hex / off-token styles, duplicated
   components that should reuse existing ones, MSW handlers drifting from
   contracts, logic without tests, secrets in code, N+1 queries on list
   endpoints, imports from reference/.
6. Classify each finding: MUST-FIX (blocks acceptance) or LATER.

### Output
- `docs/reviews/REVIEW-Mxx.md`: verify results, criteria table, visual
  diff list, security checks, findings.
- Append to `{{PLAN}}` a section `## Fix tasks (review N)` with each MUST-FIX
  as a task in the plan format (Files / Do / Verify / Commit), concrete
  enough for the executor.
- LATER items go to `docs/milestones/M00-index.md` under "Backlog".

### Gate
Summarize: PASS/FAIL per criterion, number of fix tasks. STOP.
````

## After the review
- Fix tasks present → run **06** (Sonnet) on the same plan, then run 07 again (ideally once).
- All PASS → update the status in `M00-index.md`, `git tag mxx-done`, next milestone.
- **Frontend complete gate (after M09):** run `pnpm dev --host`. For 15 minutes, use the app
  as each role in turn, on your phone (same Wi-Fi) and on desktop: a customer books, the
  provider accepts and completes, the customer reviews, and the admin verifies a new
  provider. Write anything that feels wrong into "Ideas inbox", then triage it with 08
  before starting Phase C. **This is the cheapest moment to change the product.**
- **Backend complete gate (after M15):** repeat the same walk with `VITE_MOCK_DOMAINS=none`.
