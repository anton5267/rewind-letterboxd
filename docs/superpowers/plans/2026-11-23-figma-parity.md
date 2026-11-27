# REWIND Figma Parity Implementation Plan

> **For agentic workers:** Use the native execution method and complete each task in sequence. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit current REWIND Figma screens, close in-scope UI gaps, and verify the app locally and on GitHub Pages.

**Architecture:** Keep the existing React/Vite routes, components, CSS modules, UK/EN localization, API contracts, GitHub Pages deployment, and Supabase backend. First produce an evidence-backed screen-to-route matrix, then make focused page-family changes and finish with responsive local and hosted acceptance. Treat DRAFT designs as candidates and never invent unsupported data or actions.

**Tech Stack:** React 18, TypeScript, Vite, CSS modules, Playwright, GitHub Actions Pages.

**Spec:** `docs/frontend/FIGMA_PARITY_DESIGN.md`; source rules in `docs/frontend/FIGMA_HANDOFF.md`.

## Global Constraints

- Preserve current GitHub Pages + Supabase architecture and production data.
- Preserve UK/EN copy, URL/API contracts, access boundaries, keyboard focus, reduced motion, and loading/error/empty/retry states.
- `[READY]` frames are primary sources; `[DRAFT]` frames remain candidates until their status is evidenced.
- Do not edit designer-authored Figma frames or add unsupported endpoints, sample data, or Admin fields.
- Do not remove or overwrite pre-existing uncommitted work; the worktree already contains substantial unrelated changes.
- Use current Figma content, not historical exports, for visual acceptance; keep proprietary exports outside Git.

## Review Focus

- The matrix contains all 574 top-level names/positions; its current ID count is 569 identified and five unresolved repeated-name rows. Some restored node attributes are historical; current metadata and rendered visual review remain frame-by-frame.
- Ambiguous READY/DRAFT naming or hidden state — classify by visibility and current design evidence before mapping.
- Missing API data/actions — retain a truthful empty/disabled/error state and do not mock production behavior.
- UK/EN labels and narrow widths (320/393px) — verify wrapping, focus targets, and no horizontal overflow.
- Pages build or deploy failure — inspect CI/workflow evidence before publishing or claiming online parity.

---

## File Map

- Create `docs/frontend/FIGMA_PARITY_MATRIX.csv` — one row per top-level Figma layer row, with stable ID and exact disposition filled as evidence becomes available.
- Modify `docs/frontend/FIGMA_HANDOFF.md` — record implemented decisions, accepted adaptations, and open evidence gaps.
- Modify only the relevant `frontend/src/pages/*.tsx`, `*.module.css`, and shared components/localization files — close audited visual gaps without broad refactors.
- Modify `docs/project/PROGRESS.md` and `docs/operations/RELEASE_EVIDENCE.md` — record local and hosted acceptance precisely.
- Modify `.github/workflows/deploy-pages.yml` only if required to deploy the existing intended build; preserve the established workflow.

## Tasks

### Task 1: Produce the complete Figma audit matrix

**Files:** Create `docs/frontend/FIGMA_PARITY_MATRIX.csv`; read `FIGMA_HANDOFF.md`, `FIGMA_PARITY_DESIGN.md`, and `docs/archive/FIGMA_FRAME_INVENTORY_2026.md`.

> **Continuity correction — 26 November 2026:** The CSV has 574 rows aligned by live Figma name/position, with 569 stable IDs identified and five repeated-name IDs unresolved. Current Figma Find/selection has verified component `1164:2498` and Admin frame `1317:4617`. Current frame properties were checked for Search `1480:8934`, `1480:8889`, `1480:8856`, `1480:8804`, `1480:8767`, `1480:8709`, `1480:8594`, `1480:7083`, `1480:6991`, desktop no-results `1480:5809`, mobile Search entry `1480:8432`, and the Admin frame; `1480:8767` is visible, superseding the old archive hidden note. Historical screen-candidate family/routes were linked for 165 rows and 48 dated plan references remain historical evidence. Current metadata and visual dispositions for most restored rows still need review; Task 1 remains open until all rows have evidence-backed family/route/disposition and source/runtime review.

- [x] Capture the current Page 1 layer names and positions for all 574 root rows; initialize source status and route-family candidates.
- [ ] Retrieve and verify current metadata for all 574 Page 1 top-level rows and reconcile the name multiset. The current matrix identifies 569 stable IDs; five repeated-name rows remain unresolved. Historical geometry/visibility must not be counted as current evidence.
- [ ] Map each visible READY frame and inspect each visible DRAFT candidate; classify hidden alternatives, references, components, and archive/prototype nodes without treating them as automatic product requirements. The earlier claim that all 378 visible READY/DRAFT frames had current evidence was inaccurate; the restored rows still require current visual and route/runtime review.
- [x] Mark genuinely ambiguous or inaccessible frames explicitly; do not claim complete visual inspection where rendered context was unavailable. Nineteen repeated top-level names remain without guessed stable IDs; inaccessible or 1×1 hidden renders are explicitly recorded as evidence limits.
- [x] Cross-check matrix entries against routes in `frontend/src/App.tsx`, page components, existing handoff decisions, and archived inventory. Each row has a route/family candidate, and screen-level evidence is linked from the handoff or focused E2E where available.
- [ ] Complete the full matrix audit. Current acceptance status: 574 rows and exact ordered name/position coverage are restored from the live tree; 234 IDs in the restored segment were recovered by unique archived-name match, and a component and an Admin frame ID were confirmed live; five IDs remain unresolved; 165 candidate archive mappings and 48 dated plan notes are attached; rows 318–574 still need current metadata and visual disposition review. Require evidence-backed family/route/disposition for every row before closing Task 1.

### Task 2: Implement audited gaps by screen family

- [ ] READY desktop Search Members (`1480:7390`): live source is visible at 1440×1392 with four member rows; prior local geometry evidence matches. Reconfirm current route/data behavior before acceptance.

