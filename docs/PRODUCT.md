# Fixit — Product Definition (v1)

Status: approved 2026-11-21 · Source: product-definition session (rounds 1–4) over `reference/prototype/` and `reference/screens/`.
Items marked `[ASSUMED]` were not explicitly confirmed and use the PM default stated next to them.

---

## 1. Vision & one-line pitch

**Pitch:** Fixit helps Sri Lankan households find a trusted local plumber, electrician, cleaner or other home-service pro, compare them on reviews, prices and verification, and send a job request in minutes.

**Vision:** A fair, simple marketplace where customers book with confidence and independent providers get steady local work without paying to join. v1 proves the core loop — **search → request → accept → complete → review** — in the Western Province, with an admin who keeps it trustworthy.

**v1 success looks like:** a customer can go from search to a completed, reviewed job; a provider can onboard, get verified and manage requests; an admin can verify providers and remove bad actors — all on a phone browser.

---

## 2. Market & assumptions

| Topic | Decision |
|---|---|
| Region | Sri Lanka; launch area = Western Province (Colombo, Gampaha, Kalutara districts) |
| Currency | Sri Lankan rupee, whole rupees only, shown as `LKR 2,500` |
| Language | English only (users may write free text in any language) |
| Time zone | Asia/Colombo (UTC+05:30) for all dates, expiry and cut-offs `[ASSUMED]` |
| Date format | `Sat, 21 Nov 2026` style; day-first `[ASSUMED]` |
| Phone numbers | Sri Lankan mobile, stored and shown as `+94 7X XXX XXXX` `[ASSUMED format]` |
| Payments | Off-platform (cash / bank transfer to the provider). Fixit takes no money and no commission |
| Platform | Responsive website (phone + desktop). No native app |
| Build constraints | One developer, 6–8 weeks; no paid third-party services except email delivery |
| Locations | Admin-managed list of towns grouped by district. Launch list `[ASSUMED]`: **Colombo** — Colombo, Dehiwala-Mount Lavinia, Sri Jayawardenepura Kotte, Moratuwa, Maharagama, Kaduwela, Homagama, Kesbewa · **Gampaha** — Negombo, Gampaha, Ja-Ela, Wattala, Kelaniya, Kadawatha · **Kalutara** — Panadura, Kalutara, Horana, Beruwala |
| Categories | The prototype's 8 at launch `[ASSUMED kept as-is]`: Plumbing, Electrical, Cleaning, Gardening, Painting & Decorating, Carpentry, Handyman, Appliance Repair |

---

## 3. Roles & permissions

**Roles**
- **Guest** — anyone not signed in.
- **Customer** — any signed-in user. Every account is a customer.
- **Provider** — a customer account that has switched on "I offer services" and completed onboarding. One account can hold both roles (BR-35).
- **Super admin** — accounts created by hand; no public sign-up. Admins do not book or offer services.

