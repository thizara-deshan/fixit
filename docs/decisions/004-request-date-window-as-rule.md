# 004 — Create request: the server checks the date window as a rule
Date: 2026-11-25 · Status: accepted · Milestone: M08

## Context
ARCH §3.4 and §7.2 had the server parse `POST /me/requests` with `makeCreateRequestSchema(now)`, so a date outside BR-34 failed body validation (400 `VALIDATION_FAILED`, field error on `preferredDate`). SPEC S12.E6, however, expects a form banner when the date became invalid between loading and submitting: `That date is no longer available. Choose another date.` That banner needs a business-rule error, and `RuleCode` already has `date_out_of_window`. It also lists `date_out_of_window` among the rules that `checkCreateRequest` must test. With the refinement in the parse step, that rule could never fire.

## Decision
- The server (API and MSW mock) parses the body with plain `CreateRequestBody`, with no window refinement.
- `checkCreateRequest()` enforces BR-34 after the S12 blocked-state rules and the field rules, and returns `date_out_of_window` → 422 `RULE_VIOLATION`, `details.rule = 'date_out_of_window'`. The web shows the S12.E6 banner and keeps the form values.
- The web form keeps `zodResolver(makeCreateRequestSchema(now))`, so users still see the inline range message `Choose a date from {tomorrow} to {max}.` before submitting.

## Consequences
- The BR-34 rule lives once, in `bookingWindow()`. The form refinement and `checkCreateRequest` both call it.
- A malformed date (not `YYYY-MM-DD`) is still a 400 field error. Only a well-formed date outside the window is a 422.
- ARCH §3.4 and §7.2 are updated to match.
