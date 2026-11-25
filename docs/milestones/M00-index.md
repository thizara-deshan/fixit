# M00 — Milestone index

Status: approved 2026-11-22 · Inputs: `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`.

Gate decisions (2026-11-22):
- Split approved as below. Should features (F-21–F-24, F-34–F-36) are isolated in **Phase E**, full-stack, in PRODUCT §5 priority order, after the Must build ships. Each Phase E milestone can be cut on its own.
- F-10 Saved providers (Could), F-39 and F-40 (Could) are not scheduled → Backlog.
- Budget accepted: **Must (M01–M22) = 28½ build days** (~5.7 weeks). Phase E = 5½ days. Everything = 34 days (~6.8 weeks), inside PRODUCT's 6–8 week constraint. If time slips, Phase E milestones are dropped from the bottom (M27 first).
- Fxx / Cxx ids are reserved for prompts 08 (features) / 09 (changes).

## Milestones

| ID | Title | Phase | Depends on | Est | Status |
|---|---|---|---|---|---|
| [M01](M01-foundation.md) | Foundation | A | — | 1 | Done |
| [M02](M02-data-layer-mocks.md) | Data layer & mock backend | A | M01 | 1½ | Done |
| [M03](M03-app-shell.md) | App shell, layouts & shared states | A | M02 | 1½ | Done |
| [M04](M04-auth-account-screens.md) | Auth & account screens | B | M03 | 1½ | Done |
| [M05](M05-home-site-pages.md) | Home & site pages | B | M03 | 1 | Not started |
| [M06](M06-discover.md) | Discover | B | M05 | 1½ | Not started |
| [M07](M07-provider-profile.md) | Provider public profile | B | M04, M06 | 1 | Not started |
| [M08](M08-request-form.md) | Request form & confirmation | B | M07 | 1 | Not started |
| [M09](M09-my-requests-reviews.md) | My requests, cancel & leave a review | B | M08 | 1½ | Not started |
| [M10](M10-provider-requests.md) | Provider overview & requests | B | M08 | 1½ | Not started |
| [M11](M11-onboarding-verification.md) | Onboarding & verification | B | M10 | 1½ | Not started |
| [M12](M12-provider-business.md) | Provider business: services, profile, areas | B | M11 | 1 | Not started |
| [M13](M13-admin-console.md) | Admin console (Must) | B | M09, M11 | 1½ | Not started |
| — | **FRONTEND COMPLETE GATE (Must scope, all on MSW)** | | | | |
| [M14](M14-api-foundation.md) | API foundation | C | M13 | 1½ | Not started |
| [M15](M15-auth-api.md) | Auth API → `auth` real | C | M14 | 1½ | Not started |
| [M16](M16-catalog-search-api.md) | Catalog & search API → `catalog` real | C | M15 | 1½ | Not started |
| [M17](M17-provider-listing-api.md) | Provider listing API → `providers` real | C | M16 | 1½ | Not started |
| [M18](M18-requests-api.md) | Requests API, expiry & request emails → `requests` real | C | M17 | 1½ | Not started |
| [M19](M19-reviews-api.md) | Reviews API → `reviews` real | C | M18 | ½ | Not started |
| [M20](M20-admin-api.md) | Admin API → `admin` real (`VITE_MOCK_DOMAINS=none`) | C | M19 | 1½ | Not started |
| [M21](M21-e2e-hardening.md) | E2E golden journeys & hardening | D | M20 | 1½ | Not started |
| [M22](M22-production-deploy.md) | Production deploy | D | M21 | 1 | Not started |
| — | **v1 MUST SHIPPED** | | | | |
| [M23](M23-admin-requests.md) | F-35 All requests & admin cancel | E | M22 | 1 | Not started |
| [M24](M24-pause-checklist.md) | F-22 Pause switch & F-21 completeness checklist | E | M23 | 1 | Not started |
| [M25](M25-admin-metrics.md) | F-36 Admin metrics | E | M24 | 1 | Not started |
| [M26](M26-catalog-admin.md) | F-34 Categories & towns | E | M25 | 1½ | Not started |
| [M27](M27-provider-reviews-replies.md) | F-24 Provider reviews & F-23 replies | E | M26 | 1 | Not started |

Phase E dependencies encode the PRODUCT §5 priority order (F-35, F-22, F-21, F-36, F-34, F-23, F-24); technically each needs only M22.

### Totals
| Phase | Milestones | Days |
|---|---|---|
| A Foundation | M01–M03 | 4 |
| B Frontend (MSW) | M04–M13 | 13 |
| C Backend | M14–M20 | 9 |
| D Ship | M21–M22 | 2½ |
| **Must total** | M01–M22 | **28½** |
| E Should | M23–M27 | 5½ |
| **Grand total** | | **34** |

### Mock domains over time
| After | `VITE_MOCK_DOMAINS` for `pnpm dev` |
|---|---|
| M01–M14 | `all` |
| M15 | `catalog,providers,requests,reviews,admin` |
| M16 | `providers,requests,reviews,admin` |
| M17 | `requests,reviews,admin` |
| M18 | `reviews,admin` |
| M19 | `admin` |
| M20 onward | `none` (`pnpm dev:mock` keeps `all` working) |