| Capability | Guest | Customer | Provider | Admin | Feature |
|---|:-:|:-:|:-:|:-:|---|
| Browse home, search, filter, sort | ✓ | ✓ | ✓ | ✓ | F-05, F-06, F-07, F-08 |
| View provider public profile & reviews | ✓ | ✓ | ✓ | ✓ | F-09 |
| Sign up / sign in (email+password or Google) | ✓ | — | — | — | F-01, F-02 |
| Admin sign-in | — | — | — | ✓ | F-30 |
| Manage own profile (name, mobile) | — | ✓ | ✓ | — | F-03 |
| Send a service request | — | ✓ | ✓ (not to self) | — | F-04, F-11, F-14 |
| Track own requests (My requests) | — | ✓ | ✓ | — | F-12 |
| Cancel own request | — | ✓ | ✓ | — | F-13 |
| Write a review on own completed request | — | ✓ | ✓ | — | F-28 |
| Save providers | — | ✓ (Could) | ✓ (Could) | — | F-10 |
| Become a provider (onboarding) | — | ✓ | — | — | F-15 |
| Submit / resubmit verification documents | — | — | ✓ | — | F-16 |
| Edit business, services, prices, areas, photo | — | — | ✓ | — | F-20 |
| View incoming requests & dashboard stats | — | — | ✓ | — | F-17 |
| Accept / decline a request | — | — | ✓ | — | F-18 |
| Mark a request completed, set agreed price | — | — | ✓ | — | F-18, F-19 |
| See customer contact after accepting | — | — | ✓ | — | F-27 |
| See provider phone after acceptance | — | ✓ | ✓ | — | F-27 |
| Pause new requests (Should) | — | — | ✓ | — | F-22 |
| Reply to a review (Should) | — | — | ✓ | — | F-23 |
| Profile-completeness checklist (Should) | — | — | ✓ | — | F-21 |
| Reviews section in dashboard (Should) | — | — | ✓ | — | F-24 |
| Approve / reject verification | — | — | — | ✓ | F-31 |
| Suspend / reactivate users | — | — | — | ✓ | F-32 |
| Hide / restore reviews | — | — | — | ✓ | F-33 |
| Manage categories & towns (Should) | — | — | — | ✓ | F-34 |
| View all requests; cancel with reason (Should) | — | — | — | ✓ | F-35 |
| View metrics (Should) | — | — | — | ✓ | F-36 |
| Read About / Contact / Privacy | ✓ | ✓ | ✓ | ✓ | F-37 |

---

## 4. Journeys

### 4.1 Guest
1. Lands on Home; searches by service + town, picks a popular chip, or picks a category (F-05, F-06).
2. Browses results, filters and sorts (F-07, F-08); opens a provider profile (F-09).
3. Clicks **Request Service** → asked to sign in / sign up → after auth, returns to the same provider with the request form open (F-01, F-02, F-04, F-11).
4. Clicks **Join as a provider** → sign up → provider onboarding (F-01, F-15).

### 4.2 Customer
1. Signs up with Google or email+password; email+password users confirm their email (F-01, F-02).
2. Adds name and mobile number (F-03).
3. Searches and compares providers (F-05 – F-09).
4. Sends a request: service, preferred date, slot, town, address, description (F-11, F-14) → **Pending**; provider is emailed (F-26).
5. Tracks it in **My requests** (F-12); receives an email on every status change (F-26).
6. On **Accepted**: sees provider's mobile number and any agreed price (F-12, F-27).
7. May cancel: Pending any time; Accepted until the cut-off (F-13, BR-30).
8. On **Completed**: receives an email with a review link; leaves 1–5 stars + text within 30 days (F-28).
9. If the provider declines or the request expires, searches again.

### 4.3 Provider
1. Signs up (or uses an existing customer account) and switches on "I offer services" (F-01, F-02, F-03).
2. Onboarding wizard (F-15): business name, bio, years of experience → one category → services (name, price, unit) → base town + other service towns → profile photo. Finishing publishes the profile (listed as "Not yet verified").
3. Submits verification: NIC front/back (required), trade certificate/NVQ and business registration (optional) (F-16).
4. Receives requests on the dashboard and by email (F-17, F-26).
5. Opens a request; accepts (optionally entering an agreed price) or declines (confirm step, optional reason) (F-18).
6. After accepting, sees the customer's full name, address and mobile; contacts them directly (F-27).
7. On or after the job date, marks it **Completed**, optionally updating the agreed price (F-19).
8. Keeps the listing current: edits services, prices, areas, bio, photo (F-20). Changing business name or category triggers re-verification (BR-21).
9. If verification is rejected, reads the reason, fixes the documents and resubmits (F-16).
10. Should-items: pauses requests when busy (F-22), replies to reviews (F-23), follows the completeness checklist (F-21), reads reviews in the dashboard (F-24).

### 4.4 Super admin
1. Signs in with a hand-created account (F-30).
2. Works the verification queue: views documents, approves (badge on) or rejects with a reason (F-31).
3. Searches users; suspends or reactivates with a reason; the system applies suspension effects (F-32, BR-40 – BR-43).
4. Hides or restores reviews that break the rules, with a reason (F-33).
5. Should-items: manages categories and towns (F-34), reviews all requests and cancels disputed ones (F-35), checks metrics (F-36).

