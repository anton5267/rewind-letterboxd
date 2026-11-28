# TMDB public movie discovery

## Intent

Give REWIND visitors a useful TMDB catalogue page before they know a title to search for. Keep the existing Supabase Edge API as the only TMDB credential boundary, leave user catalogue rows untouched until an authenticated user explicitly adds a movie, and use the existing GitHub Pages + Supabase Free architecture.

## User experience

- With an empty movie query, `/films` keeps the Figma-matched REWIND catalogue geometry and automatically shows the first page of the paginated “Popular on TMDB” feed after the REWIND catalogue. A compact, localized hero control lets visitors close the feed or reopen it.
- Visitors can filter the TMDB section by a mapped genre, release year, and minimum TMDB vote average. Results sort by TMDB popularity.
- With a movie query of at least two characters, the current paginated TMDB text-search section remains in use.
- Guests may browse and open the public TMDB movie page. Only an authenticated visitor can use the explicit “Add to my Watchlist” action on the global Films discovery/search page; the Edge API imports a missing movie into the shared REWIND catalogue and adds it to that user's Watchlist in the same transaction, then navigates to the canonical REWIND movie page. TMDB results selected from the custom-list editor still only add to that selected list.
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
- Automatically adding every browsed/search result or changing user lists without an explicit authenticated action.
- Automatically adding a TMDB result to Watchlist when it is selected from the custom-list editor.

## Acceptance

- Empty-query `/films` shows a populated TMDB discovery section and can page through results.
- Genre/year/minimum-rating filters reach the Edge API and TMDB provider; unsupported or malformed values return a safe 400.
- `include_adult=false`, supported language, popular sorting, and provider pagination are verified at the provider adapter.
- Discovery responses are read-only and use bounded cache behavior; no auth is required to browse.
- Search results, existing local catalogue filters, mobile layout, and keyboard/screen-reader operation remain usable.
- Guests never import; authenticated users continue using the explicit existing import action.
- CI, Deno tests, TypeScript build/typecheck, deployed HTTP response, and one read-only browser smoke pass before release.

## Catalogue presentation follow-up — 28 November 2026

- On the unfiltered `/films` route, automatically open and load the first page of popular TMDB discovery so visitors immediately see films beyond the curated REWIND catalogue. Keep the discovery toggle in the hero so a visitor can close the section.
- Discovery remains after the existing REWIND catalogue and keeps its existing genre/year/rating filters, API pagination, localized content, and explicit Add action. The initial TMDB request is read-only; only the user's Add action imports a selected title into REWIND.
- Keep the Figma-matched local catalog anchors at 1440px (filters y=294, first poster y=607, pagination y=2502). The visible TMDB section intentionally extends the page below the source footer position; update the parity note to call this a product choice for automatic discovery, not an accidental layout mismatch.
- Moving focus to the discovery heading happens only when the visitor explicitly opens it, not during automatic page load. Closing restores focus to the toggle.
- A shared URL with any `tmdbPage`, `tmdbGenreId`, `tmdbYear`, or `tmdbMinRating` parameter opens the panel. A title query of at least two characters uses title search and hides discovery.
- On a 393px viewport, the toggle has a 44px target and the page has no horizontal overflow.
- Browser coverage verifies automatic open/fetch, explicit close/focus, deep link, title-search and browser-history transitions, guest login behavior, desktop catalogue anchors, and mobile sizing/overflow.
