# TMDB on-demand catalogue design

## Intent

Let REWIND users find films from TMDB and then use normal REWIND movie pages, ratings, reviews, watched state, and lists. Keep GitHub Pages + Supabase and the current free-tier architecture. Do not mirror the entire TMDB catalogue into Supabase.

## Goals

- Search the TMDB movie catalogue through the existing Supabase Edge API; never expose the TMDB credential in the browser.
- Combine local REWIND catalogue results with clearly labelled TMDB-only matches.
- Let an authenticated user add a selected TMDB film to the local catalogue and then open its normal REWIND detail page.
- Reuse existing TMDB mapping, movie-ID uniqueness, and application contracts where possible.
- Cache normalized TMDB title-search results briefly and bound all query/page sizes to reduce provider load.
- Preserve TMDB attribution in About/Credits and document that REWIND is not endorsed by TMDB.
- Keep imports idempotent and avoid deleting, overwriting, or changing existing user activity.

## Non-goals

- Bulk-copying or crawling all TMDB titles.
- Importing TV, people, or other media types through a movie feature.
- Changing production deployment or database data during implementation.
- Replacing user-created REWIND content or existing catalogue IDs.

## Approaches considered

1. **Mirror all TMDB titles** — rejected: enormous, wasteful, stale, and contrary to TMDB's anti-scraping/rate guidance.
2. **Admin-only discovery/import** — already exists, but users cannot find/import an absent title themselves.
3. **On-demand server search + explicit authenticated import** — selected: returns current provider results, writes only a title a user chose, and keeps the secret and database writes behind the existing Edge API.

## Architecture and safety

The React UI keeps local catalogue search as its first source and requests TMDB candidates from a new bounded public search route when a query has at least two characters. Search returns candidates without creating rows. A separate authenticated action imports one selected positive TMDB ID. The server rechecks the provider record, checks for an existing `tmdb_id`, inserts/synchronizes idempotently, and returns the canonical REWIND movie ID. Existing rows and activity remain untouched. Duplicate concurrent imports must converge on the unique TMDB ID instead of creating duplicate films.

Search caching is server-side, normalized by query/year/language, and expires after 15 minutes, with at most 256 entries per worker isolate. Queries are capped at 120 characters; page is capped at 500; each response returns at most eight candidates. Provider 429/unavailable responses become retryable application errors. No TMDB secret, service-role key, or provider error body is sent to the browser.

The user import route requires a confirmed active account and a bounded per-account daily import quota. Public guests may search and browse local films; they must sign in before adding an external title. TMDB-derived records follow existing publication policy and retain correct attribution.

## Constraints

- PostgreSQL application data remains in private `rewind` schema behind existing Edge roles and RLS.
- Schema changes are migrations; do not edit hosted production directly as part of this code change.
- No new paid service or client-side TMDB key.
- Preserve GitHub Pages as production host and Supabase as backend.
- Observe TMDB attribution, current rate limits, and non-commercial API terms.

## Acceptance

- A title present only in TMDB appears in REWIND search, paginated within bounds, with correct poster/year/overview and attribution.
- Choosing a result while signed out prompts for authentication without writing to the database.
- Choosing a result while signed in imports at most one film, gives its canonical REWIND ID, and reaches usable detail/actions.
- Repeating or racing the same import returns the same REWIND record.
- Local search behavior and existing REWIND IDs/activity are unchanged.
- Invalid/oversized queries, bad pages, rate limits, missing secret, and provider failures are handled safely.
- Relevant Edge checks, frontend type/build checks, and focused UI coverage pass before proposing a production release.

## Builder decisions

- The implementation may choose the smallest migration-backed server cache and quota schema compatible with existing role grants.
- Prefer one clear `Add to REWIND` action and the existing login return flow rather than silently importing every result.
- Do not auto-publish low-quality or adult results; use TMDB `include_adult=false` and existing movie publication rules.