---

## 5. Feature list

v1 = all **Must** items (≈6 weeks) + **Should** items as time allows in the order F-35, F-22, F-21, F-36, F-34, F-23, F-24. Shoulds are cut first if time slips.

| ID | Feature | Role | MoSCoW | Notes |
|---|---|---|---|---|
| **Accounts** |||||
| F-01 | Sign up / sign in with email+password; email confirmation; password reset | Guest | Must | Confirmation required before first request or onboarding |
| F-02 | Sign in with Google | Guest | Must | Google email counts as confirmed |
| F-03 | Account profile: name, mobile (+94), "I offer services" switch | Customer / Provider | Must | One account, both roles |
| F-04 | Return to the provider and open the request form after sign-in | Guest | Must | |
| **Discovery** |||||
| F-05 | Home: search, popular chips, category grid, featured providers, how it works, join CTA | Guest | Must | Featured rule BR-08 |
| F-06 | Search: text→category matching, name/service text match, town matched against service areas | Guest | Must | BR-01 – BR-04 |
| F-07 | Filters: categories, town, min rating, verified only, price steps; per-category counts | Guest | Must | BR-05 |
| F-08 | Sort: Top rated, Most reviews, Based in your town first | Guest | Must | BR-06, BR-07 |
| F-09 | Provider public profile: about, services & prices, areas, reviews, badge + tooltip | Guest | Must | Map placeholder removed |
| F-10 | Saved providers, kept on the account | Customer | Could | Save button hidden unless built |
| **Customer requests** |||||
| F-11 | Request form | Customer | Must | Fields §6.2 |
| F-12 | My requests: list by status + detail (history, agreed price, provider phone after accept) | Customer | Must | |
| F-13 | Cancel own request | Customer | Must | BR-30 |
| F-14 | Request limits | Customer | Must | BR-33 |
| **Provider** |||||
| F-15 | Onboarding wizard | Provider | Must | |
| F-16 | Verification submission and resubmission | Provider | Must | BR-17 |
| F-17 | Dashboard: stat tiles, request list with status tabs, request detail | Provider | Must | Privacy §6.3 |
| F-18 | Accept (optional agreed price) / Decline (confirm, optional reason) | Provider | Must | No undo |
| F-19 | Mark Completed; update agreed price | Provider | Must | On/after preferred date |
| F-20 | Edit business details, services, areas, photo | Provider | Must | BR-21 |
| F-21 | Profile-completeness checklist | Provider | Should | |
| F-22 | "Not taking requests" pause switch | Provider | Should | BR-15 |
| F-23 | One public reply per review | Provider | Should | BR-28 |
| F-24 | Reviews section in dashboard | Provider | Should | |
| **Lifecycle & notifications** |||||
| F-25 | Automatic expiry of Pending requests | System | Must | BR-31 |
| F-26 | Email notifications | System | Must | §8 |
| F-27 | Contact reveal on accept / hide on cancel, decline, expire | System | Must | §6.3 |
| **Reviews** |||||
| F-28 | Write a review | Customer | Must | BR-24 – BR-26 |
| F-29 | Rating aggregation from visible reviews; "New" label | System | Must | BR-27 |
| **Admin** |||||
| F-30 | Admin sign-in (hand-created accounts) | Admin | Must | |
| F-31 | Verification queue: view docs, approve / reject with reason | Admin | Must | |
| F-32 | Suspend / reactivate users with automatic request effects | Admin | Must | BR-40 – BR-43 |
| F-33 | Hide / restore reviews | Admin | Must | |
| F-34 | Manage categories and districts/towns | Admin | Should | Launch lists are pre-loaded (§2) |
| F-35 | All-requests overview (read-only) + admin cancel with reason | Admin | Should | If cut, admin-cancel transition is removed |
| F-36 | Metrics page | Admin | Should | BR-50 |
| **Site** |||||
| F-37 | About, Contact (email address), Privacy pages | Guest | Must | Privacy needed: NIC images stored |
| F-38 | Responsive layout at phone and desktop widths | All | Must | |
| F-39 | Photos on requests | Customer | Could | |
| F-40 | Self-service account deletion | Customer / Provider | Could | Manual via Contact meanwhile |
| **Won't (v1)** — see §9 |||||
| F-41 | Online payments / commission | — | Won't | |
| F-42 | SMS / phone OTP sign-in | — | Won't | |
| F-43 | Sinhala & Tamil UI | — | Won't | |
| F-44 | Map & real distance | — | Won't | |
| F-45 | In-app notification centre | — | Won't | |
| F-46 | Multiple categories per provider | — | Won't | |
| F-47 | Multi-provider quote requests | — | Won't | |
| F-48 | Customer marks a job complete | — | Won't | |
| F-49 | Undo on accept / decline | — | Won't | |
| F-50 | Same-day booking | — | Won't | |
| F-51 | Editing reviews | — | Won't | |
| F-52 | Public provider response rate | — | Won't | |

