# Public list publication time

## Goal

Show the actual publication time on public list detail pages, matching the Figma “Published … ago” line. Track visibility transitions so a private draft does not appear to have been public since it was created.

## Behavior

- Public list details return `publishedAt` as an ISO timestamp.
- Creating a list as public sets `publishedAt` immediately.
- Changing a list from private to public sets a fresh timestamp.
- Changing it from public to private clears `publishedAt`; republishing sets a new timestamp.
- Existing public lists receive `created_at` as the best available historical estimate; the original publication time cannot be reconstructed.
- Public list detail renders localized “Published {relative time}” text in the author line and exposes the timestamp in `<time datetime>`.
- Public list feed cards and private/system lists do not gain a new timestamp field.

## Data and security

- Add nullable `rewind.lists.published_at TIMESTAMPTZ` through a versioned migration.
- A `BEFORE INSERT OR UPDATE OF is_public` trigger owns this value; callers cannot provide or retain a misleading timestamp.
- Public detail reads it through the existing server-only Edge role and public-list predicate. No browser Data API grants or RLS policy changes.
- Reuse the existing localized relative-time formatter and “Published” translation.
- No production migration or deployment is part of local implementation verification.

## Acceptance

- A Figma-backed page test asserts author + localized publication time and the semantic `<time datetime>` value.
- The disposable PostgreSQL Edge/RLS scenario verifies backfill, create-public, publish, unpublish, republish, and public detail serialization.
- Existing public-list detail geometry, API behavior, and private-list isolation remain intact.
- TypeScript/Vite build, focused Playwright coverage, Deno type check, and the PostgreSQL rehearsal pass.

## Out of scope

- Reconstructing exact historical publication times for current public lists.
- Adding timestamps to cards, private list APIs, admin summaries, or activity-feed events.
- Changing feed ranking, content visibility, or list-editing permissions.