- [ ] READY desktop Search Tags (`1480:7445`): live source is visible at 1440×1024 and shows 13 tag chips in two rows. Verify current local UK/EN geometry and behavior before acceptance.

- [x] READY desktop Search Lists (`1480:7490`): live source is visible at 1440×1518 with two 1200×339 cards and five-poster collages. Images are delayed in Figma’s canvas; the first blank-looking capture was premature. Source order and artwork match the local deterministic fixture checks; hosted results remain dynamic.

- [x] READY desktop Search Journal (`1480:7549`): live source is visible at 1440×1149 with three 386×347 editorial cards and all three covers after the canvas finishes rendering. Source order/art matches the local deterministic fixture checks; hosted article content remains dynamic.

**Files:** Only the route components/styles named by Task 1, plus shared `frontend/src/components`, `frontend/src/layout`, `frontend/src/i18n.ts`, and `frontend/src/global.css` when evidence identifies a shared gap.

- [x] Guest desktop Home (`472:492`, 1440px): Figma shows the headline and registration CTA over the lower hero; local CSS placed the headline too low and hid the CTA in the checked viewport. Moved the desktop headline up to the measured source position and kept the existing CTA visible; a focused Playwright check passes at 1440×900.
- [x] READY 404 (`361:778`, 1440×1331): the current local composition matches the Figma source. A focused Playwright check passes at 1440px and confirms no horizontal overflow at 393px.
- [x] READY Login (`605:2175`, 1440×1614) and phone (`944:1582`, 393×852): desktop composition remains aligned; mobile form controls/links are checked against exact source positions, with password reveal/hide, focused login error, UK/EN responsive overflow, and desktop error state covered. `auth-responsive.spec.ts` passes 2/2.
- [x] READY mobile Auth Entry (`922:1788`), Register (`944:1828`) and Forgot Password (`944:1887`) reopened in live Figma at 393×852/874. Existing `/auth`, `/register`, and `/forgot-password` routes cover CTA transitions and recovery flow. Auth entry/form/recovery/registration E2E suites pass 21/21 in UK/EN. Source frames remain desktop/mobile-specific; no Supabase or production state changed.
- [x] READY mobile Search landing (`1480:8432`, 393×852): compacted six shortcut rows and their gaps to match the visible source; changed the final label to “Reviewers” while preserving its route. Focused Playwright geometry, label and navigation checks pass.
- [x] READY mobile Search no-matches (`1480:8856`, 393×852): aligned the empty-state copy/action and restored all five navigation icons to match the visible source. Focused Playwright geometry and navigation checks pass.
- [x] READY mobile condensed Search results (`1480:8464`, 393×995): aligned the poster rail, two review-card heights and spacing, show-more pill, and fixed navigation to the source geometry. API fixture text/images remain data-driven; focused Playwright geometry checks pass.
- [ ] READY mobile Search films (`1480:8594`, 393×852): live Figma currently shows the “dune” query header with a blank results area. Local `/search?tab=films` renders six API-backed results in the existing 4×2 grid; focused fixture geometry test passes, but it is not current source parity evidence. Keep this as our inferred functional fallback until the source is clarified/populated.
- [x] READY mobile Search reviews (`1480:8631`, 393×1139): matched the four 168px review-card positions and fixed bottom-nav top. Focused responsive geometry check passes.
- [x] READY mobile Search expanded all (`1480:8934`, 393×2801): source-sized long-frame review verifies exact review-film titles/art, user rows and API-backed follower counts, each list collage, journal artwork, section anchors, and overall page height. Focused `global-search-responsive.spec.ts` passes 22/22; fixture assets remain test-only.
- [x] READY desktop Search films (`1480:7256`, 1440×1062): confirmed the six-column 174×260 poster grid aligns with the source within 1.5px. Poster imagery remains API-driven.
- [x] READY desktop Search condensed all (`1480:6991`, 1440×2281): confirmed the six-poster rail and three visible 315px review cards match the source positions; the fourth result remains hidden in the condensed state.
- [x] READY desktop Search users (`1480:7390`, 1440×1392): aligned four 1200×119 user rows to y=377/534/691/848 and confirmed all rows with Playwright.
- [ ] READY desktop Search Results “reviews” (`1480:7311`): live frame is visible at 1440×2176 but currently renders a featured review, Popular reviewers, Recent news and footer, which resembles authenticated Home rather than the named Search Results tab. Existing Home fixture checks reference other node IDs; resolve this name/content/route conflict and compare this exact source before claiming parity or changing route behavior.
- [x] READY desktop Search lists (`1480:7490`, 1440×1518): confirmed two 1200×339 collection cards at y=377 and y=754.
- [x] READY desktop Search tags (`1480:7445`, 1440×1024): aligned 13 named chips across two rows, 49px tall, with 2.5px positional and 3px width tolerance for the local system font.
- [x] READY desktop Search journal (`1480:7549`, 1440×1149): aligned the three 347px editorial cards, grid positions and title line wrapping.
- [x] READY mobile Search users (`1480:8709`, 393×852): matched four 361×52 rows at y=267/343/419/495.
- [x] READY mobile Search lists (`1480:8804`, 393×852): matched two 361×189 collection cards and the 322×116 poster previews.
- [x] READY mobile Search journal (`1480:8889`, 393×1150): matched three ~361×236 article cards at y=267/527/787 and the fixed navigation position.
- [ ] READY mobile and desktop Search lists by tag (`1480:8527`, `1480:6898`): phone and desktop geometry tests exist. Current desktop source `1480:6898` is visible at 1440×2388 (x=11370, y=18085); its four cards have blank left preview areas while local runtime renders poster stacks. Reconcile this source/runtime difference before acceptance.
- [x] READY desktop Search no-matches (`1480:5809`, 1440×1039): aligned match divider, headline, hint and CTA to source y=280/377/515/610; footer begins at y=774 and focused responsive checks pass.
- [x] Classified hidden READY Search tag/review variants as hidden source alternatives, and the untagged `1480:6809` as a component-like frame rather than a standalone route.
- [x] READY Lists landing (`1480:4983`, desktop 1440×3816; `1480:8280`, phone 393×1809): aligned hero, four feed sections, creator metadata variant, tag rails, footer and fixed navigation. Focused source-size Playwright checks pass; API fixtures provide deterministic list/tag content only.
- [x] READY Film details — Dune (`61:244`, desktop 1440×3506; `560:1003`, phone 393×2244.69): aligned hero/title/poster/trailer/genres and all content headings, matched the 590×315 desktop and ~361×198 phone review cards, and matched desktop/phone similar-poster rails. Mobile cast now scrolls horizontally, movie ratings stay in the ratings section, and available people photo URLs render. Deterministic Playwright fixtures match the Figma content count and test exact source viewports plus responsive widths.
- [x] READY mobile Profile Likes / list cards (`863:2717`, 393×852): exposes the existing `list_likes` relation through a read-only paginated public-profile collection; displays only public custom lists with active owners and published preview movies. Adds a filter under the existing Likes toolbar and matches the two 361×189 source cards with five-poster rails. No schema/data migration. Edge and Spring route contracts are tested; UK/EN UI, 320/393/768/1024/1440 overflow, EN 393px geometry, `npm run verify:build`, and focused Playwright pass. On 26 Nov, Deno 2.9.6 `deno check index.ts` and the full Edge suite passed **193/193**; Java 25 Maven `UserControllerLikedListsContractTests` passed **1/1**. These are contract tests; no live DB integration was run. The older Spring/MySQL schema has no movie publication flag, so its existing visibility model remains unchanged. Local only; no deployment.
- [x] Reopened current READY Journal sources: mixed/latest `604:848`, Community `604:1172`, Awards `604:967`, Interview `604:1380`, Platform `604:1074`, Podcast `604:1275`, and Christmas Adventures article `844:1547`. Refreshed visibility, position and dimensions in the matrix; mapped category frames to the shared `/journal` filter and the article to `/journal/:slug`. Existing Journal E2E suite passes 8/8 with isolated fixtures.
- [ ] Resolve current Figma thumbnail/cover rendering inconsistency across direct selection and overview, and compare the Christmas Adventures article body/artwork against a representative API-backed record before claiming exact media parity. The local suite proves route/layout behavior with fixtures only.
- [ ] For each other in-scope READY gap, inspect the exact Figma node and current app at the same state/viewport, then change the smallest owning component/style.
- [ ] For DRAFT screens, implement only the candidate that is consistent with the approved design system and current product/API behavior; record the reason/status in the matrix and handoff.
- [ ] For missing screens, document the implementation-created layout and reuse the nearest approved REWIND patterns; maintain accessible controls and existing data states.
- [ ] Check every changed screen at 320, 393, 768, 1024, and 1440px and in UK/EN where supported; capture local screenshots for the relevant states.
- [ ] Reconcile each touched matrix row and update the handoff with accepted parity, intentional adaptation, or remaining evidence gap.