---

## 6. Booking lifecycle

### 6.1 State machine

Statuses: **Pending**, **Accepted**, **Declined**, **Cancelled**, **Expired**, **Completed**. Declined, Cancelled, Expired and Completed are final — nothing leaves them.

| From | To | Who | Condition | Side effects |
|---|---|---|---|---|
| — | Pending | Customer | Signed in; email confirmed; mobile set; provider is listed, not suspended, not paused, not the customer themself; town is in the provider's service areas; date is tomorrow to +60 days; limits respected (BR-33) | Email provider; provider "New requests" +1 |
| Pending | Accepted | Provider | — | Optional agreed price; contact details revealed (§6.3); email customer |
| Pending | Declined | Provider | Confirm step | Optional reason shown to customer; email customer |
| Pending | Cancelled | Customer | Any time | Optional reason; email provider |
| Pending | Expired | System | 72 hours since creation, or 00:00 on the preferred date, whichever is first | Email customer and provider; counted in admin response metric |
| Accepted | Cancelled | Customer | Until 23:59 on the day before the preferred date | Optional reason; contact details hidden; email provider |
| Accepted | Cancelled | Admin (F-35) | Any time; reason required | Contact hidden; email both |
| Accepted | Completed | Provider | On or after the preferred date | Agreed price may be updated; email customer with review link; completed count +1 |
| Pending | Declined | System | Provider suspended | Reason "Provider unavailable"; email customer |
| Accepted | Cancelled | System | Provider suspended | Reason "Provider unavailable"; email customer |
| Pending / Accepted | Cancelled | System | Customer suspended | Email provider |

An Accepted request that is never marked Completed stays Accepted; it does not block the customer beyond the open-request limit, and the admin can cancel it (F-35). `[ASSUMED]`

### 6.2 Request fields

| Field | Rule |
|---|---|
| Reference | `FX-` + sequential number, shown to both sides |
| Provider | Fixed at creation |
| Service | One of the provider's listed services; its name, price and unit are copied onto the request |
| Preferred date | Tomorrow to 60 days ahead (Sri Lanka time) |
| Time slot | Morning, Afternoon or Evening |
| Town | Must be one of the provider's service areas |
| Address | 1–2 lines, required |
| Description | 20–1,000 characters, required |
| Customer mobile | Copied from the customer's profile |
| Agreed price | Optional, whole LKR, set/changed by the provider from Accept until Completed |
| Decline / cancel reason | Optional free text (required for admin cancel) |
| Status history | Each status with its date and time and who made the change |

### 6.3 Privacy rules

| | Pending | Accepted / Completed | Declined / Cancelled / Expired |
|---|---|---|---|
| Provider sees customer's | First name + last initial, town, service, date, slot, description | + full name, address, mobile | Back to the Pending view |
| Customer sees provider's | Public profile | + mobile number | Public profile |

- Verification documents are visible only to the provider who uploaded them and to admins.
- Review authors are shown as first name + last initial.
- Email addresses are never shown to the other party.

---

## 7. Business rules

