# Public watched-film count — design

## Intent

The READY Films Discovery desktop frame `1480:6235` shows the number of films watched on REWIND beside “Just reviewed.” The current page has no value for that number. Keep the source element while showing a count derived from Supabase records instead of a fixed sample.

## Goals

- Provide a small read-only public API value for total watched-film entries.
- Count only active users’ published films already present in their public `WATCHED` collections, matching the existing public-profile visibility rules.
- Render the formatted count beside “Just reviewed” on desktop; keep the existing mobile layout unchanged because the mobile source frame does not include the metric.
- Cover repository query semantics, route response, frontend request and desktop rendering with deterministic fixtures.
- Avoid any schema or data migration and make no production change during local implementation.

## Non-goals and anti-goals

- Do not copy the Figma sample value `3,108,812,335` into the UI or tests as runtime truth.
- Do not count hidden users, unpublished films, watchlists, ratings or reviews.
- Do not expose per-user or per-film information through the aggregate endpoint.
- Do not change mobile layout, existing public-profile metrics, or the Spring/MySQL mirror for this Supabase-backed page.
- Do not deploy as part of this feature work.

## Approaches

1. Keep the metric absent and document the mismatch. This is lowest risk but leaves a visible READY-frame gap.
2. Render the Figma sample number statically. This matches one screenshot but presents false live data.
3. Add a read-only Supabase count endpoint over the existing public watched-list records, and hide the metric on request failure. This adds a small aggregate query without schema changes and keeps the UI truthful. **Selected** under the user's existing instruction to independently close Figma gaps.

## Design

- Add `GET /api/stats/watched-films`, returning `{ "count": <safe integer> }`.
- The repository query counts `list_items` joined to `lists` where `list_type='WATCHED'`, `users.is_active=true`, and the referenced `movies.is_published=true`. System WATCHED lists are public by current RLS policy regardless of `is_public`; reflect that same behavior in this aggregate.
- Use a single aggregate query and validate the result as a safe non-negative integer before returning it.
- Fetch through the frontend API client. On the desktop “Just reviewed” heading, display localized number formatting plus the source label. On mobile, keep the metric hidden to match the mobile frame. If loading fails, omit the count instead of showing a guessed or stale value.
- Add fixture-backed handler and repository tests, a focused Films Discovery browser assertion, and update the Figma matrix/handoff/progress evidence.

## Constraints and open limits

- The deployed production backend is Supabase Edge/Postgres; the local Spring/MySQL mirror is not used by this route.
- The count represents publicly visible watched-film entries, not unique film titles across all users.
- Query cost grows with watched-list entries. Existing list indexes are used; revisit cached aggregates only if production query evidence shows a performance issue.
- Local CI/test environment may not include Deno; record that limitation if the repository test suite cannot be executed here.

## Acceptance

- Tests prove active/published/public-system list filters and zero-count behavior.
- API returns only the aggregate and rejects invalid counts.
- Desktop Figma metric is present, localized and API-driven; mobile remains unchanged.
- Focused browser test, frontend typecheck/build, and diff checks pass where available.
- No production, database, or schema changes are made.