## Coverage check

### Features (PRODUCT §5) → milestones
| Feature | MoSCoW | Frontend | Backend |
|---|---|---|---|
| F-01 Email sign-up/in, confirm, reset | Must | M04 | M15 |
| F-02 Google sign-in | Must | M04 | M15 |
| F-03 Account profile, mobile, "I offer services" | Must | M04 (S18), M08 (inline mobile), M11 (step 1 mobile) | M15 |
| F-04 Return to provider after auth | Must | M04, M07, M08 | M15 |
| F-05 Home | Must | M05 | M16 |
| F-06 Search | Must | M05, M06 | M16 |
| F-07 Filters | Must | M06 | M16 |
| F-08 Sort | Must | M06 | M16 |
| F-09 Provider profile | Must | M07 | M16 |
| F-10 Saved providers | Could | — Backlog | — Backlog |
| F-11 Request form | Must | M08 | M18 |
| F-12 My requests list + detail | Must | M09 | M18 |
| F-13 Cancel own request | Must | M09 | M18 |
| F-14 Request limits | Must | M07, M08 | M18 |
| F-15 Onboarding wizard | Must | M05 (S4 entry), M11 | M17 |
| F-16 Verification submit/resubmit | Must | M11 | M17 |
| F-17 Dashboard, list, detail | Must | M10 | M17 (dashboard), M18 (requests) |
| F-18 Accept / Decline | Must | M10 | M18 |
| F-19 Mark completed, agreed price | Must | M10 | M18 |
| F-20 Edit business, services, areas, photo | Must | M12 | M17 |
| F-21 Completeness checklist | Should | M24 | M24 |
| F-22 Pause switch | Should | M24 (display-only `paused` pills built in M06/M07) | M24 |
| F-23 Review reply | Should | M27 | M27 |
| F-24 Dashboard reviews | Should | M27 | M27 |
| F-25 Automatic expiry | Must | M09, M10 (Expired display; mock sweep M02) | M18 |
| F-26 Email notifications | Must | — (no screen) | M15 (auth), M17 (re-verification), M18 (requests), M20 (verification, suspension); M23 (admin cancel) |
| F-27 Contact reveal / hide | Must | M09, M10 | M18 |
| F-28 Write a review | Must | M09 | M19 |
| F-29 Rating aggregation, "New" | Must | M05, M06, M07, M10 | M16 (read), M19 (recompute on post), M20 (recompute on hide/restore) |
| F-30 Admin sign-in | Must | M04 | M15 |
| F-31 Verification queue | Must | M13 | M20 |
| F-32 Suspend / reactivate | Must | M13 | M20 |
| F-33 Hide / restore reviews | Must | M13 | M20 |
| F-34 Categories & towns | Should | M26 | M26 |
| F-35 All requests + admin cancel | Should | M23 | M23 |
| F-36 Metrics | Should | M25 | M25 |
| F-37 About / Contact / Privacy | Must | M05 (Privacy copy needed by M22) | — (static) |
| F-38 Responsive | Must | every UI milestone; M21 smoke | — |
| F-39 Request photos | Could | — Backlog | — Backlog |
| F-40 Self-service deletion | Could | — Backlog | — Backlog |
| F-41 – F-52 | Won't | — | — |

### Screens (SPEC §4.1) → milestones
| Screen | Frontend | Backend |
|---|---|---|
| S1 Home | M05 | M16 |
| S2 Discover | M06 | M16 |
| S3 Provider profile | M07 (+ M24 paused toggle source, M27 reply display) | M16 (+ M18 eligibility) |
| S4 For providers | M05 | M15 (role from `/auth/me`) |
| S5 Log in | M04 | M15 |
| S6 Sign up | M04 | M15 |
| S7 Check your email | M04 | M15 |
| S8 Confirm email | M04 | M15 |
| S9 Forgot password | M04 | M15 |
| S10 Reset password | M04 | M15 |
| S11 About · Contact · Privacy | M05 | — (static) |
| S12 Request form | M08 | M18 |
| S13 Request sent | M08 | M18 |
| S14 My requests | M09 | M18 |
| S15 Request detail (customer) | M09 | M18 (+ M19 review block) |
| S16 Leave a review | M09 | M19 |
| S17 Saved providers | — Backlog (F-10) | — Backlog |
| S18 Account settings | M04 | M15 |
| S19 Become a provider | M11 | M17 |
| S20 Provider overview | M10 (+ M24 toggle & checklist) | M17 (dashboard) + M18 (requests) |
| S21 Provider requests | M10 | M18 |
| S22 Request detail (provider) | M10 | M18 |
| S23 My Services | M12 | M17 |
| S24 Business profile | M12 | M17 |
| S25 Service areas | M12 | M17 |
| S26 Verification | M11 | M17 |
| S27 Reviews (provider) | M27 | M27 |
| S28 Provider settings | M24 | M24 |
| S29 Admin sign-in | M04 | M15 |
| S30 Admin overview | M13 (Needs attention) + M25 (metrics) | M20 + M25 |
| S31 Verification queue | M13 | M20 |
| S32 Verification review | M13 | M20 |
| S33 Users | M13 | M20 |
| S34 User detail | M13 | M20 |
| S35 All requests | M23 | M23 |
| S36 Request detail (admin) | M23 | M23 |
| S37 Reviews moderation | M13 | M20 |
| S38 Categories & towns | M26 | M26 |
| S39 Not found | M03 | every backend milestone returns the 404s |
| S40 No access | M03 | M15 (roles), matrix in M14–M20 |
| S41 Something went wrong | M03 | M14 (error envelope) |