### Search & ranking
- **BR-01 Listed providers.** A provider appears in search, featured lists and by profile link only if onboarding is complete and the account is not suspended. Unverified providers are listed with a "Not yet verified" badge.
- **BR-02 Category matching.** Search text (trimmed, case-insensitive) that equals a category name, or is a prefix of a category name and at least 4 characters long, becomes that category filter and is not used as free text.
- **BR-03 Free-text matching.** Any other text matches a provider if it appears in the business name, the category name or any service name.
- **BR-04 Town matching.** A town filter matches providers whose service areas include that town (the base town is always one of the service areas).
- **BR-05 Filters.** Several categories combine as OR. All other filters combine as AND. Minimum rating options: Any, 3.5+, 4.0+, 4.5+ (providers with no reviews are excluded unless "Any"). Price steps on the "starting at" price: Any, up to LKR 2,000, up to LKR 5,000, up to LKR 10,000. Category counts reflect all other active filters. Search text, town and categories are kept in the page link; the other filters reset on a new search.
- **BR-06 Sort.** Top rated (default): rating high→low, ties by review count, providers with no reviews last. Most reviews: review count high→low, ties by rating. Based in your town first: providers based in the selected town first, then the rest, each group by Top rated; when no town is selected it behaves as Top rated.
- **BR-07 No distance.** Fixit shows no distance figures in v1.
- **BR-08 Featured providers.** Home shows up to 4 verified providers with at least 1 review, by Top rated order.

### Pricing display
- **BR-09 Service price.** Every service has a price in whole LKR and one unit: per hour, per visit, or fixed. Shown as "from LKR 2,500 / hour", "from LKR 4,000 / visit", or "LKR 15,000 fixed".
- **BR-10 Starting at.** A provider's "Starting at" is their lowest service price, shown with that service's unit. It updates whenever services change.
- **BR-11 Final price note.** Profiles and the request form state: "Final price is confirmed by the provider after reviewing your request."
- **BR-12 Agreed price.** Optional, for information only; no money moves through Fixit.

### Providers & verification
- **BR-13 One category.** Each provider has exactly one category.
- **BR-14 Listing limits.** At least 1 and at most 20 services; base town plus up to 9 other towns `[ASSUMED limits]`.
- **BR-15 Pause (F-22).** A paused provider stays listed with "Not taking requests"; Request Service is disabled. Existing requests are unaffected.
- **BR-16 No self-booking.** A user cannot request their own provider listing.
- **BR-17 Verification documents.** NIC front and back required; trade certificate/NVQ and business registration optional. Image or PDF files `[ASSUMED: up to 5 MB each]`.
- **BR-18 Verification states.** Not submitted → Pending review → Verified or Rejected (with reason) → resubmit → Pending review.
- **BR-19 Admin checks.** Name on NIC matches the account's name or owner, documents are legible and appear unaltered.
- **BR-20 What Verified unlocks.** The Verified badge and inclusion under "Verified only". Nothing else — unverified providers can still receive requests. Tooltip copy: "Fixit has checked this provider's national ID and, where listed, their trade qualification."
- **BR-21 Re-verification.** Changing business name or category removes the badge and returns the provider to Pending review. Other edits keep the badge.
- **BR-22 Document retention.** Documents are kept while the account exists and deleted with it `[ASSUMED]`.

### Accounts
- **BR-35 Both roles.** Every account is a customer; any customer can become a provider on the same account.
- **BR-23 Mobile required.** A mobile number is required before sending a request or finishing onboarding. It is not verified by SMS.

### Reviews
- **BR-24 Eligibility.** Only the customer of a Completed request, within 30 days of completion.
- **BR-25 One per request.** One review per request; not editable after posting.
- **BR-26 Content.** 1–5 stars and 10–1,000 characters of text.
- **BR-27 Rating.** Provider rating = average of visible reviews, shown to 1 decimal; review count = number of visible reviews. With no visible reviews the provider shows "New".
- **BR-28 Replies (F-23).** One public reply per review by the provider, editable by them `[ASSUMED editable]`.
- **BR-29 Moderation.** Admin may hide a review with a reason and later restore it. Hidden reviews are not shown and do not count.

