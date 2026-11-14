# REWIND — Figma design handoff

> Historical snapshot retained on 14 November 2026. Current guidance is linked from the [archive index](README.md). Old completion labels and local file paths describe their recorded date.

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
| Search and lists | See the [archived candidate snapshot](FIGMA_SCREEN_CANDIDATES_2026.md) | Candidate IDs are source pointers, not runtime acceptance. |
| Own list settings/entries | `1033:6171`, `1034:6494` | `/lists?list=:id&mode=edit`. Phone settings show an eight-poster preview with the full count and open a separate entries view. Search/add is server-paginated, with retry and existing-item protection. Original Back/Remove/Public/Tag/Drag assets are used. Controlled metadata drafts and keyboard focus survive the 767/768 breakpoint. Transitions use 160ms opacity/translation with reduced-motion opt-out. Chromium touch/keyboard/mouse and API-fixture flows passed. Ranked/unranked uses the saved mode and retains item order. |

### Person filmography filters

Fresh desktop `545:676` confirms Decade beside Genre; phone `721:1085` confirms the existing filter trigger. PersonFilmographyFilters preserves native accessible controls and separates their CSS. Decades derive from the full published filmography returned by the existing endpoint, after any server genre filter, with no extra decade request. Unknown dates remain visible under All decades. Selected decades survive genre changes, including empty results, and reset with the empty-state action or a new person. UK/EN phone/desktop fixtures and the existing 174×260 desktop grid anchor passed. Open phone controls follow the existing responsive implementation pattern. Detailed job labels, written credits, header/footer and full-frame typography parity remain open.

### Related professional filmographies

Desktop `545:676` and phone `721:1085` define separate starring/produced sections. Optional relatedPeople from the hosted API links existing catalogue IDs through positive shared TMDB IDs and published credits. RelatedPersonFilmography uses the existing endpoint independently for each additional ACTOR/DIRECTOR/PRODUCER role, sharing PersonFilmographyGrid, PersonLoading and filter controls. The phone trigger opens all fieldsets with unique ARIA IDs; each section retains its own sort/genre/decade/expansion and Retry state. UK/EN fixtures, late-response isolation, 320px overflow and legacy primary-grid geometry passed. The authenticated live Amanda Seyfried page shows both actual role sections. Producer aggregates the available catalogue role; source-specific Executive and other job distinctions still need data support.

### Person biography

Desktop `545:676`, phone `721:1085` and expanded director `736:1339` supply the biography references. PersonBiography uses a 535px/20px desktop body and 325px/12px phone body, four/three collapsed lines and a 44px More/Less target shown only for actual overflow. Expansion flows in the hero and collapse restores visible control focus. Phone biography backgrounds reach black before the text, including expanded content. API text stays plain and has its actual lang attribute; an English fallback note appears in UK UI when needed. Short/missing text and a different person reset the presentation naturally. Fixture geometry, keyboard behavior, 320px overflow and the real Amanda Seyfried More/Less controls passed. Inter and inherited page/header geometry retain their existing implementation differences.

### Community member details

Fresh contexts `605:1112` and `1517:4931` confirm 194px desktop/78–79px phone avatars, centered film/review totals, four favorite-film previews and directory watched/list/like columns. CommunityMemberCard composes UserFollowRow and keeps existing follow guards. Desktop posters use 5px gaps and 68px height, phone posters overlap at 43px height with a 44px link target. Counts/previews come from public data only. Legacy responses omit unavailable details. UK/EN fixture renders and source-scale geometry passed at 1440/393px, with overflow checks at 768/320px. Global typography/header/footer differences remain outside this block. Populated live poster acceptance remains open while public favorites are empty.

### Illustrated Journal article

Desktop source `844:1547` has a 1126×642 three-panel hero with 30px outer corners, headings, a bulleted list and 174×140 side illustrations with 20px corners. JournalCover and JournalBody render API-fed images and typed blocks, preserving legacy single-cover/plain-text articles. Separate Admin cover/block editors support image alt text, captions and ordering. URL entry follows the existing editorial workflow. Responsive phone layout is an implementation adaptation. Source-scale hero and side-image geometry, UK/EN rendering, fallbacks and editor flows passed isolated fixture checks. Complete article typography/layout parity and a real published editorial article remain open.

## Source access and export workflow

### Fresh review — 13.11.2026

Live node access confirmed 167 top-level READY frames/states. Design contexts refreshed for home (`472:492`, `1411:3473`, `473:492`, `1327:3210`), discovery (`1480:6235`, `1480:7843`, `1480:4983`, `1480:8280`), own profile (`238:865`, `896:1838`), film/person (`61:244`, `560:1003`, `545:676`, `721:1085`), search (`1480:6991`, `1480:8464`) and members (`605:1112`, `1517:4931`). This is source coverage, not acceptance of all states.

Confirmed fixes: anchor each discovery control to its poster; render the saved own-profile bio (desktop 24px / mobile 12px) and keep the duplicate overview title accessible but visually hidden; remove overlapping captions from the search poster rail; restore the original members banner from image layer `I605:1202;605:1144` as `community-members-banner.jpg`. Empty live feeds retain their genuine empty states. Own/public identity social links now reuse the saved links payload through ProfileSocialLinks (source public frame 238:596 refreshed). HTTP/HTTPS validation and accessible labels apply to every icon. Letterboxd uses the existing film glyph. An observed 24px desktop overlap was corrected by reserving bottom space for the Edit Profile button. Additional live contexts refreshed for public profile phone 825:1378, list detail 1480:6071 and list creation 1480:5182. Public bio now follows 24px/369px desktop and 12px/325px phone rules. List owner identity uses the existing ownerAvatarUrl (30px desktop, 20px phone) with an initial fallback. Settings, editor/menu variants, remaining routes and full responsive parity still need review; no blanket sign-off.