### Task 3: Local quality and acceptance

**Files:** Changed UI source and `docs/operations/RELEASE_EVIDENCE.md`.

- [x] Run `npm run verify:build` from `frontend`; TypeScript and Vite build passed after the current HQ Lists desktop/mobile work.
- [x] Run focused Playwright flows for changed screens and states; HQ Lists mobile/desktop geometry passed, along with 15 existing public-profile design, desktop, retry/focus and routing cases.
- [ ] Compare current local screenshots against source renders at matching viewports; fix visible clipping, overflow, typography, assets, and alignment before marking a row accepted.
- [ ] Record commands, outcomes, viewport/state, and links or paths to evidence; do not claim parity for unavailable or mismatched source states.

### Task 4: Publish and verify GitHub Pages

**Files:** Existing Pages workflow and release evidence only as needed.

- [ ] Confirm the current branch, remote, pending changes, workflow trigger, and repository deployment state; preserve all unrelated pre-existing work.
- [ ] Publish only the reviewed candidate through the repository’s existing CI/Pages path; do not change hosting, Supabase schema/data, or secrets.
- [ ] Wait for workflow success and verify the deployed commit and public site routes in UK/EN at representative desktop and mobile widths.
- [ ] Update `PROGRESS.md`, `FIGMA_HANDOFF.md`, and `RELEASE_EVIDENCE.md` with exact accepted results and any open limitations.

## Review gates

- The full row count and source classifications reconcile with current Figma metadata.
- Every changed route has a source reference or a documented implementation-created design.
- Existing unrelated dirty files remain untouched.
- Build, relevant browser flows, and Pages deployment provide separate recorded evidence; none alone implies full Figma parity.

## Films Discovery overview follow-up

- Sources: desktop 1480:6235 (1440×2722), mobile 1480:7843 (393×1235); route /films/discover.
- Crew Picks now displays up to eight unique film posters from existing /lists/public/team previewMovies, linked to film details. The feed retains localized loading/retry/empty behavior and adds no fixture data or endpoint.
- Focused runtime coverage checks desktop/mobile section anchors and Crew Picks poster count. Screenshots use source-sized viewports rather than full-page expansion.
- The Figma aggregate watched-film count remains unsupported by the current API and is recorded as an open data-contract gap.


## HQ Public Profile — mobile Lists — 24 November 2026

- Live READY source 1480:9718 (393×1546) maps to /users/:id?view=lists. The current view had hidden the profile identity and tabs. Mobile Lists view now retains the HQ identity hero and four collection tabs, then renders the public lists, pagination and tag cloud.
- Runtime geometry check: avatar/title/metrics y190/317/427; tabs y531; 361×164 list cards y646/847/1048; pagination y1272; tag divider/heading/chips y1339/1347/1388; fixed mobile navigation y1454.
- Added a local fixture-driven source-size browser capture at artifacts/visual-audit-20261124/crew-profile-lists/rewind-hq-en-phone-393x1546.png. Test content uses empty image URLs; API-provided artwork/content and iOS status/home indicator are therefore not claimed as pixel-matched.
- Focused HQ Lists, mobile identity and public-profile retry/navigation coverage passed 9/9. TypeScript/Vite production build and git diff --check passed.

