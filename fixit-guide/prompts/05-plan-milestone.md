# Prompt 05 — Plan a milestone

> **Build loop** · once per milestone · **Model:** Opus 5.5 · new session
> **Inputs:** one milestone file, PRODUCT, SPEC, ARCHITECTURE, CLAUDE.md, current code
> **Output:** `docs/plans/PLAN-Mxx-<slug>.md`

## When to use
Before building each milestone (including `Fxx` and `Cxx`). This is the most
important Opus step, because the plan has to leave Sonnet nothing to decide.

## Variables
```
{{MILESTONE}}  — e.g. docs/milestones/M06-booking-customer.md
```

## The prompt
````text
You are a senior engineer writing an implementation plan that a less capable
model will execute literally, task by task, without asking questions.

### Inputs
- Milestone: `{{MILESTONE}}`
- `docs/PRODUCT.md` and `docs/SPEC.md`: only the referenced sections, plus
  design tokens, cross-cutting states and the state machine
- `docs/ARCHITECTURE.md`, `CLAUDE.md`
- If it is an Fxx milestone: its `docs/features/FEAT-*.md`
- The current codebase. Read it so you reuse existing components, hooks,
  schemas, handlers, guards and patterns instead of inventing parallel ones.
- If the milestone touches a PROTOTYPE screen: the matching images in
  `reference/screens/` and the section of `reference/prototype/unpacked/
  source.html`. Look at them directly.

### Plan format
```
# PLAN-Mxx — Title
Milestone: … · Start tag: mxx-start · Verify-all: <command from CLAUDE.md>
Mock domains at start → end: …

## File map
| File | Create/Modify | Responsibility |

## Tasks
### T1 — <one behavior or one component>
- [ ] done
**Files:** exact paths
**Context:** PRODUCT/SPEC refs (F-xx, BR-xx, S4.E2); screenshot region
  (e.g. "03-discover-all-desktop.png, left filter column"); existing code to reuse
**Do:**
  numbered steps. Give FULL code for: zod schemas, types, state machine
  changes, hooks, query keys, MSW handlers, http/auth logic, NestJS guards,
  services, Prisma schema/migrations, tricky layout. For straightforward
  markup, give the component skeleton with props, the token/class names to
  use, and every state that must render.
**Test:** (logic tasks) test file and cases, full code
**Verify:** exact command(s) + what success looks like
**Commit:** `git commit -m "feat(web): …"`

## Checkpoints
After T<n>: "Human: run `pnpm dev`, open /discover at 1440 and 390, compare with 03-discover-all-desktop.png"

## Blockers
(executor writes here; leave empty)
```

### Rules
- Order: contracts → (api: prisma → service → controller → matrix rows) →
  (web: mocks → hooks → shared components → screens → wiring) → acceptance task.
- One task = one behavior/component, ~5–15 minutes for the executor. Split
  anything containing "and".
- No vague steps ("handle errors appropriately", "style as in design"). Say
  exactly which state, which token, which copy, which error message.
- UI tasks name every state: default, loading, empty, error, submitting,
  optimistic/undo, forbidden. They also give the 390px layout as exact
  Tailwind classes, not only the desktop one.
- Forms: field list with the contract schema used and the exact messages.
- Frontend milestones: every endpoint the UI calls must exist as an MSW
  handler that validates with contracts and enforces role/ownership +
  the state machine, like the real API will.
- Backend milestones:
  * every endpoint task includes `@Roles`, the ownership check in the
    service, and its rows in the authorization matrix test (anon,
    customer, provider, other provider, admin → expected status);
  * status changes go through the contracts state machine, in a transaction;
  * the last tasks remove the domain from `VITE_MOCK_DOMAINS` defaults and
    re-run the matching frontend acceptance criteria against the real API;
  * keep the MSW handlers (still used for frontend tests) unless the
    milestone says otherwise.
- Tokens only. Never raw hex or arbitrary color values in components.
- Final task: walk every acceptance criterion of the milestone, with the
  command or manual check for each.
- Don't add scope beyond the milestone. Put "nice-to-haves" in a short list at
  the end without making them tasks.

### Gate
Write the plan file, then summarize: task count, risky tasks, anything
in the milestone you think is wrong. STOP.
````

## Gate checklist (read the plan, ~5–10 min)
- [ ] Task order is sane, and contracts/schemas come before their consumers
- [ ] Hard logic has full code. No "appropriately" or "as needed"
- [ ] UI tasks list all states, point to a screenshot or SPEC section, and give the 390px layout
- [ ] Backend tasks have roles + ownership + matrix rows for every endpoint
- [ ] Commit: `git add docs/plans && git commit -m "docs: PLAN-Mxx"`
