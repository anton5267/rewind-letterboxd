# Dune review Figma fixtures

These source images are used only by `review-dune-details-figma.spec.ts`; the app continues to render movie, reviewer, and liker images from API data.

- Figma source frame: `1480:6826` (desktop); related phone frame: `1480:9249`.
- `backdrop.png`: `1480:6827` (Poster Back).
- `poster.png`: `1480:6832` (Dune poster).
- `author.png`: `1480:6874` (review author avatar).
- `avatar-80.png` through `avatar-93.png`: avatar fills referenced by the liked-member row in the source frame.

The fixtures let the local screenshot exercise the same image slots without adding Figma URLs or sample art to production code.