### Desktop companion — 24 November 2026

- Live READY source `1480:6383` (1440×3236) maps to `/users/:id?view=lists`, the same HQ Lists tab as the mobile frame. Fixed desktop pagination visibility (a higher-specificity section nav rule had overridden its CSS-module hide), removed the handle row in the source-matched HQ hero, tuned hero/list/tag/footer spacing, and sized tag chips to stay on one row.
- Runtime anchors and source content match: hero y0×1020; avatar/title/metrics y274/551/768; tabs y1105; divider y1269; 1200×339 list cards y1369/1745/2121; 12-page pagination; nine collapsed tags; footer y2971. The E2E fixture now uses the exact Figma banner, avatar, all 15 posters, list titles/counts/likes/descriptions, and tags. Existing API `likeCount` is now rendered in the cards, and large follower totals use compact notation. Screenshot: `artifacts/visual-audit-20261126/public-profile-lists/local-public-lists-en-desktop-1440x3236.png`; focused E2E and TypeScript check pass.
- Desktop expanded state 1480:6501 (1440×3303) verifies that “More” reveals all 14 tags; capture `rewind-hq-en-desktop-tags-expanded-1440x3303.png`. Collapsed and expanded desktop/mobile captures are at `artifacts/visual-audit-20261124/crew-profile-lists/`. The mobile 1480:9718 frame now uses its source banner/avatar, compact X link row, and source-order poster art; likes are hidden on mobile as in Figma.
- Focused matched-size Playwright passed on mobile and desktop; the cross-surface profile suite passes 6/6. Exact desktop fixture artwork SHA-1 matches all 17 original Figma image hashes. No deployment; full Figma audit remains in progress.

## Public list detail — ranked and unranked desktop — 24 November 2026

- READY sources `1480:6134` (ranked “My Top”) and `1480:6071` (unranked “Christopher Nolan Best Films”) map to `/lists/public/:id`. Both 1440×2033 frames now render the source six-column 174×260 poster grid at y1038 and y1348, with eight ranked posters or twelve unranked posters; ranked overlays show the number at the lower-left. The list metadata card, multi-paragraph description and footer also match their frame anchors.
- E2E fixtures now include the exact source poster-layer exports: eight ranked and twelve unranked, served locally and asserted in source order with `naturalWidth > 0`. The same image sequences are covered on the corresponding phone frames. Poster art remains test-only; live production artwork remains API-driven. The API detail response still has no publication timestamp, leaving the Figma “Published … ago” line unsupported. Fixture screenshots: `artifacts/visual-audit-20261124/public-list-ranked/rewind-my-top-en-desktop-1440x2033.png` and `rewind-christopher-nolan-en-desktop-1440x2033.png`.
- `public-list-detail-figma.spec.ts` passes 8/8, including source poster loading and ordering; `npm run typecheck` passes. No deployment; full Figma audit remains in progress.

## List creation — mobile metadata and film picker — 24 November 2026

- READY sources `1480:9542` (393×894 empty metadata form) and `1480:9606` (393×852 populated film-selection step) map to `/lists`. The empty state already had the editable metadata form, tags/settings, empty-film prompt and disabled Save. The populated state now opens as its own mobile screen with search, selected posters, remove controls, and keyboard/drag plus tap reorder affordances; selected films remain local until Save.
- The existing draft E2E suite passed 3/3 against local Vite at `127.0.0.1:3003`, including the new mobile picker transition and the existing create/failure recovery flows. Capture: `artifacts/visual-audit-20261102/list-create-draft/phone-film-picker-393-desktop-chromium.png`. The fixture poster URL is null, so poster art parity is not claimed.
- No deployment; full Figma audit remains in progress.

## Public list information sheet — mobile ranked and unranked — 24 November 2026

- READY sources `1480:9494` (ranked “My Top”) and `1480:9446` (unranked “Christopher Nolan Best Films”) map to the existing mobile information dialog on `/en/lists/public/:id`. Tuned the mobile sheet to source anchors: title y489, 361×206 likes/tags card y536, six tags in two rows, and Done y761. Tag labels now match “Tagged” without `#` prefixes.
- The focused Playwright case now serves and asserts the exact blurred Figma wallpaper assets for both states (ranked SHA-1 `9460e233c31cc7dea8264c1543632a1130a4b553`; unranked SHA-1 `65932afc1f06bf39b834ecd8ebd17ad0b254e05a`). Detail-grid poster art remains null and is not claimed as matched. Corrected two source-measured layout gaps: desktop footer bottom padding (116px excess) and unranked mobile hero height (120px excess). The full focused `public-list-detail-figma.spec.ts` passes 8/8; `npm run typecheck` passes. Captures remain under `artifacts/visual-audit-20261102/public-list-detail-runtime/`. No deployment.
- No deployment; full Figma audit remains in progress.



## List creation — desktop empty and populated states — 24 November 2026

- READY sources `1480:5333` and `1480:5182` map to `/lists`. The empty form matches the desktop source anchors and adds its View list action as a non-persistent draft preview. The populated form now renders poster slots, film titles, rating stars, removal and drag/tap reorder affordances; eight selected films match the source card dimensions and first-row y=1626.
- Corrected the desktop hero's top padding from 261px to the source/test anchor of 280px; the empty Create List source title had been 19px too high.
- New fixture-driven coverage checks the 8-film state at 1440×3856. Captures: `artifacts/visual-audit-20261124/create-list-desktop/rewind-create-list-empty-en-desktop-1440x2033.png` and `rewind-create-list-populated-en-desktop-1440x3856.png`. The populated fixture now serves the eight exact source poster exports from local E2E-only files and asserts that every image loads in source order; no production poster/API data changed.
- Mobile selection remains on the separate film-picker screen; its prior regression was fixed by restoring visible metadata-row titles on phone widths. No production data or database is changed.