### Requests & cancellation
- **BR-30 Cancellation.** Customer: Pending any time; Accepted until 23:59 the day before the preferred date. Provider: cannot cancel after accepting — they contact the customer, and the admin can cancel if needed. Admin: any open request, with a reason (F-35).
- **BR-31 Expiry.** A Pending request expires 72 hours after creation or at 00:00 on its preferred date, whichever is first.
- **BR-32 Completion.** Only the provider marks Completed, and only on or after the preferred date.
- **BR-33 Limits.** A customer may have at most 1 open (Pending or Accepted) request per provider and 5 open requests in total.
- **BR-34 Booking window.** Preferred date from tomorrow to 60 days ahead; no same-day bookings.

### Suspension effects
- **BR-40 Who.** Admins can suspend and reactivate any customer or provider account, with a reason. Admin accounts are not managed in the app.
- **BR-41 Suspended provider.** Cannot sign in; profile hidden from search, featured and direct link; Pending requests → Declined, Accepted requests → Cancelled, with customers emailed; reviews kept.
- **BR-42 Suspended customer.** Cannot sign in; their Pending and Accepted requests → Cancelled, with providers emailed; their reviews stay visible unless hidden by an admin. If the account is also a provider, BR-41 applies too.
- **BR-43 Reactivation.** Restores sign-in and the listing; cancelled or declined requests stay final; verification status is unchanged.

### Metrics
- **BR-50 Admin metrics (F-36).** Total customers, total providers (verified / pending review / not submitted), requests this month by status, completion rate (Completed ÷ Accepted-or-later this month), expired share of Pending this month.

---

## 8. Notifications

Channel: **email** for every event below. In-app = counters and badges only (provider "New requests" count, status pills in My requests); no notification centre.

| Event | Recipient | Channel |
|---|---|---|
| Email confirmation on sign-up (email+password) | User | Email |
| Password reset requested | User | Email |
| New request received | Provider | Email + dashboard counter |
| Request accepted (with provider phone, agreed price if set) | Customer | Email |
| Request declined (with reason if given) | Customer | Email |
| Request cancelled by customer | Provider | Email |
| Request cancelled by admin | Customer and provider | Email |
| Request expired | Customer and provider | Email |
| Request completed (with review link) | Customer | Email |
| Request declined/cancelled because a party was suspended | The other party | Email |
| Verification approved | Provider | Email |
| Verification rejected (with reason) | Provider | Email |
| Badge removed for re-verification (name/category change) | Provider | Email `[ASSUMED]` |
| Account suspended (with reason) / reactivated | User | Email |

---

## 9. Out of scope for v1

| Item | Why not now |
|---|---|
| Online payments, deposits, commission (F-41) | Payment gateway setup and fees; disputes over money need process we don't have |
| SMS / phone OTP sign-in (F-42) | Paid service; constraint is email only |
| Sinhala & Tamil UI (F-43) | Translation and testing effort; English only agreed |
| Maps & real distance (F-44) | Needs a mapping service; town matching is enough at launch |
| Notification centre (F-45) | Email + counters cover v1 |
| Multiple categories per provider (F-46) | Complicates search and verification |
| Quotes from several providers (F-47) | Different booking model; much more state |
| Customer-confirmed completion (F-48) | Provider-only completion is simpler |
| Undo on accept/decline (F-49) | Conflicts with emails already sent; replaced by a confirm step |
| Same-day booking (F-50) | Providers need time to reply |
| Editing reviews (F-51) | Moderation simpler with immutable reviews |
| Public response rate (F-52) | Kept as an admin metric first |

**Later ideas:** saved providers (F-10), request photos (F-39), self-service account deletion (F-40), more provinces, Sinhala/Tamil, availability calendars, provider subscription plans, in-app messaging, review photos, featured-listing promotion, mobile app.

---

## 10. Decisions log

