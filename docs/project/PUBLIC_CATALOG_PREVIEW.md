# REWIND public catalogue preview

The first public preview uses only the existing GitHub Pages repository and Supabase Free project. It publishes a read-only movie catalogue in Ukrainian and English.

## Available

- Browse and search 50 movies across 17 genres, with 153 movie-to-genre links. Filter by genre, release year, minimum community rating, and sort by newest or top rated.
- Open movie details with available poster/backdrop, release date, runtime, plot, age rating, IMDb ID, cast, directors, external ratings, and similar movies.
- Open linked actor/director pages with catalog filmographies, title/year/rating filters, and actor character names.
- The imported public metadata includes 383 actors / 400 cast links, 52 directors / 54 film links, 50 external ratings, and 300 similar-movie links.
- Supabase Edge Function routes: `GET /api/genres`, `GET /api/movies/search`, `GET /api/movies/{id}/details`, `GET /api/actors/{id}`, and `GET /api/directors/{id}`.
- Successful public catalogue GET responses use a five-minute browser/shared cache with stale-while-revalidate; failures and missing records remain `no-store`.
- REWIND tables live in the private `rewind` schema. All 9 catalogue tables have RLS enabled with a SELECT policy for `rewind_edge_reader` only. This NOLOGIN role has no `BYPASSRLS`; `anon` and `authenticated` have no schema or table grants. Direct PostgREST access to `rewind` returns HTTP 406.

## Not available in this preview

Accounts, sign-up, password recovery, profiles, reviews, lists, social features, and all write operations are not part of the preview. Private account and user-generated data were not copied to Supabase. The regular local MySQL Compose setup remains separate.

## Deployment

Public URL: <https://anton5267.github.io/rewind-letterboxd/>. The root route returns HTTP 200; GitHub Pages serves the app shell through `404.html` for direct deep links, verified by a phone-sized Playwright run. Edge Function v8 returns extended film metadata and actor/director filmographies, with five-minute caching for successful public reads.

After commit `5f21893`, GitHub Pages Actions run [41894765919](https://github.com/anton5267/rewind-letterboxd/actions/runs/41894765919) completed successfully. A live phone-sized Playwright flow passed **1/1**, covering genre filter, title search, deep-link detail, runtime, cast, and external rating with no browser page errors.

`.github/workflows/deploy-pages.yml` builds the static frontend with the GitHub project base path, Supabase Function URL, and repository variable `SUPABASE_PUBLISHABLE_KEY`. The Supabase database URL is available only to the Edge Function and is never included in the frontend build. Pushes to `master` that touch frontend files or this workflow deploy through GitHub Pages Actions.

Checks completed: Edge Function handler tests (11/11), Deno type check, isolated PostgreSQL schema/seeds/RLS/read-only-role/API integration, live Supabase API and privilege checks, Supabase security advisor (no findings), frontend production build, and a phone-sized browser flow (1/1) that opens an actor's filmography from a movie page.

After commit `35f3d8f`, GitHub Pages deployment [41897920751](https://github.com/anton5267/rewind-letterboxd/actions/runs/41897920751) and CI [41897920700](https://github.com/anton5267/rewind-letterboxd/actions/runs/41897920700) succeeded. The same phone-sized E2E passed **1/1** against the public site and live Supabase API. A direct actor deep link also rendered correctly through the Pages `404.html` SPA fallback with no browser errors; GitHub Pages returns HTTP 404 for that deep URL while serving the app shell.

After commit `72a35d5`, GitHub Pages deployment [41898840285](https://github.com/anton5267/rewind-letterboxd/actions/runs/41898840285) and CI [41898840124](https://github.com/anton5267/rewind-letterboxd/actions/runs/41898840124) succeeded. A live phone-sized Playwright flow passed **1/1**, covering the year and minimum community rating filters together, genre and title search, movie details, cast, and actor filmography against the public Pages app and Supabase API.

Edge Function v8 deployed the cache policy for successful public catalog reads. Four live API checks (genres, movie search, details, and actor filmography) returned HTTP 200 with `public, max-age=300, stale-while-revalidate=600`. Errors remain uncached; local Edge handler tests passed **11/11**, Deno typecheck and isolated PostgreSQL/RLS/API integration passed. No database schema or catalogue data changed.

This is a limited catalogue preview, not a production release of the full REWIND application.