## Featured Lists — desktop Figma audit — 24 November 2026

- READY frame `1480:5839` (1440×3565) maps to `/lists/discover?feed=featured`. The existing route has desktop card geometry checks for the 572px hero and compact poster-led cards; its focused E2E predates this source-content audit.
- The Figma frame groups cards under “Rewind community,” “Other Top Film Lists,” and “Filmmaker Recommendations.” The production `PublicList` response is a flat page and has no category/curation-group field. I recorded this as an API gap instead of assigning groups from fixture data or guessing based on user tags. Grouped section parity remains open; no production data or API was changed.

## Popular Lists — mobile Figma audit — 24 November 2026

- READY source `1480:7927` (393×1301) maps to `/lists/discover?feed=popular`. The compact phone hero title begins at y120; section divider starts y267; four 361×189 cards align at y315/516/717/918. Each poster rail is 323×116, and the fixed navigation begins at y1209. Matched the two-line source intro and title-case film counts. The poster stack was also corrected to use the phone rail dimensions rather than desktop poster sizing.
- Focused desktop/mobile Popular Lists tests pass 2/2. Both responsive fixtures now serve the exact 20 source posters in sequence and assert each poster URL and successful image load; runtime API artwork remains live and data-driven. Mobile capture: `artifacts/visual-audit-20261124/popular-lists-phone/rewind-popular-lists-en-phone-393x1301.png`. No deployment.

## Full Films catalogue — mobile Figma audit — 24 November 2026

- READY frame `1480:9187` maps to `/films` (393×1215). Matched the divider/title and filter summary coordinates while preserving the exact 4×6 poster grid and pagination positions. The API currently supplies different films/art from this Figma sample; the screen is marked partial for content parity.
- Mobile catalog and pagination coverage passed 2/2. Capture: `artifacts/visual-audit-20261124/all-films-mobile-phone/android-chromium-uk-393x1215.png`. No deployment; full READY audit continues.

- [x] READY mobile Review / Dune / rating sheet open (1480:9407) checked against exact 393×852 Figma frame; tuned geometry and added passing fixture-driven E2E evidence. Continue with the next unreviewed READY source.

- [x] READY mobile Review / Dune / detail (1480:9249) checked at 393×932; adjusted trailer, liked-member rail, and mobile detail navigation labels; focused responsive and parity tests pass. Continue with the next unreviewed READY source.
- [ ] READY desktop Review / Dune / detail (`1480:6826`): current live frame is visible at 1440×1905 and its review/rating/likers/footer structure maps to `/en/reviews/:id`. The poster area appears blank in the current canvas while historic runtime fixtures/handoff claim poster parity; recheck source artwork and rerun desktop/mobile E2E before acceptance.

- [x] READY ranked My Top phone detail (1480:9353) reviewed and aligned; source metadata conflicts with the list model, so documented and omitted instead of fabricated. Continue with unreviewed READY screens.

- [x] READY unranked Christopher Nolan phone detail (1480:9302) reviewed; matched three film rows and 929px viewport; documented inconsistent Dune metadata and missing fixture art. Continue with remaining READY states.

- [x] READY Films full catalogue phone (1480:9187) checked at 393×1215; matched heading/divider, filter summary, 4×6 grid, pagination and navigation; API artwork differs from the Figma sample.
- [x] READY Films full catalogue desktop (1480:4797) checked at 1440×2956; matched title/divider, filters, live count, 6×6 poster geometry, pagination and footer. API count/art differ from the Figma sample; retained truthful live values.

- [x] Reopened READY mobile Popular Reviewers `1480:7698` live in Figma (visible 393×852, x=-7679/y=20311); confirmed ten reviewer rows, filter, avatar/action controls and fixed navigation. Route is `/community/reviewers`. `popular-reviewers-mobile-figma.spec.ts` passes its phone and desktop coverage on isolated fixtures; API identities/counts remain dynamic. Matrix records the current source metadata.

- [x] Reopened READY desktop Popular Reviewers `1480:5486` live in Figma (visible 1440×2850, x=607/y=22614); confirmed the 1200px reviewer table, 10 rows, metrics, pagination through 40, Popular members rail and footer. The paired test passes; its reviewer records are local fixtures, so hosted content is not asserted.
- [x] Reopened READY desktop `1480:5390` and phone `1480:7927` in live Figma; refreshed current source metadata, route (`/lists/discover?feed=popular`) and media disposition in the matrix. Desktop is 1440×2821, with four 1200×339 rows; only the first has a visible collage and the following rows are text-led. Phone is 393×1301 with four visible 323×116 poster strips. `public-lists-popular-figma.spec.ts` passes 2/2 for desktop and phone geometry/phone overflow on fixtures. Do not infer current source artwork from historical fixture assets.

- [x] READY desktop Search / all / expanded results (1480:7083) compared at 1440×4188; tuned section rhythm and page height to match all rendered category/footer anchors. Deterministic fixtures load six source film posters, four review posters, three reviewer portraits, both five-poster list previews and three journal covers. Follower/following counts are API-backed and user identities/counts stay runtime-driven. Continue remaining visible READY search sources.
- [x] READY desktop Popular Reviews (1480:4880) checked at 1440×2661; expanded reviewer rail to 13, matched pagination/footer height and added accessible sort actions to existing endpoints. Reused four exact source poster assets and matched Figma avatar image hashes for nodes 1480:4907–1480:4920 to `popular-member-01.png`–`popular-member-14.png` byte-for-byte (SHA-1); first 13 source portraits now load in order in desktop/UK+EN phone E2E checks (2/2). Live review content and footer year vary. Continue with remaining READY sources.
- [x] READY desktop Help (1062:1993) checked at 1440×4025; matched all section, image-slot, lower-card and footer anchors. All 14 local Help image assets SHA-1-match original Figma `imageHash` values; all load in the full-page local capture (`artifacts/visual-audit-20261126/help/local-help-en-desktop-1440x4025.png`). Focused service-page E2E passes 14/14.
- [x] READY desktop HQ Accounts (1162:2105) checked at 1440×1430; restored the source intro/divider/single-section layout and footer position. The body column is 900px locally to reproduce the source text wrap from its 940px text layer.

