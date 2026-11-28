# TMDB public movie discovery

## Intent

Give REWIND visitors a useful TMDB catalogue page before they know a title to search for. Keep the existing Supabase Edge API as the only TMDB credential boundary, leave user catalogue rows untouched until an authenticated user explicitly adds a movie, and use the existing GitHub Pages + Supabase Free architecture.

## User experience

- With an empty movie query, `/films` shows a paginated “Popular on TMDB” section beside the existing REWIND catalogue results.
- Visitors can filter the TMDB section by a mapped genre, release year, and minimum TMDB vote average. Results sort by TMDB popularity.
- With a movie query of at least two characters, the current paginated TMDB text-search section remains in use.
- Guests may browse and open the public TMDB movie page. Only an authenticated visitor can use the existing explicit “Add to REWIND” action; the successful import navigates to the canonical REWIND movie page.
- Page, filters, and query are reflected in URL parameters so links can be shared and browser navigation works.
- TMDB attribution and the existing non-endorsement notice remain visible.

## API and data

- Add read-only `GET /api/tmdb/movies/discover?page=&genreId=&year=&minRating=&language=`.
- Return at most eight normalized movie candidates plus `page`, `totalPages` (capped at 500), and `totalResults`.
- Validate page 1–500, supported language `uk|en`, genre IDs as positive safe integers, year 1888–2100, and rating 0–10.
- Set `include_adult=false`, `sort_by=popularity.desc`, and a localized TMDB language. Keep `TMDB_API_KEY` server-side.
- Reuse the existing public genre API with an optional `tmdbId` field; expose mapped TMDB genre IDs only. Do not make local database genre IDs look like TMDB IDs.
- Cache normalized discovery requests briefly in the Edge isolate (10 minutes, bounded to 256 entries) and return public cache headers.
- Discovery and filtering must not write to Supabase or count against the per-user import quota.

## Non-goals

- Bulk mirroring or scheduled importing of TMDB's full catalogue.
- New paid services, credentials in the browser, or schema changes.
- Changing existing REWIND film IDs, user content, or publication policy.
- Changing the current title-search and explicit authenticated import flows.

## Acceptance

- Empty-query `/films` shows a populated TMDB discovery section and can page through results.
- Genre/year/minimum-rating filters reach the Edge API and TMDB provider; unsupported or malformed values return a safe 400.
- `include_adult=false`, supported language, popular sorting, and provider pagination are verified at the provider adapter.
- Discovery responses are read-only and use bounded cache behavior; no auth is required to browse.
- Search results, existing local catalogue filters, mobile layout, and keyboard/screen-reader operation remain usable.
- Guests never import; authenticated users continue using the explicit existing import action.
- CI, Deno tests, TypeScript build/typecheck, deployed HTTP response, and one read-only browser smoke pass before release.
