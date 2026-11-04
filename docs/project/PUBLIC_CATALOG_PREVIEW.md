# REWIND public catalogue preview

The first public preview uses only the existing GitHub Pages repository and Supabase Free project. It publishes a read-only movie catalogue in Ukrainian and English.

## Available

- Browse and search 50 movies across 17 genres, with 153 movie-to-genre links.
- Open movie details with available poster/backdrop, release date, runtime, plot, age rating, IMDb ID, cast, directors, external ratings, and similar movies.
- The imported public metadata includes 383 actors / 400 cast links, 52 directors / 54 film links, 50 external ratings, and 300 similar-movie links.
- Supabase Edge Function routes: `GET /api/genres`, `GET /api/movies/search`, and `GET /api/movies/{id}/details`.
- REWIND tables live in the private `rewind` schema. The Edge Function assumes `rewind_edge_reader`, which can only select from the catalogue tables. `anon` and `authenticated` have no schema/table grants; direct PostgREST access to `rewind` returns HTTP 406.

## Not available in this preview

Accounts, sign-up, password recovery, profiles, reviews, lists, social features, and all write operations are not part of the preview. Private account and user-generated data were not copied to Supabase. The regular local MySQL Compose setup remains separate.

## Deployment

Public URL: <https://anton5267.github.io/rewind-letterboxd/>. The root route returns HTTP 200; GitHub Pages serves the app shell through `404.html` for direct deep links, verified by a phone-sized Playwright run. Edge Function v6 returns the extended public film metadata.

After commit `5f21893`, GitHub Pages Actions run [41894765919](https://github.com/anton5267/rewind-letterboxd/actions/runs/41894765919) completed successfully. A live phone-sized Playwright flow passed **1/1**, covering genre filter, title search, deep-link detail, runtime, cast, and external rating with no browser page errors.

`.github/workflows/deploy-pages.yml` builds the static frontend with the GitHub project base path, Supabase Function URL, and repository variable `SUPABASE_PUBLISHABLE_KEY`. The Supabase database URL is available only to the Edge Function and is never included in the frontend build. Pushes to `master` that touch frontend files or this workflow deploy through GitHub Pages Actions.

Checks completed: Edge Function handler tests (8/8), Deno type check, isolated PostgreSQL schema/seeds/role/API integration, live Supabase API and grant checks, frontend production build, and a phone-sized browser flow (1/1).

This is a limited catalogue preview, not a production release of the full REWIND application.
