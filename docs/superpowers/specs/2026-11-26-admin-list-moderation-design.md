# Admin list editing and report review

## Goal

Implement the paired Figma screens “Edit List” (`1344:6018`) and “Edit Reported List” (`1390:3326`) as one data-backed Admin detail screen that works locally and can later be published with the existing GitHub Pages + Supabase setup.

## Source and existing data

Both source frames are 1440px Admin layouts with shared hero/navigation and an editor card. The editor shows list owner, creation date, title, visibility, editable list text, film artwork, and change history. The reported variant adds the selected report reason, count of open reports, and a resolve action. Both expose delete and block-author actions; the film strip has an add control.

Existing tables already hold all required data: `rewind.lists`, `rewind.list_items`, `rewind.movies`, `rewind.list_likes`, `rewind.list_reports`, `rewind.users`, and `rewind.admin_audit_logs`. Existing Admin APIs already hide/show and delete custom lists, deactivate users, and dismiss reports. Do not add a migration or apply changes to hosted data.

## Behavior

- A detail API read returns the list, owner, creation timestamp, like count, up to four ordered published-film previews, open-report count, optional selected open report, and recent list-targeted audit history.
- Only Admin identities accepted by the existing `beginAdminTransaction` flow can use detail or mutation routes. Invalid IDs, missing lists, invalid/closed report IDs, and system lists receive explicit errors.
- Admins can update a custom list's name and description. Changes are transactional, update `updated_at`, and create an `admin_audit_logs` entry containing only the changed fields (not full private content).
- Existing visibility, delete, deactivate, and report-dismiss endpoints remain the sources of truth for those actions. The detail screen uses confirmations for delete and author deactivation.
- The add-film control opens a local search using the existing Admin movie catalog. Adding a movie uses a new Admin-only repository method, rejects unpublished movies and duplicates, appends the next position, and records an audit action.
- The normal and reported-list frames use the same detail component. Report-only fields and resolve action appear only for a valid selected open report.
- Dynamic list/user/movie/report values come from the API. Figma example names, dates, report counts, and posters stay in test fixtures only.
- No API call, migration, database mutation, or deployment is executed against production in this implementation.

## Verification

- Edge route tests cover Admin authorization, method validation, malformed IDs/bodies, invalid report/list relationships, and success responses.
- Repository tests cover safe query filtering, ordered published preview films, open report/like counts, transaction/audit behavior, duplicate/unpublished movie rejection, and system-list protection.
- UK and EN Playwright fixtures cover both entry routes, content, edit/save/reload, visibility, add-film, report resolution, delete/block confirmation, error/retry, focus, and mobile overflow.
- Run the focused Deno tests, focused Admin list Playwright tests, frontend typecheck/build, matrix parser, and `git diff --check`.

## Out of scope

- Schema changes, hosted SQL or data edits, production Edge/Pages deployment, changing current Admin role policy, or inventing report states beyond the existing `OPEN`/resolved model.