- [x] READY mobile Popular Reviews (1480:9087) checked against its 393×1265 layer geometry; four cards, reviewer rail, pagination and fixed navigation align, and mobile source-size checks pass. Figma marks the frame hidden and only returns a 1×1 export, so artwork parity remains unverified; continue remaining READY sources.
- [x] READY desktop Contact (1122:2497) checked at 1440×1733; hero and editorial structure align, fixed 22px excess in the first section, and added focused geometry assertions. No deployment.
- [x] READY mobile Crew lists / tags expanded (1480:9814) mapped to the public profile Lists state; locally verified at 393×1674 and multiple responsive widths. Visual acceptance remains partial because Figma screenshot is 1×1, fixture artwork is empty, and shared header/metric labels differ; tracked in the matrix and handoff.
- [x] READY desktop Terms (1117:2235) compared against the visible 1440×1832 source render; matched seven heading anchors, footer start and page height with Terms-scoped editorial spacing.
- [x] READY desktop Admin Settings (1404:4076) matched hero, profile, nav rail, heading, workspace, footer and 1440×2378 page geometry. The 15-control source versus four API-allowed settings remains a documented product/API gap.
- [x] READY desktop Admin Moderator Logs (1404:3804) matched the 1440×2749 frame hero, title, three audit cards, navigation rail and footer using existing API-backed audit logs.
- [x] READY desktop Admin Moderation (1399:3300) now combines reported reviews/comments/lists into one searchable table, with type-specific dismiss actions and links to the content. Kept the original unreported queue at `view=queue`; focused report/retry/shell E2E checks and frontend build pass. Local Deno tests unavailable; no deployment.
- [x] READY desktop Admin Activity (1390:4021) implemented at `view=logs` with an aggregate query, newest-user table, follower counts, notifications, and six metrics; desktop geometry/E2E/build pass. Session duration and announcement campaigns remain honestly unavailable. Moderator Logs moved to `view=moderator-logs` to keep both screens accessible. Deno tests unavailable locally; no deployment.


- [x] READY desktop More Users Activity (1393:3652) mapped to `/admin?view=more-users`: 14-row pages, server search, follower counts, status, edit and reversible deactivate controls. Desktop geometry and mobile overflow/search E2E checks pass. The destructive Figma delete glyph uses the existing account deactivation action; hard deletion is unsupported.
- [x] READY desktop Edit Reported Comment (1343:4118) added at `view=reported-comment&reportId=...`, linked from Content Reports. Edit endpoint records an admin audit action; delete requires confirmation, author block reuses account deactivation, and resolve reuses report dismissal. 1440×2314 geometry and edit-through-reload Playwright pass. Linked film/list title and up to 20 immutable audit entries now load from API; Deno tests unavailable, no deployment.

- [x] READY desktop Edit Reported Review (1317:4617) added at
iew=reported-review&reportId=..., linked from Content Reports. Rating, film, date, status, report reason/count, audited text edits, status change, delete, block and resolve actions implemented; 1440×2435 local frame and E2E pass. Backend Deno tests remain unrun because Deno is absent; no deployment.
- [x] READY desktop Reported Reviews (1319:5033) added at /admin?view=reported-reviews with three unique review cards per page and links to the edit-detail route. Card positions/heights, pagination, navigation and mobile overflow pass focused E2E. Local only; no deployment.- [x] READY desktop Reported Comments (1343:3799) added at `/admin?view=reported-comments`; three cards per page show related title, comment, reason/date, likes/replies, and route to detail. Local geometry, pagination, detail navigation and mobile overflow pass focused Playwright. Local only; no deployment.
- [x] READY desktop Film Data (1162:2305) checked at `/en/film-data`; corrected editorial wrapping/spacing and matched hero, section anchors, footer and 1440×1533 full-page frame. Mobile overflow check passes. Local only; no deployment.
- [x] READY desktop Account Deletion (1176:2515) matched at `/en/delete-account`; corrected source copy and list, added a working link to the existing profile deletion form, and verified section anchors/footer at 1440×1808 plus mobile width. Local only; no deployment.
- [x] READY desktop Safety Notice (1176:2355) matched at `/en/safety-notice`; removed duplicated contact copy and matched five section anchors/footer at 1440×1605. Mobile width passes focused Playwright. Local only; no deployment.
- [x] READY desktop Conditions (1164:2918) matched at `/en/conditions`; six section anchors, dividers, footer and 1440×2030 page height verified, plus mobile width. Local only; no deployment.

## Home / signed-in — artwork follow-up — 26 November 2026

- For READY frames `473:492` and `1327:3210`, E2E fixtures serve the six source posters in each Home rail, all four review posters, four posters in each of the three list collages, three list-author avatars, the Latest news feature cover, and Recent News artwork. `ownerAvatarUrl` was already part of the API DTO and is now rendered with the existing initials fallback. A responsive audit found and fixed the missing Recent News block at 768–1099px. Focused authenticated Playwright passes at source viewports 1440×900 and 393×852 and verifies visibility/no horizontal overflow at 320/393/768/1024/1440 in UK and EN. The shared `coverUrl` means the first Recent News card uses the feature cover rather than its separate Figma crop; a separate API field would be needed to match both views at once. No production data or Supabase changes.

## Global Search / expanded mobile — 26 November 2026

- READY frame `1480:8934` (393×2801) now has deterministic local source-art fixtures and geometry checks. Matched poster rail, four review titles/artworks, three DunaX rows with 38/15 network counts, seven tags, both five-poster collages, three journal cards, section anchors and total page height. Full `global-search-responsive.spec.ts` passes 22/22. Evidence: `artifacts/visual-audit-20261126/search-expanded-mobile/rewind-search-expanded-dune-en-mobile-393x2801.png`.
- Fixture is English sample content; user names/counts and localized live responses remain runtime/API-driven. Desktop expanded visual source artwork and the remaining search states/audit are still open. No production data or Supabase changes.

