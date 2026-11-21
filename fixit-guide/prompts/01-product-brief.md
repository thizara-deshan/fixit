# Prompt 01 — Product brief (brainstorm)

> **Setup** · run once · **Model:** Opus 5.5 · new session · **interactive, ~30–60 min**
> **Inputs:** `reference/prototype/unpacked/*`, `reference/screens/*.png`, your answers
> **Output:** `docs/PRODUCT.md`

## When to use
First step. The prototype shows a slice of Fixit: the customer browsing side and a
single provider dashboard. It doesn't show sign-up, the booking form, the customer's
own area, provider service management, or anything a super admin does. This prompt
turns the idea plus the prototype into a **product brief**: who the users are, what each
can do, the booking lifecycle, and the business rules. It decides *what* we build, and
prompt 02 decides *how it looks*.

This prompt is a conversation. Claude asks questions in rounds. Answer them, or reply
"your call", and it records its recommendation as `[ASSUMED]`.

## Variables
```
{{V1_DECISIONS}}  — already decided. Default:
                    "Solo dev, ~5–6 weeks. Booking = request → provider accepts/declines →
                     provider marks complete → customer reviews. No online payments, no
                     availability calendar, no chat, no Google sign-in in v1.
                     Roles: customer, provider, super admin."
{{MARKET}}        — where Fixit operates: city/region, currency, language
                    (the prototype uses Austin metro, TX, USD — keep or replace)
{{EXTRA_NOTES}}   — anything else you already know (or "none")
```

## The prompt
````text
You are a senior product manager running a product-definition session for
"Fixit", a home-service booking marketplace: customers find local service
providers (plumbers, electricians, cleaners…) and request a job; providers
list the services they offer and accept or decline requests; a super admin
oversees everything.

### Inputs
- `reference/prototype/unpacked/` — markup.html, logic.js, data.json of a
  clickable prototype made in Claude Design. Read logic.js closely: it holds
  the real behavior (search matching, filters, sorting, status changes, undo).
- `reference/screens/*.png` — the prototype's routes at desktop and phone width.
- Decided already: {{V1_DECISIONS}}
- Market: {{MARKET}}. Notes: {{EXTRA_NOTES}}

Ignore prototype-only artifacts: the "coming in the next milestone" modals,
the "Sample requests — prototype" badge, the hardcoded date, the fake
distance formula, "University project prototype" footer copy.

### Process — run it as rounds, STOP after each round for my answers
**Round 1 — What the prototype already says.** Summarize, briefly:
 - the screens and what each role can do in them today
 - the implicit rules in logic.js (e.g. category matching from free text,
   price ≥ 300 shown as a flat price, rating filter steps, status set)
 - everything a button promises but doesn't deliver (Log in, Sign up,
   Request Service, Save, My requests, Get verified, Edit services, the 5
   unbuilt dashboard nav items…)
Then ask me 5–8 questions about the biggest unknowns. Each question must have
your recommended answer and 1–2 alternatives.

**Round 2 — Roles & journeys.** For each role (Guest, Customer, Provider,
Super admin) propose the end-to-end journeys as short numbered steps:
 - Customer: sign up → search → compare → request → track → cancel? → review
 - Provider: sign up → onboarding (business details, category, services &
   prices, service areas, photo) → submit verification → receive requests →
   accept/decline → complete → reply to reviews?
 - Admin: verify providers, manage categories & locations, manage users
   (suspend/reactivate), oversee requests, moderate reviews, see metrics
 Ask about the edge cases each journey raises. Examples: can an unverified
 provider receive requests? Can one person be both customer and provider? Can a
 provider offer more than one category? Who can cancel, and until when? What
 happens to pending requests when a provider is suspended?

**Round 3 — Booking lifecycle & rules.** Propose:
 - the request state machine as a table | From | To | Who | Condition |
   Side effects (notification, counters) |. Start from the prototype's
   Pending/Accepted/Declined/Completed and decide on Cancelled (by customer),
   Expired (no reply in N days?), and whether "Completed" needs the customer
   to confirm.
 - what a request contains (service, preferred date, time slot
   Morning/Afternoon/Evening as in the prototype, address, description,
   photos?, contact phone?) and what the provider sees before/after accepting
   (privacy: show full address only after accept?)
 - pricing: "starting at" per service + unit (hour / job / fixed); the
   final price is confirmed by the provider (prototype copy). Do we record a
   quoted/final price on the request?
 - reviews: only after Completed, one per request, editable?, provider reply?
 - verification: what the provider uploads, what the admin checks, what
   "Verified" unlocks, re-verification on change
 - notifications in v1: in-app only, email only, or both. Which events
 Ask me what you can't decide.

**Round 4 — Scope cut.** Present a MoSCoW table of every feature found so far
| ID | Feature | Role | MoSCoW | Notes |, sized for {{V1_DECISIONS}}.
Must-haves must fit the timeline. Ask me to confirm or move items.

### Output — `docs/PRODUCT.md` (after round 4 is approved)
Sections:
1 Vision & one-line pitch
2 Market & assumptions (region, currency, language, time zone)
3 Roles & permissions — a matrix | Capability | Guest | Customer | Provider | Admin |
4 Journeys per role (numbered steps, with feature IDs)
5 Feature list (MoSCoW table, IDs F-01…; v1 = Must + agreed Shoulds)
6 Booking lifecycle — state machine table + request fields + privacy rules
7 Business rules — numbered BR-01…: search & ranking, pricing display,
  verification, reviews, cancellation, suspension effects, limits
8 Notifications — event → recipient → channel
9 Out of scope for v1 (and why) + "later" ideas
10 Decisions log — every question you asked, my answer, or `[ASSUMED]` + your default
11 Open questions (should be empty or explicitly deferred)

### Rules
- Product language only: no libraries, endpoints, or table names. That's
  prompt 03.
- Every capability in the roles matrix must trace to a feature ID, and every
  feature must have an owning role.
- Prefer the simplest rule that's fair to both sides. A solo dev must build and
  test every rule.
- Mark anything I didn't confirm `[ASSUMED]`.
````

## Gate checklist
- [ ] The state machine covers every status, and each transition has an actor
- [ ] The roles matrix answers "can X do Y" for every screen action in the prototype
- [ ] What the super admin does is concrete (not just "oversees everything")
- [ ] The v1 Must list looks achievable in ~3 weeks of frontend + backend work
- [ ] Commit: `git add docs/PRODUCT.md && git commit -m "docs: PRODUCT brief"`
