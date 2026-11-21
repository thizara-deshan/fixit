# M11 — Onboarding & verification
Phase: B   Depends on: M10   Est: 1½ days
Mock domains after this milestone: all

## Goal
A confirmed customer turns their account into a provider through a five-step wizard (business details, category, services & prices, service areas, photo) that saves a draft at every step, publishes the listing as "Not yet verified", and then uploads NIC front/back (plus optional documents) for review. Rejected providers see the reason and resubmit.

## Scope
- PRODUCT F-15, F-16, F-03 (step 1 mobile); BR-01 (listed after publish), BR-13, BR-14, BR-17, BR-18, BR-23; §6.3 (documents visible only to owner + admins).
- SPEC S19 (stepper, steps 1–5, done screen, email-confirmed gate, resume at saved step, sticky Back/Continue on phone), S26 (status card per state, 4 document slots, privacy note, submit / submit again), §6.7 discard confirm, §6.8 provider banners (verification not submitted / rejected / back in review, as listed there), §8.1 A21, A22, A26, A27, §8.5 verification flow.
- ARCHITECTURE §3.3 `GET /me/provider`, `PUT /me/provider/onboarding/:step`, `POST /me/provider/publish`, `PUT/DELETE /me/provider/photo`, `GET /me/provider/verification`, `POST/DELETE /me/provider/verification/documents…`, `POST /me/provider/verification/submit`, `GET /files/documents/:id`, `GET /files/photos/:key` (MSW; files as in-memory object URLs, ARCHITECTURE §4.3); contracts `OwnProvider`, `OnboardingStep1Body…Step4Body`, `ServiceBody`, `AreasBody`, `VerificationState`, `DocumentMeta`, `UPLOAD_LIMITS`.
- Shared editors built here and reused in M12: services repeater (S23 rules), areas picker (S25 rules), photo uploader (S24.E1/E2 rules).

## Out of scope
- Post-publish editing pages S23–S25 (M12). Admin decision (M13).
- Real file storage and magic-byte checks (M17).

## Acceptance criteria
1. At 1440px as Olivia (confirmed, never started), `/become-a-provider/1`: stepper `Step 1 of 5 · Business details` + 5-segment bar, fields with SPEC errors (`Enter your business name.`, `Tell customers about your business in at least 30 characters.`, `Enter a number from 0 to 60.`), read-only `Owner: Olivia Martinez`. Continue → `Saving…` → step 2.
2. Step 2 radio cards for the 8 categories (2 columns; 1 at 390px) with the one-category note. Step 3 repeater: add up to 20 services (name 2–60 unique, price LKR 100–1,000,000, unit) with live `Shows as` preview; `Add at least one service.` when empty. Step 4: base town + other towns grouped by district, counter `{n} of 9 selected`, unchecked boxes disabled at 9. Step 5: photo upload with type/size/dimension errors from S24.E2, `Skip for now`, `Publish listing` → `Publishing…` → done screen `Your listing is live`.
3. Leaving after step 3 and returning (or opening `/become-a-provider/1`) resumes at step 4 with saved values; Kasun (fixture draft) resumes at step 3. Nimal (unconfirmed) sees `Confirm your email first`; Marcus (published) is redirected to `/dashboard`.
4. After publishing, Olivia is a provider: nav shows `Dashboard`, her listing appears in Discover with `Not yet verified`, and the L3 Verification nav item shows the warning dot.
5. `/dashboard/verification` (Not submitted): `Get the Verified badge`, 4 slots (NIC front/back Required, two Optional), `JPG, PNG or PDF, up to 5 MB`, privacy note. Submit without NIC back → `Upload the back of your NIC.`; a 6 MB file → `File must be 5 MB or smaller.`; a .docx → `Use a JPG, PNG or PDF file.` Upload shows progress + `Cancel`; uploaded shows thumbnail or `FileText`, `Replace` · `Remove`. `Submit for review` → toast `Documents submitted. We'll email you when they're checked.` and status `We're checking your documents` with a read-only list.
6. A rejected fixture provider sees the danger banner `Reason: {reason}` + `Fix the issue below and submit again.`, slots prefilled, button `Submit again`. A verified provider sees `You're verified` + `Verified on {date}`.
7. At 390px: wizard card loses its border, sticky bottom bar `Back` (1/3) / `Continue` (2/3), slots in 1 column, file picker accepts camera; no horizontal scroll. Leaving a dirty step or S26 with picked files asks `Discard changes?`.
8. Loading/error: wizard step skeleton on load; forced 500 on Continue keeps the values and shows the form banner; forced failure on upload shows `Upload failed. Check your connection and try again.` on that slot only.
9. Access: guest → `/become-a-provider/1` redirects to login with `next`; Admin → S40; another provider's document id via `/api/files/documents/:id` → 404 in the mock.

## Notes for the planner
- Each step `PUT` is its own contract body; the mock rejects onboarding writes after publish with `409 already_in_state`.
- `OwnProvider.onboarding.step` drives resume and the `RequireProvider` redirect from M03.
- Mock uploads keep only metadata in the persisted db; after reload a placeholder thumbnail is fine (ARCHITECTURE §4.3).
- Build the three editors as feature components in `provider-business/components/` (or shared `components/` if used by 2+ features) so M12 reuses them without forking.