## Global Search / mobile review results — 26 November 2026

- READY frame `1480:8631` (393×1139) now verifies the four source review posters and reviewer avatars in source order, in addition to the 168px card rhythm and fixed-nav position. Focused source artwork test passes 1/1. Evidence: `artifacts/visual-audit-20261126/search-results-mobile/rewind-search-reviews-dune-en-mobile-393x1139.png`.
- This is deterministic English Dune sample content; current user/review data remains API-driven. No production data or Supabase changes.

## Global Search / mobile film results — 26 November 2026

- Current Figma frame `1480:8594` (393×852) is visible but blank beneath the “dune” match heading. Local `/search?tab=films` renders six results in a 4×2 poster grid using API-backed content. The focused fixture test covers grid geometry and image load; it does not prove current source artwork parity. Treat as an incomplete/ambiguous READY source and keep the grid as our inferred functional fallback.
- The English Dune response remains a deterministic test fixture; live search responses are unchanged. No production data or Supabase changes.

## Global Search / mobile lists and journal — 26 November 2026

- READY frames `1480:8804` and `1480:8889` now verify the exact source list poster collages and journal covers, in addition to card geometry. Lists title wrapping had caused a 15px vertical drift; a lists-tab-only mobile rule matches the 189px source card and one-line heading. Targeted Playwright passes 2/2. Evidence: `artifacts/visual-audit-20261126/search-results-mobile/rewind-search-lists-dune-en-mobile-393x852.png` and `rewind-search-journal-dune-en-mobile-393x1150.png`.
- Local English fixture only; API content remains live-driven. No production data or Supabase changes.

## Global Search / mobile People Results — 26 November 2026

- READY frame `1480:8709` (393×852) now verifies the source avatar asset across four 361×52 member rows, their 76px rhythm, and the Figma sample follower/following label. Focused Playwright passes 1/1. Evidence: `artifacts/visual-audit-20261126/search-results-mobile/rewind-search-users-dune-en-mobile-393x852.png`.
- The exported avatar is only used by the deterministic local fixture. No production data or Supabase changes.

## Global Search / desktop People Results — 26 November 2026

- READY frame `1480:7390` (1440×1392) now verifies four exact source portraits/identities and the 38/15 follower labels; each 1200×119 row aligns at y=377/534/691/848. Focused Playwright passes 1/1. Evidence: `artifacts/visual-audit-20261126/search-results-desktop/rewind-search-users-dune-en-desktop-1440x1392.png`.
- The shared header/title composition and runtime footer text/year still differ from the fixed Figma sample and are recorded as remaining parity gaps. Test-only avatar fixtures; no production data changes.

## Global Search / desktop film results — 26 November 2026

- READY frame `1480:7256` (1440×1062) now verifies all six source posters in exact order alongside the existing six-column 174×260 grid check. Focused Playwright passes 1/1. Evidence: `artifacts/visual-audit-20261126/search-results-desktop/rewind-search-films-dune-en-desktop-1440x1062.png`.
- Artwork is fixture-only; live catalog/search behavior remains unchanged.

## Global Search / desktop lists and journal — 26 November 2026

- READY frames `1480:7490` and `1480:7549` now load/verify both five-poster list collages and all three Journal covers in exact source order. Existing 1200×339 and 386×347 geometry checks remain green; targeted Playwright passes 2/2. Captures: `artifacts/visual-audit-20261126/search-results-desktop/rewind-search-lists-dune-en-desktop-1440x1518.png` and `rewind-search-journal-dune-en-desktop-1440x1149.png`.
- Fixtures only; live search results remain API-driven.

## Admin User Profile / source avatars — 26 November 2026

- READY frame `1237:4369` now uses the exact Lola James hero portrait and Liza Salvinko target avatar as local test fixtures; the E2E checks both assets load and verifies their source URLs. The 1440×3059 geometry checks still pass (1/1). Screenshot refreshed at `artifacts/visual-audit-20261125/admin-user-profile/admin-user-profile-en-1440-fixture.png`.
- Targeted notices, last-activity timestamp and permanent delete remain unsupported by the current API and are not simulated. No production data/API changes.

## Profile social-link save states — 26 November 2026

- Rechecked DRAFT UK/EN frames `5862:9034` and `5862:9010`. The shared mobile settings toolbar disabled during submission but kept the idle “Save” label, unlike the designed “Saving…” state. Updated it to use the existing localized saving label while busy.
- Extended `profile-social-links-x.spec.ts` to hold the PUT request and verify the disabled saving action, successful green status, failed red status, and their localized copy in UK/EN. Focused Playwright passes 2/2; `npm run typecheck` passes. No API or database changes.

## Search mobile source metadata — 26 November 2026

- Requeried current Figma metadata for READY frames `1480:8856` (393×852 no-matches state) and `1480:8464` (393×995 condensed results). Filled their missing node type, canvas coordinates, dimensions, and exact ID/name match in `FIGMA_PARITY_MATRIX.csv`; the matrix still parses as 574 rows.
- READY public-profile Crew Lists frame `1480:6501`: populated deterministic E2E data with the existing local Figma poster fixtures; verifies all 15 images load in source order. Focused Playwright and typecheck pass; matrix and handoff updated. No production API/data changes.
- Rechecked READY Popular Reviewers `1480:7698` and expanded Search `1480:7083`: refreshed the paginated reviewer API fixture to match the current contract; Popular Reviewers passes 2/2 and Global Search responsive passes 22/22 sequentially. Reclassified live identity/count variation as an intentional data adaptation after verifying artwork, geometry and labels; matrix and handoff updated.
- READY HQ Accounts `1162:2105`: aligned the five desktop footer link boxes to the source positions/widths using the platform SF Pro/system font stack; the focused 1440px geometry test passes. Matrix and handoff updated.

## Shared mobile Header states — 26 November 2026