| # | Question | Answer |
|---|---|---|
| R1-1 | v1 constraints (timeline, team, platform, budget)? | Solo developer, 6–8 weeks, responsive website only, no paid third-party services except email |
| R1-2 | Payments through Fixit? | No — paid directly to provider; Fixit records the agreed price; no commission |
| R1-3 | Location model? | Admin-managed towns grouped by district, Western Province first; search matches service areas; "Nearest" → "Based in your town first" |
| R1-4 | Languages? | English only |
| R1-5 | Sign-up / sign-in method? | Sign in with Google plus email and password |
| R1-6 | Request shape? | One request → one provider → one listed service, with date and slot |
| R1-7 | Categories per provider? | One main category |
| R1-8 | Price display in LKR? | Per-service price + unit (hour / visit / fixed); "Starting at" = lowest service price |
| R2-1 | Can unverified providers receive requests? | Yes, listed with "Not yet verified"; Verified-only filter available |
| R2-2 | Customer and provider on one account? | Yes, one account; no self-booking |
| R2-3 | Who cancels, until when? | Customer: Pending any time, Accepted until the day before; provider can't cancel after accepting; admin can cancel |
| R2-4 | Provider suspended? | Hidden, can't sign in; Pending → Declined, Accepted → Cancelled, customers emailed; reviews kept |
| R2-5 | Customer suspended? | Can't sign in; open requests cancelled, providers emailed; reviews stay unless admin hides |
| R2-6 | Verified badge after edits? | Kept, except business name or category change → re-verification |
| R2-7 | Mobile number mandatory? | Yes for both roles; no SMS check; shared only after accept |
| R2-8 | Request limits? | 1 open per provider, 5 open in total |
| R3-1 | Expiry window? | 3 days, or earlier if the preferred date arrives |
| R3-2 | Who marks Completed? | Provider only |
| R3-3 | Undo on accept/decline? | Removed; Decline gets a confirm step |
| R3-4 | Photos on requests? | Not in v1 (Could) |
| R3-5 | Review edits / provider replies? | No edits; provider reply is a Should |
| R3-6 | Price filter in LKR? | Steps: Any, ≤2,000, ≤5,000, ≤10,000 on "starting at" |
| R3-7 | Booking window? | Tomorrow to 60 days ahead |
| R3-8 | Provider pause switch? | Yes, as a Should |
| R3-* | State machine, request fields, privacy, reviews, verification, notifications as proposed in round 3 | Approved |
| R4-1 | Categories/towns admin screen Must or Should? | Should; launch lists pre-loaded |
| R4-2 | Featured providers rule? | Top 4 verified providers by rating (with ≥1 review) |
| R4-3 | Saved providers? | Could; Save button hidden unless built |
| R4-* | MoSCoW table and build order | Approved |
| A-1 | Time zone | `[ASSUMED]` Asia/Colombo for all dates and cut-offs |
| A-2 | Launch town list | `[ASSUMED]` 18 towns listed in §2 |
| A-3 | Launch categories | `[ASSUMED]` prototype's 8 categories |
| A-4 | Exact cut-offs | `[ASSUMED]` expiry = 72 h or 00:00 on preferred date; Accepted cancel until 23:59 the day before |
| A-5 | Listing limits | `[ASSUMED]` 1–20 services; base town + up to 9 others |
| A-6 | Document file types/size | `[ASSUMED]` image or PDF, up to 5 MB each |
| A-7 | Document retention | `[ASSUMED]` kept while account exists, deleted with it |
| A-8 | Provider reply editable | `[ASSUMED]` yes, by the provider |
| A-9 | Never-completed Accepted requests | `[ASSUMED]` stay Accepted; admin can cancel (F-35) |
| A-10 | Badge-removed email | `[ASSUMED]` sent to provider |
| A-11 | Phone and date display formats | `[ASSUMED]` `+94 7X XXX XXXX`; day-first dates |

---

## 11. Open questions

None blocking v1. Explicitly deferred:
- **Privacy policy wording** (F-37) — needs a plain-language draft covering NIC storage before launch; content, not product scope.
- **Email sending service** — a technical choice for the architecture step (prompt 02/03), within the "email is the only paid service" constraint.
