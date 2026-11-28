# Featured Lists empty state

## Context

The public Supabase project currently has no public lists. On the Featured Lists route, the UI renders all three category headings and repeats the same generic “No public lists yet” message under every heading. This makes a valid empty database look like a broken or duplicated feed.

## Decision

- When the featured feed is empty, show one localized, accessible empty-state message in place of the three category sections.
- When the feed contains lists, render only categories that contain real returned lists. Keep the existing category order, cards, layout, and Figma geometry for populated data.
- Keep the content read-only and data-driven. Do not create sample or curated production records.
- Do not show an empty state before the successful response for the current feed, page, locale, and navigation entry; a landing-to-featured transition keeps its loading skeleton until then.
- Error/retry behavior remains unchanged; an error shows the existing retry control and only a successful empty retry shows the empty state.

## Acceptance

- With an empty featured response, UK and EN each show one empty message, no empty category headings, and no duplicated message.
- With featured data in one category, that category and its cards render normally; empty categories are omitted.
- Loading retains its existing skeleton, and request errors retain the retry control without showing the empty state prematurely.
- No schema, API, user data, or production settings change.
