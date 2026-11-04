# REWIND public catalogue preview

The first public preview uses only the existing GitHub Pages repository and Supabase Free project. It publishes a read-only movie catalogue in Ukrainian and English.

## Available

- Browse and search 50 movies across 17 genres, with 153 movie-to-genre links.
- Open movie details and view available poster, release date, community rating, and genres.
- Supabase Edge Function routes: `GET /api/genres`, `GET /api/movies/search`, and `GET /api/movies/{id}/details`.
- REWIND tables live in the private `rewind` schema. The Edge Function assumes a database role that can only select from the three catalogue tables.

## Not available in this preview

Accounts, sign-up, password recovery, profiles, reviews, lists, social features, and all write operations are not part of the preview. Private account and user-generated data were not copied to Supabase. The regular local MySQL Compose setup remains separate.

## Deployment

`.github/workflows/deploy-pages.yml` builds the static frontend with the GitHub project base path, Supabase Function URL, and repository variable `SUPABASE_PUBLISHABLE_KEY`. The Supabase database URL is available only to the Edge Function and is never included in the frontend build. Pushes to `master` that touch frontend files or this workflow deploy through GitHub Pages Actions.

Local checks completed before publication: the Edge Function handler tests (8/8), Deno type check, isolated PostgreSQL schema/role/API integration, live read-only Supabase API smoke, frontend production build, and a phone-sized browser flow (1/1).

This is a limited catalogue preview, not a production release of the full REWIND application.
