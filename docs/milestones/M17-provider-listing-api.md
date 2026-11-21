# M17 — Provider listing API
Phase: C   Depends on: M16   Est: 1½ days
Mock domains after this milestone: `requests,reviews,admin`

## Goal
Providers onboard, publish, edit their business, services, areas and photo, and upload verification documents for real. Uploads are type-checked by content and stored privately; documents are only ever served to their owner or an admin. Derived fields (starting price, search text, verification status) stay consistent in the same transaction as each write.

## Scope
- PRODUCT F-15, F-16, F-17 (dashboard endpoint), F-20; BR-01, BR-09, BR-10, BR-13, BR-14, BR-17, BR-18, BR-21, BR-22, BR-23; §8 email "badge removed for re-verification".
- ARCHITECTURE §3.3 all rows **except** `PUT /me/provider/pause` (M24): `GET /me/provider`, `PUT /me/provider/onboarding/:step`, `POST /me/provider/publish`, `PATCH /me/provider/business`, services POST/PATCH/DELETE, `PUT /me/provider/areas`, photo PUT/DELETE, `GET /me/provider/dashboard`, `GET /me/provider/verification`, documents POST/DELETE, `POST /me/provider/verification/submit`, `GET /files/documents/:id`, `GET /files/photos/:key`; §7.7 starting price recompute, §7.6 `searchText` maintenance, §7.8 storage keys, `UploadPipe` (magic bytes via `file-type`, `image-size` ≥ 400×400, 5 MB), D12.
- Matrix rows for every endpoint above; integration tests for rules (`services_min`, `services_max`, `service_name_taken`, `towns_max`, `onboarding_incomplete`, `documents_missing`, `verification_not_editable`, `already_in_state`, mobile required to publish).

## Out of scope
- Pause (M24). Dashboard checklist content (F-21, M24) — leave it as the contract allows. Admin approve/reject (M20).
- Request stats in the dashboard rely on request rows, which exist from the seed; request mutations stay mocked until M18.

## Acceptance criteria
1. The authorization matrix rows for all M17 endpoints pass; `GET /files/documents/:id` returns 404 to another provider and to customers, 200 to the uploader and admins with `Cache-Control: no-store`.
2. With `VITE_MOCK_DOMAINS=requests,reviews,admin`, every M11 and M12 user-visible criterion passes on real data at 1440px and 390px: the 5-step wizard saves and resumes after an API restart, publishing lists the provider in real Discover as "Not yet verified", services/areas/business/photo edits persist and show on S3 and Discover, documents upload and submit to Pending review.
3. Upload a `.png` renamed to `.pdf` with a spoofed MIME → accepted as PNG by content; a text file renamed `.jpg` → `Use a JPG, PNG or PDF file.`; a 6 MB file → 413 → `File must be 5 MB or smaller.`; a 300×300 photo → `Image must be at least 400 × 400 pixels.`
4. Adding/editing/deleting a service recomputes `startingPrice` in the same transaction; searching Discover for the new service name finds the provider immediately (`searchText` updated).
5. BR-21: Marcus renames Bell & Sons → the Verified badge disappears from S3, a new pending submission (trigger `business_name`) re-uses the last approved documents, and Mailpit receives the badge-removed email. A rename while `not_submitted` changes nothing else.
6. `GET /me/provider/dashboard` returns the S20 stat counts computed from request rows (pending, accepted upcoming, completed this month in Colombo time, rating); S20 tiles show them.
7. Onboarding writes after publish → 409 `already_in_state`; publish without a mobile → 422 `mobile_missing`/SPEC copy; an unconfirmed user → 422 `email_unconfirmed`.

## Notes for the planner
- Photos are public via `/api/files/photos/:key` (long cache); documents are never public (private bucket; stream through the API).
- Mixed mode: the mocked `requests` domain won't see newly published real providers' services in mock-only data; test request flows against seeded providers until M18.
- Keep all multi-row writes (services + startingPrice + searchText; business + verification status + submission) in one `$transaction`.
