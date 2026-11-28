# 007 — In admin filters and counts, "customer" means an account without a published listing
Date: 2026-11-28 · Status: accepted · Milestone: M13

## Context
PRODUCT BR-35 says every account is a customer, and a provider is a customer who has also published a listing. Read literally, S33's `Customers` tab (`/admin/users?role=customer`) would list the same accounts as `All`, and S30.E3's "Customers" total (BR-50, F-36) would include every provider. Neither is useful to an admin, and the two tabs would look broken.

## Decision
- In admin filters and counts, `role=customer` = non-admin accounts **without** a published provider listing (onboarding drafts count as customers).
- `role=provider` = non-admin accounts with a published listing.
- Admin accounts never appear in admin user lists (BR-40).
- Role pills on S33/S34 don't change: providers show both `Customer` and `Provider`, because the account can still book (BR-35).

## Consequences
- M13: `AdminUserListQuery.role` and the mock `userListPage` filter use this meaning (PLAN-M13 D-7, T12).
- M20: the API's `GET /admin/users?role=` filter uses the same rule.
- M25: S30.E3 "Customers" counts customer-only accounts; S30.E4 "Providers" counts published listings. Customers + Providers = all non-admin accounts.
- PRODUCT BR-35 is unchanged. This defines only the admin view.