Settings sources `251:430` and `1043:2392` define the optional location/pronoun fields. The phone pronoun selector uses the original Back/Check Mark assets, nine values and 45px rows. A final “Not specified” option supports clearing. ProfilePronounField reuses the modal focus hook and keeps changes in the parent form until Save. The 393px fixture render was compared with the current frame, excluding device status/home chrome. Inter remains the implementation font. UK/EN scenarios cover keyboard selection, Escape, focus restoration, 320px header layout, resize to desktop, save/reload and clearing.

Refreshed settings overview `1043:2125`, bio editor `1043:2303` and desktop authentication `251:549`. The phone bio editor follows the 16px toolbar/text, 34px text inset and dark surface from `1043:2303`. Cancel/Escape/desktop resize discard the editor draft, Done transfers it to the parent profile form, and Save persists it through the existing API. Focus restoration, 500-character limit, 320px header and saved public rendering are covered by the existing UK/EN profile scenarios. The inactive-editor screenshot was compared with the current frame. Keyboard focus retains a visible outline.

The live file has previously been readable through the Figma connector and browser canvas; Code Layers/export quotas have varied. The former exporter directory `../../figma-codex-complete-export/` and verified local `.fig` copy are not available in this checkout. Before any refresh, check current access and follow the documented live-file workflow. Never claim a full variables export, resolved overrides, or pixel-perfect rendering from screenshots alone.

Ranked/unranked desktop sources `341:4372` / `361:592` were refreshed. Their confirmed distinction is position visibility; item order persists in both modes. A shared native checkbox with keyboard focus replaces the unavailable control and is also exposed in phone settings. Desktop numbers use the dedicated row column; phone/public numbers overlay posters. New UI lists default unranked, existing records retain numbered mode. Focused phone/desktop screenshots and geometry checks cover this block, without full-frame parity sign-off.

## Reply settings — 14.11.2026

Fresh `1049:2075` defines Anyone, Friends (people you follow) and You. ReplyPreferenceField reuses the existing modal focus hook and original Back/Check assets, with a native desktop select and 45px mobile rows. Draft changes join profile Save. The 393px fixture screenshot was compared with the source, excluding device chrome and retaining the current Inter font. API/RLS enforce the choice for new review comments. The profile hint describes review/list defaults and individual overrides. Individual review overrides are published in `0fcaddf`. The shared selector adds “Use profile setting” for an individual review or list, enabling nullable inheritance and reset. The 393px review sheet has four 45px rows, the original Back/Check assets, and a scope-specific hint. UK/EN fixtures cover cancel, failed-draft recovery, save/reload, reset, and profile selectors retaining their original three choices. List comments and overrides are published in `a9f0e35`. Fresh public-list frame `1480:6071` has no explicit comments section; the functional extension reuses the existing comment thread below its film collection. UK/EN list settings use the shared selector with distinct spacing; the 393px view has no horizontal overflow. CommentThread isolates drafts and asynchronous responses by parent kind/ID and viewer. Authenticated live creation shows all four choices; real save/comment/report acceptance remains open.

Email frame `1043:2233` and settings overview `1043:2125` were refreshed. The hosted editor follows the dark surface, 16px toolbar/text, 34px row insets and 45px row; it uses the original Back asset and the existing modal focus hook. Desktop opens a dialog and phone opens a full-height sheet. Supabase confirmation and UUID-bound synchronization replace the address after verification while retaining the other profile drafts. UK/EN editor fixtures passed 2/2; keyboard focus, cancel, retry and 393px overflow were checked. Published in `769a879`; delivery to both real addresses remains open.

## Historical records

Dated frame reviews, prior route crosswalks, detailed geometry, old exporter notes, and the full 268-candidate inventory are preserved in [Figma handoff history](FIGMA_HANDOFF_HISTORY_2026.md) and [candidate snapshot](FIGMA_SCREEN_CANDIDATES_2026.md). Use those only as historical evidence and recheck the live source before implementation.

Given/family name fields are published in `383cfeb`. Fresh contexts/screenshots for desktop `251:430` and phone `1043:2125` define paired desktop inputs and separate 45px phone rows. ProfileNameFields reuses the settings styles and existing Save flow. Both fields are optional, max 80, with name autocomplete and owner-only persistence. UK/EN fixtures cover failed drafts, save/reload/clear and a delayed previous-account save. Only the new fields were visually compared; existing form order, display-name row, remaining fields and the full settings layout retain their separate parity status. Authenticated live settings display both empty fields; no personal names were submitted.

## Avatar and banner controls — 14.11.2026

Desktop `251:660` and phone `1043:2125` guide the separate ProfileMediaSettings component. It provides image previews, JPEG/PNG selection, retry/removal and public/immediate-save feedback in UK/EN. Targeted browser checks cover phone/desktop actions, a 320px tablet banner preview, own/public banner rendering and account-switch isolation. The live authenticated form is visible. Full settings parity and a real live upload remain separate acceptance items.

## Pinned profile list — 14.11.2026

HQ source `1162:2105` describes one list and its comments at the top of a profile. Current list-card frames `1480:6383` / `1480:9718` guide the reused ListPosterStack geometry, 446×260 desktop and 325×116 phone with five posters. The owner selector joins the existing profile Save flow, and PinnedProfileList reuses CommentThread with its expand/collapse behavior. This implementation makes pinning available to all profile owners. API-provided posters remain dynamic. Targeted geometry, UK/EN save/retry/clear, privacy and account-switch checks passed. Existing surrounding profile layouts retain their separate parity status. The live selector is visible. A real live UI save remains open.
