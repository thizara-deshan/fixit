# 006 — Re-verification (BR-21) applies only to Verified listings
Date: 2026-11-28 · Status: accepted · Milestone: M12

## Context
SPEC S24.E3 and §8.1 A23 apply BR-21 when the status is Verified **or Pending review**. A provider in their first review (never verified, e.g. p02) would then get the S24 warning and dialog ("removes your Verified badge") and L3 banner #3 ("Your Verified badge was removed…"), which is untrue: they have no badge. PRODUCT BR-21 itself only speaks of removing the badge.

## Decision
- BR-21 applies only when `verificationStatus = verified`. `reverificationFor` returns null for every other status.
- A name/category edit while Pending review just saves. The pending submission stays in the queue unchanged; `reverificationReason` is not set.
- Not submitted / Rejected: unchanged (no effect).

## Consequences
- SPEC S24.E3 and A23, and M12 AC8, are updated to "Verified" only.
- The S24 inline warning and re-verify dialog show only for verified providers.
- Admins may review a submission whose business name changed after it was submitted; they see the current name on S32.