- Reclassified five already reviewed visible DRAFT menu/header frames from `unclassified / unmapped` to the shared `navigation` family, with the exact state and 393px source viewport. Added the missing local CSRF/login responses to the admin-menu E2E fixture; guest and admin menu checks now pass in both locales (4/4). Matrix audit count remains 574 rows, with zero visible READY/DRAFT frames left `unclassified`.

## Expanded mobile Search — Ukrainian responsive follow-up — 26 November 2026

- Added a UK-localized check for READY frame `1480:8934`. It expands all available categories, checks the localized UI and results, and verifies no horizontal overflow at 320/393/768/1024px. Playwright passes 1/1. Capture: `artifacts/visual-audit-20261126/search-expanded-mobile/rewind-search-expanded-dune-uk-mobile-393x2801.png`. Runtime category content remains API-driven; the Figma sample is not imposed on live data.

## Desktop Search People — copy adaptation review — 26 November 2026

- Rechecked READY frame `1480:7390` from current Figma metadata and its screenshot. The four 1200×119 cards match at y=377/534/691/848. The source's `duna` query and fixed `@ 2025`/IMDb footer are intentionally replaced by the active local query and current-year/TMDB footer. Added E2E assertions for these runtime values; focused test passes 1/1. Updated the matrix and handoff with the documented adaptation instead of treating factual/current copy as a layout gap.
- READY Admin Edit Reported Reviews (`1317:4617`): moved “Change status” alongside the Status value as shown in Figma. RED/GREEN verified by `admin-moderation-reports.spec.ts` (1/1); frontend typecheck and build pass.
- READY Global Search no-results phone/desktop (`1480:8856`, `1480:5809`): live visibility and frame properties confirmed; localized route/layout, keyboard home action and responsive overflow verified. Adjusted the desktop footer geometry assertion to tolerate <1px subpixel rounding; focused suite passes 1/1.


## Current Figma source corrections — 26 November 2026

- [ ] Public profile Lists `1480:6383` (visible 1440×3236; nine tags shown) and `1480:6501` (visible 1440×3303; 14 tags shown) are now metadata-verified live and mapped to `/users/:id?view=lists`. Current live card preview areas appear blank while the runtime renders poster stacks; verify source assets before marking artwork parity accepted. Public Lists E2E passed 1/1 for desktop structure/geometry this turn.
- [ ] Films Discover desktop `1480:6235` (visible 1440×2722) and phone `1480:7843` (visible 393×1235) are now metadata-verified live. Desktop section anchors and phone runtime anchors/public-stats fallback passed 2/2; current phone Figma shows blank/numeric poster regions, so review source artwork separately. Existing aggregate watched-count API gap remains open.
- [x] Reclassified unmarked nodes `1480:6809`, `1480:6687`, `1480:6674`, `1480:6624`, and `1480:6373` as current shared component sets, not standalone routes; exact current variants and geometry are recorded in the matrix and handoff.

- [ ] Ranked/unranked desktop list details (`1480:6134`, `1480:6071`) have live-verified 1440×2033 frames and route/geometry suites passing 8/8. Current canvas no longer visibly renders poster art in the entry positions, although the runtime fixture includes source poster exports. Confirm whether this is a Figma asset-loading problem before accepting current poster parity.
- [x] Featured Lists desktop and phone (`1480:5839`, `1480:8012`) were live-reviewed 26 Nov: desktop 1440×3565 with 21 poster cards across three groups; phone 393×2019 with 20 cards across the corresponding groups. Artwork renders after Figma finishes loading. `public-lists-featured-figma.spec.ts` passes 2/2. Audit is complete; the flat API still lacks curation-group metadata, so implementation/data-contract work remains open and production membership must not be fabricated.

- [ ] Recheck desktop Auth Entry 605:2173 and Create Account 605:2176: live canvas selection rendered overlapping recovery/mobile artwork in Auth Entry and a Ukrainian forgot-password form in the frame named Create Account. Resolve whether Figma layers/rendering or the source frame identity is inconsistent before accepting desktop route parity or changing app code. Desktop Login 605:2175 and Forgot Password 605:2174 are visible with expected forms; live metadata is in the matrix.


### Members directory — current Figma source — 26 November 2026
- [x] READY desktop Members directory `605:1112` live-verified: visible, x=597/y=-4368, 1440×4201. Rendered source has Featured members, Popular this week, member film rails, directory and footer. Existing `/community` implementation covers these API-backed sections; `community-figma-geometry.spec.ts` passes 2/2 for desktop and phone fixture layout.


### Create List — current desktop and mobile source recheck — 26 November 2026
- [x] Desktop empty `1480:5333` (1440×2160) and populated draft `1480:5182` (1440×3856) are visible at x=2130/y=18066 and x=3670/y=18066. Both retain the metadata editor; populated desktop shows eight selected film poster rows.
- [x] Phone empty `1480:9542` (393×894) and selected-film draft `1480:9606` (393×852) are visible; the phone selected-film state is text-led and shows title/year/rating and rank/remove actions.
- `/lists` implements the creation state without persisting selected films until Save. `list-create-draft.spec.ts` passes 7/7 create, empty, populated, responsive and failed-save checks. Fixtures are local only. The phone source’s text-only selected film rows differ from local poster fixtures; preserve this as an explicit source/runtime visual difference during remaining parity review.


### Person pages — live mobile source recheck — 26 November 2026
- [x] READY James Cameron collapsed `731:1085` is visible at x=-5357.01/y=20276, 393×1601; expanded `736:1339` is visible at x=-5807.51/y=20276, 393×2029. The difference is the expanded biography; both show director filmography sections.
- [x] READY Brad Pitt actor `721:1085` is visible at x=-4879.01/y=20276, 393×1601, with starring and produced filmography sections. All map to the existing `people/:type/:id` route. `director-ready-figma.spec.ts`, `person-ready-figma.spec.ts` and `person-biography.spec.ts` pass 5/5. Their fixtures are local and do not prove same-record hosted content or artwork parity.