### Endpoints (ARCHITECTURE §3) → milestones
Frontend milestone = the MSW handler is written; backend milestone = the Nest route + matrix rows.

| Domain | Endpoint(s) | MSW | API |
|---|---|---|---|
| auth | POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me | M02 | M15 |
| auth | POST /auth/register, POST /auth/admin/login, POST /auth/confirm-email, POST /auth/resend-confirmation, POST /auth/forgot-password, POST /auth/reset-password, PATCH /me, POST /me/password | M04 | M15 |
| auth | GET /auth/google, GET /auth/google/callback | M04 (simulated) | M15 |
| catalog | GET /catalog, GET /providers/featured | M05 | M16 |
| catalog | GET /providers | M06 | M16 |
| catalog | GET /providers/:id, GET /providers/:id/reviews | M07 | M16 |
| catalog | GET/PUT/DELETE /me/saved… (3) | — Backlog (F-10) | — Backlog |
| providers | GET /me/provider, PUT /me/provider/onboarding/:step, POST /me/provider/publish, PUT/DELETE /me/provider/photo, GET /me/provider/verification, POST/DELETE /me/provider/verification/documents…, POST /me/provider/verification/submit, GET /files/documents/:id, GET /files/photos/:key | M11 | M17 |
| providers | GET /me/provider/dashboard | M10 | M17 |
| providers | PATCH /me/provider/business, POST/PATCH/DELETE /me/provider/services…, PUT /me/provider/areas | M12 | M17 |
| providers | PUT /me/provider/pause | M24 | M24 |
| requests | GET /me/request-eligibility/:providerId | M07 | M18 |
| requests | POST /me/requests, GET /me/requests/:ref | M08 | M18 |
| requests | GET /me/requests, POST /me/requests/:ref/cancel | M09 | M18 |
| requests | GET /me/provider/requests, GET /me/provider/requests/:ref, POST …/accept, …/decline, …/complete, PUT …/agreed-price | M10 | M18 |
| requests | expiry job | M02 (`expireDue` sweep) | M18 |
| reviews | POST /me/requests/:ref/review | M09 | M19 |
| reviews | GET /me/provider/reviews, PUT /me/provider/reviews/:id/reply | M27 | M27 |
| admin | GET /admin/overview (attention part) | M13 | M20 |
| admin | GET /admin/overview (metrics part, BR-50) | M25 | M25 |
| admin | GET /admin/verifications, GET /admin/verifications/:id, POST …/approve, POST …/reject | M13 | M20 |
| admin | GET /admin/users, GET /admin/users/:id, POST …/suspend, POST …/reactivate | M13 | M20 |
| admin | GET /admin/reviews, POST …/hide, POST …/restore | M13 | M20 |
| admin | GET /admin/requests, GET /admin/requests/:ref, POST /admin/requests/:ref/cancel | M23 | M23 |
| admin | GET /admin/catalog, POST/PATCH /admin/categories…, POST /admin/categories/reorder, POST/PATCH /admin/districts…, POST/PATCH /admin/towns… | M26 | M26 |
| infra | GET /health | — | M14 |

Nothing in v1 Must/Should scope is unassigned. Only F-10, F-39, F-40 (all Could) are unscheduled.

### Known gaps / inputs needed (not blocking until the milestone named)
| # | Item | Needed by | Owner |
|---|---|---|---|
| 1 | Privacy policy body copy (SPEC §10.2 #15) — S11 must not ship with placeholders | M22 | Product / legal |
| 2 | Hero photo + usage rights (SPEC §10.2 #1) | M22 (placeholder until then) | Team |
| 3 | Public contact email (SPEC §10.2 #2) | M22 (`hello@fixit.test` until then) | Product |
| 4 | Google OAuth client id/secret | M15 to test for real (disabled when unset) | Developer |
| 5 | Domain, SMTP provider account, S3-compatible bucket, Postgres host (ARCHITECTURE §10.2 `[ASSUMED]`) | M22 | Developer |
| 6 | `ProviderDashboard.checklist` and `AdminOverview` metrics must be optional/absent-able so M24/M25 stay cuttable | M10 / M13 planning | Planner (raise a Blocker if the contract can't allow it) |

## Ideas inbox
<!-- One-liners captured during builds. Format: - YYYY-MM-DD (Mxx): idea -->

## Backlog
<!-- LATER items from reviews and deferred scope. -->
- F-10 Saved providers (S17, S3 Save button, `/me/saved` ×3) — Could; flag `savedProviders` stays off.
- F-39 Photos on requests — Could.
- F-40 Self-service account deletion — Could; Contact page covers it.
