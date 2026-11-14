# REWIND — Figma design handoff

**Current source:** [REWIND — implementation rules](https://www.figma.com/design/BDO9GO1oscOeUTcu4VXVKA/REWIND?node-id=5321-8872), file key `BDO9GO1oscOeUTcu4VXVKA`. Treat the live Figma file as the design source; old `.fig` and export snapshots are not proof of current frame content.

## Design acceptance rules

1. Confirm the frame ID, current visibility, variant, and rendered content in the live file. Frame names and READY labels alone do not prove route or state.
2. Record design-source match, route/state mapping, runtime behavior, and visual parity separately. Claim matched visual parity only after comparing the current frame and application at the same viewport/state.
3. Reuse existing routes, components, CSS tokens, and API contracts. Preserve UK/EN, responsive behavior, keyboard focus, loading/error/empty/retry states, and accessible labels.
4. Do not invent sample data, endpoints, actions, or unsupported Admin fields. Missing prototype links mean click behavior is unknown.
5. Keep Figma exports, screenshots, tokens dumps, and proprietary references outside Git unless explicitly approved as product assets. Do not create placeholder exports when the exporter is absent.

## Shared implementation components

Reuse these existing building blocks where the design supports them:

- [Layout and shared header/footer](../../frontend/src/layout/Layout.tsx), [Header](../../frontend/src/components/Header.tsx), [Footer](../../frontend/src/components/Footer.tsx), and [service navigation](../../frontend/src/components/ServiceNavigation.tsx).
- [Movie action sheet](../../frontend/src/components/MovieActionSheet.tsx), [rating sheet](../../frontend/src/components/RatingSheet.tsx), [pagination](../../frontend/src/components/Pagination.tsx), [retry button](../../frontend/src/components/RetryButton.tsx), [confirmation dialog](../../frontend/src/components/ConfirmDialog.tsx), and [content report action](../../frontend/src/components/ContentReportAction.tsx).

### Shared Header and Footer

Desktop sources `251:612` and `251:625` were refreshed on 14 November. The existing 184×30 logo exactly matches both exports. Header uses the original search SVG in its 24px slot, a 47×44 bordered search target, 43px Lists slot and 70% default navigation opacity with full-opacity focus/hover feedback. Footer uses the original 125×24.3291 social group. Existing routes, actual TMDB attribution, dynamic year and legal links remain part of the product implementation. Social marks retain decorative semantics because destinations are unspecified.

UK/EN geometry, image loading, search navigation and menu keyboard checks passed at 1440, 1024, 768, 393 and 320px. Inter differs from the source SF Pro Display. Full typography, background treatment, mobile icon parity and complete shared-frame parity remain open. [Dated evidence](../archive/RELEASE_EVIDENCE_2026_11.md#shared-navigation-figma-assets--14112026).

## Current code tokens

These are the active implementation tokens in [global.css](../../frontend/src/global.css), not a claim that every value matches Figma exactly.

| Group | Tokens |
| --- | --- |
| Font | `--rewind-font-sans: Inter, system-ui, sans-serif` (local variable font; weights 100–900) |
| Base colors | `--rewind-black: #000000`; `--rewind-surface: #1f1f1f`; `--rewind-surface-raised: #282828`; `--rewind-line: rgba(255,255,255,.14)`; `--rewind-muted: #aaa6a1`; `--rewind-paper: #ffffff`; `--rewind-ink: #1a1e1f` |
| Brand/accent | teal `#5a8a90`; stone `#938d7d`; amber `#d69251`; purple `#8a38f5`; cyan `#7bdff2`; gold `#d4a85f` |
| Shape/layout | radii `3px / 12px / 20px / 37px`; content width `1200px`; focus width `3px` |
| Type | display `58px`; title `24px`; section `22px`; body `20px`; caption `13px` |
| Shadow | `0 18px 40px rgba(0,0,0,.18)` |

A source comparison found differences between these code tokens and Figma's font, dark surfaces, generic radii, and content width. Keep the differences visible as a design-system gap; do not replace all page values with brand colors without a frame-specific decision.

## Frame and route anchors

| Flow | Current frame references | Route/state guidance |
| --- | --- | --- |
| Home guest/member | `472:492`, `1411:3473` / `473:492`, `1327:3210` | `/home`; keep guest and signed-in states distinct |
| Film details/actions | `61:244`, `560:1003`, `736:1107` | Existing film detail route and action sheet; `39:2` is the same film-detail template |
| Journal | Feed `604:848`; desktop article `844:1547` | `/journal` and `/journal/{slug}`. `1480:8889` is mobile search results, with no matched mobile article frame confirmed |
| Own/public profile | `238:865`, `896:1838` / `238:596`, `825:1378` | Keep owner controls separate from public profile actions |
| Auth entry | `605:2173`, `922:1788`; artwork refs `915:1598`, `911:1596` | Existing `/auth` entry links to Login/Register; splash/artwork references do not create new routes |
| Admin Movies | `1260:3772`, `1260:4840`, `1494:6790` | Route/state is not settled by the frame labels: the latest review found profile-style content and no outgoing prototype link. Preserve supported `/admin?view=movies` behavior; do not claim parity or invent fields. |
| Search and lists | See the [archived candidate snapshot](../archive/FIGMA_SCREEN_CANDIDATES_2026.md) | Candidate IDs are source pointers, not runtime acceptance. |
| Own list settings/entries | `1033:6171`, `1034:6494` | `/lists?list=:id&mode=edit`. Phone settings show an eight-poster preview with the full count and open a separate entries view. Search/add is server-paginated, with retry and existing-item protection. Original Back/Remove/Public/Tag/Drag assets are used. Controlled metadata drafts and keyboard focus survive the 767/768 breakpoint. Transitions use 160ms opacity/translation with reduced-motion opt-out. Chromium touch/keyboard/mouse and API-fixture flows passed. Ranked/unranked uses the saved mode and retains item order. |

### Person filmography filters

Desktop `545:676`, phone `721:1085`. Reuse PersonFilmographyFilters, PersonFilmographyGrid and PersonLoading. Decades filter the complete returned filmography before collapse, compose with genre/sort and retain an empty selection until reset. RelatedPersonFilmography owns independent state for each confirmed ACTOR/DIRECTOR/PRODUCER identity. Detailed Executive/job labels and written credits require data support.

### Person biography

Desktop `545:676`, phone `721:1085`, expanded director `736:1339`. PersonBiography uses 535px/20px desktop and 325px/12px phone text, four/three collapsed lines and an overflow-only 44px More/Less control. Preserve plain text, actual language, explicit English fallback, collapse focus and a readable expanded background.

### Community member details

Frames `605:1112` / `1517:4931`. CommunityMemberCard composes UserFollowRow. Avatar sizes are 194px desktop and 78–79px phone; show public film/review totals and up to four API-fed favorites. Poster height is 68px desktop with 5px gaps, 43px phone with overlap and a 44px link target. Live populated favorites remain unaccepted.

### Illustrated Journal article

Desktop `844:1547` defines a 1126×642 three-panel hero, 30px outer corners and 174×140 side images with 20px corners. Reuse JournalCover, JournalBody and the separate Admin editors. Preserve legacy single-cover/plain-text content, alt text and captions. Mobile article layout is an implementation adaptation; `1480:8889` represents mobile search results. Real editorial save and full article parity remain open.

### Profile settings

| Controls | Source | Implementation requirements |
| --- | --- | --- |
| Names, location, pronoun | `251:430`, `1043:2125`, `1043:2392` | Optional owner-only names use ProfileNameFields. ProfilePronounField retains nine values, a clearing option, original Back/Check assets and 45px phone rows. Changes join profile Save. |
| Reply preferences | `1049:2075` | ReplyPreferenceField supports ANYONE/FOLLOWED/SELF. Individual reviews/lists add nullable inheritance. Preserve modal focus, cancellation and failed drafts. |
| Email | `1043:2233`, `1043:2125` | 16px text, 34px row insets, 45px phone row. Existing focus hook, desktop dialog/phone sheet and UUID-bound confirmation flow. Two-address delivery acceptance remains open. |
| Avatar/banner | `251:660`, `1043:2125` | Separate ProfileMediaSettings, previews and immediate-save feedback. Preserve JPEG/PNG 2 MB/4096px limits. Real upload/replace/remove remains open. |
| Pinned list | `1162:2105`, `1480:6383`, `1480:9718` | PinnedProfileList reuses ListPosterStack and CommentThread. Five-poster source geometry is 446×260 desktop and 325×116 phone. All owners may pin an eligible own list. Production pin/save/reload and public→private automatic unpin passed on 14 November. |

## Source access and export workflow

### Fresh review — 13.11.2026

Live access identified 167 top-level READY frames/states and refreshed the principal home, discovery, profile, film/person, search and community sources. The dated [November review](../archive/FIGMA_REVIEW_2026_11.md) records the compared controls and viewports. Remaining differences include design tokens, typography, remaining shared header/footer parity, complete settings/article layout and unsupported states. A READY label establishes source coverage only.

The optional external exporter and old local `.fig` archive are currently absent. Use the live Figma file and focused context/screenshots. If the exporter is restored, follow repository AGENTS instructions and verify provenance before using local snapshots. Keep proprietary exports and credentials outside Git.

## Historical records

- [Detailed frame reviews and prior decisions](../archive/FIGMA_HANDOFF_HISTORY_2026.md).
- [November implementation review](../archive/FIGMA_REVIEW_2026_11.md).
- [Candidate snapshot](../archive/FIGMA_SCREEN_CANDIDATES_2026.md) and [frame inventory](../archive/FIGMA_FRAME_INVENTORY_2026.md).
- [Published text variants](../archive/PUBLISHED_DOC_VARIANTS_2026.md).
