# Add TMDB films to the user's Watchlist

## Goal

When an authenticated user chooses a TMDB result, make the movie available in the shared REWIND catalogue and add it to that user's Watchlist in one operation.

## Behavior

- Browsing and searching TMDB remain read-only.
- The explicit action is labeled as adding the film to the user's Watchlist.
- The Edge API imports the movie only if it is not already in the published REWIND catalogue, then inserts the user's Watchlist item in the same database transaction.
- Existing catalog movies are added to the user's Watchlist without consuming the daily new-import quota.
- Repeating the action is idempotent and never creates a duplicate list item.
- The user is sent to the canonical REWIND movie page after success.
- Guests are sent to login with their current Films URL as the return target.
- TMDB credentials remain server-side. No bulk import or background user-list writes are introduced.

## Data and security

- Use the authenticated REWIND profile ID from `beginUserTransaction`; never accept a user/list ID from the browser.
- Resolve the user's existing `WATCHLIST` system list within the transaction.
- Keep the existing RLS-protected Edge transaction and import quota behavior.
- New movie row, imported metadata, import quota record, and Watchlist item commit or roll back together.

## Acceptance

- A newly selected movie is published once and appears in the initiating user's Watchlist.
- Selecting an already published movie adds it to that user's Watchlist without duplicating it or consuming quota.
- A failed Watchlist write rolls back the new catalog movie/import record.
- The UI wording describes the result in UK and EN.
- Guest browsing remains read-only and the login return URL is preserved.

## Out of scope

- Automatically adding every discovered/search-result movie.
- Bulk importing TMDB or changing user Watchlists without an explicit user action.
- Supabase schema changes or production data modifications.
