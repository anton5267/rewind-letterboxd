# Rewind — докази перевірок

## Search and Journal targeted follow-up — 29.10.2026

Fresh Figma context/screenshots reviewed for Search populated desktop `1480:6991`, phone `1480:8464`, and no-match desktop `1480:5809`/phone `1480:8856`. The user selected the design's Back to home action. `GlobalSearch` now links to localized Home from no matches; focused Enter reached `/uk/home` and `/en/home`. The desktop empty section measured x450/y377/540px at1440, and populated rails start y377. Long nullable-poster titles are clamped inside the fallback, without overlapping captions; the full title remains the poster link's accessible name. Isolated Vite Playwright `global-search-desktop-figma.spec.ts` plus `global-search-responsive.spec.ts`:8/8 pass at UK/EN and widths320/393/600/720/768/1024/1100/1101/1440, covering category URL/focus and keyboard. Global Search category empty/error/retry tests separately passed2/2. Fixture screenshots: `artifacts/visual-audit-20261028/search-393-fixture.png` and `search-1440-fixture.png`; updated Docker no-match pair: `search-empty-393-final.png` and `search-empty-1440-final.png`. They use mock data, including deliberately long names and absent images; do not establish API content or pixel parity. `npm run verify:build` passed as technical check. Docker Desktop was restarted and web rebuilt without cache to image `c7016f64c0eb` (previous image preserved as `rewind-master-web:pre-search-20261029`); API, Redis and DB volume unchanged. Updated Docker Search/Journal/Popular/Films targeted Playwright21/21 (`docker-search-journal-final.log`), including real-API Films controls. Full Docker Playwright158/158 passed without skips (`docker-full-suite-rerun.log`); `verify-admin-browser.ps1` created and removed its scoped ADMIN fixture. Three exact leftover USER fixtures8790/8792/8805 from earlier failed attempts were verified by ID/username/email/role and removed through authenticated profile deletion; users/ratings/reviews counts for those IDs are0. The first full run144/158 is historical failure evidence, not this result.

Journal article `844:1547` and Popular Reviews targeted Playwright4/4 passed on the previously running app (`journal-reviews-final.log`). Journal cover and body no longer assert a fixed source-sample article height; dynamic content starts below cover. The current API has no rich collage/byline/inline-stills fields; live Journal feed is empty, so this is behavior/layout evidence with isolated content, not full source parity. Actual prior Docker screenshots: `artifacts/visual-audit-20261028/docker-journal-393.png` and `docker-journal-1440.png`. Build passed technically.

## Review and responsive regression follow-up — 29.10.2026

On Docker web, `review-details-responsive.spec.ts` and `release-responsive-matrix.spec.ts` passed 2/2. Review tests exercise UK/EN, complete long text, liker keyboard reachability, mobile RatingSheet Escape and focus return at 320/393/480/768/1440. The route matrix checked 14 routes at 320/393/768/1440 for page errors, overflow, main/heading and the intended mobile footer visibility. Browser fixtures are isolated from the live database. Screenshots `artifacts/visual-audit-20261028/review-393-long-content.png` and `review-1440-long-content.png` show the fixture, not visual acceptance; desktop source `1480:6826`, mobile `1480:9249` remains hidden. `npm run verify:build` passed as a technical check. Home lists failure/retry/empty targeted check also passed 1/1; other Home and full-suite failures remain open.


### Updated Docker smoke and Admin focus — 29.10.2026

The Admin user detail is a separate routed state. Its catalog row unmounts on entry, so returning previously focused the heading even when the originating row reappeared. AdminUsers now waits for the catalog request to settle and restores the equivalent View profile button by user ID; when that row is absent it focuses the Users heading. It avoids taking focus if the user has moved elsewhere. Browser fixture checks passed both paths; Admin film edit keyboard/cancel checks passed at320/1440. `admin-focus-final.log`. `npm run verify:build` passed251 modules. Rebuilt/recreated only web afterward; current web image `sha256:6a22aa5c69ab99c1dbe6b2b94767ef8500eb172b06a7e65e892ccbbdfbad73ab`. Re-ran `verify-admin-browser.ps1`:12 passed,0 skipped, fixture cleanup completed (`admin-regression-after-focus.log`).

Guest Docker smoke covers Home, Login, Register, Journal, Search and Terms at320/393/768/1440 in UK/EN:48 cases, HTTP200, overflow0, Inter and no page errors (`docker-public-smoke.json`, UK Home/Auth/Journal desktop/mobile images). Admin is covered separately above. Previously reported API/cache/reset/security/backup checks were run against the same API image; this frontend-only update does not change it.

Two scoped local commits created: `c7cb26a` backend rating/cache consistency and `aba9e03` current Figma UI; both exclude local AGENTS, secrets, audit artifacts and diploma work. Pushed to `origin/master`; CI / verify for `aba9e03` completed successfully ([run 40788011129](https://github.com/anton5267/rewind-letterboxd/actions/runs/40788011129)). Focused browser test updates, remaining full-suite fixes and cleanup remain open; CI on any later pushed commit must be checked again.


### Release scripts and mandatory Admin recheck — 29.10.2026

On the rebuilt Docker API/web, the separate `verify-admin-browser.ps1` completed12/12 without skips in34.7s using its scoped disposable ADMIN and cleanup. Updated tests exercise the current routed Admin sections, accessible confirmation dialogs and real moderation receipt/back state. Earlier failed runs remain in the ignored evidence logs and are not counted as passes. `admin-regression-final.log`.

`verify-api.ps1`, `verify-security.ps1`, `verify-contracts.ps1`, `verify-cache.ps1`, `verify-http-concurrency.ps1`, `verify-password-reset.ps1`, `verify-er-schema.ps1`, `verify-backup-restore.ps1`, production-config validation with disposable synthetic settings and `verify-caddy.ps1` passed. Password-reset used Mailpit and the wrapper removed the exact verified fixture8768; API wrapper checks exact IDs/username/email on failure cleanup. HTTP concurrency now creates and removes a separate exact target fixture, rather than following existing user1. Redis verification used movie3940 and found a positive599s TTL, at least one miss and a hit. Backup/restore compared movie/user/Flyway counts in temporary `rewind_restore_verify_3a75fc7e0578`, then cleaned the temporary database and SQL dump. These script results do not replace a passing complete browser suite. Logs under `artifacts/visual-audit-20261028/` will be archived outside Git during cleanup.


### Docker update and browser regression in progress — 29.10.2026

Completed clean `docker compose build --no-cache api web`, then `docker compose up -d --no-deps api web`. The .env SHA-256 and DB mount matched the recorded checkpoint; DB/Redis/mailpit containers were retained. New API image `sha256:c959ca8bdde16f1fe1ee69932f16d3b55378290db768983b2d7dd8e560fe08ce`, web `sha256:c5483c4210b0f87b512e474998f4d4d9d400611bda6be2be6bad05e34b879c68`. API health200. On the updated app, a fresh disposable movie and three accounts verified cached public rating NULL→2→3→4.5→4→NULL across writes/account deletions; Redis key eviction/repopulation checked at each step, nullable ProfileReview.moviePhotoUrl and phone overflow0. Movie DELETE204, all account DELETE204 and subsequent identity401. `docker-rating-cache-final.json`. No live business record was modified.

A first full Playwright execution with disposable ADMIN ran158 tests:64 passed,94 failed in19.8min, no skipped scenarios counted as passed. It is diagnostic, not release success. An independent Admin run initially reported4 passed/8 failed. Causes identified so far include old exact label selectors now colliding with password-visibility controls, old all-sections Admin navigation assumptions, native confirm expectations where accessible HTML dialogs now exist, and outdated SF/font/layout assumptions. Tests are being updated around actual user-visible behavior, with functionality, focus, error states and source geometry separately assessed; any real defect must be fixed rather than bypassed. Test files changed while the first run was executing, so only a fresh complete rerun can establish final status. A follow-up on Docker for the updated Auth and Service/Admin shell assertions passed4/4; full and mandatory Admin regression remain open.

`verify-er-schema.ps1` passed38 tables/55 foreign keys; `verify-caddy.ps1` passed; production config validation used synthetic temporary settings and passed. Other required scripts and Docker smoke remain outstanding. The unused temporary `frontend/vite.visual-audit.config.ts` was archived outside Git and removed from the worktree at the user’s request; the visual evidence is retained for review.


### Isolated backend regression and Docker preparation — 28.10.2026

Reviewed the inherited backend delta before staging: ProfileService gathers rated movie IDs before account cascade deletion, recalculates remaining averages, and evicts affected public movie details; RatingService evicts after upsert/delete, including review-driven rating changes. RatingRepository query and ProfileReviewContractTests constructor adaptation belong to this observed stale-rating repair. These changes address the earlier documented account-deletion aggregate/cache issue, not a Figma-only contract change. Added a real integration case for average3.0 →4.0 after deleting one rated account →NULL after deleting the last. Redis manager now uses transactionAware(): eviction inside a rating/account transaction is deferred until commit, avoiding invalidation while concurrent readers still see the uncommitted transaction’s previous aggregate. Two focused tests verify no Redis eviction before commit and no eviction after rollback.

Ran `backend/.\mvnw.cmd -B test` from backend against a newly created, isolated MySQL8.4 container `rewind-redesign-test-20261028`, database `rewind_test`, loopback3318, tmpfs storage; no existing3306/3307 database was used. Actual completed Maven run:41 test classes,90 tests,0 failures,0 errors,0 skipped, BUILD SUCCESS,02:12. Evidence `artifacts/visual-audit-20261028/backend-regression.log` and summary JSON. Aggregating every XML in target initially included an older stale report; the final summary includes only classes listed by this completed run and agrees with Maven90. No stale report is counted as current evidence.

Compose config --quiet passed. Preserved previous API image `sha256:d407c60011a198e0a8d26ac400fb0eef61c4ee7ce979a40c8aacc09af451c186` and web `sha256:009f169af5818b8703532cf4a8655074c3023aae64e0908a3de79c89602f5b03` under pre-redesign-20261028 tags. Images metadata, .env hash and DB mounts recorded outside Git in sibling `.codex-backups/release-20261028/`; no secrets printed or committed. Started `docker compose build --no-cache api web`. Container replacement, Docker smoke, full158-test browser suite and verification scripts remain outstanding at this checkpoint.

Diff review found an inherited Audit Logs page-size change50→3 based on sample density. Restored50 to preserve existing pagination/business behavior; actual content grows naturally and is covered by the forthcoming Admin pagination regression. Whitespace check cleaned only task-owned docs/frontend files; unrelated diploma artifacts remain untouched.


### READY state reconciliation and final List information sheet — 28.10.2026

Reconciled93 remaining rows in the existing268-candidate matrix against fresh focused source contexts/images and current browser receipts. No full inventory regenerated. Removed generic pending labels by recording the actual supported runtime evidence, exact API/data gap, component relationship or hidden-render limitation. This is classification and evidence reconciliation, not blanket visual approval. Specific unsupported settings fields: Profile username251:478/email251:480, bio251:481, given/family251:482/486, location251:483, pronoun251:484 and replies251:472/485; mobile counterparts1043:2209/2216/2226/2228/2230/2302/2347 and1049:2026. Email editor1043:2283, pronoun1043:2429, reply preference1049:2120, bio1043:2340 and watched-date1023:2941 lack update contracts. Avatar/banner upload251:694/341:3101/341:199/341:201 and social OAuth/import341:3318/3333/3320 remain unsupported; actual avatar URL/social-link CRUD retained. No endpoint/field was invented. PopularReviewer does supply likes and optional review/watched/list counts; only extra rail/pagination is absent. Journal canonical categories map to existing query values; production Journal remains empty, populated checks remain isolated browser responses.

Explicit source-render limitations: hidden341:3866,845:1679,1480:7311/8767/8889/9087/9249/9302/9353 and Admin editor1260:4840 return1×1. They do not establish a source geometry match. Preserve documented public-list matched-width exceptions and natural API content differences. Crew1480:6383/6501/9718/9814 resolves to HQ public-profile Lists tags, not a new Crew feed.

Visible List information source1480:9494 was manually compared to actual API list19606. UKEN ×320/393/600/720/768/1024/1440 =14 focused cases: overflow0, focus stays inside with Tab, Escape returns the exact phone More trigger; desktop adaptation returns heading. Phone Done also closes. Local original heart is nonempty96px raster rendered51×51. Removed5px inner horizontal padding so at393 the card uses361px atx16, matching the source horizontal slot. Real one-tag/count/backdrop content differs from the six-tag sample; tags keep44px touch targets. No fake ranked semantics or sample content. Evidence `public-lists-journal/information-sheet-final.json` and UKEN393 final screenshots; previous authenticated likes/retry coverage remains in the earlier List block.

After expansion of the shared Service rail, all eight existing Service pages were rechecked UKEN ×seven widths =112 cases, overflow0/no page errors, correct localized active link. `service-closure/shared-rail-regression.json`. This supersedes old sidebar top-inset geometry observations while preserving the documented body/source differences. Terms/Conditions/Safety/HQ desktop and representative phone captures were manually inspected. Full regression/Docker/CI are still outstanding.


### Approved informational Service pages — 28.10.2026

User explicitly approved four informational routes: Terms `1117:2235` → `/terms`, Conditions `1164:2918` → `/conditions`, Safety Notice `1176:2355` → `/safety-notice`, HQ Accounts `1162:2105` → `/hq-accounts`. Fresh MCP structured context and source screenshots were read before implementation. All reuse ServicePage, the existing local hero artwork, Inter, the document sections and service navigation. UK/EN copy describes current capabilities. Source subscription/video-store promises, HQ analytics, pinned lists, background uploads and team management are deliberately excluded under that approval; no new API, DTO, migration, payment flow or production sample data. Footer Terms now points to the actual Terms page, while Rules remains separate.

Manual browser harness `artifacts/visual-audit-20261028/service-information-check.cjs` checked four routes × two languages ×320/393/600/720/768/1024/1440 =56 cases: document overflow0, expected localized heading and active navigation, Inter computed on each. No page errors. Actual click and keyboard Enter navigated between pages; keyboard focus had a visible solid outline. Footer exposes the localized Terms URL. Enlarging the rail initially extended it below the hero; corrected its top inset and available width. Final1440 rail bottom616, document content top713 in both languages. Desktop targets retain44px minimum height. Pairs for every page/language are in `artifacts/visual-audit-20261028/service-closure/{terms,conditions,safety-notice,hq-accounts}-{uk,en}-{393,1440}.png`; measurements in `information-pages-runtime.json`. Desktop Conditions and phone Conditions were manually inspected. No dedicated READY phone source exists for these four pages; phone composition is adaptive, not a claimed matched-width Figma comparison. Copy length, rail contents and page height intentionally differ from unsupported source features. TypeScript/Vite verify:build passed251 modules separately from visual evidence.

Additional closure evidence from this session: computed caption audit288 route/language/width cases with no readable caption below12px and overflow0 (`computed-caption-final.json`); Help's aria-hidden illustration text remains source artwork. Profile collection90 cases with real fixture lists, tags, watched/watchlist/favorites, HQ badge and API reorder passed (`profile-social/collection-state-final.json`); fixture8747 removed204 and identity401. Settings720/767 focused visible H2,768 visible H1, all overflow0; actual password change allowed subsequent login200 and Cyrillic displayName Save persisted (`profile-social/settings-state-final.json`, fixture8750 removed204/identity401). An earlier harness attempt timed out waiting for a form and was not counted as passed; its fixture8749 also removed204/identity401. Search categories/no-results and Journal categories52 cases passed (`search-category-closure.json`). NotFound10 cases UK/EN × five widths passed (`service-closure/notfound-runtime.json`). These are focused browser checks, not the full Playwright regression suite.


### Actor baked background and Person phone shell — 28.10.2026

Designer resolved the singular crop from `551:1111`: use asset `5340:4508` with cropping already baked. Fresh high-fidelity context and image for the asset and Actor `545:676` were read; the asset and owner-review phone source were refreshed again before this report. `actor-background-baked.png` is local185555 bytes. Actor desktop renders its image layer at x0/y0,1440×822 at1440, preserving its1440:822 aspect ratio responsively without the old1661px/−29px transform. The two black gradient layers from the Actor frame remain separate CSS backgrounds over the artwork, blurred112.4px and clipped to the hero so they do not shade the film grid. API portrait/name remain real David Bradley85; source biography/secondary credits remain unavailable contract fields.

At393/767 the phone still uses the existing neutral fallback because the phone source contains specific F1 artwork that the real Person API cannot supply. The supplied baked asset resolves the desktop decorative background; it is not evidence of matching that film-specific phone artwork. Shared Header/Footer are hidden only on phone Person routes; loaded, loading and error states retain contextual Back to Search.393/767/768/1024/1440 runtime had document overflow0; desktop image layer at768/1024 measured768×438.39 and1024×584.53. Director retains its own valid local artwork. Evidence and pairs: `artifacts/visual-audit-20261028/home-person/actor-baked-uk-{393,1440}.png`, viewport variant and `actor-baked-runtime.json`. The provisional desktop-background gap in earlier entries is superseded by this designer decision.

### Admin loading geometry and supported review result states — 28.10.2026

Fresh source contexts/images covered Users1218:2982 and dataset states1260:3404/1222:3530, Reviews1310:3108, Comments1342:3589, Lists1344:5249, moderation1399:3300, Logs1404:3804, user detail1237:4369, Movies1260:3772, hidden editor1260:4840 and Settings1404:4076. Compact shared shell from1178:2466 supersedes their old identity hero. Hidden editor source returns1×1; no new full-editor pixel parity is claimed. Existing Admin contracts still lack arbitrary-user creation/deletion/profile-email editing, source report queues/complaint reasons/resolution, content editing, likes/reply counts, film status/credits write fields and most system-setting fields. Those controls/values are not fabricated.

Added a shared geometry-only AdminLoading for catalogs, editor/details and settings, with no focusable placeholder descendants. Aligned remaining AdminShared/AdminUsers transitions at767/768. Runtime delayed actual requests verified24 cases (Users/Reviews/Comments/Lists/Movies/Logs ×393/768/1024/1440), followed by real loaded state.30 simulated computed-font200% cases covered six Admin sections ×360/393/768/1024/1440. Initial Users/Moderation input/fieldset minimum sizes overflowed93px at360 and60px at393; constrained controls/fieldset, rerun all30 overflow0. Earlier63 normal content cases were also clean. Evidence: `artifacts/visual-audit-20261028/admin-content/loading-text200-check.json`, `content-widths-63.json`, paired Users/Reviews loading/loaded viewport screenshots. Native browser zoom remains unobserved.

Source1319:5889 delete-success and1342:3273 hidden-success are now real result states on existing Admin Reviews, with localized status, focus and Back to reviews. They appear only after successful API operations and do not claim complaint resolution1342:3470, which has no contract. Actual fixture review4095: Hide succeeded, status gained focus, Back returned to the catalog, Restore worked; native confirmation Escape/Cancel restored the trigger; DELETE204 produced the phone success state, public404, Back focused All reviews. Long review card grew naturally to760.78px at393 with overflow0. Exact source rating SVG is local and renders intrinsic24×24. Result screenshots: `review-hidden-en-1440.png`, `review-deleted-uk-393.png`.

### Owner review detail, recovery and profile loading — 28.10.2026

Fresh377:456/1023:2343 drive the existing-route owner state `/profile?view=reviews&review=<id>`. Profile review cards now open a single owned review with Edit/Delete and an explicit link to global `/reviews/:id`. Owner identity is checked against the returned author; foreign/malformed IDs expose no editing controls. No App route or API contract was added. Save retains content on failure; success updates detail and the existing review list. Escape returns to Edit after the rendering effect. Delete uses the native confirmation then returns to `/profile?view=reviews` with success. The watched-date/rating editor1023:2837 is a separate source state; unsupported watched-date fields remain gaps.

Added guarded Retry focus and truthful aria-busy to this detail state. Repeated503/recovery focused the visible heading; malformed/foreign IDs were rejected. Profile/public-profile now share geometry placeholders for identity/posters/network/list sections; six delayed identity cases (own/public ×393/768/1440) had overflow0 and no focusable skeleton content, then settled on real responses. Owner detail at320/393/767/768/1024/1440 showed one card and overflow0; UK/EN393/1440 screenshots retained. Phone hides the large footer while retaining bottom navigation, matching1023:2343. Exact desktop/phone pencil/trash PNGs are local,96×96 natural, rendered35×35 and13×13 respectively with44px controls; currentSrc/media selection verified. Unsupported upper More behavior is not invented.

Final browser check used disposable USER8743/review4101: Save persisted via API, Escape focus returned, repeated503 and recovery focus passed, foreign actions0, invalid ID rejected, confirmation Escape passed, delete returned to the list and public404. Rating removed through the supported API before account cleanup204, /users/me401. Evidence: `artifacts/visual-audit-20261028/profile-social/owner-detail-final-check.json`, `owner-review-detail-final-{en,uk}-{393,1440}.png`, profile loading screenshots.

Cleanup audit: root/agent fixtures8735–8743 and all tested review IDs are gone; read-only SQL confirmed user/rating counts0, with all user-FK references checked for8735–8740. One inspection harness initially unregistered a held route too early; fixed its ordering and discarded that failed run. Its exact leftover ADMIN8737 was self-deleted after identity verification. No failed harness run is counted as passed.

Old Docker API still exhibits the already documented account-deletion aggregate defect: review creation also creates a rating, and account cascade left movie9.rating4.0 with zero surviving ratings. Repaired **only movie9**, guarded by id9/rating4.0/no rating rows, toNULL and evicted only `movieDetails::9`; stored/actual ratings bothNULL afterward. Later checks remove fixture ratings through the API before self-delete. Existing backend patch provenance is established by the27.10 defect evidence below; it still requires isolated tests and rebuilt-Docker verification before staging/delivery. No backend contract was added.

Technical `npm run verify:build` passed TypeScript/Vite251 modules after the current implementation. Scoped implementation diff check passed. This is not full visual closure: remaining READY mappings, actual computed small-text audit and source/API exceptions must be reconciled before full suites, Docker rebuild and GitHub/CI.

### Current designer decisions: Admin shell, personal metrics and Save destination — 28.10.2026

Fresh MCP context and image for `1178:2466` were fetched after the designer's answers and again before this report; normalized design code was unchanged. Compact shell applies to every Admin section. One shared component retains all12 labeled direct links. At1440, identity starts x120/y140 and nav y290;12 capabilities wrap to two rows, so the hero grows to430px rather than the sample390px/nine links. Mobile uses a horizontal scroll rail. Eight corresponding source SVGs are local and render at intrinsic20×20. Existing Conversations/Notifications/Journal editor/Audit log icons remain capability differences; Activity is not relabeled as audit logs. Admin Movies section stays x120/width1200, computed shift0; its transition is767/768.

Personal data uses `getAdminUserOverview(currentUser.id)` and the current user's `getPublicProfile().ratingDistribution`. One customLists count has no separate scopes/periods, so one Lists created card. Current weighted average is shown without a dated chart; unsupported growth/session/history values are unavailable. Global `getAdminDashboard()` counters are a separate Platform statistics block. No contract changes. Disposable ADMIN8726 verified watched1, watchlist1, customLists1 and mean(2,4)=3. Personal endpoint503, repeated Retry and recovery focused the visible metrics heading.

Browser:12 sections ×2 languages ×393/768/1440 =72 shell cases; Dashboard/Movies/Settings ×320/360/600/720/760/761/767/1024 =24. All96 had document overflow0,12 links and visible active items.15 simulated computed-font200% cases at360/393/768/1024/1440 exposed Settings heading/toggle wrapping; fixed and rerun all15 clean. This is not native browser zoom or full working-content parity. Focused last link was visible in the phone rail. Paired full/viewport screenshots and JSON: ignored `artifacts/visual-audit-20261028/admin-shared/`, `dashboard-uk-{393,1440}.png`, `shell-72-cases.json`, `shell-extra-24-cases.json`, `text-200-15-cases-final.json`.

Root fixture8726 was registered then promoted using exact identity/role guards; no existing role changed. Ratings removed204, self-delete204, supported /users/me401. Read-only SQL checked selected prior fixture identities and all their user-FK references, fixture reviews/lists:0. Exploratory unsupported /lists/watched/9, /lists/watchlist/10 and /auth/me returned500; corrected to actual movie-flag/profile contracts, not treated as application failures. Final integration verify:build passed TypeScript/Vite247 modules. Build is technical evidence; full suites/Docker/commits/push/CI remain open.

### Create List completion after the designer's answer — 28.10.2026

Selected empty pair `1480:5333`/`1480:9542`, populated `1480:5182`/`1480:9606`. Mobile is a standalone page; films remain local until Save. Full API success navigates to owner read-only `/lists?list=<returnedID>&mode=view`, announces success and offers explicit List Settings/Add film actions. Existing owner APIs support private/public lists; no automatic edit mode.

Failure preserves form/input/known createdID; partial film-add Retry reconciles already saved items, preventing known duplicate creation/addition. Invalid/nonowned/missing IDs show error/recovery without an editor. Actual fixtures8725/list21276 and8732/list21303 exercised create/add/partial Retry/read-only destination/explicit edit focus, then exact cleanup. Unknown successful create response cannot be reconciled without an idempotency contract; none added. Paired Create List and owner detail screenshots/JSON: outside-Git `../.codex-backups/figma-ready-20261028/`.

### Inter, shared dialogs and completed parallel runtime blocks — 28.10.2026

Inter normal/italic and OFL license are local, official-source commit353b61b9f4430d5f420d56605a6e7993e0941470. Before global application, Home font-only pairs showed UK desktop h1 width721.25→708.02 with three lines/page height preserved;393px five-line h1/page height unchanged. Chrome font inspection attributed all31 Cyrillic/numeric probe glyphs, including Ґ/Є/І/Ї, to custom Inter Variable. This was font-impact review, not Home acceptance.

Shared modal hook makes background branches inert, handles dialog stack/body locking, filters hidden/disabled focus targets, prevents programmatic outside focus and restores previous state/focus. Actual Followers and MovieActionSheet passed inert/Tab/Shift+Tab/Escape/Done/exact trigger return; no leftover inert/body lock. ConfirmDialog keeps native modal behavior.

Auth/Service:14 routes ×2 languages ×9 widths =252 geometry cases,56 simulated200% and35 entry/inline-validation cases. Actual invalid login/nonexistent recovery/invalid reset/delayed503 focus verified; persistent labels, localized linked validation, busy guards and exact local assets. Evidence `artifacts/visual-audit-20261028/auth-service/`. Reset full frame/OAuth/phone recovery gaps remain.

Search/Films/Reviews:72 public cases plus12 Review Details cases; real categories/URL/clear/keyboard/discovery filters and fixture8714 watched/rating/dialog actions with cleanup. Updated `560:1003` grows naturally around full plot and centered poster. Evidence `search-films-reviews/`. Geometry skeletons:50 cases (10 routes ×360/393/768/1024/1440) with visible placeholders/aria-busy,0overflow and no focusable skeleton descendants; release real requests →10/10 settled with no placeholders/overflow. Evidence `loading-geometry/`.

Profile/social:196 normal cases and25 simulated200% passed after reflow fixes. Actual disposable follows/messages between fixtures/notifications/settings/reviews checked, guest redirects retained. Modal background/focus verified. Extra supported public sections and absent API biography/banner/per-member metrics remain gaps; Messages/Notifications have no selected READY full frame. Evidence `profile-social/`; fixtures8731/review4094 and8732/list21303 cleaned.

Lists/Journal:72 production plus12 explicitly isolated browser-response cases passed. Natural article flow fixes long-title/200% overlap, desktop cover→excerpt85px. Live Journal EN/UK returns empty200; populated screenshots use isolated browser responses only. Filters/Retry/dialog/recovery focus verified. DTO lacks rich author/collage/inline art. Evidence `public-lists-journal/`; populated examples never enter production. Native OS keyboard/zoom and successful OS Share remain unobserved.

### Home and Person current runtime — 28.10.2026

Fresh chosen Home pairs472:492/1411:3473 and473:492/1327:3210; Person545:676/551:705,547:904,721:1085,731:1085/736:1339. Home title/review/sidebar text now flows naturally and remains readable; exact pixel-identical existing local artwork replaces duplicate exports. Person uses real film feeds/filters,12→all expansion, empty reset, loading geometry and guarded Retry focus. API lacks biography and separate produced/written feeds: do not invent sections or expandable biography text. Actual Cameron19 has2films; actor85 is existing David Bradley, since source Brad Pitt is absent.

54 guest Home/Person geometry cases and30 signed-in/200% text cases passed without document overflow. Real sort50→9, empty Comedy→All genres reset, filter Escape/focus and503 Retry/no-steal focus passed. Isolated browser-only13-film/long-UK-name response verified12→13→12 and text reflow. Loading and loaded Home poster slots both79×116 at(16,368), Person avatar slots both120×120 at(136.5,190); reduced motion disabled shimmer. USER8733 was registered only for member Home, deleted204, /users/me401 and public profile404; no ratings/reviews/follows created.

Final capture-only USER8734 was also self-deleted204, /users/me401/public404; read-only SQL confirmed8733/8734 users/lists/refresh sessions all0. The current member-home393 viewport screenshot visibly includes bottom navigation; an earlier capture observation suggesting otherwise is superseded.

Mobile Home source has bottom navigation without a large site footer. Shared Footer now hides Home through767; settled browser393/767 hidden,768/1440 visible, overflow0. Screenshots refreshed under artifacts/visual-audit-20261028/home-person/.

Person phone721:1085/731:1085 has Back/Filters without the current global bottom navigation/large footer; those shared-navigation additions remain an explicit unclosed visual gap. No claim of complete Person phone parity.

Actor background551:1111 returns singular/impossible MCP crop/transform; full-frame and raw bitmap disagree. Unconfirmed raw cover removed from production, prior background restored provisionally; designer clarification requested, not visual acceptance. Valid Director originals reused. Source screenshots/raw reference remain in ignored evidence only. Final integrated verify:build passed247 modules after Actor fallback and Home Footer changes.

### Admin Activity source-to-contract decision — 28.10.2026

Fresh `1390:4021` is directory preview plus unsupported broadcasts/average analytics; `1393:3652` expands the same directory. Neither equals audit logs. Existing Users route supports More Users `1391:4478`, search/pagination `1393:4170–4174`/`4067–4072`; pencil opens current user-profile. Name/email/isActive are existing AdminUser fields; follower totals need a separate existing social-count request.

Broadcasts `1392:3305`/`3309` and history `1393:3603`/`3615–3620` lack contracts: notifications only FOLLOW/REVIEW_LIKED for individual recipients. Session/undefined averages/deltas and distinct Admin Head privilege are absent. Arbitrary-user hard delete/profile-email edit are unsupported; deactivation is not destructive delete or pairwise blocking. Record gaps, preserve real Logs/Notifications, add no Activity route/endpoint.


### Movie Review navigation and Share follow-up — 28.10.2026

Current-source Chrome at393px confirmed Review closed MovieActionSheet and scrolled to the reviews section while keyboard focus stayed on the offscreen My actions trigger. Both the phone action and desktop Review control now call a shared local handler: close the sheet, then focus the existing enabled composer (or the focusable reviews heading if no composer exists) after dialog focus-return cleanup. Runtime recheck focused `review-content` inside the viewport at y351..501. Clipboard fallback was exercised by disabling only `navigator.share` in the inspection browser: Share copied the exact current `/en/films/9` URL and announced Saved. Native Share exists in Chrome and its cancellation produced no app error; successful OS-level sharing was not observable in headless Chrome and is not claimed.

### Review Details layout, assets and recovery — 28.10.2026

Refreshed high-fidelity context and screenshot for desktop `1480:6826`; hidden phone detail `1480:9249` and overlay `1480:9407` retain their separate mappings. The hidden overlay root and its card screenshot return1×1, so this pass uses structured child geometry, not a new visible hidden-frame parity claim. Child9439 metadata/context identifies the219×35 star rail and37/38×35 original star vectors. Downloaded those vectors, the desktop31×29 active/empty vectors and36px heart locally; the phone Favorite PNG is an exact SHA256 match to the existing MovieActionSheet asset. No asset paths were redrawn or temporary URLs shipped.

Desktop author row now uses30px avatar and20px inline author/date labels; review copy uses the frame's20px text treatment and a48px gap. The hero artwork is limited to818px with a dark fade before the body. The like/rating panel uses its original heart/stars at36px and31×29, with44px rating target. Phone RatingSheet now has the gray206px card,51px heart, original35px stars,18/14px heading/subtitle and separate56px rounded Done. Selected rating remains visually distinct. Small labels use the accessible existing muted token rather than the frame's lower-contrast gray. Header height can grow for long titles and error content scrolls on short screens. Film/review detail routes hide the desktop footer through480px, retaining the app bottom navigation; desktop footer and other route families remain unchanged. The visible full Movie Details phone frame `560:1003` was re-read and its screenshot confirms this app layout without the desktop footer.

Created temporary USER8708 and API-backed review4085 on existing film9 using the actual UI, with clearly disposable original audit text. UK/EN review runtime across320/393/600/720/768/1024/1440 had document overflow0. Author avatar measured20px on phone and30px at1440. RatingSheet stayed within viewport at320×480,393×852,600×700,720×700,768×700,1024×800 and1440×900. All downloaded assets loaded with the corresponding rendered dimensions; SVG root dimensions were preserved. Screenshots and width/bounds JSON are under ignored `artifacts/visual-audit-20261028/` (`review-en-1440-final.png`, `review-uk-393-final.png`, `rating-sheet-uk-393-final.png`). Content and poster differences are actual API data, not Figma samples.

Fixed a confirmed like-state defect: POST204 changed count to1 while the empty liked-members message remained. Successful Like/Unlike now adds/removes the current authenticated member in the displayed rail along with the count. Real POST/DELETE204 and avatar/empty transitions passed. Rating PUT200 persisted value2 via the actual GET `/movies/9/rating/me`; an exploratory GET to the unsupported `/movies/9/rating` returned500 and was not used as contract evidence. Done/Escape returned focus to More; Tab/Shift+Tab wrapped inside the sheet. Browser-only503 failures verified rating-load and like-status alerts/Retry; disabled like recovered after Retry. Review-page503 exposed focus loss to BODY; added guarded Retry focus to the error/title heading without stealing focus if the user moves elsewhere. Repeated failure focused `review-state-title`; successful keyboard Retry focused `review-title` with a visible3px cyan outline.

Cleanup: review4085 DELETE204, fixture's film9 rating DELETE204, logout204, then exact USER8708 deletion with id/username/email/role guards. Deleted1; remaining identity, review, rating and sum over every user-FK reference all0. No existing user role or existing review was modified. Final `npm run verify:build` passed TypeScript/Vite,236 modules; `git diff --check` passed for the changed implementation files. Automated suites, full frame/state closure, Docker and CI remain open.

### Movie ActionSheet local assets and real API actions — 28.10.2026

Read fresh high-fidelity context plus embedded screenshot for `736:1107`. The current phone sheet used Unicode approximations for the three51px action icons and uppercase Rate film. Downloaded the exact Eye/Favorite/Plus PNG assets into `frontend/public/images/movie-action-*.png`, replaced the approximations, used the localized Rate label and matched the phone label weight/case. All three files load at96×96 natural size and render at51×51; their callsites occupy the corresponding Watch/Like/Watchlist slots. Existing watched-toggle wording and the functional list selector remain deliberate behavior/content differences from the static sample. No temporary Figma URL is used at runtime.

Live Chrome on `/en/films/9` under disposable ADMIN8707 exercised watched/favorite/watchlist POST200 and DELETE204, rating PUT200 and DELETE204. Adding movie9 to fixture-owned list21206 showed “Film added to the list”; subsequent authenticated GET `/api/lists/21206/items` returned200 and included movie9. No action alerts. Done and Escape closed the sheet and returned focus to My actions; Tab from Done wrapped to Watched and Shift+Tab returned to Done; body overflow restored after closing. At320/393/600/700px the dialog stayed within the viewport, Done remained visible and document overflow was0. Review closed the sheet; detailed review-target focus and Share still require follow-up. Current-source screenshot: `artifacts/visual-audit-20261028/movie-actions-en-393.png`. Build passed TypeScript/Vite,236 modules. Automated suites remain deferred.

Fixture8707 was logged out via API204 and exact-deleted with id/username/email/ADMIN guards: deleted1, remaining identity0, sum across all user-FK references0. This also removed its owned lists/items. No existing user role changed. Admin evidence screenshots are in the same ignored artifact directory (`admin-settings-uk-393.png`, `admin-movies-en-1440.png`).

### Admin Movies computed geometry and navigation visibility — 28.10.2026

Figma access recovered: a new MCP session returned structured design context and the1440×3128 screenshot for `1494:6790`. Earlier UNAUTHORIZED observations are historical. Current Vite source at127.0.0.1:5173 was inspected in installed Chrome with disposable ADMIN8707 (`visual_mvs2is14@example.invalid`); fixture cleanup is tracked separately below. At viewport1440 the Movies section measured x120/width1200/right1320; computed margins were32px120px0 and left0. The existing `calc` uses the1440px containing block for100%, not the1200px section width. Thus the handoff's double-centering suspicion is disproved; no centering CSS change was made. Catalog and editor both had document overflow0 at320/393/600/720/760/761/768/1024/1440. Live catalog contains nullable posters and generated/development-like titles; no sample content was substituted. UK hero showed the localized real ADMIN role.

Found a separate confirmed defect at320px: Settings was selected but sat at x555..599 beyond the rail x20..300, scrollLeft0. Added horizontal reveal on active-view/locale changes, rail resize and keyboard focus. Recheck at all nine widths confirmed12 links, selected link visibility and document overflow0. Keyboard focus on Settings showed a2px visible outline and scrollLeft306 at320px. All12 links and mobile-profile Search are user-approved deviations from Figma. `npm run verify:build` passed TypeScript and Vite,236 modules. This was an interactive browser review, not the deferred automated suite. Full editor layout parity, other Admin states, regression, Docker and CI remain open.

### Design system frame and global token crosscheck — 28.10.2026

Fresh Figma context and screenshot for `153:2` reconfirm the current system references: SF Pro Display; sample sizes58/24/22/20/13px; surface colors `#000000`, `#1f1f1f`, `#282828`; gradient, grid and poster/card examples. `frontend/src/global.css` already maps these type samples, colors and separate small/card/pill radius tokens. Figma variables for this frame are empty, so the file exposes no additional variable definitions to import. No SF Pro font file exists in `frontend/public` or the local Windows Fonts directory; the CSS uses the system/Segoe UI fallback. The 20px swatch radius is an example in the frame, not evidence to replace all page-specific radii with one value. No source or asset change was warranted; this records token-level alignment only, not route-level visual acceptance. No build or tests.

### PublicProfile phone full-frame recheck — 28.10.2026

Fresh Figma context and exact screenshot for `825:1378` confirm a393×2355 guest PublicProfile with Back and More controls, avatar/identity, Follow, favorite films, activity/review cards, Following preview, Lists and fixed bottom navigation. Existing source geometry previously matched the hero/avatar/title/Favorites anchors at393px; the CSS retains a120px avatar and361px identity copy rail with long-name wrapping. The newly observed top-right More icon differs from the current working Search link. The generated Figma node is a visual container and does not specify its action; related frame `1033:5681` proves the Following-row sheet actions (Unfollow/Block/Go to member/Done), not the profile-level More behavior. Keep the open question explicit rather than wiring an unconfirmed action or counting this as full-page parity. No app/API/data changes, build or tests.

### Journal article full-frame and content-contract recheck — 28.10.2026

Fresh Figma context and screenshot for `844:1547` reconfirm the1440×3120 article composition: category/date/title/byline, three-image cover collage, excerpt, multiple section headings and paragraphs with inline film stills, then footer. `JournalArticleResponse` exposes one `coverUrl` and one text `content` field; `JournalArticle.tsx` renders those supported fields without substituting Figma sample content. The collage, author byline and structured inline media have no current content/API fields, so they remain explicit content-contract gaps. Existing API-backed layout and article navigation remain; no source, API, data or Figma changes, build or tests.

### Admin Movies full-frame recheck and role subtitle — 28.10.2026

Fresh Current-Copy `get_design_context` plus an exact screenshot for `1494:6790` confirms the complete1440×3128 Admin Edit Film screen: global header, Admin identity hero (avatar, name, role), admin icon rail, editor workspace and footer. This supersedes the earlier 27.10 sentence claiming the selected frame did not contain a profile-style hero; the earlier screenshot reading omitted the full composition. `AdminDashboard` already rendered identity/avatar and the icon rail, but showed “Admin Dashboard” as the hero subtitle. It now renders the authenticated role using `localizeUserRole`, preserving UK/EN localization. Existing Movie Details API data supplies genres/directors/actors for read-only display; AdminMovieWrite has no confirmed write fields for those credits, status, original language or the Figma Change actions. No unsupported controls were added. `npm run verify:build` passed TypeScript and Vite (236 modules); there is no matched-width authenticated runtime capture after this source change. No API/backend/data or automated test changes.

### Movie Details authenticated phone action sheet rebase — 28.10.2026

Fresh Current-Copy context and screenshot for `736:1107` show a distinct authenticated overlay state at393×852: a dimmed/blurred Movie Details page, title/year above a rounded dark action card, Watch/Like/Watchlist, Rate stars, Add to lists, Review and Share rows, then a separate rounded Done button. This resolves the candidate's earlier “lower-page/compact content” guess; it is an action-sheet state related to full phone frame `560:1003`. Updated the MovieActionSheet mobile structure/styles to match that composition, using the existing flag/rating/list/review/share actions and dialog focus trap. The favorite API flag is labeled with the existing localized “Like” copy used by the reference. Desktop presentation is unchanged. `npm run verify:build` passed TypeScript and Vite (236 modules). **Post-change local runtime review remains open**; prior Movie Details page geometry is separate evidence and does not establish this overlay's parity. No API/backend/data or test changes.

### Hidden Review Details phone candidate crosscheck — 28.10.2026

Fresh structured context for hidden Current-Copy `1480:9249` confirms the full phone `/reviews/:id` detail state: Dune header, Review by SilverFrame, review text and Members who liked this review above the shared bottom navigation. It is not the rating overlay. Existing exact-node/raw geometry and authenticated runtime evidence maps hidden `1480:9407` to the separate More → `RatingSheet` overlay (393×852). Corrected both candidate descriptions in `FIGMA_SCREEN_CANDIDATES.md`; no source change was warranted. `get_screenshot(1480:9249)` returned a 1×1 export because the frame is hidden, so this pass does not add fresh visual parity evidence or supersede the existing matched-source review. No build, tests, API/data changes.

### Journal canonical feed family screenshot recheck — 28.10.2026

Fresh Current-Copy context/screenshot for `604:848` confirms the1440×3560 wide-feature family: an 818px hero stage, landscape lead cover at x120/y211/514×296, featured text, author bio/avatar row, related-film collage and five regular editorial cards before the footer. `Journal.tsx` already selects the wide or portrait lead layout from the API cover image's actual orientation; `Journal.module.css` includes both frames' cover/rail geometry. The API DTO has no author biography/avatar strip, related-film art or original collage fields. Those remain data/content gaps; no Figma samples or static article content were added and no source change was warranted. Existing local source measurements remain separate from this refreshed Figma capture; no matched-width post-change runtime was made. No build or tests.

### Films Discovery genre-filter runtime mismatch — 28.10.2026

Fresh Current-Copy context for mobile `1480:7843` confirms the393×1235 Films Discovery composition: ranked poster rail, Just Reviewed poster rail, Popular Reviews cards, Crew Picks and bottom navigation. In the live EN `/films/discover` browser accessibility tree after navigation and reload, the Genre select and all17 listed options were still reported disabled, although direct GETs to `/api/genres` through both the local API (`8081`) and Vite proxy (`5173`) returned200 with17 genres. This is a runtime discrepancy requiring further reproduction and diagnosis; the direct HTTP response alone does not establish what the page's React request received. The browser viewport was not verified at393px, so no matched-width claim is made. No controls were submitted and no app/API/data changes, build or tests were made.

**Correction after screenshot-backed recheck — 28.10.2026:** A fresh screenshot and subsequent accessibility snapshot of the same loaded EN route show the Genre select and all17 options enabled; there is no genre error/Retry notice. Direct API and Vite-proxy GETs both return200 with17 genres. The earlier disabled state was transient during page loading, not a persistent filter defect. The Chrome capture was at its natural1519×639 viewport; this does not close the393×1235 Figma phone review. No source/API/data changes, build or tests.

### Global Search All desktop and expanded-results runtime — 28.10.2026

Fresh Figma context/screenshot for Current-Copy `1480:6991` confirms the desktop All-results frame is a Dune sample screen with six film posters, three review cards, a Show more results control and footer. Local EN `/search?q=film` at natural1519×639 returned152 films and101 reviews (other categories0); the initial All preview exposed6 films and3 reviews. Activating Show more expanded the live result sets to12 films and12 reviews, then moved keyboard focus to the results panel because no user/people/tag/list/journal section was present in this API response. Current dev data has unknown release years and blank poster fallbacks; it is not substituted with Figma samples. This verifies the route's collapsed-to-expanded behavior and focus landing at natural desktop width, not matched1440 geometry, content parity, UK state, phone layout, or error/retry variants. No source/API/data changes, build or tests.

### Admin Dashboard Figma screenshot and metric contract — 28.10.2026

Fresh screenshot for Current-Copy `1178:2466` confirms the1440×2669 Dashboard layout: identity hero, nine-icon workspace navigation, `Workspace` heading with three personal metric cards, a separate two-row `Key Metrics` panel, and footer. Existing `AdminDashboard` keeps the supported six global API counters in a three-column/two-row grid. The API does not expose the frame's personal watched count, average rating, list count, review engagement, session time or growth metrics; the mismatch remains a documented data gap and no values were fabricated. Guest `/en/admin` still redirects to Home, so this screenshot comparison is design-only until an authenticated Admin runtime pass. No source/API/data changes, build or automated tests.

### Auth Register current-Copy and UK/EN route recheck — 28.10.2026

Fresh Figma context/screenshot for desktop Register `605:2176` confirms the1440×1752 frame includes Create Account, Username/Email/Password, password visibility, a Sign up with Google group and Log In. Local EN and UK `/register` expose the supported localized username/email/password form, visibility toggle, 72 UTF-8-byte guidance, Create Account and Login link. No account was created or credentials entered. Google sign-up remains the documented OAuth-contract gap; the local form's route geometry is covered by the earlier matched-width checkpoint, while this recheck confirms current route content only. No source/API/data changes, build or automated tests.

### Figma node `845:1679` hidden Films variant classification — 28.10.2026

Fresh Current-Copy `get_design_context` identifies `845:1679` as “Profile Page ‘Profile’ phone - Simchuk”. `get_metadata` confirms a393×1162 frame with `hidden=true` at off-canvas x=-4892.76. The structured tree contains a `Films` heading, filter glyph, app bottom navigation and six populated rows at y123/275/427/579/731/883; each row is361×133 with four79×116 poster slots and rating marks. The screenshot exporter returns only1×1 for this hidden root. Same-named visible `1015:2131` is393×1162 and its screenshot shows the empty Films page with Back/Filter controls. This classifies `845:1679` as a hidden populated variant/legacy reference, not an active route. Its own-vs-public owner scope and prototype transition remain unresolved; the frame name alone does not establish either. Local archive provenance identifies a different file key and therefore was not used to infer this Current-Copy frame. No source/API/data changes, build or tests.

Read-only route follow-up: local EN `/users/439?view=collection&collection=watched` resolves to PublicProfile and renders the API-backed empty Watched state, with Films/Watchlist/Likes/List navigation. The currently available natural browser layout includes the full identity header; this does not establish the 393px composition or prove that hidden `845:1679` belongs to the public profile. No links/actions were activated and no user/data changed. No build or automated tests.

### Auth routes and Admin access recheck — 28.10.2026

Fresh Figma context and screenshot for desktop Login `605:2175` confirm the1440×1614 frame includes Email/Password, Remember me, Forgot password, Log in and Google sign-in. Read-only local route checks expose the supported Email/Password, visibility, Forgot password, Log in and Create one controls. UK and EN Forgot Password routes each expose the localized explanation, email field, recovery action and Register link. The absent Remember me/Google controls remain the already-approved contract gaps; no form was submitted. Direct guest navigation to `/en/admin` returned to `/en/home`, so this pass does not claim Admin frame/runtime parity; a disposable authenticated ADMIN session is required for the next Admin visual pass. No source/API/data changes, build or automated tests.

### All Films desktop matched-width pagination/footer alignment — 28.10.2026

Current-Copy Figma `1413:12611` is1440×2956: 1200px poster shell from x121/y607, six columns by six rows, 174×260 cards; pagination begins y2502 and the 265px footer begins y2691. Local `/en/films` was measured at CSS1440 after API loading completed: 36 cards, grid x120/y607/1200×1811.5, poster174.2×260.2, pagination y2502.5 and footer y2690.5; final page height is2955. The matched page initially overflowed horizontally by8px because its full-bleed hero uses `100vw`; desktop `.page` now clips that bleed at its viewport bounds, giving document width1440. The page retained the active query, sort, filters and Apply behaviors. UK/EN routes show no horizontal overflow at320/393/600/720/768/1024/1440; stabilized 1440 API state returns203 films across6 pages, unlike the Figma sample's1,154,350/40 pages. Query/sort/Apply controls and real result counts remain visible although this Figma frame uses a simpler filter summary/count bar; those working controls are retained, so this is composition alignment rather than exact control parity. `npm run verify:build` passed TypeScript and Vite (236 modules). No tests/API/data changes.

### Contact desktop matched-width and copy alignment — 28.10.2026

Current-Copy `1122:2497` metadata gives a1440×1920 frame, intro y713, first email y795, and section headings y878/1055/1254. The local UK/EN intro previously occupied two lines, shifting every section up23px. Copy was expanded with a brief direction to the FAQ and the verified support address below; it now occupies67.2px at matched1440 CSS width. The one approved `anonimua910@gmail.com` link starts at x120/y795 and has a localized accessible name; no Figma example addresses were added. UK/EN section headings now measure y877.6/1054.8/1254.3. At320/393/600/720/768/1024/1440 both languages have no horizontal overflow; the mobile email link remains within the content shell. Local document height is1879px, with the footer41px before the Figma y1655 because the design's extra archived-board note and repeated sample-address row are not implemented. `npm run verify:build` passed TypeScript and Vite (236 modules). No API or data changes; no automated tests.

### Help desktop matched-width and responsive recheck — 28.10.2026

Fresh Figma metadata for Current-Copy `1062:1993` reports1440×4025, with title/guide anchors at y280/713/975/1436/1894/2300/2707 and final illustrations around y3115. At a matched1440 CSS width, the local UK/EN pages have a1200px content shell at x120. EN heading anchors are y280/713/975.8/1437.6/1897.4/2294.2/2700, within about10px of the frame; the final illustration row begins y3108.8. The EN document is3994px tall; longer localized UK text produces4032px. This small cumulative content-height difference is retained rather than compressing translated copy. At320/393/600/720/768/1024/1440, both locales show no horizontal overflow; rows are single-column through900px, while the final guide cards become three columns at1024px. The first full-page capture initially showed blank lazy illustrations; scrolling loaded all13 local illustration assets, after which their natural dimensions were confirmed. Keyboard Tab reached the EN Films navigation link with a visible2.4px outline. No source/API/data changes, build, or tests in this recheck; prior current-worktree `npm run verify:build` passed after the Home CSS change.

### Home guest phone “Just reviewed” follow-up — 28.10.2026

Current-Copy Figma phone `1411:3473` (393×2265) places the guest “Just reviewed” title at y726 and the poster rail at y766 with ten79×116 cards and15px gaps. At a matched393px CSS viewport, local UK `/uk/home` measured section start y717.7, title y726.5, and rail y770.5; the heading now aligns with Figma and the row is4px lower. The More action keeps a44px target without overlapping the cards. The ten API-backed review links remain horizontally scrollable, with no page-level horizontal overflow; the scrollbar is hidden for the visual match. `npm run verify:build` passed TypeScript and Vite (236 modules). Current poster/title data differs from the Figma sample. No automated tests, API changes, or data changes.

### Help current frame/route content recheck — 28.10.2026

Fresh Current-Copy `1062:1993` screenshot/context confirms a1440×4025 Help page with six alternating illustrated guides followed by three compact guides for film actions, tagging, and lists. The UK local accessibility tree exposes the same nine guide topics and working routes; the natural1519px screenshot shows the existing shared service hero/sidebar. This confirms content order and route mapping, not matched geometry or full responsive/state parity. Existing localized copy/assets remain unchanged; no data, source, build, or tests changed.

### Journal feed frame duplicate crosswalk — 28.10.2026

Fresh Current-Copy Page 1 metadata shows twelve top-level Journal feed frame nodes resolving to six exact content/layout pairs: `1494:4802`/`604:848` (List1 / КК), `1494:4932`/`604:1172` (List2), `1494:5045`/`604:967` (List3), `1494:5387`/`604:1380` (List4), `1494:5182`/`604:1074` (List5), and `1494:5287`/`604:1275` (List6). Within each pair, the XML metadata has matching root dimensions, shared main section anchors, and identical category/date/title/author/body/footer text. The six unique content sets fall into the already documented wide lead + author strip and portrait lead without the strip. This classifies the second set as duplicate nodes rather than new route states; the five previously omitted `1494` aliases are added to the frame ledger. This is structural metadata evidence, not a fresh screenshot or matched local runtime comparison. No source/API/content data changed; no build or tests.

### Journal UK/EN live empty state and category control — 28.10.2026

Chrome natural-width `/uk/journal` and `/en/journal` both load the API's empty article list and empty archive with localized copy. EN `SECTION` exposes All sections, News, Awards, Community, Interviews, Platform, Podcasts, and Newsletter. Selecting News and restoring All sections keeps the control state localized; Tab shows a visible cyan outline on the REWIND brand link. This verifies current empty-state rendering and one keyboard focus target, not populated article/frame geometry or mobile parity. No data, source, tests, or production content changed.

### Contact frame and current route recheck — 28.10.2026

Current-Copy Contact `1122:2497` is1440×1920. The frame has a shared service hero/sidebar followed by the intro, support, editorial, and press sections with dividers. Local `/uk/contact` at Chrome's natural1519px width presents the same section sequence and TMDB guidance, with the user-confirmed single `mailto:anonimua910@gmail.com`; the three Figma sample addresses remain unpublished because their ownership is unconfirmed. `/en/contact` renders localized headings, lists, and sidebar. EN keyboard Tab shows a visible focus ring on the brand link. This is a natural-width structure/content check, not matched1440 geometry or full responsive proof. No source, API, email data, or tests changed.

### Home guest feature cards and icon treatment — 28.10.2026

Current-Copy Home guest frame `1413:6471` (1440×4934) shows the six service features as two rows of three rounded dark cards with icons. At Chrome's natural1519×639, UK `/uk/home` previously rendered the same localized feature content as bare three-column text; this was a visible desktop mismatch. The six cards now use saved Figma PNG icon exports (Eye `6508`, Favorite `6509`, review-lines `6518`, Star `6511`, Today `6512`, list-grid `6513`) at stable frontend paths, plus the three-column card grid. Natural-width UK and EN screenshots confirm icons, rounded surfaces, two-row composition, and localized copy. The surrounding API-backed section order remains in place; generated review/list rows and the empty Journal feed were not changed or treated as Figma content. The first implementation using hand-drawn SVGs was replaced to comply with repository Figma-source instructions. After those exports were added, `npm run verify:build` passed TypeScript and Vite (236 modules), and the rebuilt UK/EN pages were visually rechecked. No matched1440/phone comparison, tests, or data changes.

### Films Discovery fresh frame/runtime cross-check — 28.10.2026

Fresh structured Figma context for desktop `1480:6235` (1440×2722) confirms toolbar y280, six numbered popular posters from y514, Just Reviewed at y962, four review cards in two columns from y1409, and Crew Picks at y2035. The natural-width UK Chrome page at1519×639 presents the same section order and corresponding desktop composition; this is not an exact-width comparison. The Year, minimum-rating, Genre and film-search controls are present. Genre is enabled after its API request finishes. The UI's six displayed top rows are identical at `1+` and `5+` because those rows all have rating5; read-only local API queries confirm the total falls from156 to49 records at the `5+` threshold. The filter selection was reset to its default. The sample frame's poster imagery and Crew Picks content are not available from current development API data; keep those as content/API gaps. Figma's Plus layer is exported as a visual div with no configured interaction; the local affordance currently routes to film details, so that behavior is retained without claiming it matches a prototype action. No source/API/data changes, tests, or matched1440/mobile review.

### All Films desktop structure and pagination update — 28.10.2026

Current-Copy Figma `1413:12611` is1440×2956. Its populated view uses a1200px content shell, six poster columns, poster-only cards, a compact numbered page row and the shared hero/filter composition. In the local `Search`/All Films route, desktop cards now hide duplicate title/year text while retaining descriptive poster-link names; the grid row gap matches the poster-only rhythm. All Films now shows numbered page controls with an accessible current-page state and a screen-reader page status. Query, sort and existing API filter controls remain available. This is a source change guided by the frame, not a matched1440 comparison.

After Docker Desktop was started, existing Compose containers were started without rebuilding or recreating them. MySQL and Redis became healthy; API `/actuator/health` returned `UP`. Flyway validated31 migrations and reported schema version31 already current. No `.env`, DB volume, account or content was changed. UK and EN `/films` then each loaded203 API records over6 pages. Clicking UK page2 changed the URL to `?page=1` and loaded the next API page. In EN, keyboard traversal reached the first poster link with a visible cyan focus ring. Chrome remained at its natural1519px viewport. `npm run verify:build` passed TypeScript and Vite (236 modules). Runtime poster data/count (203/6) differs from the Figma sample (1,154,350/40); development data is not design evidence. Matched1440/phone comparison, query/sort visual reconciliation, empty/error/retry and remaining page states remain open. No automated tests or destructive actions.

### Films Discovery desktop frame structure review — 27.10.2026

Opened Current-Copy node `1480:6235` in the browser canvas; the inspector reports1440×2722. The frame is visible at20% zoom and appears to show a shallow discovery header with compact filter/search controls, followed by “Popular films this week” and a six-poster rail. The local natural-width `/en/films/discover` page instead shows a centered large “Discover films” title/intro hero followed by “Popular films”, and has no corresponding filter/search controls in this route. This is a suspected structural mismatch based on a reduced canvas screenshot, not a measured matched-width comparison or verified interaction map. The Figma MCP `get_design_context` call is blocked by Starter quota (`whoami`: Full seat on Starter), so do not change the implementation from this low-detail image alone. No Figma design or source code was changed; no build or automated tests.

### Films Discovery canvas and natural desktop recheck — 27.10.2026

The live Figma canvas still has the selected `Films (svergunova phone)` frame `1480:7843`; the inspector reports393×1235 and the visible frame contains the four familiar Discovery groups (Popular films, Just reviewed, Popular reviews, Crew picks) plus bottom navigation. The Figma MCP `get_design_context` call remains blocked by the Starter tool-call limit; `whoami` confirms Full seat on Starter. Local EN `/films/discover` at natural1536×639 shows the same section sequence and currently empty Crew picks. The API supplies generated concurrency-style film/review rows and many fallback-letter posters; these are development/API data conditions, not design evidence. This is a route-order and current-data check only, not matched-width parity or injected-error Retry verification. No controls or data were changed; no source changes, build or automated tests.

### Admin Dashboard Figma context and live runtime follow-up — 28.10.2026

Figma MCP returned structured context and a screenshot for Current-Copy Dashboard `1178:2466` (1440×2669). The frame shows Lola James/Admin Head identity, icon navigation, three Workspace cards, a separate six-card Key Metrics panel, and footer. The existing `/api/admin/dashboard` contract provides six site-level values (Users, Active, HQ users, Films, Reviews, Hidden reviews), not the personal watched-film, average-rating, list, review-like, session-time, watchlist and engagement data in the Figma cards. `CurrentUser` also exposes only username, role and avatar, so the sample's display name/title are not available. No sample values or identity fields were fabricated.

Created disposable ADMIN `id=8702`, signed in through the local UK/EN-capable app, and reviewed EN `/admin` at Chrome's natural1519×639 viewport. The live route rendered its identity hero, icon rail and six API counters in three columns/two rows. The first viewport and workspace screenshots qualitatively confirm the existing frame/route composition; viewport was not matched to1440, so this is not exact geometry or full design parity. No settings or product records were changed. Signed out, exact-deleted only id8702 by username/email/ADMIN role predicates; identity count0 and a dynamic scan across all29 user-FK columns reports0 remaining references. Phone, matched1440, loading/error/retry, and remaining Admin routes/states remain open. No source/API change, build, or automated tests.

### Admin Comments Figma context and live runtime follow-up — 28.10.2026

Fresh structured context/screenshot for Current-Copy Comments `1342:3589` confirms a1440px frame with the same admin hero/icon rail, Comments heading, “View Reported Comments” control, and 1200px card rail. Each sample card shows comment/author, year, likes, replies and Edit Comment. Local `/admin?view=comments` has the existing visibility filter, paginated comments, hide/delete actions and two-column author/content + moderation layout; live EN runtime under disposable ADMIN8703 returned106 comments on3 pages at Chrome's natural1519×639. The current API has no reported-comment feed, likes/replies counts or comment-edit operation, so keep these as explicit capability gaps; no inert control or fake counts were added. Runtime screenshot was not matched1440; mobile/UK and error/retry frame parity remain open. No moderation or delete action was used. Signed out and exact-deleted id8703 by username/email/ADMIN role; identity0 and dynamic scan across all29 user-FK columns reports0 references. No source/API/data changes, build or automated tests.

### Admin Comments title alignment UK/EN and fixture cleanup — 28.10.2026

The Figma Comments frame `1342:3589` labels the page “All Comments”; the local page previously used the shorter “Comments” as both navigation and page title. The page heading now uses its own localized key (`All Comments` / `Усі коментарі`), while the Admin navigation label remains concise. `npm run verify:build` passed TypeScript and Vite (236 modules). Live EN and UK `/admin?view=comments` under disposable ADMIN8704 both exposed the correct localized page heading; these were natural1519×639 runtime checks, not matched1440/mobile comparisons. No comment action was activated. Signed out and exact-deleted id8704 by username/email/ADMIN role; identity count0 and every one of the29 user-FK columns has0 references. No tests, API changes or product data mutations.

### Admin Movies editor Figma/API contract cross-check — 28.10.2026

Re-read Current-Copy `1494:6790` against `AdminMovies.tsx` and the checked-in Admin API DTOs. The editor frame shows poster/name, duration, original language/status, year, genre, description, director/cast and film-level review/popularity metrics. The existing write contract supports title, IMDb ID, duration, release date, age rating, rating, plot, poster/backdrop and trailer URLs; detail reads expose genres/directors/actors. The frontend does not expose original-language/status editing or the frame's director/cast/review/popularity statistics, and the backend has no corresponding Admin write/read fields or metric endpoint. Preserve those as explicit API/data gaps; keep supported TMDB enrichment and existing editable fields. This is frame/source/contract evidence only: no authenticated runtime or matched-width parity was performed, and no API/source/data changes, build or tests were made.

### Admin Reviews title alignment and current route state — 28.10.2026

Current-Copy Figma `1310:3108` is a1440×3401 Admin Reviews frame, not a generic public profile: its screenshot shows the Admin icon rail selected on Reviews, “All Reviews”, a “View Reported Reviews” action, and three sample review cards with user rating, edit action, likes and comments. The page title now has a dedicated UK/EN key (“Усі огляди”/“All Reviews”); the concise nav label remains “Огляди”/“Reviews”. `npm run verify:build` passed TypeScript and Vite (236 modules). Under disposable ADMIN8705, the UK and EN `/admin?view=reviews` routes displayed the localized heading and API-backed review rows; each response showed115 reviews across3 pages, at Chrome's natural1519×639 viewport. No row action was activated. The current AdminReview DTO exposes content, rating, visibility and creation date, but no reported-review queue, likes/comment counts or edit operation; these remain API gaps. Screenshot/runtime evidence is natural-width only, not matched1440/mobile parity or error/retry. Fixture8705 was signed out and exact-deleted with role guard; identity count0 and all29 user-FK references0. No tests or content changes.

### Admin Movies hidden duplicate frame mapping resolved — 28.10.2026

Fresh Current-Copy `get_design_context` and `get_metadata` calls for `1260:4840` and `1494:6790` resolve the previously conflicting Admin Movies mapping. Both roots are named “Edit Film - Sulyma Bohdan”, measure1440×3128, and have identical normalized metadata subtrees (173 node records) except `1260:4840` has `hidden="true"` and a single child coordinate differs by about0.001px from float precision. Structured context for both has the same editor fields: Name, Year, Director, Main Actors, Average User Rating, Number of Reviews, Popularity Dynamics, Genre, Description, Change Poster, Duration, Original Language, Status, Published and Change Status. Classify `1260:4840` as a hidden legacy duplicate of visible canonical `1494:6790`; it is not a separate route or variant. The earlier screenshot impression of adjacent reviewer/news content came from canvas context and is superseded. This resolves node identity only; Admin editor matched-width/runtime parity and API gaps remain open. No Figma edits, source/API/data changes, build or tests.

### Admin Users Figma context refresh — 28.10.2026

Fresh structured context and screenshot for Current-Copy `1222:3530` confirm the 1440×2098 Admin Users frame: same admin hero/navigation shell, centered User List heading and search, Add User control, and Name/Email/Role/Status table with row actions. Existing `/admin?view=users` provides a paged semantic table with search and supported role/status/HQ actions; the Add User control has no configured prototype interaction and `/api/admin/users` has no create operation, so this remains an explicit capability gap. Existing UK/EN natural-width runtime and keyboard review is documented in [Admin Users runtime evidence](#admin-users-uken-read-only-keyboard-review--27102026); it does not prove matched1440 geometry or mobile parity. No source/API/data changes, build or automated tests.

### Global Search populated UK/EN category and locale follow-up — 27.10.2026

At Chrome's natural desktop viewport, UK `q=Journey` returned five API-backed users and four lists. Keyboard selection moved between the visible desktop category selector options, updated the `tab` query parameter, and retained the selected category; the first user and list links were reached with visible focus in the earlier same-session pass. EN navigation preserved `/en/search?q=Journey&tab=lists`; the page localized the selected Lists state and rendered four list links. These records have generated/development-like labels and are not Figma sample content. A fresh EN `q=avatar` query returned two API-backed films (`Avatar: Fire and Ash`, `Avatar: The Way of Water`); ArrowDown on the named category selector selected Films, updated the URL to `?q=avatar&tab=films`, and exposed both film links. Natural viewport1536×639 showed no horizontal overflow. No result link was activated and no source/API/data was changed. This is populated route, category-keyboard and locale-preservation evidence only; matched1440 geometry, phone recheck, other query/category states and error/retry remain open. No build or automated tests.

### Home guest “Just reviewed…” desktop rail — 28.10.2026

Fresh structured Figma context for guest frame `1413:6471` confirms Group30 (`x113,y1418,1202×372`) with three columns of two rounded benefit cards, followed by Group31 (`x116,y1875,1200×244`): divider, “Just reviewed…” heading, a second right-side text value (`3,219,674,063 films watched`), and ten101×150 posters from y1969 with21px gaps. No API exposes the global watched-count value, so it was not copied; the app’s existing More link remains the route to Reviews.

The local `/en/home` at Chrome1536×695 (document width1521) previously hid the guest desktop poster row. Updated the feature grid to match Group30’s dimensions and displayed ten cards in Group31 using existing public `GET /reviews/recent?page=0&size=10`; the Popular Reviews panel still loads its four items separately from `/reviews/popular`. Read-only layout measurements: benefit group x153/y1418/1202×372; guest review section x156/y1875/1200×245; heading x156/y1893/176×21; poster row x156/y1969/1200×150; first card x157/101×150; last x1255/101×150. Document width equals viewport. Figma vertical anchors, frame composition, EN/UK localization and keyboard visibility on the second focused poster were manually reviewed; no link was activated and no API or user data changed. `npm run verify:build` passed (TypeScript and Vite;236 modules). This is natural-width anchor evidence, not matched1440 or full-page parity. The API returns development-like titles and several records have null poster URLs; the letter fallbacks are data variance, not design assets. The new recent-feed data source needs a phone recheck; member Home and remaining error/empty variants remain open.

### Films Discovery desktop composition update and natural-width review — 27.10.2026

Figma MCP `get_design_context` and screenshot are available again for Current-Copy `1480:6235` (1440×2722). The frame shows compact Year/Rating/Genre/search controls, six numbered Popular films, a Just Reviewed poster rail, two-column Popular Reviews cards and a Crew Picks heading. The page source was updated to use existing API year/minRating/genre/query filters, 174×260 desktop numbered posters with a details route affordance, a 124×180 recent rail, and 584×234 review cards; poster title/year are omitted visually on desktop but the poster links retain descriptive accessible names. Existing per-feed Retry/focus handling and mobile styles remain in place.

At Chrome's natural1519×639 UK viewport, the top filter/search controls, Popular Films heading, six-poster row and a visible focus outline on the Year selector were confirmed. A separate lower-page review showed the recent-film rail and 2×2 review-card composition, with API-backed development content. This is not matched1440 or phone runtime parity. Existing films are sorted by rating, not a verified weekly popularity endpoint; Crew Picks has no API, and most current development films have no poster URL. Those data gaps remain explicit. `npm run verify:build` passed TypeScript and Vite (236 modules). No automated tests, backend/API changes, Docker updates, or data mutations.

EN follow-up on the same natural desktop viewport confirmed localized controls and section names. Submitting `Avatar` returned two API-backed film cards; clearing the query restored the default six. Keyboard Year 2026 and Genre Action selections changed the API film rows; clearing each filter restored defaults. Rating 1+ was selected, and the same six records remained for that broad threshold. No records were modified. Mobile runtime and matched1440 geometry remain open.

### Global Search no-results desktop fix and keyboard review — 27.10.2026

Figma Student-plan MCP access now returns structured design context and screenshot for Current-Copy `1480:5809` (1440×1039). The selected frame shows the shared header, matches row around y280, two-line no-results heading around y388, supporting copy, a white 258×79 Back to home action around y610, and footer. Local natural Chrome1519×639 `/en/search?q=duna123` first showed a three-line heading and undersized CTA. `GlobalSearch.module.css` now sets the empty-state content start, gives the heading enough width to preserve the Figma two-line wrap with the available Arial fallback, matches the 58px desktop type scale and paragraph spacing, and renders the centered white 258×79 rounded action. Fresh local screenshots confirm the heading wraps as “There were no matches / for your search term”, subtitle and CTA align closely to the reference anchors, and the UK copy also wraps into two lines. This is a natural-width review, not a matched1440 geometry claim. Sequential Tab traversal showed visible focus on the All result-category tab and Back to home link. `npm run verify:build` passed TypeScript and Vite (236 modules). No API/data changes or automated tests; other Search categories, mobile and error/retry states remain open.

### Admin Movies edit frame and keyboard return — 27.10.2026

Opened Current-Copy Figma frame `1494:6790`; the inspector reports1440×3128 and its visible composition shows the Edit Film state with a left poster rail and two-column fields. On local UK `/admin?view=movies`, natural1536×639, disposable ADMIN8701 read the API catalog (6 rows on page1/34,203 records) and opened the first generated record in Edit without changing fields. The editor exposed the supported title, duration, release date, IMDb, age rating, rating, poster/backdrop/trailer URL and description fields. Keyboard Enter on the row's Edit opened the editor; title input had visible 2.4px cyan focus. Keyboard Enter on Cancel closed it and returned focus to the originating Edit button with visible2.4px cyan focus; the catalog row remained. Source and reference have qualitatively matching centered1200px shell, poster-left/form-right composition; runtime viewport1536 differs from the1440 Figma frame, so exact matched geometry and sample data parity remain open. Logged out and exact-deleted only disposable user8701 by ID/email/ADMIN role; deletion count1, remaining identity0, and all29 user-FK counts0. No existing catalog content changed; no build or automated tests.

### Films Discovery canvas and natural desktop recheck — 27.10.2026

The live Current-Copy canvas selection `1480:7843` still identifies the phone Films Discovery frame; its inspector reports393×1235, and the visible frame shows Popular, Just reviewed, Popular reviews, Crew Picks and fixed bottom navigation. The local UK route was reopened at its naturally available1536×639 viewport. All four sections rendered; measured content rails are x150/width1220 at y382,834,1170,1683, and document scrollWidth1521 remains below viewport width1536. Live test-like records render fallback initials where poster URLs are absent; Crew Picks remains the API-backed unavailable state. This is natural desktop route evidence, not a matched-width phone comparison. A controlled post-refactor error→Retry keyboard pass was not performed: the browser helper's page evaluation uses an isolated world without `XMLHttpRequest`, and no network fault was left enabled. No source/API/data changes or automated tests.

### Films Discovery per-feed retry isolation and UK runtime — 27.10.2026

Source review found that each of the Popular, Recent and Popular Reviews Retry buttons incremented one shared revision, causing the effect to clear and refetch all three independent feeds. Split the data effects and retry revisions per feed; each request retains its existing API, locale dependency, loading/error state and stale-response cleanup. A Retry now restarts only its selected feed. `npm run verify:build` passed TypeScript and Vite (236 modules). A natural-width UK `/uk/films/discover` browser review confirmed the populated API sections render after the change. Current records are concurrency-generated development content and often use poster fallbacks; this is not Figma content parity. No API/database data, automated tests, Docker or CI changes. Controlled injected failure/retry behavior after this refactor, matched geometry and remaining section state permutations are still open.

The follow-up added per-feed keyboard focus recovery: when a focused Retry button is removed, the corresponding section heading is programmatically focusable and receives focus after that feed settles, provided focus is still on `body`; moving focus elsewhere is respected. A fresh `npm run verify:build` passed TypeScript/Vite (236 modules), and a natural-width UK browser reopen confirmed all four Discovery sections still render. The injected error→Retry keyboard path has not yet been exercised after this focus change; no focus-return pass is claimed.

### Home section Retry isolation and UK runtime — 27.10.2026

Source review found that each inline Home Retry incremented one shared revision. This cancelled UI acceptance of all in-flight section responses, cleared every feed and refetched all eight API sections even when only one had failed. Home now tracks a generation per section: inline Retry reloads/clears only the selected feed, while the existing global error-summary Retry explicitly reloads all sections. Late responses from an older request for the same section are ignored; other section requests continue and may settle normally. No endpoint or payload changed. `npm run verify:build` passed TypeScript and Vite (236 modules). Natural-width UK and EN guest Home browser reviews after the change showed all rendered sections settling into current API content or the true empty Journal state. Data is development/E2E-like and is not design sample content.

Controlled UK and EN guest runtime follow-up: a tab-scoped Chrome network block on `/api/movies/search` made the Popular and Newest feeds fail in both locales. After removing the block, retrying Newest loaded its API-backed cards while the localized global error summary remained because Popular was still failed; focus returned to the Newest section container and screenshots showed its cyan focus outline. The summary Retry then reloaded the remaining failed feed and all sections, removed the alert and returned visible focus to the localized Home heading in UK and EN. Network blocking was cleared and disabled and both temporary tabs were closed. This confirms the inline isolation and global retry/focus paths at natural width for guest Home in both locales; member failure paths, matched geometry, automated suites, Docker and CI remain open.

The guest Newest heading is intentionally hidden in this layout, so the programmatic Retry fallback targets the section container. Added `aria-labelledby` pointing to its localized heading, giving that focus target an accessible name even while the heading is visually hidden. After `npm run verify:build` passed TypeScript/Vite (236 modules), a fresh UK and EN controlled error→Retry check confirmed the focused `home-newest` region is announced as “Rewind допомагає вам…” / “Rewind lets you…” and the visible focus ring remains on the section. A separate controlled UK failure of `/api/reviews/popular` confirmed that retrying a section with a visible heading returns focus to that heading, with the cyan outline visible in the screenshot. Network blocks were removed and temporary tabs closed. No automated tests were run.

### PublicProfile UK main-profile error and Retry recovery — 27.10.2026

At the naturally available Chrome desktop width, blocked only `/api/users/439/profile` on `/uk/users/439`; the localized “Не вдалося завантажити профіль користувача.” state and Retry button appeared. After clearing the block, activating Retry recovered the API-backed PublicProfile and returned focus to `public-profile-title`; the screenshot showed its cyan focus ring. The account/list/activity data is development-like and is not Figma sample parity. Network blocking was cleared and disabled and the temporary tab was closed. Read-only runtime evidence only: no API/database mutation or source edit. A subsequent `npm run verify:build` passed TypeScript and Vite (236 modules); no automated test suite was run. The natural viewport was not the exact1440 Figma frame; matched geometry and other locale/member recovery paths remain open.

### Admin Moderator Logs actor card and Visit Profile focus return — 27.10.2026

`AdminAuditLogs` now requests three records per page and resolves each distinct moderator through the existing `GET /api/admin/users/{id}` endpoint, bounding actor lookups to three per page without a backend change. Rows show API-backed name, email and localized role, with a Visit Profile action into the existing URL-addressable Admin User Profile view. If a moderator lookup fails or the actor no longer exists, the audit row retains its moderator ID and target/action/time, and the profile action is omitted. Request tokens prevent a cancelled page request from clearing a newer lookup or leaving the page busy.

`npm run verify:build` passed TypeScript and Vite (236 modules). In Chrome at the natural1519×639 preview width, disposable ADMIN accounts and one explicitly seeded audit row per pass were used to check populated UK and EN layouts. The row showed its actor identity/role, translated target/action and timestamp; a UK screenshot after scrolling confirms the two-column card and Visit Profile control are visibly rendered. Visit Profile opened the correct Admin User Profile and showed its identity/action history. Closing the profile returned to the originating log button with keyboard focus. No existing user role, settings or content was changed. Both browser sessions were logged out; fixture logs `6257`/`6258` and ADMINs `8698`/`8699` were deleted with exact ID/username/email/ADMIN guards. Both cleanup checks returned0 matching user rows,0 audit rows,0 owned lists and0 refresh sessions. No automated tests or Docker rebuild. Matched1440/phone geometry, EN retry behavior, pagination and full keyboard traversal remain open.

The source later added an explicit transient-error retry for actor lookups: network failures, HTTP408/429 and 5xx keep the row visible by moderator ID and expose a localized Retry action; terminal 4xx responses do not loop. In a separate disposable UK pass on27.10.2026, a tab-scoped Chrome network block forced `GET /api/admin/users/8700` to fail. The audit row remained present with actor ID and the Retry action; after clearing the block, Retry resolved the actor's API-backed name/email/role and Visit Profile control. Logged out and exact-cleaned ADMIN8700, audit row6259, its three default lists and refresh session; follow-up SQL reported0 matching users, logs, owned lists and refresh sessions. The initial `npm run verify:build` passed after the retry implementation. This is a controlled natural-width UK retry-state check; no matched frame, EN retry, exhaustive keyboard path, automated tests or Docker rebuild is claimed.

### PublicList UK poster keyboard focus at natural desktop width — 27.10.2026

Opened the read-only local route `/uk/lists/public/1366` at the naturally available Chrome viewport1519×639. The API-backed list has a verification-like development title, one film, two tags and no likes; none is treated as Figma sample content. Sequential Tab navigation reached the film poster link, and a fresh screenshot showed the visible gold focus outline on the poster. The link was not activated. This is a local UK keyboard spot check only: the user's PublicList/Ranked List matched-width exception remains in effect; no Figma geometry/parity is claimed. No source/API/data changes, build or tests.

### PublicProfile UK populated Lists at natural desktop width — 27.10.2026

Opened the read-only local route `/uk/users/439?view=lists` in a separate Chrome tab at the naturally available1519×639 viewport. The accessibility tree exposes one API-backed public list (“Edited verification list”), its one-film count and description, followed by the “List tags” section with API/Verification links. A scrolled screenshot confirms the list card, poster, title/metadata and tag chips in the rendered page. Keyboard Tab focus was then visible on both tag links without activating either. The username/list naming is verification-like development content and is not treated as Figma sample parity. This adds a UK populated Lists state and a two-link keyboard spot check at natural desktop width only; full keyboard traversal, matched-frame geometry, phone and error/retry remain open. No source/API/data changes, build or tests.

### PublicProfile EN current API overview recheck — 27.10.2026

Read-only review of `/en/users/7748` at the naturally available Chrome viewport1519×639 confirmed the current API-backed identity, Follow-to-Login guest action, profile tabs, and supported overview sections: Favorite films, Recent activity, Recent reviews, Following, Lists, Statistics, Social links, My films and Liked reviews. The API returned two activity records while the Figma frame shows four preview cards; source CSS already lays out four columns, so the visible two-card row is a content/data-quantity gap, not a confirmed layout defect. Local account/review content is development fixture-like and some poster images are unavailable; neither is used as sample-content parity evidence. Current Figma owner frame `238:596` is1440×4459, app viewport was not matched, and `get_design_context` again returned the Starter plan call limit. Route/section inventory only; no pixel or geometry match claimed. No controls were activated; no data/source changed; no build or automated tests.

### PublicProfile list tags More/Less UK/EN with exact fixture cleanup — 27.10.2026

Created disposable USER `designprobe1793092791292` through the UK registration flow, then created one public list through `/uk/lists` with four API-backed tags: alpha, beta, gamma and delta. On `/uk/users/8686?view=lists`, the localized More/Більше disclosure initially exposed three tags; clicking it revealed the fourth and updated `aria-expanded`. UK keyboard traversal reached More/Less with a visible focus ring; Space collapsed and re-expanded the cloud. EN runtime also exposed localized More/Less, revealed the fourth tag, and Space collapsed it; keyboard traversal through the chips returned to Less with a visible focus ring. Tag ordering varied between requests/locales because the API does not guarantee a stable set order; no order is claimed. Logged out before cleanup. Exact DB identity query returned only id8686 with the fixture username/email; the owned public list was id21144. Deleted only the exact user identity; affected-row count was1, then the exact user, all lists owned by id8686, and list21144 counts were all0. This closes only the >3-tag disclosure and UK/EN keyboard behavior at natural1519×639. It is not a matched-width Figma/phone comparison; PublicProfile geometry, other states and the separate network More sheet remain open. No source/API changes, build or automated tests.

### Global Search EN populated films and keyboard path — 27.10.2026

Read-only Chrome review of `/en/search?tab=films&q=avatar` at the naturally available1519×639 viewport. After the API request settled, the selected Films category reported two results: Avatar: Fire and Ash and Avatar: The Way of Water. Keyboard traversal from the query field reached Search, the category selector, Films tab, and first poster link without activating a route. The selector and first poster showed visible gold/cyan focus outlines in screenshots. A follow-up UK route `/uk/search?tab=films&q=avatar` showed the localized labels (Фільми (2), Користувачі, Списки, Теги, Актори й команда, Огляди, Журнал) and the same two API films; the visible focus outline on the category selector was also captured. These checks confirm current API-backed EN/UK result states and focus paths only; no matched1440/phone geometry, query-error state, or content parity is claimed. No source/API/data changes, build or automated tests.

### Admin Movies edit-state composition and Cancel focus — 27.10.2026

Current-Copy Figma canvas node `1494:6790` (“Edit Film - Sulyma Bohdan”, Group415,1440×3128) visibly presents the Admin hero/film toolbar, populated editor card and footer without catalog rows. This supports mapping the design candidate to `/admin?view=movies` while an existing record is being edited; it does not prove exact geometry or every field/action. In the local Chrome runtime, editing Avatar: The Way of Water (API id50, page26) previously left the catalog and pagination below the form. `AdminMovies` now hides that catalog only during existing-record edit. Manual UK runtime review at the natural browser width showed editor and footer only; Cancel restored the catalog and returned keyboard focus to that Avatar row’s Edit button. No save or delete was activated. The candidate’s Status, Original Language, Genre, director/cast and change-action semantics are not fully represented by the current write API; these remain contract/product gaps pending confirmation. Structured Figma context is Starter-limited, and no matched1440/mobile geometry is claimed. Disposable ADMIN fixture8685 was logged out and exact-deleted; identity, owned lists and refresh sessions verified at zero afterward. `npm run verify:build` passed TypeScript and Vite (236 modules); no automated tests.

Fresh canvas recheck in this turn selected the exact `1494:6790` URL; the inspector again reported1440×3128. At25% zoom the frame visibly contains the Lola James header, Marty Supreme editing card and footer. This independently confirms the candidate's content and editor composition, but does not add matched-width runtime or field/action parity evidence.

### Admin Users current-file frame, runtime and fixture cleanup — 27.10.2026

The current Figma canvas visibly selects `1222:3530` (“User List 2 - Sulyma Bohdan”),1440×2098: Admin header/icon rail, search, Add User affordance and Name/Email/Role/Status table. Current `AdminUsers` source renders the corresponding semantic table with Actions. Read-only Chrome review under exact disposable ADMIN8684 at `/en/admin?view=users` and `/uk/admin?view=users`, natural1519×639, confirmed localized table headers, email, role/status and row actions. Filtering to the fixture did not activate a mutation; keyboard Tab showed a visible focus ring on the role selector. Long fixture username/email wrapped in cells; this is runtime behavior, not matched-frame comparison. Figma’s Add User control has no create-user API, so it remains an explicit capability gap. No matched1440/mobile geometry claimed. Logged out, then deleted only fixture ID8684 by exact ID/username/email/ADMIN guard; verification returned zero user row, zero owned lists and zero refresh sessions. No other users/records changed. No tests/build.


### Journal UK/EN API-empty feed and Newsletter category — 27.10.2026

Read-only Chrome review at the naturally available wide viewport: `/en/journal` and `/uk/journal` load the live API empty state for feed and archive. The localized category selector exposes Newsletter / Бюлетень; selecting it preserves the localized empty result. The public page does not render a signup form in this state; newsletter subscription is managed in Profile settings, while article delivery is queued through Admin. This records the real API/data state and behavior, not populated-content or matched-width Figma parity. No source/API/data changes, no tests/build.


### Admin Movies named Edit Film frame resolved — 27.10.2026

Used Figma canvas Find for the exact name “Edit Film - Sulyma Bohdan”. It returned one result: frame `1494:6790` (Group415), inspector1440×3128, at X−50710/Y14882. At50% the selected frame visibly contains the Lola James hero, a Marty Supreme editor card with Name, Duration, Status, Original Language, Poster, Year, Genre and Description fields, then the site footer. This confirms `1494:6790` is the named editor design candidate. It does not establish that `/admin?view=movies` is its intended route or that the live editor matches its geometry. Node `1260:4840` is a separate canvas object with a conflicting export label and reviewer/news content; do not map it as the editor. No Figma edits or application/source/API/data changes; no tests/build in this canvas review.


### Admin Movies Figma node 1260:4840 canvas-content ambiguity — 27.10.2026

The structured Figma `get_design_context` request for node `1260:4840` was rejected by the Starter plan tool-call limit; `whoami` confirms a Full seat on the Starter tier. In the browser canvas, the exact node URL selected a frame whose inspector shows1440×3128 and export label “Edit Film - Sulyma Bohdan”. At50% zoom, however, the visible selected-frame content showed Popular reviewers, Recent news cards and a footer, not an Admin edit form. This is an unresolved node/content mismatch; do not count `1260:4840` as a confirmed Admin Movies reference or parity proof until structured metadata/screenshot can reconcile it. No Figma edits or application/source/API/data changes; no build/test in this Figma review.


### Frontend verify:build current working tree — 27.10.2026

Ran `npm run verify:build` from `frontend/` on the current worktree. TypeScript completed without errors and Vite built successfully (236 modules). No source changes were made in this turn; this records compilation of the accumulated working tree only and does not replace the deferred Playwright/backend regression or visual route/frame checks.


### PublicProfile populated Following row guest action — 27.10.2026

Opened UK `/users/7748?view=following` at the natural1519×639 viewport. The local API returned one followed account (`social_target_5a62c9ea`); its guest Follow link is keyboard reachable, has a clear visible focus outline, and targets localized Login. The account is generated social-race development data, so this confirms UI state and interaction only, not Figma sample-content parity. No link was activated or data changed. This does not cover the phone More sheet, authenticated follow, matched geometry or additional row states. No source/API changes, build or automated tests.


### PublicProfile Following and Followers empty states UK/EN — 27.10.2026

Read-only Chrome review of `/users/438?view=following` and `?view=followers` at the natural1519×639 viewport. Both routes returned localized, API-backed empty states in English and Ukrainian: no current follows and no followers. UK Followers screenshot showed a clear keyboard focus outline on the Profile return arrow. No links that would change data were activated. Natural-width coverage only; populated network rows, phone layout and matched Figma geometry remain open. No source/API changes, build or automated tests.


### PublicProfile guest Follow and Followers return-link focus — 27.10.2026

At Chrome's natural1519×639 viewport, UK/EN `/users/438` renders the API-backed profile in both locales. EN keyboard traversal reaches the guest Follow link; its visible gold outline is present and its destination is localized Login. In UK `/users/438?view=followers`, the real API empty state is localized; the Profile return arrow receives a visible focus outline and returns to the profile overview. No action was activated and no data changed. This is a natural-width keyboard/a11y check only; phone and matched Figma geometry, plus authenticated Follow behavior, remain open. No source/API changes, build or automated tests.


### Global Search UK People result keyboard focus — 27.10.2026

Opened `/uk/search?tab=people&q=James%20Cameron` at Chrome's natural1519×688 viewport. The localized Cast & Crew tab selected with one API-backed result; its link is named “James Cameron режисери” and targets `/uk/people/director/19`. Keyboard traversal reached the card, and the screenshot shows a clear cyan focus outline around the full card. The card was not activated. This confirms a populated People result and keyboard target only; it does not establish matched1440 geometry or Figma sample parity. No source/API/data changes, build, automated tests, or Docker actions.


### Global Search UK populated Reviews keyboard path — 27.10.2026

Opened `/uk/search?tab=reviews&q=film` in Chrome at the natural1519×688 viewport. The API selected the localized Reviews tab and returned101 review results (Films152; Users, Lists, Tags, Cast & Crew and Journal0). Keyboard traversal reached the first review's author link and then its review-title link; screenshots showed the cyan focus indicator on each. A repeat specifically confirmed the review-title link has a full visible cyan outline around its text; the earlier view had made only the lower edge apparent. Several current records are clearly test/concurrency data and many poster URLs are null, so these rows/fallbacks are runtime behavior evidence only, not design-content evidence. No result was activated and no data changed. This adds a UK populated Reviews category/state check only; matched1440 geometry, other result categories and loading/error/retry states remain open. No source/API changes, build, automated tests or Docker actions.


### PublicProfile Crew Lists frame current-canvas recheck — 27.10.2026

In the current-Copy Figma tab, the URL selects `1480:9718`; the layer tree names the selected node `Crew lists (svergunova phone)` and the inspector reports393×1546. However, the visible canvas screenshot shows unrelated editorial cards (“Funny Papers”, “Coming Home”), and Figma's “Zoom to selection” action did not bring the selected frame into view. Earlier full-frame canvas observations remain historical evidence, but this fresh mismatch means the frame contents could not be re-confirmed in this session. Keep `1480:9718` as a provisional PublicProfile Lists candidate and its current visual identity open; do not alter the existing UI or promote the node to fresh verification based on dimensions/name alone. No Figma edit, application change, build, tests, or data changes.


### Global Search UK populated Films keyboard path — 27.10.2026

Opened `/uk/search?q=avatar` in Chrome at its natural viewport. The API returned two Films results; keyboard navigation from the global header reached the localized query field, Search button, category selector, All tab, results region, and both poster and title links for “Avatar: Fire and Ash”. The poster link is announced as “Avatar: Fire and Ash Постер” and the title link has the film name. A second natural-width visit to `/uk/search?tab=films&q=avatar` confirmed the localized Films tab selected with count2 and two poster links (“Avatar: Fire and Ash”, 2025; “Avatar: The Way of Water”, 2022). The screenshot shows the two poster cards beneath the query/results heading. No result link or search action was activated. This adds UK populated-results keyboard and selected-category evidence; it is not matched-width geometry, full category/error/loading coverage, or Figma content parity. No source/API/data changes, build, automated tests, or Docker actions.


### Community Popular Reviewers EN keyboard focus — 27.10.2026

Opened `/en/community/reviewers` in Chrome at the natural1519×688 viewport. The page rendered ten API-backed reviewer rows with localized headings, review labels and metrics. Keyboard focus reached the first reviewer profile link and then its Follow link; follow-up screenshots showed the visible cyan focus outline on each target. The guest Follow link points to Login, and no action was activated. This complements the earlier UK populated-row check; it does not establish matched1440 geometry or parity with Figma sample identities/counts. Pagination and a separate Popular Members rail remain documented API gaps. No source/API/data changes, build, automated tests or Docker actions.


### Register desktop locale and keyboard focus — 27.10.2026

Opened `/en/register` at the natural1519×688 Chrome viewport. Keyboard traversal showed visible focus on the Username input, Show password control and Create your account button. The page exposes the UTF-8 password-length guidance and a Log in link. `/uk/register` showed localized labels for username, email, password, password visibility, submit and Log in, with localized UTF-8 guidance. No values were entered, password visibility was not toggled, and the form was not submitted. This is a natural-width structure/focus check, not matched1440 Figma geometry or validation/error evidence. No source/API/data changes, build, automated tests or Docker actions.


### Profile Settings UK display-name focus and fixture cleanup — 27.10.2026

Created and logged in as disposable USER `id=8654` through the local registration flow, then opened `/uk/profile?settings=profile` at natural1519×688. The settings page rendered the API-backed identity form and empty Favorites state. Keyboard navigation reached the Profile settings tab and then the Display name input; a follow-up screenshot showed its visible gold focus outline. No profile field was changed or submitted. After review, deleted only the fixture by exact ID, username, email and USER role. The three default lists and one refresh session cascaded; a query across every user foreign-key column confirmed0 remaining references, and an exact user query confirmed0 remaining rows. This is a UK natural-width focus check, not matched1440/phone geometry, EN identity focus or save/error parity. No code changes, build, automated tests or Docker rebuild.


### Admin Settings localized labels UK/EN and fixture cleanup — 27.10.2026

Admin Settings previously displayed raw backend keys (`default_locale`, `journal_enabled`, `maintenance_mode`, `site_name`) as user-facing labels. Added localized UK/EN display labels for these four supported keys while leaving the API keys, values, save calls and unknown-key fallback unchanged. `npm run verify:build` passed TypeScript and Vite (232 modules). In the local Vite preview at natural1519×688, a disposable ADMIN reviewed the four UK and EN labels; keyboard focus on the Interface language field showed a visible cyan outline. No Save action was activated and no site setting changed. Logged out and deleted only fixture8655 by exact ID, username, email and ADMIN role; the three default lists and refresh session cascaded, and verification found0 remaining user rows or user-FK references. This does not establish matched1440/phone settings geometry or parity for Figma's unsupported controls. No automated tests or Docker rebuild.


### Admin audit log supported-field layout and focus recovery — 26.10.2026

Frame `1404:3804`/variant `1494:7933` specifies a 1200 px two-column audit card with a 348 px lead card, 293 px following cards and 84 px rhythm. `AdminAuditLogs` previously emitted each record as one inline text string, so the existing card CSS had no meaningful column structure. The component now maps the fields already in `AuditLog` into an administrator ID and target on the left, plus localized action and timestamp on the right. Desktop cards use the measured 417 px/gap160 px columns; phone content stacks. No static identity, profile link or new endpoint was introduced.

The component also scopes list queries to the authenticated id/role, synchronously clears prior-actor data, rejects stale responses at the generation boundary, and restores focus to the Audit Log heading after successful/error pagination or Retry when focus has not moved elsewhere. Reviews and Comments now synchronously clear their prior actor's data, busy/error and focus state on the same transition. Latest
npm run verify:build` after these changes passed: TypeScript + Vite7.3.7,232 modules,7.03s. `git diff --check` passed after the source/doc update. Browser automation remains unavailable (`User unavailable`), so no authenticated screenshot, populated responsive review or keyboard interaction was performed. Moderator name/email/role and the Visit Profile action remain a confirmed API/destination gap; do not describe this as full Logs-frame parity.


### Admin Review/Comment Delete controls and runtime limit — 26.10.2026

Connected the existing `DELETE /api/admin/reviews/{id}` and `DELETE /api/admin/comments/{id}` mappings to visible Admin Reviews/Comments controls. The UI uses localized native confirmation and failure messages, prevents concurrent actions, reloads the current page after success, backs up one page when deleting its only row, and recovers keyboard focus to the remaining action or section heading. No backend endpoint or schema was added. The disposable fixture was user8615, movie4163, review4077 and comment18296; all were removed and exact counts for users/movies/reviews/comments/lists/refresh_sessions/admin_audit_logs returned0.


npm run verify:build` passed after implementation (TypeScript + Vite7.3.7,232 modules,6.39s; automated suites remain deferred). A live Admin Reviews DOM inspection confirmed the localized Delete control is rendered. Activating it opened Chrome's native confirm dialog, but browser control hung before a Cancel/Confirm outcome could be observed; the API rows were still present immediately afterward and then were removed during exact fixture cleanup. Therefore UI cancel/success/failure/focus behavior remains unverified at runtime. Figma edit/report/history/resolution controls remain API gaps; this work exposes only existing delete operations.

**Actor-scope follow-up — 26.10.2026:** `AdminReviews` and `AdminComments` now include the authenticated id/role in query scope and invalidate stale mutations on actor changes, matching the protection used in `AdminLists` and `AdminModerationQueue`. This prevents a delayed response from the previous admin session from changing the next session's data, errors, busy state or focus.
npm run verify:build` passed after this source change: TypeScript + Vite7.3.7,232 modules,7.12s. No automated suite or manual actor-switch interaction was run; those remain final regression evidence.


### Admin Movies supported editor fields and catalog layout — 26.10.2026

Figma current-Copy `1260:3772` is now reclassified as a profile-style Films frame (route unresolved), not an Admin Film Database frame; its card/poster measurements are historical visual observations only. Admin Edit Film `1260:4840` is1440×3128. Admin catalog Figma mapping remains open. Source catalog now renders six items per page and the editor uses the existing AdminMovieWrite + MovieDetails contract: title, runtime, release date, IMDb, age rating, rating, poster/backdrop/trailer URLs and plot. An earlier disposable real-API fixture round-tripped newly exposed IMDb/age/backdrop/trailer fields through GET/PUT; fixture ID4161 and admin8613 were deleted and exact related-table counts returned0. No endpoint or backend change.

Editor poster slot follows Figma x150/y1246/275×411 at1440; desktop fields use a nested two-column grid. TMDB import/quality controls are excluded while editing; Add Movie retains them. At matched 1440×1000 the latest UK/EN runtime measured workspace x120/y1217.8/1200×752.8 and poster x150/y1245.8/275×411. Poster placement aligns the frame, but the workspace is about half the Figma height1485; this is still an open composition mismatch. The exact viewport includes the browser scrollbar (inner1440, client1425); scoped centering corrects the frame alignment without horizontal overflow. UK/EN layouts checked across320/393/600/720/768/1024/1440; client and document widths matched at every width (393 reports inner394/client378). The edit fields and action buttons are at least44px. UK 320 screenshot and EN 1440 screenshot inspected; Cancel at EN1440 returned focus to the corresponding Edit button. Long-title wrap, loaded local poster, saved metadata and no TMDB importer inside edit confirmed. The latest nested grid has source support for GET genres/directors/actors as read-only `<dl>` entries, but this empty-credit fixture did not visually exercise populated credits.

Earlier real-API fixture4161/admin8613 verified IMDb/age/backdrop/trailer GET/PUT round-trip and was cleaned then. The current layout-only fixture movie4162/admin8614 used only disposable records; after observation exact cleanup returned users, movies, lists, reviews, ratings, refresh_sessions, admin_audit_logs, recipient notifications and user_activities to0. No real account/movie row was modified. Latest
npm run verify:build` PASS: TypeScript + Vite7.3.7,232 modules,6.74s; scoped `git diff --check` PASS. No backend changes.

Still a contract gap: Figma status and original language have no write support; genres/directors/actors can only be shown read-only from Movie Details. Aggregate review/popularity metrics and movie search endpoint are absent; do not invent them. Populated read-only credits and the missing workspace height need review. Nullable clearing semantics remain a final regression gate. Docker rebuild, full suites, commit and push are not done. Figma MCP reauthentication is currently required; the current-Copy frame sizes/anchors above come from prior live canvas inspection.


### Admin candidate provenance audit and Movies measurements — 26.10.2026

Read-only audit checked existing controllers/DTO/components against preserved external20.10 raw reference and separately recorded current-Copy canvas evidence. At that checkpoint, Review/Comment DELETE controls were still absent from the frontend. A subsequent implementation wired the existing endpoints into Admin Reviews/Comments; manual confirm/success/focus evidence remains open in the newer [Delete checkpoint](#admin-reviewcomment-delete-controls-and-runtime-limit--26102026). Do not conflate unsupported report metadata with existing delete APIs.

| Candidate | Current classification / remaining evidence |
| --- | --- |
|1343:3799 Reported Comments,1440×2855|Comments route supplies ordinary list/hide/unhide; report count/reason/engagement and reported-state are API gaps.|
|1319:5033|Provenance conflict:20.10 secondary raw calls it Reported Reviews1440×3217; earlier current-Copy canvas entry calls it Edit Reported Reviews1440×2435. Keep current identity open; do not merge by ID alone.|
|1317:4617 Edit Reported Reviews,1440×2435|Secondary raw only; current-Copy identity open. Report/update/history/resolve contracts absent; delete capability exists separately.|
|1315:4313 Edit Review,1440×2435;1342:4028 Edit Comment,1440×2282|Previously confirmed current canvas; admin update/history contracts absent, no invented editors.|
|1319:5889 Delete,1440×1666|Review DELETE API exists and is exposed in Admin Reviews. Disposable-fixture Cancel/Confirm and focus return have been manually verified; frame geometry remains open.|
|1342:3273 Block,1440×1666|Hide/unhide supported; equivalence to the design Block action is not confirmed. Preserve semantics and leave mapping open.|
|1342:3470 Complaint as Resolved,1440×1666|No complaint entity/resolved state/resolve endpoint. API gap.|
|1343:4118 Edit Reported Comment,1440×2314|Previously confirmed current canvas; report/edit/history/resolve gaps. Comment DELETE API now has a UI control; Block mapping open.|
|1393:3652 More Users Activity,1440×2720|Actual secondary raw subtree shows searchable/paginated Activity List of users: Name/Email/Followers/Status,13rows, Activity action. Nearest supported surface is Users query/page/name/email/status. Followers count absent from AdminUser; current-Copy frame identity and Activity destination still open. Earlier inference of a chronological feed from the frame name was unsupported and is superseded.|

Moderation queue uses moderated_at IS NULL rather than user reports; overview aggregate counts/adminHistory do not prove a reported state or the Activity List destination. API gaps remain accepted scope limits; actual available-API UI gaps and ambiguous owner/action mappings remain open work.

Historical checkpoint: the current-Copy `1260:3772` card and poster geometry (x120/y1344/516×438 and x143/y1366/174×260) was measured before its screen was correctly identified. The selected frame is now classified as profile-style Films with unresolved route, so those measurements do not establish Admin catalog parity. Fresh Admin catalog frame mapping remains open.


### Admin Dashboard identity, navigation and recovery — 26.10.2026

Current-Copy1178:2466 browser canvas/inspector confirms1440×2669. Identity Group416:x571/y293/298×387; image1178:2578:x584/y293/272×277; Lola James text:x571/y582/298×65, SF Pro Display Bold58px/112%; Admin Head:x656/y651/128×29, Medium24px/120%,7E7E7E. Navigation Group235:x331.51/y772/776×96. These editor observations supplement the preserved raw reference; structured MCP remains subject to the previously observed Starter quota. No Figma document changes were made.

AdminDashboard now renders the existing nullable users/me avatarUrl through ResilientImage; CurrentUser typing includes the already-supported field. No new endpoint/backend change. Desktop identity uses the measured272×277 image slot,12px name gap,58px/112% name,4px subtitle gap and24px/120% subtitle; nav uses776×96 and92px gap. Runtime exact1440 measured image x584/y293, name y582/height64.95, subtitle y650.95/height28.8, nav x332/y771.75/776×96, hero1020. Dynamic username and truthful localized Admin dashboard subtitle replace sample identity/Admin Head. Existing font fallback, theme/background and API data remain explicit differences. Twelve real Admin routes are retained rather than reducing them to the reference icons; the active desktop route now has a visible localized label. Mobile links are44×44; desktop inactive links48×76, active160×76. Inset focus prevents clipping inside the scrolling pill. This is supported identity/navigation alignment, not blanket full-frame or analytics parity.

Figma analytics (personal watched films/rating/list counts, engagement/session graphs, likes/watchlist metrics) have no equivalents in the six global dashboard counters. Keep real users/activeUsers/hqUsers/movies/reviews/hiddenReviews; do not fabricate sample analytics/charts. Supported cards remain a1200px rail with28px inset and three desktop columns. Shared Settings landmarks rechecked after hero changes: title y1073, workspace y1213.8/height734, footer y2112.8; prior anchors retained.

Dashboard GET now clears old cards while loading/error, guards actor/view/request lifetime and only recovers focus after explicit Retry. Manual real API fixture8612: UK/EN320/393/600/720/768/1024/1440 show six cards and no page overflow (393 rounds394). Avatar loaded successfully from an existing local image; broken URL and null both render initial D. Long fixture username wraps at all seven UK widths without overflow. UK320 screenshot confirms readable identity/cards; Tab reaches Settings at x249.2..293.2 and scrolls the nav, with visible inset outline. UK1440 blocked dashboard GET shows0 cards; failed keyboard Retry focuses alert with cyan outline, recovery Retry shows6 cards and focuses h2 with cyan outline. During both Retry requests aria-busy=true and0 cards. UK1440 final screenshot inspected. No settings or moderation writes performed.

Build npm run verify:build PASS: TypeScript + Vite7.3.7,232 modules,5.02s; scoped git diff --check PASS. Browser network/viewport overrides cleared and fixture logged out. Exact ID8612/email cleanup verified users/lists/refresh_sessions/admin_audit_logs/ratings0/0/0/0/0. One attempted overlong SQL fixture name was rejected by the existing DB length constraint, without mutation; the subsequent supported-length name was used for responsive review. Automated suites remain deferred until visual closure. No Docker rebuild, commit or push in this block. Next Admin visual work: supported Movies/editor, Reviews/Comments, Moderation/Logs and remaining candidate classification.


### Admin Users semantic table and Email — 26.10.2026

Current-Copy1222:3530 browser canvas confirms1440×2098 User List2 with a1200px rounded table rail and Name/Email/Role/Status. Structured context probe still returned Starter limit. Runtime previously showed only compact Name+role/status summaries; AdminUser.email was already available. The catalog now uses native table/caption/column headers and displays Email. Role remains the existing select; View Profile/HQ/active actions keep their handlers, data attributes, focus guards and pagination. Extra supported action buttons wrap rather than masquerading as unavailable edit/delete icons. Add User/Moderator role/delete-user controls are not invented. Detail view remains unchanged; this supported API adaptation is not an exact reproduction of unavailable sample actions or full-frame parity.

Local AdminUsers.module.css confines the change:1200px/20px rail on desktop, <=720px labeled cards without page overflow. Mobile visible labels are aria-hidden duplicates of retained scope=col headers. UK/EN headers are Name/Email/Role/Status/Actions and their translations; short catalog-only role labels User/Admin or Користувач/Адміністратор avoid clipped verbose role phrases. Existing global labels/detail translations unchanged. UK1440 inner table measuredx120.8/width1198.4 inside the1200px border rail, five column headers and three fixture rows. UK320 screenshot and accessibility snapshot confirm a named table with the retained headers and readable card fields. UK/EN client/scroll widths match requested320/393/600/720/768/1024/1440 (393 rounds394); mobile controls>=44px, desktop>=40px. Long display name/email wrap. EN1440 screenshot inspected with visible cyan role-select focus.

Disposable fixtures8609 ADMIN,8610 long-name/email active USER and8611 inactive USER were created locally. Only8609 was promoted, by exact ID/email predicate; real roles untouched. Fixture-only search produced three rows and preserved its query after UK→EN and detail Close. UK320 Activate8611 updated the Status cell and retained action focus; Grant HQ8610 changed its action to Revoke HQ and retained focus. View Profile from the table opened correct8610 detail/email with heading focus; Close restored the same query/rows. Blocking only the users collection GET produced the genuine EN error with no stale table; clearing it and Retry restored three rows/five headers and focused Users h2. A nonexistent fixture search showed No users found and zero body rows. Role mutation logic was not changed or re-executed here; earlier named role checks remain historical evidence for the retained handlers.

Final
npm run verify:build` PASS: TypeScript + Vite7.3.7,232 modules,5.22s; scoped diff check PASS. Logged out, network block/viewport cleared. Exact ID/email cleanup removed3 fixtures; remaining users/lists/refresh sessions/admin audit/ratings0/0/0/0/0. No automated suites, Docker rebuild, commit or push. Remaining Admin visual queue starts with Dashboard exact1440 and the other explicitly listed workspace/editor variants, not this completed supported table/email defect.


### Own network phone subtitle typography — 26.10.2026

Current browser inspector resolved the formerly unselected subtitle: Frame3901023:4595 → Frame3891023:4594 → Frame225 → text1023:4573, “12 followers, following 9”. Exact text inspector: SF Pro Display Medium12px, line-height112%, letter-spacing0%, fill7e7e7e, relativex0/y13.5/208×13. Node URL and properties recorded outside Git in `.codex-backups/more-paint-20261026/subtitle-reference-summary.json`. Canvas double-click selected the nested group; its sidebar chevrons were expanded by fresh coordinate observations, then the exact text label selected. No visibility/geometry/content edits were made in this checkpoint.

Source mobile profileNetwork subtitles accidentally retained desktop18px/20px. Added only the <=720px subtitle override:12px/500/1.12. Keep8f8f8f for accessibility: contrast5.10:1 on1f1f1f versus reference7e7e7e at4.06:1. The negatively positioned source group/clipped avatars are not reproduced; existing responsive avatar/text/44px actions remain visible, consistent with the agreed accessibility/API priority. This is a documented source-layout adaptation, not an unresolved unknown text style or exact reproduction of clipping.

GET-only isolated ten-member preview: UK393 first rowx16/y123/361.6×65, computed subtitle12px/13.44px/500/8f8f8f and short subtitle13.4375px high. Long-name row grows to67.4375px, no overlap. UK/EN requested320/393/600/720/768/1024/1440 have matching client/scroll widths; <=720 subtitle12px, >=768 retains18px. Visible actions44px mobile/50px desktop; hidden desktop More was excluded from interactive-target measurement. Screenshots inspected UK393, EN320 and UK320 Followers. UK320 long-name/title/count wraps naturally, all ten fixture rows exist and the page scrolls vertically. No separate Followers-phone Figma match is invented; this verifies shared component behavior there.


npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.02s; scoped diff check PASS. Viewport cleared, preview stopped by verified command identity, subsequent listeners show5173 only. Fixture consumes all API GETs locally and rejects writes; no DB/account changes, suites, Docker rebuild, commit or push. Network desktop full composition remains open.


### More structured reference paint and scoped focus — 26.10.2026

Figma `get_design_context`1033:5681 succeeded with screenshot using the existing file/session. Subsequent own-phone requests hit Starter limit; this does not establish unrestricted access. Selected reference properties are transcribed outside Git in workspace `.codex-backups/more-paint-20261026/reference-summary.json`, explicitly not a full export. Backdrop1033:5888 is blur23.25px/black4%; heading1033:5651 y520/18px/1.12; actions1033:5653 x16/y573/361×169/radius20/bg282828; Done1033:5679 y761/361×56/radius37/14px. Existing dynamic avatars and controls remain API-backed; no temporary asset URL enters production code.

More CSS now uses these paint/geometry values, retaining the72% dark fallback when backdrop-filter is unsupported. Reference action gray7e7e7e on282828 has contrast3.63:1; implementation uses8f8f8f at4.56:1 under the agreed accessibility priority. Handle usesa3a3a3 for readability; font fallback and @handle format remain explicit data/font differences. Background/data blobs are not static Figma screenshot assets. Short UK393 rendered headingy520, actionsy573/630/686, Done761, sheetx16/y520/361.6×297; rounded client394 accounts for the fractional393 viewport. Actual backdrop computed23.25px/rgba(0,0,0,.04). EN public screenshot compared with the returned Figma screenshot; focus is an additional accessible state.

Independent CSS review and computed styles exposed cascading page rules overriding sheet link color/weight, separators and focus outline. Public network inheritance is now restricted to direct row links; sheet actions/focus have scoped selectors. Final own UK and public UK/EN computed action text143/143/143,16px/500; Done14px/500/radius37. Inset cyan focus computes−2.4px/1.6px under browser pixel rounding, corresponding to authored−3px/2px, and stays inside the clipped action group. UK Tab/Shift+Tab trap and Escape return were verified after the style changes; EN trap traversal also reached the expected first/last actions.

GET-only isolated preview supplied ten API-shaped members, including one long name, and rejected every write; no request was forwarded to the real API. UK long-name More fits320 (288px wide/321.125px high) and393 (361.6px wide/300.975px high); all action targets remain at least56px. UK long and EN short client/scroll widths match at320/393/600/720/768/1024/1440; screenshots inspected at UK320 and EN393. Own-phone subtitle typography/clipped reference group and full desktop composition remain open.

Final
npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.22s; scoped diff check PASS. Viewport cleared; isolated preview stopped by verified process identity, subsequent listener check shows5173 only. No DB fixtures/writes, automated suites, Docker rebuild, commit or push in this block.


### Populated UK network More and own remount focus — 26.10.2026

Disposable USER pair8607/8608 followed one another through existing API; no real users were followed or blocked. Target initially had a long display name, later changed to Alex Turner only for a short-text comparison with the reference. Own UK393 Following/Followers and public `/uk/users/8607?view=following` rendered genuine populated rows. Public row bounds x16/y123/361.6×65, both More/Follow targets44×44; requested393 rounds document width394 with no overflow. Public populated UK widths320/393/600/720/768/1024/1440 had matching client/scroll widths.

Current-Copy browser canvas selected More1033:5681 and followed public1033:5458, both393×852. Short-name source sheet x16/y522/361.6×295; action tops575/631/687, Done761, all56px high. These slots were visually compared with the selected canvas, not asserted as an exact layer-level font/paint match. Long-name sheet grew to302px, heading42px, without overlap. UK Done initial focus, Tab→Unfollow, Shift+Tab→Done, Escape→More verified. Follow/Unfollow showed the corresponding localized action and updated API relationship/count. Reference identity/avatar/sample row quantity differ from disposable data. Backdrop blur/paint and own-phone subtitle typography still require focused acceptance; do not count this as full-frame parity.

The populated own Followers mutation exposed a new defect: sheet success closes and network refresh remounts rows, losing focus to BODY. Profile.tsx now captures an explicit scoped row-action origin and expected section GET; only a matching settled request can recover lost focus, with navigation/actor/locale/page/unmount cancellation. UK393 More→Unfollow and More→Follow now return focus to More with correct pressed state. Removing the only own Following row focuses the visible toolbar h2 with cyan outline and shows genuine empty Following. EN1440 direct Follow refreshes and retains focus on the new Unfollow button. Passive GET does not create focus intent. Delayed actor/page cases remain final regression or explicitly open evidence, not inferred from this source guard.

Own phone1023:3020 was inspected on current canvas. Its selected Frame390 child1023:4595 reports x−50.5/y136/262×637; the screenshot visibly clips that group at the frame edge. No typography was inferred from an unselected text layer. A sidebar expand attempt unexpectedly toggled child visibility; it was immediately restored (Appearance Hide unchecked, original count content visible) and screenshot-confirmed. No lasting Figma layout/content/visibility change remains.


npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.56s; scoped diff check PASS. Logged out and cleared viewport. Exact ID+email cleanup removed2 fixture users; remaining users/lists/follows/notifications/activities0/0/0/0/0. No suites, Docker rebuild, commit or push in this block.


### Profile login return anchor and Auth intro scope — 26.10.2026

User explicitly chose to retain direct Login/Register and classify desktop605:2173 plus phone915:1598/911:1596/922:1788 as unused intro prototypes. Their classification remains recorded; no new web entry route or splash sequence is required. This closes the previously open intro route/product decision, not an implementation/parity claim for unused prototypes.

Real API disposable USER8606 reproduced guest `/uk/profile?settings=avatar#profile-avatar-url` → localized Login → exact original URL. Before the fix, ProfileSettingsShell focused Account Settings h1 and left the avatar input below the viewport (top1521.6 in the observed desktop layout). The shell now creates a one-shot recognized-anchor intent for forward navigation, waits for loaded data, restricts the target to visible content inside its main and scrolls/focuses it. Pending rAF is cancelled on navigation/unmount; passive data/save updates do not recreate an already consumed intent. Existing POP/default heading behavior retained. Deliberate-focus protection is source-reviewed here, not a new delayed-GET runtime claim.

After the fix, guest→Login→Profile EN1440 preserved `?settings=avatar#profile-avatar-url`, focused INPUT#profile-avatar-url and centered it at top460.8/height79, visible gold1.6px outline; screenshot inspected. Repeated full flow UK393 preserved the same query/hash and focused the visible input at top401.8/height45.6, client/scroll394/394; screenshot inspected. UK phone ordinary settings Profile link without hash still focused visible Settings h2. No profile fields or passwords were changed. Logged out through UI and cleared viewport. Exact fixture ID+email cleanup removed one user; remaining users/lists/ratings/reviews0/0/0/0; before cleanup the USER fixture owned only its three automatic lists and no ratings/reviews.


npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.73s; scoped diff check PASS. In-flight programmatic Reset token replacement remains an explicit final frontend-regression case: there is no exposed token-switch UI, and source `key={token}`/mounted guards are not claimed as runtime proof. Real valid-token reset/session revocation remains final functional regression. No automated suites, Docker rebuild, commit or push in this block.


### Register result layouts and action width — 26.10.2026

External UI-only preview5175 consumes Register POST locally: success@example.invalid yields201, other synthetic addresses409, after6s. No account, password or email is created or changed. Success initially rendered a1150px action beside a627px heading at1440. The success-only button now has max-width627px and centered margins, matching the existing form/heading width without changing normal form buttons. Post-change button and heading both x406.5/width627 at1440; button height89. No standalone Figma Register-success frame is established, so this is consistent supported-result composition, not new frame parity.

Success and error states in UK/EN each had matching client/scroll widths at requested320/393/600/720/768/1024/1440 (393 rounds394). Success action widths268/290/290/290/627/627/627 at these sizes; UK320 screenshot inspected, keyboard Tab reached the56px-high action with cyan2.4px outline, Enter navigated to/uk/login. EN desktop success screenshot inspected. Switching completed success EN→UK preserved and localized it. UK320 loading disabled all form inputs;409 rendered localized error and focused register-error, screenshot inspected. EN393 error screenshot inspected after locale change with route-heading focus. These targeted screenshots plus geometry observations do not imply every pixel at every width matches a reference.


npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.30s. Diff checks scoped to changed files pass. Viewport cleared, external preview stopped by verified command identity;5175 listener gone, normal5173 retained. No automated suites, Docker rebuild, commit or push. Remaining visual Auth scope: intro web-route/prototype decision, supported Profile→Login return query/hash and explicit in-flight token isolation. Real reset/session behavior remains the final functional-regression gate.


### Auth delayed result focus and Reset success layout — 26.10.2026

Manual external preview5175 consumes Reset/Register/Forgot POST locally and responds after6s; it never forwards these writes or changes credentials, accounts or email. Reset failure400/success204, Register failure409 and Forgot accepted202 are UI fixtures, not evidence of real backend success. Configuration remains outside Git at `.codex-backups/reset-visual-20261026/vite.config.mts` in the workspace parent.

Before the fix, Reset submit → deliberate Tab to footer About us → delayed400 moved focus back to the error. After the fix, About us remains focused while the error renders. A normal delayed failure still focuses reset-password-error. Register409 and Forgot202 show the same intended distinction: deliberate About us focus preserved; normal resubmission focuses register-error or the Forgot success paragraph. All three forms now synchronously lock the active request, ignore unmounted completions and use cancellable explicit BODY/origin-only focus recovery; locale/location changes clear the previous focus intent while retaining valid same-mounted-request results.

Reset204 fixture removes the form, displays success and focuses its status; EN393 phone screenshot inspected and Log in navigates to/en/login. EN→UK during another delayed204 retained the localized success and route H1 focus, without old result focus. UK320 success screenshot inspected; UK success document client/scroll widths matched requested320/393/600/720/768/1024/1440 (393 rounds394). Register EN→UK during409 rendered the UK error and retained H1 route focus. An exploratory Reset request was interrupted by fixture-config reload and is excluded; later stable requests above establish the named outcomes. Direct navigation is not evidence of an in-flight token swap.

UK320 Forgot202 fixture also focused its localized success paragraph with visible outline and no horizontal overflow; screenshot inspected.
npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.18s. Independent source review found no additional concrete Reset race. Preview stopped after checking its exact process command:5175 no listener, normal5173 retained. Viewport override cleared. Real valid-token success/session revocation belongs to final functional regression; in-flight token-swap and uncovered locale/result layouts remain open. No automated suite, Docker rebuild, commit or push in this block.


### Reset request failure and invalid-token distinction — 26.10.2026

Source audit found that every Reset rejection displayed an invalid/expired-link message, including transport/server failures. ResetPassword now maps Axios400 to the existing invalid-link message and other failures to a new localized retryable request-error message. Existing backend invalidToken returns400; no endpoint or credential behavior changed.

Manual Chrome used the deliberately invalid token `invalid-visual-no-account-20261026` and synthetic input values, never an issued reset link. With only `/api/auth/reset-password` blocked, EN1440 showed the new request-error message and focused `reset-password-error`; clearing the block and resubmitting produced the genuine API invalid-link message at the same focus target. UK320 repeated both outcomes: request-error alert fully visible with cyan2.4px outline and no horizontal overflow; invalid-link message localized correctly. UK invalid-token state had matching client/scroll widths at requested320/393/600/720/768/1024/1440 (393 rounds394). A full navigation to another deliberately invalid token produced empty fields/no alert; this is not proof of in-flight SPA token isolation. No user/password/token record was created or changed.


npm run verify:build` PASS: TypeScript + Vite7.3.7,231 modules,5.04s. Tab-local request blocking cleared and viewport reset. Valid-token success, delayed token/locale isolation and deliberate-focus permutations remain open. No suites, Docker rebuild, commit or push in this block; a reset-button component still does not establish a full-page Figma reference.


### Profile collection page size and focus recovery — 26.10.2026

Collection wrappers now request24 items instead of12, within the existing backend limit50; other profile feeds retain their page sizes. Current hidden phone Films reference845:1679 shows four columns/six rows; this supports the populated grid count, not full-frame parity or an owner/prototype decision. Disposable user8605 held25 watched flags, four favorites and one watchlist item on existing movies, without ratings. EN public393 first page rendered24 posters in4×6, desktop1440 in6×4; page2 contained one item.

Before the fix, own/public Next left focus on BODY. Explicit collection page/Retry intent now follows the expected request and current scope; passive GET does not create intent, and deliberate focus elsewhere is preserved by the source guard. Visible mobile toolbar titles are selected by rendered bounds instead of an assumed breakpoint. Manual keyboard checks: own EN1440 Next/Previous → Watched h2; own UK320 Next → visible Films h2, Previous/repeated failed Retry/successful Retry → visible Films h2. Public EN393 Next/Previous → Films h1; EN1440 Next → Watched h2; UK393 repeated failed Retry and successful recovery → Films h1. Endpoint blocking was tab-local and cleared. Recovered UK39324-poster screenshot inspected with visible cyan heading focus.

Populated public EN/UK and own UK client/scroll widths matched at requested320/393/600/720/768/1024/1440 (393 override reports fractional layout rounded394). These are grid/overflow observations, not a complete screenshot comparison at every width. Remaining collection kinds, delayed actor/locale/page-clamp permutations and full geometry stay open.


npm run verify:build` PASS: TypeScript and Vite7.3.7,231 modules,5.18s. Logged out through UI; viewport override reset. Exact ID+email cleanup removed one disposable user; users/lists/ratings/activities remaining0/0/0/0, ratings before cleanup0. No suites, Docker rebuild, commit or push performed in this block.


### Journal wide text anchors and long-content flow — 26.10.2026

Current КК604:848 child inspector measurements: metadata604:884 x746/y280/271×22, SF Pro Display Bold20/112% line-height/0 spacing; title604:889 x746/y324/352×27, Bold24/112%/0; excerpt604:908 x746/y359/573×72,20/120%. Read-only canvas/tree selections only. Long clipped layer labels made semantic center-click deselect; clicking the visible sidebar excerpt label selected the correct node. No Figma edits.

Desktop wide family now top-aligns text: metadata runtimex746/y280/h22.4; titley324.40/h26.875; excerpty359.275, retaining the existing project font fallback. Previous short fixture metadata at~452 is superseded. Wide-only typography/spacing changed; portrait remains513×612x120/y212 with its prior text behavior. Short cover and decorative thumb remainx120/y211/514×296 andx1087/y564/212×260, respectively.

API permits title255/excerpt500 chars. Temporary GET-only Interviews fixture at those limits exposed overlap: bodybottom721.775 while absolute thumb started564. Wide desktop thumb now participates in second grid row with56px row gap; short feature699/anchors unchanged, long EN feature912.775 with bodybottom721.775/thumbtop777.775, no overlap. UK long text bodybottom772.65/thumbtop828.65, no overlap. UK/EN255/500-char fixtures have matching client/scroll320/394/600/720/768/1024/1440 at requested320/393/600/720/768/1024/1440. <=1199 baseline styles retained. Short1440 screenshot inspected. Authors/avatar bios and related-film artwork remain DTO/data gaps; exact comparison of every remaining frame/content state is not asserted.

npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.33s); scoped diff --check PASS. External preview stopped by exact command identity; initial listener observation raced shutdown, subsequent poll confirmed5175 listener0. Actual API still articles0. Temporary viewport cleared; no DB writes/accounts/assets, suites, Docker rebuild, commit or push. Source change only Journal.module.css; fixture updated outside Git.


### Journal wide-cover implementation and fallback review — 26.10.2026

First successfully loaded cover is classified by natural width>height. Key includes lang/page/category/archive/articleID/URL; latest-key/currentSrc checks reject stale image events. Missing/broken media retains portrait fallback. No DTO/backend/route/content changes. Desktop wide514×296 atx120/y211 matches current КК child849:1483; total feature699 preserves next articley911/next cover995. Portrait remains513×612 atx120/y212. At901–1199 wide fluid514/296 has min-height0;<=900 previous responsive layout retained.

GET-only external preview5175 used five temporary API-shaped records with existing local assets (wide,portrait,other-wide,broken,null). EN1440: wide514×296; News portrait513×612; Podcasts broken/Newsletter null both REWIND fallback/noimg/portraitbox; Interviews other-wide URL3840×2160 reclassifies514×296; News restores portrait. UK navigation resets correctly; UK1024 cover492×283.325 inspected, no leaked612px minimum. Cover keyboard focus cyan2.4px. UK/EN client/scroll320/394/600/720/768/1024/1440 match requested320/393/600/720/768/1024/1440.

Cover-only acceptance: full wide-feature text alignment still open. Short EN excerpt puts cardBodyy452.14 at1440 through existing vertical centering; measure matching current text node before changing it. Authors/bios/avatar strip and distinct related-film posters remain DTO/art gaps; repeated decorative cover is not claimed as related art. Delayed-image/page/actor races remain source-guarded, not runtime accepted.

Final npm run verify:build PASS: TypeScript + Vite7.3.7,231 modules,5.14s. Scoped diff --check PASS. Exact preview25316 stopped;5175 listener0 verified; external journal-wide-20261026 config retained. Normal5173 unchanged, real API totalElements0, viewport cleared, no DB/account fixtures. No suites, Docker rebuild, commit or push.


### Journal seven-frame family classification — 26.10.2026

Fresh current-Copy canvas selections/inspector and zoom-to-selection screenshots confirm all seven feed IDs: List1 1494:4802 1440×3560; List2 604:1172 1440×3562; List3 604:967 1440×3561; List4 604:1380 1440×3561; List5 604:1074 1440×3560; List6 604:1275 1440×3565; КК604:848 1440×3560. Some full-file navigations needed a second observation after load timeout; same tab/selection retained. List4's first capture had unloaded canvas images; second capture confirmed the artwork, so transient question marks were not classified as design content.

All are one /journal route with feature + four ordinary rows + related-film art + footer, but TWO feature compositions. Lists1/3/5 and КК use a wide lead image and a three-avatar biography strip below. Lists2/4/6 use a tall portrait without that strip. КК repeats List1 visible Christmas/camera/Paul/2025/final-film content and composition; it is a visual content/layout copy, not proof of shared component/prototype identity. Earlier statement that all seven have identical route geometry is superseded. Seven frames are not automatically seven API categories.

On current КК, read-only canvas double-click selected Group56 node849:1483; live inspector shows x120/y211,514×296. Existing source uses513×612 desktop cover for all features, a confirmed open wide-family geometry issue. Do not classify this as impossible only because DTO has no variant flag: coverUrl may provide wide media. Author/avatar/bio and distinct related-film poster data ARE absent from JournalArticle DTO and remain contract/content gaps. No authors/posters invented or backend contract changed. CSS comment corrected to distinguish portrait baseline and open wide family, without altering runtime styles.

Separately inspected844:1547 Main article,1440×3120: title/lead, large collage cover, excerpt, hierarchical text sections and small inline illustrations. It is an eighth article frame at /journal/:slug, not one of the seven feed variants. Existing API has text content/one cover/audio/date/category/language/slug, no structured article blocks or inline-image collection; previous representative article geometry/recovery evidence remains scoped. Newsletter/phone mapping and uncovered audio/locale/state checks stay open.

This is current reference classification and an implementation finding, not new application visual acceptance. No app source behavior/style changes beyond a factual CSS comment, new assets, fixtures, build, suites, Docker rebuild, commit or push. Next Journal work: implement/test wide cover treatment using actual available media while preserving portrait geometry, data gaps and API compatibility.


### Profile review editor, focus and overview synchronization — 26.10.2026

Disposable user8604 and reviews4075/movie5,4076/movie33 used. Pre-fix natural EN: Edit focused textarea, Escape returned Edit; blocked Save preserved draft but left BODY with error. Successful retry also left BODY, and in-app overview showed old text (old link1/new link0). Delete Cancel kept fixture; blocked Delete left BODY. At1440 DOM inspection found TWO textarea elements with the same profile-review-content-4076 ID: hidden overview0×0 and visible history862×180. Accessible-name query Review matched0 because the duplicate label targeted hidden content. Visible editor layout had no horizontal overflow.

Overview rendering is now explicitly read-only; only history registers edit refs and editor IDs. Textarea has localized aria-label. Review mutations use synchronous token, actor/scope/unmount guards and localized feedback keys; cancellable lost-focus intent waits for its expected settled history request/clamp. Save/Escape target Edit, Delete targets h2 after reload, failures target focusable cyan alert; outside deliberate focus is preserved by source guards. Confirmed PATCH content sync updates matching cached preview without inventing timestamps/posters; DELETE removes cached entry and decrements review count after API success. Nullable/legacy poster behavior and API remain unchanged.

Post-fix EN1440: named textarea count1/ID count1. Blocked Save focuses cyan alert and preserves draft; retry returns Edit focus. In-app overview shows new text (old0/new1). Blocked Delete focuses error; unblocked Delete returns settled h2, removes card from history and overview, and overview Reviews count is1. UK320: localized named textarea, whitespace-only Save disabled, Escape returns matching Edit; blocked Save focuses localized alert/draft retained, retry and repeated Save return Edit. Final UK Delete removes last fixture review, shows localized empty state and focuses h2. UK editor client/scroll widths match320/394/600/720/768/1024/1440 for requested320/393/600/720/768/1024/1440.

UK320 screenshot exposed side-by-side action labels breaking inside words. At<=400px editor buttons now stack at full available width; post-change screenshot confirms readable whole-word Delete/Save labels and44px targets. Desktop unchanged. No new matched Figma full-frame parity claim; delayed actor/view/page/locale and deliberate-focus review permutations remain runtime-open with source guards only.

Final npm run verify:build PASS after phone CSS change: TypeScript + Vite7.3.7,231 modules,4.99s (prior5.16s predates that CSS). Browser logout, network/device overrides cleared. SQL confirms both reviews already absent from real UI deletion before exact user cleanup; fixture users/reviews/lists/audit0/0/0/0. Metadata outside Git. Scoped diff --check PASS; no suites, Docker rebuild, commit or push.


### Login delayed navigation and Profile settings feedback — 26.10.2026

Disposable user8603/loginrace27105a6ac8. External Vite middleware delayed POST auth/login by8000ms while forwarding the real request. Verified pending disabled/Logging in before each navigation: successful Login→Home stayed on/en/home with member h1/account menu after completion; EN→UK switch during Login settled at/uk/films with localized h1; wrong-password Login→Home stayed on/en/home as guest with no late alert or redirect. This closes those named pending route/locale outcomes, not every Profile-return/auth concurrency case. Delay server removed by exact process-command check; normal5173 dev restored (session3472).

Profile pre-fix: EN Avatar valid local/logo.png save produced Avatar updated but BODY focus. Subsequent native-valid ftp URL rejection displayed both old Avatar updated and new error. Settled navigation to Social links carried both Avatar messages into the wrong tab. Social success likewise left BODY, then ftp rejection kept Social links saved with the error.

Profile identity/social submission now clears prior feedback and captures explicit submitter origin/outcome. Actor/request/mounted guards retain successful current-actor data; separate tab/view/lang/shared submission generation rejects stale feedback. Shell uses latest scoped intent and cancellable rAF: only BODY/origin may recover to focusable status/alert, with visible cyan outline/scroll margin. Tab/locale/actor/view changes clear messages without discarding drafts. Root also added localized saveAvatarError; blocked Avatar PATCH previously mislabeled failure as saving a name. API/layout/password workflows unchanged.

Post-fix EN1440: Social success→status; unsupported URL and repeated validation→alert with cyan outline and no stale success; switching to Avatar clears Social feedback. Avatar removal→status/initial fallback, blocked PATCH→avatar-specific alert with draft preserved, unblocked Save→success. UK320 toolbar Avatar invalid URL→localized alert, removal→localized focused status; switching to Connections starts without Avatar feedback. Blocked Social PUT→localized alert/no stale success; retry with cleared Website→focused success. UK Avatar and Social widths have matching client/scroll320/394/600/720/768/1024/1440 for requested320/393/600/720/768/1024/1440. UK phone success screenshot inspected. These are scoped behavior/overflow results, not a new full settings-frame parity claim. Delayed settings/tab/actor and deliberate-focus scenarios remain source-guarded but runtime-open.

Final npm run verify:build PASS after final translation/source changes: TypeScript + Vite7.3.7,231 modules,5.03s (earlier5.17s checkpoint predates final wording). Read-only API verifies final fixture avatarUrl null/socialLinks0. Browser logout and cleared network/device overrides; exact ID/email/username cleanup users/lists/social-links/audit0/0/0/0. Metadata outside Git. No suites, password changes, Docker rebuild, commit or push.


### Moderation bulk runtime and cleanup — 26.10.2026

Supersedes the runtime-pending/fixture-pending status below. Current Figma structured metadata remains Starter-limited, so no new frame-parity claim. Old Chrome tab remained unresponsive to focus-emulation commands despite getJsDialog returning undefined; a fresh tab in the same selected browser worked. Keyboard Enter with concurrent native confirm handling worked there; the earlier mouse/dialog timeout is not counted as a successful Cancel.

EN natural desktop: unique filter1c12604241 exposed only disposable review4073/comment18294. Select all checked exactly both. Blocked bulk-hide request showed localized action alert, focused P with cyan1.6px outline and retained selection. Subsequent keyboard confirm Cancel retained both selected rows. Real bulk success with explicit reason Disposable manual bulk1c12604241 removed both from queue, reset count0/disabled bulk and Select all, showed genuine empty state and focused h2. SQL verified both is_hidden1, same explicit reason and exactly REVIEW_HIDDEN/COMMENT_HIDDEN audit actions for those IDs. This EN check was at the natural viewport, not a new1440 matched-frame review.

UK320: additional disposable review4074/movie33 and comment18295 used. Blocked queue GET→Filter error, repeated-error Retry and successful Retry all settled on localized h2; success restored exactly the two UK fixture records. Bulk failure focused localized alert with visible cyan outline, retaining selection. Unblocked bulk with blank reason succeeded using existing localized default, left empty queue, selected0 and h2 focus. SQL verified hidden flags for both UK records; default-reason text was not decoded by the SQL client output, so no exact stored Unicode-text assertion. UK populated/error widths have matching client/scroll320/394/600/720/768/1024/1440 for requested320/393/600/720/768/1024/1440. UK320 screenshot inspected error outline, controls and populated rows. Remaining delayed/actor/page/locale permutations and full Figma geometry stay open.

Source unchanged since current TypeScript/Vite231/5.04s PASS. Logged out in the working UI; all network/device overrides cleared. Exact ID/email cleanup verified fixture users/reviews/comments/audit/lists0/0/0/0/0 for ADMIN8602 and its records. Metadata bulk-1c12604241.json retained outside Git. The prior request to press Cancel no longer blocks work; old-tab interaction remains a browser limitation, with no authenticated fixture session/data retained. No suites, Docker rebuild, commit or push.


### Active plan consolidation — 26.10.2026

PLAN.md reduced from874 physical lines/267007 characters to60 lines/8380 characters. It now contains the unchanged full goal, current next-work order,19 working packages, compatibility/protected-data invariants, accepted gaps/waiver and every final release gate. Removed overlapping historical active-order sections from the working plan; no UI completion state was promoted.

Before replacement, exact original bytes were archived outside Git at C:/Users/Legion/Downloads/rewind-master/.codex-backups/PLAN-before-consolidation-20261026.md and byte/hash equality verified, SHA256 0a34698f6800f7dfd5ed2b60c4902107e5e81a09a5a75e9b3bc0c79ba5b45f10. Historical tail audit found325 blocks; only15 exact normalized paragraph matches, so it was not labeled a verbatim duplicate. All193 historical Figma IDs occur in canonical HANDOFF/RELEASE docs; sampled apparently unique contract/checkpoint candidates already have canonical evidence. This is an ID/candidate cross-check, not a claim that all325 paragraphs were semantically equivalent. The preserved exact archive retains all historical wording while remaining proof review can refer to it.

README/docs have no PLAN.md fragment links to the removed headings. Canonical proof documents were retained, with no blind archival-tail duplication. Scoped diff --check PASS; no source changes/build/suites for this documentation-only block. Moderation browser confirm/fixture cleanup remains pending, as the plan explicitly records.


### Moderation bulk implementation, runtime pending — 26.10.2026

AdminModerationQueue now has synchronous mutation token, scope/actor/unmount/request guards, current-locale action error, cancellable lost-focus recovery and matching filter/page/clamp intents. Successful hide/retry/filter/page settlement targets h2 only from BODY/origin; failure targets a focusable alert. Root added a scoped cyan alert outline through moderationFocus. API/layout unchanged. npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.04s); scoped diff --check PASS.

Disposable ADMIN8602, review4073/movie5 and comment18294 created through API; metadata bulk-1c12604241.json outside Git. EN queue filtered by unique1c12604241 shows only those two records. Filter settlement focused Moderation queue h2; Select all checked exactly those two. Attempted bulk Cancel hit Chrome Input.dispatchMouseEvent timeout. getJsDialog subsequently confirmed a native confirm, but dismiss, documented tab recovery and CDP dialog handling all timed out in Emulation.setFocusEmulationEnabled; tab close also failed. User asked asynchronously to press Cancel; do not count Cancel, mutation success/error, outline, cleanup or remaining responsive checks as passed.

SQL after the interruption confirms review4073 and comment18294 remain is_hidden0/moderated_atNULL; fixture audit count0. Fixtures intentionally retained pending modal resolution, not silently deleted under an outstanding confirm. No real-user data changed. Normal Vite5173 remains active, no delay override. Next: resolve dialog, verify Cancel/blocked bulk error/success/Retry/locale and widths, then cleanup exact fixture IDs with counts. No suites, Docker rebuild, commit or push.


### Lists delayed stale-page and Auth results — 26.10.2026

Admin Lists: disposable ADMIN8600/custom20883, external Vite middleware delayed only DELETE of20883 by8000ms before forwarding to the real API. Confirm dialog accepted once during pending click; row visibly entered Loading. Keyboard Next moved to Page2 while DELETE remained pending. Settled result remained Page2 of29, total1431→1430, enabled pagination and Lists h2 focus; no captured-page decrement or return to Page1. SQL confirmed custom20883 absent before account cleanup. Logged out; exact account deletion verified users/lists/audit0/0/0. Normal5173 dev restored (session38733), external config/metadata preserved outside Git. This closes the named delayed stale-page success case; other failure/actor/locale permutations remain open.

Register: UK320 empty submit focuses required username; all three required fields are invalid. Real disposable account registermanual20261026a (ID8601) succeeds, focuses localized Account created h1, has no horizontal overflow, and Tab reaches Go to login; Enter navigates to/uk/login. EN1440 duplicate-account submission and repeated submission show Registration failed, focus register-error with visible cyan2.4px outline, and fields reference the alert. A37-letter Ukrainian password exceeds72 UTF-8 bytes and shows localized byte-limit error. EN error-state overflow measurements match client width320/394/600/720/768/1024/1440 for requested widths320/393/600/720/768/1024/1440. These are named behavior/overflow checks, not complete result-variant geometry parity. Exact ID/email/username cleanup confirmed users/lists0/0; no permanent account retained.

Reset missing-token: EN1440 displays localized alert and no form. Return link has visible cyan keyboard focus and navigates to/en/login. UK320 missing-token screen inspected: heading wraps, alert and Back remain visible without horizontal overflow. No password reset, real token or credential change performed; valid/invalid-token result and token isolation remain open. Temporary viewport cleared. No source changes, new build, suites, Docker rebuild, commit or push in this checkpoint.


### Admin Users delayed completion review — 26.10.2026

Manual browser checks used disposable ADMIN8598/target8599 and an external Vite middleware delaying only PUT/POST/PATCH for that target by4000ms before the normal proxy. Responses came from the real API; no mock app data or production settings were introduced. Pending state was observed as disabled controls/Loading before navigation.

Verified: (1) HQ grant with deliberate focus moved to Search users input preserves that input focus after success; (2) HQ revoke while changing search query to the admin returns only the new query's row and preserves Search button focus; (3) detail Block then Close leaves the catalog open, shows target blocked and keeps Users h2 focused; (4) catalog Activate then navigation to Settings leaves Settings and its link focus intact after completion; (5) UK role change to ADMIN then in-app EN switch, performed in one pending-flow call, settles with English administrator row, enabled controls, current query, no stale alert and route H1 focus. An earlier split-call locale attempt did not establish pending timing and is not counted. Role changes affected only the disposable target.

These observations cover deliberate focus, query transition, selected-profile Close, component unmount and UK→EN transition for the named actions. They do not prove every mutation/action/actor/page/failure permutation; remaining actor-switch, delayed-failure and page permutations stay open. Existing source guards and previous TypeScript/build results remain relevant; no code changed and no redundant build or suites ran here.

Logged out in UI; exact ID/email account deletion confirmed fixture users/lists/audit0/0/0. External delay config and metadata retained outside Git. Ctrl-C ended the tool session but left the identified delay Vite child alive; port inspection confirmed exact command/PID23908, which was stopped before restoring normal npm dev at5173 (session19603). No .env/DB volumes/settings changed; no Docker rebuild, commit or push.


### Admin Users mutations and pagination focus — 26.10.2026

Disposable ADMIN8596 and target8597 used for real supported HQ/active/role actions only. Pre-fix EN keyboard Grant HQ, Block/Activate and detail Revoke HQ succeeded but left BODY; Next settled Page2 with BODY. Detail history stayed unchanged after Revoke HQ until reload. Source audit also found missing mutation scope/actor guards and a state-only duplicate-action lock.

AdminUsers now shares a synchronous mutation token, scope/actor/unmount checks and cancellable lost-focus recovery. Success targets the matching enabled HQ/active/role control; failure targets a localized focusable alert, only when focus remains BODY/origin. Stale same-actor completions refresh the current view; old actors/unmounts cannot apply UI. Explicit pagination carries only matching query/page/locale/actor intent through GET and last-page clamp. Detail mutations refresh supported overview/history without claiming an unsupported history feature.

Post-fix EN1440 detail HQ success focused Revoke HQ with cyan outline; blocked fixture-only request focused localized error. Role ADMIN→USER returned focus to the select; both role changes appeared in refreshed history. Block/Activate success returned corresponding buttons and refreshed history. EN catalog keyboard Next Page1→2 and Previous2→1 both settled on Users h2. UK320 catalog Revoke HQ, blocked Block, then successful Block/Activate focused corresponding controls/alert with visible cyan outline. Real-user roles/data were untouched.

UK populated history reviewed at393px; UK catalog320 and EN desktop controls inspected. UK catalog/detail and EN catalog client/scroll widths match320/394/600/720/768/1024/1440 for requested320/393/600/720/768/1024/1440. These overflow measurements do not establish every width/state's visual parity. Existing Profile geometry evidence remains scoped; delayed mutation/navigation/locale/actor and deliberate-focus permutations remain runtime-open, with source guards only. No new Figma parity claim.

npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.10s). Browser logout completed; network/device overrides cleared. Exact ID/email fixture cleanup verified users/lists/audit0/0/0; metadata outside Git at admin-users-be93f44e7b.json. No suites, Docker rebuild, commit or push.


### Admin Lists visibility, deletion and pagination — 26.10.2026

Disposable ADMIN8595 and custom list20867 “Manual admin list 26b623096b” used for supported real API outcomes. Pre-fix EN1440 keyboard Hide succeeded but left BODY; blocked Publish and repeated catalog Retry also left BODY. AdminLists now uses scoped mutation/request/actor/page/locale/unmount guards, synchronous token and cancellable lost-focus recovery: visibility success→corresponding enabled button, mutation error→visible alert, successful Delete/GET Retry→h2 after reload. Stale same-actor responses refresh the current catalog instead of applying a captured-page decrement. That stale delayed-delete scenario remains source-reviewed, not runtime-verified.

Post-fix EN1440 Publish/Hide returns focused counterpart with cyan2.4px outline; blocked visibility focuses cyan alert. UK320 Publish success and blocked visibility failure likewise preserve visible keyboard focus. Delete Cancel kept exact fixture row; blocked DELETE preserves row and focuses localized alert; unblocked confirmed disposable DELETE removes row, reloads and focuses UK Lists h2. Initial sequential native-dialog interaction timed out; refreshed dialog/UI established cancellation and preserved row. Later confirmation checks were handled during the pending click, without duplicate action. Catalog repeated-error/success Retry focuses h2. System-list rows expose Publish but no Delete; no system list or other user's data was changed.

Keyboard Next initially reproduced BODY focus after settled Page2. Explicit page intent now carries only its matching page transition/clamp and focuses h2 after GET; EN Next Page2→3 and Previous3→2 verified with visible outline. Deliberate-focus/stale-page guards remain scoped; unobserved delayed mutation/locale/actor permutations are open.

Current Figma1344:5249 confirmed1440×3238. Runtime already has1200px cards,393px lead/364px subsequent minimum heights and84px rhythm; title nowy1073. Supported description text was omitted despite existing DTO field; now rendered when nonempty. Shared formatMovieCount fixes UK1 фільм and EN singulars. EN1440 first card x120/y1139.80/1200×393, compared with raw/reference first card1344:5283 atx120/y1344: omitted report-control region changes vertical placement. Report/edit/likes/history capabilities remain explicit gaps; no full-height/table parity or fabricated controls claimed. UK/EN320/393/600/720/768/1024/1440 client/scroll widths match320/394/600/720/768/1024/1440. UK768 row controls stay inside card bounds; phone description/count/focus inspected.

Final npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.55s); scoped diff --check PASS. Before account cleanup, SQL confirms custom20867 already absent; browser logout and guarded exact account deletion then verify fixture users/lists/audit0/0/0, including built-in fixture lists. Metadata outside Git, network/device overrides cleared; normal dev server unchanged. No suites, Docker rebuild, commit or push.


### Film Data, Privacy and Deletion final static review — 26.10.2026

Film Data reference identity corrected in the older mislabeled checkpoint: direct current node1164:2484 is footer TEXT462×24 of Important Data, not a1533px frame. Actual Film Data1162:2305 is confirmed1440×1533 (consistent with earlier correct source/inline-link checkpoints). Current full EN1440 page and current canvas reviewed: title280, sections845.80/1008.55 vs recorded848/1010 targets, footer1263.30/document1528. UK document1508 reflects the localized intro/English-only spacing adaptation. Real TMDB and Contacts inline links retain cyan focus; accurate refresh/non-endorsement/correction wording preserved rather than Figma's fixed update/merge promises. A5px English full-height difference is explicit, not pixel parity.

Privacy1164:2679 current frame1440×2022 and full EN1440 document reviewed: five ordered sections, h1y280, section headings825.80/1010.95/1218.50/1381.25/1521.60, footer1757.95/document2023. UK document2046 is natural translated wrapping. Supported factual copy is unchanged; production/legal/deployment assertions remain the existing content gap. EN rights links and UK393 links to profile identity/deletion anchors have visible cyan focus; no account form submitted. Source retains those legacy Profile anchors. Full page and phone rights region inspected.

Deletion1176:2515 current frame1440×1748 has four ordered sections. Source pre-fix document1725 was23px short because Security/Privacy paragraph wrapped to one22.4px line while reference1176:2594 reserves1126×45 (read-only raw reference). Current Policy Updates1176:2597 inspector verifies y1248/h26. A deletion-only desktop min-height45 restores that paragraph slot; source final UK/EN document1748, footer1482.60 vs implied target1483; Policy Updates1246.25 vs1248. First three headings713/875.75/1083.30 closely match713/876/1083. Full EN screenshot/current canvas composition reviewed. Mobile keeps natural wrapping; no legal copy, API, deletion flow or paid-service claim added.

Film Data, Privacy, Deletion and supplementary About UK/EN requested320/393/600/720/768/1024/1440 all have equal client/scroll320/394/600/720/768/1024/1440. This completes the named outstanding static Service layout/link checks with explicit copy/font/sidebar differences; it does not certify legal policy or real account deletion, nor create absent routes. Final npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.15s); scoped diff --check PASS. No data writes, fixtures, suites, Docker or Git delivery; device metrics reset.

Separate list inventory correction: current PublicList CSS hides ordinal markers at both≤720 and≥721, covering every width. The old641–1023 concern is superseded by source evidence; no new runtime comparison or code change was made, and the matched-width waiver/ranked API gap stays in effect.


### Admin Users profile cards and retry verification — 26.10.2026

Current Copy User Profile1237:4369 is1440×3059. Live inspector confirms identity card1498:8936 x120/y1219/1200×829. Current Find text1237:4690 worldy−19147 relative to framey−20221 gives titley1074. Original read-only local reference (different file key, provenance retained) supplies lower rectangles1237:4693/4645 atx119/803,y2133,516×501 and footer1393:3575 y2794/265; current canvas independently shows those cards below the identity card. Raw solid paints for1237:4550/4693/4645 are white at5% opacity. No asset or design mutation.

Confirmed runtime structure defect: history/activity were nested inside the identity card, narrowing them and growing its height beyond829. They now form separate sibling cards; supported identity/actions/history/stats and independent API states remain intact. Desktop profile-only spacing/fill updated. EN1440 final landmarks: title1074, identityx120/y1218.8/1200×829, lowercardsx120/804,y2132.8/516×501, footer2793.8 and document3059. Lower x positions differ from raw reference by1px. This verifies the measured card composition with real empty history/zero stats, not all inner field typography or every populated-history variant. No unsupported profile fields/actions added. UK/EN requested320/393/600/720/768/1024/1440 retain equal client/scroll widths320/394/600/720/768/1024/1440; representative EN320 stacked cards and cyan history-heading focus reviewed.

Confirmed pre-fix overview repeated-error Retry and successful Retry both left BODY. Scoped request/scope/locale/actor/query/page/unmount/rAF guards now restore lost focus only: identity error→visible error wrapper, identity success→h3; overview error→wrapper, success→historyh4; catalog Retry→Usersh2. Settled identity failure now says User profile instead of Loading. Existing entry/Close intent and mutations unchanged. EN1440 repeated overview error/success, identity error/success while overview stays failed, and catalog error/success manually verified. Identity blocking pattern also matched overview, so no isolated identity-only network failure is claimed. UK320 repeated overview failure/success focuses outlined wrapper/h4 above the rail. Positive search finds exact disposable user, absent query shows No users found; View profile focuses h3, Close returns Usersh2. Delayed/query/page/actor permutations and role/HQ/active mutations remain open.

Disposable ADMIN8593/target8594 created solely for these reads; no role/HQ/active action was performed on target or real users. Browser logged out; exact ID/email cleanup verifies users0/audit0. Metadata outside Git. Final npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,4.96s); scoped diff --check PASS. Network/device overrides cleared; normal dev server unchanged. Canonical docs now include a scoped19-package matrix and3 merged alias/duplicate rows (72 lexical rows/196 IDs, not an acceptance denominator). No automated suites, Docker rebuild or Git delivery.


### Admin Settings landmarks and Movie editor focus — 26.10.2026

Settings geometry now corrects the confirmed desktop80px top offset and moves the h2 outside the card. Current Figma1404:4110 h2y1073/h29; canvas card top approximately1214, shared frame1404:4076 height2378. Final EN1440 source: hero y0/h1020, h2y1073/h28.8, card x120/y1213.8/1200×734, footer2112.8 and document2378. Footer target2113 derives from frame2378 minus shared265px footer; canvas card position is a visual estimate, not a newly selected rectangle-node read. Settings-specific bottom spacing165 preserves that layout. Current four supported API rows stay inside the card; no Figma-only timezone/branding/policy/backup controls added. UK/EN requested320/393/600/720/768/1024/1440 all have equal client/scroll widths320/394/600/720/768/1024/1440. Representative desktop screenshot confirms heading/card separation. This closes these measured Settings landmarks, not every Admin identity/nav/table frame or state.

Disposable ADMIN8592 and movie4160 “Manual editor e663377597” used for editor checks. External Vite manual config delays real GET/api/movies/4160/details and PUT/api/admin/movies/4160 by4000ms, without substituting response content. Initial5176 Save failed (unsupported development origin); that failure is not counted as successful mutation evidence. Verified the task-owned5173 server process and temporarily ran the delay config on the allowed5173 origin, preserving backend CORS rules. Original normal dev command was restored afterward; no Docker/environment/security configuration changed.

Confirmed pre-fix editor defect: while details GET visibly Loading, deliberate focus on Admin Users was replaced by Film title after response. Guarded one-shot focus, scope/lang/actor/page/request/unmount checks, rAF cancellation and synchronous save token now preserve external intent; Cancel/Summary collapse invalidate editor focus intent. Actual successful server response still updates catalog truth after collapse. Repeated detail-error Retry additionally left BODY; now the existing error notice has a focusable outlined wrapper and explicit guarded error target.

Post-fix EN1440 observed pending GET followed by Users focus: settled response keeps Users. Normal Edit/prefill focuses Film title; complete duration120/description/date/rating populated from real details; Cancel closes editor and returns Edit. Blocked details initial/repeated Retry focus visible cyan wrapper; unblocked Retry restores title focus. Observed Saving… disabled state during delayed PUT; deliberate Users focus persists after successful save/editor closes. Blocked PUT leaves draft/editor open and focuses localized alert with cyan outline. Successful keyboard Save closes editor and returns Edit with cyan2.4px outline. These are supported behavioral checks; Movie editor full-frame/UK/phone/mutation permutations and nullable-field clearing semantics remain open. No backend partial-update semantics changed.

Final npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.32s). Exact disposable movie deleted through API; after browser logout exact ADMIN deleted. Verified users/movies/audit0/0/0. External metadata/config retained outside Git. Delay server stopped, normal dev server restored on5173;5176 stopped. Browser blocked URLs/device metrics cleared. Attempted Home delay check still did not show pending state, so that Home concurrency check remains open. No suites, Docker rebuild, commit or push.


### Admin Settings read/save focus verification — 26.10.2026

Disposable ADMIN8591/settingsae6ea5614c@example.invalid used; original site_name row snapshotted externally as Rewind/updated_byNULL/updated_at2026-10-17 10:42:25. Confirmed pre-fix defects at EN1440: blocked GET/admin/settings then successful Retry left BODY; blocked PUT/admin/settings/site_name Save and repeated Retry also left BODY. Requests were blocked only in this tab; no setting changed in those cases.

AdminDashboard now guards settings mutations by committed view/locale/auth/actor generation, unmount and ref-token (synchronous duplicate protection), and restores focus after settlement via cancellable rAF only when focus remains on origin or BODY. Save/retry failure targets visible alert; success targets corresponding enabled Save button; load Retry targets h2. Existing request/payload contracts and supported four settings unchanged. No success data or extra Figma-only control invented.

Post-build manual EN1440 load Retry focuses admin-settings-title with cyan outline. Save failure and repeated Retry focus localized alert. Unblocked Retry saves unchanged Rewind and returns to the site_name Save; keyboard Enter on unchanged Save retains it with visible cyan2.4px outline. UK320 keyboard Save failure focuses localized alert with cyan1.6px outline above phone rail; client/scroll320. Full delayed route/locale/actor/permutation runtime coverage remains open; guards reviewed in source only.

Figma1404:4076 current canvas is1440×2378. General Settings layer1404:4110 is x619/y1073/201×29. Current source h2 is y1162.80 inside workspace; hero is y80/height1020 and workspace x120/y1132/1200×734. This confirms remaining Admin shell/heading placement work, not a closed geometry check. Figma has many unsupported branding/time-zone/policy/backup controls; current API-backed four rows remain the supported subset. No broad Admin parity claimed.

npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.14s); scoped diff --check PASS. After logout, guarded SQL restored original site_name metadata and removed exact disposable user; verified fixture user0/audit0 and original row Rewind/NULL/2026-10-17 10:42:25. Metadata retained outside Git. Network/device overrides cleared. No suites, Docker rebuild, commit or push.


### Help section and artwork review — 26.10.2026

Current canvas1062:1993 inspector1440×4025 and complete composition reviewed against EN1440 source. Direct text-layer anchors: Tell Us What You’ve Seen1062:2029 x120/y713; Browse Your Films1065:2405 x781/y975; Watchlist1065:3019 x121/y1436; Settings1065:3153 y1894; Activity1065:3381 y2300; Make and Share Lists1065:3667 x781/y2707; Film actions1065:3918 x120/y3343; Tagging films1065:4163 x616/y3343. EN source corresponding headings y713/975.80/1437.60/1897.40/2294.20/2700/3336.80/3336.80; the measured vertical differences are at most7px. Lower source cards use x120/612/1042 with278px image widths; middle heading is4px left of the inspected target. Six alternating illustrations and three final cards match the observed composition; all14 local img elements loaded with naturalWidth>0 after keyboard traversal to the lower card. Images are decorative examples with embedded English Figma UI, not interactive app controls.

Actual instructions intentionally describe supported app behavior. Figma “Tagging films” describes diary/film tags; current contract supports list tags, so localized “Tagging lists” links to My lists. Film-actions copy omits unsupported dated diary logging; settings copy refers to supported profile/password/avatar/connections/newsletter flows. No unsupported action is promised or simulated. Source EN document3994; UK4032 (localized wrapping), compared with target4025. These are documented content/fallback-font variations, not a forced-height or pixel-perfect claim. UK1440 six-row/three-card sequence and all nine localized real link destinations inspected. UK393 Account Settings link targets/uk/profile?settings=authentication with visible cyan focus above bottom navigation; representative phone stacking reviewed. UK/EN requested320/393/600/720/768/1024/1440 all have equal client/scroll widths320/394/600/720/768/1024/1440. No separately confirmed Help phone frame is claimed.

This closes the previously open per-section/composite-artwork desktop review to the stated measured tolerance and explicit supported-content differences. No code changes or build rerun; latest build remains current. Device metrics cleared, viewport reset. No tests, data writes or delivery actions.


### Contact matched-width and phone keyboard review — 26.10.2026

Current Figma1122:2497 is1440×1920. Direct Find/inspector layer reads: Account Support + Film Data1122:2511 x120/y878/h26; Editorial + Partnerships1122:2512 y1055; Press + Advertising1122:2602 y1254. Canvas shows the three groups/dividers, final request-board copy and three sample email addresses. Current EN/UK content1440: hero h1 y280/h69.01, group headings x120/y855.20/1032.35/1231.90/h25.95, footer1591.45, document1857. This is a matched-width comparison with an explicit shorter-content adaptation, not exact full-height parity: production uses the owner-confirmed single support address and truthful bug-report instructions, without the Figma sample addresses/archived-board claim. No extra blank spacing added solely to force1920px height.

UK/EN requested320/393/600/720/768/1024/1440 all have equal client/scroll widths320/394/600/720/768/1024/1440. EN FAQ link target/en/faq and cyan outline verified; UK393 real mailto:anonimua910@gmail.com focus visibly outlined above the bottom rail. Mail client was not launched. This supersedes older Contact “only1920 structure / matched-width open” statements for the reviewed static composition and links. No source change/build rerun required; latest Home build remains current. Other Service routes retain their own remaining checks.


### Home retry recovery and Auth intro classification — 26.10.2026

Current Chrome Home guest/member composition was cross-checked against current canvas1413:6471 (1440×4934),1413:6263 (1440×5020) and1327:3210 (393×2463). Member UK/EN requested320/393/600/720/768/1024/1440 have equal client/scroll widths320/394/600/720/768/1024/1440. Representative desktop, phone and UK768 screenshots reviewed. Actual Journal remains empty; older concurrency-fixture films without posters exercise real fallbacks. These observations preserve previous anchor evidence rather than claiming new populated-original-art parity or full Home closure.

Confirmed Home defect: block movies/search GET, then unblock and activate newest Retry; settled requests removed the control and left focus on BODY. Home now tracks retry origin/section/request/scope, restores only lost focus to a visible heading or section, and uses error summary/h1 for global recovery. Deliberate focus movement cancels pending recovery; route/locale/actor/unmount and rAF cancellation are guarded. Scoped cyan focus outline and scroll margin added. Manual UK393 repeated section failure and success focus H2; global failure focuses home-retry-summary, global success focuses home-title. EN1440 section success focuses H2; guest1440 hidden newest heading correctly falls back to visible SECTION home-newest. Outline visible, page overflow0. Navigation focus remains Search after a retry, but requested network latency did not produce an observed pending state; delayed-completion concurrency is still open, not counted as passed.

Disposable member8590/home1b4c644746@example.invalid created solely for this local audit, logged out, deleted with exact ID/email guard; remaining COUNT0. Metadata outside Git. Temporary blocked URLs, network conditions, cache and device metrics restored. npm run verify:build PASS (TypeScript + Vite7.3.7,231 modules,5.04s). No automated suites, Docker rebuild or Git delivery.

Current Figma direct canvas/inspector classifies three formerly ambiguous393×852 Auth frames:915:1598 “start reg” is a blank gradient launch screen;911:1596 “registration mobile2” is the same gradient with centered REWIND logo;922:1788 “registration mobile3” is an entry choice with Back, logo, Create Account and Log In. They are intro/entry compositions, not Register validation/error/success states. No corresponding web intro route/prototype transition is confirmed; keep that route question explicit, without adding a splash delay or treating existing Register results as these frames. Existing form frames944:1582/1828/1887 remain Login/Register/Forgot.


### Hidden frame classification and FAQ measured alignment — 26.10.2026

Current-Copy845:1679 was temporarily revealed through its selected Appearance visibility checkbox, then centered through Actions→Zoom to selection. The canvas shows a393×1162 Profile Films collection: Back/Filters toolbar, four poster columns/six rows, star ratings and fixed bottom navigation. It sits beside a public-style Jeremy overview with Follow, Watchlist and Likes. Classify the composition as Profile Films phone; the existing /users/:id?view=collection&collection=watched is the source crosswalk, while the exact prototype/owner branch remains unverified. A read-only EN source review at requested393/content394 shows Films toolbar, Filters and genuine empty Watched state (titley62.9, no overflow); no populated-grid parity claim. Original hidden state was restored on the same node (x−4892.76/y4538/393×1162, Show checked), and a subsequent screenshot confirms its content disappears while the selection outline remains. The initial uncheck tool reported a checked-state error before the asynchronous Hide state appeared; the refreshed UI, not that error, determined the subsequent action. No lasting Figma design/visibility change.

FAQ direct current-file Find reads: first heading Why Rewind? node1162:2208 atx120/y713/h26; second How do I use the site? aty876; last What makes Rewind different? node1162:2283 aty1528/h26. Hero title1162:2205 isx489/y280/534×69, font58; lead isx483/y357/547×87. These provide layer evidence beyond the earlier small canvas crop. Source question anchors713/875.75/…/1526.75 are within about1.25px, so the earlier≈34px full-height variance was dominated by bottom spacing. Scoped FAQ editorial bottom padding now46.5 instead80 (main retains80), without changing other service pages.

A separate hero mismatch was confirmed: Arial fallback made the English FAQ heading wrap into two lines and displaced its lead. FAQ-only desktop English tracking−.013em preserves58px and the intended single line. Final EN content1440/viewport1000 DOM text bounds: x489.36/w534.26, headingy280/h69.01, leady357.01; footer1786 and document2051. Shared footer265 plus target frame2051 implies expected footer1786. Desktop screenshot confirms the restored composition. UK/EN requested320/393/600/720/768/1024/1440 retain equal client/scroll320/394/600/720/768/1024/1440; representative768/1440 views inspected. Truthful subscription copy/existing-route sidebar differences remain documented; no global font or service layout token replaced. This verifies these measured layout targets, not universal pixel-perfect typography or every service route.

Final npm run verify:build PASS: TypeScript + Vite7.3.7,231 modules,5.10s. Scoped diff --check PASS. No suites, API mutations, DB writes, Docker or Git delivery. Temporary local device metrics cleared and viewport reset. Partial39-row ledger counts unchanged: classification is not a new matched runtime frame. Previous unclassified845/FAQ≈34px observations are historical and superseded by this checkpoint.


### Populated Journal fixture, Back accessibility and mid-width layout — 26.10.2026

Created a temporary Vite GET-only Journal fixture at127.0.0.1:5175 from an external config under .codex-backups/journal-manual-20261026. It serves five localized sample articles, one archive month and article details, reusing the existing e2e fixture shape/content concepts; this was a manual browser preview, no test suite execution. Only Journal GET routes are substituted. Other API calls retain the normal proxy. Existing local gradient artwork is a representative fixture cover, not the Figma editorial photo/collage or a new production asset. Relative cover URLs were initially rejected by safeHttpUrl; changed only the external fixture to an absolute loopback URL. Loaded hero cover natural width1920 verified. No DB/content mutation.

EN1440 feed: first cover x120/y212/513×612, second x120/y995/444×408, third y1571.8; these preserve the recorded editorial-template anchors. Category News shows one matching fixture article; Awards shows empty published-content copy. Archive December2025 selects a pressed month; Show all months clears it and focuses Section SELECT with cyan2.4px outline. Blocked feed GET then Retry restores populated content and focuses the SECTION with cyan1.6px outline. Blocked archive GET then Retry restores the archive button and focuses journal-archive-title, cyan1.6px/top587.8. Article blocked GET then Retry restores #journal-article-title with visible cyan1.6px outline at top251.875. Initial same-call focus reads could precede rAF; subsequent reads/screenshots confirm final focus.

Populated article revealed Back was occluded by the fixed header: desktop recty74/h44 hit-tested HEADER, phone recty0/h44 hit-tested the home logo. JournalArticle desktop Back top offset now yields y122, below106px header; mobile populated page top padding80 places its44×44 Back aty80 below64px header. Post-fix hit tests resolve /en/journal on both widths; desktop gold focus screenshot and Enter return to populated feed confirmed. Article header x≈120/y0/1126×909 and content y909 remain unchanged on desktop; loaded cover1126×642 starts425.725. Mobile content gets the necessary header inset; no separately confirmed mobile article frame is claimed.

EN populated feed at1024 had document scrollWidth1054/client1024 from fixed444/314/174 columns plus61px gaps. Added901–1199 fluid row columns and bounded thumbnail. The feature's absolute thumbnail also overlapped its byline at1024; within the same range it now occupies a second grid row instead. Final footerBottom437.85, thumbTop469.85, overlap=false; screenshot confirms separation. Final1024 client/scroll1024.1440 cover anchors remain212/995/1571.8 with original513/444 widths. UK feed and UK/EN populated article requested320/393/600/720/768/1024/1440 have equal client/scroll320/394/600/720/768/1024/1440;393 is browser subpixel rounding. Representative desktop/mobile screenshots reviewed. Five-article shared-template coverage does not prove all seven Figma content variants, original imagery/collage, newsletter or every fault/locale permutation.

Final npm run verify:build PASS: TypeScript + Vite7.3.7,231 modules,5.09s. Scoped diff --check PASS. No automated suites. Cleared tab URL blocks/device metrics, reset viewport and closed fixture tab. Stopped only the verified owned Vite process listening5175; external config retained for repeatable manual fixtures. Live API /journal/articles still returns0 articles. Standard5173 preview, DB, .env, Docker images and production Journal contract unchanged. FAQ≈34px height investigation remains open; it was not closed by this Journal block.


### Auth geometry/results and FAQ responsive review — 26.10.2026

Final combined npm run verify:build PASS after request-copy fix: TypeScript + Vite7.3.7,231 modules,5.19s. Scoped diff --check PASS. No suites, Docker or Git delivery in this block.

Forgot request failure reproduced with only POST /api/auth/forgot-password blocked for an absent example.invalid address: UI incorrectly said the link was invalid/expired, although no token link was in use. ForgotPassword now uses new UK/EN forgotRequestError copy; Reset's resetInvalid is unchanged. Final blocked-error repeats show correct localized request failure and active #forgot-password-error with cyan2.4px outline. Clearing the block and resubmitting the absent address returns the existing uniform success message in EN and UK; status receives visible focus (EN top451.2). No real email/account/token/password changed. An initial post-HMR attempt encountered the browser's empty-email validation; it was not counted as a request-error check.

Auth requested393 mobile metrics round DOM client/scroll to394 (body/subpixel393.6). EN Forgot anchors: title y351, email x51.8/y464.4/290×45, submit y538.4/290×56, close to recorded phone frame944:1887 landmarks. UK desktop1440 content: card x121/y316/1198×873, matching inspected rectangle629:1132; input627 wide, h1 y576. Login EN1440 card1198×873 at121/316, inputs x406.5/y508 and616/627×94; phone393 title169, inputs364.2/437.2, submit538.05. Register EN1440 card1198×1011 at121/316; phone393 title101, inputs290.4/363.4/436.4, submit537.4. UK/EN320/393/1440 Login/Register all have equal client/scroll320/394/1440 and no clipped form controls. At320 both use268px inputs; EN Register wraps differently from393 because its smaller typography fits one title line. UK393 Register has a one-line title and first field247.2, consistent with the existing localized layout rather than forcing English line breaks. Blank UK Register password visibility toggle changes type text then password; no credential was entered. These are geometry/control checks; all auth result/token/pending-navigation variants remain separate. OAuth/Remember/phone-recovery gaps retained.

Current-Copy FAQ1162:2193 directly selected and zoom-to-selection confirms1440×2051 with sidebar, gradient hero, six Q&A and footer. EN source at content1440/viewport-height1000 has h1 x483/y280/w547; first Q713, then875.75/1038.5/1201.25/1364/1526.75; footer1819.5, document2085 (about34px taller than frame). Earlier height2051 viewport forced min-height stretch, so that2316 document measurement is not valid parity evidence. Keep typography/content-height difference open; do not attribute a cause without layer measurements. Truthful no-paid-subscription copy and existing-route sidebar gaps remain deliberate product differences.

FAQ UK/EN requested320/393/600/720/768/1024/1440 report client=scroll320/394/600/720/768/1024/1440 with mobile metrics. UK393 screenshot confirms readable hero, two-column service links, first question and fixed navigation; Tab from FAQ sidebar link reaches Film Data with visible cyan1.6px outline. No dedicated FAQ phone frame was identified, so mobile is responsive evidence only. No Service source changes or API writes. Tab-scoped URL blocks and device metrics cleared; viewport reset. Automated suites still deferred.


### Admin moderation mutations, deliberate focus and cleanup — 26.10.2026

Created local disposable ADMIN8588 and author8589 (baf8ed2b89), review4072 on existing movie5 plus comment18293 through CSRF-protected APIs. Only the disposable ADMIN role was promoted. EN requested1440/native client1425 manual checks targeted exact fixture content, never existing users' reviews/comments.

Review Visible only Enter Hide removes its row and focuses Reviews h2 with gold1.6px outline. Hidden only then exposes Restore. Delayed Restore with a keyboard change from Hidden only to Visible only preserves the current filter and SELECT focus, refreshing real server data rather than applying captured query state. This passed before and after the final patch (final900ms latency).

Two focus defects reproduced: delayed filtered Hide followed by deliberate Tab to Admin Films navigation ended on Reviews H2, stealing the new focus; Comment All-filter Enter Hide left BODY focused even though the row remained with Restore. AdminReviews/AdminComments now capture event.currentTarget, wait for mutation/reload completion and recover only if activeElement is BODY. Connected enabled origin restores itself; a removed origin falls back to h2. Deliberate focus, query-generation/locale/filter/page/unmount guards remain; pending is consumed inside executing rAF so cancellation does not discard it.

Post-fix: Comment All Restore restores focused Hide button with cyan2.4px outline. Blocking only its exact hide URL produces the localized mutation alert and restores Hide focus; clearing the block permits retry. Delayed Comment All Hide followed by Tab to Films preserves A[aria-label=Films]. Review Hidden Restore still removes the row and focuses h2. Repeating the original delayed Review Visible Hide + Tab now preserves Films link focus while the fixture disappears from the active filter; screenshot confirms visible navigation focus. One observation wait expired while the two delayed requests were still active; re-polling the same pending UI confirmed completion, with no restart. Final stale-filter Restore leaves filter=visible, active SELECT and fixture visible. Other locale/page/unmount/error permutations remain open; this is focused behavior evidence, not full-frame closure.

Final npm run verify:build PASS: TypeScript + Vite7.3.7,231 modules,4.93s. Scoped diff --check PASS; no automated suites. Author deleted own review through API (comment cascaded) and own rating through API so movie average recalculates. Admin logged out; exact-ID/email user cleanup followed. SQL verified users/review/comment/rating leftovers0/0/0/0. Cleanup metadata retained outside Git. Tab URL blocks/latency/device metrics cleared and browser viewport reset. No real-user moderation or global setting write; Docker images/volumes/.env unchanged.


### Admin read-state coverage and mobile overflow fix — 26.10.2026

Disposable local ADMIN8587/manualadmindbe8e3c927@example.invalid created via CSRF registration, promoted by exact-ID/email SQL only for this fixture, and signed in through Chrome. EN requested1440/native client1425: Dashboard displays six actual counters (448 users/active,0 HQ,203 films,115 reviews,0 hidden). Workspace metric rail measured x112.4/y1202.1/w1200/h542; h2 y1144. Desktop screenshots confirm three-column/two-row cards. These measurements are not exact1440-content Figma parity.

EN Users loads actual records and role/HQ/block controls; only the disposable user's View profile was opened. Its heading receives focus; detail shows zero activity and empty administrator-action history. No user mutations submitted. Movies renders live catalog/editor affordances; Reviews/Comments show actual content, full localized Year dates and supported visibility/Hide actions. Reviews Hidden only returns genuine empty state. Blocking only /api/admin/reviews* produces an error while the selected filter remains All; repeated Enter Retry focuses Reviews h2. Clearing blocked URLs then Enter Retry restores real records and focuses h2 at top800 with visible gold1.6px outline; client/scroll1425. No moderation action submitted.

Requested320 mobile Movies initially had scrollWidth432/client320. DOM inspection found its long fixture username created an intrinsic-width hero grid track (h1 x20/w411.975), stretching centered navigation and the page. AdminDashboard CSS now uses minmax(0,1fr) hero track, bounded title width and overflow-wrap:anywhere. Post-fix client/scroll320; h1 wraps within280px and nav remains a local280px horizontal scroll area. Screenshot confirms cards and header fit. Same Movies route requested393/600/720/768/1024/1440 produced matching client/scroll394/600/720/768/1009/1425. This is responsive robustness, not a new mobile Figma frame mapping.

Remaining EN320 read-only observations: Lists populated with system/custom lists and supported visibility/delete controls; Moderation queue populated with type/search/reason/selection controls; Audit log populated; Settings exposes four actual keys; Conversations lists metadata without opening message contents; Notifications exposes supported creation/filter/read controls and live list; Journal editor has supported fields/categories and genuine empty article state. Lists, Audit-log transition, Settings, Notifications and Articles had measured client/scroll320. UK320 Settings displays localized heading and four keys; Tab from site_name focuses Save with cyan2.4px outline. No Save/Publish/Delete/Hide/notification action submitted. All other locale/state/geometry permutations and disposable mutations remain open. An intermediate Lists navigation/wait did not persist and was not counted; its later authoritative URL+populated snapshot confirms the route.

Final npm run verify:build PASS: TypeScript + Vite7.3.7,231 modules,4.97s; scoped diff --check PASS. No automated suites or Docker rebuild. Viewer logged out, exact-ID/email cleanup returned COUNT0, metadata marked cleanupVerified outside Git. Per-tab block URLs cleared, device metrics cleared and viewport reset. Real-user roles, data and settings unchanged by this review; pre-existing audit-log entries were only read.


### Disposable network mutation and long-identity check — 26.10.2026

Created three local example.invalid users through CSRF-protected API: owner8584, target8585, viewer8586, unique suffix d3ac04441a. Owner followed target to populate its network; Chrome signed in only as viewer for mutations. Fixture metadata is outside Git. No real user relationships or roles changed.

EN Following at requested393/native-scrollbar content378: delayed Block (1800–2000ms) disables inline More/Follow and sheet Follow/Block while Done remains available. Success shows Interaction blocked. Before fix, subsequent parent network refresh removed/remounted the trigger and left activeElement BODY. PublicProfile now records only network-action focus, preserves the trigger through sheet focus, and restores the matching enabled visible row action after refresh; falls back to a visible heading. Route/actor/locale scope, disconnected-origin/body checks and deferred rAF consumption guard stale focus. UserFollowRow has stable member/action DOM markers; callback/API signatures unchanged.

Post-fix manual results: Block returns focus to the new More; keyboard Unblock also returns to More with gold1.6px outline; inline Enter Follow becomes Unfollow with focused visible gold outline; sheet Enter Unfollow closes and restores More with visible gold outline. No page overflow. Screenshot confirms final More focus. During delayed Unfollow, a scoped Profile Back click changes to /en/users/8584#public-profile-overview; after response, the new overview retains its route/heading focus, without stale More restoration. An earlier ambiguous Profile locator failed before navigation and is not counted as a delayed-navigation check. Did not claim every race/permutation covered.

Owner's fixture display name was changed through its own API to a50-character unbroken name and avatar to an existing local logo URL solely for geometry. Requested320/393/768/1440 yielded client/scroll305/378/753/1425, equal at each width. Title y317 at mobile; wraps to71.25px at320 and56.1px at393; avatar120×120 at320/768 and265×265 at1440, loaded natural width184. Representative320 screenshot confirms readable wrapping and circular avatar clipping. These are robustness checks, not Figma sample-image parity; authenticated extra profile actions/full-frame placement remain open.

Final npm run verify:build PASS: TypeScript plus Vite7.3.7,231 modules,4.99s. Scoped diff --check PASS. No automated suites. Viewer logged out through UI; verified exact ID/email transaction deleted all three fixture users, COUNT=0. Existing cascades remove disposable relationships. Cleanup status retained outside Git; network latency reset0, per-tab device metrics cleared, viewport reset. Docker images/DB volumes/.env and real accounts unchanged. Release gates remain open.


### Inventory follow-up — 26.10.2026

Independent read-only agent audit found75 canonical rows /196 unique numeric Node ID values, mixing real routes with aliases/components/prototypes. Added a19-package next-work queue to PLAN without treating those counts as completion percentage. App.tsx confirms `/faq` is implemented, superseding historical missing-route observations. Current Figma direct selection `845:1679` reports393×1162, x−4892.76/y4538, and Appearance checkbox Show checked (hidden); Shift+2 still displays unrelated visible cards. Did not toggle visibility or edit Figma. Route/content remains unclassified; record as hidden candidate separately from implemented-route acceptance.


### Community and Profile network fault/recovery — 26.10.2026

Manual browser fault injection now works with tab-scoped Network.setBlockedURLs, unlike the earlier unsuccessful Fetch fixture. Blocked only known local GET API URLs; no API bodies, persisted data or authentication changed. Cleared urls=[] after every recovery and again at final cleanup; temporary viewport reset.

Community UK at natural client1521: blocked /api/users/hq, verified isolated HQ error while reviewers/directory still populated; unblocked and Enter section Retry restored real empty HQ data and focus to community-hq, top305.4 with cyan1.6px outline. EN requested393 (native-scrollbar content378): blocked HQ/reviewers/directory, verified all three section failures and global summary. Popular section repeated Retry focused community-reviewers at top484.2. Global repeated Retry focused surviving role=alert at top262; after unblocking all three, global Retry restored reviewers/directory data and empty HQ, removed all alerts and focused community-hq at top242. Client/scroll widths match378. No overflow. This covers these fault/recovery branches, not every section/locale/width permutation or full Figma parity.

PublicProfile EN requested393/content378: blocked /api/users/7748/profile, then cleared and Enter Retry; real profile recovered with public-profile-title focused at top317, cyan1.6px outline, no overflow. Following error-to-populated recovery at the same width focuses public-profile-view-title at top62.25 and renders one real row. More opens with Done focused; Tab wraps to Follow inside dialog; Escape from Follow closes and restores More trigger (aria-expanded=false). No Follow/Block action submitted. Pressing Escape on the non-focusable dialog container was a tooling targeting failure; the focused button path passed.

UK requested1440/content1425 Following: repeated blocked-error Retry and unblocked successful Retry both focus public-profile-following-title at top487.6 with visible cyan1.6px outline; no overflow. Remaining: delayed user-focus/navigation behavior, actual disposable follow/block concurrency, Followers permutations and profile full-frame composition. No source changes/build/suites in this manual-only block; last combined build remains the231-module4.90s PASS.


### All Films keyboard and Profile retry checkpoint — 26.10.2026

Final combined
npm run verify:build` after the rAF race fix: exit0, TypeScript + Vite7.3.7,231 modules,4.90s. Scoped git diff --check passes. Automated suites remain deferred; release gates remain open.

Figma session now succeeds, but get_design_context(1480:9187) still returns the Starter call limit. Browser canvas directly confirms current-Copy All Films phone393×1215, with four columns/six rows, compact filter summary, pagination and bottom navigation. Zoom-to-selection exposes the full composition. Local UK /films at requested393×1215 with per-tab mobile metrics renders24 real API films (203 total, page1/9); first poster x16/y228.05,79.15×116.21,94.15px column pitch and135.21px row pitch. Rounded DOM client/scroll width394; no page overflow. This establishes live-data composition and measured geometry only, not identical sample artwork or full desktop/state parity.

Search.module.css now display-hides duplicate mobile h2 links instead of visually clipping focusable links; poster links retain accessible film names. Manual keyboard at requested393/native-scrollbar content width378 confirms first poster Tab goes directly to Send Help poster, with visible cyan outline. Filters Enter focuses Search Films; Escape closes filters and returns visible focus to Filter toggle (aria-expanded=false). No filter/API/data mutation performed.

PublicProfile main-error Retry now restores lost focus only if its origin was removed and focus fell to body. Repeated failure targets the error alert; successful recovery targets the visible view/profile heading. Community adds equivalent per-section/global recovery. Both defer consuming pending recovery until the rAF executes, avoiding loss when concurrent response updates cancel a scheduled frame. Navigation/locale/search/page/new-retry scopes cancel stale recovery; deliberate user focus movement is respected. Community injected failure/success, Profile successful recovery and delayed-navigation behavior remain runtime-open.

Manual real missing-user /users/2147483647 repeated Enter Retry: UK at requested393px (client/scroll378) and EN at requested1440px (client/scroll1425) both end with P[role=alert] focused at top128, visible cyan1.6px outline and no page overflow. The first EN attempt during agent/HMR changes ended on body; after source settled, repeated EN review passed. Do not count the intermediate attempt as a pass. No user records or relationships changed. Temporary viewport reset; prior own CDP tab was removed from browser session and no metrics persist on the new check tab.


### Films phone and integrated agent changes — 26.10.2026

Current-Copy Films Discovery `1480:7843` was selected and visually inspected at100%. Chrome's supported viewport and per-tab CDP metrics now work; earlier unavailable-viewport statements are historical. Requested393×1235 has CDP cssLayoutViewport393 and subpixel DOM width393.6/rounded394. UK/EN source anchors: popular y168/h149; Recent heading388, rail436/h116; Reviews heading587, cards635/784/h125; Crew944. Removed rail padding/native scrollbar height, corrected Crew spacing, switched phone review artwork to API author avatars/initials and real rating, placed ranks bottom-left. No fabricated films/ratings/assets or API changes. Missing API posters and unavailable Crew remain data/contract gaps. Desktop composition and full loading/error/empty coverage remain open.

Keyboard poster links skip hidden duplicate titles. Focus now reveals an offscreen poster via nearest scrolling: fifth poster fully visible at x277.6–377.6 after scroll170.4. At320px the wrapped heading ends641 and card starts645; no overlap. Requested widths320/393/600/720/768 report equal client/scroll widths320/394/600/720/768; desktop1024/1440 report1009/1425 due15px native scrollbar, also without overflow. These measurements and representative screenshots do not prove every frame/state or pixel-perfect parity.

Three agents changed isolated Profile/Auth/Admin/Journal files: follow/block concurrency guards and Following recovery focus; Auth submission result focus/current-locale messages/keyed reset-token isolation; Journal recovery focus and Admin moderation query-generation guards that refresh the current query instead of applying stale captured filters. Most mutation/recovery flows still require manual runtime review. Raw CDP Fetch fixture attempt did not produce a valid fault: interception patterns were cleared and its tab closed; it is not evidence of recovery.

Manual failed Login against a nonexistent local example.invalid account: error becomes activeElement `login-error`, computed cyan outline2.4px and top540 at requested393px. A Vite restart resolved stale CSS-module composition hashes; screenshot confirms the visible outline. No account created. JournalArticle missing slug, Enter Retry and repeated error: activeElement `journal-article-state-title`, top80 with cyan outline1.6px below the64px header (native-scrollbar content width378); no page overflow. The mobile state inset was adjusted from64 to80 for this outline clearance. This checks repeated error, not successful article recovery or populated Figma parity.

Combined
npm run verify:build` completed exit0: TypeScript and Vite7.3.7,231 modules,5.10s. No automated suites, Docker rebuild, commit/push or CI in this block. Any later source change requires a fresh build checkpoint. Follow-up Login source review added an unmount guard and current localized destination ref: a late response must not navigate away from a subsequently opened route. Pending-success/locale race runtime checks remain open. A fresh combined verify:build after that change passed exit0 (231 modules,4.92s). EN JournalArticle repeated-error Enter Retry at requested1440px also focuses the state h1 at top140, with visible cyan1.6px outline and client/scroll width1440. Temporary browser viewport was reset after review.


### Current frontend build checkpoint — 26.10.2026

After checking the Figma `Year` field on Admin Reviews and Comments, both components now render a localized full date from their existing `createdAt` in the right metadata column.
npm run verify:build` from `frontend/` passed: TypeScript `tsc --noEmit` and Vite 7.3.7 built 231 modules. A manual Admin route open redirects to `/en/home` without an ADMIN session, so the updated runtime and matched-width geometry remain unverified and the frames stay open. No automated suites, API changes, or data mutations; full frontend/backend/security/Docker release gates remain open.


### EN Login natural-width UI recheck — 26.10.2026

Local `/en/login` opened read-only at the natural CSS1920 width. Its accessibility tree exposes Email, Password, Show password, Forgot password, Log in and Create one. Remember me and Google sign-in remain absent, consistent with the documented session-persistence and OAuth provider gaps. This is control-presence evidence only, not matched-width geometry; no credentials were entered and no code/API/data changes, build or tests were made for this recheck.


### Guest Home frame `472:492` duplicate mapping and local auth-state correction — 26.10.2026

The current-Copy canvas selection and inspector confirm guest main page `472:492` at1440×4934. Same-canvas screenshots of `472:492` and `1413:6471`, together with matching dimensions and ordered text, confirm `472:492` is a composition-level duplicate of the canonical guest route frame, not a separate UI variant. The attempted local `/en/home` visit through `localhost:5173` was authenticated: its Account menu exposes Profile, My lists, Account Settings, Notifications, Messages and Log out. Thus localhost shares the active session with `127.0.0.1`; the prior anonymous-preview statement was incorrect. Guest runtime parity was not reviewed and no matched-width geometry is claimed. The `473:492` versus member `1413:6263` relationship remains unresolved. Figma `get_design_context` returned the Starter call-limit error; canvas inspection remained available. No code/API/data changes, build or automated tests.


### JournalArticle ellipsis requirement recheck — 26.10.2026

Current-Copy Figma `844:1547` is a 1440×3120 article frame; its composition has no decorative ellipsis/More action. The current `JournalArticle.tsx` also contains no unbound More action, confirming the planned removal is already reflected in code. The live API has no matching published sample article, so this does not verify populated runtime parity. No code changes, build, tests or Docker actions.


### Privacy Policy current-Copy structure and route review — 26.10.2026

The live Figma canvas identifies `1164:2679` as the 1440×2022 Privacy Policy frame; it shows the shared service sidebar, hero, policy content and footer. Local UK and EN `/privacy` expose corresponding localized copy and the same five policy sections at the unchanged natural browser width. EN first Tab focuses REWIND with a visible cyan outline. This confirms route/content structure only, not matched-width geometry or full-page parity. No source/API/data changes, build, tests or Docker actions.


### Reset Password missing-token UK/EN state — 26.10.2026

Direct navigation to `/uk/reset-password` and `/en/reset-password` without a token shows a localized “missing reset token” notice and a return-to-login link; the password form is not rendered. UK first Tab focuses REWIND with a visible outline. This verifies only the invalid-link state; no credentials or reset request were submitted, and the valid-token flow remains unverified. No source/API/data changes, build, tests or Docker actions.


### Messages inbox UK/EN route and keyboard review — 26.10.2026

At the unchanged natural browser width, `/uk/messages` and `/en/messages` show their localized inbox headings and genuine empty-conversation state. Source inspection confirms the no-target route fetches only the conversation list; selecting a thread fetches its messages and marks it read, so no thread was opened. UK first Tab focuses REWIND with a visible outline. Current-Copy Figma search has no public Messages frame, so this records route/state only, not design parity. No source/API/data changes, build, tests or Docker actions.


### Notifications route UK/EN state and keyboard review — 26.10.2026

At the unchanged natural browser width, `/uk/notifications` and `/en/notifications` render their localized headings, API-backed checked preferences, disabled Mark all as read control and genuine empty state. UK Tab traversal reaches the first notification preference checkbox with a visible focus ring. No checkbox was toggled, and no notification was marked read. Current-Copy Figma search identified notification text only in an Admin announcement panel, not a public Notifications frame; this is route/state evidence only, not design parity. No source/API/data changes, build, tests or Docker actions.


### ReviewDetails current-data recheck — 26.10.2026

Current-Copy Figma frame `1480:6826` is1440×1905 and visibly contains the Dune review hero, liked-member strip and footer. Local UK `/reviews/3650` at the browser’s unchanged natural width resolves to API review “Concurrent social film 5a62c9ea”, rating4/5 and two likers; the lower section renders those users with the existing initials fallback. Since the natural viewport is wider than the frame, this confirms live route/content and lower-page structure only; it does not establish new geometry parity or replace prior matched-width evidence. No source/API/data change, build, tests or Docker actions.


### PublicProfile overview UK live-data recheck — 26.10.2026

The Current-Copy canvas confirms `238:596` at1440×4459 with profile hero, overview tabs, Favorites, Activity, Reviews, Following, Lists and footer. Local UK `/users/439` at the unchanged natural browser width resolves account `verify610b52a96f31`: three activity events and one public test list, with no favorite/review/following/collection movies and zero-valued statistics. Statistics/rating distribution, Social Links, collection tabs and Liked Reviews continue below Lists in the runtime, as required by `PROJECT_REQUIREMENTS.md`. The Figma content and live account/auth state differ; this confirms route and current data only, not CTA parity or matched-width geometry. No data/source/API changes, build, tests or Docker actions.


### Ranked List contract recheck — 26.10.2026

Post-restart Figma `whoami` succeeds; `get_design_context` remains Starter-quota-limited. The live canvas confirms `1480:6134` at1440×2033 with “My Top” and numbered poster positions. Natural-width local EN `/lists/public/19606` shows the current API record with one movie and a fallback poster label. `PublicListDetailsResponse` and `MovieList` lack a ranked-mode flag, so the app cannot tell this design apart from normal list `1480:6071`; keep this as the existing documented API/UI gap and do not infer from title/order. No matched-width check per user direction. No code/API/data changes, frame count change, build, tests or Docker actions.


### Own Profile Films recheck — 26.10.2026

Canvas confirms `341:3348` is1440×3256, with a selected Films tab, Watched poster grid, pagination and footer. Local EN `/profile?view=collection&collection=watched` at natural width shows one live API film with missing poster art rendered by the existing letter fallback. No sample content was added. Matched-width geometry and keyboard checks remain open; no code/API/data changes, build, tests or Docker actions.

On a UK recheck at natural CSS1920, the accessibility tree and screenshot show the localized Films/Watched state with one live film (`Concurrent review film e9bd3cd2`, year unknown, rating4) and the same fallback letter. This confirms current route/data rendering only; the Figma canvas frame is1440×3256, so exact geometry remains unverified. No code/API/data changes, build, tests or Docker actions.


### Own Profile Followers recheck — 26.10.2026

The current canvas and inspector confirm `363:411` at1440×3863. The layer label says “Following”, but the visible section heading is “Followers”; the frame contains populated sample rows and Watched/Lists/Likes counts. Local EN `/profile?view=followers` at natural CSS1920 receives zero rows from the live API and displays the empty state. Per-user metrics are unavailable in the current contract and remain a documented gap. No matched-width comparison or fabricated data; no source/API/data change, build or tests.


### Own Profile Authentication EN recheck — 26.10.2026

Figma `251:549` canvas/inspector confirms1440×2061 with Current/New/Confirm password and Change. Local EN `/profile?settings=authentication` exposes all three fields; keyboard Tab from Current to New produces a visible gold focus ring. Fields remained blank and the form was not submitted. This is natural-width locale/keyboard evidence only; CSS1440 geometry and real submit outcomes remain open. No source/API/data change, build or tests.


### Own Profile Avatar/Banner recheck — 26.10.2026

Figma `251:660` canvas/inspector confirms1440×3120 and shows separate avatar/banner image previews with file-select buttons. Local EN `/profile?settings=avatar` shows a profile preview and the existing Avatar URL field; keyboard focus on the field produces a visible gold ring. The page has no file picker or Banner control. `ProfileUpdateRequest` and `PATCH /api/profile/me` persist `avatarUrl` only; there is no multipart upload or banner field/endpoint. File upload and Banner persistence are documented API gaps. The URL value was not changed and Save was not activated. Natural-width check only; no source/API/data change, build or tests.


### Own Profile Connections EN recheck — 26.10.2026

Figma `341:3207` canvas/inspector confirms1440×2073 and shows X Connected plus Instagram Connect. Local EN `/profile?settings=connections` shows URL inputs for Website, Instagram, TikTok and Letterboxd; keyboard traversal produces a visible gold focus ring on Instagram. Backend allowlist contains only those four link platforms; `GET/PUT /api/profile/me/social-links` stores URLs, with no OAuth or avatar-import flow. X and account-connect actions remain documented API gaps. No values changed or Save action; natural-width review only, no source/API/data change, build or tests.


### Own Profile Following recheck — 26.10.2026

Current-Copy canvas selection `445:455` confirms the complementary1440×3863 frame; its layer says “Followers” while the visible section heading says “Following.” Local EN `/profile?view=following` at natural CSS1920 receives zero records and displays the valid empty state; first Tab gives the REWIND link a visible cyan focus ring. The populated examples and per-user counts remain sample/API variance; do not fabricate them. No matched-width comparison, source/API/data change, build or tests.


### PublicProfile Following followed-state frame mapping correction — 26.10.2026

Selected current-Copy Figma node `1033:5458` directly in the live Chrome canvas; the inspector confirms393×852. The selected frame shows Following rows with a More control and a checked relationship action, with no count subtitle. Its visible sibling variant has plus controls, and another adjacent variant includes follower/following subtitles. This is an already-mapped frame-state clarification, not a new unique frame. The authenticated source viewer is not following the displayed member, so do not trigger Follow or synthesize persisted state to force a match; keep followed-state comparison open. Structured Figma MCP context remains blocked by the Starter call limit. No source/API/data/Figma changes, build or tests in this checkpoint.


### Popular Lists sort affordance and contract — 26.10.2026

Current-Copy Figma frame `1480:7927` is393×1301 and its canvas screenshot shows four cards with title/count above poster collections. Its static “Sort by popularity” child was previously measured at x279/y271/98×12 and has no prototype action. Updated mobile Popular feed cards so title and localized API `itemCount` precede posters. Current local EN `/lists/discover?feed=popular` at CSS393×852: sort x279/y271/98×12; first card x16/y319/361×150; title x35/y330; count x336.5; poster rail y352; four API cards and Page1of10; `scrollWidth=393`. UK count is localized as `1 фільм`; width393. Runtime list records have one preview film while Figma samples show multi-poster rows; no fixture or static sample data was added. `GET /api/lists/public/popular` still takes `page`/`size` only and sorts by active-liker count, `updated_at`, then ID; period semantics remain an API gap.
npm run verify:build` passed TypeScript and Vite (231 modules). No tests/API/data/Figma changes.


### Frontend build baseline — 26.10.2026

Ran
npm run verify:build` from `frontend/` after the current worktree review. `tsc --noEmit` and Vite production build passed; Vite transformed231 modules. This is a compile/build result only. No automated tests were run, and the outstanding visual, backend, Docker, data-preservation, commit/push and CI gates remain open.


### Figma quota and PublicProfile action specification recheck — 26.10.2026

After the workstation restart, Figma session creation succeeded, but `get_design_context` for current file `BDO9GO1oscOeUTcu4VXVKA`, node `825:1378`, still returned the Starter MCP tool-call limit. The live Chrome canvas remains usable. With the frame selected, its Prototype panel shows no frame-level transition. I then selected nested component `864:1780`, “Primary button for phone”: Prototype specifies While pressing → Change to `Variant3` and While hovering → Change to `Default`. These are component variant states; no route or follow/unfollow API flow is specified. This does not justify removing existing Follow/Block/Message API behavior; the recorded 63.6px downstream layout difference remains open. Rechecking an existing mapping adds no new frame to coverage. No source change, build, automated tests, Docker, commit, or push in this checkpoint.


### Figma access and Lists interaction recheck — 26.10.2026

Figma `whoami` and current-file session creation succeed after reboot (Full seat, Starter tier). `get_design_context` returns the Starter call-limit error. Chrome canvas remains usable. On existing current-Copy frame `1480:5182` (`1440×3856`), the Prototype tab exposes “Add flow starting point” and “Add action” with no configured frame transition. Treat Add-a-film click behavior as unspecified; no source/API/data change, build or tests. This is a recheck, not a new frame count.


### Ranked List mobile information state — current-Copy Figma review — 26.10.2026

Figma current-Copy frame `1480:9494` is393×852; the information group is361×328. At CSS393×852, API-backed `/en/lists/public/1366` originally opened a361×402.7 dialog because it included a separate Like text button. Updated the existing like/unlike action to a44×44 accessible heart control, keeping its API, `aria-pressed`, and loading/error/retry paths; adjusted modal spacing. Manual recheck at393: dialog x16/y498.3/361×328.7, Done x21/y766/351×56, `scrollWidth=393`. At320×852: dialog x16/288×328.7, heart44×44, Done278×56 and document width320 (no horizontal overflow). Keyboard Shift+Tab reaches the tags and heart with visible2px focus; Escape closes and restores focus to List information. This aligns the matched-width sheet shell/height; live data (0 likes, two tags, current title/owner) differs from Figma examples (10 likes, six tags, “My Top”). No exact-pixel claim. Ranked/unranked stays a data-contract gap: `MovieList` and `PublicListDetailsResponse` have no ranked flag.
npm run verify:build` passes TypeScript and Vite (231 modules); no automated tests, API/data/Figma edits.


### Ranked List desktop detail and editor intent — current-Copy Figma review — 26.10.2026

Current-Copy desktop `1480:6134` is1440×2033; the canvas shows “My Top”, public-list metadata, ordered numbered posters and footer. The phone editor `1480:9542` is393×852 and explicitly labels Ranked with “Show position for each film”. This confirms the missing rank-mode contract separately from persisted item order. The live `/en/lists/public/1366` route contains one API movie and was inspected at1920px, not the desktop frame width; no geometry match is claimed. Source emits ordinal markers, but CSS hides them at≥1024px and≤640px, leaving them visible only at641–1023px. Thus ranked desktop/phone markers are absent and normal tablet lists can be mislabeled. No speculative behavior or API migration was added; no tests/build were run.


### Create-list phone structure — current-Copy comparison — 26.10.2026

Current-Copy Figma `1480:9542` is393×852. The local EN `/lists` create route was manually checked at CSS393×852: Figma shows list name, Public/Ranked, description, Add films, tags and Cancel/Save; local shows name, description, tags, Public checkbox, Create, preview and My lists, with document width393. This confirms route/viewport correspondence but records a structural design gap, not a match. `MovieList` has no ranked field; the current flow adds films from movie pages, and the frame Prototype panel shows “Add action” with no configured frame transition. Keep behavior unchanged until specified. No source/API/data/Figma changes or automated tests; no new product behavior claimed.


### Own Profile desktop overview matched-width review — 26.10.2026

Compared current-Copy Figma `238:865` (1440×4459) against authenticated UK `/profile` at CSS1440×900. Figma's selected overview frame has background-only hero artwork; source hero x0/1440 includes H1, avatar265px x587.5/y274, identity x519.7/y555, metrics x395/y716.8 and actions. Other Own Profile frames show the identity overlay, so this is an unresolved cross-variant design inconsistency; no identity UI was hidden. Source anchors: rail/nav x120/y1105; Favorites y1269; Activity y1854.7; Reviews y2492.9; Following y2999.7; Lists y3228.9; document height4307. Figma sequence is Favorites, Recent Activity, Recent Reviews, Following avatars, Lists and footer. API source has1 favorite versus4 samples,4 activity entries,1 review versus2,0 following versus the filled sample, and1 system list instead of custom. Statistics follows Lists in source, unlike the frame; record composition variance and retain the feature. No source change, fixture, or test. The frame was already mapped.


### Own Profile Lists desktop heading alignment — 26.10.2026

Compared current-Copy Figma `341:4198` (1440×3338) against authenticated UK `/profile?view=lists` at CSS1440×900; browser client width1425 includes the15px classic scrollbar. Verified hero x0/1440, rail x120/y1105, section x120/y1269, and three live cards1200×339 at y1343.9,1706.9,2069.9. Figma's “Your Lists” is left-aligned; source “Мої списки” was centered. Added a desktop-only selector for the own Lists view; recheck confirms `text-align:left` at x120/y1269 and screenshot shows the heading above cards. Figma sample custom lists/poster strips differ from the API-backed Watched/Watchlist/Favorites data.
pm run build` passes (231 modules); no tests run before visual audit closure.


### Own Profile Likes desktop variant — 26.10.2026

Selected current-Copy Figma `341:3866` (1440×3256) on the live canvas and compared it to authenticated UK `/profile?view=collection&collection=favorites` at CSS viewport1440. The Likes rail is selected and “Вподобання” is left-aligned, consistent with the Figma “Liked” heading. The live API returns1 favorite versus the populated Figma grid, so this is a structural/title check with a content data gap, not pixel parity. The frame was already mapped; no unique frame added. No source changes or tests in this checkpoint.


### Own Profile Watchlist desktop variant — 26.10.2026

Compared current-Copy Figma `341:3632` (1440×3482) against authenticated UK `/profile?view=collection&collection=watchlist` at CSS1440×900. The selected Watchlist rail and shared geometry align: rail x120/y1105; section x120/y1269. Fixed the own collection heading from centered to left-aligned, matching “Wants to See” in Figma (UK label “До перегляду”). Live API returns0 items against24 Figma examples; empty state is valid and populated-grid parity remains a data gap. The lower Figma “How to Add” area is visible, but its actions/contracts have not been established. Frame already mapped; no new unique frame.
pm run build` passes (231 modules). No tests run before visual audit closure.

25.10.2026 — Rechecked Figma access after the user's rC restart. `whoami` and `create_session` succeed for the current file; `get_design_context` for `1043:2125` still returns the Starter MCP call-limit error. At that earlier checkpoint, CUA returned no apps or browser tabs, and the web reader could not open the Figma file URL. This turn recovered the open Chrome Figma tab and collected the separate canvas evidence below; do not count the earlier no-tab checkpoint as a current access state. No source/API/data changes or automated tests.

25.10.2026 — Checked Figma's official rate-limit documentation: the table reports no MCP-read allowance for Full/Dev seats on Starter, versus Professional Full/Dev up to200/day and10/minute. The current `whoami` result is Full seat on Starter, matching the observed rejection of `get_design_context`; upgrading to Professional/Organization/Enterprise is the documented path to higher read limits ([Figma Rate limits & access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/)). Reboot restores authentication but not plan eligibility/quota. No subscription change or further rate-limited call was made.

25.10.2026 — Recovered manual Figma canvas access through the already-open Google Chrome tab. `cua.getState()` was empty, but `getBrowser({url})` found the authenticated Figma tab. The editor's upsell dialog confirms Starter limits are reached; dismissed the informational dialog and reviewed the current-file canvas without changing the design. Manually rechecked Profile phone Films `1015:2131` (393×1162), Watchlist `1015:3356` (393×1564) and Likes `1015:4508` (393×1666) against a source-current browser tab at effective393px. Films source first card x16/y123/79×116 matches; Filters x333/y50/44×44; Escape closes, restores focus, visible2px ring. One watched API item versus Figma's many posters limits comparison to the first cell. Watchlist frame is populated, but the API is empty; the source section starts x16/y598/w361 and displays its real empty state. Likes frame is populated; source has one favorite with null poster and first cell x16/y647/79×116, matching the frame's grid start. `scrollWidth` is393 for all source routes; no data or API mutation. This is three partial mobile-state checks, not full parity. No tests or build run.

25.10.2026 — Re-read the current Person frontend and backend contract: `PersonType` is actor/director/producer; `PersonController` exposes only `/actors/{id}`, `/directors/{id}`, `/producers/{id}` and returns separate role-specific filmographies. No writer endpoint, writer repository/entity, biography field or unified multi-role response is present. This confirms the previously documented gap for Figma's multi-role / Films Written screen; it does not establish current-file visual parity. No source/API/data changes or automated tests.

25.10.2026 — The selected phone node `1480:7877` is the Popular Reviews heading group (361×27 at x16/y587); its Prototype panel has no action. The nested “More” layer was not selected in that review, so its route behavior remains unresolved. This historical observation is preserved here after shortening `PROGRESS.md`; it is not fresh current-file evidence. No source/API changes or tests.

25.10.2026 — Current worktree frontend build:
npm run verify:build` PASS; `tsc --noEmit` passed and Vite built231 modules in4.92s. This is a build checkpoint only; no automated tests ran and this does not close final regression. Figma MCP `whoami` confirms Full seat on Starter and file session creation succeeds, but `get_design_context` for `1043:2125` is denied by the Starter call limit. Current CUA state has no apps or browsers, so no new Figma visual evidence was collected. Previously recorded responsive/focus checks remain historical route checkpoints, not a fresh full-route pass.

25.10.2026 — After rC reboot, `cua.getState()` found Chrome Figma and Rewind preview tabs. Figma `whoami` and `create_session` succeeded for `BDO9GO1oscOeUTcu4VXVKA`; `get_design_context` for `1480:8594` still returned the Starter plan tool-call limit. The live Chrome canvas shows “Search Results films (svergunova phone)” with inspector393×852. Its poster grid is four across at y267 and two more at y402, with five bottom navigation icons. Current local UK/EN results at393 have first poster x16/y267/79×116; UK320 has x16/y267/60.8×89.2; widths match viewport. Scoped Films spacing changed the old source y274 to y267. Manual keyboard change Films→Users updated URL and retained focus on the native category select.
npm run verify:build` PASS (TypeScript + Vite,231 modules). No automated tests, API/data changes, Docker update, commit or push. The Figma MCP read limit still requires using Chrome canvas for additional frame checks.

25.10.2026 — Manual expanded Search review: the Figma inspector confirms `1480:8934` at393×2801. Source-current UK `/search?q=film` was opened at393 and Show more activated; API supplied12 film and12 review records. Main search content measures2791px; the full document including footer is3220px. A second manual phone viewport at320 remains320px wide with no overflow, height3245px, and focus stays on `role=tabpanel`. The full frame could not be reliably captured within the Figma canvas, so this remains source/responsive evidence only and not a completed frame comparison. Figma Journal phone node `1480:8889` reports393×1150, but its content was not brought into view for a matched screenshot. Local `/uk/search?q=film&tab=journal` returns `Журнал (0)` with the localized empty state and width393. No test suite, API/data change, Docker update, commit or push.

The current snapshot cross-check found250 unique frame IDs: 250/250 occur somewhere in `FIGMA_HANDOFF.md`. The main route table has70 grouped rows and literally names190 snapshot IDs (215 distinct IDs in total, including25 outside the old snapshot). The other60 IDs are classified as design/shell/component candidates, not route parity. Eight formerly hierarchy-sensitive nodes have since been classified in the current Figma canvas; no ambiguous nodes remain in that snapshot subset, though the snapshot is stale and current live inventory is not complete. This is inventory evidence, not visual coverage or a release pass. `1393:3652` (“More Users Activity”) is an unverified snapshot candidate; current admin user overview exposes aggregate counters and administrator action history, not the selected user's chronological activity.

Оновлено 25.10.2026, Europe/Berlin. Свіжий frontend
npm run verify:build` пройшов TypeScript і Vite (231 modules); повний regression лишається відкладеним до завершення візуального аудиту. Production VrS не розгорнуто.


### Own Profile Reviews follow-up — 26.10.2026

**Current-Copy one-card frame recheck — 26.10.2026:** Figma canvas selection confirms `377:456` at1440×2237, with one review card and pencil/trash controls. Local EN `/profile?view=reviews` at the unchanged natural CSS1920 viewport displays one API-backed review with Edit/Delete. Identity, film and review content differ from the curated frame sample. This confirms route/state and controls, not matched geometry or save/delete outcomes. No source/API/data change, build or tests.

**Inline editor keyboard and canvas recheck — 26.10.2026:** On the local EN Reviews route, Edit opens the textarea with focus; Escape closes the editor and the Edit button visibly regains its focus ring. The review content remained unchanged. Figma `445:547` recovered after an initial Loading state; canvas/inspector confirm 1440×2335 and the inline Delete/Save frame. Local screenshot at natural CSS1920 confirms the same editor controls, without matched-geometry comparison. Save/delete outcomes remain open. No source/API/data change, build or tests.

Live current-file Chrome canvas shows own desktop variants `363:289` (three cards), `377:456` (one card with pencil/trash controls), and `445:547` (inline editor with Delete/Save). Selected group `441:340` reports Prototype `Click → None`; these are static variants with no prototype transition. Implemented the explicitly shown controls on `/profile?view=reviews` using the existing review PATCH/DELETE endpoints. UK Chrome accessibility tree exposes localized Edit/Delete controls; clicking Edit opens a textarea with initial focus, Save/Delete labels are localized, and Escape closes the editor and restores focus to Edit. The icons have44×44px hit areas with36px visible circles. Verified Escape without saving, so the live review content was not mutated. Overview preview remains read-only. EN route exposes corresponding English labels.
npm run verify:build` passed TypeScript and Vite (231 modules). Dedicated mobile Reviews frame/geometry is unconfirmed; browser surface could not be resized in this pass. No automated tests were run.

25.10.2026 continuation after reboot: confirmed Figma editor authentication/session and captured the current canvas screenshot for `363:289` (1440×2859). Live UK source screenshot/AX at `/uk/profile?view=reviews` shows the same wide centered section/card structure with one actual API review versus three Figma examples. This is a content/data difference; no code, API, fixture, or live review was changed. MCP structured context remains blocked by Starter call limit. This recheck adds no responsive, matched-scale, EN, or keyboard evidence; no tests/build/Docker actions were run.


### Own Profile Films desktop keyboard follow-up — 26.10.2026

Manual Chrome at the available1920px viewport confirmed the desktop Films composition update on UK `/uk/profile?view=collection&collection=watched`: identity/actions/metrics and the visible page heading are hidden; hero artwork, profile rail, “Переглянуто” and the poster remain. The H1 is still exposed in the accessibility tree. Keyboard navigation from the final profile rail link now goes directly to the poster link; the poster has its own visible focus ring, and the non-interactive tabpanel no longer receives a Tab stop when movie links exist.
npm run verify:build` PASS: `tsc --noEmit` and Vite build,231 modules. Exact1440px geometry remains unverified. No automated tests, Docker, API/data changes or Figma edits.


### PublicProfile Lists desktop frame re-open — 26.10.2026

Figma All-pages Find selected mapped node `175:619`; the editor inspector confirms1440×2805. The frame shows public identity/metrics, selected Lists rail tab, two list cards, a separate tag cloud and footer. Local EN `/users/439?view=lists` at1920px shows the same order and a real API list card/tag cloud, with one current list versus two Figma examples. This is a structural/live-data comparison, not a matched-width screenshot or parity pass. No sample data was inserted; no tests or source/API/Figma changes.


### PublicProfile Lists UK keyboard follow-up — 26.10.2026

Figma current-Copy `175:619` is confirmed at1440×2805 with two list cards and a separate tag cloud. Local UK `/users/439?view=lists` at the natural CSS1920 viewport shows one live API list (`Edited verification list`) and two tags (`Verification`, `API`). Keyboard traversal reaches the selected Lists link with a visible gold focus ring. This adds UK live-state/focus evidence only; no matched-width comparison, list mutation, code/API/Figma change, build or test.


### PublicProfile Lists desktop canvas recheck — 26.10.2026

After reboot, the Chrome canvas opened 175:619; Figma inspector confirms1440×2805. The current UK route /uk/users/439?view=lists shows one live list (“Edited verification list”, one film) and two live tags (“Verification”, “API”); the frame contains two sample cards. The data variance remains, with no fixture or API changes. Existing mapped frame; no additional coverage count or parity claim. Structured Figma MCP context is still Starter-quota-limited; no source changes, build or tests.


### Global Search All live category state — 26.10.2026

The existing current-Copy phone frame 1480:8934 is selected in the browser canvas; Figma inspector confirms393×2801. Local EN /search?q=Journey currently exposes5 Users and4 Lists, with0 Films, Tags, Cast & Crew, Reviews and Journal. This is an API/data-state observation at the available wide browser viewport, not a matched phone screenshot. No controls were activated; no source/API/data/Figma changes, build or tests.

Tab navigation reached the query, Search button, category selector and active All tab; the query, Search and All tab displayed visible focus outlines. This was a read-only check at the wide viewport. No search was submitted or category selected; phone-width keyboard evidence remains open.

Keyboard ArrowRight from All selected the zero-result Films category and updated the URL to ?q=Journey&tab=films. The active Films tab announced count0; Tab then focused the associated results panel, which retained the empty message and Back to home link. Its gold focus outline currently spans the full results panel at the available wide viewport. This check is against the existing no-matches hierarchy in Figma frame 1480:5809, where the search input is also absent; exact-width focus appearance remains open. No action beyond route/category selection, no code/data changes and no tests.

From the empty results panel, Shift+Tab returned focus to Films; ArrowRight selected Users; Tab focused the Users panel; the next Tab focused the first live user card with a visible cyan outline. Five real Users remained available. No profile was opened and no data changed. Existing Search frame mapping, not a new coverage ID.


### Global Search expanded All live data and focus — 26.10.2026

EN /search?q=film returned152 films and101 reviews. The collapsed All view displayed6 films,3 reviews and Show more. Activating it loaded12 films and12 reviews, removed the control for the expanded state, and placed focus on the results tabpanel. The associated Figma phone frame 1480:8934 is393px wide; local verification was at a wide viewport. Live API content was preserved. No source/API/data changes, build or tests.


### Lists catalog desktop live routes — 26.10.2026

Figma current-Copy frame 1480:4983 is1440×3816 and shows Featured, Popular this week, Recently liked, Crew lists, Popular tags, and footer. Local EN catalog currently has empty Featured and Recently liked states, six live Popular cards, six Recent cards, and ten live tags. Direct feed=team and feed=recently-liked routes both render “No public lists yet.” Several live card poster fields are absent and the existing fallback label is displayed. The separate Crew feed is an agreed scope gap because no contract exists; preserved current feeds and did not add fake data. No new frame ID, source/API/data changes, build or tests.

25.10.2026 Global Search Journal frame-tree check: selecting phone `1480:8889` (393×1150) and desktop `1480:7549` (1440×1149) confirms their current IDs/sizes, but both layers report visibility off and the canvas remains on adjacent Profile Reviews content. I left layer visibility unchanged; this is not a screenshot review. UK/EN Journal query empty-state evidence remains as recorded above. No code, API, data, build, tests or Docker changes.

25.10.2026 expanded Global Search review: Figma phone `1480:8934` is393×2801 and currently visible. Zoom-to-selection plus canvas scrolling revealed its lower Journal section: three sample article cards and More. This is only a screenshot of that segment. Live UK/EN `/search?q=film` returns152 Films,101 Reviews,0 Journal; Show more renders12 films and12 reviews. No article records exist for comparison in this current result set; no data was fabricated. No app/API change, build, automated tests, or Docker action.


### PublicProfile phone collection variants — 25.10.2026

Earlier audit note: the live Figma canvas was recorded as showing PublicProfile phone `845:1679` Films (393×1162) and `861:1474` Watchlist (393×1060). The `845:1679` association is superseded by the 26.10.2026 candidate-identity check below: only its dimensions are confirmed, not its name or route. The local watched empty state and Watchlist item/fallback measurements remain valid source evidence; no sample data, mutations, code changes, Docker actions, build or automated tests.


### Movie Details desktop reviews grid/color correction — 25.10.2026

Figma desktop `39:2` shows two dark review cards side by side. Added desktop-only grid to MovieDetails reviews section with two equal columns and24px gap; each card is588px in the1200px rail. Corrected card surface from `#fbfaf8` to `#2b2b2d` and retained readable light text. Read-only Chrome capture at1440 confirms one actual API review is x120/w588, dark surface and white foreground; no duplicate sample review was added. UK responsive captures at320/393/600/720/768/1024/1440 all have document width equal to viewport; phone capture at393 confirms the original327px card and unchanged mobile surface.
npm run verify:build` passed TypeScript + Vite (231 modules). Automated tests were not run because visual redesign is ongoing.


### Movie Details phone frame recheck — 25.10.2026

Current Figma canvas frame `560:1003` is393×1908. Read-only Chrome capture of `/uk/films/3940` at393px measures poster slot x16/y245/120×180 and toolbar targets44×44 at x11.5 / x337.5; Rating heading y534. These align to the recorded frame anchors. Remaining source headings are y633.2 (Cast),795.1 (Reviews),1191.5 (Similar),1324 (Storyline), while the Figma sample is populated and anchors are around624/818/1287/1519. Direct GET `/api/movies/3940/details` confirms `cast:null`, `externalRatings:[]`, `similarMovies:[]`, `shortPlot:null`, `photoUrl:null`, and `videoUrl:null`; the record has one review. No source/API/DB data was changed. Treat remaining lower-frame differences as content-dependent until a matching API record exists; no automated tests run.


### Community empty-feed runtime geometry — 25.10.2026

Chrome visual capture виміряв UK/EN Community при393/1440px; усі `documentElement.clientWidth` рівні `scrollWidth`. Desktop Featured section x120/y661/1200×435, Popular section y1181; їхні heading row y680 і y1200. Phone Featured x16/y234/361×230, Popular section y488, heading row y499. Відповідні Figma section/heading-row anchors збігаються. Visible H2 line box у 44px Popular row починається y511.41 phone і y1207.59 desktop через vertical centering; frame target — row container, тож це не помилкова відстань секції. Дані не підмінялися; додаткових стилів не змінювали, тестів не запускали.


### Локалізовані Home/Community counts — 25.10.2026

Після виправлення reviewer/movie count grammar
npm run verify:build` успішно виконав `tsc --noEmit` і Vite build (231 modules). Ручний браузерний огляд реальних API records на `/uk|en/home` та `/uk|en/community/reviewers` при393px показав правильні singular labels (`0 фільмів, 1 огляд`, `0 films, 1 review`) і `scrollWidth === clientWidth`. Full automated regression лишається відкладеною до завершення visual audit.


### Search Reviews phone та Auth form geometry — 25.10.2026

Chrome capture Search Reviews at393×1139 після mobile grid gap=24px: перші чотири API cards x16, width361, height168, y267.34/459.34/651.34/843.34; `documentElement.clientWidth === scrollWidth ===393`. Figma `1480:8631` anchors із structured-context checkpoint — x16, width361, height168, y267/460/652/844. Геометричний дрейф кожного з перших чотирьох anchors менший1px; capture перевірено візуально. UK Login/Register/Forgot Password source routes оглянуто при393×852, EN routes — при320/393px; overflow немає. Це source visual review без тестового набору.
npm run verify:build` після spacing зміни пройшов TypeScript і Vite (231 modules); автоматизовані тести відкладені. Google OAuth і Remember me не мають чинного API/session контракту.


### Поточна точка відновлення та Community layout — 25.10.2026

Після reboot Figma MCP автентифікований (`whoami` успішний), однак `get_design_context` зупиняється на Starter call limit; ручний Chrome canvas і локальний source лишаються доступними. Визначення завершення оновлено в `PLAN.md` на покриття route/frame/state, явно записані контрактні gaps і повні release gates; відсоток не виводиться з простих згадок frame ID.

Для Community зіставлено записи raw frames: desktop `605:1112` Featured panel —435px, Popular top y1181; phone `1517:4931` Popular heading y499. Зміна `.grid > .card:first-child` додає desktop min-height435px та41px після панелі; phone min-height230px. За наявних grid margins/gaps нові anchors розраховуються до y1181/y499 відповідно.
npm run verify:build` після CSS зміни пройшов (231 modules) у попередньому checkpoint; свіжого runtime re-measure поки немає. Дані/API не змінювалися, тести не запускалися; телефонне вимірювання залишається відкритим.


### Films Discovery phone composition — 25.10.2026

Opened live Figma phone frame `1480:7843` in the connected Chrome canvas; inspector confirms393×1235. The frame shows a compact screen with a top Back control, four popular-film slots, a Just reviewed poster rail, two Popular reviews and fixed bottom navigation. Updated `FilmsDiscover` mobile layout accordingly: hero hidden below560px, actionable Back-to-Films link, four visible popular films, API-backed recent-review poster rail, two visible reviews, and the existing fixed mobile navigation. Manual UK source review at320/393/560/600/720/768/1024/1440 has no horizontal overflow; EN393 renders four films and two reviews. Back is a44×44px target with visible3px keyboard focus. The right-side Figma sliders affordance is not wired because this discovery route has no filter UI or corresponding action/API; Crew Picks remains unavailable because no matching movie-pick contract exists. Source poster fallbacks remain necessary for API entries without image URLs.
npm run verify:build` passed TypeScript and Vite (231 modules). Exact per-section anchors and full keyboard walkthrough remain open. No backend/API/data changes or automated tests.


### All Films phone controls and responsive review — 25.10.2026

Manual UK `/films?page=0` review at393×1215 loads24 live API posters in four columns; the first slot measures x16/y307/79×116. Widths320/393/600/720/768/1024/1440 have no horizontal overflow; grid columns switch from four to five at821px and six above1100px. The Back and Filters hit boxes are now44×44px while the painted circles remain36×36px; the visible back circle stays x16/y50 and filter circle x341/y50 at393px. Filter activation focuses the first enabled native control; Escape closes the form and restores focus to Filters. Keyboard traversal reaches Back with a visible3px outline. No query/API semantics changed.
npm run verify:build` passed TypeScript and Vite (231 modules). Full Figma anchor comparison, other locale/error/empty states, and automated regression remain open; no automated tests or Docker actions were run.


### Global Search compact phone preview follow-up — 25.10.2026

Using the connected Chrome session, the current Figma file opened and the layer `Search Results "all" (svergunova phone)` was selected in the editor (`1480:8934`, 393×2801). The linked Figma MCP tools still return `Unknown tool`, so the selected full-frame was not exported as a fresh screenshot. In the local UK source preview at393×995, corrected the collapsed all-results rail: poster slots measure x16/110/204/298, y267, 79×116; two review cards remain visible; the localized Show more button measures x81/y800/231×48; document width equals393 while all six API film cards remain horizontally reachable. Keyboard traversal reached poster links 1–5 with a visible3px focus outline and scrolled the rail to poster 5 (`scrollLeft=188`). A manual screenshot was visually inspected; poster fallbacks are expected where current API data has no poster URL.
npm run verify:build` passed TypeScript and Vite (231 modules). This closes the known row wrap, hidden Show more control, 3px rail alignment and horizontal keyboard reachability gaps only; full-frame comparison and overall redesign remain open. No automated tests or API/data changes.


### Public notification reference classification — 25.10.2026

Read-only Figma canvas Find for “notifications” returned six text results. The selected `Notifications` text (`1494:7683`) is inside an Admin announcement panel (“Notify Users About New Features/Updates” and “Notify Users About New Updates”), not a user-facing notification list. Searching “messages” returned two Admin user-detail actions (“Write Messages to the User” / “Open Chat”), not a user-facing inbox. Neither result establishes parity for the implemented `/notifications` or `/messages` routes; public list/inbox frames remain unconfirmed. MCP `create_session` and `use_figma` still return `Unknown tool`. No runtime data was changed, no tests or Docker actions.


### Films discovery route confirmation — 25.10.2026

The authenticated Figma canvas rendered discovery frame `1480:6235` (1440×2722), including the six-film ranking, Just reviewed posters, Popular reviews cards, Crew picks and footer. Its linked All Films frames rendered separately: desktop `1413:12611` at1440×2956 with a six-column poster grid; phone `1480:9187` at393×1215 with a back/sliders header, Year/Rating/Genre row, four-column grid, pagination and bottom navigation. `Search.tsx` now requests six grid rows responsively:36 results at six columns (>1100px),30 at five columns (821–1100px),24 at four columns (≤820px). The live desktop `/uk/films` runtime showed36 results and six pages for203 total. This matches the visible desktop grid density and recorded phone row count; phone runtime still needs a fresh capture. The Figma phone node direct URL remained on Loading in this session.
npm run verify:build` passed after the source change (TypeScript + Vite, 229 modules); no automated tests or Docker actions were run.


### Films Discovery implementation — 25.10.2026

Added `/films/discover` as the landing route linked from desktop Films navigation while preserving `/films` as All Films. Local Chrome UK runtime loaded six rating-desc films from `/api/movies/search`, up to eight unique movie posters derived from `/api/reviews/recent`, and four reviews from `/api/reviews/popular`; the accessibility tree exposed the page/section headings and film, author and review links. A refreshed EN tree confirms recent-film poster anchors remain links after removing an overriding ARIA listitem role; Tab focus on the header logo is visibly outlined. Current local response data has missing poster URLs, so resilient-image fallback art is visible. Crew Picks explicitly reports that no matching movie-pick API exists; HQ-owned public-list feeds were not substituted. Loading, error/retry and empty states are present in code.
npm run verify:build` passed (TypeScript + Vite, 231 modules). UK and EN local route/structure smokes passed, but this was not a fresh Figma screenshot comparison or phone-width review: Figma direct navigation stayed on Loading and the connected Chrome surface did not expose a viewport override. No backend changes, automated tests or Docker actions.


### Global Search compact phone visual review — 25.10.2026

Compared live Figma phone frame `1480:8464` (393×995) with current-source `/uk/search?q=Concurrent` at393×995. Figma shows a single horizontal strip of four Dune posters, two review cards and a “Show more results” action. The API-backed source presents six matching films in a wrapped four-plus-two grid and two review cards in the initial viewport. Source film records have no poster URLs, so the image fallback is expected for this data and the Figma sample images are not copied. The source bottom navigation stays fixed at the viewport edge. This is a structural/layout difference, not a content equality check; no source/API/data changes, tests or Docker actions.


### Global Search compact phone rail correction — 25.10.2026

The collapsed `tab=all` phone film preview now renders as a horizontal scroll-snap rail sized for four visible posters on a393 px content rail. The remaining API-returned posters remain reachable by touch scrolling and focus scrolling; the existing Show more button still expands the live global-search response. No poster fixtures or API changes.
npm run verify:build` passed (TypeScript + Vite,231 modules); exact phone viewport, keyboard/focus and bottom-nav overlay review remain open because the current Chrome UI did not expose a viewport override. No automated tests or Docker actions were run.


### Global Search reviews phone visual review — 25.10.2026

Compared live Figma phone frame `1480:8631` (393×1139) with current-source `/uk/search?q=Concurrent&tab=reviews` at393×1139. Both render four vertically stacked review cards and a bottom navigation fixed to the viewport. The Figma records use Dune images and content; the API returns different Concurrent records with no poster URLs, so the visual comparison is limited to composition. Card-level positions, typography and keyboard/focus behavior remain unverified. No source/API/data changes, tests or Docker actions.


### Films discovery feed contract audit — 25.10.2026

The Figma browser canvas rendered desktop discovery frame `1480:6235` at1440×2722. It shows six numbered Popular films, eight Just reviewed posters, a 2×2 grid of four Popular reviews, eight Crew picks posters and the shared footer. Runtime route `/films/discover` is now implemented with six popular films from `GET /api/movies/search`, up to eight deduplicated recent-review movie posters from `GET /api/reviews/recent`, and four cards from `GET /api/reviews/popular`. The team-list endpoint represents HQ-owned lists, not Crew film picks; the route presents a localized unavailable state for Crew Picks. Manual UK/EN Chrome review confirms the three feeds, route landmarks, and localized navigation; recent poster anchors remain links in the accessibility tree. Local movies have no poster URLs, so fallback art appears. Figma MCP file tools still return `Unknown tool`, and latest direct canvas navigation stayed on Loading; exact pixel comparison and phone viewport review remain open. No backend contract changes, tests, or Docker actions.


### ReviewDetails live-data spot-check — 25.10.2026

Read-only Vite preview `/uk/reviews/3650` initially rendered its loading state, then resolved to the actual API-backed review `Concurrent social film 5a62c9ea`, rating4/5 and two likers. Its poster uses the runtime fallback, while the Figma phone sample `1480:9249` shows a populated Dune review. This spot-check confirms asynchronous loading and real content only; the browser remained at a desktop viewport, so it does not verify phone geometry or Figma parity. The tab was restored to `/uk/home`; no review likes or account data were changed, and no tests/build ran.


### User Lists create screen UK/EN responsive check — 25.10.2026

Authenticated `/uk/lists` and `/en/lists` were reviewed read-only. The account has no custom lists; the create state shows the blank form and three API-backed system lists. UK and EN have no horizontal overflow at320/393/600/720/768/1024/1440px; desktop client width is15px narrower because of Chrome's classic scrollbar. At393px, keyboard focus is visible on the name field and Create button; the Create button is50px high. Desktop anchors at1440px: hero height818px, title y280 with58px type, editor rail starts y713, two588px columns separated by24px, textarea minimum height515px. Live Figma canvas rendered both frames at393×852. Metadata sheet `1480:9542` contains List Name/Public/Ranked/Description/Add films/Tags/Cancel/Save; selected Add films group `1480:9543` has Prototype `Click → None`. Populated editor `1480:9606` contains New List/Add a film/four rows; selected input `1480:9640` likewise has `Click → None`. Selecting Favorites in runtime showed the account's real Send Help item (x34/y285.5,79×116); it is a system list, not evidence for custom editor parity. Search/add API methods exist, but no inline Add a film is implemented in UserLists; Ranked is absent from persisted API. No custom list/sample data was created and no account data changed. Figma MCP `create_session` and `get_design_context` both return `Unknown tool`; visual evidence came from the live canvas. No source/API changes, tests, or build.


### Profile settings phone review — 25.10.2026

Reopened live Figma `1043:2125` (393×1905) and reviewed the current authenticated Vite preview at393px. Raw section anchors: Profile y147, Username y194, Favorite Films y608, Avatar y850, Banner y1162, Connections y1473. The runtime shows its phone-specific toolbar, hides global bottom navigation and keeps current API-backed profile content inside the viewport. The account has one real favorite; the longer email wraps within its row. Given/family name, bio, location, website, pronoun, replies, banner upload and OAuth are absent from current API contracts and remain explicit gaps. Read-only review only; no account/profile data was changed and no tests ran.


### Community desktop geometry — 25.10.2026

Compared live Figma `605:1112` raw geometry and current-source `/uk/community` in Chromium. Raw: 1440×4201 frame, hero background y0–501, intro banner y316, Featured section x120/y661/1198×435 with24px heading at y679, Popular section x120/y1181/1198×435. Runtime now measures the banner at y316 and Featured section x120/y661; its24px heading is y680. At widths320/393/600/720/721/768/1024/1440 the local UK route has no horizontal document overflow. The API currently returns no HQ members, so Featured is117px and Popular starts y822; populated-section spacing remains unverified and the film-poster strips shown in Figma are unsupported by the current API.
npm run verify:build` passed (TypeScript + Vite,229 modules). This is geometry evidence, not a pixel-diff; no tests or data/API mutations were made.


### Footer reference reconciliation — 25.10.2026

Live Figma search opened the full route frame `1011:1915` (1440×2687): its footer is the compact page variant, visually consistent with the existing 1440×265 runtime mapping `1122:2802` / `1413:6425`. Figma also contains a separate design-system component `251:625` (1440×542) with a tagline and three navigation columns. Raw local node data and the visible canvas confirm these are different compositions; the design-system sample is not used as the route footer. No application code was changed. Figma MCP `create_session` still returns `Unknown tool`; this check used the live browser canvas and read-only local `.fig` extraction. Full footer responsive, focus and icon-vector review remains open; no tests or Docker actions were performed.


### Auth Forgot Password localization — 25.10.2026

Changed the separator on `Forgotrassword` from hard-coded English `Or` to the UK/EN `dividerOr` string. Manual Vite/Chrome review of `/uk/forgot-password` showed “Або”; `/en/forgot-password` showed “Or”. The frames/routes and API contracts were unchanged; no form was submitted and no tests ran.
npm run verify:build` was run after the change and passed TypeScript plus Vite (229 modules).


### Home guest desktop composition — 24.10.2026

Compared the local raw frame `1413:6471` with the current-source `/en/home` preview at1440px content width. Runtime anchors: hero title x335/y706/756×195; six-poster rail x116/y1073/1199×260; explainer x113/y1418/1202×372 with six270×72 feature text slots from y1541; Just Reviewed group x116/y1875/1200×244; intro x152/y2204/1128×87; Popular Reviews/List title row y2394; list cards x930/y2470, 386×353 with three API results; Popular Reviewers x930/y3646; Recent News divider/title y4067/y4084 and card group y4162. Measurements are within a few CSS pixels of raw nodes. At CSS widths1140/393/320, English and Ukrainian routes have no horizontal overflow; the localized guest feature text is retained. `
npm run verify:build` passed (TypeScript + Vite,229 modules). Local Journal returns no articles, so its localized API empty state appears instead of reference cards. This is manual source/raw geometry review, not a pixel-diff. No tests or Docker image updates were run.


### rush checkpoint — 24.10.2026

Commit `2b531b3060864eb1a56b22686bc0a5ff2b412748` (`Align Home desktop layouts with Figma`) was pushed to `master`. `frontend/
npm run verify:build` passed before the push, and GitHub Actions `CI / verify` run [40114726723](https://github.com/anton5267/rewind-letterboxd/actions/runs/40114726723) completed successfully. This confirms the push gate only; it does not replace the deferred full frontend/backend regression or the pending visual review of Home desktop/member variants.


### Public Lists desktop rail review — 24.10.2026

Compared local read-only raw/screenshot `1480:4983` with `/en/lists/discover` in Docker using a1440×900 viewport. Raw frame shell starts x120 and featured section y531.5. Runtime shell is1200px wide at x112.5, because `innerWidth=1440` but `documentElement.clientWidth=1425` with the classic scrollbar; its first section starts y531. The raw hero text group is569px wide at x436/y273; runtime intro is640px at x392.5/y273. The English CTA measures x573/y388/279×59 vs raw frame x583/y388/275×59. The Ukrainian copy was not compared to English frame text. The `/team` API returns no public lists; real Featured cards remain unverified. This is a manual source/runtime review only; no application code, API data, or test suite changed. Figma MCP returned `UNAUTHORIZED` during the current continuation.

Manual phone comparison for `1480:8280` used local raw/screenshot and `/uk/lists/discover` at393×852. Raw hero ends y249.1; Featured divider/title at y284.1; featured posters x15.5/209 at y335.1,150×87; Popular divider y499.3 and posters x15/226.5 at y550.3,150×87; Recently liked divider y714.3. Runtime hero is270px, moving the Featured divider to y304. Its Popular cards begin at x16/227 with150px widths, matching raw horizontal geometry; the local `/team` feed is empty, so the later section position (runtime y429 vs raw y499) is a data-state difference. Document scroll width remains393px. No code or data changed and no tests ran.

Current-source phone recheck 24.10.2026: measured Chrome CSS content widths393 and320, accounting for the classic scrollbar in the viewport override. At393, both locales produce a250px hero, intro x28.5/y120/336×40, and Featured heading y284. At320, Ukrainian stays250px/y284; English wraps to three lines and grows naturally to270px/y304. Both have no horizontal document overflow. The `/team` feed is empty, so later section y positions differ from the populated frame. No tests were run; the final `
npm run verify:build` passed TypeScript and Vite (229 modules).


### Public Lists desktop correction — 24.10.2026

Read-only local Figma screenshot/raw node `1480:4983` and Chrome at CSS1440 exposed the cause of the prior x190 rail: `.landingrage` inherited5vw padding and a manual centering margin also counted the classic scrollbar. Desktop page padding is zero and `.shell` uses centered auto margins. The English static intro matches Figma; Ukrainian uses an equivalent localized line. Runtime uses36px/40px system UI fallback, with `-.01em` letter spacing, for a two-line title in the569px group. Chrome measured shell x120, intro x435.5/y273/569×80, CTA x582.5/y388/275×59 and section y531. Local `/team` has no curated Featured lists; no filler records were introduced. This is manual screenshot review; no tests were run.`
npm run verify:build` passed TypeScript and Vite (229 modules).

Responsive Chrome review for this Lists correction covered screenshots at CSS widths600,720,1024 plus geometry at320,393,600,720,768,1024,1440. No horizontal document overflow was present. The local `/team` feed has no curated Featured lists, so no filler records were added. No tests were run; `
npm run verify:build` passed TypeScript and Vite (229 modules).


### Home guest desktop title follow-up — 24.10.2026

The guest Home source preview exposed extra title wrapping and text extending past the rail. CSS now uses three explicit sentence lines from681px, EN 53.8px/65px and UK 39.8px/65px on desktop, with locale-specific fluid sizes at681–999px. At1920, `/en/home` sentence text widths are712/718/756px inside756px and `/uk/home` widths645/733/643px inside733px; document width is1905px against a1920px viewport. Manual Chrome review of both routes at681,720,721,768,900,999,1000 and1440px confirmed no clipped title or horizontal overflow; 681/720 clear the fixed nav and721 switches to desktop nav at the Figma y706 anchor. `
npm run verify:build` passed (TypeScript and Vite,229 modules); no tests ran. Full Home desktop/member frame comparison remains open.


### Home member desktop comparison — 24.10.2026

Compared live Figma `1413:6263` with the current-source authenticated Vite page in Chrome, matching a1440px document content width (1455px viewport to account for the classic scrollbar). Runtime hero is1440×948; title x311/y409/891×130 and subtitle x311/y557/891×27 match the raw Figma nodes. New on Rewind, Popular on Rewind, and Latest News headings render at y1049/1487/1927; their x120.5 placement is within2px of raw x122. Desktop Popular Lists previously requested four API items, causing the fourth325.5×257 card to wrap below the three-card Figma row. The request now asks for three; Chrome confirms three cards in one row and no horizontal document overflow at desktop and a393px content width. `
npm run verify:build` passed (TypeScript and Vite,229 modules). Local Journal currently returns zero articles, versus one in the frame; that empty state collapses downstream sections, so lower-page vertical parity remains open. No tests, Docker rebuild, data mutation, or push was performed.


### Home member desktop structural update — 24.10.2026

Member Home desktop CSS now follows the raw vertical order and card geometry in `1413:6263`: Latest News banner; four full-width Reviews cards; three-column Popular Lists; and three API-backed Recent News cards. The previous two-column Reviews/Lists pairing and extra reviewer/tag/watched panels are removed from this desktop member variant. Hero x/y offsets and section spacing are mapped from raw anchors and the prior 1440 fixture measurements. `
npm run verify:build` passed (TypeScript and Vite,229 modules). No authenticated screenshot or browser geometry review has been captured after the change, so this remains an implementation pass rather than verified frame parity; full regression remains deferred.


### Home member Recent News empty state — 24.10.2026

Authenticated Home now keeps the `Recent News` section visible when the Journal API successfully returns no articles. It presents the existing localized empty copy, loading status, or retry control for an API error, and still renders only API-backed articles when present. `
npm run verify:build` passed (TypeScript and Vite,229 modules); no tests were run.The current local Chrome page is guest, so authenticated visual geometry remains unverified.

## Раніше записаний локальний checkpoint


### Shared mobile navigation — 24.10.2026

Live Figma frame `1411:3473` Navigation instance is393×92 and shows Home/Search/Add/Journal/Profile for a guest. Raw child nodes specify 12px labels and30×30 icon slots. `Header` keeps the localized Profile label while routing unauthenticated clicks to the existing Login path; link targets remain at least44px. A Vite/Chromium capture of `/uk/home` at393×852 measured the runtime bar at x0/y760/393×92 with five 30px icon slots. Compared with the selected Figma component, the runtime had an extra purple active tile, muted labels and a darker surface; CSS now uses a flat `#191919` bar and white labels/icons. `
npm run verify:build` passed (TypeScript + Vite,229 modules). The screenshot still shows Figma's outlined Home/Journal/Profile glyphs differ from the current solid Font Awesome icons; exact vector parity remains open. No tests or Docker changes; no API or database mutations.

Commit `1159dac` was pushed to `master`; its `CI / verify (push)` run [40107220610](https://github.com/anton5267/rewind-letterboxd/actions/runs/40107220610) completed successfully, including backend tests, frontend build/typecheck and proxy validation. It predates the local CSS surface/color follow-up above and does not verify those unpushed edits.


### Review Details phone More — 24.10.2026

Phone `1480:9249` now exposes an authenticated-only `More` button at the Figma control position and opens the existing movie `RatingSheet`, with localized review author subtitle. Existing movie-rating and review-like API calls remain in use. Phone inline rating/date and like action are hidden; desktop controls remain. `
npm run verify:build` passed (TypeScript + Vite, 229 modules). Manual guest preview at393×932 measured back x16/y50/35×35, `document.body.scrollWidth === 393`, and verified phone rating/like controls are hidden. The authenticated dialog behavior was verified in the subsequent browser pass below; phone `More` activation and sheet geometry remain open for final responsive review. No tests were run, and no backend, database or Docker state changed.

An authenticated Vite source preview then opened the shared RatingSheet without changing rating/like data. The sheet rendered the localized author subtitle; focus started on Done, Tab/Shift+Tab stayed within the dialog, and Escape closed it and restored focus to the desktop Rate trigger.

The mobile sheet was then manually reviewed in a 393×852 browser viewport using the local review row plus ephemeral auth/rating response fixtures. Runtime More measured x342/y50/35×35, matching frame `1480:9249`; modal x16/y489/361×328, card x16/y536/361×206, Done x16/y761/361×56. Raw `1480:9407` group is x16/y488.6/361×328.4, within subpixel rounding. At320×852, modal is288×328 and Done remains visible; body width stays320. Moving the dialog through a portal put it above the fixed bottom navigation, which had covered Done before the fix. Keyboard interaction retained focus within the sheet and Escape returned it to More. No rating or like mutation was performed. `
npm run verify:build` passed after the change; no tests were run.

| Gate | Результат | Доказ / межа |
| --- | --- | --- |
| Frontend build | PASS | Свіжий
npm run verify:build` від25.10.2026: TypeScript без помилок, Vite 229 modules |
| Full browser suite | **123 passed; 2 failures; 12 skips** | Latest 22.10.2026 run: 137 scenarios, 5.2 min. The two remaining failures are the Community retry cases caused by the user's uncommitted `FollowActionsContext` change, which converts failed relationship reads into `false` instead of exposing the tested Retry controls. Films, Journal Search, detail header, route-transition and Public Lists guard checks are green. The 12 skips are covered separately by the disposable admin wrapper below. |
| Films geometry/filter/header targeted suites | **9 + 3 + 2 passed; 0 failures** | After Docker web rebuild, `search-controls.spec.ts` covers the `1413:12611`/`1480:9187` poster geometry and `1480:7611` filter behavior: desktop 174×260/20 px, phone 79×116/10 px, 15 px gaps, 215 px filter summary, focus restore and no overflow. `detail-header.spec.ts` confirms contextual back and bottom navigation at 320/393 px while the Figma Films header logo/Menu stay hidden (3/3); editorial header check passed 2/2. |
| Journal search alignment suite | **4 passed; 0 failures** | After Docker web rebuild, `global-search-alignment.spec.ts` verifies `1480:7549`/`1480:8889` in UK/EN, including the 361×149 phone article cover, 20 px card radius, API-backed title/excerpt and native category URL/keyboard behavior. |
| Backend suite | **87 passed** | Latest host reports: 40 current XML files dated 22.10.2026 08:33–08:34 Berlin, failures/errors/skips 0, Compose MySQL on `127.0.0.1:3307`. The earlier count of 89 included a stale suffixed two-test poster report from 20.10, duplicating current cases. Reports do not record the checked Git revision. |
| API smoke | PASS | OpenAPI 159 operations; auth, profiles, films, lists, reviews, comments, social, messages, notifications, newsletter і cleanup |
| Contract smoke | PASS | Public/protected routes, privacy fields, role guards, CRUD і nullable responses |
| Security smoke | PASS | CSRF, guest/admin guards, hostile query payloads, metrics protection |
| Password reset | PASS | Generic response, Mailpit delivery, one-time token, session revocation, new login |
| Cache / concurrency / load | PASS | Redis miss/hit/TTL; concurrent lists/ratings/reviews/comments/preferences/follows/likes; 20 requests across 8 endpoints, all 200 |
| ER schema | PASS | 38 tables, 55 foreign-key relationships |
| Backup/restore | PASS | Dump restored to a unique temporary schema; counts `203|438|31`; schema and temporary dump cleaned |
| Production template | PASS | Synthetic temporary env: HTTPS origin, strong placeholders, private DB/Redis/API, read-only API/web, loopback web port |
| Caddy / Compose | PASS | Caddy valid; development Compose config valid; clean API/web image builds |
| Local Docker runtime | PASS | `/actuator/health` 200, `/uk/community/reviewers` 200; API/web rebuilt, DB volume and `.env` preserved. Живий contract повернув `reviewCount`, `watchedCount`, `listCount` |
| CI workflow maintenance | PASS | `ubuntu-24.04`, `checkout@v7`, `setup-java@v6`, `setup-node@v7`; latest UI checkpoint `cda3126` passed GitHub CI run [39708297409](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409) |

Перший повний browser run завершився 123/125. Він виявив реальні regressions у Lists: hero втратив очікувані UK/EN «Колекції фільмів / Film collections», а landing CSS приховав feed navigation через `display:none`. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Поточний Figma-audit блок Popular Reviewers: перший full run виявив, що release matrix неправильно очікував mobile Back-link на desktop, хоча у frame є desktop header. Перевірку обмежено шириною phone (`<=720 px`); цільова matrix пройшла, а повторний повний frontend run завершився 115 passed. Backend contract для трьох reviewer metrics перевірено окремо і в повному наборі; реалізація використовує групові запити, а не запит на кожного рецензента.

Community members frames `605:1112` (1440 px) and `1517:4931` (393 px) were re-read through Figma context and screenshots. The route now has the same hero, featured/popular rails, and full member-list order while retaining live API identities, directory search/pagination, and accessible follow actions. Static Figma poster strips are not used as fabricated member data. `
npm run verify:build` passed (216 modules); `community-follow.spec.ts` passed 10/10 when rerun after one transient browser-start failure. GitHub CI run 39614762671 for the preceding Popular Reviewers commit passed.

Journal List 4 `1494:5387` was verified with Figma context and screenshot before its CSS change. The API-backed feed now follows the compact Journal hero, a 612 px feature cover, and editorial three-column rows at desktop. Archive/category controls and pagination remain available with real data. `
npm run verify:build` passed (216 modules); journal design flow and retry passed, including a 393 px no-horizontal-overflow assertion.

Journal List 5/6 `1494:5182`/`1494:5287` were read separately. They confirm the same route with alternate static article and image fixtures, including an 818 px artwork hero. The released API-backed List 4 composition remains the applicable implementation; no fixture content or temporary Figma asset URL was introduced.

Journal Article `844:1547` was then re-read from the local raw export. The route now follows the verified desktop shell: a 909 px hero frame, 58 px heading target, 1126×642 cover rail, and a dark content block beginning at y=909 with a 251 px editorial inset. The implementation keeps the Journal API contract and uses the article's real `coverUrl`; the Figma frame's static three-image collage and author copy are not fabricated when the API does not provide them. After the Docker web rebuild, `journal-design-flow.spec.ts` and `editorial-accessibility.spec.ts` passed 5/5, including audio retry focus, language fallback, mobile overflow and exact desktop bounds.


### Journal feed/newsletter evidence — 24.10.2026

The live Figma browser canvas opened `604:967` (`Journal List 3`, 1440×3561). Its complete selected frame contains the feature story, editorial rows and footer; there is no visible public newsletter section. The local page-frame inventory has no top-level Newsletter-labelled frame. A read-only `GET /api/journal/articles?language=en&page=0&size=20` returned an empty page (`totalElements: 0`), so populated article content and cover assets cannot be verified from the local API. No public Journal/newsletter behavior was changed; the existing admin newsletter queue remains separate. Figma MCP file tools still fail `Unknown tool`, although the design canvas opens in Chrome.

Guest Home desktop `1413:6471` was re-read from the local raw node export after the earlier 764 px interpretation. The frame has a 1440×844 artwork rectangle and a centered SF Pro Display Bold 58 px heading at x335/y706; runtime now uses that geometry with the verified local artwork and no undefined decorative CTA. `
npm run verify:build` passed (218 modules); the rebuilt Docker web image passed `home-list-cards.spec.ts` 3/3. The remaining guest feed sections still need their own frame-by-frame review.

Member Home desktop `1413:6263` was reviewed separately and uses `frontend/public/images/home-hero-member.jpg`, a 948 px header-underlaid hero, target 58 px title/24 px subtitle and six 174×260 px API-backed poster slots. `
npm run verify:build` passed (216 modules); the rebuilt Docker web image passed the Home suite 3/3, including an authenticated mocked-session assertion. Other feed sections still require individual frame review.

Guest Home mobile `1411:3473` was re-read from raw nodes: the artwork is 393×320, the centered SF Pro Display Bold heading is 24 px at x42/y106, and the `Get Started` control is 85×32 at x154/y239. Runtime now uses that geometry, four live 79×116 poster tiles and the existing API-backed sections. The rebuilt Docker web image passed `home-list-cards.spec.ts` 3/3; `
npm run verify:build` passed (218 modules). Remaining feed sections require separate frame review.

Global navigation was then compared against the raw Figma header nodes: desktop Group 26 is 1440×106 and the mobile Navigation instance is 393×92. Runtime now uses a 106 px desktop header and 92 px boxed mobile bottom navigation while preserving contextual transparent headers and focus behavior. After the Docker web rebuild, `editorial-layout.spec.ts --grep "header stays readable"` passed 2/2.

Home member section headings were aligned to the raw `1327:3210` text nodes (`Popular on Rewind`, `Latest news`, `Popular reviews this week`, `Popular Lists`) through dedicated UK/EN keys; API-backed content and state handling were untouched. `home-list-cards.spec.ts` passed 3/3 on the rebuilt Docker web image.

Member Home mobile `1327:3210` was checked separately. Its 320 px artwork hero, centered 24 px heading/12 px copy, New on Rewind heading and four live 79×116 poster tiles follow the frame while preserving the API-backed news, review and list sections. `
npm run verify:build` passed (216 modules); the rebuilt Docker web image passed `home-list-cards` 3/3 with an authenticated mocked session.

Popular Lists desktop/mobile `1480:5390`/`1480:7927` were checked with their Figma screenshot/context. The feed now has the desktop 628 px image hero, 58 px heading and 1200×339 rows with 174×260 five-poster stacks, plus the 183 px mobile hero, contextual top controls, single 361 px card column and pagination. It retains API-backed lists and accessible targets. `
npm run verify:build` passed (216 modules); `list-discovery-controls.spec.ts` passed 3/3 and `list-mobile-header.spec.ts` passed 12/12 at 320, 393, 600, 720 and 768 px in UK and EN.

Public Profile desktop `238:596` was reviewed directly in the Figma canvas. Its centered identity header and profile-state rail are now reflected in the live route without altering API content or mobile layout. `
npm run verify:build` passed (216 modules); `route-transition.spec.ts` ran after the change. The original photographic hero asset remains pending Figma quota rather than being replaced by an unrelated image.

Public Profile phone `825:1378` was re-read from raw nodes: the contextual toolbar begins at y=50, the 120 px avatar is centered at y=190, and the 26 px identity name begins at y=317. The global mobile header is hidden only for `/users/:id` so it does not cover these controls; the bottom navigation, API-backed sections and keyboard anchors remain. The new geometry fixture passed 1/1, route transition coverage passed 8/8, and a deliberately long display name stayed within the 393 px viewport.

Поточний Search етап: targeted Global Search 4/4; нові UK/EN сценарії перевіряють shortcuts, URL, 361 px list cards, п’ять 79 px posters, багаторядкові tags і no-overflow. Додатковий reference `1480:6217` звірений по raw hierarchy; mobile show-results select вирівняний до 160 px, native semantics збережені. Повний набір зріс до 127. Admin wrapper спочатку зупинився до створення fixture через Docker template quoting у Windows PowerShell 5.1; після переходу на `docker inspect` JSON пройшов 12/12 і прибрав disposable fixture.

Після повторної перевірки Figma `1480:8527` mobile tag search cards now render the title/count before the poster rail, with 16 px radius and a 138 px poster area. `list-discovery-controls.spec.ts` пройшов 3/3; desktop original imagery remains pending Figma Starter quota.

Останній повний browser run після Public Lists landing update завершився **123 passed, 2 failures і 12 skips** у 137 сценаріях. Обидва failures — Community retry scenarios, які залежать від незакоміченої локальної зміни `frontend/src/context/FollowActionsContext.tsx`; у committed baseline ці стани мають показувати Retry. Films geometry/filter, Journal Search alignment, detail header, route-transition і Public Lists guard targeted suites пройшли без failures; весь `list-mobile-header.spec.ts` пройшов 12/12.

Backend host regression was rerun with the Compose MySQL credentials loaded only into the process environment. All 87 current tests passed with zero failures, errors, or skips; `.env`, schema and Docker volumes were not changed. The originally recorded 89 was corrected after excluding a stale duplicate poster report.

The disposable admin browser wrapper was rerun after the latest frontend changes: `scripts/verify-admin-browser.ps1` completed **12/12 passed in 42.8s**, then removed its temporary ADMIN fixture. Combined with the standard run, 130 browser scenarios are green across the two isolated runs; the two remaining standard-run failures are the user's uncommitted Community context change described above.

Public Lists follow-up fixed two concrete responsive/accessibility regressions: mobile tagged cards now clip the compact poster stack to the 138 px Figma rail, and desktop feed pages keep their route-level back/filter toolbar available. After rebuilding the Docker web image, `list-discovery-controls.spec.ts` passed 3/3, `public-guards.spec.ts` passed 6/6 (including the cross-locale tag → list → author → movie journey), the release viewport matrix passed 1/1, and the WCAG axe audit passed 1/1.

The catalog landing frames `1480:4983`/`1480:8280` were then compared against the rebuilt runtime at 1440 and 393 px. The duplicate feed rail below the hero was removed from the landing route; section-level `View all` links still reach team, popular, recently-liked and recent feeds, with API-backed content and localized copy unchanged. The updated `list-discovery-controls.spec.ts` passed 4/4 after the Docker web rebuild, including no-overflow checks at both widths.

Admin dashboard `1178:2466` was re-read from raw descendants. Its workspace begins at x=120 with 1200 px width; the metric rail uses a 28 px inset, three columns of roughly 365 px cards and 233 px card height. The runtime now follows that desktop shell without replacing its six live API counters or any admin actions. After rebuilding Docker web, `service-pages-responsive.spec.ts` passed 2/2.

Admin Settings `1404:4076` was then checked from raw descendants: its workspace is 1200×734 at x=120 with a 38 px radius and 41 px field controls. The runtime uses that desktop shell and three-column grid for the four API-backed settings, preserving save, validation and retry behavior. The rebuilt Docker web passed `service-pages-responsive.spec.ts` 2/2.

Admin User List frames `1218:2982`/`1260:3404` were checked next. The live users section now centers its title, constrains the search group to 402 px and keeps the 1200 px data rail with the existing row actions, pagination and profile panel. After the Docker web rebuild, `service-pages-responsive.spec.ts` passed 2/2.

Admin User Profile `1237:4369` was checked from raw descendants as well: the selected-user card is 1200×829 and its history/activity cards are 516×501. The runtime detail panel now follows those desktop rails while keeping profile mutations, overview API data and focus restoration. The rebuilt Docker web passed `service-pages-responsive.spec.ts` 2/2.

Admin Reviews `1310:3108` was checked from raw descendants: review cards are 1200 px wide with a 38 px radius, a 417 px left editorial column, an 84 px vertical rhythm and a 429 px minimum height. `AdminReviews` now renders live movie/user/content, rating, visibility and moderation controls in that two-column shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Comments `1342:3589` was checked from raw descendants: comment cards use the same 1200 px translucent rail, 38 px radius, 417 px left column and 84 px rhythm with a 249 px minimum height. `AdminComments` now renders live author/content, visibility and moderation controls in that shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Lists `1344:5249` was checked from raw descendants: list cards use a 1200 px translucent rail, 38 px radius, 417 px left column and 84 px rhythm with 393/364 px content states. `AdminLists` now renders live owner/items, visibility and list actions in that two-column shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Moderation `1399:3300` was checked from raw descendants: the queue uses one 1200×673 workspace with a 38 px radius. `AdminooderationQueue` now renders its live filters, selection, bulk hide and pagination inside that shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Moderator Logs `1404:3804` was checked from raw descendants: audit cards use a 1200 px translucent rail, 38 px radius, 348 px lead state, 293 px follow-up rows and 84 px rhythm. `AdminAuditLogs` now follows those rails with localized actions and pagination. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Global Search phone frame `1480:8594` exposed a missing slider control in the mobile hero. The new localized button focuses the existing native `Show results for` select, preserving keyboard and URL behavior; after rebuilding the Docker web image, `global-search-alignment.spec.ts` passed 4/4 and the combined Search targeted run passed 11/11. Commit `cda3126` passed GitHub CI run [39708297409](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409).

Profile mobile frame `896:1838` exposed missing hero actions and Recent Activity content. The new 44 px gear button focuses the existing Profile details form, the more menu exposes that same form and logout, and the activity section uses the existing `/users/:id/activity` API with loading/error/empty/retry/pagination states. Escape and outside click close the menu and restore focus to its trigger. After rebuilding the Docker web image, `profile-alignment.spec.ts` passed 10/10 and `
npm run verify:build` passed. Commit `115bd45` is pushed and GitHub CI run `39710281853` is green.

User Lists phone frames `1480:9542`/`1480:9606` show a search-style add-film affordance before the populated item rail and between description/tags in the metadata sheet. The existing `/films` route now renders a localized `Add a film` label and search icon on mobile while preserving the desktop Browse films label, API-backed list actions and keyboard order. After rebuilding the Docker web image, `list-owner-flow.spec.ts` passed 2/2.

Movie Details desktop `39:2`/`61:244` додатково перевірені через local Figma inventory і canvas. Реалізація тепер має full-bleed dark hero, 811 px backdrop, 275 px poster, desktop Rating/Cast rails і dark similar/review sections; `movie-mobile-alignment.spec.ts` та responsive suite пройшли 5/5.

Person/Actor desktop `545:676` і phone `721:1085` перевірені через local inventory та browser preview. Реалізація має full-bleed identity hero, 265 px desktop avatar, 120 px mobile avatar, compact mobile back/filter toolbar і 1200 px desktop або чотириколонкову mobile filmography grid; producer-flow suite пройшов 2/2 разом із API-backed navigation та mobile filter toggle.

Auth `605:2173–2176` і mobile `944:1582`/`944:1828`/`944:1887` перевірені через raw geometry та Chrome: desktop 627 px form width, 94 px inputs, 89 px actions і route-specific cards; phone 393×852 має back x32/y52, 290 px controls і Login/Register/Forgot anchors. Додано `Or` divider у Forgot без API зміни. `auth-responsive.spec.ts`, password-validation і completion-focus пройшли 12/12; `
npm run verify:build` PASS (218 modules).

Mobile Auth footer тепер рендерить лише порожній `contentinfo` landmark, щоб приховані desktop-посилання не потрапляли в keyboard tab order. Release responsive matrix повторно пройшла 1/1 на 320/393/768/1440 px; до неї додано unknown-route 404 state.

Figma 404 frame `361:778` реалізовано як локалізований fallback route: великий 404 hero, error copy, Back to home CTA і responsive no-overflow. Matrix перевіряє UK copy та `/uk/home` link на 320/393/768/1440 px; оригінальний Figma image fill не використовувався, бо asset не доступний у локальній копії.

Останній Auth cleanup commit `42b8e3b` пройшов [GitHub CI run 39700140275](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275) за 1m52s: backend tests, frontend build/typecheck і Caddy validation завершилися успішно.

Початкові backend спроби проти основної dev DB не зараховані: вони отримали access denied через host credentials. Фінальний результат отриманий на чистій ізольованій MySQL з CI credentials; основну БД не змінювали.

## Figma та UI

- Design copy: `BDO9GO1oscOeUTcu4VXVKA`.
- У цьому проході concrete context/screenshots додатково використані для Popular Reviewers desktop/phone `1480:5486`/`1480:7698`; попередній checkpoint охопив Search shortcuts, Lists, Journal article, Auth desktop/mobile, Help, About, Admin dashboard і Public Profile phone.
- Service desktop `1062:1993` повторно перевірений у Figma canvas: Help-style full-bleed 818 px hero, centered title/lead і alternating detail rows тепер спільні для шести service routes. `service-pages-responsive.spec.ts` пройшов 1/1.
- Admin desktop `1178:2466`/`1404:4076` повторно перевірений через local raw inventory: hero/workspace geometry має 1020 px і 272 px avatar, а admin API tables/settings залишилися без контрактних змін. Geometry check пройшов 1/1.
- Auth raster assets збережені локально; runtime не містить тимчасових Figma asset URLs.
- Повний browser suite перевірив UK/EN, 320/393/600/720/768/1440 responsive cases, keyboard/focus, loading/error/empty/retry, admin fixture і poster compatibility.

Точні mappings і межі pixel parity — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md). Загальна pixel-perfect відповідність усім top-level frames не заявляється без окремого screenshot comparison кожного frame.

## GitHub CI

- UI/assets/harness commit: `33f8082`.
- Release documentation commit: `f48713a`.
- [`CI / verify (push)` run 39557098972](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s. Backend tests, frontend build/typecheck і Caddy validation зелені.
- Search/CI maintenance commit: `ea037f0`; [`CI / verify (push)` run 39560672726](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726): PASS, 1m44s. Runner pin/docs commit `0b22904`; [run 39560950893](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893): PASS, 1m36s, без annotations. Нові action majors та `ubuntu-24.04` виконані успішно.
- Latest PublicProfile overflow fix commit `4e3eada`: [CI / verify (push) run 39703800234](https://github.com/anton5267/rewind-letterboxd/actions/runs/39703800234) PASS.
- Public Lists catalog landing alignment commit `2d40abc`: [CI / verify (push) run 39719191200](https://github.com/anton5267/rewind-letterboxd/actions/runs/39719191200) PASS; `list-discovery-controls.spec.ts` 4/4 and frontend build/typecheck passed.
- Public Lists journey regression update commit `04723b8`: [CI / verify (push) run 39720126166](https://github.com/anton5267/rewind-letterboxd/actions/runs/39720126166) PASS; the cross-locale tag → list → author → movie guard follows section-level `View all`, and list/public guard targeted coverage passed 10/10.
- Journal Article geometry commit `d68eeec`: [CI / verify (push) run 39725805058](https://github.com/anton5267/rewind-letterboxd/actions/runs/39725805058) PASS. Public Profile phone geometry commit `8ce4419`: [CI / verify (push) run 39726412078](https://github.com/anton5267/rewind-letterboxd/actions/runs/39726412078) PASS.
- Історичний checkpoint перед поточним UI-проходом: [GitHub CI для `f0df409`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39485802412).


### PublicProfile desktop Figma follow-up — 22.10.2026

Raw frames `238:596`, `122:176` і `175:619` були повторно прочитані з локального Figma archive. Desktop route тепер має виміряні 1440×1020 full-bleed hero, 265×265 avatar, 58 px identity title, 1200×79 profile rail, 24 px section headings і 174×260 poster cards у шість колонок із 31 px gap. API-backed profile data, avatar fallback, mobile geometry, localization і accessibility не змінювалися; оригінальний Figma photo fill не вигадувався без локального asset.

Перевірки після `docker compose build web` та `docker compose up -d web`: `
npm run verify:build` — PASS (218 modules), `public-profile-design-flow.spec.ts` + `public-profile-desktop-figma.spec.ts` — **2/2**, no horizontal overflow.


### Own Profile desktop Figma follow-up — 22.10.2026

Raw own-profile frames `363:289`/`363:411` confirm a 1020 px identity stage, 265 px avatar, 58 px name, 1200×79 profile rail and 174×260 collection poster slots. `Profile.module.css` applies those desktop measurements from 1024 px and reorders the rail before overview with CSS order; API-backed content, visible film titles/years, forms, focus behavior and mobile rules remain intact.

After the Docker web rebuild, `
npm run verify:build` passed (218 modules) and `profile-alignment.spec.ts` passed **10/10** across UK/EN, retry/error, legacy poster, keyboard and no-overflow checks.

The related Profile variants `122:176`, `175:619`, `363:289`, `363:411`, `153:180` and `175:177` share a five-tab `Profile / Films / Watchlist / Likes / Lists` rail. The runtime rail now switches the existing watched/watchlist/favorites API states and keeps Ratings, Reviews and Following as live sections below it; no new endpoint or fixture data was added. The same suite passed **10/10** after the Docker web rebuild, including UK/EN collection switching.

The raw admin reported/edit frames (`1389:3464`, `1343:3799`, `1319:5033`, `1317:4617`, `1315:4313`, `1342:4028`, `1390:3326`, `1319:5889`, `1342:3273`, `1342:3470`, `1343:4118`) were checked against the repository contract. They require report/complaint entities, edit history and block/delete/resolution mutations that are absent from both `admin.api.ts` and backend controllers. Existing hide/unhide moderation and audit logs cannot safely stand in for those operations; implementation waits for an approved API contract.


### Own Profile mobile shell follow-up — 22.10.2026

Raw frame `896:1838` was re-read from the local archive. The phone route now uses a full-bleed identity stage without the global logo/menu header; its 44×44 gear/more controls start at y=48 and the 120×120 fallback avatar is centered at y=190. The bottom navigation, live profile sections, edit/logout menu, localization and focus behavior remain unchanged. After rebuilding Docker web, `profile-alignment.spec.ts` passed **10/10** and `
npm run verify:build` passed (218 modules). Separate Films/Lists/Reviews/Following/Watchlist/Likes variants remain the next raw-node audit.


### About desktop Figma follow-up — 22.10.2026

Raw frame `1011:1915` confirms the About composition: 1440×818 full-bleed hero, 58 px title, 24 px intro, a 1200 px editorial rail and the first heading at y=713. `About.module.css` now uses that measured desktop overlap shell from 721 px; localized copy, TMDB attribution and mobile overflow behavior remain intact. The original photo fill is not fabricated without a local asset.

After the Docker web rebuild, `
npm run verify:build` passed (218 modules) and `about-figma.spec.ts` passed **1/1** at 1440 and 393 px.


### Service editorial variants — 22.10.2026

Raw service frames confirmed the shared 1440×818 hero, 58 px title, 24 px lead, 1200 px content rail and 22/20 px editorial typography. `Servicerage` now uses route-specific localized sections for Help, Contact, Rules, Privacy, Film Data and Account Deletion, with no API or asset contract changes. After rebuilding Docker web, `service-pages-responsive.spec.ts` passed **3/3**, covering hero/nav, desktop section counts and rails, and UK/EN 393 px no-overflow.

The same Docker pass exposed a fixed-header interception in the admin user detail Close action. Scoping the Figma-aligned absolute control to its detail header restored the keyboard focus-return contract; `editorial-accessibility.spec.ts --grep "admin user detail"` passed **1/1**.


### Journal feed desktop — 22.10.2026

Raw Journal list frames confirmed the 1440×818 full-bleed stage, 513×612 feature cover at x=120/y=212, feature text rail at x=748, and the following 444×408 covers at the 576 px editorial rhythm. The desktop CSS now follows that geometry while retaining live API articles, archive/category controls, pagination, localization and the existing mobile composition. After rebuilding Docker web, `journal-design-flow.spec.ts` passed **2/2**, including the 393 px no-overflow check.


### Full regression — 22.10.2026

rush `d703d63` passed GitHub `CI / verify (push)`. The local frontend suite completed with **128 passed, 2 failed and 12 skipped out of 142**: both failures are the pre-existing Community retry scenarios covered by the user's uncommitted `FollowActionsContext.tsx`, and the skips require the unavailable admin fixture. The backend suite was rerun against the Compose MySQL service on port 3307 and completed **87/87 passed** with no failures, errors or skips; no `.env`, database or user-owned dirty files were changed.

## Збереження даних

- Основні Docker volumes не видалялися; `down -v` не виконувався.
- Browser/API verification створювали лише disposable accounts/data й виконували cleanup.
- Diploma video artifacts, локальний `AGENTS.md`, `.env`, backups, caches і raw Figma references не включаються в release commits.

## Межа релізу

Локальні перевірки не підтверджують production infrastructure. VrS, domain/TLS, real SMTP/TMDB credentials, monitoring і restore drill на цільовому сервері виконуються окремо за [DEPLOYMENT](DEPLOYMENT.md). Відсутність погодженого Journal content не блокує код: Journal залишається API-backed.


### Popular Reviews mobile touch targets — 25.10.2026

- Back/Search controls now use44×44px links with36×36px visible circular controls; localized accessible names remain on the links, and glyphs are decorative.
-
npm run verify:build` passed (TypeScript + Vite,231 modules). Tests were not run per the active redesign constraint. Phone frame `1480:9087` is mapped at393×1265; the current source/frame visual comparison remains open because direct navigation in Figma returned Loading.

### Popular Reviews desktop Figma check — 22.10.2026

- Raw source: local archive frame `1480:4880`.
- Implemented: 1440×486 hero, 1200 px rail at x=120, 1200×180 reviewer group, 80×80 reviewer avatars, 1200×315 review cards, and 175×262 poster slots.
- Verification: `
npm run verify:build` PASS (218 modules);
px playwright test tests/e2e/popular-reviews-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.
- Contract: live review/reviewer APIs, localization, focusable links and mobile overflow behavior remain unchanged.

### PublicProfile mobile identity check — 22.10.2026

- Raw source: local frame `825:1378`.
- Implemented: 361 px mobile identity rail (x=16..377), safe long-name wrapping, and preserved 120×120 avatar at x=136.5/y=190.
- Verification: `
npm run verify:build` PASS (218 modules); `public-profile-design-flow.spec.ts` + `public-profile-desktop-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.


### Featured Lists Figma check — 22.10.2026

- Raw source: local archive frame `1480:5839`.
- Implemented: 1200 px desktop content rail, y=572 content start, three 326×249 cards with 112 px gaps, and a phone-safe full-bleed hero under the `team` feed variant.
- Verification: `
npm run verify:build` PASS (218 modules);
px playwright test tests/e2e/public-lists-featured-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.
- Contract: live `/api/lists/public/team`, localization, focusable links and loading/error/empty/retry states remain unchanged.


### Popular Lists Figma check — 22.10.2026

- Raw sources: local archive frames `1480:5390` and `1480:7927`.
- Implemented: 1200 px desktop rail, 1200×339 rows at the measured y-rhythm, 361 px phone cards, and 323×116 compact poster strips.
- Verification: `
npm run verify:build` PASS (218 modules);
px playwright test tests/e2e/public-lists-popular-figma.spec.ts tests/e2e/public-lists-featured-figma.spec.ts` PASS (**4/4**); Docker web image rebuilt and restarted.
- Contract: live `/api/lists/public/popular`, sorting/filter links, localization, focus and retry states remain unchanged.


### Public List detail Figma check — 22.10.2026

- Raw sources: local archive frames `1480:6071`, `1480:6134`, `1480:9302` and `1480:9353`.
- Implemented: 818 px desktop hero, 1200 px detail rail, six 174×260 desktop posters, and 79×116 four-poster phone rows.
- Verification: `
npm run verify:build` PASS (218 modules);
px playwright test tests/e2e/public-list-detail-figma.spec.ts tests/e2e/list-mobile-header.spec.ts` PASS (**14/14**); Docker web image rebuilt and restarted.
- Contract: live detail/like/tag APIs, information dialog focus return, contextual navigation and UK/EN behavior remain unchanged.


### Global Search desktop all-results Figma check — 22.10.2026

- Raw source: local archive frame `1480:6991`.
- Implemented: 1200 px desktop rail, six 174×260 film posters at y=377, and 1200×315 review cards at y=692 with 175×262 poster slots; duplicate visual tab/section bands are removed while accessible controls remain.
- Verification: `
npm run verify:build` PASS (218 modules);
px playwright test tests/e2e/global-search-desktop-figma.spec.ts tests/e2e/global-search-alignment.spec.ts` PASS (**5/5**); Docker web image rebuilt and restarted.
- Contract: live search API, keyboard category navigation, localization, existing mobile variants, and no-overflow behavior remain unchanged.


### Global Search desktop empty-state Figma check — 22.10.2026

- Raw source: local archive frame `1480:5809`.
- Implemented: centered 540×166 no-match shell at x=450/y=377 under the matches heading.
- Verification:
px playwright test tests/e2e/global-search-desktop-figma.spec.ts` PASS (**2/2**) after Docker web rebuild.
- Contract: localized empty copy, Back to home link, keyboard semantics, API error/retry behavior, and mobile layout remain unchanged.


### Global Search desktop lists-tab Figma check — 22.10.2026

- Raw source: local archive frame `1480:7490`.
- Implemented: 1200×339 list cards at y=377/y=754, 446×260 five-poster previews at x=154/y=421, 38 px card rhythm and 20 px card radius.
- Verification: `
npm run verify:build` PASS (218 modules); combined Global Search desktop/alignment tests PASS (**7/7**) after Docker web rebuild.
- Contract: live list search data, owner/count/description content, keyboard category tabs, localization and mobile layout remain unchanged.


### Global Search desktop reviews-tab Figma check — 22.10.2026

- Raw source: local archive frame `1480:7311`.
- Verification: `global-search-desktop-figma.spec.ts` plus `global-search-alignment.spec.ts` PASS (**8/8**) for all, no-match, lists and reviews variants after Docker web rebuild; `
npm run verify:build` remained PASS (218 modules).
- Contract: live review API data, links, nullable poster/avatar fallbacks, keyboard category tabs, localization and mobile behavior remain unchanged.


### Global Search responsive and live Figma follow-up — 22.10.2026

- Sources: live Chrome Figma canvas `1480:7549` (Journal Search,1440×1149), plus local raw all/empty/lists/reviews frames. Live `get_design_context` and `get_screenshot` MCP calls returned `Unknown tool`; browser canvas access works. Full variables/assets export and exact shared header/footer parity are not claimed.
- Corrected: visible native desktop category selection; keyboard tabs reveal on focus; metadata anchored to posters; proportional previews; natural card/empty heights for long localized content; responsive Journal cards with219px covers,347px minimum,20px radius and22/20px title/excerpt.
- Current verification: **23/23 passed**, no skips, after Docker web rebuild: `global-search-desktop-figma.spec.ts`, `global-search-alignment.spec.ts`, `global-search-responsive.spec.ts`, `search-controls.spec.ts`, `journal-design-flow.spec.ts`. The responsive fixture checks UK/EN at320/393/600/720/768/1024/1100/1101/1440px, long titles/copy, document/card bounds and actual keyboard/pointer targets. TypeScript/Vite passed (218modules); Docker web image rebuilt and restarted with existing volumes preserved.
- The earlier geometry-only empty-state check counted a166px outer box while content escaped it. That result does not prove content fit; the new suite checks message/action containment and allows natural height.
- PLAN and PROGRESS are consolidated to current status and one work order; detailed historical evidence remains here. Backend report totals corrected to87 after excluding a stale duplicate two-test report; this audit did not rerun backend tests.


### UserLists desktop implementation / test deferral — 22.10.2026

- Live Figma Chrome review: empty `1480:5333` and populated `1480:5182`; raw confirms 818 px hero,1200 px editor rail from y713,588 px columns with24 px gap,79 px fields,515 px textarea and195 px rows with91×134 posters. The mapped hero image already exists locally as `/images/search-hero-desktop.png`.
- Implemented: responsive desktop composition, natural content heights, picker below editor, focus/scroll return for selection (including same-ID), Cancel and deletion. Existing CRUD/public checkbox/tags/remove/reorder and mobile add-film routes are retained. Persisted ranked-state/extra view APIs are not added.
- Build: TypeScript/Vite PASS (218 modules); Docker web image rebuilt/restarted without touching volumes. The authenticated local Chrome page was visually compared with Figma. No new final regression claim is made.
- User instruction changed during the first owner-flow run: do not write/run tests until the whole redesign is complete. That run was interrupted; two existing owner scenarios had already finished with disposable-account cleanup. The uncommitted new UserLists spec was removed. Further local test runs and intermediate pushes (which trigger CI tests) are deferred to the final phase.
- Earlier Search delivery `ea121af`: GitHub CI completed successfully before this instruction; run https://github.com/anton5267/rewind-letterboxd/actions/runs/39836480216 . UserLists changes remain local for ongoing design work.


### Profile Authentication and original backdrops — 22.10.2026

- Sources: Authentication `251:549` and PublicProfile `238:596` opened in live Chrome Figma; raw descendants supply geometry, image hashes, the y628 flat Authentication background and password field positions. Mapped Babylon/Whiplash originals were copied to stable frontend paths; provenance is in FIGMA_HANDOFF. The blurred Authentication overlay is approximated with a gradient; SF Pro Display parity is not claimed.
- Implemented: `/profile?settings=authentication`, localized three-field password form using the existing API payload, client confirmation, pending focus return after slow profile loading, and links to real profile/avatar-URL/social/newsletter/delete sections. Fixed input CSS specificity so the 79 px/radius37 desktop and 56 px mobile fields override the overview form styles. No backend contract changed.
- Build/view evidence: `docker compose build web` PASS using
pm run build` (220 modules); `docker compose up -d --no-deps web` completed. Chrome views covered desktop1440 and phone393/320 with UK/EN; the Avatar URL link returned focus to `profile-avatar-url`. No password values were entered or submitted. No tests or new TypeScript check ran for this block, and no commit/push was made.
- Additional CSS changes make Profile/PublicProfile/PublicList poster grids and Featured/Popular Lists previews proportional at intermediate widths. They are included in the web build; their complete visual width pass remains pending. Historical geometry/test results above do not cover these new changes. All tests remain deferred until the redesign is complete.


### Profile backgrounds, About/Help and shared navigation — 22.10.2026

- Live Figma canvas: own phone Profile`896:1838`, public phone`825:1378`, About`1011:1915`, Help`1062:1993`, Header`251:612` and Footer`251:625`. Raw descendants provided exact image/crop and geometry mappings. Own/public phone backgrounds now use distinct Babylon/Whiplash originals; public collection links preserve query/hash and heading focus. Standalone collection variants and overview composition remain unfinished.
- About now contains eight localized editorial sections and its original hero crop. Help contains six alternating illustrated rows, three guide cards and14 byte-identical mapped assets. Shared ServiceNavigation uses existing real routes; contrast and intermediate-width grid defects were fixed. Account Deletion links to the existing settings form; no deletion was performed.
- Header uses the original184×30 logo and five desktop links with an Account disclosure retaining notifications/messages/settings/admin/locale/logout. Footer uses five24px primary links, current TMDB attribution and real service routes. Auth footer is visible on desktop and hidden on phone. Exact vector/font parity is not claimed; native SVG export was attempted but no download was obtained.
- Build: `docker compose build web` PASS, Vite222 modules; `docker compose up -d --no-deps web` completed with existing volumes retained. Chrome: About1440EN from hero through footer; Help1440UK all six rows/three cards,768UK hero/first row and320EN hero/navigation/first illustrations; own/public profile393; public URL-selected Watchlist focused its collection heading; Account disclosure opened and Escape returned focus to its trigger.
- This served build predates the new PublicProfile overview, the later LinkedIn icon correction and guest auth-return fix. Those changes need a subsequent build/view. No tests, typecheck, commit or push ran in this block. Historical suites do not cover this code; all tests remain deferred until the redesign is complete.
- Independent source review found a guest navigation defect: opening Account Settings or Account Deletion lost the requested Profile query/hash during login. Profile now passes router `state.returnTo`; Login accepts only the exact localized Profile pathname, preserves query/hash and otherwise keeps its Films fallback. Absolute/protocol-relative paths, backslashes, control characters and other routes are rejected. Source reviewed; authenticated guest-return flow has not yet been exercised in the browser.


### PublicProfile overview implementation — 22.10.2026

- Sources: raw238:596/825:1378 and their overview children. Order now Favorites → Activity → Recent Reviews → Following → Lists. Existing full collections/statistics/social/liked reviews remain accessible below. Favorites and review previews start with4/2 items; activity retains real pagination/expansion. Hero metrics use actual watched/following/followers counts.
- poster hydration uses movie details for activity and visible review details for reviews, bounded photo cache, in-flight deduplication, stale-response guards and retry; hidden/missing reviews are unavailable without bypassing visibility. WATCHED activity is typed/localized. No fake ratings, duplicate posters, new endpoints or fixture content were introduced.
- Independent source review corrected mobile list layout to heading→full-width strip from831:1537, retaining genuine three API previews. The six navigation buttons below831:1568 and standalone collection layouts are still pending. Tablet hero alignment is stable; desktop keeps avatar starty274.
- `docker compose build web` PASS (Vite226 modules); `docker compose up -d --no-deps web` completed. This build includes the LinkedIn icon and guest auth-return fixes. Chrome393UK showed hero, empty favorites/lists, activity/review fallbacks and following;1440EN showed desktop hero;320EN URL-selected Watchlist displayed the real entry and focus on `public-profile-collections-title`. The viewed account has no poster URLs/favorites/public lists; populated preview visual fidelity is not proven by this pass.
- No tests/typecheck/commit/push. No account/follow/block/delete mutation, database/volume deletion or fixture cleanup performed. All tests remain deferred; overall design coverage is incomplete.


### PublicProfile lower mobile navigation — 22.10.2026

- Live Figma `831:1568` opened and visually read; raw overrides confirm Films/Watchlist/Likes/Lists/Following/Followers in six361×32 rows with5px gap, radius37, #282828 and11px labels. Runtime retains that order/appearance with44px targets for accessibility. Lists uses the generic label rather than My lists on another member's profile.
- Added real query/hash navigation, collection-page reset and focus handling for direct network-heading anchors. Existing section URLs and browser-history behavior remain available. These links currently reach the live sections; they do not prove completion of the separate standalone collection variants.
- Docker web build PASS (Vite226); web recreated with `--no-deps`, volumes retained. Chrome393UK showed all six links; Following updated the URL and focused `public-profile-following`. Chrome320EN displayed all six labels without clipping after the final rebuild. No tests/typecheck/commit/push or data mutations.


### PublicProfile separate collection/list views — 22.10.2026

- Earlier note grouped raw phone frames845:1679/861:1474/863:2474/863:2717 as collection variants. The 845:1679 identity is now unresolved; retain confirmed local toolbar/content measurements as source evidence only. Live Figma Watchlist861:1474 was opened and visually read. Lists retains the previous real API card composition; unsupported user-rating stars are not fabricated from movie averages.
- Added `view=collection` with the existing collection parameter, and `view=lists`. Desktop retains identity/rail and isolates the selected content; phone hides identity/rail and shows a44px toolbar with four proportional79×116 posters/15px column gaps. Filters opens the real roving collection tabs; Back restores overview. Legacy query/hash-only URLs keep their existing overview sections. Hidden sections leave the accessibility tree, while links/data/retry/pagination remain available in the selected view.
- Docker web build PASS (Vite226), web recreated with `--no-deps`, existing volumes retained. Chrome393EN Watchlist showed its actual entry/fallback, Filters expanded, pointer selected Likes, then ArrowLeft restored Watchlist and focused its selected tab. Chrome320UK showed empty Lists with its own toolbar;1440EN showed the isolated six-column desktop collection rail. Populated grids/lists, complete width coverage and all error/retry states are not proven by these views. An initial Tab/Right attempt did not switch the collection; the later explicit selected-tab ArrowLeft observation confirms only that interaction.
- No tests/typecheck/commit/push or data mutations. Own collection variants and network/settings coverage remain open; overall goal remains incomplete.


### Own Profile collection/review views — 22.10.2026

- Live Figma1015:3356 was visually read with own overview/Watchlist/Likes/Lists neighbors; this exposed remaining hero-metric and own-list-card gaps. Raw1015:2131 (Films) confirms standalone toolbar50/content123. Raw1015:3356/4508 (Watchlist/Likes),1017:1841 (Lists) and1023:1867 (Profile tab with full Reviews list) retain avatar120/y190, identity stage to496, nav/y531, heading/y606 and content/y646. Own Lists still has live text links; its poster-card composition is pending.
- Implemented own `view=collection`/`view=reviews`, query-based collection selection and copied-link/history support. Films uses a phone toolbar/four proportional posters; Watchlist/Likes/Reviews retain identity/nav and isolate their selected section. Real review posters/content/date, nullable/legacy fallback, pagination/retry and all original settings/auth flows remain. View Back restores overview; identity editing clears view before focusing its form. WATCHED activity now retains its film link.
- Chrome exposed an early footer and a visible horizontal nav scrollbar; final CSS gives explicit views100vh, hides the scrollbar and keeps inset keyboard focus. Views retain44px controls and natural content heights. No unavailable bio/extra fields or ratings are fabricated.
- Docker web build PASS (Vite226), web recreated with `--no-deps`, data volumes retained. Chrome393EN own Watchlist showed retained identity/nav and empty collection;320UK showed the genuine Send Help review poster/card, then navigation to Films updated query/hash and focused its collection heading. Final Films screenshot showed the compact toolbar, actual fallback entry and no early footer. Desktop Watchlist rail/empty state was also viewed, but full desktop/mobile parity and populated multi-row grids are not proven.
- No tests/typecheck/commit/push or data mutations. Own Lists/network/settings and overall frame coverage remain unfinished.


### Own Lists, hero totals and network — 22.10.2026

- Raw1017:2157 confirms361×189 list cards with18/24px padding,325px heading and116px poster strip. Added ProfileListCard using existing authenticated list-items API, genuine item count and up to five previews, loading/retry and empty-list fallback. Requests have cleanup guards, owner dependencies and no persistent private-data cache. Cards load only for overview/Lists; existing public/private list destinations remain.
- Hero now shows actual watched/following/followers totals and network links; unknown totals show a dash with retry. Statistics moved below the main overview and the old favorite-preview anchor remains available. Corrected equal metric-label heights, link-color specificity and the overview nav scrollbar after Chrome review.
- Following/Followers now use separate query views, existing APIs/pagination/stale guards and a page-scoped FollowActionsrrovider. UserFollowRow adds a scoped profileNetwork presentation and optional settlement callback to refresh totals/pages. The user's dirty FollowActionsContext was read and reused, never edited. Network table watched/list/likes metrics lack API fields and are not fabricated. Source review caught the required Provider before serving the new rows.
- Docker web build PASS (Vite228), web recreated with `--no-deps`, volumes retained. Chrome393UK showed the aligned hero totals, Favorites first and the true empty Followers route with heading focus. Chrome320EN showed real populated and empty own-list cards with counts/posters. No follow/unfollow mutation was performed; populated network rows, settlement refresh, error/retry cases and complete responsive/frame parity remain unverified.
- No tests/typecheck/commit/push. Own overview poster activity/review preview and extra-section ordering, network variants and settings remain open; overall goal remains active.

- Network follow-up in the same block: live Figma1023:3020 confirms phone follower/following subtitles. Existing follow-status already exposes these totals, so profileNetwork rows now hydrate them with request cleanup, identity guards and retry. This does not resolve the separate desktop watched/list/likes metric contract. The final Docker228 build includes this hydration and the own Lists Create link to the existing editor; populated network metadata/actions remain unexercised.
- Additional Chrome follow-up: desktop Lists heading was partially covered by the106px fixed header. Own desktop section/heading scroll margin is now122px, and the final view showed the complete focused heading below the header. Mobile Create uses the existing localized New list label; an initial missing-key label was corrected. No additional regression claim.


### Own overview and Contact composition — 22.10.2026

- Own source: desktop238:865 and phone896:1838 raw plus exported phone reference. Overview now orders Favorites4, poster activity4, recent reviews2, Following and one list preview; mobile has four tabs and six lower links. Extra full sections render for explicit views/legacy hashes. Current own rating uses the existing rating/me API with cleanup/actor guards and retry, without a private response cache; activity events do not invent historical scores. Nullable/legacy review-poster compatibility remains. List preview uses existing metadata/items and the desktop poster-left/details-right composition.
- Manual Chrome393UK: four tabs, real activity/review poster, current4/5 score, Recent reviews link → full Reviews with heading focus. Chrome1440EN: review card with175px poster and real score, one list preview with title/count on the right, Statistics Ratings link → full Ratings with heading focus. This does not verify all populated/error/loading states or the complete width matrix.
- Figma MCP get_design_context Contact1122:2497 succeeded with full code, screenshot and assets. The next Privacy1164:2679 request returned the Starter-plan call limit. No plan/subscription change. Downloaded Contact hero was byte-identical to existing search-hero-desktop.png; reused it. Original divider SVG downloaded to a stable local runtime path; no temporary asset URLs in application code.
- Contact body now has an introduction, three semantic lists, original dividers and22/20px desktop type. Shared service rail uses24px desktop type with44px targets; real supported routes retained. Unverified example email destinations and archived-board link are absent; the page states that the team address is not yet published, pending user confirmation. Copy and extra navigation reflect available functionality, so exact content parity is not claimed.
- Docker web build PASS (Vite229 modules); final manifest list3f1bfec74885df4050d81852359a983bb171f62ef894708412bd828e3469fb03. Web recreated with --no-deps; no DB/API/env/volume changes. Chrome1440EN/UK Contact hero/rail/body reviewed,320UK body/navigation reviewed; keyboard Tab from Help to Film Data showed visible focus. Full shared-sidebar width coverage and exact fonts/vectors remain open.
- No tests, typecheck, commit, push or account/data mutations. Privacy and remaining Profile/settings/Service/frame coverage are unfinished; overall goal stays active.


### Privacy editorial body and tablet Header — 22.10.2026

- Privacy1164:2679 opened in live Chrome and visually read at25/50%, correlated with raw intro2696/y713 and five sections2694/2755/2759/2763/2767. MCP request was quota-limited; no claim of a successful Privacy context export. Implemented one editorial rail with intro, semantic ordered lists3/4 and five sections, preserving existing policy copy where applicable and adapting unsupported settings/recommendation/analytics claims to actual app functionality. Profile details and Delete account links use existing form anchors; no new API or privacy controls.
- Contact/Privacy share editorial CSS and the original local divider. Chrome1440EN Privacy body and393UK/768UK body/hero reviewed. Profile details link navigated to /profile#profile-identity-form-title and the settled AX state confirmed heading focus. Account deletion was not submitted. These observations do not prove the full responsive matrix or exact copy/font parity.
- Chrome768UK exposed the old tablet Header's horizontal navigation scrollbar. Removed the duplicated legacy nav/unused CSS;721–1023px now adapts the existing five-link desktop rail and Account menu. Its menu breakpoint is721px. Chrome768/721UK: all five entries visible, Account popup contains real routes, Escape returns focus to Account. Resizing an open popup721→720 closes it and focuses the mobile Menu trigger. Guest/admin/unread-rich and light-header variants remain unreviewed for this change.
- Docker web build PASS (Vite229 modules), latest manifest listdc9aa82002391307111f22e9049b6a600f94af3d566a590c779a41591a055f50; web recreated with --no-deps. No tests/typecheck/commit/push, DB/env/volume changes or user-data mutations. Remaining Profile/settings, Rules/Film Data/Account Deletion and full frame coverage remain active work.


### Remaining Service document bodies — 22.10.2026

- Live Chrome/raw sources: Rules1164:2790 (nine sections, ordered prohibited list4); Film Data1162:2305 (separate intro/attribution, two sections); Account Deletion1176:2515 (four sections, ordered effects list4). Replaced the remaining numbered/alternating card renderer with shared editorial composition and removed its unused CSS. First content begins at the713px desktop target, headings22/body20, genuine local divider reused. English page headings now match frame names.
- Film Data keeps TMDB attribution and real TMDB/Contacts links. Source's30-hour update promise is omitted: the actual scheduler is opt-in and does not establish that deadline. Automatic duplicate merging and paid-subscription cancellation are not advertised; account deletion copy refers to current account/follow/session functionality. No backend/API changes.
- Chrome1440EN reviewed Rules body/list, Film Data intro/sections/links and Deletion body/CTA. Chrome320UK reviewed all three bodies with wrapping/semantic lists and preserved navigation. Deletion CTA navigated to the existing profile anchor; settled AX confirmed focus on profile-delete-form-title. No deletion/password/account mutations performed. Full width/state coverage and exact font/copy parity remain unproven.
- Docker web build PASS (Vite229), final manifest lista3f7630b302a615c74193d5e0e3d5a03e418637abd212658cb8aaf4b166b69fe; web recreated with --no-deps. Tests/typecheck/commit/push remain deferred under the user instruction. Overall redesign goal remains active.


### Profile settings views and mobile composition — 22.10.2026

- Sources: live Chrome/raw Profile251:430, Avatar/Banner251:660 and mobile Settings1043:2125 (live393×1905); Connections341:3207 raw and visible neighboring frame. oCr251:430 request confirmed the continuing Starter call limit. Existing mapped Babylon original reused; no new static assets or Figma source changes.
- Generalized ProfileAuthentication into ProfileSettingsShell and added settings=profile/avatar/connections alongside the existing authentication route. Desktop retains1200px rail/four tabs,588px fields,79px controls and mapped hero. Profile shows read-only username/email, editable displayName and real Favorites. Avatar has a543px preview with265px current image/initial and URL form; social view keeps existing URL fields. Mobile Profile has flat toolbar/compact rows, Favorites,90px avatar in158px panel and social forms. Unsupported profile fields/banner upload/OAuth controls are absent; no overall frame parity claim.
- Normal overview no longer displays settings forms; existing hash URLs conditionally mount the legacy forms. Gear and generic Header/service settings links now open Profile settings. Name/avatar updates send separate PATCH fields, preserving the other draft; profileService.updateMyProfile null guards confirm the existing partial-update contract. No backend changes or mutation execution.
- Chrome393UK reviewed Profile/Authentication/Avatar/Social navigation and heading focus. Chrome320UK reviewed full username/email wrapping and rounded password controls. Chrome1440EN reviewed Profile fields/Favorites, Avatar preview, Authentication controls and keyboard Tab to Confirm new password. Returning to overview showed the intended headings without settings forms; opening the legacy delete hash focused its heading. No password values entered and no save/delete actions submitted.
- Manual review caught clipped read-only email and password CSS specificity leakage; outputs now wrap, and settings input selectors override legacy Profile form styling. Final Docker web build PASS (Vite229); manifest list26c1755950161f08d720570fb2d8eb5e790009f318ce3cbf73c297605f910076, web recreated with --no-deps. No tests/typecheck/commit/push or DB/env/volume changes. Full tablet/width/error/retry/save states, network variants, Public overview follow-ups and remaining full-file coverage are open.

### Public network review and Contact address confirmation — 24.10.2026

- The user confirmed `anonimua910@gmail.com` as Rewind's public support contact. Contact now renders the address as a visible `mailto:` link in UK/EN; Chrome accessibility trees confirmed the link destination in both locales. No email was sent and no other Figma/example destination was published.
-
pm run build` PASS (Vite229 modules). Docker Desktop was started after reboot; rebuilt web image digest `sha256:ee7d040cb6ccae34ac4c36005ff2a0186dc3eb2698c10ec5660d293c834fed7a`. Started the existing Compose API dependencies and containers using the existing `.env` and DB volume; no migration was needed (schema at version31). Docker does not report an explicit DB volume change; DB container is healthy. Web/API/Redis/Mailpit and DB are now running.
- Chrome confirmed Contact content and email link UK/EN. A populated Public Following page (`/uk/users/7748?view=following`) loaded real network data: heading focus, desktop back link, target name and follow-status counts, and the follow action are visible. No follow/block/message actions were activated. The earlier ID1092 in the previous local DB snapshot is unavailable in this current instance; a populated profile was located from the live community directory instead.
- No tests/typecheck/commit/push or account/data mutations. Full profile variants, remaining frames and final regression remain open; overall redesign remains active.


### Public network mobile More sheet implementation — 24.10.2026

- `UserFollowRow` now includes the phone More trigger and the `1033:5681` member sheet with existing follow/unfollow, block/unblock and member navigation actions. Block status and changes use existing endpoints; no API/backend contract was added. Escape/focus trap uses the shared dialog hook. UK/EN strings and retry/error feedback are included. Action retry also waits for focus restoration; block is disabled while a follow mutation is active.
- Source review caught and fixed a CSS cascade that overrode phone-trigger visibility. Network refresh after an action is deferred one frame so the dialog trap can restore focus before a row may be removed.
pm run build` PASS (Vite229 modules). Docker web rebuilt/recreated; the later PublicProfile alignment rebuild produced final image digest `sha256:5f9c335d9434d37fc30ea33b5b40847e253be195d0429965bbdf9cae3e6f496c`. Existing API/DB/Redis/Mailpit containers stayed running; no env, database, volume, or account data changed.
- Chrome screenshot and accessibility snapshot show a real populated guest Public Following row at desktop width. The action is the expected direct Follow link; the authenticated More sheet is unavailable in this guest session. The current viewport did not allow mobile sheet/focus visual review, so those criteria remain unverified; no follow/block mutation was activated. No tests/typecheck/commit/push; tests remain deferred until the redesign ends.


### PublicProfile phone overview alignment and responsive capture — 24.10.2026

- Raw frame `825:1378` places the phone H1 at y=317, avatar at x=136/y=190/120×120, and Favorites heading `825:1414` at y=590. The live public profile H1 measured y=317. The Favorites heading previously measured y=649 because a phone top profile rail added 59 px; the raw phone variant instead has six lower navigation links. Hiding that extra top rail at <=620px moves the heading to y=591 (1 px rounding difference), leaving the lower links and explicit collection views intact.
- Chromium screenshots plus read-only layout measurements (no test assertions or mutations) covered PublicProfile overview and Following at 320/393/600/620/621/720/768/1024/1440 px. At every width, document scrollWidth equaled viewport width. UK/EN 393 phone screenshots localized the Favorites heading and retained all six lower section links. Phone overview and guest network row screenshots were visually inspected; actual actor-specific More sheet remains unreviewed because this local browser session is a guest.
-
pm run build` PASS (Vite229 modules). Docker web image rebuilt/recreated with digest `sha256:5f9c335d9434d37fc30ea33b5b40847e253be195d0429965bbdf9cae3e6f496c`. API/DB/Redis/Mailpit remained running; no DB, `.env`, volume or account changes. No tests, typecheck, commit or push.


### Global Search phone Empty copy and geometry — 24.10.2026

- Compared archived Figma frame `1480:8856` (393×852 PNG and raw subtree) with authenticated-state-free Vite preview using read-only API fixtures. Only successful Empty state hides the query input. Summary row x16/y120/361×24; prompt begins x279; no-match heading x61.5/y342.5/270×53.8; helper y413.3; Home CTA x149/y477.6/95×32. All state keeps its input and the four 79×116 poster slots at x16/110/204/298, y267. Native category select still receives focus from the Filter button and its focus outline is visible.
- EN393 and UK320 preview document widths equal their viewports. The PNG and raw source are local browser-save exports; no Figma assets were added. API/DB/Compose were not changed, no tests were run, and `
npm run verify:build` passes TypeScript/Vite after these edits.

### Global Search All phone / Films desktop frame review — 24.10.2026

- Compared raw `1480:8934` All phone top against the 393 px Docker route: hero end y187, input y120, match divider y220, first poster y267. Runtime layout matches; poster slots are 79×116. The mobile slider trigger focused the native category select. Query `film` returned 152 film/101 review rows from the local test-like database, so content parity is not claimed.
- Compared raw `1480:7256` Films desktop with `/en/search?q=Avatar&tab=films`: search field 400×44 at x520/y210, match control x120/y280/w1200, posters begin x120/y377 at 174×260 with 31 px gap. Runtime matched. Read-only Chromium widths 320/393/600/720/768/1024/1440 had document width equal to viewport.
- No code/data change in this frame review. Builds and Docker image evidence are recorded in the preceding entry; no tests or account/API mutations were made.


### Home guest phone frame review — 24.10.2026

- Compared raw `1411:3473` and Docker `/en/home`: 393×320 hero; H1 at x42.5/y106 with 308 px width; `Get Started` at x154/y239, 85×32; first live poster row x16/y368 with four 79×116 slots. Layout aligned at 393 px; EN320/393 and UK393 had no horizontal overflow. Current posters/feeds remain API-backed; local API contains test-like review/list content, so only layout is claimed.
- No code, API, DB or account data changed. Member Home `1327:3210` requires authenticated verification. No tests were written or run.


### Public Following responsive and keyboard review — 24.10.2026

- Read-only Docker Chromium review of `/uk/users/7748?view=following`; the local API returns test-like `social_race_...` data, so this is layout/interaction evidence only. At393px, heading and row start y123, row rail is361px, avatar40px, member link and guest Login/Follow link are44px high. At320px rail is288px.
- Captures at320/393/600/720/768/1024/1440 showed document scrollWidth equal to viewport width. Tab order moved through bottom navigation, Back, member link and login action; interactive targets were44px. Guest state intentionally has no More trigger. Authenticated More sheet and focus return remain open.
- No code, API, DB or account data changed. Build and tests were not run; no user-state mutation was performed.


### Person frame responsive review — 24.10.2026

- The earlier Docker capture below was stale and has been superseded by the decoded raw nodes and current Vite/Chromium source preview. The full `decoded/nodeChanges.json` does contain the Person raw nodes; only a dedicated screenshot/focused subtree export is absent.
- Raw phone anchors are avatar y190, H1 y317, divider y534 and first poster x16/y582/79×116/radius10. At393px current runtime measures avatar x136.5/y190/120×120, H1 y317, section title y542 and poster x16/y582.2/79×116. Desktop raw anchors are avatar y234, H1 y511, divider y992 and poster x120/y1092/174×260/radius20; runtime at1440 measures x457.5/y234/265×265, H1 y511 and poster x120/y1091.9/174.2×260.2. No horizontal overflow at320/393/600/720/768/1024/1440.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). Local API data are test-like, so evidence covers layout/responsiveness only; other Person frames and the unavailable cross-role producer mapping/writer feed remain open. No tests, API, DB, account data or Docker were changed.


### Public List information sheet responsive/focus review — 24.10.2026

- Read-only Docker Chromium review of `/en/lists/public/19606`; local list title/tag are test-like, so evidence is limited to layout and interaction. At393px the sheet was361px wide and showed owner, likes, tags and Done. Opening focused Done; Escape closed it and restored focus to the `List information` trigger.
- Captures320/393/600/720/768/1024/1440 had document width equal to viewport. Existing route/actions were preserved; no like or other mutation was activated.
- No code, API, DB or account data changed. Build and tests were not run.


### Service/About responsive width review — 24.10.2026

- Read-only Docker Chromium navigations covered `/en/{help,contact,rules,privacy,film-data,delete-account,about}` at320/393/600/720/768/1024/1440 px. At all captures `documentElement.scrollWidth` equaled the viewport width. UK pages at393px displayed localized page headings for every route.
- Service navigation naturally changes from a mobile multi-row layout at <=620px, to tablet rail at721–1023px, to desktop side rail from1024px; the visible heading/nav bounds remained within the viewport. This is responsive/overflow evidence, not a fresh frame-by-frame body comparison or full focus/state review.
- No code, API, DB or account data changed. No test runner/build was run.


### Contact responsive and keyboard focus review — 24.10.2026

- Manually reviewed UK and EN Contact routes at CSS layout widths320/393/600/720/768/1024/1440. `documentElement.scrollWidth` matched the layout viewport throughout, and the confirmed `mailto:anonimua910@gmail.com` link remained visible.
- At1440, the editorial body begins at y713, the support link is at y773, and the first section starts at y855. Keyboard traversal reaches the email link; Chromium computed a visible `2px` outline with `4px` offset.
- This verifies responsive overflow and link focus only. It does not establish pixel parity or close the other Service frames/states. No app data, source code, tests, build, Docker, or account actions changed.


### Profile Settings desktop keyboard navigation — 24.10.2026

- On the current Vite source preview, sequential keyboard navigation reached the `Avatar URL` tab with a visible focus ring. Pressing Enter changed the route to `/en/profile?settings=avatar`; the accessibility tree then reported focus on the `Account Settings` heading and exposed the Avatar URL form.
- No profile value was changed and Save was not activated. This checks one desktop keyboard route only; phone toolbar, all settings tabs, error/loading/save states, and Figma screenshot parity remain open. No tests or build were run.


### Own Profile Reviews phone frame mapping — superseded 25.10.2026

Historical 25.10 reclassification, superseded by the fresh 26.10 current-canvas screenshot: `1023:1867` is a393×1434 My Profile phone with Profile selected and a full Reviews list, visually corresponding to `/profile?view=reviews`. No Prototype transition was confirmed. No source/data change or test was made in this correction.


### Auth intermediate-width layout repair — 24.10.2026

- Manual Docker captures exposed a shared mobile CSS defect: at600px the form was83px wide and at720px it collapsed to0px because card padding used viewport width after the card was capped at393px. Changed the padding calculation to cap its input at the phone card width. On local Vite, Login/Register/Forgot were manually measured at320/393/394/500/600/720/721/768/1440: widths now268px at320,290px at393–720,627px from721; document width equals viewport on every capture. Login keyboard sequence at600 reaches Back, Email, Password, Forgot password and submit; no form was submitted. Matched per-route Figma screenshots are absent from the local archive, so no full frame parity claim.
- First `
npm run verify:build` exposed pre-existing TypeScript errors in current Profile additions: RetryNotice call sites omitted required styling, one optional className was not string-safe, and an overview label comparison was unreachable. Added a ProfileListCard alert style, supplied Profile settings alert classes, and localized navigation labels directly. Second `
npm run verify:build` passed TypeScript and Vite (229 modules).
- No Playwright tests/test files were written or run. No API, DB, `.env`, account data or Docker container changes. Figma MCP session for the exact Auth node was unavailable due reauthentication; current check used local implementation behavior and the existing frame mapping.


### Home guest feed and responsive rail follow-up — 24.10.2026

- Read live Figma phone frame `1411:3473`, its local full-size 393×2265 PNG export and archived raw hierarchy. Guest phone now renders new-film posters, feature card, review poster rail, popular review/list/reviewer sections and recent Journal in the frame order. The content stays sourced from existing APIs; nullable poster/avatar URLs keep fallbacks, reviewer counts render only when the current response supplies them, and the design’s static watched-total is omitted. New guest copy and More/register links have UK/EN translations.
- Manual Chrome viewport review at320/393/600/720/768/1024/1440 found no document overflow. At720–1024 the member poster rail previously widened the whole document; changing its overflow to an internal horizontal rail fixed the measured scroll width. Guest runtime comparison could not be completed because the available Chrome session stayed authenticated at both `localhost` and `127.0.0.1`; no logout or account mutation was attempted.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). No tests were written or run. No backend, API contract, DB, `.env`, or Docker container changed.


### Member Home phone frame follow-up — 24.10.2026

- Raw `1327:3210` anchors: Latest News title y726/card y775, Popular Reviews title y969, Popular Lists title y1760/card y1800, Recent News title y2074/card y2114×361×222. Authenticated Vite/Chromium preview at393 with ephemeral read-only API fixtures measured title/card positions y726/y775.4, y969.4, y1759.8/y1800.2 and y2074.2/y2115.6 with card361×222. No horizontal overflow at320 and393 px.
- Added the frame Recent News preview using the existing Journal API article and More link; member phone hides the reviewer/tag/watched panels absent from this frame. Both preview positions use API-backed article content. Local Journal database is empty, so production copy and poster imagery were not verified. `
npm run verify:build` passes TypeScript/Vite. No tests, DB mutations, Docker changes, or backend/API contract changes.

### Authenticated Public Following More sheet — 24.10.2026

- Read-only Chrome view `/en/users/7748?view=following` at393×852. Opened the populated row’s More sheet; visible actions are Follow, Block, Go to member and Done. Done receives initial focus; Tab wraps to Follow and Shift+Tab wraps to Done; Escape closes and returns focus to the More trigger. No follow/block action was selected. Content is test-like local data; evidence covers sheet layout and keyboard focus only.
- Viewport was restored to default. No tests, build, API/DB mutation or Docker action in this substep.


### Public Followers empty phone view — 24.10.2026

- Read-only Chrome capture at393×852 showed the phone toolbar and localized Followers empty message; heading at y122 and section at y123. `documentElement.scrollWidth` equaled `clientWidth` (378 CSS px; viewport includes the 15 px classic scrollbar). This is a local empty state only, with no matching Figma screenshot or populated/paginated response evidence.


### Public Following subtitle copy — 24.10.2026

- Compared Figma phone frame `1023:3020` directly in the open Figma Chrome canvas with local `/en/users/7748?view=following`. The frame places follower/following counts on the row's second line with English copy `{followers} followers, following {following}`. Updated `UserFollowRow` to use the same order with API-sourced counts and a separately localized Ukrainian phrase. No data or API contract changed.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). After restarting the stopped Vite process, Chrome EN393 rendered `1 follower, following 0`; UK393 rendered `Підписників: 1 · Підписок: 0` from the local API response. Values are test-like local data; no mutation was performed. Figma MCP session creation returned `UNAUTHORIZED`/reauthentication required; the visible live canvas and existing mapping supplied the reference instead.
- No tests were written or run. Docker and DB were not modified.
- Contract review confirms `/api/users/{id}/followers` and `/following` return identity-only `PublicUserResponse`; count values exist on protected `/follow-status`. The subtitle is shown only after that authorized request. Guest rows retain the handle, since adding per-row requests would be an N+1 pattern and no public-count contract was approved.


### PublicProfile source preview — 24.10.2026

- Used an isolated headless Chromium page against the current Vite source preview at `127.0.0.1:5173`; did not run the test runner or change application/backend data. UK PublicProfile overview `825:1378` at393 px measured H1 y317 and Favorites y591, matching the raw frame y317/y590 within1px. Widths320/393/600/720/768/1024/1440 had document width equal to viewport.
- Guest Following phone `1023:4597` source view had a display-name-only row and no fabricated count/handle. Across320/393/600/720 the row was288/361/568/672px wide, with 44px-high member and Follow links; desktop widths768/1024/1440 had 50px follow targets and no document overflow. UK/EN guest routes loaded.
- A transient DOM-only long-name stress inspection at320/393/600/720 wrapped the row name (row heights85/68/65/65px), preserved the44px Follow target and produced no horizontal overflow. This checks CSS layout only; the synthetic name did not verify a real API displayName or its computed accessible label. Page reloaded afterward, restoring original content.
- Keyboard Tab traversal at393 px reached bottom navigation, Back, member link and Follow, each with a visible computed outline; member/action controls were44px high. The long-name run did not persist and no mutation was made.
- The older `localhost:3000` Docker page showed a handle line that is absent from the current Vite source. Treat Docker as a stale visual build for this comparison; do not claim current source parity from that container until the final planned rebuild. Docker, DB, `.env`, API data and volumes were not changed.
- `
npm run verify:build` passed earlier in this worktree (TypeScript + Vite,229 modules). No tests were written or run. Figma MCP remains `UNAUTHORIZED`; the local archive lacks a PublicProfile/network PNG and focused subtree, so this evidence is geometry/runtime review, not exact screenshot parity.


### PublicProfile collection source review — 24.10.2026

- Opened `/uk/users/7748?view=collection&collection=watched` at393px: current API returned its real empty state; collection filter was expanded without any data mutation. Watchlist had one API-backed movie; its poster URL rendered the existing initial fallback, so this local item does not prove populated-poster parity with Figma.
- Phone filter is a localized horizontal `tablist`. ArrowRight from Watched selected Watchlist, preserved focus on the selected tab, and updated the URL to `collection=watchlist`. Width review at320/393/600/720/768/1024/1440 kept `documentElement.scrollWidth === innerWidth`; the selected collection remained URL-backed. Runtime data is test-like and its empty/populated composition differs by viewport/data, so frame content parity remains open.
- No API/DB change or tests. This extends the current-source Vite review; it does not update Docker or replace required authenticated own-Profile/settings checks.


### Desktop Profile network row — 24.10.2026

- Read raw Figma `363:411` subtree and selected matching live canvas. Text nodes confirm name 24px/27px and subtitle 18px/20px; avatar stack is80px with110px row pitch; follow action frame is50×50 with34×34 icon. Updated shared `profileNetwork` CSS to these measurements and preserved phone 40px avatars/44px targets.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). Chrome1440 visually inspected the updated populated public Following row. Own Profile Following is empty in the local DB; public fixture is test-like geometry evidence only.
- Reference metrics for Watched/Lists/Likes are absent from `PublicUserResponse`, so they remain unrendered. No tests, API/DB mutations or Docker rebuilds were performed.


### Profile network subtitle variants — 24.10.2026

- Reused the existing `getFollowStatus` response cached by `FollowActionsContext` for authenticated row counts; removed the component's second per-member request. Relationship retry refreshes the count state as well.
- Rows without an available authorized count now omit the secondary line instead of showing a username fallback. This matches the no-count phone variants `1023:4597`/`1033:5458`; the populated authenticated `1023:3020` variant keeps the localized count line. Failed status loads retain an accessible retry message.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). Manual Chrome1440 review showed the populated row and `1 follower, following 0` using local test-like data; no action was activated. Tests, API/DB mutations and Docker changes were not performed.
- Opened live Figma canvas `1023:4597` at 393×852: visible rows contain a display name only and separate More and Follow actions; adjacent `1033:5681` shows the member sheet. Figma MCP `create_session` again returned reauthentication-required. The local archive contains no saved network screenshot, so this visual read confirms structure/actions but not pixel-level matching.


### PublicProfile live-frame/source-data check — 24.10.2026

- Reopened live Chrome Figma at `825:1378`; frame dimensions are393×2355 and the visible profile identity uses a member photo plus the name “Jeremy B.”
- The isolated Vite source preview `/uk/users/7748` loaded local API data with a generated test display name and `avatarUrl: null`, so `ResilientImage` correctly showed the initial-letter fallback. This identity cannot verify reference photo crop, actual API avatar rendering, or the long-name case.
- No app/API/DB mutations, tests or Docker rebuild. Keep avatar crop and long-name behavior as open checks until a stable profile fixture includes a real avatar URL; overall Figma parity remains unclaimed.


### Global Search phone All grid correction — 24.10.2026

- Live Figma `1480:8934` is a393×2801 frame. Existing raw/Chrome mapping sets the search hero end at y187, query input at y120, match row at y221, and four 79×116 poster slots at y267.
- Corrected the mobile All variant from the previous 100×149 horizontal carousel to a four-column grid. Manual Vite/Chromium captures at320/393/600/720/768/1024/1440 showed `scrollWidth === viewport width`; at393 poster bounds were x16/110/204/298, y267.3, 79×116. Local API result names/posters are test-like or unavailable, so this verifies layout only.
- `
npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/DB mutations, Docker rebuild, commit or push.


### Shared Header/Footer manual capture — 24.10.2026

Manual Vite/Chromium EN1440 capture of `/en/home` compared against live Figma `251:612` and `251:625`: header height106px, logo x323.5/y33/184×30, nav x582.5/y26/412×44, search x1069.5/y26/47×44. Footer top x0/y3460.3; logo x143/y3523.3, social icons centered around x657/708/758 at relative y133, copyright x120 at relative y191. Account disclosure opened by Enter (`aria-expanded=true`); Escape closed it and restored focus to its trigger. Existing width captures at320/393/600/720/768/1024/1440 had no horizontal overflow. These are base desktop geometry/keyboard checks only; complete responsive/footer variants and exact vector/font parity remain open. No source changes or tests in this pass; Vite preview was stopped afterward.


### Shared navigation responsive widths — 24.10.2026

Read-only manual Chromium captures of `/en/help`, `/en/login`, and `/en/journal` at320/393/600/720/768/1024/1440 showed no horizontal document overflow on the loaded routes. On Help, footer height adapts from359px at320,303px at393,287px at600/720,256px at768, and265px at1024/1440 as its links wrap. On Login, footer is hidden through720px and visible from768px, matching its current route-specific CSS. Header switches from the64px mobile shell through720px to106px desktop/tablet shell at768px. Journal had no overflow where loaded, but its API content remained empty in this local session, so its footer position/content was not treated as visual proof. No code or test files changed; no tests were run.


### Own Profile phone alignment — 24.10.2026

Compared the saved frame PNG `896:1838` with an authenticated local Vite source preview using the existing browser session. The raw node landmarks are avatar x136/y190 at120×120, identity y317, metrics y427, content surface y496, tabs `896:2051` y531, and Favorite Films heading y606. The mobile CSS now sets the hero stage and metrics rhythm to those positions; current capture measured avatar x136.5/y190, identity y317, metrics y427, hero bottom y496, tabs y531, heading y607. Read-only width captures at320/393/600/720/721/768/1024/1440 had no horizontal overflow. Profile actions opened with Enter; Escape closed the menu and returned focus to its trigger. Local API content differs from the populated design frame and uses the existing initials fallback; unsupported bio/location and Figma-only counts were not fabricated. `
npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/DB changes, or Docker rebuild.


### Own Following phone reference review — 24.10.2026

Re-read live Figma frames `1023:3020` and `1023:4597` and their local raw nodes. Both are393×852: centered `Following` title x165/y59/62×17, back/filter controls x16/x342 at y50/35×35, network content beginning y123, fixed bottom navigation y760×92. `1023:3020` includes relationship-count subtitles and `1023:4597` omits them. The authenticated local API currently has no Following rows, so it cannot verify populated row layout; existing code keeps the empty state and real API contract. No data was added or mutated, and no tests/Docker actions were run.


### Auth phone frame geometry — 24.10.2026

EN source-preview captures at393px manually compared with Figma Login `944:1582`, Register `944:1828`, and Forgot `944:1887`. Login landmarks: title y169, inputs y364/438 at290×45, Forgot y494, CTA y538 at290×56, social y670, footer y740. Register: two-line EN title y101, fields y290/364/438, CTA y538, social y670, footer y738. Forgot: title y351, description y392, input y464, CTA y539, divider y713, create link y740. Main landmarks are within about1px. Shorter UK Register title correctly fits one line and moves following controls upward. Login keyboard traversal reaches Back, both fields, Forgot, submit, and account link with visible focus. This is manual geometry/keyboard evidence, not a screenshot diff or test. The password-eye action is confirmed in the live Figma frame and implemented with accessible UK/EN labels; exact SVG/vector parity with Figma remains unverified because no local glyph export is available. Desktop, reset/error/loading/success variants remain open. No tests or data were changed.

Follow-up from the live frame: accessible show/hide password controls are implemented on Login and Register. `
npm run verify:build` passed TypeScript/Vite; manual Chromium 393×852 confirmed the eye control inside the password input, keyboard reachability, and no horizontal overflow. The Login frame also has Remember me, but current backend always issues persistent cookies and has no session-only preference across refresh. Repository `AGENTS.md` says not to change backend contracts solely to imitate a frame, so no inert checkbox or backend migration is included. Earlier temporary Remember-me code was removed before any API request, DB change, or Docker update. Tests remain deferred.


### Forgot Password geometry follow-up — 24.10.2026

Manual source-preview screenshots at393×852 and1440px confirm the decorative lock and return controls are present and the phone layout has no horizontal overflow. At393px the lock is89×102 at x150/y213 by manual comparison with the live Figma frame; CSS was shifted2px left to align its center with the frame. Back is30×30 at x32/y52; title y351, description y392, email x52/y464 at290×45, submit y539 at290×56, divider y713 and create link y740. Desktop screenshot confirms the centered lock and desktop return control; full desktop content extends below this capture viewport. Figma node mapping is corrected in `FIGMA_HANDOFF`: Register/Forgot/Login/create-account nodes are distinguished, and `915:1774` is a reset button component rather than a full Reset page frame. `
npm run verify:build` passed after this 2px CSS-only adjustment (typecheck + Vite, 229 modules). No tests, Docker, API or data changes.



### Lists catalog API/design audit — 24.10.2026

Read-only Figma PNG/raw 1480:4983 comparison found that design order is Featured → Popular this week → Recently liked → Crew lists → Popular tags. Runtime shows Featured → Popular → Recently liked → Recent → tags. The existing /team endpoint returns public lists by active HQ users and currently supplies Featured; there is no separate curated Featured or Crew contract. No UI/API change made because relabeling Recent or duplicating /team would invent semantics. The user approved preserving current feeds and documenting this design/API gap. Tests deferred; no API/data/Docker changes.

Movie Details mobile frame `560:1003`: source-preview Chrome at 393 px shows two API-backed Recent Reviews cards and a localized `All reviews` control. Expanding it reveals remaining items from the current API page plus its pagination; collapsing restores the two-card preview. Mouse and Enter keyboard interaction were checked, including accessible expanded/collapsed state. Code also shows the control when a page has only two cards but API pagination has more pages; that exact data shape was not available in the local fixture. This keeps the existing API contract and real content; the local initials avatar is used because the review response has no avatar URL. `
npm run verify:build` passed after the conditional edge-case adjustment; manual mobile render and interaction were inspected. Tests remain deferred; no data/API/Docker changes.

Person poster ratio correction, 24.10.2026: decoded local raw nodes `545:707` and `725:1097` confirm desktop174×260/radius20 and phone79×116/radius10. This checkpoint is superseded by the later Person phone/desktop frame review. No tests, API/data/Docker changes.

Own Profile phone collection review, 24.10.2026: Figma canvas nodes `1015:3356` (Wants to see), `1015:4508` (Liked), and `1017:1841` (Lists) were read alongside local raw. In the authenticated Vite source preview, the 393 CSS-pixel canvas uses the exact shared hero landmarks: bottom y496, nav y531, collection section heading y608; the first Lists card is x16/y647/361×189 versus raw x16/y646/361×189. The current account has no Watchlist entries, one Favorite, and system Lists; populated Figma content therefore remains an API data variance. At a 393-wide viewport with the Windows classic scrollbar, `window.innerWidth=393` but layout `clientWidth=378`; previous `100vw` hero overflowed by15px. Changed mobile Profile hero sizing to include the page padding without `100vw`; the desktop full-bleed canvas keeps its full viewport composition while clipping at the layout edge. Read-only responsive checks found `scrollWidth === clientWidth` at CSS widths320/393/600/720/768/1024/1440. `
npm run verify:build` PASS. No tests, API/data/Docker mutations, or commits.

Own Profile Reviews phone `1023:1867` follow-up, 24.10.2026: local source preview at393 CSS px shows heading y607 (raw y606) and the first review card x16/y647/361×208 (raw x16/y646/361×208). The local API returns one review, while the frame shows a second card; no review content was fabricated. This checks one populated geometry only; empty/error/retry and other review counts remain open. No tests or API/data changes.

Own Profile desktop hero `238:865` follow-up, 24.10.2026: live Figma canvas at16% showed a centered vertical avatar/name/metrics stack. The source preview at a1440px layout viewport previously placed flex children in one row; `.hero` now stacks them. Chrome measured the initials avatar x588/y274/265×265 versus raw frame x587/y274; phone content width393 retains avatar x137/y190, identity y317, metrics y427 and hero bottom y496. Read-only responsive viewport pass at320/393/600/720/768/1024/1440 reported no document horizontal overflow. A live screenshot of `1023:4597` at84% showed about65px row pitch; restored/retained the matching65px CSS after rejecting a stale handoff note claiming80px. `
npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/data/Docker changes.

Profile Settings phone `1043:2125` follow-up, 24.10.2026: live Figma frame is393×1905. Source preview at a393px content width shows the settings title centered at y≈107, profile section interior x34/w325, and Avatar preview x34/y756/325×158. The username/display-name rows now have45px minimum pitch matching the handoff measurement; local email wraps within its read-only field. At320px content width the field interior is252px and the Avatar panel remains158px high; document width equals viewport content width at both sizes. The frame includes bio/location/pronoun/reply and upload/OAuth controls without current API contracts; they remain documented gaps. `
npm run verify:build` passed TypeScript and Vite (229 modules). No tests/API/data/Docker changes.

24.10.2026 Settings phone toolbar: localized Cancel / Settings / Save controls target only the active existing form; Profile Save changes display name only. Avatar and social links retain separate save actions. `
npm run verify:build` passed (TypeScript + Vite, 229 modules). Tests and Docker smoke remain deferred per active redesign plan.
Manual Settings source preview (Vite): at393 and320 CSS px the toolbar title centers near y107, content starts at y147, and document scrollWidth equals clientWidth. At320 the labels scale to14px with visible gaps. Local profile content used read-only; no form was submitted. Final TypeScript/Vite build passed (229 modules); no tests were run.


### Global Search Films phone manual review — 24.10.2026

Local Figma PNG/raw for `1480:8594` compared with a Vite preview using a real local API response (`q=the`, six films). At393px the first poster row is x16/110/204/298, y267, 79×116; second row begins y402. Category Select is x217/y222/160×32, and a keyboard ArrowDown changed `films` to `users` and updated the URL while keeping focus. EN/UK labels were checked. Read-only widths320/393/600/720/768/1024/1440 all had `scrollWidth === clientWidth`; at320 poster slots scale to60.8×89.2, while desktop1440 has six 174.2×260.2 columns. API titles/posters differ from the static Dune design data, so this confirms layout and behavior only. No source changes, tests, build, Docker, API mutations or DB changes in this pass.


### Global Search Lists phone manual review — 24.10.2026

Local raw frame `1480:8804` defines a results group at x16/y267/361×402 with two361×189 cards at y267 and480, 24 px vertical gap. Each card has a322×116 five-poster preview (79×116 items offset61px). Vite source preview on local API data measured card rectangles x16/y267/361×189.25 and x16/y480.25/361×189.25; preview is325×116.7. The API returned one preview film per list, so only the real poster renders. Keyboard focus followed by Enter opened `/en/lists/public/10434`, showing its API title and no overflow. Widths320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The local archive has no Search Lists frame PNG and Figma MCP session creation returned UNAUTHORIZED/re-authentication required; five-poster visual comparison remains open. No source changes, tests, build, Docker, API mutations or DB changes.


### Global Search Tags phone manual review — 24.10.2026

Local raw `1480:8767` gives a361×32 search input at x16/y120, match rail x16/y222, and tag rows beginning y267; seven Figma pills have31px height and wrap across three design rows. Vite preview used the real API query `e2e` (four long `e2e-tag-*` results): pills measure146.8×31 and wrap into two rows at393px/four rows at320px. EN/UK category text was inspected; a focused tag activated with Enter and loaded its localized public-list route. Widths320/393/600/720/768/1024/1440 had no horizontal overflow. The source archive has no Tags frame PNG and Figma MCP returned re-authentication required; different API text explains the row-count difference, and screenshot parity remains open. No source changes, tests, build, Docker, API mutations or DB changes.
PublicProfile source preview: `
npm run verify:build` passed (TypeScript + Vite, 229 modules). Manual overview and populated Following widths320/393/600/720/768/1024/1440: document `scrollWidth` equals `clientWidth` after retaining full-bleed hero and clipping page overflow. At393 the one real local Following row is x16/y123/346×65. Public Followers remains empty in this local API account, so populated pagination is not evidenced. No tests or Docker changes.


### PublicProfile desktop canvas review — 24.10.2026

Live Figma canvas `238:596` was inspected alongside the Vite/Chromium preview at1440px. Runtime anchors: hero1440×1020; centered avatar/fallback x587.5/y274/265×265; profile navigation x120/y1105/1200×79; first content rail x120/y1269/1200px. Hero, centered identity/metrics, full-width navigation and section sequence visually match the frame structure. Responsive read-only capture at320/393/600/720/768/1024/1440 retains `scrollWidth === clientWidth`. The local API has no profile avatar/favorite posters and returns test-like activity; image and populated-content parity remain unverified. No focused desktop subtree/PNG exists, so this is a visual composition review, not a pixel-perfect claim. No code, API, DB, Docker or tests changed.


### PublicProfile populated Followers row — 24.10.2026

Read-only API lookup found one existing public network relation: user7749 has follower7748. At393px the guest `?view=followers` row measures x16/y123/361×65, with40px avatar and44px follow target; at1440px it measures x120/y1421/1200×110, with80px avatar and50px action. Width review320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The API page has one record, so pagination is not evidenced. The local Chrome session is a guest (`GET /api/users/me` returned401); authenticated own-profile variants remain inaccessible in this session. No login, data mutation, source change, build, test or Docker action was performed.

Journal desktop hero follow-up, 24.10.2026: Reopened live Figma frame `1494:5387` (1440×3561) and current Vite source at1440px. UK pill measured x120/y132/147×42; the content rail begins x120/y212 and spans1200px. Responsive source review at320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The local API returns zero articles and zero archive entries, so this evidence covers the title, shell, empty state and rail start only; populated feature/card imagery and row rhythm remain open. No code, API, data, Docker or test changes.


### ReviewDetails desktop composition — 24.10.2026

Frame `1480:6826` follows the mapped desktop hero: poster275×411 at x120/y538, title58px at x450/y601, action card251×170 at x1069/y653, and copy in a581px column. Follow-up corrected the liked-members section to its raw landmarks: surface y1215, divider y1300, heading y1318, avatars80×80 at y1400 with86px pitch, footer y1640. poster/action radii and trailer sizing were aligned too. Phone/tablet rules were not changed. Manual geometry review at1440 and no-overflow review at320/393/600/720/768/1024; `
npm run verify:build` passed (TypeScript + Vite,229 modules). Local API content is test-like and poster/backdrop URLs are null, so evidence covers structure/layout only. Empty-liker state and populated production imagery remain open. No tests, API/data/Docker changes.


### ReviewDetails phone populated composition — 24.10.2026

Compared frame `1480:9249` with a browser-only fixture built from the local Figma text and metadata. Before adjustment the author and review copy were5px low and the liked-members section was32px low; a hard-coded grid row was creating excess vertical track space. Removed that explicit row, tightened the mobile metadata-to-author spacing and moved the liker rail into the content flow. At393×932, author is x156/y323, review copy x156/y351.5, trailer x16/y434/120×30, liked surface y678.7, heading x16/y721.7, and first avatar x16/y762.4/40×40, matching the Figma anchors within1px. The liker row's side padding no longer offsets the avatars; its keyboard focus outline remains visible. Manual source review at320/393/600/720/768/1024/1440 found no horizontal overflow. The intercepted fixture did not change app data. `
npm run verify:build` PASS (typecheck + Vite,229 modules); tests, API, Docker and database were not changed in this pass. API-backed empty-liker state was reviewed 24.10.2026; populated production imagery/content remains open.


### Home guest phone feed follow-up — 24.10.2026

Clean guest source-preview capture was compared with Figma `1411:3473`. At393px, Popular Reviews starts at y993 and the single visible API-backed review card is x16/y1033.5/361×168; Popular Lists starts at y1244.5. Recent News starts at y1891.7 while the local Journal API is empty (raw frame y1876), so that lower section's populated geometry remains unverified. The phone guest feed now shows one review card; desktop and authenticated member layout remain unchanged. Manual Chromium widths320/393/600/680/681/720/768/1024/1440 had no horizontal overflow; UK route opened. `
npm run verify:build` passed (TypeScript + Vite, 229 modules). No tests, Docker/API/DB changes.


### Own Profile network mobile empty state — 24.10.2026

Live canvas frame `1023:3020` is the populated own Following variant at393×852: its first rows begin y123, the Back/filter visuals are35px circles, and fixed bottom navigation begins y760/h92. On the authenticated local account, `/uk/profile?view=followers` returns zero rows. Current-source preview at393px measured the empty message x16/y123/361×23, Back target x16/y50/44×44, and navigation x0/y760/393×92; the same route in English at320px had empty message x16/y123/288×23.2. Both widths had `scrollWidth === clientWidth`; Back keyboard focus shows a visible outline. Mobile Films/network toolbar now paints the Figma-sized35px circles inside44px hit targets; filter button remains operable and exposes the existing collection tabs. `
npm run verify:build` PASS (TypeScript + Vite,229 modules). No tests were run, and no API/database records or Docker state changed. The account has0 Followers, so populated own follower rows/pagination remain unverified.


**User Lists phone populated rail — 24.10.2026.** Frame `1480:9606` підтверджує 79×116 posters, 161px row pitch та 36px remove/reorder actions; на393px runtime bounds: rail x34, row343×116, poster79×116, action group78px. На320px row лишається у viewport без horizontal overflow. Mobile reorder handle підтримує ArrowUp/ArrowDown і викликає чинний reorder endpoint; ручний огляд на ephemeral API fixture не змінював БД. Live Figma Prototype inspector для frame не містить заданих interactions, тож metadata sheet trigger не встановлений.

npm run verify:build` PASS; жодні тести не запускалися.

### Global Search filter target — 24.10.2026

- Source: local read-only Figma raw frame `1480:8934` and its 393×2801 PNG. Back and Filter background layers measure35×35px at y50; UI controls retain44×44px target areas.
- Change: mobile Filter background now paints a35px circle and positions the icon toward the trailing edge within its existing44px button. Keyboard focus outline and native category-select focus behavior remain in the same control.
- Verification: `
npm run verify:build` PASS after the final CSS change (TypeScript and Vite; 229 modules). The background center and icon align the raw x342 layer inside the44px target ending at x377. GitHub CI [40105193195](https://github.com/anton5267/rewind-letterboxd/actions/runs/40105193195) passed on code commit `44f5917`; previous runs [40104770248](https://github.com/anton5267/rewind-letterboxd/actions/runs/40104770248) and [40104926102](https://github.com/anton5267/rewind-letterboxd/actions/runs/40104926102) also passed. The available browser was at desktop width, where the mobile control is hidden, so a Chrome mobile screenshot remains pending. Figma MCP connection currently requires reauthentication. No local tests run for this update.


### Person phone hit targets — 24.10.2026

The decoded local raw anchors for phone frame `721:1085` remain avatar y190, H1 y317, divider y534 and posters y582. Increased the mobile Back and Filter hit areas from36×36 to44×44 while preserving35×35 painted controls and matching x16 rails at320px; the toolbar height increase is offset so the vertical composition does not move. Manual Vite/Chromium preview at320/393 with a temporary intercepted API fixture measured Back x16/y14/44×44, Filter x260/y14/44×44 at320 and x333/y14/44×44 at393; title y317 and section heading y542 at both sizes. `scrollWidth === clientWidth`, visible focus outline is3px. `
npm run verify:build` PASS (TypeScript + Vite,229 modules). No tests, Docker/API/DB changes. The fixture did not modify application data.


### PublicProfile maximum display name wrap — 24.10.2026

Using a read-only fixture based on local `/api/users/7748/profile`, set display name to57 characters (the own Profile form allows up to60). Manual Vite/Chromium source preview at320/393/600/720/768/1024/1440 confirmed wrapping, no document overflow and natural hero/metrics growth. At320: avatar x100/y190/120×120, H1 x16/y317/288×112, metrics y477; at393: avatar x136.5/y190/120×120, H1 x16/y317/361×84, metrics y449; at1440: avatar x587.5/y274/265×265 and H1 y551. The API's `avatarUrl` is null, so the existing fallback was reviewed and reference photo crop remains open. No application data changed, no tests were run.


### Public Following retry state — 24.10.2026

Intercepted only the first GET `/api/users/7748/following` as503, then allowed retry to reach the local API. At EN320 the visible alert/retry rendered without overflow and the button measured44px high; at UK393 it also measured44px. On EN393 keyboard traversal reached Retry after7 Tabs, displayed a3px cyan outline, and Enter repeated the request; the alert cleared and the single real API network row rendered. No API mutation occurred. This is a manual interaction review, not a test run; `
npm run verify:build` also passed after the shared `RetryButton.module.css` min-height change.


### Global Search error/retry state — 24.10.2026

Intercepted only the first GET `/api/search/global` as503 at EN320 and UK393, then let Retry reach the local API. The localized alert contained a44px Retry button and the page had no horizontal overflow. Keyboard traversal reached Retry after12 Tabs; focus outline was3px. Enter repeated the GET; the alert cleared, and the successful empty result state hid the query form and restored the localized category prompt. No app data changed; this was a manual browser review, not a test run.

A delayed read-only `/api/search/global` response was also reviewed at EN320/UK393. While pending, localized search status was visible, both `<main>` and results panel had `aria-busy=true`, and document width matched viewport; after the live response completed, the page reached the empty state without an alert. No API records were changed.


### Global Search category keyboard navigation — 24.10.2026

With a read-only API fixture containing one film, desktop1440 showed the roving tablist on focus with a3px outline. ArrowRight moved focus and `aria-selected` from All to Films and changed the URL to `?q=film&tab=films`; Tab moved into the associated `tabpanel`. At320/393px, the desktop tablist is replaced by the native 160×32 category selector; selecting Films preserves the query and updates the same tab parameter. Checked 320/393/600/720/768/1024/1440 viewports kept `scrollWidth === innerWidth`. The fixture was intercepted in Chromium; no data mutation or test suite.


### Review Details More hit target — 24.10.2026

The authenticated mobile `More` control on `/uk/reviews/1` now has a44×44px hit target with the original35×35px painted circle centered at the same Figma coordinates: x342/y50 at393px and x269/y50 at320px. Chromium source preview measured a3px visible keyboard outline. Opening the existing RatingSheet retained the raw-frame geometry at393×852 (sheet x16/y489/361×328, Done x16/y761/361×56) and320×852 (sheet x16/y489/288×328, Done x16/y761/288×56); document width matched the viewport. Review/auth/rating data were intercepted in-browser; no application data changed. `
npm run verify:build` passed (TypeScript and Vite,229 modules). Manual review only; test suites remain deferred.


### Home member retry announcement — 24.10.2026

Manual read-only Chromium review of `/uk/home` at393×852 showed a duplicate assertive alert when the newest-films request failed: one page-level alert and one section-level alert. Section `RetryNotice` now allows its live role to be omitted; Home keeps the global alert while its local error message and Retry button remain in the reading order. Recheck with an intercepted one-time503 showed exactly one `role="alert"`, both retry buttons, 3px focus outline, Enter recovery to zero alerts and `<main aria-busy="false">`, with no horizontal overflow. Loading snapshots also confirmed guest EN320/UK393 and member UK393 localized status while the main region was busy. No app data changed, no test suite ran. `
npm run verify:build` passed after the component change.


### Home guest intermediate-width responsive correction — 24.10.2026

Manual Chromium review found the guest Home title could overlap the fixed mobile navigation at681–720px. Added a height-aware hero top-padding rule for this interval. At681×900 and720×852 the full title ends above the bottom bar; at721×852 the desktop navigation is active and the prior desktop hero behavior remains. TypeScript and Vite production build passed (`
npm run verify:build`). No tests or Docker update were run; final regression is still pending.


### Public Lists source preview correction — 24.10.2026

Rechecked phone frame `1480:8280` in the view-only Figma browser and current Vite source at CSS layout width393 (Chrome viewport408 to account for its15px classic scrollbar). Runtime hero is250px and Featured begins y284, matching raw y249.1/y284.1 within1px. Docker inspection confirmed the web image was created at2026-10-24 10:00:31Z, before PublicLists CSS commit `b1df8f4` at2026-10-24 16:02:18+02:00; the earlier270px/304px measurement came from that pre-change image and is superseded. `/team` still returns no Featured lists, so populated content and following vertical rhythm remain unverified. Current Popular posters are150px at x16/228 versus reference x15/226.5, and the horizontal card rail exposes a scrollbar. Desktop Vite measurement reproduces the documented shell/intro/CTA deltas. Figma canvas is readable in Chrome, while the MCP connector remains `UNAUTHORIZED`; no code changed and no tests were run.


### Public Lists desktop alignment correction — 24.10.2026

Read-only local Figma frame `1480:4983` records a1200px rail centered at x120, a569px hero intro, and a275×59 CTA. The runtime CSS now uses viewport-based centering at widths≥1230px to compensate for classic scrollbars, constrains the intro and CTA to those frame dimensions, and preserves the existing responsive rules below that breakpoint. The breakpoint leaves the shell within the content viewport on narrower widths. `
npm run verify:build` passed (TypeScript and Vite,229 modules). The Figma MCP session and identity calls both currently return `Unknown tool`; no fresh browser geometry review was possible in this pass. Featured feed remains empty locally. No tests, API/database mutations or Docker rebuild were performed.


### Global Search Users desktop — 24.10.2026

Live Figma frame `1480:7390` (1440×1392) shows a single column of full-width member rows: approximately120px card height,80px avatars, and38px row gaps. Updated the desktop CSS and manually reviewed the local Chromium page with live API rows; the first three visible rows match the frame's stacked geometry. API users have null avatars, so fallback image styling was checked. `
npm run verify:build` passed (TypeScript + Vite,229 modules). Mobile styles were left in place. No tests, data/API mutations, or Docker rebuild.


### Global Search Reviews desktop — 24.10.2026

Compared Figma frame `1480:7311` (1440×2176) with the current Chromium Reviews route. Both use a full-width one-column review list, a left poster slot, a roughly315px card height, and38px gaps; the implementation has a175px poster column and40px text separation. The sample review titles and images differ because the page renders live API records and fallback slots. This confirms layout structure only. No code/data change and no test run.


### Global Search All desktop variant — 24.10.2026

Figma desktop frame `1480:6991` (1440×2281) shows six film slots, three review cards and `Show more results`. The Prototype panel exposes `On click → Navigate to` the adjacent expanded `Search Results "all"` frame. The current source route mirrors that transition using the existing `/api/search/global` size parameter: size6 initially; size12 after the CTA. Manual read-only Chrome preview at `/en/search?q=e` showed six films/three reviews and the CTA before expansion, then other categories and twelve review rows after expansion. Mouse and Enter activation both work. Focus moves to the first revealed Users section; a fresh screenshot showed it scrolled into view with a visible outline. Responsive check: at1024px the preview and CTA appear; at1023px all categories render with the CTA hidden. Neither viewport overflows. Phone frame `1480:8934` was checked in EN at320/393px and UK at393px: no horizontal overflow, CTA hidden, and 393px poster slots x16/110/204/298 at y267, each79×116, matching raw geometry. At320 the cards are60.75×89.19 and remain in the viewport. `
npm run verify:build` passed (TypeScript and Vite, 229 modules). No tests or data-changing actions were run. The endpoint still requests page0 and caps size at12; other widths/states and further pagination remain open. Figma file-tools returned `Unknown tool`, so the interaction was verified in the browser canvas.


### Auth desktop Login/Register visual review — 24.10.2026

Compared Figma `605:2175` Login and `605:2176` Register (both1440px wide) with the current UK Vite routes in Chromium. The centered1200px rail, form panel and field widths follow the frames. The reference includes Google sign-in on both forms and `Remember me` on Login. No OAuth endpoint/flow or session-only cookie contract exists, so these controls remain omitted. Password-eye interaction is implemented. No form was submitted, no app data changed, and no tests were run.


### Auth nonfunctional provider decoration cleanup — 24.10.2026

Removed the aria-hidden “Sign in with G” display from Login/Register, along with its unused CSS and UK/EN copy; it had no click target or OAuth API. This leaves only supported email/password auth actions and the existing password-eye control. Manual Chromium review of UK Login and Register at393px showed the forms and footer without the provider decoration; responsive measurements at320/393/600/720/721/768/1440 reported no horizontal overflow. `
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests were written or run and no form was submitted. The Figma provider controls remain an API gap; current Figma MCP `create_session` still returns `Unknown tool`, so no fresh node screenshot was available for this pass.


### Reset Password no-token state — 24.10.2026

Manual Chromium review of `/en/reset-password` and `/uk/reset-password` without a token confirmed the localized alert and return-to-login link; the password form is absent until a token exists. At320/393/600/720/768/1440px both routes had no horizontal overflow. No full-page Reset Password Figma frame is available in the inventory; the reset-button node alone does not establish page parity. No token/form was submitted and no tests were run.


### Movie Details phone frame with local API data — 24.10.2026

Reopened the read-only local `560:1003` Movie Details phone reference and compared it with `/uk/films/3940` in a393×1908 source-preview viewport. The poster fallback slot is x16/y245/120×180, matching Figma. Figma section anchors: Rating y534, Cast & Crew y624, Recent Reviews y818, Similar Films y1287, Storyline y1519. Runtime now matches Rating y534 and retains Cast & Crew/Storyline sections with localized empty messages when API cast/shortPlot are absent. UK at393: Cast & Crew y633, Reviews y795, Similar Films y1192, Storyline y1324; those downstream differences follow the API record's empty cast/external ratings/similarMovies/null shortPlot and one review instead of two. No static sample content was added. Toolbar paint matches the frame's35×35 circles at x16/y50 and x342/y50 while retaining44×44 hit areas at x11.5/y45.5 and x337.5/y45.5; Tab shows a3px focus outline. At600px the prior38px toolbar control remains. Browser reports document width393 and height2337 at1908px viewport height. Chromium source-preview review in UK/EN at320/393/600/720/768/1024/1440 found document width equal to the viewport at every size.
npm run verify:build` passes. No data/API changes or tests.


### Review Details empty-liker state — 24.10.2026

Compared the local phone reference `1480:9249` with `/uk/reviews/3651`. Read-only `GET /api/reviews/3651` returns `likes: 0` and `likedBy: []`; the page renders the localized heading/count and empty message without placeholder avatars. EN and UK routes were manually reviewed at content widths320/393/600/720/768/1024/1440; each had no horizontal overflow. The Figma frame is populated, so this verifies the API empty state and responsive behavior, not populated user/avatar parity. No API/data mutation and no tests.


### PublicProfile Watchlist poster slot — 24.10.2026

Raw phone frame `861:1474` places its first poster at x16/y123 and sizes it79×116. Current Vite `/uk/users/7748?view=collection&collection=watchlist` renders the one real API film's fallback slot at the same x/y/size on393px; the local record has no poster URL. This verifies the poster container and fallback, not reference artwork. No data mutation, source change or test.


### Own Profile Reviews desktop identity — 24.10.2026

Desktop Figma `363:289` remains the confirmed own Reviews frame. The 25.10 interpretation of `1023:1867` as a Recent Reviews preview was superseded by the 26.10 current-canvas screenshot, which shows Profile selected and the full Reviews list. The prior responsive, anchor and overflow measurements remain source evidence; the latest entry records the corrected route mapping.


### Own Profile Lists phone — 24.10.2026

Read-only raw frame `1017:1841` contains three list cards sized361×189. Current Vite `/en/profile?view=lists` at393px puts the first card at x16/y647/361×189. `/uk/profile?view=lists` at320px puts it at x16/y648/288×189; `documentElement.scrollWidth` matches the viewport in both. The local API returns system lists, not the populated custom-list examples in Figma, and has no profile bio field. No mock data was added, no API/data mutation or test was performed.


### PublicProfile Following guest phone and keyboard — 24.10.2026

Live/raw phone frame `1023:4597` has network rows beginning y123 and fixed bottom navigation at y760. Current `/uk/users/7748?view=following` renders one API-backed guest row at x16/y123/361×65 on393px and288×65 on320px. Responsive widths320/393/600/720/768/1024/1440 have no horizontal overflow; 768px switches to the desktop hero/list layout. Keyboard focus on the member link and Follow link shows a2px outline with3px offset; guest Follow targets the existing Login route. No follow action or API mutation was performed. The local account fallback avatar and generated user label differ from Figma sample content.

Mobile row alignment follow-up, 25.10.2026: the shared row component displayed API relationship counts below the PublicProfile name, although phone frame `1023:4597` has no subtitle. Added a row-level presentation flag so only PublicProfile Following/Followers rows hide that subtitle at720px and below; own Profile keeps the count line shown in `1023:3020`, and desktop behavior is unchanged. A read-only API GET confirmed user7749 has one real follower; no record was modified. Source preview at393×852 shows row x16/y123/361×65, member link309×44 and Follow target x333/y123/44×44; at320×800 the row is x16/y123/288×65, with236×44 member link and44×44 Follow target. In both viewports `documentElement.scrollWidth` equals the viewport and no secondary text spans are visible; screenshot confirms the row visually.
npm run verify:build` passed TypeScript and Vite (229 modules). No automated tests ran.


### Profile Settings Favorites removal — 24.10.2026

Mobile Settings frame `1043:2125` contains remove marks on its four favorite posters. Added `DELETE /movies/{id}/favorite` controls to the existing API-backed preview; successful removal filters the preview, decrements the displayed profile favorite count, announces a localized status, and restores focus to the next poster or section heading. Button target is44×44. UK/EN copy added. `
npm run verify:build` passed TypeScript and Vite (229 modules). Chromium review at393px and320px confirms the control is visible and44×44, the document has no horizontal overflow, and keyboard focus shows an outline. The action was not activated to preserve account data; no Playwright/test suite ran and no live favorite was removed. Loading/error retry and other settings variants remain open.


### Profile Settings mobile navigation — 24.10.2026

Live Figma phone frames `1043:2125` and `1043:2233` use their own top toolbar and show no global five-item bottom navigation. Added a route-specific mobile header class and hid only that bottom rail for supported `/profile?settings=…` routes; the normal own-profile route keeps its bottom navigation. Reduced Settings-only mobile bottom padding to24px plus safe-area inset. Current-source Vite/Chromium review of Profile, Authentication, Avatar and Social links at393px/320px confirms no app-nav overlap and document scroll width equals viewport width. The Avatar URL and Website fields show keyboard focus; Favorites remove is44×44 with a visible focus ring. TypeScript and Vite build passed (
npm run verify:build`,229 modules). `1043:2233` visibly lists read-only email and Account password; direct selection of text child `1043:2298` in Prototype shows no assigned interaction. Existing password-change route/API remains intact; no extra transition was invented. No tests run, no settings submitted, no account mutations.

Profile Settings desktop Avatar follow-up (24.10.2026): live Figma frame `251:660` is1440×3120. The current-source Vite preview at1440px has a1200×543 Avatar panel and265×265 centered avatar slot; raw rail starts x120, runtime x112.5 due to Chromium's15px classic scrollbar. Local API returns `avatarUrl: null`, so initials fallback is expected. Figma Banner/file upload actions have no matching API contract. This verifies the Avatar panel geometry only, not full-frame parity. No account mutation, tests or Docker rebuild.



### Own Profile Following phone toolbar — 24.10.2026

Live Figma frame `1023:3020` is393×852 and shows back/title/filter controls at y50, with the first network row at y123. The selected frame has no assigned Prototype interaction; current network endpoints expose paginated rows only. Added the matching sliders glyph to the existing right-side44×44 toolbar slot as an aria-hidden decoration, retaining the Figma35px painted circle and adding no unsupported filter behavior.

npm run verify:build` passed (TypeScript + Vite,229 modules). The local authenticated Following list is empty; no account/API mutations or tests were run.


### Admin dashboard navigation — 24.10.2026

Live Figma frame `1178:2466` is1440×2669. At29% canvas zoom, the selected Dashboard shows its identity hero, a prototype-connected admin icon rail, three top metric cards, a separate Key Metrics group, then the footer. The prototype wires the rail to separate admin workspace frames. Updated `/admin` to show the dashboard alone by default, with API-backed `?view=` navigation for each existing admin workspace; all modules and existing API mutations remain available. The current dashboard API exposes six count fields, while the frame has additional watched/rating/list/likes/session/engagement metrics without a matching response contract; we kept the supported counts and added no example values.
npm run verify:build` passed (TypeScript and Vite,229 modules). Browser source preview redirects to Home without an authenticated admin session, so authenticated layout, width and keyboard review remain open. No tests, API/data changes or Docker rebuild.


### Admin User List creation gap — 24.10.2026

Live Figma User List `1218:2982` (1440×2041) shows an `Add User` control above the table. Selecting that control in Figma's Prototype panel showed only `Add action`, with no assigned interaction. Read-only source inspection confirms `AdminUserController` and `frontend/src/api/admin.api.ts` have list/get/overview/update/activate/deactivate/HQ operations but no create-user operation. Keep the current supported admin actions and document this gap; no dead button or unapproved endpoint was added. Authenticated runtime review is still open because the local preview redirects to Home without an admin session. No tests or data changes.


### Admin User List → User Profile route — 24.10.2026

Selected the row edit control in the live Figma User List `1218:2982`; its Prototype inspector reports `Click → User Profile - Sulyma Bohdan` (`1237:4369`). Runtime now exposes the API-backed profile details in a separate URL state, `/admin?view=user-profile&user=:id`; the admin Users navigation returns to the table. Invalid ids return to Users. The existing admin user and overview endpoints supply all values and mutations.
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests, API/data changes or Docker rebuild. Authenticated browser visual/focus review remains open.


### Actor filmography label — 24.10.2026

Opened Figma Actor frame `545:676` (1440×2842); the API-backed first list is labeled “Films Starring”, followed by a separate “Films Produced” list. Read-only local `GET /api/actors/1` returns Aaron Eckhart with one actual film row and role `Jake Rosser`. The actor route now labels that same endpoint-backed list “Films Starring” in EN and “Фільми за участі” in UK. Current Vite/Chromium accessibility tree confirms the correct localized heading and live film link in both routes. No Films Produced list was added to the actor route: `/api/producers/:id` exists, but the actor response has no producer id for this person.
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests, API/data changes or Docker rebuild.


### Public network Figma mapping correction — 24.10.2026

Rechecked the visible-frame inventory: desktop `363:411` and `445:455` are named own-profile Following/Followers and include Watched/Lists/Likes columns. The inventory contains no distinct public-profile desktop Following/Followers frame. Corrected `FIGMA_HANDOFF.md` so these own-profile frames no longer imply public desktop parity. Existing public-network source review remains useful for responsive/layout behavior; the phone references `1023:4597`/`1033:5458` and member sheet `1033:5681` remain the mapped public states. No code/API/data changes or tests.


### Director filmography label — 24.10.2026

Opened Figma Director frame `547:904` (1440×2842): its first list is “Films Directed”, followed by “Films Written”. Read-only local `GET /api/directors/1` returns Abdullah Bamajbour with one actual film row. The director route now labels that API-backed list “Films Directed” in EN and “Режисерські роботи” in UK. Current Vite/Chromium accessibility state confirms both headings with the API film link. No written-film list was added because the API has no matching feed.
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests, API/data changes or Docker rebuild.


### Person multi-role phone frame — 24.10.2026

Live Figma phone frame 736:1339 is 393×2029 and shows a person biography plus separate Films Directed, Films Starring, and Films Written sections. The backend exposes `/api/actors/:id`, `/api/directors/:id`, and `/api/producers/:id`; each returns one role type and one films array. There is no cross-role identity mapping, biography field, or written-film feed. The current page therefore cannot render the full multi-role frame without a contract/data change. This is now recorded as an API gap; no static data or unsupported UI was added. No tests or builds run for this documentation-only update.


### Home guest vs registered phone frame mapping — 24.10.2026

Reopened live Figma guest phone `1411:3473` (393×2265) and the matching decoded local raw tree. Guest order is release posters without a section heading, “Rewind lets you…” explainer, “Just reviewed…” posters, signup pitch, Popular Reviews/Lists/Reviewers, and Recent News. Adjacent registered phone `1327:3210` separately contains New/Popular on Rewind and Latest News. The current Home markup and mobile CSS retain these separate variants; API feeds remain dynamic. No source code or tests changed; `git diff --check` passes.


### Review Details phone footer — 24.10.2026

Frame `1480:9249` is 393×932 and shows the shared bottom navigation beginning at y840, a 92px bar. `Header.module.css` fixes the mobile nav to the viewport bottom with `min-height:92px`, so the phone footer geometry matches the source frame. Existing 393/320 layout and focus reviews remain the evidence for the main content; content/avatar parity still depends on populated production API data. Documentation-only change; no build or tests run.

### Frontend production build checkpoint — 24.10.2026

Ran
npm run verify:build` from `frontend/` against the current worktree. TypeScript typecheck and Vite production build both pass (229 modules). No tests were written or run; this is a build checkpoint only and does not close the remaining Figma frame coverage.

**Shared mobile navigation — 24.10.2026:** Compared Home frames `1411:3473`/`1327:3210`, Search `1480:8934`, own Profile `896:1838`, Review `1480:9249`, Lists `1480:8280` and live Crew Lists phone `1480:9814`. The rail uses outlined local SVGs in30×30 slots; localized labels remain visible only on Home and are visually hidden on other standard routes while accessible names remain present. Chromium at320/393/600/720/721/768/1024/1440 in UK and EN confirms the720px breakpoint, no overflow, route-specific caption behavior and a visible3px focus ring; at393×852 the rail is x0/y760/393×92. User Lists `1480:9606` omits the app rail; `/lists` hides its mobile header/nav and reduces reserved bottom spacing. Guest Chromium redirects `/uk/lists` to Login, so authenticated editor visual review remains open.
npm run verify:build` passes. Full frame coverage and regression remain pending; no tests run.


### Help illustration localization — 25.10.2026

Updated the decorative phone illustration on Help to use the existing locale strings for watched, favorite, and Watchlist actions.
npm run verify:build` passed (TypeScript + Vite, 229 modules); Chrome previews at320/393px confirmed UK/EN labels. The 58.9px/74.3px UK `Переглянуто` label fits inside its61.3px/77.2px circular highlight. No tests have been run.


### Help illustration asset localization boundary — 25.10.2026

Inspected the eight static Help guide screenshots: their English interface labels and example content are embedded in the original Figma artwork; each illustration is rendered with `alt=""` and is not an interactive control. The surrounding headings, body copy, links, and the in-DOM watched-film example use UK/EN localization. Keep the original artwork to preserve the selected Figma reference; no localized PNG variants were available or fabricated.


### Mobile route Footer responsive preview — 25.10.2026

Manual Chromium captures of the Help route footer at320/393px in UK and EN show no horizontal document overflow. Primary footer links and the three secondary navigation links render with44px-high hit areas; UK primary links wrap to two centered rows at320px. Keyboard Tab moves from “Про нас” to “Новини”; the latter has a visible3px white outline around its44px-high target in the320px capture. This checks the current responsive runtime and link sizes, not an unavailable mobile Figma footer frame; EN/other-route focus and exact social-vector parity remain open. No tests or data mutations were performed.


### Community relationship-status retry — 25.10.2026

Code review of `FollowActionsContext` found that follow/block request rejections were caught and converted into `false` status values, so rows entered `ready` and could not show Retry. The provider now requires both status responses before enabling follow actions, carries typed follow-status/block-status failures into the row, and retries without replaying a mutation. Removed the obsolete `countsError` fallback now that status failures use the shared retry state.
npm run verify:build` passes (TypeScript + Vite, 229 modules). No tests were written or run; existing Community retry scenarios remain for the final regression.


### Community phone showcase columns — 25.10.2026

Selected live Figma frame `1517:4931` reports 393×1796 and visibly places four members across each showcase row. Updated the mobile `.showcaseList` grid to four columns, matching that arrangement while retaining API-supplied members and hiding entries beyond the four shown.
npm run verify:build` passed (TypeScript + Vite, 229 modules). This turn did not capture a measured 393px runtime comparison; other Community geometry/states remain open. No tests were run and no API/data changes were made.


### Community desktop poster-data boundary — 25.10.2026

Selected desktop Figma frame `605:1112` is 1440×4201 and shows five members per showcase row with small film-poster strips. The current `PopularReviewer` and `CommunityUser` contracts carry identity and counts only; they do not expose a member's poster set. Keep the responsive five-column desktop layout and leave those strips out until a supported data source exists. This evidence establishes the contract gap only; populated desktop visual parity remains unverified. No API or data changes and no tests.


### Community featured-section copy — 25.10.2026

The live Community frames title the first member rail “Featured members”; the implementation used “HQ users” for the visible heading and empty state. Added dedicated UK/EN copy keys (“Рекомендовані учасники” / “Featured members”) while leaving the `/users/hq` request, payload and admin HQ label untouched. Current Vite/Chromium accessibility previews confirm the localized heading and empty message at `/uk/community` and `/en/community`.
npm run verify:build` passes. No tests or API/data changes.


### UserLists desktop edit variants — 25.10.2026

Live Figma frames `341:4372` and `361:592` show the “List Settings” hero and the edit action sequence Add a film, Cancel changes, Delete, View list, Save. The editor heading and UK/EN copy now match; Add a film remains the existing `/films` entry point. Public lists expose View list through the existing `/lists/public/:id` route; private lists do not show an unavailable public view action. No ranked/unranked setting was added because `UserList` has no persisted field for it, while item ordering remains supported.
npm run verify:build` passed (TypeScript + Vite, 229 modules). Authenticated browser visual review is still open; no tests or API/data changes.


### Own Profile Followers empty state — 25.10.2026

Opened `/uk/profile?view=followers` in the authenticated local Vite preview. The current read-only API response has zero followers; the page exposes the localized empty message “Підписників поки немає.” in the accessibility tree and does not render a fabricated row or pagination.
npm run verify:build` passed (TypeScript + Vite, 229 modules). Filled Followers/pagination and failure/retry states remain unverified because this account has no follower records. No tests were written or run and no data was changed.



### UserLists authenticated create preview — 25.10.2026

Opened `/uk/lists` in the authenticated Vite preview. The account has no custom lists; the accessibility tree exposes the blank localized creation fields and the three system lists. Live frame `1480:5333` is 1440×2160 and contains populated example values/items. The Figma Prototype panel defines no transitions for that frame, and no create/edit action was activated in the product. Sample metadata was not copied and the account database was not changed. Edit-frame browser parity remains open because no custom list is available. No tests were written or run.



### Authenticated Home empty News state — 25.10.2026

Opened `/uk/home` and `/en/home` in the authenticated Vite preview. Both routes retain the registered section order shown by Figma phone frame `1327:3210`; Latest News and Recent News expose localized empty copy because the local Journal API currently returns zero articles. Reviews, movies and popular lists remain API-driven and appear in the accessibility tree. This was a manual state/accessibility check, not a viewport geometry comparison. No tests were run and no data was changed.



### Help Service navigation keyboard pass — 25.10.2026

Opened the live Help reference `1062:1993` (1440×4025) and UK/EN Vite previews. The accessibility tree contains the localized content and service links in both locales. Keyboard Tab reached the Service navigation from the primary header; the About us / Про нас link had a visible, unclipped focus ring. No UI or API changes, no form submissions and no tests.


### Help responsive and mobile keyboard review — 25.10.2026

Current UK/EN Vite previews of `/help` were manually measured at CSS widths320/393/600/720/768/1024/1440px. In all14 locale-width combinations, document scroll width equals viewport width. The eight Service navigation links are at least44px high. At320px, eight Tab presses reach “Про нас” / “About us”; the active link has a visible2px cyan outline and does not shift the document horizontally. This confirms responsive navigation and keyboard focus in the current source preview only; it is not a frame-by-frame visual comparison. No source/API changes; no tests were run.


### Community phone composition — 25.10.2026

Reopened live frame `1517:4931` (393×1796) and compared its raw anchors with the current-source Vite preview. The raw background spans y0–234, Featured heading is x16/y242, avatar slots are x16/110/205/300 at about78×78, and Popular begins at y499. The local `/users/hq` feed currently returns no members, so the populated Featured avatars/row and downstream rhythm could not be compared. Updated mobile layout now begins the hero at y0, puts the Featured heading at x16/y242, hides the phone header logo/menu, preserves the fixed92px bottom nav, and sizes Popular's four-column avatar slots to78.25px at393px. Manual UK/EN Chromium review at320/393/600/720/721/768/1024/1440 found no document overflow; on UK393, Tab reaches Home and shows a visible3px outline. The Popular rail's API identities are local data and do not match Figma sample users; no fake members or posters were added. Current HQ/reviewer contracts do not supply the poster strips shown in the frame.
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests, data mutations, API changes or Docker rebuild.


### Profile Authentication settings runtime review — 25.10.2026

Opened authenticated `/uk/profile?settings=authentication` in the current local Vite preview. The accessibility tree exposes labels for Current password, New password and Confirm new password, the Change password action, localized UTF-8 byte-limit guidance, and Newsletter/Delete account navigation. Desktop screenshot review confirms the form action and footer render; this is not a direct Figma frame comparison, nor does it verify submit, success or failure states. No form was submitted, no account data changed and no tests were run. Figma MCP `create_session` returned `Unknown tool`; the browser canvas stayed on Loading for the requested settings node, so no new visual mapping claim is made.


### Current frontend build and Review Details check — 25.10.2026


npm run verify:build` completed successfully (TypeScript + Vite, 229 modules). The authenticated local Vite session opened API-backed `/uk/reviews/3651`; accessibility output contains the actual movie title, author, 4/5 rating, review-like count and localized empty-liker state. The review data was not mutated. This was a desktop runtime/accessibility check, not a matched-frame comparison. Opening `/uk/admin` redirected to Home, so authenticated Admin visual review remains outstanding. No tests were run.

### Home guest phone anchor follow-up — 25.10.2026

Compared local read-only raw Figma frame `1411:3473` against the current-source preview. Before adjustment, the Just Reviewed heading/posters were at y685/y716 and Popular Reviews/Lists at y1013/y1265. Mobile Home spacing now places them at y727/y766 and y993/y1245; the explainer starts y527. At393px UK and EN these are within1px of the recorded Figma anchors y726/y766 and y993/y1244. Figma's Popular Reviewers and Recent News headings are y1559/y1876; runtime is y1602/y1892 with current API rows and an empty Journal response. Keep these data-driven cards real; the remaining downstream spacing needs its own review. At320px both locales remain within the viewport with no horizontal overflow; UK was additionally reviewed at600/680/681/720/768/1024/1440.
npm run verify:build` passed (TypeScript + Vite,229 modules). Browser review used API-backed rows and did not mutate data. No tests, Docker build, or deployment were run. Lower Home section parity remains open.



### Home guest phone lower sections follow-up — 25.10.2026

This follow-up supersedes the earlier runtime readings y1602/y1892. The corrected current-source preview places Popular Reviewers at y1559 and Recent News at y1876, matching raw Figma frame `1411:3473`. At393px, list card/poster and three reviewer rows match their measured geometry. Keyboard review shows visible focus on the list card, poster/title links and owner link; list descriptions remain accessible. UK/EN widths320–1440 have no horizontal overflow. API data is unchanged.
npm run verify:build` passes; no tests or Docker build were run. This is anchor and keyboard verification, not pixel-diff; remaining Home variants stay open.

### Authenticated Home phone geometry — 25.10.2026

Compared current-source `/uk/home` at393px against Figma phone frame `1327:3210`. Runtime heading anchors New/Popular/Latest News/Popular Reviews/Popular Lists/Recent News are y329/527/726/969/1760/2075; frame anchors are y328/527/726/969/1760/2074. Popular Lists card and poster measure x16/y1800/359×231 and x17/y1800/358×180. Local Journal API returns an empty success response; the empty status preserves the layout footprint and remains localized. The list description stays available in the accessibility tree.
npm run verify:build` passed (TypeScript and Vite,229 modules). No tests, API changes, or data mutations; this is geometry evidence, not pixel-diff. Figma file MCP calls still return `Unknown tool`; Chrome canvas and local raw frame data were used.

### Rules responsive and keyboard review — 25.10.2026

Reviewed live Figma `1164:2790` and the current-source `/uk/rules` and `/en/rules` routes in Chromium. The nine Figma sections and four-item ordered Prohibited Conduct list appear in the same order. At a1440px content width, the runtime uses an818px hero, starts the first editorial heading at y713, and puts the English footer at y2196 (canvas estimate about y2204). UK/EN width checks at320/393/600/720/768/1024/1440 show no horizontal overflow; visible service-navigation targets remain44px or taller. At320px, eight Tab presses place focus on About us with a visible2px outline. This verifies route content and responsive/focus behavior, not full pixel parity. No source/API/data change and no tests.


### Privacy responsive/focus follow-up — 25.10.2026

Current-source `/en/privacy` and `/uk/privacy` were manually checked at CSS widths320/393/600/720/768/1024/1440 px. All14 locale/width combinations had no horizontal document overflow. The localized editorial body exposes the expected intro, three-item data list, four-item usage list, sharing, protection and rights sections; the two account actions navigate to existing Profile details/Delete account anchors. At320px, keyboard focus reaches Profile details with a visible2px cyan outline and a44px target. At1440px the content rail begins at x120/y713 with a1200px width; after the latest spacing correction the English footer group starts y1757.8 and total page height2022.8, matching the current frame within1px. This remains an anchor check, not a pixel-diff or complete route parity claim. No source/API/data changes or tests in that earlier pass.


### Shared mobile header hit-area follow-up — 25.10.2026

Manual review of the current-source Help and Account Deletion pages found the mobile logo link was only126×26px and the menu button40×40px. The logo now keeps its126×26 artwork inside a126×44 link, and the menu uses a44×44 button with the original40px visible ring. At320px both receive visible cyan keyboard outlines. UK/EN Help and Account Deletion were revisited at320/393/600/720/768/1024/1440; document scroll width matched the layout client width at each viewport.
npm run verify:build` passed (TypeScript + Vite,229 modules). No tests, API/data changes or Docker rebuild.


### Home member desktop empty-state follow-up — 25.10.2026

Live Figma canvas selection confirmed member frame `1413:6263` is1440×5020. Current UK/EN member Home uses the real API, whose Journal feed is empty. Desktop Latest News now keeps a1199×193 empty card at x120.5/y2004; Recent News keeps three347px card slots for a1199px rail at x120.5/y4243.5. The whole empty page measures5016px, four px shorter than the Figma frame. A temporary browser-only response fixture with three API-shaped articles confirmed the same card geometry and three-column News row; its cover URLs were null, so this confirms layout, not image/content parity. The fixture was cleared and the page reloaded to the actual API response; no DB data changed. UK/EN widths320/393/600/720/768/1024/1100/1140/1440 have no horizontal overflow; empty card height stays149px through1099 and193px from1100.
npm run verify:build` passes (TypeScript + Vite,229 modules). No tests, API changes or Docker rebuild.


### Own Profile Settings EN accessibility follow-up — 25.10.2026

In authenticated Chrome/Vite, Profile, Authentication, Avatar URL and Social links settled into their forms/content after initial loading. The accessibility tree exposed supported identity fields, favorite removal, three named password inputs and byte-limit guidance, avatar URL, four social URL inputs, and save/change actions. No forms were submitted and no data changed. Responsive geometry, error/save behavior, Figma pixel parity, and test gates remain unverified.


### Auth UK/EN route accessibility review — 25.10.2026

Current Vite pages for Login, Register and Forgot Password loaded in both UK and EN. Accessibility trees contain the localized field labels, password visibility toggles, cross-route links, reset/back actions and Register's 72 UTF-8-byte password note. No credentials were supplied and no actions submitted. Frame geometry and success/error/loading variants remain unverified; no tests or data changes.


### Auth phone Back target and focus review — 25.10.2026

After updating the phone hit areas, a fresh Vite source preview measured Login, Register and Forgot Password at CSS widths320/393/600/720/721/768/1024/1440 in both locales. Document scroll width matched viewport width. At phone widths, each Back target is44×44px; the visible Login/Register ring and Forgot Password SVG remain30px, and keyboard focus uses a visible3px outline. Temporary 393×852 screenshots of the three UK routes were visually reviewed; the controls remain positioned over the hero and Forgot Password has no doubled ring. TypeScript and Vite production build passed (
npm run verify:build`,229 modules). The pre-existing Vite server on5173 retained stale CSS-module output, so verification used a separate fresh server on5174. No test suites, auth submissions, or data changes.


### Review Details rating-sheet frame `1480:9407` clarification — 25.10.2026

Opened the exact node in the connected Figma Chrome canvas; the inspector confirms a393×852 phone frame with the RatingSheet overlay visible. The read-only local raw subtree gives overlay x16/y488.62/361×328.38, card361×206.38, stars x71/y194/219×35, and Done x16/y761/361×56. Figma example content has Dune, SilverFrame,500 likes and four active stars. The earlier authenticated source preview recorded runtime x16/y489/361×328, card y536/361×206 and Done y761/361×56, matching within subpixel rounding. This browser session is unauthenticated, so no new runtime capture was made. Local API `/uk/reviews/3651` instead returns a different synthetic movie/author and0 likes; the page exposes the localized empty-liker state. No like/rating was changed, and no tests ran.


### Shared route Footer mobile/focus review — 25.10.2026

Live Figma component `251:625` confirms the separate design-system footer is1440×542; the compact route footer shown by `1122:2802`/`1413:6425` remains the implemented1440×265 variant. Current `/uk/about` runtime at desktop1440×1000 measured the compact footer at1425×265 in Chromium (15px classic scrollbar), with the top-row, social, and copyright anchors aligned to the frame. At393×852 and320×800, the responsive footer wraps without horizontal overflow; at320px primary links occupy two rows, the three existing social glyphs remain centered, and secondary links fit above the fixed92px app navigation. Keyboard traversal reached every primary footer link, the credits link, and all three service links; visible focus outlines were confirmed, and link targets are44px tall. No URLs or social actions were invented. Mobile footer composition is an adaptation because no phone frame is present; exact icon-vector/font parity remains open. No source/API/data changes or tests.


### Film Data Figma geometry comparison — 25.10.2026

Opened live frame `1162:2305`; the inspector identifies a1440×1533 frame. The established raw-node anchors put the intro at y713 and its two headings at y848 and y1010. A fresh-source Vite preview on5174 at1440×1000 measures the article at x112.5/y713/w1200, with headings at y825.78 and y1044.52. The current page additionally shows standalone Open TMDB and Contacts actions not visible in the selected Figma frame. The source retains content and current routes; no edit was made because the Figma file MCP cannot create a session (`Unknown tool`), leaving the visual intent of those actions unconfirmed. This is a documented mismatch, not a pass. No tests or data changes.


### Privacy desktop frame geometry — 25.10.2026

Historical measurement for Figma `1164:2679`: EN1440 content anchors matched, but the prior source footer y1847.84 is stale and is superseded by the latest geometry below. The rights links are currently inline, not separate44px action rows.


### Account Deletion live-frame and keyboard review — 25.10.2026

Opened live Figma frame `1176:2515` (1440×1748) and a fresh Vite source preview. The English frame order is Purpose, four ordered deletion effects, Security and Privacy, Policy Updates, then footer; UK/EN runtime exposes the same sections and a working route to the existing profile deletion form. At CSS widths320/393, both locales have no horizontal overflow and service navigation links are at least44px high. The CTA measures216×44px at EN320 and307×44px at UK393. Keyboard Tab at EN320 reached the CTA with a visible2px cyan outline; it was not activated. The selected frame has no standalone CTA and visually starts its footer about60px above the runtime's y1550 footer. This is manual responsive/focus evidence, not a pixel-diff. No deletion, account/API/data change, or tests.


### Film Data action-row live-canvas recheck — 25.10.2026

Reopened current Figma file `BDO9GO1oscOeUTcu4VXVKA`, node `1162:2305`; canvas selection shows a1440×1533 frame. Current UK source preview `/uk/film-data` on5173 exposes the TMDB and Contacts actions as separate links after the two section paragraphs. The selected Figma frame shows the TMDB/contact instructions in paragraph copy and no separate action rows. The mismatch is confirmed by the live screenshot and runtime accessibility tree. The file MCP `create_session` call still fails with `Unknown tool`, so the required high-fidelity design context is unavailable and no Figma-specific source change was made. No tests, data/API changes, or form actions.


### Privacy rights paragraph live-canvas recheck — 25.10.2026

Reopened current-file node `1164:2679` in Chrome. The selected live frame is1440×2022 with one paragraph in its rights section. This remains accurate, but the accompanying explanation that current source had separate action rows and a +91px footer offset is superseded by the latest JSX and geometry review below. No API or data changes.


### Journal populated-frame versus API-empty-state recheck — 25.10.2026

Opened live Figma `604:967` (`Journal List 3`, 1440×3561) and source-preview `/uk/journal` and `/en/journal`. The frame is populated with a feature and editorial rows; both runtime locales render the localized “no published articles” message and empty archive after loading. This is an API-content difference, so sample frame stories and media remain unfabricated. No route/API/data changes or tests.


### Contact address and keyboard-focus live recheck — 25.10.2026

Opened current Figma `1122:2497` (1440×1920) and `/uk/contact` source preview. The design includes three example email addresses; the runtime keeps the address explicitly confirmed by the user, `anonimua910@gmail.com`, as a `mailto:` link. Keyboard traversal reached that link and a fresh screenshot showed its cyan focus outline. No email client was opened and nothing was sent; no source/API/data changes or tests.


### Global Search films frame mapping and current data state — 25.10.2026

The live canvas shows `1480:7256` is Search Results “films” desktop (1440×1062), while `1480:8594` is the corresponding phone frame (393×852). These map to `/search?tab=films`, not the `/films` catalog. The correct catalog mapping is desktop `1413:12611` and phone `1480:9187`, as recorded in the inventory. Current UK source preview `/uk/search?q=dune&tab=films` returns the localized no-results state and `Фільми (0)`; Figma's six Dune posters are static samples and cannot be compared against current API-backed content. No mock results were added, no code/API/data changes, and no tests.


### Figma MCP та frontend build recheck — 25.10.2026

Повторно відкрив current-file frame `1162:2305` у браузерній Figma: це Film Data, 1440×1533. Візуально frame містить TMDB instructions у body copy; попередньо зафіксовані окремі runtime action rows не відповідають frame. Спроби `create_session` і `open_figma_mcp_app_in_thread` повернули `Unknown tool`; тому обов'язковий `get_design_context` не виконано, і source залишився без Figma-специфічних змін. На поточному worktree
npm run verify:build` успішно виконав TypeScript `tsc --noEmit` і Vite production build (229 modules). Playwright/backend suites не запускались відповідно до плану до завершення редизайну.### About route EN content order recheck — 25.10.2026

Поточний Figma frame `1011:1915` відкрито у браузері; inspector підтверджує 1440×2687 та compact footer. EN `/en/about` у локальному Docker accessibility tree має ті самі вісім секцій у frame-порядку: Our Mission, Editorial Approach, Bridging Past and Future, Accessibility and Inclusion, Philosophy of Dialogue, Visual Storytelling, Commitment to Innovation, Final Vision; далі — Film data and images / TMDB attribution та compact footer. Це підтверджує структуру і UK/EN runtime presence, але не точний body-copy, pixel parity чи mobile variants. Нових source/API змін і тестів не було.

### Admin Dashboard live-frame та runtime access review — 25.10.2026

Поточний Figma frame `1178:2466` у браузерному canvas має назву Dashboard і розмір 1440×2669. На ньому видно адміністративний hero, profile/action row та workspace metric cards; Figma-приклади значень не використовувалися. Прямий read-only перехід локального Docker runtime на `/uk/admin` повернув `/uk/home`, тож у поточній браузерній сесії немає адміністративного runtime доступу для порівняння. Не виконував sign-in, не створював fixture та не змінював БД. Admin review лишається відкритим до запланованого disposable-fixture етапу. Тести не запускались.


### Film Data live screenshot recheck — 25.10.2026

Fresh read-only review of Figma `1162:2305` (1440×1533) and Docker `/en/film-data` confirms the existing content mismatch: the frame keeps TMDB guidance inside the “Adding and correcting data” paragraph and duplicate/contact guidance inside “Duplicates”; runtime renders standalone “Open TMDB” and “Contacts” rows after those paragraphs. The runtime still exposes both valid destinations and localized content. Preserve accurate runtime claims about refresh timing and duplicate handling; Figma sample copy promises behavior the service does not guarantee. This confirms a layout/action placement gap, but no implementation change is made until the required Figma MCP design-context + screenshot flow is available (`create_session` still returns `Unknown tool`). No API/data changes or tests.


### EN Films Genre control recheck — 25.10.2026

A fresh read-only review of Docker `/en/films` shows 203 results; the Genre select is enabled, focusable and exposes “All genres” plus 17 options. `GET /api/genres` returns the corresponding 17 genres. The disabled-options snapshot from the earlier review was not reproduced after the page finished loading, so no current defect is confirmed. No filter was applied, no data changed and no tests were run.


### Journal Article empty API and error-state review — 25.10.2026

Read-only `GET /api/journal/articles?language=en&page=0&size=5` returns `totalElements: 0`, so a populated article cannot be checked without non-production content. Opening a deliberately nonexistent article slug shows the localized loading state followed by the error message, Retry button and Journal return link in the accessibility tree. `frontend/src/pages/JournalArticle.tsx` contains no decorative `⋯` control; the planned inert control removal is already present. No retry was submitted, no API/data changes and no tests.


### Current preview source and Figma canvas state — 25.10.2026

Read-only process/container inspection shows Vite instances for the current workspace at `127.0.0.1:5173` and `:5175`; Docker `web` container `rewind-master-web-1` was created 2026-10-24 and has been up about15 hours. Treat Docker UI as a stale bundle for design review and use the source Vite preview until the release-stage image rebuild. Figma remains installed/enabled in Plugin Management, but the Figma MCP `create_session` call returns `Unknown tool`; the live canvas for `1164:2398` then remained on `Loading` after navigation and one reload. Do not make Figma-specific source edits without the required design context. API/data unchanged; tests deferred.


### Account Deletion current-source review — 25.10.2026

Reviewed current workspace Vite `/en/delete-account` on5175, after the route settled from its brief global loading state. Accessibility tree exposes the four expected sections (Purpose, deletion effects, Security and Privacy, Policy Updates) and the existing link to `/en/profile#profile-delete-form-title`. A scrolled bottom screenshot confirms the standalone CTA and a substantial content-to-footer gap remain in the current source; the CTA was not activated. This is a source-current structure/interaction review, not a new Figma geometry measurement. No account action, API/data change or tests.


### PublicProfile current-source keyboard pass — 25.10.2026

Reviewed current workspace Vite `/en/users/7748` in Chrome. The API-backed PublicProfile renders its current identity, empty favorite/public-list states, recent activity and profile navigation. Keyboard Tab reaches the shared REWIND link with a visible outline; after nine additional Tabs it reaches the Profile rail link, whose focus outline remains visible while the page scrolls it into view. This is a desktop viewport keyboard check only. The local API identity/content differs from Figma's static sample, so no populated-frame parity is claimed. Read-only review; no profile/API mutations or tests.


### Film Data frame/source comparison — 25.10.2026

Opened live Figma frame `1162:2305` in the authenticated browser and current Vite `/en/film-data` preview on5175. The frame places TMDB and Contacts references inside their explanatory paragraphs; the source preview exposes separate “Open TMDB” and “Contacts” links after the copy. The frame mentions a30-hour refresh promise, while current service behavior and source copy do not guarantee a refresh deadline; keep the runtime-accurate wording and move only the links inline after structured design context is available. Browser screenshots and accessibility tree were read-only. Figma MCP `create_session` still returns `Unknown tool`, so no `get_design_context` response was available; no code/API/data changes or tests.

**Current frontend build checkpoint — 25.10.2026:**
npm run verify:build` completed on the current worktree: TypeScript `tsc --noEmit` passed and Vite built229 modules successfully. This verifies compilation only; no Playwright or backend tests were run, and it does not close any remaining Figma parity gaps.


### Service frame corrections — 25.10.2026

Live Figma frame `1176:2515` is1440×1748 and contains four editorial sections with no standalone deletion CTA. Removed the extra CTA from Vite `/en/delete-account`; the Profile deletion form remains available at `#profile-delete-form-title`. Set page-specific desktop content padding; manual preview measures the last-paragraph-to-footer gap at about158px versus about164px in the frame.

For `1162:2305`, moved TMDB and Contacts links into the relevant Film Data paragraphs in both UK and EN. Kept accurate refresh language without the frame's unsupported30-hour promise. Accessibility tree exposes both inline links; keyboard Tab reaches TMDB and Contacts with visible cyan focus outlines. Source preview on5175 has no separate action rows.


npm run verify:build` passed after both changes: TypeScript passed and Vite built229 modules. Manual source-preview review only; Playwright/backend tests remain deferred until the redesign is complete. No API, account, DB, Docker or `.env` changes.


### Privacy rights inline links — 25.10.2026

Reopened live Figma frame `1164:2679` (1440×2022); its “Your rights” section is a single paragraph without separate Profile/Delete action rows. Updated `Servicerage.tsx` so UK and EN rights copy contains inline links to the existing Profile identity and deletion form anchors. The source-preview accessibility trees for `/uk/privacy` and `/en/privacy` confirm localized link names and destinations. Removed the now-unused standalone-link styles.
npm run verify:build` passed (TypeScript and Vite,229 modules); no tests, forms, APIs, Docker, `.env` or DB were touched. Full-page footer geometry and keyboard outline on both links remain for the responsive pass; this is not a pixel-diff claim.


### Auth Login frame review — 25.10.2026

Opened live Login phone frame `944:1582` in Figma; inspector confirms393×852. It visibly contains Back, Welcome back, email/password, Remember me, Forgot password, Log in, Google sign-in and account-creation link. Read-only Vite `/en/login` accessibility tree exposes email/password fields, Forgot password, Log in and Create one. Google and Remember me are already recorded contract gaps: the application has no OAuth flow or session-only cookie option; no inert controls were added. This pass confirms route content only—the source preview was not at a393px viewport, so phone geometry remains open. `create_session` and `whoami` still return `Unknown tool`; no form submissions, tests, or data changes.


### Desktop Login title alignment audit — 25.10.2026

Compared live Figma Login frame `605:2175` (inspector:1440×1614) with Vite `/en/login` in Chrome. The frame centers “Welcome back” over the centered form; the source screenshot places the title block left of the centered email/password fields. Source inspection found `.title` in `AuthShared.module.css` applies `margin-inline:auto` and then `margin:0`, so the latter resets the horizontal margins. This is a confirmed visual mismatch; no code edit was made because Figma MCP `create_session` and `whoami` still return `Unknown tool` and the mandatory structured context workflow is unavailable. The existing phone contract gaps (Remember me, Google OAuth) remain documented; no form/data changes, tests or build were run.


### Auth desktop title alignment correction — 25.10.2026

Changed the shared Auth `.title` margin from the conflicting `margin-inline:auto; margin:0` pair to `margin:0 auto`, centering the heading container with the centered form.
npm run verify:build` passed TypeScript and Vite (229 modules). A fresh Vite server on5176 was used because the existing5175 CSS module transform stayed stale after the shared-file edit; Chrome screenshots of `/en/login` and `/en/register` show both headings centered above the fields. The temporary server was stopped. This was a visual source-preview check, not a pixel-diff or phone-size pass. No tests, form submissions, API, Docker, `.env` or DB changes.


### Forgot Password frame and API capability review — 25.10.2026

Live Figma phone frame `944:1887` loaded at393×852. It shows the lock, Back, email-or-phone recovery copy, reset action, divider and create-account link. Read-only Vite accessibility trees for `/en/forgot-password` and `/uk/forgot-password` expose localized Back, email field, reset action and account link; no forms were submitted. Current frontend/backend contract accepts an email address only, so the runtime correctly requests email rather than claiming phone recovery. This is a documented capability gap, not a reason to add a nonfunctional phone option. No code, tests or data changed.


### Own Profile Figma variants recheck — 25.10.2026

The Figma design canvas is available in Chrome. Selecting `1017:1841` identifies the own Profile Lists phone state; neighboring frames show Profile, Watchlist and Likes selected. The selected phone is393px wide and its shared header uses sample identity Emma Cerys with834 films,32 following and287 followers. These are design fixture values only; runtime remains API-backed. The Figma MCP `create_session` call still fails with `Unknown tool`, so no structured node context was available. Browser review only; no code, API, data, Docker or test changes.


### PublicProfile phone responsive measurements — 25.10.2026

Read-only current-source preview `/uk/users/7748` at320/393/600/720/768/1024/1440px reports document widths equal to viewport widths. At320/393/600, profile heading y317 and Favorites heading y591 (frame `825:1378` landmarks y317/y590 at393px); title font changes to32px at720/768 and58px at1024/1440. Full source page is3407px tall versus the2355px Figma frame. Statistics, social links, collection tabs and liked reviews follow the overview links in source and are not yet reconciled against the remaining profile variants. The local guest fixture has no avatar/favorite poster data. This is responsive/anchor evidence only, not full-page parity. No source/API/data changes or tests.


### PublicProfile desktop composition and product requirement — 25.10.2026

Opened live Figma desktop frame `238:596`; inspector reports1440×4459. The frame visibly includes the hero, overview rail, favorites, recent activity, reviews, Following, Lists and footer. Current source preview `/uk/users/7748` at1440px measures the same1020px hero and first content at y1269, with no document overflow; its full page is4981px due to additional statistics/rating distribution, social links, collection tabs and liked reviews below Lists. `docs/project/PROJECT_REQUIREMENTS.md` explicitly requires public-profile overall statistics, rating distribution and liked reviews, so these existing data-backed features remain; their placement is an uncovered Figma design gap, not a feature to delete. No source/API/data changes or tests.


### Own Profile authenticated source review — 25.10.2026

The read-only authenticated Vite preview at `http://127.0.0.1:5173/uk/profile` exposes the API-backed overview in the same order as Figma phone frame `896:1838`: Favorites, Recent Activity, Recent Reviews, Following, Lists. Current account data contains one watched film, one favorite, one review, zero Following and zero Followers; the Lists view shows Watched, Watchlist and Favorites system lists. The Figma screenshot uses a filled favorite rail, several activities/reviews, network avatars and custom lists, so those content states cannot be claimed as matched from this local account. Source then exposes Statistics below the six overview links shown at the end of the Figma frame; preserve this product-required data and track its placement as an open design gap. No buttons/forms were submitted, no account data changed, and no tests were run.


### Profile Settings phone authentication variant — 25.10.2026

The previously loading live Figma node `1043:2233` recovered in Chrome. Its inspector reports393×852; the visible screen is a Settings summary with a Back/Settings/Done toolbar, read-only email row and Account password row. The local authenticated `/uk/profile?settings=authentication` accessibility tree exposes the existing API-backed password-change form (current password, new password, confirmation and submit). This is a real visual/flow difference; the Figma row has no assigned action in the recorded Prototype inspection, so do not invent a transition. No form was submitted, no account data changed, and no tests/build were run. Figma MCP `create_session` remains unavailable (`Unknown tool`); canvas screenshot review only.


### Profile Settings bio frame and API field audit — 25.10.2026

Live Figma phone node `1043:2303` recovered in Chrome at393×852 and visibly shows a separate Bio screen with Cancel/Bio/Done toolbar and a multiline bio field. Source contract inspection found `ProfileUpdateRequest` contains only `displayName` and `avatarUrl`; `ProfileResponse` contains identity/avatar, stats, lists and recent activity, with no bio field. Therefore this frame cannot be implemented with persisted profile data using the current API. Keep the gap documented; do not add local-only state or change the API solely to mimic this frame. Neighboring Pronoun/Allow replies screens are visible in the same canvas, and corresponding gaps are already mapped in `FIGMA_HANDOFF.md`. No code, API, user data or tests changed; Figma MCP session creation still returns `Unknown tool`.

### Current worktree frontend build — 25.10.2026

Fresh
npm run verify:build` on the current worktree passed TypeScript (`tsc --noEmit`) and the Vite production build (229 modules). This confirms compilation only; it is not the deferred Playwright/backend regression or proof of complete Figma parity. No source, API, account data, Docker, `.env` or DB changes were made.

### Admin route access check — 25.10.2026

Opened `/uk/admin` through the existing authenticated Vite browser session. The app returned the session to `/uk/home`; the account menu exposes Profile, Lists, Settings, Notifications and Messages, but no Admin destination. Therefore this account cannot provide authenticated Admin visual/focus evidence. No admin data or application state was changed. Revisit the Admin UI with the planned disposable admin fixture during the final regression stage; tests remain deferred.

### PublicProfile long-name mobile correction — 25.10.2026

At320px the current `/uk/users/7749` source preview clipped an existing API-provided 22-character display name at the viewport edge while `documentElement.scrollWidth` still equaled320px. Updated only the phone h1 rule in `PublicProfile.module.css` to cap it at100% and use a22–26px responsive clamp. Current-source Chrome at320 reports title bounds x37.1–282.9 with22px type; at393, bounds x51.6–341.4 with25.94px type and unchanged y317 anchor. UK was reviewed at320/393; EN at320 shows the full display name and `scrollWidth === 320`. Figma phone `825:1378` is393×2355 and provides the corresponding y317 identity anchor.
npm run verify:build` passed (TypeScript and Vite,229 modules). No tests, API/data mutations or Docker changes.

### Own Profile mobile keyboard pass — 25.10.2026

Reviewed live Figma `896:1838` (393×2319) and the authenticated UK source preview `/uk/profile` at393×852. Frame/source order matches for Favorites, Recent Activity, Recent Reviews, Following and Lists; the source continues into product-required Statistics below the six frame links. The current account has one favorite, one review, empty Following/Followers, and one system list, unlike Figma's populated sample data. Keyboard traversal reaches mobile navigation, profile actions/settings, Following/Followers metrics, profile tabs, favorite links, and activity/review links. The visible focus outline is present on Home and the Followers link. No controls were activated, no account data changed, and no tests ran.

### Own Profile phone tabs at 320px — 25.10.2026

At320px, the own Profile tab labels previously split across lines. Added a <=360px flex layout with content-sized, non-wrapping tabs. Current Chrome/Vite measurements: viewport/document widths320/320, four visible tabs all one text line and44px tall; at393px widths393/393, four equal87px tabs remain one line. The screenshot review confirms the row fits without clipping.
npm run verify:build` passed TypeScript and Vite (229 modules). This is not automated regression or full Profile/Figma parity; tests remain deferred until redesign completion.

### Own Profile desktop anchor review — 25.10.2026

Live Figma frame `238:865` inspector confirms1440×4459. Read-only authenticated Vite `/uk/profile` at1440px: viewport width1440, content rail x113/width1200, profile identity y555, navigation y1105, Favorites section y1269, Recent Activity y1855, Recent Reviews y2493, Lists y3229, Statistics y3758, footer y4042; document height4307px and no horizontal overflow. The matching frame uses populated sample posters/activity/network while the current account has one favorite, one review and empty Following/Followers, so lower heights/content cannot be compared as parity evidence. No source/API/data changes or tests. Figma MCP `create_session` returned `Unknown tool`; visual review used the live browser canvas.

### Profile Settings phone anchor and contract-gap recheck — 25.10.2026

Live Figma frame `1043:2125` inspector confirms393×1905 and shows Profile, Favorites, Avatar, Banner, and Connections. Authenticated `/uk/profile?settings=profile` at393px: fixed settings toolbar y85/h44 (title center y107, matching the frame's ~106 anchor), Profile form starts y147/x34/325px, first row y187; Favorites heading y389, Avatar form y636, and Social links heading y1079. The downstream source sections are earlier than Figma because the design includes Given name, Family name, Location, Website, Bio, Pronoun, Allow replies, and Banner fields that current profile API does not persist; preserve supported fields and keep these gaps documented rather than adding local-only values. Source document height2284 versus frame1905 also includes route links/footer. No source/API/account changes or tests.

### Profile Settings responsive and keyboard focus follow-up — 25.10.2026

Read-only authenticated `/uk/profile?settings=profile` measurements at320/393/600/720/768/1024/1440px and `/en/profile?settings=profile` at the same widths show no horizontal overflow; phone toolbar is visible through720px and hidden at768px+. At393px, keyboard traversal reached Cancel, Save, display-name field, favorite link/removal, avatar URL and social fields; each focused element exposed a solid2px outline. No forms were submitted and no data changed. This closes only these current-source responsive/focus checks; Figma content gaps, save/loading/error variants and full route parity remain open. No tests run.

### Own Profile Watchlist phone follow-up — 25.10.2026

Live Figma selection `1015:3356` confirms the own Watchlist phone frame is393×1564 and contains a populated four-column sample poster grid. In the authenticated Vite source at393×852, `/uk/profile?view=collection&collection=watchlist` renders the matching shared profile shell: hero/content boundary y496, tabs y531, title y612 (later remeasured at y607 in the matched-width 26.10 checkpoint). The local API account has no Watchlist films, so the correct API-backed empty message is shown; no fixture or account data was changed. Width checks at320/393/600/720 report document width equal to viewport. Keyboard Tab reached the Watchlist link and showed a2px gold focus outline inside its44.6px target. The selected bold Ukrainian label wraps at393px but not320/600/720; this old wrap observation is superseded by the matched 26.10 source check below, where the selected label stays on one line at393px. `create_session` and `get_design_context` returned `Unknown tool`, so no design-context-backed source edit was made. Figma Likes `1015:4508` remained Loading in the latest browser attempt. No tests or build run.

### Own Profile Likes phone check — 25.10.2026

Current authenticated UK `/uk/profile?view=collection&collection=favorites` at393×852 shows hero/content boundary y496, profile tabs y531, section title y607 and Send Help poster x16/y647/79×116, matching the known Figma `1015:4508` anchors within1px. Widths320/393/600/720 have no document overflow; the selected Likes link has a visible2px gold keyboard outline inside its44px target. The account has one real favorite while the Figma phone frame is a filled sample grid; no user data was changed or fabricated. Directly opening the Figma node remained on Loading, so this pass uses the earlier live-canvas screenshot and established local mapping. MCP `create_session` and `get_design_context` return `Unknown tool`. No source changes, tests, or build.

### Public Followers More sheet UK/EN follow-up — 25.10.2026

On the local authenticated source, `/uk/users/7749?view=followers` and `/en/users/7749?view=followers` each return one API-backed follower row. At393px the row is x16/y123/361×65; at320px it is x16/y123/288×65, with44×44 More and Follow targets and no document overflow. Opening More shows localized Follow/Block/Go to member/Done. Done is initial focus; Tab cycles to Follow, Shift+Tab returns to Done, and Escape closes the dialog and returns focus to More. The 320px sheet is x16/y470/288×295 with four56px actions and no horizontal overflow; at393px it is x16/y522/361×295. No follow or block action was activated, and user data was not changed. The mapped Figma frame is `1033:5681`; a direct canvas reopen stayed on Loading, so this is a source behavior/focus recheck against the existing frame mapping. No source changes, tests, or build.

### Own Profile Following error/retry UK/EN — 25.10.2026

On authenticated Vite `/uk/profile?view=following` and `/en/profile?view=following`, temporarily blocked only the browser GET matching `/users/{id}/following`. The localized errors appear as “Не вдалося завантажити мережу користувача.” / “Could not load this user's network.” and expose Retry. At393×852, the button is44px tall, keyboard-reachable after seven Tabs, and shows a visible3px cyan outline. After removing the browser-only block, pressing Enter reruns the live request and restores the real empty Following copy in each locale. No persistent network rule remained. The successful UK state has `scrollWidth === clientWidth` at320/393/600/720/768/1024/1440 (desktop clientWidth accounts for classic scrollbar). No API/account mutation, source changes, tests, or build.

### Own Profile Followers error/retry — 25.10.2026

On authenticated Vite `/uk/profile?view=followers`, blocked only the browser GET matching `/users/{id}/followers`. The page showed the localized network error and Retry. At393×852, keyboard Tab reaches the44px Retry with visible3px cyan focus; after removing the browser-only block, Enter retries the live GET and restores the API-backed empty message. Successful route widths320/393/600/720/768/1024/1440 all had `scrollWidth === clientWidth`, accounting for Chrome's15px classic desktop scrollbar. No API/account mutation, source edits, tests, or build.


### Own Profile desktop Watchlist frame mapping — 25.10.2026

Selected live Figma frame `341:3632` (“My profile Page Watchlist”); the inspector reports1440×3482 and the canvas shows Watchlist selected in the five-tab profile rail. The source route `/uk/profile?view=collection&collection=watchlist` had a duplicate inner Films/Watchlist/Favorites tablist beneath the selected profile rail. Added a desktop-only CSS rule (min-width721px) to hide that redundant row; mobile rules remain unchanged. Hot-reloaded source accessibility tree now exposes the collection heading and real empty state without the desktop duplicate tablist. The source screenshot used the current desktop viewport rather than exactly1440px; mobile filter reopening still needs a manual check.
npm run verify:build` passes (TypeScript + Vite,229 modules). The user's Watchlist is empty while Figma uses sample posters; no user data/API changes or automated tests.


### Own Profile desktop Likes variant — 25.10.2026

Live Figma frame `341:3866` (“My Profile Page Likes”) inspector confirms1440×3256; it shows the same five-tab profile rail with Likes selected and a six-column filled poster grid. Authenticated source `/uk/profile?view=collection&collection=favorites` exposes the localized Вподобання heading, the same profile rail and one real Send Help favorite; the redundant nested collection tablist is absent. The source screenshot was taken at the available desktop viewport, not exactly1440px, and its single live favorite cannot verify populated-grid content parity. This is a route/semantic check, not exact geometry evidence; no source/API/account changes or tests.


### Own Profile desktop Lists variant — 25.10.2026

Live Figma frame `341:4198` inspector confirms1440×3338; Lists is selected in the five-tab rail and the frame shows three poster-led list rows. Authenticated source `/uk/profile?view=lists` returns the account's real system lists (Watched1, Watchlist0, Favorites1) with the matching broad poster-left/details-right card composition. At the current1920px source viewport the visible card row is about1190px wide and337px tall (classic scrollbar reduces content width); Figma at50% shows a row about600×169, or approximately1200×338 in frame pixels. This is a visual row-rhythm comparison, not exact measurement. Figma uses populated custom-list sample content, so poster-stack/detail parity cannot be proven from current account data. No source/API/account changes, tests, or build.

### Figma visible-frame coverage audit — 25.10.2026

At the time of this read-only comparison, the external local inventory had250 visible Page 1 frames, with153 IDs mentioned in the handoff and97 absent. These are historical text-scan counts, not screen-coverage evidence: the inventory also includes components, legacy/duplicate frames and unrelated presentation/artwork, and a textual ID mention alone does not prove visual review. The original candidate list included Films `1260:3772`/`1480:6235`, Actor phone (later corrected to `721:1085`; the earlier “731:1085 was a typo” note was incorrect; raw node evidence confirms it is a distinct James Cameron multi-role phone variant), User List `1222:3530`, Search desktop `1480:7083` and phone `1480:8464`/`1480:8631`/`1480:8709`, list editor `1344:6018`, and Admin `1260:4840`, `1162:2105`, `1222:3312`, `1393:3652`. Subsequent canvas review classified Search all frames `1480:7083`/`1480:8464`, mapped `1480:8631` to Search Reviews phone with its visual comparison open, and mapped Cast/Members `1480:7390`/`1480:8709` to Search users. Reconcile remaining candidates against implemented routes and matching references before claiming coverage. Figma browser displayed Watchlist phone `1015:3356` at393×1564; direct navigation to standalone Films `1015:2131` stayed on Loading. No code/API/account/Docker changes or tests.

### All Films phone header adjustment — 25.10.2026

Fresh live Figma frame `1480:9187` is393×1215 and shows the back button plus a separate circular sliders control at the top, then the Films title alongside a215×31 Year/Rating/Genre summary row. In `Search.tsx`/`Search.module.css`, separated the existing mobile filter trigger from its visual summary and aligned them to these anchors; the trigger still toggles the same real filter form, keeps its accessible label/expanded state, focuses the first enabled control, and Escape returns focus to the trigger. API query and desktop layout are unchanged.
npm run verify:build` passed TypeScript and Vite (229 modules). The available source Chrome window remained desktop-width, so this entry is a Figma-referenced implementation plus build evidence; phone-width Chrome geometry/focus still needs manual review. No tests or API/data/Docker changes.

### Own Profile collection disclosure Escape behavior — 25.10.2026

Added Escape handling to the mobile own-Profile collection tab disclosure. Pressing Escape from a collection tab closes the disclosed tab row and returns keyboard focus to the sliders trigger; normal arrow-key roving behavior remains delegated to the existing `useRovingTabs` hook.
npm run verify:build` passed TypeScript and Vite (229 modules). No API or account data changes and no tests were run. A phone-width current-source Chrome keyboard check remains open; the Figma file MCP `create_session` call still returns `Unknown tool`.


### Own Profile Ukrainian Watchlist label — 25.10.2026

The previously recorded authenticated source review showed “До перегляду” wrapping to two lines in the selected mobile profile tab at393px, while the corresponding Figma phone variant `1015:3356` uses a single compact tab row. Added a361–720px rule for that tab only:10px type,2px horizontal padding and no wrapping. The44px minimum hit target remains from the existing mobile tab rule.
npm run verify:build` passed TypeScript and Vite (229 modules). This is not yet confirmed in a current-source phone viewport; recheck UK/EN at361/393/600/720. No tests or API/data changes.

### Person phone frame inventory correction — 25.10.2026

The live Figma search opened `721:1085` (“Actor Page - phone Simchuk”), a393×1601 phone frame with a Brad Pitt identity and Starring/Directed/Produced film sections. `FIGMA_HANDOFF.md` maps this Actor frame and documents the role-feed/API gap. An earlier note called `731:1085` a typo; raw node evidence corrects that note: it is a distinct James Cameron multi-role phone variant and has been removed from the unresolved candidate list in `PLAN.md`. No source/API/data changes or tests.


### Global Search all desktop frame classification — 25.10.2026

Opened live Figma node `1480:7083`; its layer title is Search Results “all” and its inspector reports1440×4188 with a12-column layout guide. This maps to the existing `/search?q=…` GlobalSearch all tab, not a separate route. The related phone node `1480:8464` is a393×995 populated compact state with two review cards and Show more results. Read-only UK preview `/uk/search?q=Send+Help` returned one real API film and one review; Figma uses sample Dune content and two reviews. This classifies both variants and verifies the live route response only; no full geometry/parity claim. Figma MCP `create_session` still returns `Unknown tool`. No source/API/account changes, build, or tests.

Figma AX/layer inspection exposed the selected node `1480:8631` as Search Results “reviews” (svergunova phone), with inspector size393×1139 and a4-column layout guide. This maps the frame to the existing `/search?tab=reviews` GlobalSearch state. The canvas screenshot remained on Loading, so visual geometry/content parity remains unverified. No source changes or tests.

Read-only source Chrome `/uk/search?q=Send+Help&tab=reviews` settled to the API-backed Reviews tab with one result. The accessibility tree exposes the movie poster/title, rating, author and review link; the screenshot shows the live poster and review card. This confirms route/state data rendering in the available desktop viewport only; it does not close the Figma phone geometry check. No source/API/account changes or tests.


### Global Search Cast / Members frame review — 25.10.2026

Live Figma frames `1480:7390` (desktop1440×1392) and `1480:8709` (phone393×852) are titled Search Results “cast/members” and show community member cards, not filmography people: avatar, name and follower/following counts. They map to the existing `/search?tab=users` state. Current Chrome source at1920×855 measures a centered1200px content rail and a1200×120px API-backed member card with an80×80px fallback avatar, matching the desktop frame's card dimensions. Keyboard traversal reaches the real member link with a visible3px cyan focus outline. Fresh phone comparison with UK `/uk/search?q=race&tab=users` at393×852 shows six source rows against four Figma rows. The current frontend `PublicUserSearchResult` and backend `PublicUserResponse` provide ID, username, display name and avatar only; counts are missing, and the separate follow-status operation is authenticated. Keep real search results, note the row-density/count gaps, and do not fabricate metrics or add per-user requests. No source/API/data changes or tests.

**Films discovery / All Films navigation — 25.10.2026:** Figma Find mapped desktop `1480:6235` (1440×2722) and phone `1480:7843` (393×1235) to Discovery; All Films is a separate screen at desktop `1413:12611` (1440×2956) and phone `1480:9187` (393×1215). Prototype on desktop More `1480:6352` opens All Films. The implementation now keeps `/films` and its search/query behavior intact, adds `/films/discover`, and points desktop Films navigation to Discovery. Manual UK/EN Chrome source review loaded API-backed popular films, recent-review posters deduplicated by movie ID, and popular reviews. Crew Picks remains visibly unavailable because no matching API contract exists.
npm run verify:build` passed (231 modules); tests and Docker remain deferred. Fresh Figma screenshot comparison and phone source review remain open because the direct canvas tab stayed on Loading and this browser connection has no viewport override.


### Admin Movies frame classification — 25.10.2026

Recovered the live Figma canvas through Find and selected `1260:3772` (“Films - Sulyma Bohdan”,1440×3352). The visible frame is the Admin Movies / Film Database workspace: admin identity hero and icon rail, film search, two-column poster cards with metadata, and Edit Film actions. This classifies the previously unresolved frame and maps it to `/admin?view=movies` → `AdminMovies`; it does not verify current runtime parity. The available Vite preview uses a non-admin session and redirects `/admin` to Home, so authenticated visual/focus review remains open. Figma MCP `create_session` and `get_design_context` still return `Unknown tool`; the frame was reviewed directly in the user's open canvas. No source/API/account changes, build, or tests.


### Admin Movies card/editor implementation — 25.10.2026

`AdminMovies` now renders the existing API page as a two-column desktop poster-card list with title/date/rating and a primary Edit action; delete and TMDB sync remain available in a per-card “More actions” disclosure. Create, TMDB import and quality controls are grouped in a collapsed editor disclosure, with localized labels and focus restoration after cancel/save. Card edit, advanced-action, sync and TMDB ID controls now keep a 44px minimum target. Existing API loading, empty, retry and mutation feedback remain in place. Fresh
npm run verify:build` passes (TypeScript and Vite,229 modules). The confirmed `/admin/movies` API accepts pagination only and has no search parameter, so the Figma search element is not represented as an inert control. No backend/API/data changes or tests. An authenticated Chrome layout, keyboard, and focus review is still required; the available preview redirects non-admin sessions. Plugin Management confirms Figma is installed/enabled and permits low-risk actions, but `create_session` still returns `Unknown tool`.


### Film Data English desktop spacing — 25.10.2026

Opened Figma frame `1162:2305` in the connected Google Chrome editor; its inspector confirms1440×1533. Compared its intro and section anchors (y713, y848, y1010) with the current Vite `/en/film-data` preview. Added20px to the English desktop intro spacing at1024px and wider; a fresh Chrome screenshot places the first heading within a few pixels of the frame while retaining the matching interval between section headings. TMDB and Contacts remain inline links; keyboard traversal reached both with visible cyan focus outlines. Accurate refresh copy is preserved. UK and mobile layouts are unaffected by the new selector.
npm run verify:build` passed TypeScript and Vite (231 modules); `git diff --check` passed. No tests, Docker rebuild, API/data mutation, or Figma edits. The Figma MCP session tool still returns `Unknown tool`, so the visual comparison used the live Chrome canvas.


### Own Profile Reviews frame follow-up — 25.10.2026

Reviewed desktop `363:289` in the connected Figma canvas. The 25.10 withdrawal of `1023:1867` as a Reviews phone variant was superseded by the fresh 26.10 canvas screenshot: it shows Profile selected and a full Reviews list. The desktop heading correction remains verified; see the latest entry for matched-width route evidence.
npm run verify:build` passed (231 modules); phone-route geometry remains open. No API/account/Docker changes or automated tests.


### PublicProfile mobile overview source check — 25.10.2026

Figma `825:1378` was reopened on the Chrome canvas; source preview ran at393×852 using the existing `vite.visual-audit.config.ts`. Measured H1 x61/y317/271×28 and Favorites heading x16/y591/361×16, against frame anchors y317/y590. `scrollWidth === clientWidth === 393`. API sample identity/activity/posters differ from Figma content; no sample content was injected. No code/API/data changes and no tests.


### Global Search Reviews phone current-source review — 25.10.2026

Opened Figma `1480:8631` and current source `/uk/search?q=Concurrent&tab=reviews` side by side at393×1139. Source has a 361px single-column review row; measured first six API cards at y274.34/467.34/660.34/853.34/1046.34/1239.34, each361×168 with25px gaps. The first four fit fully above the fixed bottom navigation (y1047), while later API results remain scroll-reachable. Figma displays four sample cards and the same bottom rail; poster/text sample content differs. This classifies the visible density and route behavior, but exact Figma child bounds/gaps and typography remain unverified because the structured connector returns `Unknown tool` and the canvas is not exposing nested bounds. No code/API/data changes or tests. Temporary visual-preview server stopped after review.

**Global Search Reviews phone keyboard — 25.10.2026:** manual Chrome Tab traversal from the native category selector reached the Reviews tabpanel then first poster link. At393×1139 the poster link is79×116, x34, in view, and has a visible3px cyan focus outline/3px offset. No review or movie link was activated. No code/API/account changes or tests.


### Figma MCP restored and Search Reviews phone alignment — 25.10.2026

Post-reboot Figma MCP returned a live session and structured contexts with screenshots for Login `944:1582` and Search Reviews `1480:8631`. Search Reviews phone dimensions are393×1139. Its first four review cards are361×168 at x16 and y267/460/652/844. Previous local measurement was y274.34 with193px pitch; changed only the phone `.matchesHeading` bottom margin from13px to6px, giving a calculated first-card y267.34 while retaining25px gaps. API data, poster handling, and focus behavior were not changed. Login MCP context confirms the current omissions (Remember me and Google sign-in) still have no session-only or OAuth contract.
npm run verify:build` passed (TypeScript + Vite,231 modules). Post-change browser geometry still needs an explicit measurement. The subsequent context request reached the Starter-plan Figma MCP call limit; the Chrome canvas remains usable manually. Tests, account actions, and Docker changes were not performed.


### Local preview restored after reboot — 25.10.2026

The Docker daemon and Compose containers were stopped after the rC restart. Started the existing `db`, `redis`, `mailpit`, and `api` containers with `docker compose start`; no image rebuild or container recreation. `/actuator/health` reports Ur and direct read-only `/api/search/global?q=Concurrent&language=uk&size=6` returns6 reviews. The Vite visual preview on5174 now renders six API-backed review rows. The browser tool has no viewport override in this session, so this does not re-verify the calculated393px post-change y267.34 anchor. No write requests or tests.


### Privacy desktop footer spacing — 25.10.2026

Historical Privacy spacing pass: the98px reduction placed the source footer outer edge at y1694 and its logo near y1757. A fresh full-frame read shows y1757 is the Figma footer group's top, so this left the source footer too early. The follow-up adjustment and measurements below supersede this geometry; the inline profile and deletion links remain present.


### Privacy desktop footer geometry correction — 25.10.2026

The live frame `1164:2679` is1440×2022 with footer group y1757. Current EN source at1440 had footer outer edge y1693.8; added64px desktop bottom spacing. Re-measurement places footer at y1757.8, logo x143/y1820.8 and full document end y2022.8, matching the frame's footer group and total height within1px. Five content headings remain at y825.8/1010.9/1218.4/1381.2/1521.5 (frame y826/1011/1218/1380/1521). UK/EN responsive widths320/393/600/720/768/1024/1440 retain document width equal to viewport.
npm run verify:build` passes TypeScript and Vite; no tests, API/data mutations or Docker changes.


### Journal Article desktop title — 25.10.2026

Reopened current-file Figma frame `844:1547`; inspector reports1440×3120. The visible title “Movies ‘Christmas Adventures’” is one line. Current source constrained desktop H1 to845px and wrapped the same title; widened it to the1126px article rail. With an in-memory API response in a temporary browser preview, title height is65px, cover rail x120/y426/1126×642, and article body begins at y909. The frame's collage and illustrated/rich-text content remain unavailable from the current API contract (one `coverUrl`, text `content`); no fixtures were written to the database or production code. Responsive measurement at320/393/600/720/768/1024/1440 shows no horizontal overflow.
npm run verify:build` passed (TypeScript + Vite,231 modules). No automated tests, backend/API changes, or Docker changes.


### Account Deletion footer spacing — 25.10.2026

After reboot, the current Figma canvas frame `1176:2515` is visible in Chrome and confirms1440×1748, four editorial sections, compact footer, and no standalone deletion CTA. The Figma MCP `get_design_context` endpoint still reports the Starter-plan call limit; `whoami` confirms Starter tier. Current source gap from the last paragraph to the footer was156px; raised desktop `.deletionContent` bottom padding by8px, producing a164px gap at768/1024/1440, matching the frame anchor. UK and EN have no horizontal overflow at320/393/600/720/768/1024/1440.
npm run verify:build` passed (TypeScript + Vite,231 modules); automated tests, Docker, API, and database were not touched.


### PublicProfile desktop frame recheck — 25.10.2026

Reopened current Figma desktop frame `238:596` through Chrome after reboot; selected-frame inspector reports1440×4459. The canvas shows the hero, overview rail, Favorites, Recent Activity, Reviews, Following, Lists and footer. Read-only current-source DOM geometry at a1920px viewport reports hero y0–1020 and the1200px Favorites rail beginning y1269, matching the recorded frame anchors. The current API page is about4981px tall because product-required Statistics/rating distribution, Social links, collection tabs and liked reviews follow Lists; retain these real features and track the placement beyond the Figma frame as an open design gap. Figma MCP context/screenshot calls remain Starter-limited; this was a manual canvas plus live source geometry check, not a pixel-diff. No API/data mutations, automated tests, or Docker actions.


### PublicProfile Following phone row recheck — 25.10.2026

Current Figma canvas frame `1023:4597` is selected and inspector reports393×852. Its populated Following rows visibly include separate More and Follow controls and fixed bottom navigation; the adjacent canvas frame shows the member sheet actions Unfollow, Block, Go to member and Done. A read-only Chromium source preview at393×852 (`/uk/users/7748?view=following`) returns200 and renders the actual single API relationship row at x16/y123/361×65, member link309×44 and guest Follow-to-Login target44×44; document width equals393 and the fixed bottom navigation starts at y760. Figma displays more sample rows; source kept the one real API record. More is conditional on an authenticated actor, so its guest absence is an auth-state difference; prior authenticated focus-loop evidence remains the source sheet verification. No action was activated, data changed, or test runner launched.


### Figma connectivity and Admin frame — 25.10.2026

After workstation reboot, Figma `whoami` and `create_session` succeed. `get_design_context` is still blocked by the authenticated Starter-plan MCP call limit. The same file remains readable in the Chrome Figma canvas. Admin Edit Film frame `1260:4840` is visibly selected and its inspector reports1440×3128. Runtime parity and keyboard review are not verified because the local preview has no authenticated admin session. No application data, roles, API, Docker, or tests were changed.


### Admin Edit Film contract gap — 25.10.2026

Live Chrome canvas at50% confirms `1260:4840` (“Edit Film - Sulyma Bohdan”), 1440×3128, with fields/actions for title, duration, status, original language, poster, year, genre, description, director/actors and aggregate review metrics. Source review confirms frontend `AdminMovieWrite` currently exposes only title/releaseDate/rating/photoUrl. Existing `GET /api/movies/{id}/details` (`getMovieDetails`) already returns title, imdbId, durationMinutes, releaseDate, ageRating, rating, shortPlot, photo/backdrop/trailer URLs, genres, directors and actors; the admin list response alone is compact. Backend `UpdateMovieRequest` accepts imdbId, durationMinutes, releaseDate, ageRating, rating, shortPlot and photo/backdrop/trailer URLs, so supported fields can be prefilled from the existing details route and submitted without changing the contract. Status, original language, genre/credit writes, and review aggregate metrics have no corresponding admin write contract; do not map `Movie.rating` to “Average User Rating” without confirming semantics. Runtime/keyboard review remains pending because this Chrome session has no authenticated admin account. No API/data changes or tests.


### Current frontend build and auth-state visual audit — 25.10.2026


npm run verify:build` completed successfully: `tsc --noEmit` and Vite production build (231 modules). This is current build evidence only; no automated tests were run. Read-only Chrome review confirms the current signed-in `/uk/profile` API screen loads. Figma Home guest frame `1411:3473` is393×2265, while the available `/uk/home` source preview renders the authenticated Welcome back variant; this state mismatch means no Home guest parity is claimed. The own Profile desktop frame `238:865` was recovered through browser history after a transient Loading view; its Figma inspector reports1440×4459 and the canvas shows overview, Favorites, activity, reviews, Following, Lists, and footer. Current source was inspected at a wide desktop viewport, not at an exact1440px viewport, so that runtime comparison remains open.

### Own Profile Watchlist Figma canvas re-open — 25.10.2026

After reboot, the live canvas again displays Figma frame `1015:3356`; inspector confirms393×1564 and the frame contains the compact profile header, four-column poster grid, and phone rail. The authenticated local route still returns the API-backed empty Watchlist. Exact runtime geometry and keyboard evidence from the earlier phone audit remain in the prior release entry. No sample content, user data, API, Docker, or tests were changed. MCP `whoami` and session creation succeed; design-context fetch is still blocked by Starter call quota.


### Own Profile Lists Figma canvas re-open — 25.10.2026

Browser history restored own Lists phone frame `1017:1841`; selected-frame inspector reports393×1666. Read-only current UK route `/profile?view=lists` exposes the three real system lists and API counts, while the Figma sample shows custom list cards absent from this account. Previously recorded UK320/393 and EN393 geometry evidence remains authoritative. No fake content, API/data changes, Docker action, or automated tests.


### Figma visible-frame inventory comparison — 25.10.2026

Read-only comparison used the local frame snapshot last written22.10.2026, not a current Figma export. The earlier165/85 and181/69 text counts are historical and superseded by the corrected250/250 token-boundary scan recorded in the current inventory recount. These are not visual-coverage counts because the snapshot includes slide/artboard material, design-system elements, isolated components and historical route copies, and predates later live frames. Raw node content identifies `721:1085` as Brad Pitt and `731:1085` as a separate James Cameron multi-role screen; current Person APIs lack a unified writer/multi-role contract. Route candidates are recorded in the handoff and PLAN. No source/API/data/Docker changes or automated tests.


### Figma PublicProfile Lists variant classification — 25.10.2026

After reboot, authenticated Figma MCP `get_design_context` and `get_screenshot` both return the Starter tool-call limit. On the live Chrome canvas, selected `Crew lists (svergunova phone)` node `1480:9718` (393×1546), then `Crew lists “more tags”` node `1480:9814` (393×1674), and zoomed each to selection. The enlarged screens show the Rewind HQ profile hero, Profile/Watchlist/Likes/Lists tabs, personal list cards and tags. This confirms both frames belong to `/users/:id?view=lists` → PublicProfile, not the Lists catalog. An initial catalog classification was corrected after the zoomed visual check. The separate Crew-feed gap documented for `/lists/discover` remains valid. Its contemporaneous181/69 snapshot text count is superseded by the corrected250/250 token-boundary scan recorded in the current inventory recount; neither count is visual coverage. No app code, API, account data, Docker, or tests changed.

The protected local raw snapshot identifies desktop Crew Lists frame `1480:6383` as1440×3236 and its more-tags state `1480:6501` as1440×3303. Their descendant text includes “The official profile of the team behind the platform”, the Lists tab, three public user-list cards and tags, confirming they are PublicProfile states despite the “Crew lists” layer label. `PublicProfile.tsx` already reads the user's paginated public lists from the profile API. Phone variants were visually reviewed in the current Figma canvas; source-to-design comparison for the desktop pair is still open. No application changes or tests.


### Home desktop frame candidate comparison — 25.10.2026

Live Figma search opened guest Home `472:492`; the inspector confirms1440×4934. The raw local export shows it and mapped guest `1413:6471` both have1440×4934 dimensions and exactly the same ordered text descendants (74 nodes), but their layer identities/structures differ. Registered candidates `473:492` and `1413:6263` both measure1440×5020 and share the Home sections, while their text sequences differ. These are candidate legacy copies or visual variants; no parity/duplicate claim is made without a direct same-canvas visual comparison. Existing API-driven guest/member variants remain unchanged. No code/API/data/Docker changes or tests.


### PublicProfile Lists runtime data state — 25.10.2026

Opened the current Vite route `/uk/users/7748?view=lists` in a fresh Chrome tab. The route renders the PublicProfile hero, Profile/Films/Watchlist/Likes/Lists navigation, a “Публічні списки” section and the API-backed empty message “Публічних списків поки немає.” The selected Figma `Crew lists` frames contain three sample list cards and tags for Rewind HQ. The local user has no public lists, so populated card/tag parity cannot be verified with this account; no Figma content was copied into the app. Browser viewport was1905×852, not the1440px frame width, so this was a route/state check rather than a matched geometry comparison. No code/API/data changes or tests.


### Own Profile overview and review phone variants — 25.10.2026

Live Figma Chrome canvas confirms `896:1838` as the full 393×2319 Profile overview, showing Favorite Films → Recent Activity → Recent Reviews → Following → Lists, in the same order as source `/uk/profile`; the app also keeps product-required Statistics below. The separate `1023:1867` frame (393×1434) has Profile selected and a full Reviews list with three sample cards; it visually corresponds to the existing `/profile?view=reviews` route, though no Prototype transition is assigned. Map `896:1838` to the full default overview and `1023:1867` to the shortened Profile/Reviews phone composition. Frame `1023:2343` (393×852) shows a standalone Review card with Edit/Delete; adjacent `1023:2837` (393×852) is a full-screen editor with film title/year, date, rating/Like, review text, Cancel and Save. The selected Edit control has no defined Prototype transition (`Add action` only), and neither frame establishes a route. These differ from public `/reviews/:id` frames `1480:9249`/`1480:9407`. Existing `/profile?view=reviews` already supports API-backed PATCH/DELETE; retain it and record the separate phone composition/transition as a design gap. The API account has one favorite, four activity events, one review, no follows and one system list; Figma sample content was not copied. Figma `get_design_context` remains blocked by Starter call limit. No source/API/data changes or automated tests.


### Own Profile review phone action labels — 25.10.2026

The `1023:2343` phone card shows text actions “Edit review” and “Delete review”, while the existing owner Reviews route rendered icon-only controls at all widths. Added localized visible text spans at the ≤560px breakpoint; existing aria-labels, PATCH/DELETE handlers and44px minimum hit targets remain.
npm run verify:build` passed TypeScript and Vite (231 modules). The authenticated `/uk/profile?view=reviews` route loads its live API review in Chrome; clicking Edit opens the existing form and Escape closes it with focus visibly restored to Edit. UK and EN accessibility trees expose localized action names (Редагувати/Видалити огляд; Edit/Delete review). This browser session has no responsive viewport control, so exact phone geometry and post-change phone screenshot remain unverified. The local `.fig` archive has file key `orb73jiLJnIsZNCRtJsWgS`, not the current file, and no matching frame export; current frame evidence is from the live canvas. No automated tests or API/data changes.



### Own Profile Reviews frame correction — 25.10.2026

Live Figma frame `363:289` is1440×2859. It shows the Profile hero and selected Reviews tab but no separate visible Reviews heading at the top-left. Current Vite `/uk/profile?view=reviews` had an extra overlay there. Changed only that view's page H1 to the existing global `srOnly` class; the `<main aria-labelledby>` target and translated accessible H1 remain, and the section H2 remains visible. Chrome AX tree exposes both headings; the refreshed screenshot shows the overlay removed.
npm run verify:build` passed TypeScript and Vite (231 modules). No automated tests, API/data, Docker, or Figma changes.

### Live service legal-frame classification — 25.10.2026

After the rC restart, opened the current Figma file in the user's connected Google Chrome session. The live canvas search selected Safety Notice `1176:2355`; the inspector confirms1440×1865 and the visual shows five sections (Purpose, Data Protection, Content and Interaction, Community Safety, Policy Updates). Search selected Terms `1117:2235`; inspector confirms1440×3771 and the frame is a distinct long-form legal document with multiple separately headed sections. Conditions `1164:2918` was confirmed in the prior live-canvas review at1440×2030. Source route inventory in `App.tsx` has only Help, Contact, Rules, Privacy, Film Data and Account Deletion among these service pages; Conditions, Safety Notice and Terms are absent, and the requirements document mentions conditions and safety notice. Treat them as missing route/content scope, not as aliases. Terms and Safety Notice contain unverified legal/operational commitments; no source copy was published. MCP session creation works, but `get_design_context` is blocked by the current Starter call limit. No app/API/data/Docker changes or tests.

### PublicProfile Likes phone collection — 25.10.2026

Live Figma frame `863:2474` (393×1162) shows the Likes phone collection with back/title/filter toolbar and four-column poster grid. Reopened the current canvas after the workstation reboot; the selected frame and 393×1162 inspector dimensions are visible. Manual current-source UK and EN checks of `/users/7748?view=collection&collection=favorites` at CSS393 show the localized real empty state at x16/y123, 361px wide, document width393, and no poster slots. Tab reaches bottom navigation, Back, Filters and the focusable empty-state message; visible 3px cyan rings appear on navigation and 2px amber rings on route controls/message. The API account has zero favorites, so this classifies the sample-grid/content difference as a data gap; it does not verify populated-grid parity. No sample data, API mutations, code changes, Docker actions, build or automated tests.

### PublicProfile liked-list frame contract check — 25.10.2026

Live frame `863:2717` (393×852) is titled “Likes” and shows two public-list cards, unlike Likes grid `863:2474`. Current UK393 `/users/7748?view=lists` correctly shows the account’s own public-list empty state with no horizontal overflow. Backend has only a global recently-liked lists feed and no per-user liked-list endpoint, so this frame cannot be considered mapped to current route/API semantics. No substitute data or API changes; no build, Docker action, or automated tests.


### Admin Edit Film — підтримувані поля UI — 25.10.2026

Chrome Figma canvas підтверджує поточний Admin Edit Film frame `1260:4840` (1440×3128). У frontend edit flow тепер завантажує `/movies/{id}/details`, передзаповнює duration і description та відправляє їх разом із уже наявними title/date/rating/poster полями до чинного PUT `/admin/movies/{id}`. Для асинхронного prefill додано loading/error/retry стани, save блокується при невдалому detail load, а застаріла відповідь ігнорується при закритті/зміні редагованого фільму. Контрактні gaps залишаються: status, language, genre, director, actors і агреговані метрики. Admin runtime доступ/клавіатура ще не перевірені. TypeScript і Vite build пройшли (
npm run verify:build`, 231 модулів). Authenticated Admin runtime parity все ще заблокована перенаправленням неадмінської сесії на Home; automated tests і Docker не запускались.


### Recheck PublicProfile member sheet reference — 25.10.2026

У новій Chrome Figma вкладці відкрив `1033:5681`; inspector показує393×852, screenshot canvas показує Unfollow / Block / Go to member / Done. Звірено з поточним `UserFollowRow` та `useDialogFocusTrap`: action wiring, error/retry feedback, Esc і focus restoration залишаються у source. Попередній ручний keyboard pass доводив клавіатурний цикл; цього разу лише повторно підтверджено live frame/action list. Матched-source screenshot у точному viewport не робився, тож нової pixel-parity заяви немає. Код/API/дані/тести не змінював.


### Own Profile Films filter trigger keyboard correction — 25.10.2026

In `Profile.tsx`, Escape previously closed the responsive collection tabs only when focus was on a tab. The visible sliders trigger also opens that disclosure and can retain focus, so Escape there did nothing. Reused the same close path from both trigger and tab, setting the disclosure closed and restoring focus to the trigger. CSS review confirms the trigger matches the page's existing2px gold `:focus-visible` ring; its rendered visibility at phone width still needs manual review. This preserves existing tabs/roving keys and does not invent a filter operation.
npm run verify:build` passed TypeScript and Vite (231 modules). Manual UK/EN keyboard review at matched phone width remains open; no API/data changes or automated tests.


### Admin Edit Film async prefill data-preservation guard — 25.10.2026

The Admin movie editor now exposes `aria-busy` while loading `/movies/{id}/details` and prevents collapsing its disclosure during that request. Without this guard, the late response was intentionally ignored after collapse, but the fallback draft remained editable and its empty `shortPlot` could be sent to PUT. After the request settles, close/reopen works normally; detail errors still require retry before editing can resume. TypeScript and Vite build pass (231 modules). No automated tests, API/data mutations or Docker changes; authenticated Admin UI remains unavailable in the current browser session.


### PublicProfile Following More affordance for anonymous viewers — 25.10.2026

The live phone frame `1023:4597` shows More beside each Following row. `UserFollowRow` now offers the same sheet for anonymous viewers: Follow and Block route to Login, Go to member stays direct, and Done closes. Manual UK393/EN393/UK320/600/720/768/1024/1440 browser review found no document overflow; the More affordance is visible up to720px and hidden at desktop widths. At393/320, rows measure x16/y123/w361 or288/h65 and the panel x16/y522/w361 or288/h295. Done receives initial focus, Tab/Shift+Tab traverse and wrap, Escape closes and restores focus to More. Authenticated Follow/Block still use existing APIs; no API mutation or automated test ran.
npm run verify:build` passed TypeScript and Vite with231 modules. Populated frame content and the authenticated follow state remain unverified against this local API account.


### Owner Reviews frame and current API state — 25.10.2026

Live Figma canvas confirms desktop `363:289` at1440×2859 with profile header, tabs, three review samples and footer; phone `1023:2343` is a standalone owner card with Edit/Delete. Its adjacent editor `1023:2837` has no defined prototype transition. The authenticated Vite route `/uk/profile?view=reviews` exposes one actual API review and localized Edit/Delete controls in the accessibility tree. This does not prove the mobile frame's geometry or map an editor route. Existing owner edit/delete behavior stays on the profile review view; API supports content/rating updates but not review-date changes. No source/API/data changes or tests.


### Film Data spacing recheck and Figma connection status — 25.10.2026

After the rC restart, Figma `whoami` confirms the connector is authenticated as a Full seat on a Starter team plan. `create_session` succeeds for file `BDO9GO1oscOeUTcu4VXVKA`; `get_design_context` for `1162:2305` is still rejected by the Starter MCP call limit. The live Chrome canvas inspector confirms1440×1533. A fresh source-current Chromium preview of `/en/film-data` at1440px measures intro y713 and section headings y845.78/y1008.52 against frame anchors y848/y1010, within2px. `documentElement.scrollWidth` is1440 and scrollHeight1528. This confirms the earlier desktop spacing fix; it is only an anchor check, not full screenshot/pixel parity or mobile review. No code, API, or data changes; no automated tests.


### PublicProfile Watchlist keyboard pass — 25.10.2026

Rechecked Figma phone frame `861:1474` on the live canvas at393×1060; it is grouped with the public profile overview `825:1378` and shows the Watchlist toolbar plus four-column grid. Current source `/uk/users/7748?view=collection&collection=watchlist` in a temporary Chromium preview at393×852 contains one real API item with a null poster URL; its fallback slot measures x16/y123/79×116, and document scroll width is393. On the Filters control, Escape closes the disclosure and restores focus to the 44px trigger. On the selected “До перегляду” tab, Escape closes the disclosure and returns focus to that trigger after the next animation frame. No follow, list, or collection mutation; no tests or source changes. Figma artwork rows/full-height content remain incomparable with the single-item API state.


### PublicProfile phone filter tab hit targets — 25.10.2026

On the mobile PublicProfile collection filter, the inherited40px `min-height` produced43.19px actual buttons at393px. Added a phone-only44px minimum for these collection tabs, matching the existing Own Profile phone control target. Fresh source-current Chromium checks at393px and320px show all three tab buttons exactly44px high, no document overflow, and Escape from the selected tab closes the filter, restores focus to its trigger after the animation frame, and leaves a visible2px focus ring.
npm run verify:build` passes (TypeScript + Vite,231 modules). No API/data changes or automated tests.


### Figma canvas reconnect and selected Films frame — 26.10.2026

After rC reboot, Figma `whoami` confirms the Full seat on a Starter team plan and the existing Chrome canvas is usable. `get_design_context` still returns the Starter MCP call-limit error. Canvas screenshot and inspector identify `1015:2131` as the standalone Profile Films phone frame at393×1162, showing a four-column film grid and bottom navigation. Nearby frames show an own-profile overview and another Films variant. No source comparison was made in this checkpoint; the next step is authenticated `/uk/profile?view=collection&collection=watched` at393px, then EN, focusing on toolbar/grid/nav geometry and Escape/focus. No code/API/data changes, automated tests or Docker actions.


### Own Profile Films phone source comparison — 26.10.2026

Manual Chrome viewport set so the effective layout width is393px. Figma `1015:2131` first poster anchor is approximately x16/y123 with79×116 geometry; the authenticated source preview matches exactly in UK and EN. Source Filters control is44×44 at x333/y50; no horizontal overflow. UK keyboard Escape from the Filters trigger and active tab, plus EN Escape from the trigger, close the tablist and return focus to Filters with a visible2px ring. Local API supplies one watched film versus the numerous Figma sample posters, so only first-item geometry is validated; full poster-grid/content parity remains open. Figma's bottom nav and source fixed nav share bottom anchoring, while captured viewport heights differ. No code/API/data changes, test runs or Docker activity.


### Own Profile Lists phone source recheck — 26.10.2026

Manual authenticated Chrome preview `/uk/profile?view=lists` at effective393px: “My lists” section x16/y598/361×640; cards x16/w361/h189 at y647,848,1049; actual content Watched(1), Watchlist(0), Favorites(1). `documentElement.scrollWidth` equals393px. The selected Figma frame `1017:1841` had previously been inspected and shows custom-list samples; it stayed on Loading during today's navigation, so this entry adds source-current measurements only. No synthetic lists were added. No code, API, account data or tests changed.


### Visible frame inventory bookkeeping — 26.10.2026

This earlier lexical comparison was inaccurate; see the corrected inventory recount below. It is retained as history only and must not be used for current counts.


### Own Profile Reviews/Ratings frame scope clarification — 26.10.2026

Перевірив мапінг кадрів за попередніми current-file доказами та локальним250-frame snapshot. `1023:1867` — phone Profile frame з повним Reviews list, візуально зіставленим із `/profile?view=reviews`; прямий Prototype transition не задано. Для own Reviews підтверджено desktop frame `363:289`. Phone `1023:2343` (картка) і `1023:2837` (редактор) не мають prototype transition або визначеного route; це interaction gap, не phone-route mismatch. У snapshot немає зіставленого окремого Own Ratings phone frame; статус — no confirmed reference до перевірки live inventory. Чинні API маршрути Reviews/Ratings лишаються. Нового screenshot/code/API змін немає.


### Own Profile Settings contract verification — 26.10.2026

Source audit confirms settings persistence is limited to displayName/avatarUrl, social links via existing GET/PUT, and password change. Backend `User` and `ProfileResponse` have no bio, location, pronoun, reply-privacy or banner fields; `ProfileUpdateRequest` accepts only displayName/avatarUrl. This validates the existing gap classification for Figma `1043:2125`. No local-only mock controls or backend/API changes were added; no tests run. The current browser runtime remains unavailable, so this is contract evidence rather than a visual check.


### Legacy prototype frame pairing review — 26.10.2026

Matched five `1112:*` prototype-named frames to current route candidates by label and identical dimensions: Lists `1112:2068` ↔ `1480:6071`; Review `1112:2132` ↔ `1480:6826`; Film `1112:2204` ↔ `61:244`; Profile `1112:2400` ↔ `238:865`; Home `1112:2560` ↔ `472:492`. These are legacy candidates, not verified duplicates; no visual identity was inferred from matching dimensions. Keep child/visual comparison open before final exclusion. No code or tests.


### Figma reconnect after reboot — 25.10.2026

Figma `whoami` and session creation succeeded after the rC reboot. Screenshot `1043:2125` was captured at393×1905 and visually confirms the Settings frame sections: profile fields, favorites reorder, avatar, banner and social connections. The next `get_design_context` request and a repeated screenshot request were rejected by the Starter MCP tool-call limit. This is a partial reconnect, not restored ongoing visual inspection. No source/API/data changes or tests in this checkpoint.


### Snapshot frame inventory recount — 25.10.2026

This earlier 191/59 recount was also superseded by a corrected token-boundary scan; see the current recount below. It is retained as history only and must not be used for current counts.


### Route-candidate source/API crosswalk — 25.10.2026

Read-only inspection of current source and API contracts classifies several remaining local-snapshot candidates without claiming a new visual match. `1480:4797` is an All Films route candidate served by `/films` (`Search.tsx`); comparison to `1413:12611` and phone `1480:9187` remains open. `/lists` supports list CRUD fields, tags, visibility, delete and item reorder, but there is no persisted ranked-state flag and no inline movie search/add editor; the existing add-to-list endpoint is used from Movie Details. `1480:6624`, `1480:6687`, `1480:6809`, and `1480:9494` remain candidate editor/filter/search/ranked states with the corresponding contract differences documented in `FIGMA_HANDOFF.md`; none received a fresh visual review. `1480:6202` lacks a confirmed parent/trigger and `604:848` was unmapped from label/size alone at this historical checkpoint; direct current-Copy confirmation was recorded 26.10.2026 below. No source/API/data changes or tests.


### Secondary archive check — User Lists populated create frame — 25.10.2026

Inspected the read-only screenshot/raw subtree for `1480:9606` under local archive provenance `orb73jiLJnIsZNCRtJsWgS`; this is a different file key from the current Figma target. The 393×852 export shows “New List”, an “Add a film” field, and four sample rows with remove/reorder controls. This corroborates frame structure only; the earlier current-canvas note says the selected field had no Prototype action. Current `UserLists.tsx` does not have inline search/add, while Movie Details already uses the add-to-list API. Kept the interaction as a documented gap and did not add sample data or alter app code. No tests.


### Journal frame candidate 604:848 — secondary raw archive review — 25.10.2026

The local visible-frame inventory labels `604:848` as “КК”,1440×3560. Read-only traversal of its node subtree in the locally decoded `.fig` copy shows editorial story titles/metadata, author rows and footer links, so the content is a Journal-feed candidate rather than an unknown route. Archive provenance is `orb73jiLJnIsZNCRtJsWgS`, different from current target `BDO9GO1oscOeUTcu4VXVKA`; `focused/index.json` and `screens/` contain no focused subtree or PNG for `604:848`. Historical update: on 26.10.2026 the current-Copy direct selection
ode-id=604-848` confirmed the frame name,1440×3560 dimensions and Journal feed screenshot. Current-file identity is now confirmed; populated runtime parity remains open. No code, API or test changes.


### Popularity-period sheet candidate 1480:6202 — local raw subtree and contract audit — 25.10.2026

The decoded read-only archive subtree for `1480:6202` (393×422) contains “Sort by popularity” and options “all time”, “this week”, “this month”, and “this year”. Its archive key is `orb73jiLJnIsZNCRtJsWgS`, not the current Figma key; no focused export or screenshot is present, and the root has no proven parent/trigger. Current `/lists/public/popular` takes page/size only and orders public lists by total active likes; `list_likes.created_at` exists but no date-range ranking is exposed. Record a likely popularity-period UI/API gap, with the route association still provisional. No app/API changes or tests.


### Admin list and user-list settings candidates — local raw/source/API cross-check — 25.10.2026

The old-file decoded subtrees identify `1222:3530` as an Admin Users list (search, active/blocked rows), `1344:6018` as an Admin Edit List/detail with Block, Delete and History of Changes, and `1480:6624` as a user list access chooser with Anyone/Friends/You. Current source/API inspection confirms `/admin?view=users` supports paginated search, role/HQ/status operations; `AdminLists` and `/api/admin/lists` support collection, visibility and delete only. The repository's `findAdminRowById` is called only to serialize the visibility-update response; the controller has no GET-by-id route, nor detail editing/history/block actions. User lists persist only a boolean `ispublic`, so Friends scope is not representable. `1480:9494` is a Ranked list phone candidate; item order/ordinal display are supported but there is no ranked-mode field. These raw frames come from archive file key `orb73jiLJnIsZNCRtJsWgS`, not current Figma, so route identity/visual parity remains open. No source/API changes or tests.


### Figma reconnect and Lists live-ID checkpoint — 25.10.2026

After the rC reboot, Chrome returned the current Figma file tab and local Rewind tab. `figma.whoami` reports Full seat on Starter; a new session is created, but `get_design_context` is still blocked by the Starter call limit. Selecting the live `Lists (svergunova phone)` layer gives node `1480:8280`, inspector size393×1809. Inventory distinguishes it from own Profile → Lists `1017:1841` (`My Profile Page "Profile" phone - Simchuk`,393×1666), so the mappings are consistent. Because the canvas did not show a reliable full-frame view, global Lists remains visually unreviewed. No code or data changed and no tests/build were run.

Manual local source review `/uk/lists/discover` at CSS content width393: hero250px; Featured heading group x16/y284/w361, matching stored Figma anchor y284.1. Featured and Recently liked API feeds are empty; Popular/Recent have real rows. Source Popular poster slots are x16/x227/y461.2,150×87 versus Figma x15/x226.5/y550.3; the vertical shift follows the absent Featured cards. At content widths320/393/600/720/768/1024/1440, `documentElement.scrollWidth` equals `clientWidth`. Mobile Back/Filters links measure44×44; keyboard traversal shows a visible3px focus outline. The Filters link routes to `feed=recent`; there is no filter operation/API, so no new behavior was added. The live Figma Prototype panel exposes Add flow starting point and Add action, with no existing frame-level flow/action. The local `.fig` provenance names a different file key (`orb73jiLJnIsZNCRtJsWgS`) than the live Copy file (`BDO9GO1oscOeUTcu4VXVKA`); archive references were not used as current-file evidence. Figma full-frame capture remains outstanding. No source/data changes, tests or build were run; viewport override was reset afterward.


### Popular Lists page size alignment — 25.10.2026

Current Figma phone frame `1480:7927` is393×1301 and visibly presents four Popular list cards with pagination. The source previously used public-feed default size12. Updated `PublicLists.tsx` to request four records for the Popular feed only and render four loading placeholders; other feeds retain12. Manual Chrome reload at `/uk/lists/discover?feed=popular` confirms exactly four API-backed rows and pagination reporting page1of10. `get_design_context` remains unavailable because of the Starter MCP call limit. The frame’s “Sort by popularity” control is not present in source, and current API supports total active-like ordering only, with no date-period parameter; left as a documented UI/API gap. No tests run; build verification pending.


npm run verify:build` after this change: PASS (TypeScript `tsc --noEmit`; Vite transformed231 modules and built successfully). No tests were run.


### All Films desktop frame identity/state check — 25.10.2026

Read-only live canvas selection confirms `1480:4797` is “All Films (svergunova phone)” in the current file and measures1440×2956. Canvas shows search, genre/year/rating/sort controls, and pagination. Local `/uk/films` AX confirms localized equivalent controls and API-backed list; current response reports203 films,36 visible cards and6 pages, while the frame shows a pagination range through40. Compared only the visible structure and counts at non-matched scales; detailed desktop card anchors and API page-count explanation remain pending; phone UK runtime evidence is recorded separately, while EN and loading/error/empty states remain open. No source/API/data edits or tests.


### All Films phone live frame and source evidence reconciliation — 25.10.2026

Current frame `1480:9187` is confirmed in the live editor as “All Films (svergunova phone)”,393×1215; screenshot shows four columns×six rows, Back/sliders header, Year/Rating/Genre summary and bottom navigation. Earlier source-current UK evidence (also summarized in PLAN) documents the matched393×1215 route capture:24 API films, first poster x16/y307/79×116, zero horizontal overflow at320/393/600/720/768/1024/1440,44×44 Back/Filters targets, visible focus, focus transfer into filters and Escape restoration. The earlier phone-runtime-pending note is superseded. This turn did not repeat those runtime/keyboard checks or run tests. EN and loading/error/empty state comparisons remain pending.

### All Films EN empty-state manual review — 25.10.2026

At the local desktop route `/en/films?q=rewind-no-match-20261025`, the real search API returned zero results. Chrome AX and screenshot show the English empty message (“No films found.”), zero count, localized controls and no results/pagination. No fixture or API data mutation was used. EN loading/error/retry, keyboard traversal and responsive matched-width review remain open. No code changes or tests.


### All Films EN populated-state manual review — 25.10.2026

At `/en/films`, Chrome AX shows localized search/filter labels, Previous/Next and footer, with203 API films and36 visible records on rage1of6. Earlier same-turn `/en/films?q=rewind-no-match-20261025` showed the localized no-results message and count0. Both states use live API responses; no fixture or API data was changed. No keyboard, loading/error/retry or responsive EN checks in this pass.


### All Films EN error and retry manual review — 25.10.2026

At `/en/films?genreId=invalid`, the API rejected the invalid numeric parameter; UI rendered the English error alert and Retry. Clicking Retry repeated the failed request and preserved the error message and controls. The page exposed “Loading films…” during the request. This covers invalid-request failure only; an unavailable-server simulation remains unverified. No source/data changes or automated tests.


### All Films EN keyboard traversal — 25.10.2026

At the available desktop viewport, manual Tab traversal reaches the site logo, primary nav, global search, film query, Search, Genre, Year, Minimum rating, Sort by, Apply, and first poster in order. The first poster shows a visible cyan outline and scrolls into view. This does not cover native-select operation, phone viewport or error-state focus. No source/API change or test.


### Figma access recheck after rC reboot — 25.10.2026

`figma_whoami` authenticates the account (Full seat on Starter) and `create_session` succeeds for the current file. A fresh `get_design_context` call for live All Films phone `1480:9187` still returns the Starter MCP tool-call limit. Chrome canvas navigation to global Lists `1480:8280` confirms the selected layer and inspector dimensions393×1809; the canvas viewport shows only a cropped section, so no full-frame comparison is claimed. Local `/uk/lists/discover` AX shows empty Featured and Recently liked feeds with real API-backed Popular and Recent records, consistent with the existing recorded data/anchor difference. No source/API/data changes, tests or build in this access check.


### Admin Edit Film current-canvas/runtime gate — 25.10.2026

Live Figma frame `1260:4840` is selected and inspector confirms1440×3128. The visual form exposes Name, Duration, Status, Original Language, Poster, Year, Genre, Description, Director and Main Actors plus review/popularity aggregates. Current source and backend contract support write fields for title, duration, release date/year, rating, photo URL and short plot; Status, Original Language, Genre/credits writes and review aggregates remain documented contract gaps. Manually opening local `/en/admin?view=movies` redirects to `/en/home`; this browser session is not authorized as admin, so do not count admin runtime, keyboard or form parity as checked. No data/API/source changes; no tests or build.


### Admin editor request race fix — 25.10.2026

Code review found the DOM-trigger identity guard did not distinguish overlapping edit requests when the same row was selected again (A → B → A). Added an editor request generation ID and use it to ignore stale success/error/finally responses and invalidate pending work on reset.
npm run verify:build` passed: TypeScript check and Vite production build transformed231 modules. The accessible local browser session is not an Admin, so no authorized UI interaction or post-fix runtime smoke was possible. No tests or data mutations.


### Movie Details phone frame/data recheck — 25.10.2026

The current Figma canvas selected frame `560:1003` (“Film Page - phone Simchuk”), inspector393×1908; visible sections include Dune imagery, Cast & Crew, two review cards, Similar Films, Storyline and phone navigation. Local `/uk/films/3940` returns another API record with no poster/backdrop/cast/similar movies and one review; its trailer state is “not added”. This was a source/content state check at the available desktop browser viewport, not a matched393px geometry comparison. No static or persisted data was changed; no tests run.


### Account Deletion reboot structure recheck — 25.10.2026

Figma Chrome canvas confirms current frame `1176:2515` at1440×1748. Local `/en/delete-account` exposes Purpose, the four-item “What happens after deletion” list, Security and Privacy, and Policy Updates in matching order. This does not verify exact geometry or footer composition; no matched-size screenshot was taken. The route's AX tree has no standalone deletion CTA, and account deletion remains linked from Account Settings. Keep CTA/footer parity open pending a matched visual check; do not alter the existing safe account flow from this structural evidence alone. The Figma MCP `get_design_context` call remains blocked by the Starter limit; the browser canvas is available. No source/API/data changes, build or tests.


### Auth desktop live-frame and source check — 25.10.2026

Live Figma screenshots and inspector confirm `605:2175` is Login (1440×1614), `605:2176` Register (1440×1752), and `605:2174` Forgot Password (1440×1614); `605:2173` is a distinct welcome/auth-entry screen with Create Account and Log In buttons. At the available1920px Chrome window, current EN Login and Register each render a centered card starting around y313 with ~620px input widths, consistent with the desktop frame's card/form scale after normalizing the canvas zoom. This is a top-anchor/width check only. Figma Login includes Remember me and Google sign-in; Register includes Google sign-up. Current source has no OAuth flow/provider and no selected session-persistence mode for Remember me, so keep these as explicit behavior/provider gaps. Source AX confirms localized field labels, password visibility toggle, Forgot Password navigation and Login/Register cross-links. No form was submitted; no API/data changes, build or tests.


### Auth phone geometry, page-height and keyboard verification — 25.10.2026

Current live Figma canvas shows mobile Login `944:1582` selected at393×852 and the adjacent Register/Forgot frames `944:1828`/`944:1887` at the same size. Manual browser viewport checks confirmed EN Login, Register and Forgot at320/393/600/720/768/1024/1440 and UK at320/393/1440 with no horizontal document overflow. At EN320/393/600/720 all three pages are exactly852px tall. Before the CSS change, the source page heights were969–1177px: each card retained a desktop minimum and global body CSS reserved70px for mobile navigation that these Auth pages do not render. The shared Auth route marker now removes that unrelated body padding; route cards use an852px phone minimum while preserving their content. Source anchor measurements at EN393: Login title169, email364, password437, Forgot494, button538; Register title101, fields290/364/437, button538; Forgot title351, email464, button539, account link740. These match the corresponding Figma anchors within1px except the Login/Register account links: source y601/y599 vs Figma y740/y738 because Google sign-in/up is unavailable. The Figma Login Remember me checkbox is also missing due the session-persistence gap. Login keyboard traversal reached Back, Email, Password, Show password, Forgot password, Log in and Create one; every stop had a visible3px cyan focus outline. The reset route's missing-token error state now remains within852px and has no horizontal overflow; no full-page reset frame exists.
npm run verify:build` passes (`tsc --noEmit` plus Vite,231 modules). No tests or auth/API data changes; no form was submitted.


### Reconnected Figma and UK Auth keyboard checkpoint — 25.10.2026

After reboot, Figma `whoami` and `create_session` succeeded for `BDO9GO1oscOeUTcu4VXVKA`; `get_design_context` for current selected node `1015:2131` still failed with the Starter plan call limit. The Figma browser canvas and the local Rewind tabs are available, so manual inspection continued without retrying MCP reads. On local `/uk/login`, `/uk/register`, and `/uk/forgot-password` at393×852, keyboard traversal reached the expected localized controls in order. A screenshot of UK Login showed a visible cyan focus ring around the submit control. No form was submitted; no source, API or data changed. Automated tests remain deferred; Auth loading/error/success and full Reset parity are still open.


### All Films EN offline API error, responsive and native-select review — 25.10.2026

In a separate local tab, loaded `/en/films` with203 live API records. Temporarily blocked only requests matching `/api/*` after the page had loaded; selecting Genre → Action and pressing Apply displayed the expected “Could not load films. Check that the API is running.” alert. Retry repeated the error while the API path was blocked. The block was removed, Retry recovered live data, and the tab was closed after checks. At layout viewport320/393/600/720/768/1024/1440, `scrollWidth` equaled `clientWidth`; browser `innerWidth` retained the requested viewport widths. Keyboard operation on the native Minimum rating select changed Any →1+ with ArrowDown/Enter, then was reset to Any without applying. No source/API/persistent data changed and no automated tests ran. Matched desktop frame anchors remain pending.


### All Films desktop frame identity and source geometry — 25.10.2026

Live current-file URL
ode-id=1413-12611` opened “All Films (svergunova)” and inspector confirmed1440×2956. At the fit view, the frame displays six poster columns; the source at a1440px content width measures a1200px grid from x120, six columns, poster links174.16×260.22 and31px horizontal gaps. Its first row starts at y704.77. Column density and poster ratio appear aligned; exact y-anchor parity still needs a matched-scale measurement. The old `1480:4797` ID is now treated as an alternate candidate rather than the primary desktop mapping. No source/API/data change or tests.


### All Films desktop exact canvas anchors — 25.10.2026

After reboot, Chrome Figma search and inspector confirmed two same-name 1440×2956 frames: standalone `1480:4797` at X3885/Y22577 and duplicate `1413:12611` nested under “Group 415” at X−39845/Y4935. The standalone frame is the primary mapping. Its title row `1480:4875` is X120/Y281/W1200/H45; filter group `1480:4878` is X989/Y294/W331/H49; results strip `1480:4867` begins at Y379; poster-grid group `1480:4818` is X121/Y607/W1199/H1810. Source-current EN `/films` at1440px has a first-poster Y of704.77, 97.77px below the frame; source composition also has a taller hero and separate filter panel. This supersedes the earlier pending-anchor and “column density aligns” notes. No code/data change and no tests; next step is the scoped desktop layout correction followed by manual matched-width review.


### All Films desktop layout correction and manual preview — 25.10.2026

Updated `frontend/src/pages/Search.tsx` and `Search.module.css` for desktop widths≥1400 to align the title/filter/query-strip and poster-grid composition with current Figma anchors `1480:4875`, `1480:4878`, `1480:4867`, `1480:4818`. The CSS geometry sets title Y281, filter Y294, query/count bar Y379, hero end Y525 and first poster Y607. Results stay API-backed; the EN page showed203 records/6 pages. Search control ordering changed: sort moved into the query row, while Genre/Year/Minimum rating/Apply remain a grouped filter form. The result count appears in the localized query placeholder and is still exposed by the live status node. The mobile open-filter effect now focuses the first visible Search input; Escape behavior remains. Manual Chrome checks: EN and UK labels, query “The Wrecking Crew” returned1 real API result, a no-match query showed the empty state, invalid genre showed the API error and Retry, and the search field received a visible focus ring.
npm run verify:build` passed after changes: TypeScript and Vite,231 modules. No automated tests, API/data mutation, Docker update, commit or push. Phone width and 600/720/768/1024 post-change visual checks remain open.


### Figma MCP limit and snapshot trace-coverage recheck — 25.10.2026

After reboot, `figma_create_session` succeeds, while current `get_design_context` and `get_screenshot` calls return the Starter MCP call-limit message. In Chrome, the selected live All Films phone layer `1480:9187` has inspector dimensions393×1215; the canvas did not center/render the selected frame in this view, so this is not a new visual comparison. A read-only scan of `figma-visible-frames-now.txt` (snapshot last written22.10.2026) found250 unique IDs; all250 appear somewhere in `docs/frontend/FIGMA_HANDOFF.md` (0 missing mentions). This is trace coverage only: it does not establish per-frame classification or visual completion. No source/API/data changes, build, tests, or Figma edits.


### All Films phone fit, filter focus and sort contrast — 25.10.2026

Current-source `/uk/films` and `/en/films` were manually reviewed at320×1215 and393×1215 after the DOM reorder. UK/EN both have no horizontal overflow. At320, the Ukrainian title had grown to≈26px and overlapped the Year/Rating/Genre summary; the `max-width:340px` title is now14px. The title text is x10/width52.31 and the summary begins at x95, leaving32.69px; EN title width36.58 leaves48.42px. At393, the source retains the Figma phone poster anchor x16/y307/79×116; the summary is x162/y134/215×31. At320, the first poster is x10/y315/70.5×103.52. The UK/EN keyboard flow opens Filters with focus on the visible Search field; Escape closes it, sets `aria-expanded=false`, returns focus to the44×44 Filters button and shows a3px cyan ring. Phone document widths equal320/393.

EN `/films` was resized manually through600/720/768/1024/1440; no horizontal overflow. The grid shows4 columns through768,5 at1024 and6 at1440, with24/30/36 API cards. At1440, the first poster is x120/y607/174.16×260.22. The Sort select previously rendered black text on an rgba(35,35,35,.82) background; it now uses white text. Its keyboard focus has a visible3px cyan ring.
npm run verify:build` passes TypeScript and Vite (231 modules). No automated tests or API/data changes.


### Global Search compact phone responsive correction — 25.10.2026

The rebooted Chrome session can open the Figma canvas directly, although the Figma MCP `get_design_context` call remains blocked by the Starter quota. Selected frame `1480:8464` is “Search Results all”,393×995; its screenshot confirms the compact composition (poster rail, two review cards, Show more CTA, fixed bottom navigation). Corrected the phone match-row bottom margin in `GlobalSearch.module.css` from6px to13px after confirming the first poster sat7px above the Figma y267 anchor. Manual current-source measurements at UK/EN393: poster x16/y267/79×116; first review x16/y415/361×168; Show more y799/48px. UK320 poster is x16/y267/60.8×89.2; UK320/393 and EN393 have no horizontal overflow. Show more has a visible cyan3px focus outline and Enter reveals the additional API-backed results with focus moved to the results panel. Figma sample imagery/text does not match live API data; no static assets, fixtures or API records were introduced. Expanded phone `1480:8934` remains a distinct unreviewed variant.
npm run verify:build` passes TypeScript and Vite (231 modules). No automated tests, API/data changes, Docker update, commit or push.


### Global Search empty phone navigation comparison — 25.10.2026

Chrome Figma canvas selected no-matches frame `1480:8856`; inspector reports393×852. The frame has EN copy matching the source, a Back to home CTA, and only Add/Journal/Profile in bottom columns3–5. The local empty route had five nav links; source now marks its empty result and hides Home/Search only while
ooatches` is active, leaving the three links at the right positions. UK/EN at393 and UK at320 show no horizontal overflow; Tab traversal reaches Add → Journal → Profile. Ordinary search remains five items.
npm run verify:build` passes (TypeScript + Vite,231 modules). No automated tests or API/data changes.


### Global Search expanded frame audit status — 25.10.2026

Selected expanded frame `1480:8934` is393×2801 in the live Figma inspector. A later zoom-to-selection screenshot exposed its lower Journal row: three article cards and a More link. The upper/middle layout and full-frame geometry are still not captured. Local UK `/search?q=film` expansion shows12 API films and12 reviews, keeps document width393, measures3220px document height, and transfers focus into the results panel. Current API data does not return the other result categories for this query. Keep exact expanded-frame geometry and content-density parity open; do not claim full visual verification. No API/data changes or tests.


### Current checkpoint — Journal search responsive states — 25.10.2026

Figma `1480:8889` (Journal Articles phone,393×1150) is selected in the live canvas and its inspector dimensions are confirmed, but the canvas did not frame the selected node for a matched screenshot. Figma `whoami` and `create_session` succeed after reboot; `get_design_context` still returns the Starter MCP call-limit error. Local live-data `/search?q=film&tab=journal` was manually reviewed in UK and EN at320/393/600/720px: Journal count is0, localized no-results copy is present, and document width equals viewport in all eight cases. This is the observed API result for this query, not evidence of a missing endpoint. No static article content, source/API/data change, build or tests. Keep the Journal phone visual comparison and broader route/state audit open.


### Global Search Lists populated result checkpoint — 25.10.2026

Live layer selection confirms phone frame `1480:8804` (“Search Results lists”,393×852). Earlier the canvas did not pan the selected node into view; the 26.10.2026 follow-up selected and visibly rendered it. Figma shows two361×189 cards at x16 with24px gap and fixed bottom navigation. With the real local list title as query (`Journey`), UK and EN `/search?q=Journey&tab=lists` return4 lists and5 users; other categories are0. Prior local393 measurements are361×189.25 cards at x16 with24px gaps; at1440 they are1200×339 at x120 with38px gaps. `documentElement.scrollWidth` equals the viewport at both widths in both locales. The first EN result receives a visible3px cyan keyboard outline and links to the existing public-list route. Card geometry aligns at393; content density differs (Figma has five posters, API records one film per list), so keep real data and no placeholders. No fixtures, form submissions, source/API/data changes, build or tests.


### Global Search Reviews phone canvas and live result check — 26.10.2026

Current-Copy Figma `1480:8631` (“Search Results reviews”) is visibly selected; inspector confirms393×1139. It shows the search header, vertically stacked review cards with poster/title/rating/date/excerpt and fixed five-item bottom navigation. A local Chromium capture was rendered and visually inspected at the same393×1139 viewport for UK `/uk/search?q=film&tab=reviews`. Shared anchors align: first card x16/y267/361×168, poster79×116,24px vertical gaps and fixed bottom navigation. `scrollWidth=393`. UK API returns101 live review results (152 Films; Users/Lists/Tags/Cast & Crew/Journal0). Figma uses Dune copy/posters while current API returns concurrent records, and some movie posters are missing so the source fallback is visible; no fake data added. Follow-up after the date change confirms EN geometry and keyboard focus too (see next entry).
npm run verify:build` passed TypeScript and Vite production build (231 modules). No automated tests, source/API/data changes.


### Search Reviews phone post-date UK/EN and focus verification — 26.10.2026

After localized `<time>` was added, rechecked Figma `1480:8631` (canvas screenshot; inspector393×1139) against current UK and EN runtime captures at393×1139. Both locales retain first card x16/y267/361×168, poster79×116, subsequent card pitch192px, bottom nav y1047/393×92, and `scrollWidth=393`. UK dates display as `20 жовт. 2026 р.` / `19 жовт. 2026 р.`; EN as `20 Oct 2026` / `19 Oct 2026`. Keyboard traversal leaves visible focus rings on Back, Filter, category navigation, results panel and review links; no link was activated. The Figma canvas shows four populated Dune sample cards with dates; API content/posters differ, so this verifies composition and date presentation, not sample-data parity.
npm run verify:build` passed TypeScript and Vite production build (231 modules). No automated tests or source/API/data changes in this follow-up. Figma `get_design_context` worked once after reboot; the subsequent dedicated screenshot call returned the Starter MCP call-limit message, so visual inspection used the open canvas and saved local captures.


### Own Watchlist EN authenticated-route check — 26.10.2026

Opened Figma node `1015:3356` on the current canvas; its inspector confirms393×1564 and the visible phone shows Watchlist selected, “Wants to see”, sample poster grid and fixed bottom nav. Navigated the authenticated Rewind tab to `/en/profile?view=collection&collection=watchlist`; the accessibility tree confirms the canonical Watchlist route and the current API empty state. The browser control cannot emulate a CSS viewport, so this 1920px-wide source view does not establish phone geometry/focus parity; leave EN matched-width open until a supported viewport mechanism is available. No clicks changed data, and there were no code/API/data changes, builds or tests.


### Owner Avatar & Banner settings EN contract follow-up — 26.10.2026

The current-Copy Figma frame `251:660` is selected and fully visible on the live canvas at25% zoom; inspector reports1440×3120. It shows separate avatar and banner previews with Select new avatar and Select new banner actions. The authenticated Rewind tab at `/en/profile?settings=avatar` exposes the Avatar URL form, URL field and Save action in its accessibility tree. `frontend/src/api/profile.api.ts` limits profile updates to `displayName`/`avatarUrl`; backend `ProfileUpdateRequest` and `ProfileResponse` carry `avatarUrl` only, and `ProfileController` has no banner/upload route. Banner upload/persistence is a confirmed API/feature gap; no local-only preview or fake upload was added. Runtime screenshot width is1920px, not the1440px Figma width, so EN geometry/focus remains open. No source/API/data/Figma changes, build or tests.


### Owner Connections settings EN contract follow-up — 26.10.2026

Reopened current-Copy frame `341:3207`; inspector reports1440×2073 and the screenshot shows social-platform cards for X and Instagram, with X marked Connected and Instagram offering Connect. Authenticated EN `/en/profile?settings=connections` exposes URL fields for Website, Instagram, TikTok and Letterboxd plus Save. Backend `ProfileService.SUPPORTED_SOCIAL_PLATFORMS` and frontend `socialLinkPlatforms` contain only those four platform keys; there is no X OAuth, connection, or avatar-import route. Existing URL editing remains live API-backed; Figma OAuth/connect/import behavior is a documented functional gap. Screenshot viewport is1920px, so EN geometry/focus, form errors/retry and mobile remain open. No submit/mutation, source/API/data/Figma changes, build or tests.


### Global Search Journal phone populated-frame and empty-live-state follow-up — 26.10.2026

Figma `1480:8889` is visibly selected on canvas; inspector confirms393×1150. The populated variant has three stacked Dune article cards and a fixed three-item Add/Journal/Profile bottom navigation. A local Chromium screenshot of UK `/uk/search?q=film&tab=journal` at393×1150 has Journal count0, localized empty copy, hint and Home CTA; `scrollWidth=393`. The live API currently has no Journal result for this query, so the Figma populated card copy/images cannot be visually matched against real records. The observed route is the documented empty/data state, not an API failure; do not seed sample article content. Keyboard traversal from the current document reaches bottom nav links, Back, Filter, the category selector, focusable results panel and Home CTA; CTA shows cyan3px outline and is at x149/y478/95×32. Results panel bounds are x16/y157/361×393 with gold2px focus outline.
npm run verify:build` passed TypeScript and Vite (231 modules). No tests, source/API/data changes.


### Global Search users phone — matched frame and responsive follow-up — 25.10.2026

Live Figma frame `1480:8709` (“Search Results cast/members”,393×852) was fully visible on the canvas. The four sample user rows are each about52px high with24px gaps; the selected frame is a community-user result layout, not TMDB cast/crew. Current `/search?q=Journey&tab=users` returns5 real users in both locales. Manual UK/EN source checks at320/393/600/720/768/1024/1440px show `scrollWidth === viewportWidth`. At393 the first card starts x16/y274, measures361×52; all five rows are 76px apart. On desktop (1440) the centered content is1200px wide and the user row is120px tall. Keyboard focus on the first card shows a3px cyan outline with3px offset. This visually confirms two Figma/API differences: the static frame contains four users while this API query returns5; its subline shows follower/following counts, but the public search DTO provides neither count, and the response's null avatar uses the initials fallback. Preserve the real API result and fallback; do not invent counts or add per-card requests. No source/API/data changes, build or tests. This closes the matched screenshot and responsive/focus review for this single user-results frame; other Search variants remain open.


### Global Search Tags desktop and phone — matched visual checkpoint — 25.10.2026

Current live Figma canvas screenshots show phone `1480:8767` (393×852) with seven Dune chips across three rows and desktop `1480:7445` (1440×1024) with13 chips across two rows. Matched-size current-source EN desktop `/search?q=e2e-tag&tab=tags` places the search field at y210 (Figma≈212), results heading at y301 (Figma≈303), and first chip row at y377 (Figma≈380); the 12-column desktop composition and spacing align within≈3px. Local live API returns4 tags for `e2e-tag`; Dune sample content in Figma does not reproduce in the local dataset, so no fake tags were introduced.

UK/EN phone-responsive review of `q=e2e-tag` at320/393/600/720/768/1024/1440 showed `scrollWidth` equal to viewport at every width. Chips wrap as1/2/2/3/3/4/4 columns respectively; at393 they are146.8×31px, starting x16/y274 with8px column and7px row gaps. At393, first chip keyboard focus displays a3px cyan outline with3px offset; its real link points to `/lists/discover?tag=e2e-tag-61571661`. No source/API/data change, build or tests. This closes matched screenshot/responsive/focus review for the Tags desktop and phone frames; other Global Search result variants remain open.

### PublicProfile mobile followers keyboard and action review — 25.10.2026

On the current Vite preview, `/uk/users/7749?view=followers` at393×852 renders one live API follower row at x16/y123/361×65 with44×44 More and Follow targets; document width remains393. The account is viewed as a guest, so the sheet displays Follow and Block links to sign-in, Go to member, and Done. Opening More puts focus on Done; Tab reaches Follow, Shift+Tab returns to Done, and Escape closes the sheet and restores focus to More with a visible focus indicator. No follow/block mutation, code change, automated test, or build was performed. This rechecks current source behavior against the existing `1023:4597`/`1033:5681` mapping, but does not establish a new matched Figma screenshot or pixel parity.


### Global Search Lists live-source responsive recheck — 25.10.2026

After reboot, Figma authorization, session creation, and the Chrome canvas work; MCP `get_design_context` remains blocked by the Starter call limit. The phone frame `1480:8804` is mapped as393×852, but the selected node is not visible on the current canvas, so this is not a matched screenshot comparison. Manually reviewed real `/uk/search?q=Journey&tab=lists` at393/1440px and `/en/search?q=Journey&tab=lists` at393px. Four live list links appear; first card geometry is361×189.3 at x16 on phone and1200×339 at x120 on desktop. Viewport width equals document width, and EN keyboard focus has a visible3px cyan outline. One real preview movie has a null poster URL and renders the existing title fallback. No source/API/data change, build or automated tests. Keep this frame partial and its screenshot comparison open.


### PublicProfile Following empty live-data recheck — 25.10.2026

Manually reviewed source-current `/uk/users/7749?view=following` and `/en/users/7749?view=following`. The live API currently returns an empty page; localized message begins x16/y123 at393px and measures361×23.2, with document width393. At1440px the section measures1200px wide at x120/y1317 with127.2px height; empty message y1421, document width1440. This rechecks the empty state only; it is not a matched Figma screenshot, and populated Following/pagination remain open. No code/API/data change, build or tests.

### PublicProfile Lists live empty-data responsive follow-up — 25.10.2026

Manually reviewed /uk/users/7748?view=lists and /en/users/7748?view=lists on the current Vite preview. Both real API responses contain zero public list links. The localized empty message begins x16/y123 and measures361×23.2 at393px; document width is393. At1440 the section is x120/y1269/w1200/h128.2, empty message y1374, and document width is1440. Figma Crew Lists frames 1480:9718/1480:9814 contain populated sample cards and tags; this account’s response cannot establish populated parity. Keep actual data and document the sample/data gap. No code/API/data change, build or tests.

### Own Profile Following desktop Figma/API gap — 25.10.2026

Current Figma frame 445:455 is selected and visibly shows the Following view at50% canvas zoom; the inspector reports1440×3863. Visible rows have avatars/names, follower/following sublines, Watched/Lists/Likes counters and follow controls. The current authenticated local /uk/profile?view=following shows an empty API page, so there is no populated row for geometric comparison. In code, PublicNetworkUser is limited to id, username, displayName and avatarUrl; the backend has no corresponding per-user watched/list/likes fields on the followers/following response. Record the mismatch as an API/data-contract gap; preserve real empty data and do not add speculative requests. No code/API/data changes, build or tests. Phone, EN, pagination and source/design parity remain open.

### Own Profile Followers desktop frame confirmation — 25.10.2026

Current-file Figma node 363:411 is selected; its inspector reports1440×3863. Canvas content says Followers although the layer is named Following. Rows visibly include user identity, Watched/Lists/Likes counters and a plus follow-back action. The current authenticated /uk/profile?view=followers page has zero rows. Backend FollowService returns PublicUserResponse with id, username, displayName and avatarUrl only; frontend PublicNetworkUser matches that shape. Counts remain a confirmed shared data-contract gap with the separate Following frame 445:455. No code/API/data changes, build or tests; responsive/locale/keyboard and populated-row parity remain unverified.


### Global Search Reviews phone date field — 25.10.2026

Figma layer `1480:8631` is selected as “Search Results reviews”; inspector confirms393×1139, and the visible canvas contains poster/title/rating, author/date, and excerpt rows. `SearchReview.createdAt` was available in the current API contract but not rendered. Added `<time>` with localized date-only output: UK sample `20 жовт. 2026 р.`, EN `20 Oct 2026`. Manual live UK/EN DOM checks show dates on the six loaded results; desktop EN screenshot shows the author/date pair.
npm run verify:build` passed (TypeScript + Vite,231 modules). The pending post-change phone review noted here was closed by the 26.10.2026 follow-up above. No API/data change or automated tests.


### Global Search Journal phone visibility check — 25.10.2026

Selected current-file node `1480:8889`; Figma inspector reports393×1150. The layer visibility control is off, so the frame is not rendered in the canvas. Did not toggle visibility. The live Journal API returns0 results for `q=film`, which cannot establish populated-frame parity. Keep the phone state open for a future visible review. No source/API/data changes, tests, or build.

Selected Search no-matches phone node `1480:8856`; inspector reports393×852 and the layer visibility control is off. Left it hidden. This identifies a hidden inventory candidate only; it is not visual evidence of the empty-state frame. No source/API/data changes, tests, or build.

25.10.2026 — Selected current-file Figma Search Reviews desktop node `1480:7311`; inspector reports1440×2176. Canvas shows the search/results header and vertically stacked review cards. The canvas image was too soft for trustworthy spacing or typography measurement; record structural review only. Existing desktop source evidence shows the localized review date, but exact 1440px geometry remains open. No code, API, data, build, or tests.

25.10.2026 — Current Figma canvas shows Search Lists desktop `1480:7490` at1440×1518. Two visible cards contain poster rails, titles/counts and descriptions. At51% canvas zoom their cards are about1200×339 with38px spacing, matching existing1440 source measurements for `/search?q=Journey&tab=lists` (x120,1200×339,38px gap). Current source screenshot/API shows four one-film lists with null poster URLs; the design's five-poster/25-film sample is not present. Preserve real data and existing fallbacks. This closes desktop card-geometry comparison for this frame only; no source/API/data changes, tests, or build.


25.10.2026 — After reboot Figma whoami and create_session succeed, but both get_design_context and get_screenshot are denied by the Starter MCP call limit. Chrome inspector confirms Search Lists phone 1480:8804 is 393×852 and visible; current canvas viewport did not frame that node, so this is inventory evidence only, not a matched screenshot. Verified the selected object opacity at 100% after undoing an accidental zoom-key edit. No layer visibility, source, API, or data changes; no build or tests.



### Corrected frame inventory recount and Figma key — 25.10.2026

Re-read the local snapshot and current handoff using an exact node-token boundary check:250 snapshot rows,250 unique IDs,250 IDs referenced in the handoff,0 missing textual references. The main route crosswalk contains70 grouped rows and190 unique snapshot IDs;60 additional IDs have non-route classifications. The former eight hierarchy-sensitive nodes are visually classified in the current canvas and are no longer ambiguous, though the stale snapshot does not establish the full live inventory. Earlier165/85,181/69, and191/59 figures are historical and superseded; this recount is textual bookkeeping, not route parity. Corrected the handoff's seven misspelled Figma file-key references to the live key confirmed in the connected Chrome URL (`BDO9GO1oscOeUTcu4VXVKA`). No source/API/data/Figma changes, builds, or tests.



### Live-canvas classification of eight snapshot candidates — 25.10.2026

Current Figma canvas screenshots resolve the remaining ambiguous snapshot nodes: `1423:4557` (1440×1252) is a Rewind logo/color/app-icon brand board; `551:900` (178×468) and `551:944` (258×864) are decade and genre dropdown variants; `1389:3593` (746×96) is the Admin profile navigation group; `1360:3386` (269×102) is a cast/member identity rail; `1360:3390` (316×149) is a three-poster rail; `1480:11279` (18501×22693) is a mixed UI screenshot/presentation collage group; and `1237:4689` (61312×34737) is an organizing group that encloses many boards. None is an additional standalone route state; child product frames stay separately inventoried. This reduces the ambiguous subset of the stale snapshot from8 to0. It does not close route/state visual parity or establish the complete current live-file inventory. No layer visibility changes, Figma edits, source/API changes, builds, or tests.


### Global Search Journal desktop — 25.10.2026

After reboot the live canvas visibly showed Figma node `1480:7549` (“Search Results journal articles”),1440×1149: search header, three horizontal Dune article cards, and footer. The earlier hidden-layer note for this desktop node is superseded. Local `/en/search?q=Dune&tab=journal` returned `Journal (0)` and the empty state; do not replace this with static Figma article content. This establishes a current data/content mismatch only. The source viewport was not matched to1440px, so geometry parity is still open. Phone node `1480:8889` did not render a readable frame in this pass. Figma `get_design_context` remains Starter-quota limited. No source/API/data changes, build, or tests.


### Global Search Journal phone frame — live canvas follow-up — 25.10.2026

A fresh Figma tab visibly shows `1480:8889` (“Search Results journal articles”),393×1150: three vertically stacked Dune article cards with title/excerpt content and a bottom Add/Journal/Profile rail. This supersedes earlier hidden/unreadable notes for this phone frame. Local `q=Dune` returns0 Journal results, but the source viewport was not393px; no matched geometry claim. Structural frame review only; locale, keyboard, responsive and populated API result checks remain open. No layer visibility/Figma edits, source/API/data changes, build or tests.


### Global Search All phone — 25.10.2026

Current Figma `1480:8934` is visible,393×2801. Full-height overview plus readable mid-frame inspection confirms the All results structure: Reviews, Users, Tags, Lists and Journal, followed by bottom navigation. Examples show review cards, user rows, tag chips, list poster rails and Journal story cards. Local API `/en/search?q=Dune` returns0 in every category and shows the genuine All empty state; Figma examples are sample content, not live parity evidence. Structural review only; source viewport not matched to393px and no keyboard/responsive/locale/error/loading comparison. No-matches phone `1480:8856` remains hidden and was not enabled. Its visibility was restored to the original off state after a transient accidental toggle and verified at Value0. No persistent design or code changes; no build/tests.


### Global Search Lists phone visual comparison — 25.10.2026

Live Figma canvas frame `1480:8804` is visible,393×852, at90% zoom. It shows two cards with five-cover overlapping poster rails, title/count and bottom navigation. Estimated card bounds≈361×190 at y≈268/482 with≈24px spacing agree within a few pixels with recorded source measurements (x16/y267/361×189.25 and y480.25). Current local EN `Journey` query returns4 real lists with1 film each; sample Dune card content is not injected. Geometry comparison is now visually supported; card content, locale, keyboard, other states and wider responsive checks remain open. A transient layer visibility change during selection was restored to visible=on and rendering rechecked. No persistent design/code/data changes, build or tests.


### Global Search Reviews desktop — 25.10.2026

Figma `1480:7311` (1440×2176) is visibly reviewed on the current canvas. Four stacked review cards, poster column, title/rating, author/date, excerpts and footer are present. At35% zoom the approximate card geometry is1200px width,315–320px height,38–40px spacing, aligning with current source CSS (315px minimum height,38px grid gap) and the1200px content rail. Live EN query `q=film` returns101 reviews and the UI renders6 (`size=6`); Figma shows4 static Dune examples. Record this as an unresolved sample/card-count semantic difference; do not silently change page size or invent pagination. No exact pixel claim, matched viewport, phone recheck, source/API/data change, build or test is recorded.


### Service Contact canvas checkpoint — 25.10.2026

Opened current-file Figma 1122:2497; inspector confirms 1440×1920. The live canvas shows the Contact hero, navigation rail, three sections and footer. EN headings and bullet groups match the current ServicePage content. The design's three emails are examples; the runtime keeps the user-confirmed anonimua910@gmail.com address. Figma MCP session creation succeeds, but structured context remains blocked by the Starter call quota. This confirms frame identity and section/content mapping only; no matched runtime geometry is claimed. No code/API/data change, build, or test.


### Rules frame structural check — 25.10.2026

Opened Figma node 1164:2790; inspector confirms 1440×2469. Its nine Rules of Use sections and order match the EN section data in ServicePage, with a list under Prohibited Conduct and the shared footer. Visual body-spacing parity and the live route at matched width remain unverified. No code/API/data changes, build, or tests.


### Privacy Policy frame and copy review — 25.10.2026

Opened Figma 1164:2679 (1440×2022) and live /en/privacy. Five section headings/order align with ServicePage. The copy differs on what information is collected and whether profile privacy settings exist: the Figma sample names device/browser/IP, page views/likes/reviews and privacy settings; runtime describes technical request/session details and other account activity, and links to profile editing/account deletion. This is an unresolved policy-fact check; do not copy claims from the static design until they are verified against actual data practices and owner-approved policy. Local browser width was 1890px, so this was a structure/content check, not matched geometry. No code, API, or data changed; no build or tests.


### Privacy Policy EN keyboard focus — 25.10.2026

On local /en/privacy, keyboard traversal reached the profile-update link in the Your rights section. Screenshot shows a visible cyan focus outline. This is one desktop EN interaction check; no UK/mobile or full-route keyboard claim. No code/data changes, build, or tests.


### Public List ranked/unranked distinction — 25.10.2026

Live canvas shows normal desktop list 1480:6071 with no poster numbers and ranked desktop 1480:6134 / phone 1480:9353 with ordinal labels. Normal phone 1480:9302 is hidden (visibility0), left unchanged. Source emits movie indexes but responsive CSS hides them at ≥1024px and ≤640px; they appear only at641–1023px. The public detail DTO and MovieList have no ranked flag, so desktop/phone ranked labels cannot be represented and normal tablet lists can be mislabeled. Keep this as a documented API/UI gap; do not infer mode locally. No code/API/data changes, build, or tests.


### Figma reconnection and All Films duplicate classification — 25.10.2026

Figma MCP authenticated `whoami` and created a file session after the PC restart. `get_design_context` still fails with the Starter-plan tool-call limit; `whoami` reports the connected team tier as Starter. Chrome canvas works: All Films `1480:4797` and `1413:12611` are both1440×2956 and visibly render the same title/filter/query/six-column-grid/pagination/footer composition. They are now classified as duplicate frames in the Figma crosswalk. The local `/en/films?sort=rating_desc` runtime exposes corresponding filters and six desktop columns; local API data has203 results and seeded placeholder titles/poster failures, while Figma uses static samples. No sample content was copied. The local browser was wider than the1440 Figma frame, so this is structural and visual duplicate classification rather than a matched viewport parity check. No source/API/data changes, build or tests.


### Crew Lists Rewind HQ profile data verification — 25.10.2026

Figma `1480:6383` is the Rewind HQ profile's Lists tab (1440×3236) with three example public lists, tags, profile navigation and footer. A read-only GET to local `/api/users/hq?page=0&size=12` returns `totalElements: 0`. The local profile opened at `/uk/users/7748?view=lists` is `social_race_5a62c9ea`, `hq: false`; its empty-list message is correct for that account. PublicProfile already uses the per-user list API, so the current mismatch is missing HQ account/content in this local dataset, not a missing endpoint. No fixture data was added. One desktop frame was reopened and its local data source classified; the related phone variants and matched viewport remain open. No code/API/data changes, build or tests.


### Rewind HQ Lists “more tags” phone canvas review — 25.10.2026

Current-file Figma frame `1480:9814` is now visibly captured in full; inspector confirms393×1674 and visibility is on. It shows Rewind HQ profile Lists with three cards, pagination, an expanded tag area and the bottom navigation. Its distinct “more tags” state is taller than basic phone frame `1480:9718` (393×1546). A fresh readable canvas screenshot for the basic frame was not obtained, so it remains visually open. The current local HQ endpoint has zero users and profile7748 is not HQ; no Figma content was copied. One phone frame was visually reviewed, while populated source parity and matched phone runtime remain unverified. No source/API/data changes, build or tests.


### Admin Users frame `1222:3530` — historical source gap, superseded — 25.10.2026

The current target Figma canvas confirms `1222:3530` (“User List 2 - Sulyma Bohdan”),1440×2098, as the Admin Users screen: identity/header rail, search, Add User control and Name/Email/Role/Status table. `/admin?view=users` maps to `AdminDashboard`/`AdminUsers`; source supports search, pagination, role, HQ and active-status changes and the response includes email. At this checkpoint the renderer was a compact `<ul>` without email; that observation is historical and has been superseded. Current `AdminUsers` renders Name/Email/Role/Status/Actions in a semantic table, confirmed by the UK/EN natural-width runtime review on 27.10. The API still has no create-user POST, so Add User remains a separate capability gap. No implementation or runtime evidence is claimed by this historical checkpoint; see [latest Admin Users runtime](#admin-users-uken-read-only-keyboard-review--27102026).


### Admin Edit Film `1260:4840` — current-file design/API review — 25.10.2026

The live current-file frame “Edit Film - Sulyma Bohdan” is confirmed at1440×3128. It shows name, duration, publication status, original language, genres, poster, year, description, director, cast, aggregate ratings/review count/popularity and deletion. The local `AdminMovies` editor uses the existing write contract fields title/date/rating/poster/duration/short plot; `AdminMovieWrite` has no write fields for status/language/genres/director/cast. Record a confirmed design/API feature gap; aggregate metrics are treated as read-only and unsupported mutations are not simulated. Admin browser runtime was inaccessible without an authenticated session. Figma structured context remains Starter-limited; no implementation was made, consistent with the mandatory high-fidelity-context prerequisite. No build or tests.


### Admin Comments `1342:3589` — current-file visual/API audit — 25.10.2026

Figma frame is confirmed at1440×2855. The existing `AdminShared.module.css` matches the 1200px rail, two-column card, 417px text column, 249px card height, 38px radius and84px rhythm. The frame exposes a reported-comments view and per-card year, likes/replies and Edit Comment. The current component only filters visible/hidden and calls hide/unhide; `AdminComment` has createdAt but the UI omits the date, and the API/controller have no report-list, engagement-count or edit contract. Record these as UI/API feature gaps; do not simulate reported state or edit behavior. Authenticated runtime not checked. No source/API/data changes, build or tests.

### Admin Reviews `1310:3108` — live canvas + API contract — 25.10.2026

The current-file Figma frame is selected in Chrome; inspector confirms1440×3401. The composition shows a reported-reviews control, review cards with rating/year/likes/comments, and Edit Review. Source review confirms `AdminReviews` currently offers All/Visible/Hidden and hide/unhide; `AdminReviewResponse.createdAt` is available but not rendered. `AdminReviewController` supports list, hide, unhide and delete, but has no reports/engagement/edit contract. Existing CSS defines a centered 1200px two-column card rail (417px lead column, 429px minimum height, 38px radius,84px gap); no authenticated Admin runtime was available to verify effective geometry. Figma MCP is authenticated after reboot but structured context remains Starter-limited. No source/API/data changes, build or tests.

### Admin Edit Review and reported-review variants — 25.10.2026

Chrome canvas inspection classified four additional frames: two `Edit Review - Sulyma Bohdan` variants (`1494:6396`, `1315:4313`), each1440×2435; `Reported Reviews` `1319:4833`,1440×3217; and `Edit Reported Reviews` `1319:5033`,1440×2435. Both Edit Review frames have the same overall composition but remain separately inventoried pending a more exact comparison. The reported list shows report reasons/counts; its edit frame adds review history, delete/block and complaint-resolution controls. Backend source confirms a generic `/api/admin/moderation/queue`, but its repository selects every unmoderated review/comment (`moderated_at IS NULL`) and its DTO has no user-report reason/count or resolved state. `AdminReviewController` supports list/hide/unhide/delete, not review editing. Thus the generic queue is not proof of a reported-review feature; report/edit/resolve operations remain unsupported. No authenticated Admin runtime was available. No source/API/data changes, build or tests.

### Admin review action result states — 25.10.2026

Live canvas confirms three additional result frames, each1440×1666: Delete `1319:5889`, Block `1342:3273`, and Complaint as Resolved `1342:3470`. Delete success has a matching backend `DELETE /api/admin/reviews/{id}` endpoint, although the current `AdminReviews` component has no Delete control. Block success is depicted separately from deletion; current Admin UI calls its `isHidden` operation hide/unhide, so parity between Block and hide is unverified. Complaint resolution has no complaint entity/state or resolve endpoint in the review/admin moderation contract. This narrows the API gap statement: deletion exists at API layer; edit/reports/resolution do not, and Block semantics need product/prototype confirmation. Admin runtime unavailable; no code/API/data changes, build or tests.

### Admin comment editing and reported-comment states — 25.10.2026

Three current-file frames were visually checked in Chrome: Edit Comment `1342:4028` (1440×2282), Reported Comments `1343:3799` (1440×2855), and Edit Reported Comment `1343:4118` (1440×2314). The edit form shows comment text/history, author/year and Delete/Block; the reported list adds reason and engagement data; the report editor adds complaint count and a resolve action. Backend `AdminCommentController` supports delete/hide/unhide; the UI component does not expose delete and there is no edit or complaint-resolution endpoint. DTO/repository data has no report reason/count/resolved status. Do not equate the generic unmoderated queue with reported comments. Hide/unhide vs Figma Block semantics remain unverified. No authenticated runtime, code/API/data changes, build or tests.


### Admin moderation queue and Moderator Logs — 25.10.2026

The live Figma canvas showed two `List of Content for Moderation` variants (`1494:7795`, `1399:3300`; both1440×2171) and two `Moderator Logs` variants (`1404:3804`, `1494:7933`; both1440×2749). The logs frames show moderator name/email/role and a Visit Profile action beside action date/time and type chips. Current `AdminAuditLogs` is a single text line per record; desktop CSS supplies a translucent shell and oversized rows but not the two-column content. `AdminAuditLogResponse` exposes only `adminId`, action, target, metadata and timestamp; existing `GET /admin/users/{id}` can supply identity, but actor resolution and the Visit Profile destination need review before implementation. Figma `get_design_context` still returns the Starter call-limit error after reboot; canvas inspection only. No implementation, build, automated tests, authenticated runtime or data changes.


### Admin Settings variants — 25.10.2026

The current Figma canvas contains two Settings variants (`1404:4076`, `1494:8086`), both1440×2378. The visible panel includes site name, language, time zone, logo upload, publication policy, limits, character count, color palette, font, cache-update and backup-frequency settings. Existing API persistence supports only `site_name`, `default_locale`, `maintenance_mode` and `journal_enabled`; the remaining controls are an API/settings gap. No mock settings were introduced. The local user session opens own Profile but `/en/admin?view=logs` redirects to `/en/home`, so no authorized Admin UI, responsive or keyboard/focus review was possible. No code, data, build or test changes.


### Own Profile Lists phone recheck — 25.10.2026

Figma `1017:1841` is a 393×1666 own-profile Lists state. At a393×852 local viewport, authenticated `/en/profile?view=lists` displays the same profile header and selected Lists tab with three API-backed cards. Current user records are only the default Watched/Watchlist/Favorites lists, versus the Figma sample custom lists. Backend `GET /lists/my` returns all user-owned lists and supports custom records, so this is current account content variance rather than a missing endpoint. The public route `/en/users/7748?view=lists` is separate and currently empty. A read-only `/en/admin?view=logs` navigation redirected this local user to `/en/home`, so Admin visual comparison remains unavailable with this account. No database/data mutations, implementation, build or tests.

### Profile network action sheet — 25.10.2026

Live Figma canvas reopened Own Following `1023:3020` at393×852. Authenticated own Following is genuinely empty in the current API data. On PublicProfile `/uk/users/7748?view=following`, one live API row exposed the More sheet. Verified its four existing actions (Follow, Block, Go to member, Done), Escape close, and focus return to the trigger; did not execute Follow or Block. UI/API/data were not mutated. No tests or builds run; visual coverage remains open.


### Global Search Reviews phone alignment — 25.10.2026

Figma `1480:8631` (393×1139) has review cards at x16, 361×168, y267/460/652/844. The local mobile `.matchesHeading` bottom margin was13px, placing the first card at y274. Changed it to6px: source cards now start y267/459/651/843 at393×1139 and the first begins y267.34 at320×852. UK/EN at320/393px have no horizontal overflow; dates render in the corresponding locale and the phone navigation's keyboard focus is visible. API data has no poster images, so source uses existing fallback letters instead of Figma's sample Dune art; Figma sample records/count differ from live search data.
npm run verify:build` PASS (TypeScript + Vite,231 modules). No tests, API/data mutations or Docker changes.

### PublicProfile phone overview composition recheck — 25.10.2026

After workstation reboot, Figma `whoami` and `create_session` succeed, while `get_design_context` still returns the Starter call limit. In the live Chrome canvas, selected PublicProfile phone overview `825:1378`; inspector reports393×2355 and the screen shows identity, Favorites, recent activity/reviews, Following, and Lists. A separate local Vite mobile source preview at `/uk/users/7748?view=overview` shows API-backed Statistics/rating distribution, Social links, full Collections, and Liked Reviews after the overview rail. This confirms the already recorded placement gap, not a reason to remove requirements-backed data. Visual review is manual, not a pixel-diff; the real API account has different sample content from Figma. No app/API/data changes, builds, tests, or Docker actions.

### Search All phone full-frame visual review — 25.10.2026

The live Figma canvas now shows the complete selected phone frame `1480:8934`; inspector reports393×2801, layer visible, canvas zoom28%. Its sections are Films, Reviews, Users, Tags, Lists and Journal, followed by the mobile navigation. A local current-source EN browser at393×852 for `/search?q=film` shows API counts of152 Films,101 Reviews and0 in all remaining categories. This verifies the full static frame composition and the current live-data difference only; it is not matched geometry or populated-content parity. No Figma layer changes, source/API/data changes, build, automated tests, or Docker actions.


### Member Home live API geometry recheck — 25.10.2026

Figma plugin is connected after reboot and creates a file session; `whoami` confirms the Starter tier, and `get_design_context` still returns the MCP call limit. Manual Chrome canvas confirms member Home `1327:3210` at393×2463. Frame headings New/Popular/Latest News/Popular Reviews/Popular Lists/Recent News start at y328/527/726/969/1760/2074. Current `/uk/home` and `/en/home` at393 content width measure y329/527/726/969/1760/2074. Root cause was the Popular rail's visible horizontal scrollbar: with six live poster links it added10px after the 116px poster row. Hiding the scrollbar retained the scrollable rail and link targets; the later News gap was reduced11px. UK and EN at320px measure `scrollWidth == clientWidth == 320`; 393px source has no horizontal overflow. Journal API remains an empty success response; other sections stay API-backed. Anchor geometry is aligned within1px, but this is not a pixel-diff or all-state parity check. CSS only; no API/data changes.
npm run verify:build` passed (TypeScript + Vite,231 modules); automated tests and Docker actions deferred.


### Help desktop full composition review — 25.10.2026

Figma `1062:1993` inspector confirms1440×4025. Current UK desktop `/uk/help` at content width1440 has an818px hero, six alternating illustrated rows, three guide cards, and a compact265px route footer; document height is4033px. Current EN `/en/help` contains the same route components and footer and measures3994px because localized text wraps differently. The accessibility tree exposes localized navigation, all Help headings/body text, and the corresponding links in both locales. This supplements the previously recorded Help width and keyboard checks with a full composition review; localized document height differs by up to31px from the Figma frame. No copy was clipped and no fixed page height was added. No code/API/data changes, build, tests, or Docker actions.


### PublicProfile desktop visual classification — 25.10.2026

After reboot, `whoami` and Figma file-session creation succeeded; `get_design_context` for `238:608` again returned the Starter call limit. The live canvas reports1440×1020 and shows sample name/username, Germany, bio, three counters and Follow. A read-only source preview at `/en/users/7748?view=overview` exposed API-backed identity/actions and current live review/list/collection content. `PublicProfileResponse` lacks location and bio fields; sample counts and identity therefore cannot be expected from this account. The canvas render was monochrome while the existing asset map identifies the Whiplash hero original, so image parity remains unverified. One frame was visually classified; no matched geometry/parity result is claimed. No source/API/data edits, build, automated tests or Docker actions. The Figma call-limit remains a blocker only for structured design context; manual canvas comparison continues.


### Own Profile Films desktop frame classification — 25.10.2026

Live Figma selection `341:3348` confirms a1440×3256 own Films frame with profile hero, Films-selected rail, Watched heading, six-column poster grid, pagination, footer and “Edit Profile” CTA. Current authenticated UK source `/uk/profile?view=collection&collection=watched` returns one real watched film; sample poster volume is data variance. The source screenshot at the available wider viewport exposes a desktop page title and back/overflow controls while the frame shows the CTA; exact1440px source geometry and the CTA prototype destination remain unverified. This is one additional visual classification and an open mismatch candidate, not a parity pass. No code/API/data edits, build, automated tests or Docker actions.



### Figma доступ після повторного reboot — 25.10.2026

Figma authentication (`whoami`) and file-session creation succeeded. `get_design_context` for the mapped design is still denied by the Starter MCP call limit. Manual Chrome canvas loaded Own Profile Films `341:3348` and confirmed1440×3256 in the inspector; the original PublicProfile phone frame `825:1378` (393×2355) was restored afterward. The Edit Profile prototype destination, an exact1440px source capture, and any new parity result remain unverified. No design edits, source/API/data changes, builds, tests, or Docker actions.


### Own Profile Films / overview action clarification — 25.10.2026

Manual canvas recheck confirms that `341:3348` (Own Profile Films,1440×3256) has banner, Films-selected profile rail, Watched poster grid, pagination and footer; it does not show the name/counters/Edit Profile CTA in the inspected render. The CTA appears in adjacent own Profile overview `341:3347`; its selected hero group has no configured Prototype interaction (“Add action” is offered). Existing `Profile.tsx` routes the equivalent settings action to `/profile?settings=profile`. Exact1440px source screenshot could not be produced with the current CUA viewport controls, so visual parity remains unresolved. This supersedes the earlier evidence text that placed the CTA inside the Films frame. No Figma/code/API/data edits, build, tests, or Docker actions.


### Crew Lists phone and PublicProfile mapping — 25.10.2026

Figma plugin authentication and file-session creation succeeded after reboot; the structured context call remains Starter-limited. The live canvas shows `1480:9718` (“Crew lists”, 393×1546) with the Rewind HQ phone profile, three public-list cards, pagination, a separate Lists tags strip with More, and bottom navigation. `PublicProfile.tsx` has per-list tag chips and page navigation but no separate cross-list tags strip; `PublicList.tags` is already in the API shape. This is a confirmed visual/source gap with no missing read contract. The More transition/expanded `1480:9814` and populated HQ runtime remain unverified. No source, API, data, Docker, or Figma mutation; no build or tests.


### PublicProfile Lists tags implementation checkpoint — 25.10.2026

Figma frames `1480:9718` (phone base, 393×1546), `1480:9814` (phone expanded, 393×1674), and `1480:6383` (desktop, 1440×3236) were reviewed in the live canvas. Prototype evidence: base More opens the expanded tag frame; tag chips open search-by-tag; expanded More has no action. Updated `PublicProfile.tsx`, CSS and UK/EN labels to render a de-duplicated page tag cloud, expand from three visible tags, and route tags through the existing recent feed; in the Lists tab per-card tags are removed, desktop descriptions retained, and phone descriptions hidden.
npm run verify:build` passed: TypeScript and Vite, 231 modules. Manual local EN desktop runtime `/users/439?view=lists` used existing verification data (`API`, `Verification`), showed the separate tag cloud and correct filter URLs. Current local public profiles have no more than two unique tags, so the More state and mobile geometry remain runtime-unverified. No test fixture, backend/API, database, Docker, or Figma changes. Frontend regression and remaining release gates are still pending until visual coverage closes.


### Admin Moderator Logs actor-resolution review — 25.10.2026

Current source review confirms `AdminAuditLogs.tsx` renders one localized text line per audit record, despite an older evidence entry describing the CSS card rails. `AuditLog` exposes `adminId` but no actor identity. `GET /admin/users/{id}` can supply identity, but resolving actors record-by-record would require up to50 extra requests for a 50-row audit page; the paged user-list endpoint is not guaranteed to contain every historical moderator. A batch identity projection on the audit response or a batch lookup endpoint is needed before implementing the Figma two-column identity/action layout. The Visit Profile destination remains unconfirmed, and `AdminUsers` selection is not URL-addressable. This is a confirmed visual and API-shape gap; no source/API change, authenticated runtime, build or tests.


### Figma reconnect and Crew Lists canvas retry — 25.10.2026

After another PC restart, Figma tool discovery, `whoami`, and `create_session` succeed; `whoami` reports a Full seat on Starter. A fresh `get_design_context` request for `825:1378` returns the Starter MCP call-limit error, confirming that restart did not restore structured-read quota. The existing Chrome Figma tab loads the file and screenshot-selects Crew Lists phone `1480:9718`; the inspector confirms393×1546, and the visible frame contains the HQ profile rail, three list cards, pagination, a separate Lists tags row with More, and bottom navigation. A deep link to this node transiently returned Loading; browser history restored the canvas. This repeats manual frame visibility already recorded above; it does not create new source-parity evidence. No source/API/data, build, test, Docker, or Figma design changes.


### Inventory candidate component search — 25.10.2026

In the current Copy, Figma layer Find for `show results phone` returned eight results: one component and seven instances in Search result states. The component is197×319, has two variants, and displays a result-type dropdown. This matches the archival inventory entry `1459:5074` by name/dimensions and supports classifying it as a reusable component rather than a route; the local `.fig` has a different file key, so this is not node-ID identity proof. Find for `movie filter for phone` returned one215×31 instance inside All Films phone, unlike archival `1216:3414` at295×1416; direct navigation to the archival ID redirected to `0:1`. Keep the archival filter candidate unresolved. No prototype behavior or product/source parity was tested; no Figma/source/API/data edits, build or tests.


### Figma access and archival `bbb` candidate recheck — 25.10.2026

After the user's latest PC reboot, Figma authentication, `whoami` and new file-session creation still work; `whoami` reports Full seat on Starter. A fresh `get_design_context` request for `1480:9718` again returns the Starter MCP call-limit message. In the current Copy's manual layer Find, `bbb` yields two results (`Group 415` and `Main - Sulyma Bohdan`); the selected current canvas node is `844:1569` at339×90. Neither current result confirms the inventory's archival `844:1458` (1132×446); the shared name alone is insufficient to classify that archived ID. Keep it unresolved. Corrected lexical inventory counts, excluding the redirect marker `0:1`, are287 IDs in the inventory,344 in the handoff,259 overlapping,28 inventory-only and85 handoff-only. No design or source edits, build, tests or Docker actions.


### Journal List 1 current-copy review — 25.10.2026

The live Figma canvas search selected `1494:4802` (“Journal List 1 - Sulyma Bohdan”); the inspector reports1440×3560. At 50% zoom the visible feed rows have left editorial cover art, central date/title/excerpt and a right related-poster rail. This confirms the frame’s identity and visible composition. The local `/en/journal` route at the current browser viewport displays “No published articles yet” and “The archive is empty”; this matches the documented lack of live content, not a layout/API failure. There is no matched-width populated source capture. Lists 2–4 were reviewed in the subsequent entry below. No source/API/data changes or tests.


### Journal Lists 2–4 current-copy canvas review — 25.10.2026

After PC restart, Figma `create_session` continued to work, while `get_design_context` remained blocked by the Starter MCP call limit. Manual layer Find in the current Copy selected `604:1172` (“Journal List 2”,1440×3562), `604:967` (“Journal List 3”,1440×3561), and `604:1380` (“Journal List 4”,1440×3561). At the available canvas zoom, all three visibly share the Journal desktop editorial structure: masthead/category hero, repeated article rows with lead image, text and related posters, then shared footer. The sample stories and images vary. Classify these as content variants of `/journal`; no separate route or API is implied. The local API-backed Journal feed/archive is empty, so no populated matched-width runtime comparison exists. This is a visual classification, not exact geometry/pixel parity. No source/API/data changes, build, tests or Docker actions.


### Journal newsletter search and Article deep-link retry — 25.10.2026

Current Figma Page 1 Find returns no results for `newsletter` or `Subscribe`; the search is limited to matching node/text names and is not proof of full-file absence. No public signup section was evidenced, so the Admin newsletter queue remains separate. A direct current-file deep link to the existing article candidate `844:1547` stayed on Loading; a reload returned to the Figma page overview, but did not yield the selected frame. Existing raw geometry and source measurements remain prior evidence only and are not upgraded to a current-copy visual check. No Figma design, app source, API, data, build, test, or Docker changes.


### Journal Lists 5–6 and Article current-copy review — 25.10.2026

Using current Figma Page 1 Find, selected List 5 `604:1074` (1440×3560) and List 6 `604:1275` (1440×3565). The screenshots show the same editorial feed layout as Lists1–4 with different lead/related imagery and story copy; classify as `/journal` content variants. Then searched the visible title “Christmas Adventures” and selected its parent frame “Main - Sulyma Bohdan”: current-copy node `844:1547`, inspector1440×3120. The frame visibly contains a title/metadata hero, collage image, long structured article copy with inline images, and shared footer. `JournalArticle.tsx` source review confirms API-driven `coverUrl` plus text-only `content`; no static frame content is used. The visual content beyond that contract remains a documented gap, not a confirmed layout defect. This current selection supersedes the earlier failed deep-link evidence: article node identity is now verified in current Copy. Newsletter/Subscribe Find remained empty on Page1, which does not prove file-wide absence. No source/API/data changes, build, automated tests, or Docker actions.


### Figma access and Journal phone exact-query check after reboot — 25.10.2026

Created a fresh session for current file `BDO9GO1oscOeUTcu4VXVKA` (`b93f5afa-a357-4e51-ac84-ede16cc19346`). `whoami` confirms the account's Full seat on Starter. `get_design_context` for current-copy Article `844:1547` still returns “Figma MCP tool call limit on the Starter plan”; the reboot restored browser/session access but not MCP read quota. In Chrome canvas, Find scoped to All pages for exact text `Journal mobile` returns “No results in this file”. This is not proof that a Journal phone frame is absent under other names. Article `844:1547` is selectable by searching the visible title and parent, so this supersedes the historical deep-link Loading entry above. No Figma/app edits, source/API/data changes, build, tests or Docker actions.



### Journal `КК` frame current-Copy visual classification — 25.10.2026

In Figma Find scoped to All pages, the exact query `КК` returns one result, a Frame named `КК`. At that time the inspector confirmed1440×3560 and the canvas screenshot showed an editorial Journal feed, but the node ID had not been established. **Correction 26.10.2026:** opening the direct current-Copy URL with
ode-id=604-848` selects this same `КК` frame; inspector still confirms1440×3560, and its screenshot shows a lead story plus repeated editorial rows and shared footer. This directly confirms `604:848` as the seventh current-Copy desktop Journal feed variant. Local populated runtime parity, phone frames and newsletter scope remain open. No Figma edits, source/API/data changes, build, tests or Docker actions.


Follow-up to the same Figma Find session: with search scope All pages, exact queries `newsletter` and `Subscribe` each returned “No results in this file”. These text/name searches do not prove that a public signup flow is absent under alternate labels or frames; keep the feature unclassified and do not add a public signup block without a confirmed design and contract. No source/API/data changes, build, tests or Docker actions.



### Featured Lists desktop and phone current-Copy review — 25.10.2026

In Figma Find scoped to All pages, selected the desktop frame `Featured lists (svergunova)` and phone frame `Featured lists (svergunova phone)`. The selection URLs identify nodes `1480:5839` and `1480:8012`; inspector dimensions are1440×3565 and393×2019. Canvas screenshots confirm poster-led list cards and shared page shell in each. Source review confirms `/lists/discover?feed=team` calls the existing HQ-owned public-list feed; it does not provide separately curated Featured or Crew collections. Preserve the existing feed semantics as previously agreed and keep content parity open; no sample data or endpoint was added. No source/API/data changes, build, tests or Docker actions.



### Popular Lists current-Copy frame and duplicate check — 25.10.2026

Figma All-pages Find selected `Popular lists (svergunova)` desktop frames `1413:7194` and `1413:13256`; each URL/inspector reports1440×2821. The screenshots show the same Popular list page with four sample rows, pagination and footer. Record `1413:13256` as a visual duplicate candidate of `1413:7194`. The phone frame `1480:7927` is393×1301 and shows the sort control, four sample list cards, pagination and bottom navigation. Map these current-Copy frames to the existing `/lists/discover?feed=popular` API route. Historical crosswalk ID `1480:5390` is not confirmed as either current frame's alias. No source/API/data changes, build, tests or Docker actions.



### Snapshot-only component/asset candidate classification — 25.10.2026

Parsed the checked-in inventory's first-column node IDs. The28 IDs that were inventory-only before this pass have now been documented in the handoff outside the route table. Their labels/sizes group into9 button,2 tag,2 follow-control,9 navigation/shell,1 Search,1 ranked-list-fragment,2 unnamed-component and2 icon-asset candidates. The listed dimensions are sub-screen-sized; no item is a full route frame by dimensions. Because the source inventory uses an older/different Figma file key, this is a provisional component/asset classification only; current-Copy node identity remains unverified. No product/source/API/data change, build, automated tests, or Docker action.



### Popular Reviews current-Copy frame and page-size check — 25.10.2026

Current Figma frame `1480:4880` was selected from exact All-pages Find and screenshot-checked at1440×2661. It visibly contains the Popular Reviewers rail, four review cards, popularity sort, pagination and footer. The route's previous page size of six made the local live page render six cards; changed `PopularReviews.tsx` to request four. After
npm run verify:build` passed (TypeScript and Vite,231 modules), a manual local `/en/reviews` reload shows four cards and Page1 of29 from local test-like data. At393×852, mobile navigation/cards remain within the viewport and four rows are exposed in the accessibility tree. Phone candidate `1480:9087` is confirmed by current Figma layer selection and inspector at393×1265, but its canvas viewport was not centered on the frame, so its composition remains unverified. Desktop candidate `1413:12701` is not yet confirmed as a duplicate. No tests, API/backend, database, Docker, or Figma design changes.

Follow-up: exact current-file Find for `Popular Reviews (svergunova phone)` centered node `1480:9087` and its screenshot confirmed the phone composition: reviewer avatars, four review cards, popularity sort, pagination, and fixed bottom navigation. The phone row is now visually verified; no pixel-parity claim is made because live API content differs. The desktop alternate candidate `1413:12701` was later compared on the same Figma canvas with `1480:4880`: both are1440×2661 and show the same reviewer rail, four-card feed, sort, pagination and footer. Classify `1413:12701` as a duplicate desktop frame, with one route variant in coverage. No additional app, API, build, test, data or Docker changes.


### Global Search desktop no-matches — 26.10.2026

Current-Copy Figma `1480:5809` was opened on the canvas and inspector-confirmed at1440×1039. Its empty state uses a centered two-line heading, hint, white Home action and shared footer, without a search field, eyebrow or bordered panel. Local `/en/search?q=duna123` returned zero results from the existing API. Updated desktop CSS to align the empty-state composition while retaining the localized copy, real empty-result behavior, category control and accessible route navigation. Manual Chrome HMR screenshot/AX review confirms the resulting heading, hint and CTA. Browser width was1920px, so runtime geometry is not matched to the1440px frame.
npm run verify:build` passed (TypeScript and Vite;231 modules). No tests, API/data/Figma/Docker changes.


### Global Search desktop All frame — 26.10.2026

Current-Copy Figma `1480:7083` was opened in Chrome; inspector confirms1440×4188. Screenshot shows the All-results page with film posters, review cards and additional member, tag, list and Journal result groups. Local `/en/search?q=Send+Help` was manually reviewed at the available1920px browser width; the API returns one real film and one review, with zero other categories, and the page displays only those sections. This is a content-dependent variance; no fixture data was written. It establishes current-frame identity and structure, not matched-width geometry, populated cross-category parity or pixel parity. No code/API/data changes, build or tests.


### Popular Reviewers current-Copy correction — 25.10.2026

After reboot, Figma MCP authentication/session creation worked but structured design reads remained Starter-rate-limited. Manual current-Copy canvas review confirmed desktop `1413:13364` at1440×2850 and phone `1480:7698` at393×852. Desktop: 10-row reviewer table with watched/list/like metrics, pagination and Popular members rail. Phone: compact rows with More and Follow controls and fixed bottom navigation. Prior candidate `1480:5486` rendered blank in the canvas and is retained as unresolved. Added the absent phone More trigger to `/community/reviewers`, reusing the existing localized member sheet and follow/block API actions; local AX confirms the dialog and initial focus on Done. Page totals and the separate Popular members feed remain API/content gaps. No tests or backend/API changes. A frontend build is still required; full regression, Docker release verification and CI remain open.

Follow-up build evidence:
npm run verify:build` passed (TypeScript and Vite;231 modules) after the Popular Reviewers change. Manual source viewports were checked at320/393/1440px, and the action sheet returned focus to its opener on close. Tests, Docker rebuild/smoke, commit, push and green CI remain pending because visual inventory is not complete.


### Auth Forgot Password phone frame and API wording gap — 25.10.2026

Reopened Figma phone frame `944:1887` (393×852) and current UK route. The frame instruction supports email or phone number; implementation and `ForgotPasswordRequest` accept email only. Keep the API-backed email control and record phone recovery as a contract gap. UK source geometry at393: title y351, description y392, email y464, submit y539, account link y740; viewport320 has no horizontal overflow and Back focus is visible. No password-reset request was submitted. No source/API changes or tests.
EN `/en/forgot-password` was also inspected at393×852: `clientWidth` and `scrollWidth` both equal393, the page remains852px high, and title/email-only instruction/submit/account link are localized. The original preview URL and default viewport were restored afterward.


### Auth Forgot Password desktop frame recheck — 26.10.2026

Current-Copy canvas selects `605:2174`; inspector confirms1440×1614. The frame text says an email address or phone number can receive a reset link, while its input placeholder is email. Local EN `/en/forgot-password` AX exposes an email-only instruction and Email field; UK `/uk/forgot-password` exposes localized email-only copy and Електронна пошта. This matches the existing email-only reset contract and confirms phone recovery is not implemented. No reset request was submitted; no matched-width geometry or loading/error/success state was checked. No source/API/data changes, build or tests.


### Register desktop frame and localized controls recheck — 26.10.2026

Current-Copy canvas selects `605:2176`; inspector confirms1440×1752. The frame shows Username, Email, Password, Create Account and Google sign-up. Local EN and UK `/register` accessibility trees expose the corresponding localized fields, password visibility toggle, UTF-8 byte guidance and login link. No Google sign-up control exists because the application has no OAuth provider/API. No registration was submitted. The available viewport was not matched to1440; this records controls/capability only, not geometry. No source/API/data changes, build or tests.


### Auth token-reset missing-token state — 25.10.2026

After reboot, Figma `whoami` and `create_session` work; `get_design_context` remains Starter-rate-limited. The `944:1828` probe was an access check for the known Register phone frame. Selecting the parent of a Current password Find result revealed current-Copy Authenticated Profile > Authentication frame `1413:10984` (1440×2061), with Current/New/Confirm password fields and a Change button. Local UK `/profile?settings=authentication` exposes those three fields, the corresponding action and the 72-byte hint. At320px the mobile form remains within the document width (clientWidth305 and scrollWidth305 because the scrollbar uses15px). No form was submitted. Token-reset `/uk/reset-password` without a token was visually reviewed at393×852 and320×720; the localized alert fits without horizontal overflow. Searches did not establish a separate token-reset Figma frame. No source/API/data change, build or tests.


### Privacy Policy current-Copy frame and content review — 26.10.2026

Figma All-pages Find selected “Privacy Policy - Sulyma Bohdan” frame `1164:2679`; inspector confirms1440×2022. Its hero, Service navigation, article and footer structure align with local `/uk/privacy` at desktop. UK route was reviewed at393×852 and320×720; `scrollWidth == clientWidth` (378 and305 respectively, with15px scrollbar). EN `/en/privacy` at393×852 exposes localized headings, lists and account-rights links; no overflow (`378 == 378`). Code/config inspection confirms BCrypt password hashing, HttpOnly session cookies, configurable TMDB API and SMTP; no analytics code/package was found in searched app paths. Policy claims about sale, confidential partners, modern safeguards and complete data categories remain unverified against production vendors, retention and legal basis; messages/newsletter preferences are not named in its data list. Preserve this as an open factual-content gate, not a code defect or claim of legal review. No copy/source/API/data changes; no build or tests.


### Film Data current-Copy frame — 26.10.2026

**Historical misidentification, superseded26.10.2026:**1164:2484 is footer text; actual Film Data frame is1162:2305. The following old identity/inspector claim is invalid: Figma frame `1164:2484`, “Film Data - Sulyma Bohdan”, was confirmed at1440×1533 and manually compared with `/uk/film-data` at1440px. UK/EN Film Data routes were checked at320 and393px; for all four cases `documentElement.scrollWidth === clientWidth` (305px at320 and378px at393 due to the15px scrollbar). Structure aligns across hero, service links, metadata source/update sections and footer. Runtime copy adds TMDB non-endorsement and user correction/duplicate guidance; no copy change was made. Pixel parity, keyboard focus and remaining Service routes are open. `get_design_context` remains blocked by Starter call limit; manual browser canvas is available. No build or tests run.


### Help current-Copy frame — 26.10.2026

Figma frame `1062:1993` (“Help - Sulyma Bohdan”) was visually reviewed at1440×4025 and compared with UK/EN routes. Local `/uk/help` document height at1440px is4033px (Figma difference≈8px); its hero, service rail, instructional content with imagery and footer follow the same overall structure. UK/EN were checked at320 and393px; all four widths have `documentElement.scrollWidth === clientWidth` (305/378 with a15px vertical scrollbar). UK keyboard Tab reaches the logo and exposes the cyan3px focus outline with3px offset. This does not verify article-copy or each image's matched position. No build or tests run; full visual inventory and release gates remain open.


### Account Deletion current-Copy frame and source contract — 26.10.2026

Figma `1176:2515` (“Account Deletion - Sulyma Bohdan”) was reviewed at1440×1748. Local UK/EN routes show the same four content sections; desktop document height is1725px. UK/EN at320/393 all have `documentElement.scrollWidth === clientWidth` (305/378 with15px vertical scrollbar); EN keyboard focus at320px has the cyan3px outline and3px offset. Source inspection confirms password validation, refresh-session revocation, user deletion and database cascades for user-owned content and newsletter subscription; JWT authorization reloads the deleted user and rejects it. The design mentions paid services, but no payment/paid-service model was found in the searched source/schema; this phrase is not verified for any external deployment. The destructive form was not submitted. No source/API/data changes; no build or tests. Full regression and Docker/CI release gates remain pending.


### Global Search Journal phone — live-data check — 26.10.2026

Figma frame `1480:8889` (“Search Results journal articles”) is visible at393×1150 with three Dune cards. UK/EN `/search?q=Dune&tab=journal` both return zero Journal results and show the localized empty state; at393px each has `scrollWidth === clientWidth === 378` with the15px scrollbar. EN keyboard focus on the phone Add link has a visible3px cyan outline and3px offset. The runtime document is taller than the Figma frame because it renders the empty-state route; populated card geometry cannot be compared until real matching articles exist. No fake content or API changes. No build/tests; Search variants and full release regression remain open.

### Global Search Journal phone re-open — 26.10.2026

Reopened current-Copy Figma phone node `1480:8889`; the live canvas screenshot shows the full393×1150 frame, three Dune article cards and fixed five-item bottom navigation. This supersedes the older 25.10 observation that the layer was hidden/unreviewed; no visibility control was changed. The UK local `/search?q=Dune&tab=journal` route currently shows the real empty state (`Журнал (0)`). The source viewport in this pass was desktop-sized, so this confirms the content gap but adds no new matched-mobile comparison. The earlier documented 393px width/focus evidence remains a separate checkpoint. Figma Prototype inspection of first-card group `1480:8917` shows no configured action; nested layers were not checked. No source/API/data changes, builds or tests.


### Own Profile Lists phone — current-Copy visual evidence — 26.10.2026

Figma All-pages Find reopened current-Copy node `1017:1841`, owner Profile phone Lists, inspector393×1666. The canvas screenshot at40% shows the Lists-selected profile rail, three custom-list cards with cover strips, and fixed phone navigation. The current authenticated UK source at effective393px was previously measured at full width with three API-backed system lists (Watched/Watchlist/Favorites, counts1/0/1); sample identity and content differ, and no static Figma rows were added. This reconfirms an existing frame mapping and clears the earlier direct-canvas-Loading recheck, but does not add a unique frame to coverage or establish pixel parity/repeat UK/EN focus checks. No source/API/data/Figma changes, build, tests, Docker or CI actions.


### Own Profile phone variants — manual Figma review — 26.10.2026

After reboot, Figma whoami/session creation succeed but structured context calls remain Starter-rate-limited. Live current-Copy canvas confirms owner Profile phone `1023:1867` at393×1434 (Reviews tab selected, profile header and review cards) and Watchlist phone `1015:3356` at393×1564 (“Wants to see”, poster grid, fixed navigation). Nearby Films/Recent Activity, Likes and Lists variants are visible in the canvas overview but were not separately recorded as exact selected frames. The local Rewind tab is `/en/users/439?view=lists` at desktop width, so this pass adds no matched mobile runtime evidence. No source/API/data changes, builds or tests; regression, Docker smoke, commit/push and green CI remain pending.


### PublicProfile Lists phone — 393×1546 runtime capture — 26.10.2026

For current-Copy Figma `1480:9718` (393×1546), local `/en/users/439?view=lists` was captured at the same width and height. Document `scrollWidth=393`; title x70/y62.9; list section x16/y123/361×319.9; tag heading y372.7; chips x16/y410.9/361×32. Tab focus is visible on the first fixed bottom-nav link. The live account yields one public list and two tags versus three sample Figma lists. This is a real-data content difference; exact visual parity is not claimed and no fixtures were introduced. Footer starts below the frame. Device emulation was cleared; no source/API/data changes, build or tests.


### PublicProfile Following — matched 393×852 visual and keyboard recheck — 26.10.2026

Figma current-Copy `1023:4597` was selected in the live Chrome canvas; inspector reports393×852. The canvas image shows Following, multiple relationship rows, More/Follow controls and fixed bottom navigation. On the local EN `/users/7748?view=following`, a temporary393×852 device viewport produced header [0,0,393,64], title [70,62.25,253,19.5], row [16,123,361,65], bottom navigation [0,760,393,92], and document `scrollWidth=393`. One live API relationship is present versus ten Figma sample rows; no fixtures were added. The signed-in viewer is not following this member; More opens Follow and Block API actions, Go to member and Done. The Figma member-sheet frame `1033:5681` shows Unfollow, Block, Go to member and Done for an already-followed state. The sheet initially focuses Done; keyboard advances through Go to member and back to Done, and Escape/Done close it and return focus to More. No follow/block action was activated. Figma MCP calls for both structured context and screenshot still hit the Starter call limit after reboot; manual Figma canvas remains available. Device emulation was cleared after capture. No source/API/data/Figma changes, build, tests, Docker or CI actions.


### PublicProfile Overview authenticated phone geometry — 26.10.2026

Selected live Figma `825:1378` confirms393×2355. Current-source EN `/users/7748?view=overview` at393×852 has H1 x61/y317/271.1×28, matching the previously recorded title anchor. The live Favorites heading is y653.6, while the Figma phone anchor is y590. Source hero rectangle is609.6px high: authenticated Follow occupies y478.6–522.6 and existing Block/Message controls y530.6–574.6; CSS's intended design floor is547px. Figma shows Follow but provides no placement/prototype mapping for Block/Message. Preserve the existing actions and record the 63.6px downstream displacement as an unresolved authenticated action-layout gap. API favorites are empty while Figma illustrates four posters. The live full page measures3348px and continues into Statistics, Social links, collection tabs and liked reviews after the2355px Figma frame; those product/API-backed sections remain in place. Current screenshot establishes a source-state difference, not exact visual parity. Device emulation was cleared; no code/API/data/Figma changes, build, tests, Docker or CI actions.


### Own Profile Films viewport-centering fix — 26.10.2026

After reboot the Figma account is authenticated (Full seat, Starter tier); `get_design_context` and `get_screenshot` still return the Starter MCP call-limit response. Manual current-Copy canvas comparison of `341:3348` (1440×3256) against the UK watched collection route at CSS1440×900 found the local 1200px rail at x112.5 instead of Figma x120 because Windows reserves15px for the classic scrollbar. Desktop Profile content and title now center against the browser viewport. Browser recheck places the rail at x120 and keeps vertical anchors at y1105 (profile navigation) and y1269 (collection heading).
pm run build` passes (231 modules). API data has one poster vs the populated Figma example. Automated tests remain pending until visual audit closure; Docker, release checks and CI remain pending.


### PublicProfile Lists desktop centering — 26.10.2026

Current-Copy Figma `175:619` (1440×2805) was compared with the EN live route at CSS1440. A classic Windows scrollbar reduced layout width to1425 and shifted the public rail left7.5px. The desktop shell now centers to browser viewport width: verified hero x0/1440 wide and 1200px shell/nav/list section/card x120; nav y1105, section y1269, card y1374. Figma’s two example cards and larger tag set differ from one live API list/two tags; no fixtures added.
pm run build` passes (231 modules). No automated tests run before visual audit closure.


### PublicProfile Films desktop route alignment — 26.10.2026

Compared current-Copy Figma `122:176` (1440×3256) with EN `/users/439?view=collection&collection=watched` at CSS1440. Figma’s 6-column grid has24 samples; the local verification account has0 watched films. Fixed route presentation: left-align and localize the selected collection heading, hide duplicate desktop inner collection tabs, and center the public profile shell/hero to the viewport (hero x0, shell/rail x120). H2 reads “Watched” while the API-backed empty state remains.
pm run build` passes (231 modules). Populated grid parity stays a data gap; no fixtures, API changes or tests.


### PublicProfile Watchlist desktop variant — 26.10.2026

Compared Figma `153:180` (1440×3120) with EN live watchlist route at CSS1440. Layout anchors match: hero x0, 1200px rail/shell x120, rail y1105, section y1269; heading is the Figma label “Wants to See” and is left-aligned. Figma’s24 posters cannot be compared because the local API returns0 watched-list films; the live empty state remains.
pm run build` passes (231 modules). Tests remain deferred until visual audit closure.


### PublicProfile Likes desktop variant — 26.10.2026

Compared current-Copy Figma `175:177` (1440×3256) against EN `/users/439?view=collection&collection=favorites` at CSS1440. The 1200px rail and collection heading align at x120; rail y1105, section y1269, heading “Liked” left-aligned. Duplicate inner collection tabs are hidden. The live API returns0 favorites against Figma’s24 samples, so the rendered empty state is recorded as a data gap. UK heading “Улюблене” and localized empty state also checked.
pm run build` passes (231 modules). No tests run before the visual audit closes.


### Own Profile Reviews phone — active-tab correction — 26.10.2026

Figma current-Copy `1023:1867` is confirmed at393×1434 with Profile selected and a full Reviews list. Compared with the authenticated UK `/profile?view=reviews` route at393px, which previously rendered no active profile tab. Updated `Profile.tsx` so this route selects the Profile tab while keeping the existing Reviews route and live API data. Browser route/accessibility tree rechecked after HMR;
pm run build` passes (231 modules). Figma shows three sample reviews; local API returns one, recorded as data variance. Full pixel parity, focus/keyboard, other locales and states remain open. `get_design_context` is still Starter-rate-limited. No tests, API/data/Figma changes, Docker, commit or push.


### Own Profile Watchlist phone — matched-width recheck — 26.10.2026

Rechecked the existing current-Copy Figma mapping `1015:3356` (393×1564) against authenticated UK `/profile?view=collection&collection=watchlist` at CSS393×852. Runtime anchors: hero x0/y0/393×496; profile rail x16/y531/361×44; selected Watchlist tab x107.5/y531/86.5×44,10px nowrap with `aria-current=location`; section x16/y598/361 wide; H2 y607; empty copy y647; mobile navigation x0/y760/393×92. Document width393 and height1281. Previously recorded Figma raw heading/card anchors y606/y646 match within1px. Figma has curated poster samples; current API Watchlist is empty, so the source empty state and shorter page are expected data variance. The tab label's prior wrapping issue is closed by the existing 10px no-wrap rule. Direct Figma navigation stayed on Loading during this pass; no fresh canvas capture or new unique frame is claimed. No code change, build, tests or account-data mutation.


### Own Profile Likes phone — matched-width source recheck — 26.10.2026

Reopened current-Copy Figma frame `1015:4508`; the live canvas inspector confirms393×1666, and its fresh screenshot shows the Likes-selected profile rail, curated four-column grid and bottom navigation. Compared with the existing authenticated UK `/profile?view=collection&collection=favorites` CSS393×852 measurements: hero x0/y0/393×496; profile nav x16/y531/361×44; selected Likes tab x199/y531/86.5×44; collection x16/y598/361×165; heading y607; API-backed Send Help poster x16/y647/79×116. Figma raw heading/poster anchors y606/y646 match within1px. The local API returns one real favorite with its poster versus the populated sample grid; `scrollWidth=393`. This is matched-width structural/anchor evidence, not full pixel/content parity; existing frame only, no new ID. No source changes, build, tests or account-data mutation.


### Search/Journal evidence ledger reconciliation — 26.10.2026

The Figma MCP connection authenticates after reboot and `create_session` succeeds, but `get_design_context` still returns the Starter tool-call limit. Chrome canvas is accessible. Direct deep-link navigation first reset to `0:1`/Loading, then recovered and displayed current-Copy `1480:6991` at1440×2281 with its selected frame and adjacent expanded state; `1480:8804` selection confirmed393×852, while the canvas did not pan to it during this pass. Reconciled the Search/Journal frame table with the already documented phone screenshot/approximate outer-card geometry for `1480:8804` and the desktop composition screenshot/Prototype transition for `1480:6991`. The scoped subset is now19/19 frame candidates classified,0 unreviewed. Neither entry proves full route parity: `1480:8804` still lacks content/state/wider-screen checks; `1480:6991` still lacks matched-width runtime and full category/data parity. MCP remains quota-limited, and the full inventory, regression, Docker, delivery and CI gates remain open. Docs-only reconciliation; no source/API/data/Figma changes, build or tests.


### Global Search All live-data follow-up — 26.10.2026

Manual Chrome review of `/en/search?q=e` confirms the current API category totals: Films197, Users437, Lists25, Tags5, Cast & Crew6, Reviews115, Journal0. The default All presentation renders six film cards and three review cards, matching the high-level content density of Figma `1480:6991`; current API names, artwork availability and copy differ from the Dune sample. The browser viewport was1920px, while the frame is1440px wide, so this is data/structure evidence only, not matched-width geometry. No code/API/data changes or tests; the UI block remains open pending matched-width and remaining-state checks.


### Frontend worktree build baseline — 26.10.2026


npm run verify:build` from `frontend/` passed on the current worktree: `tsc --noEmit` succeeded and Vite transformed231 modules and built production assets successfully. This confirms compilation only; no automated tests were run. No code was changed in this checkpoint.


### Global Lists catalog phone composition — 26.10.2026

After restart, `figma_whoami` authenticates and `create_session` succeeds for file `BDO9GO1oscOeUTcu4VXVKA`; `get_design_context` still returns the Starter MCP call-limit error. The live Chrome canvas screenshot shows full current-Copy phone frame `1480:8280`, inspector393×1809. Visually confirmed composition: hero/CTA; Featured lists; Popular this week; Recently liked; additional named editorial/sample rails; Crew lists; Popular tags; fixed bottom navigation. Read-only source inspection of `PublicLists.tsx` confirms Featured → Popular → Recently liked → Recent and then Popular tags. Missing Crew and distinct editorial feeds remain documented gaps under the existing decision to keep real feeds and not invent static content. Count one newly visually classified frame at composition/section-order scope only; do not infer pixel parity or populated-data parity. No source/API/data/Docker/Figma mutation, build or tests.


### Popular Lists phone sort label — matched visual check — 26.10.2026

On the live current-Copy canvas, selected phone frame `1480:7927` is393×1301. Its “Sort by popularity” child is98×12 at x279/y271, and the Prototype tab has no configured action. Added a translated static span plus decorative chevron to the mobile Popular Lists feed. Chrome/Vite source at effective393×852: EN span is x279/y271/98×12; first API card begins y319; document scroll width393. UK renders “За популярністю” at x279,98px wide with no overflow. This earlier entry's320px attempt was inconclusive; the later follow-up below records the final measured 320px correction.
npm run verify:build` completed successfully: `tsc --noEmit` and Vite production build (231 modules). The static visual omission is fixed; the backend still has no time-period popularity contract. No automated tests, API/data/Docker changes, or external writes.


### Popular Lists card hierarchy and narrow viewport follow-up — 26.10.2026

Figma `1480:7927` shows each mobile list name and count above its poster collection. The mobile Popular feed now renders the API-backed localized `itemCount` in that position. At CSS393×852 EN, sort is x279/y271/98×12; first card x16/y319/361×150; heading x35/y330; count x336.5; poster rail begins y352; four records, Page1of10, `scrollWidth=393`. UK count is localized to `1 фільм`. The API returns one preview film per list while Figma's samples show multiple posters; keep live content. At CSS320, `innerWidth=320` and classic-scrollbar `clientWidth=305`; the full-bleed hero now spans x0..305 and first card x10..295, with document `scrollWidth=clientWidth=305`, after correcting a6px overrun.
npm run verify:build` passes TypeScript and Vite (231 modules). The frame is a recheck, not a new frame ID; period sorting remains an API gap. No tests run.


### PublicProfile overview phone responsive/data review — 26.10.2026

Current-Copy `825:1378` is393×2355. The live canvas visibly shows avatar, Follow, Favorite films, activity/reviews, Following, Lists and lower profile content. Authenticated `/en/users/7748` at CSS393 has hero x0/y0/393×609.58, H1 x60.95/y317/271.08×28 and Favorites x16/y644.58; Figma's established Favorites anchor is y590. The authenticated source also exposes Block/Message actions and has different live profile data; preserve these actions/content and keep the placement difference open. No avatar image rendered for this API record, unlike the Figma sample. At320px EN and UK the 22px display name fits x45..275; hero width320. EN at393/600/720/768/1024/1440 has no document overflow; at1440 the hero is full-bleed and content rail x120/y1269. This verifies responsive bounds for this profile data, not pixel parity or all profile states. Existing frame; no new ID. No source/API/data/Figma change, build or tests in this review.


### PublicProfile Following More sheet responsive and keyboard check — 26.10.2026

Figma `1033:5681` is393×852 and shows Unfollow, Block, Go to member and Done for a followed member. The live EN route `/users/7748?view=following` at CSS393 renders the sheet x16/y522/361×295 with56px actions. At320 it is x16/y470/288×295 and the row, sheet and controls remain inside `scrollWidth=clientWidth=320`. Initial focus is Done; Tab cycles to Follow and Shift+Tab returns to Done; Escape closes and restores focus to More. The live relation is not-following, so `Follow` correctly reflects API state instead of the Figma sample's `Unfollow`. No network action was activated or source/API/data changed.
npm run verify:build` passed: TypeScript plus Vite production build (231 modules); automated tests remain deferred until visual inventory closes.


### Own Profile Reviews phone — source geometry and keyboard — 26.10.2026

Current-Copy Figma `1023:1867` is selected on the live canvas; inspector reports393×1434. The phone frame visibly shows the owner Profile hero, Profile-selected rail, Reviews heading/cards and five icon-only navigation items. Authenticated UK and EN `/profile?view=reviews` were checked at393×852: source hero bottom496; profile tabs x16/y531/361×44; review section x16/y598; heading y607; first card x16/y647/361×208; poster x34/y673/79×116; document `scrollWidth=393`, `scrollHeight=1316`. These measured anchors align with the current Figma screenshot at its displayed zoom. The API contains one review, while the frame shows three sample reviews; content and total page height remain data-dependent. Keyboard Tab reaches navigation, Profile action/back, counters/tabs, film/review links and Edit/Delete; visible outline is present. Edit and Delete targets measure86.6×44 and93.5×44; no action was activated. This reopens no new frame ID and does not claim complete pixel parity. No application/API/data changes or build/tests in this checkpoint.


### Own Profile Reviews desktop — matched-width correction — 26.10.2026

Reconnected Figma after reboot: `whoami` and `create_session` succeed; `get_design_context` still returns Starter call-limit. Browser canvas Find opened current-Copy `363:289` (1440×2859). The frame shows an “Edit Profile” CTA at the bottom of the identity hero, then a separate Back image and divider after the profile rail. Selected-layer positions: Back image x121/y1269/30×30, heading x120/y1335/525×27, first poster x121/y1417/265×395. Updated `/uk/profile?view=reviews` desktop, reusing the existing profile-settings action and back route. At CSS1440×900, local measurements are CTA x584/y895/272×60; Back row x120/y1269/1200×44 with44×44 link; heading x120/y1334/1200×26.875; first card x120/y1415.875/1200×395; poster x121/y1415.875/265×395. Poster/heading anchors align within about1.2px. UK phone393×852 recheck: `scrollWidth=clientWidth=393`, mobile CTA hidden, prior hero/heading/card/poster geometry unchanged, Tab focus ring visible on mobile nav. API has one real review versus three Figma samples; no fixture/data/API changes.
npm run verify:build` passed `tsc --noEmit` and Vite production build (231 modules). No automated tests run.


### PublicProfile Following phone — canvas/runtime control-size recheck — 26.10.2026

After the workstation restart, the live Figma canvas opened current-Copy `1023:4597` at393×852. The frame shows the Following header, relationship rows, separate More and Follow controls, and fixed five-item navigation; the neighboring followed-state sheet shows Unfollow, Block, Go to member and Done. Local EN `/users/7748?view=following` was manually reopened at CSS393×852: Back target x16/y50/44×44; row begins x16/y123; member link x16/y123/257×44; More x281/y123/44×44; Follow x333/y123/44×44; `scrollWidth=393`. The control order/structure agrees with the frame at this viewport; this is not an exact-pixel claim. The API returns one live member versus ten Figma examples, so row count and full-page height remain data variance. No unique frame ID added; no source/API/data change, build, or automated test in this recheck.


### Own Profile Following desktop — hero/toolbar variant correction — 26.10.2026

Compared current-Copy frame `445:455` (1440×3863; its layer name says “Followers”, but the visible section is Following) with `/uk/profile?view=following` at CSS1440×900. Confirmed a selector bug:
etworkView` had also set `data-films-view`, hiding the owner identity and leaving a duplicate page H1 over the hero. Split the route flags, kept the network H1 screen-reader-only, restored the desktop hero identity, hid the Films-only hero controls, and added the frame’s existing “Edit Profile” action through the current profile-settings flow. Source anchors now measure hero1440×1020, identity x519.7/y555, metrics x395/y716.8, Edit Profile x584/y895/272×60, profile rail x120/y1105/1200×79, Back x120/y1257/44×44 and Following heading x120/y1335/1200×27; document width1440 with no overflow. At CSS393×852, the standalone phone toolbar remains x16/y0/361×94 with a44×44 Back target; hero/profile rail remain hidden and `scrollWidth=393`. The live own account has no Following rows, while Figma shows populated examples and per-member Watched/Lists/Likes values that the current API does not provide. Preserve the real empty state and document the per-member counters as an API gap. This rechecks an existing frame; no new frame ID or fake data.
npm run verify:build` passed TypeScript and Vite (231 modules); no automated tests run.

Keyboard follow-up for Own Profile Following desktop: on `/uk/profile?view=following` at1440×900, Tab reaches the visible localized Edit Profile button without activation. The focus ring is3px cyan with4px offset and remains contained by the viewport.


### Own Profile Followers desktop — shared network layout recheck — 26.10.2026

Current-Copy Figma frame `363:411` (1440×3863) has a misleading layer label (“Following”) but its visible section is Followers. Compared `/uk/profile?view=followers` at CSS1440×900 after the shared network-view correction: hero1440×1020; identity x519.7/y555; Edit Profile x584/y895/272×60; rail x120/y1105/1200×79; Back x120/y1257/44×44; Followers heading x120/y1335/1200×27; document width1440 with no overflow. Tab reaches the localized CTA with a visible3px cyan outline and4px offset; no action was activated. The API returns an empty own Followers list, whereas Figma shows populated example rows with Watched/Lists/Likes columns; these per-member values are absent from the current API and remain a documented data-contract gap. Existing frame only; no new frame ID or source/API/data change in this recheck.
npm run verify:build` passes TypeScript and Vite (231 modules); automated tests remain deferred.


### Own Profile Following phone — post-reboot canvas/runtime checkpoint — 26.10.2026

Current-Copy Figma phone `1023:3020` is selected in the live canvas; the inspector confirms393×852. The visible frame has a Following header, ten example relationship rows with follower/following counts, More and followed-state controls, and five-item bottom navigation. Figma MCP authentication/session creation work after reboot, but `get_design_context` remains blocked by the Starter plan tool-call quota (`whoami` confirms the Starter tier); manual canvas inspection and local runtime comparison were used. Authenticated UK `/profile?view=following` at CSS393×852 shows the existing empty state because the live API has no own following rows. Measured local shell: collection toolbar x16/y0/361×94, Back x16/y50/44×44, fixed bottom nav x0/y760/393×92; `scrollWidth=393`. Shell/viewport structure is checked; populated row geometry and page height differ due to real API content, and no sample data was introduced. Existing frame only; no new frame ID, source/API/data changes, or automated tests.
npm run verify:build` passed TypeScript and Vite (231 modules). The active goal criteria were updated to count reviewed frames/gaps and release gates rather than estimate an arbitrary percentage; visual inventory and later regression/Docker/commit/push/CI gates remain open.

### PublicProfile Followers responsive and empty-state review — 26.10.2026

Manual local EN/UK `/users/7748?view=followers` inspection; no action/API mutation. Existing Figma frame `363:411` (1440×3863) was reselected by its `My Profile Page "Followers" - Simchuk` name; screenshot shows sample rows, at20% frame opacity. At CSS1440×900 EN (layout client width1425 due classic scrollbar), the follower section is x120/y1317/1200×127 and heading y1335/1200×27. At CSS393×852 UK, section x16/y123/361×23, fixed bottom nav x0/y760/393×92, document width393. At CSS320×852 UK, section x16/y123/288×23, nav width320×92, `scrollWidth=clientWidth=320`. UK empty copy is «Підписників поки немає». Tab shows a3px cyan outline on a nav link at both widths; Follow/Block were not activated. Live API is empty while Figma has sample rows; classify this as sample/API content variance. No source/API/data changes; no automated tests run, per visual-audit sequencing. Viewport override was cleared and the original local/Figma routes restored.


### PublicProfile Followers error/retry focus recovery — 26.10.2026

Confirmed the failure with a temporary Chrome `Network.setBlockedURLs` rule matching only `*users/7748/followers*`; removed it before finishing. On UK `/users/7748?view=followers` at CSS393×852 the error notice is x16/y123/361×97 and Retry is162.25×44; document width stays393. Keyboard Enter retries while the endpoint is still blocked; after the repeated error, focus returns to visible `public-profile-view-title` and its computed focus outline is2px cyan. After removing the block, Enter retries successfully; the empty-state copy replaces the alert and focus remains on that H1 with the same outline. At CSS1440×900, both repeated failure and success return focus to visible `public-profile-followers-title` H2 with2px cyan outline; `scrollWidth=clientWidth=1425` (15px classic scrollbar).
npm run verify:build` passed TypeScript (`tsc --noEmit`) and Vite (231 modules). No automated tests, API/backend/data changes, or follow/block actions. Viewport and browser routes restored.


### Lists phone frame and live feed inventory — 26.10.2026

After reboot, Figma `whoami` and `create_session` succeeded; `whoami` confirms the Starter plan and a fresh node read returns the MCP tool-call limit. The existing Chrome Figma canvas remained readable. Selected node `1480:8280` confirms a 393×1809 phone frame with intro/CTA, Featured lists, Popular this week, Recently liked, Crew lists, Popular tags, and fixed bottom navigation. Local `/en/lists/discover` was opened in Chrome at its available 1920×855 desktop viewport. The accessible route tree shows Featured lists empty, Popular now with six current API list records, Recently liked empty, Recent with six records, and Popular tags with ten current tags. Screenshot confirms the desktop intro/CTA and Featured empty-state composition. This is not a matched-size comparison: no phone viewport was captured. Data is live, including verification-like long tag values; nothing was changed or substituted. Featured/Crew feed support remains the previously documented API gap and scope decision. No code/API/data/Figma changes, build or tests.

The same canvas session reselected desktop sibling `1480:4983`, inspector1440×3816. At20% canvas zoom, the screen shows intro/CTA, Featured row, Popular row, Recently liked cards, Crew row, Popular tags and footer; this frame was already crosswalked. Local runtime stayed at1920px, so no matched desktop geometry is claimed. On local Lists, keyboard Tab focused the hero CTA, Featured `View all`, Popular `View all` and first Popular list card in sequence. Gold focus outline was visible on each checked target; no link was activated. Earlier 393px anchors for phone `1480:8280` are already documented in this file’s handoff source; this pass did not repeat them. No source/API/data changes, build or automated tests.


### Search All versus local no-match data — 26.10.2026

Figma canvas node `1480:8934` is the expanded 393×2801 Search All frame with visible Dune sample groups. Local `/en/search?q=Dune` loaded with0 results in all seven categories and rendered “There were no matches for your search term”; UK returned the same category counts and localized empty heading, hint and Home link. The local browser screenshot was1920×855, not a matched-size capture. This records current local API/sample-data variance. Existing phone `1480:8856` and desktop `1480:5809` no-match frames are the correct empty-state mappings. No code/API/data/Figma change, build or tests.


### Search All populated data and keyboard focus — 26.10.2026

Figma `1480:8934` remains the expanded phone Search All reference (393×2801). Local EN `/search?q=Journey` at1920×855 returns5 users and4 lists; other five categories return0. Tab navigation from the header passes through the query controls and category tabs to a list result link; its cyan focus ring is visible and the link was not activated. This validates the current populated API route and keyboard reachability, not width parity or the Figma Dune sample content. No new frame ID or source/API/data changes; no build or automated tests.

Magnified the same existing canvas frame to70% and visually inspected the visible result groups: sample reviews, member rows, tags, poster rails, a cast/film image card and bottom navigation. Local `/en/search?q=Journey` was scrolled to the top at1920×855; it shows the live query, match heading, All selector and Users group, with Lists below. This records current composition/data evidence only; the phone393×2801 frame was not compared at a matched local width, and no new frame ID is added. No source/API/data changes, build or tests.

Ran
npm run verify:build` from `frontend/` after the Search/Profile visual-audit checkpoint. TypeScript `tsc --noEmit` passed, then Vite built successfully with231 modules (`vite v7.3.7`). No automated tests were run; the visual inventory remains open.


### Figma MCP post-reboot verification — 26.10.2026

`whoami` and `create_session` succeed for the authenticated Figma account/file. The account is Full seat on the Starter tier; a fresh `get_design_context` read for `1480:8934` returns the explicit Starter plan MCP tool-call limit. The browser canvas remains open and accessible; it shows the selected Search All phone frame at393×2801. This confirms the blocker is the plan call quota, not a disconnected plugin. It adds no frame coverage and changes no source, API, data, or Figma content; no build or tests were run.


### PublicProfile Films and Watchlist phone runtime recheck — 26.10.2026

Current UK/EN routes /users/7748?view=collection&collection=watched|watchlist were manually inspected at CSS393×852 and320×852. Watched is genuinely empty: content begins x16/y123, with361px width at393 and288px at320; document scroll width equals viewport. Watchlist returns one real film with null poster URL: its fallback card occupies x16/y123/79×116 at393 and x16/y123/60.8×89.2 at320. UK/EN labels are localized and widths remain exact. Keyboard Tab reaches the first poster link in both locales; its focus outline is2px amber. The current Figma crosswalk maps Watchlist `861:1474` (393×1060); `845:1679` (393×1162) is now an unclassified candidate, not a confirmed Films frame. Previously recorded first-slot geometry supports the Watchlist comparison only. The populated Watchlist first slot aligns; Figma's multi-row sample and the local one-item API page differ in content/height, while Films has no local items. During this pass the selected Figma node inspector confirmed the phone frame dimension but the canvas did not recenter to that exact node, so no full-frame screenshot parity is claimed. No fake data or source/API changes.
npm run verify:build` passed TypeScript and Vite (231 modules); no automated tests were run.


### PublicProfile Lists locale and keyboard follow-up — 26.10.2026

On the existing desktop Figma mapping `175:619` (1440×2805), UK and EN `/users/439?view=lists` both render one API-backed public list and two tags; the Figma frame shows two sample cards. UK labels render “Публічні списки”/“Теги списків”; EN renders “Public lists”/“List tags”. Tab traversal reaches the selected Lists link in both locales and the gold focus ring is visible in the available wide browser screenshot (~1920px). This is not a matched-width comparison and does not close mobile or loading/error/retry states. Existing frame and API data only; no code/API/data/Figma changes, build or tests.


### Owner Profile Watchlist post-reboot session check — 26.10.2026

The saved authenticated Chrome session survived the PC restart. `/uk/profile?view=collection&collection=watchlist` shows the live account's empty Watchlist message. Browser CSS viewport is1920×855; document/client width is1905 due to the classic scrollbar, and the collection section/heading sit at x360/y1269 in a1200px rail. Keyboard Tab reaches the REWIND brand link with a3px cyan outline and3px offset. This is a responsive shell and focus observation only: it is not a same-width comparison with Figma Own Profile Watchlist frame `341:3632` (1440×3482), and the empty API state differs from the populated design sample. The Figma canvas screenshot visibly selects `341:3632` and confirms its six-column sample grid and lower How To Add block. No source/API/data changes, build, automated tests or Figma edits in this checkpoint. Figma `whoami` and file-session creation work; `get_design_context` still returns the Starter tool-call quota limit. Owner collection error/retry focus remains unverified.


### Owner Profile Lists at wide desktop viewport — 26.10.2026

Authenticated UK and EN `/profile?view=lists` at CSS1920×855 both show the real Watched, Watchlist and Favorites system lists with counts1/0/1 and localized section/count labels. No horizontal overflow: `scrollWidth=clientWidth=1905`. The section/title is x360/y1269/1200px; three cards are1200×339 at y1343.9,1706.9 and2069.9. These inner dimensions and vertical anchors match the previously measured Figma Own Profile Lists geometry at CSS1440 (crosswalk frame `341:4198`), where the same rail begins x120; the live wider viewport moves the centered rail to x360. This is not a matched-width capture. The Figma sample cards are custom lists, while this account currently returns only system lists; do not infer missing API support or inject samples. On UK, Tab focus proceeds through global navigation, Profile actions, Back, metric links and collection tabs; the focused tab is scrolled into view with a visible2px amber outline. No source/API/data changes, build or tests.


### Owner Profile collection Retry focus implementation and layout smoke — 26.10.2026

Code review found a deterministic focus-loss path: `collectionAttempt` triggers a new fetch, the fetch effect immediately clears the error, and the focused `RetryNotice` is removed. `Profile.tsx` now marks Retry activation and moves focus to the collection H2 after the request settles; `Profile.module.css` adds a2px cyan focus-visible outline for that heading.
npm run verify:build` passed `tsc --noEmit` and Vite (231 modules). A post-HMR manual check at CSS1920×855 shows the same real empty Watchlist, H2 and section at x360/y1269/1200px, `scrollWidth=clientWidth=1905`, with no layout shift/overflow. The exact error→retry transition could not be triggered through the available CUA controls, so focus recovery itself remains unverified in runtime and is not counted as a fully closed frame/state. No automated tests, API/data or Figma edits.


### Owner Profile Reviews at wide desktop viewport — 26.10.2026

On the saved authenticated UK `/profile?view=reviews` route, CSS viewport1920×855 produces one real review. The page has no horizontal overflow (`scrollWidth=clientWidth=1905`); the heading is x360/y1334, first poster x361/y1415.875/265×395. Manual Tab traversal visited the brand, global navigation, account control, search, profile actions, Edit Profile and metric links. Observed focus outlines:3px cyan on global controls and Edit Profile,2px amber on the profile-actions button and metric link. Figma Own Profile Reviews `363:289` is1440×2859, so this is responsive/keyboard evidence only, not a matched-width comparison. API returns one review while Figma shows three samples. No source/API/data changes, build or automated tests.


### Own Profile Avatar & Banner settings frame audit — 26.10.2026

The current Figma Copy canvas selected `251:660`, “My Profile Page Edit Profile-Avatar & Banner”, 1440×3120. It shows separate Avatar and Banner previews with “Select new avatar/banner” actions. The API-backed `/uk/profile?settings=avatar` route was inspected in the authenticated browser at CSS1920×855: its current tab is “Avatar URL” and the form has one URL input plus Save; current `User`/profile DTO and update request expose `avatarUrl` only, with no banner property or upload endpoint. This is a confirmed design/API capability gap; no local-only upload or fabricated banner state was added. The viewport was not 1440, and EN, keyboard, and exact geometry are still open. No source/API/data/Figma changes, build or automated tests.

The live Figma Copy phone frame `1043:2125` is titled “Profile Page Profile phone” and measures393×1905. Its canvas visibly includes username, given/family name, email, location, website, bio, pronoun, reply preference, favorites, avatar/banner previews and social connections. The API-backed UK `/profile?settings=profile` route was inspected structurally at CSS1920×855; it exposes username, display name, email, favorites, with avatar/social forms composed into the phone layout by responsive CSS. Current persistence has no separate given/family names, location, website, bio, pronoun or reply-privacy fields; banner upload remains unsupported. The frame is recorded as open because the local browser viewport cannot currently be set to393 in the available CUA surface; UK/EN mobile geometry and keyboard are unverified. No source/API/data/Figma changes, build or automated tests.


### Own Profile Connections settings — 26.10.2026

After reboot, Figma `whoami` and file-session creation succeed; `get_design_context` still returns the Starter MCP call limit. The live canvas search for “Twitter” selected text node `341:3311` in Connections frame `341:3207`; screenshot shows Social platforms cards for X (formerly Twitter) and Instagram with account-connect copy. Local UK `/uk/profile?settings=connections` and EN `/en/profile?settings=connections` expose Website, Instagram, TikTok and Letterboxd URL fields via the existing social-links API. At the available CSS1920 viewport, UK keyboard Tab reaches Save with a visible amber focus ring; no value was changed or submitted. The frame’s OAuth/connect actions are not represented by current API contracts, so keep them documented as a capability gap; this is not a matched-width comparison, and CSS1440 geometry, mobile state, error/retry and save outcomes remain open. No source/API/data/Figma changes, build or automated tests.


### Own Profile Authentication keyboard follow-up — 26.10.2026

On UK `/profile?settings=authentication`, the current-password input, new-password input, confirmation input and localized “Змінити пароль” action are present. Starting at the current-password input and tabbing through the form reaches the action with a visible amber focus ring at CSS1920×855. No password was typed and the action was not submitted. This extends the already-recorded phone summary frame `1043:2233` and desktop form frame `251:549`; it does not close their matched CSS393/CSS1440 geometry or real success/error states. No source/API/data/Figma changes, build or automated tests.
Figma follow-up: direct navigation to `1043:2233` after the Connections review left the canvas in its Loading state, so the phone frame was not re-captured in this pass; its existing screenshot/Prototype findings remain the basis for the ledger row. No additional frame coverage is claimed.


### Owner Profile network and collection data recheck — 26.10.2026

Read-only Chrome inspection at the available CSS1920×855 viewport: UK own Following/Followers each show count0 and localized empty copy; EN `/profile?view=following` and `/profile?view=followers` show the corresponding empty copy and count0. UK/EN own collections agree on Watched1, Watchlist0, Favorites/Likes1; the live Watched item is “Concurrent review film e9bd3cd2”, the current favorite is “Send Help”, and the three system lists have counts1/0/1. These are API-backed account records, not Figma fixture data; this viewport does not match the 1440/393 frames. PublicProfile `/users/7748?view=following` in UK and EN returns one actual member row and an unchecked Follow control (viewer does not follow that member). The Figma variant `1033:5458` depicts an already-followed action, so it is now recorded as a data-state gap; no relationship action was clicked. No source/API/account changes, build or automated tests.


### Own Profile Likes canvas and Figma MCP recheck — 26.10.2026

The live Chrome Figma canvas recovered after the earlier direct-link Loading state. Selecting current-Copy node `1015:4508` confirms the phone frame dimensions are393×1666; screenshot shows the selected Likes rail, curated poster grid and fixed bottom navigation. Existing UK source comparison at CSS393×852 in this evidence log places the Likes heading and first API poster within1px of the Figma anchors; that prior runtime capture is reused, not repeated in this pass. Fresh `whoami` reports the authenticated Full seat on Starter, and `get_design_context` for `1015:4508` explicitly returns the Starter MCP tool-call limit. Manual canvas is usable; structured node context remains quota-limited. No source/API/data/Figma changes, build or automated tests.


### Own Profile Watchlist Figma canvas re-open — 26.10.2026

The authenticated Chrome canvas recovered and direct selection of current-Copy node `1015:3356` now shows the exact phone frame at393×1564. Its screenshot confirms the Watchlist-selected profile rail, populated four-column sample grid and fixed bottom navigation. The matching authenticated UK source viewport at CSS393×852 was measured in the earlier current-source checkpoint: profile rail, Watchlist tab, collection heading and empty message align to the stored Figma anchors (heading y606 vs source y607; first poster/grid start y646 vs source y647). The real API returns an empty Watchlist, so the grid/page-height variance remains documented; EN and filter-keyboard coverage remain open. This reopens an existing frame, not a new ID or a fresh local viewport capture. No source/API/data/Figma changes, build or automated tests.


### Figma MCP and Owner Watchlist desktop frame recheck after workstation restart — 26.10.2026

Figma `whoami` and file-session creation succeeded. A fresh `get_design_context` request for existing node `341:3632` returned the explicit Starter plan MCP call-limit message. The open Chrome canvas remains usable: the selected Owner Profile Watchlist desktop frame is1440×3482 and visibly contains the active Watchlist rail, a six-column curated poster grid and the How To Add section. This is canvas evidence only; no matched1440 CSS source screenshot was taken during this pass. No frame was added to the inventory; no source/API/account/Figma change, build or automated tests.


### Owner Profile Watchlist UK/EN live empty state and keyboard focus — 26.10.2026

In the authenticated Chrome app at its available wide viewport (~1920×855), `/uk/profile?view=collection&collection=watchlist` displays the genuine localized empty state «У цій добірці поки немає фільмів.» and EN `/en/profile?view=collection&collection=watchlist` displays “There are no films in this collection yet.” Both have API count0. Keyboard Tab traversal reaches the selected Watchlist link in UK and EN; its visible gold focus outline is present, and no action was activated. The screenshot/UI control exposes no CSS viewport override here; DevTools keyboard shortcuts did not open it. Thus this adds locale/state/focus evidence but does not close EN phone 393px geometry for `1015:3356`. No code, API, account, or Figma mutations, build, or automated tests.


### PublicProfile Likes desktop frame and live UK/EN state — 26.10.2026

Figma Find on the current-Copy canvas selected `175:177`, “Profile Page Likes - Simchuk”; inspector confirms1440×3256. The frame has the Likes profile rail selected and a populated multi-row poster grid. Local `/uk/users/7748?view=collection&collection=favorites` shows API-backed count0 and localized empty copy «У цій добірці поки немає фільмів.»; `/en/users/7748?view=collection&collection=favorites` shows count0 and “There are no films in this collection yet.” At the available wide viewport (~1920×855), keyboard traversal reaches the selected Likes link with a visible gold outline in both locales. No relationship or message action was activated. The CSS viewport is not1440, so this verifies locale/state/focus only, not new geometry parity. Crosswalk mapping `175:177` remains the existing PublicProfile Likes item; own Likes is `341:3866`. No code/API/account/Figma changes, build or automated tests.


### PublicProfile Watchlist live data and keyboard — 26.10.2026

The live Figma canvas selected PublicProfile Watchlist `153:180`; inspector confirms1440×3120. It shows Watchlist selected and a populated six-column poster grid. UK and EN `/users/7748?view=collection&collection=watchlist` both return one live film, `Concurrent social film 5a62c9ea`, year unknown, rating4; the app renders its fallback poster because the record has no poster. This corrects the previous claim that the public Watchlist is empty: the real state is one API item versus Figma's multi-row sample. At the available wide CSS viewport (~1920×855), keyboard traversal in UK and EN reaches the selected Watchlist link with a visible gold outline; no relationship action was activated. No new matched-width comparison was made; current crosswalk geometry evidence is reused. No source/API/account/Figma changes, build or automated tests.


### PublicProfile Films UK/EN state and keyboard — 26.10.2026

Figma current-Copy frame `122:176` (“Profile Page Films - Simchuk”) is1440×3256 and shows Films selected with a filled multi-row poster grid. The authenticated local public route `/uk/users/7748?view=collection&collection=watched` and EN equivalent both return count0 with localized empty-state copy. At the available wide CSS viewport (~1920×855), Tab reaches the selected Films link and its gold outline is visible in both locales. No action was activated. This rechecks live data/state and wide keyboard path; it does not add a CSS1440 or phone comparison. Existing crosswalk maps this as PublicProfile Films; no code/API/account/Figma changes, build or automated tests.


### Own Profile Likes EN keyboard recheck — 26.10.2026

EN `/profile?view=collection&collection=favorites` returns one live item, Send Help (2026, rating4). Tab traversal reaches the selected Likes link and the wide (~1920px) screenshot shows a visible gold outline. This supplements the existing CSS393 UK geometry evidence for Figma frame `1015:4508`; it is not matched-width EN evidence. No link was activated; no source/API/data change, build or automated tests.

UK follow-up: `/uk/profile?view=collection&collection=favorites` returns the same live Send Help item (2026, rating4); Tab reaches “Вподобання” with a visible gold outline. This is wide-viewport locale/keyboard evidence only; the existing UK CSS393 anchors remain the geometry evidence. No source/API/data changes, build or tests.


### Figma access recheck after workstation reboot — 26.10.2026

`whoami` and `create_session` succeed, but `get_design_context` still returns the Starter MCP tool-call limit. Manual Chrome canvas navigation loaded existing Owner Profile Likes frame `1015:4508`; inspector reports393×1666 and the screenshot visibly shows the selected Likes tab and film grid. Local Rewind CSS viewport could not be set in this browser session, so this is Figma access evidence only, not a local visual verification or release gate. No source/API/data/Figma changes, build or automated tests.

The same canvas also rendered existing Owner Profile Watchlist phone frame `1015:3356` (393×1564). At100% canvas zoom, the selected Watchlist / “Wants to see” view clearly has a four-column sample poster grid and mobile navigation; the authenticated UK/EN API state is empty. This confirms the phone sample/data variance previously recorded, while the existing UK393px title/top-content anchors remain aligned. EN geometry and matched-width keyboard/filter checks remain open. No code/API/data/Figma change, build or tests.


### Own Profile Avatar & Banner settings contract check — 26.10.2026

Current-Copy Figma frame `251:660` (1440×3120) shows distinct avatar and banner preview panels plus separate “Select new avatar” and “Select new banner” actions. The authenticated UK `/profile?settings=avatar` page’s accessibility tree exposes only avatar preview, avatar URL input and Save. Backend `ProfileResponse`/`ProfileUpdateRequest` and frontend `profile.api.ts` expose `avatarUrl`, with no banner field or upload operation. Under the accepted no-new-contract scope, record banner selection/upload/persistence as a documented API gap; do not present a local-only preview as saved functionality. Avatar geometry, UK/EN and keyboard remain open. No source/API/data/Figma change, build or tests.


### Own Profile Connections current canvas/runtime contract check — 26.10.2026

Current-Copy frame `341:3207` (1440×2073) shows X and Instagram connection cards, Connect/Connected states and account-link/import copy. The authenticated UK `/profile?settings=connections` accessibility tree exposes Website, Instagram, TikTok and Letterboxd URL fields plus Save. Backend `ProfileService` accepts those four platform names only; no X/OAuth/import contract exists. Existing URL editing is supported; Figma connection/import behavior is a documented gap under the no-new-contract scope. Matched-width geometry, phone, error/retry and submit states remain open. No code/API/data/Figma change, build or tests.


### Own Profile Authentication desktop structure recheck — 26.10.2026

Figma current-Copy `251:549` is1440×2061 and visibly contains Current password, New password, Confirm new password and Change. Live UK `/profile?settings=authentication` exposes all three password inputs and a localized Change password button, plus the existing byte-limit guidance. This is structure/contract evidence only: the local viewport was not1440 CSS px, and no password was entered or submitted. Desktop geometry and success/error outcomes remain open. No source/API/account change, build or automated tests.


### Own Profile Authentication phone summary action check — 26.10.2026

Current-Copy `1043:2233` is393×852 and shows a Settings header, email row and Account password row. The selected frame's Prototype sidebar has no configured interactions. The live UK authentication route exposes the password-change form at the available wide viewport; phone-width behavior and any summary-row action are not established. Keep the existing password API route and do not infer a transition. No password was entered or submitted. No source/API/account/Figma change, build or tests.


### Lists Popular live pagination keyboard recheck — 26.10.2026

Figma current-Copy phone frame `1480:7927` remains accessible through the Chrome canvas after reboot; inspector confirms393×1301. Figma structured context is still blocked: `whoami` reports Full seat/Starter tier and `get_design_context` returns the Starter MCP call-limit message. Local EN `/en/lists/discover?feed=popular` moved page1→2 using the visible Next button, then keyboard focus + Enter moved page2→3 of10. The local viewport was wide; this is interaction evidence, not matched-width visual parity. Live verification records were only displayed. No code/API/data/Figma/DB/Docker changes, build or tests.


### Lists Popular desktop and UK keyboard focus — 26.10.2026

The existing current-Copy desktop frame `1413:7194` is1440×2821 and visibly shows four editorial rows with multi-poster image strips, a sort-by-popularity label, pagination and footer. UK `/uk/lists/discover?feed=popular` at the available ~1920px local viewport renders the localized Popular hero, four live API records, page1of10, tags and footer. The current page contains verification-looking API records; no record was mutated. Keyboard Tab reaches `Далі` and screenshot confirms its cyan focus ring; this extends interaction evidence in UK but is not a matched1440 comparison. Existing endpoint has no sort-period parameter. No frame inventory addition, code/API/data/Figma/DB/Docker changes, build or tests.


### PublicList normal/ranked desktop and live detail state — 26.10.2026

Figma canvas confirms normal `1480:6071` and ranked `1480:6134`, both1440×2033: the normal six-column poster wall is unnumbered; the ranked “My Top” wall labels positions1–8. The visible create-list state also has a Ranked checkbox with “Show position for each film”. Local EN `/en/lists/public/19606` returns a real API detail with one film. Wide local screenshot shows no rank badge, but that does not establish1440 geometry or content parity. Source review confirms the detail DTO lacks a ranked flag. CSS correction to earlier wording: the JSX creates ordinals but media rules hide them at widths≥1024 and≤640; they appear only at641–1023, where a normal list can be mislabeled. Ranked desktop/phone remain unrepresentable and the ordinary tablet state is wrong; retain the gap rather than infer mode. No code/API/data/Figma/DB/Docker change, build or tests.

Figma ranked phone `1480:9353` is393×852 and visibly presents eight numbered poster slots in a4×2 grid, the “My Top” metadata hero and fixed five-item bottom navigation. The same live API detail has one movie; local browser remained wide, so no phone-width geometry/focus comparison is claimed. No new frame ID, no list creation/like/edit, no code/API/data/Figma/DB/Docker change, build or tests.


### PublicProfile Watchlist phone exact-width source recheck — 26.10.2026

The existing current-Copy frame `861:1474` was compared again using a fresh local UK capture at CSS393×1060, matching the frame dimensions. The header shows Back, “До перегляду” and Filters; the first API-backed poster card is x16/y123/79×116, matching the saved Figma slot measurement. The existing live record has no poster URL, so the application correctly shows its fallback poster; the Figma example contains multiple curated rows. Keyboard traversal reaches the poster link and no action is triggered; `scrollWidth=393`.
npm run verify:build` passed TypeScript and Vite (231 modules). This updates the existing frame record, not the global inventory; no source/API/account/Figma mutations and no automated tests.

### Own Profile Watchlist EN wide locale and keyboard follow-up — 26.10.2026

Figma node `1015:3356` is selected on the live canvas; inspector confirms393×1564 and its four-column populated poster sample. The authenticated Chrome route `/en/profile?view=collection&collection=watchlist` renders the actual empty state (“There are no films in this collection yet.”). Tab traversal reaches the selected Watchlist link; the screenshot shows the active tab with its gold keyboard focus outline. The browser CSS viewport is wide (~1920×855), not393×1564, so this is locale/focus evidence only and the EN phone row remains `open`. No collection/filter action was activated; no data, source or Figma edits; no build or automated tests.


### PublicProfile Films phone source capture — frame mapping still open — 26.10.2026

A fresh local UK capture of `/uk/users/7748?view=collection&collection=watched` at CSS393×1162 shows the API-backed empty state and `scrollWidth=393`. Figma direct navigation to node `845:1679` reached a selected frame whose inspector reports393×1162, but the canvas view did not center its full contents; the visible crop was not sufficient to verify the frame’s route identity or compare its contents. This is explicitly left open; no matched status or new mapping is claimed. No source/API/data changes, build or automated tests.


### PublicProfile Watchlist phone EN exact-width and keyboard — 26.10.2026

Figma current-Copy `861:1474` is selected on the canvas; the inspector confirms393×1060 and the frame shows the centered Watchlist toolbar, Filters control, first poster slot and bottom navigation. A fresh local EN capture of `/en/users/7748?view=collection&collection=watchlist` at CSS393×1060 has `scrollWidth=393`; Back and Filters are44×44 at x16/y50 and x333/y50, the centered title is at y68, and the first poster is x16/y123/79×116. The screenshot shows the keyboard focus outline on the poster link. This matches the existing UK geometry and closes the EN phone shell/first-slot row. The live API has one film with no poster URL, while Figma shows a populated curated grid; keep that content variance documented. Filters and error/retry remain open. No action activated, source/API/data/Figma changes, build or automated tests.


### PublicProfile Films phone candidate identity check — 26.10.2026

Direct Figma navigation to `845:1679` selects a Frame with inspector dimensions393×1162, but the canvas still shows a different region and does not reveal the frame's name or contents. Find for `Films (svergunova phone)` returns two distinct results: Films discovery `1480:7843` (393×1235) and All Films `1480:9187` (393×1215). The first is a populated Films discovery screen with Popular Films, Just Reviewed, reviews and Crew Picks; it is already mapped separately to `/films/discover`. Neither result is `845:1679`, and matching phone width alone does not establish a PublicProfile collection mapping. Keep `845:1679` unclassified/open pending an exact layer identity and a centered canvas view. No Figma edits, source/API/data changes, build or tests.

Follow-up Find for `Profile Page` returned61 matches. Selecting the result named `Profile Page "Films" - Simchuk` navigated to `363:289`, a1440×2859 desktop frame whose visible content has Profile selected and review cards. This confirms that duplicated/stale layer labels also cannot identify the phone candidate by name alone. `845:1679` remains open; no new route mapping or parity claim.


### Frame 845:1679 partial-content and archive-label recheck — 26.10.2026

Selected current-Copy Figma node `845:1679` via its exact node URL; the inspector confirms393×1162. After canvas navigation settled, the screenshot showed part of a profile-like phone screen with account summary content and cards/footer, but its top/title/selected substate are outside the visible canvas crop. The local saved `.fig` provenance confirms that archive belongs to file key `orb73jiLJnIsZNCRtJsWgS`, not the current Copy `BDO9GO1oscOeUTcu4VXVKA`; its `page-frame-inventory.json` names node `845:1679` “Profile Page \"Profile\" phone - Simchuk” at393×1162. The old-file label plus current partial screenshot supports a profile-page candidate only. Do not assign a current-copy route, infer a watched/Films state, or claim parity. No matching focused raw subtree/export exists for this node in the archive. No Figma edit, source/API/data changes, build or tests.


### PublicProfile Lists EN phone geometry and keyboard traversal — 26.10.2026

Captured `/en/users/439?view=lists` in a temporary Playwright Chromium context at CSS393×1546, matching Figma `1480:9718`. `scrollWidth=393` and document height is1919. The toolbar H1 “Lists” is x70/y62.9/253×18.2; the live list card begins x16/y123 and measures361×213.9; List tags begins x16/y372.7; the two live tag links are x16 and139/y410.9, each115×32. The account has one public list and two tags; Figma's three list examples and expanded tags are sample content, so this is a documented data/state difference. Keyboard Tab traversed Home, Search, Add, Journal, Profile, Back, the list title and card links, both tag links, then footer links; each focused item had a visible outline. No control was activated. This closes EN phone keyboard traversal for the existing matched frame row; UK, error/retry and populated-content parity remain open. No user auth/session was copied, no source/API/data changes, build or tests.

UK follow-up on the same route and viewport (`/uk/users/439?view=lists`, CSS393×1546) returns `scrollWidth=393`; H1 «Списки» remains x70/y62.9/253×18.2, the list card is x16/y123/361×213.9, tag heading y372.7, and tag links remain x16/139/y410.9 at115×32. The localized movie count reads «1 фільм». Keyboard traversal again reaches all five bottom-nav links, Back, both list/card links, both tag links and footer links with visible outlines; no link was activated. This closes the UK geometry/focus portion of `1480:9718`; error/retry and the Figma-sample/live-data difference remain open. No source/API/data changes, build or tests.


### PublicProfile Lists error/retry focus recovery — 26.10.2026

Confirmed a keyboard-focus defect on `/uk/users/439?view=lists`: after the Retry button triggered a successful reload, focus fell to `body`. Added a one-shot focus return consistent with the existing collection/followers retry flows. Manual visual inspection used a temporary browser interception to return HTTP500 for the first Lists request, then passed the retry through to the real API without changing data. At CSS393×1546, Enter on «Спробувати ще» returns focus to H1 «Списки» with a visible2px cyan outline; at CSS1440×900 it returns focus to `#public-profile-lists-title` «Публічні списки» with the same visible outline. Both retries recovered to the real list content.
npm run verify:build` passes TypeScript and Vite (231 modules). No automated test suite, API/data/Figma changes, or persistent route overrides.

### PublicProfile Watchlist phone retry focus — 26.10.2026

Manual browser review at CSS393×1060 for `/uk/users/7748?view=collection&collection=watchlist` and `/en/users/7748?view=collection&collection=watchlist`: the collection request was made to fail with HTTP500, then Retry was activated with Enter. In both locales the actual API item returns, focus lands on `#public-profile-view-title` (“До перегляду” / “Watchlist”), the H1 shows a solid 2px cyan focus outline, and document `scrollWidth` remains393. Screenshots were saved outside the repository under the system temp directory. This closes the error/retry focus check for PublicProfile Watchlist phone UK/EN only. No source/API/account changes, build or automated tests.

### PublicProfile Watchlist filter disclosure — 26.10.2026

Manual browser inspection at CSS393 for UK and EN `/users/7748?view=collection&collection=watchlist`: opening Filters exposes the three existing collection tabs. EN tablist is361×44; UK wraps to361×96. Every tab is44px high and `documentElement.scrollWidth` equals393. Tab from the Filters trigger reaches the selected Watchlist tab; Escape closes the tablist and returns keyboard focus to the Filters trigger with a visible2px outline. No route, API or account mutation. The reference frame `861:1474` shows the collapsed toolbar; no distinct expanded-state frame was identified, so no visual parity claim is made for the expanded disclosure. No source changes, build or automated tests.

### PublicProfile Likes phone current-Copy review — 26.10.2026

Selected current-Copy Figma node `863:2474` in the live canvas; inspector confirms393×1162 and screenshot shows a four-column poster grid with rating stars under items. UK and EN `/users/7748?view=collection&collection=favorites` were reviewed at CSS393×1162. In both locales, title is x70/y62.9/253×18.2, Filters is x333/y50/44×44, content begins x16/y123/w361, and `scrollWidth=393`. The live API returns zero favorites and the localized empty state, so this supports the shared toolbar/content-start comparison only; poster/rating parity is a documented data gap. Earlier keyboard traversal checks for UK/EN remain the evidence for visible focus to Back, Filters, bottom navigation and the empty-state message. No code/API/account changes, build or automated tests.

### Frontend build after PublicProfile Likes phone review — 26.10.2026

Ran
npm run verify:build` from `frontend/` after the current visual review. TypeScript passed; Vite built successfully with231 modules. No automated tests were run because the visual inventory is still open. No source changes were made in this UI-review block.


### PublicProfile overview phone — unauthenticated baseline anchor — 26.10.2026

On the local Vite preview, opened live `/en/users/7748` in a fresh unauthenticated browser context at CSS393×852. The API-backed route renders without an authenticated viewer: hero x0/y0/393×547, H1 x60.95/y317/271.08×28, Favorites heading y591, document `scrollWidth=393`; its section sequence follows at y698.19 (Recent activity), y1000.55 (Recent reviews), y1305.55 (Following), y1433.55 (Lists). Current-Copy `825:1378` is393×2355 and the previously recorded Favorites anchor is y590. This confirms the base phone hero/heading anchor within1px; it does not match the authenticated state, where existing Follow/Block/Message actions make the hero taller and Favorites starts at y644.58 or y653.6 in separately recorded route variants. Keep those controls. No source/API/data changes, build or tests.



### PublicProfile overview phone — UK/EN exact viewport and keyboard refresh — 26.10.2026

After reboot, Figma `whoami` and `create_session` succeeded; `get_design_context` for `825:1378` again returned the Starter tool-call limit. The live Chrome canvas still selects the current-Copy frame and confirms393×2355. Manual unauthenticated Chromium previews at CSS393×2355 produced UK/EN document `scrollWidth=393`. Both H1 boxes measured x61/y317/271.1×28; Favorites began at y591 (the established Figma anchor is y590). Activity began at y698.2; Reviews at y1014.5 in UK and y1000.5 in EN; Following at y1319.5 UK and y1305.5 EN; Lists at y1447.5 UK and y1433.5 EN. The API currently returns empty Favorites and public Lists plus one real review and one following member; Figma shows different identity/avatar/posters and populated samples. In a 16-step Tab traversal for each locale, focus was visible on the fixed bottom navigation (3px cyan), toolbar actions (2px gold), collection counters, activity/review links and Following row. The frame remains open for authenticated Block/Message placement, avatar/sample parity and lower-section composition. No code/API/data changes, build, automated tests, Docker, Figma edits, commit or push. Temporary captures were stored under `%TEMP%` only.



### PublicProfile desktop overview — exact CSS viewport — 26.10.2026

Selected current-Copy Figma 238:596; the inspector reports1440×4459. At a fresh unauthenticated CSS1440×4459 Chromium viewport, both /uk/users/7748?view=overview and /en/users/7748?view=overview have scrollWidth=clientWidth=1440. Measured in each locale: H1 x416.8/y551/606.3×65; Favorites y1288; Recent Activity y1501.2; Recent Reviews y2175.7; Following y2680.7; Lists y2950.7; Statistics y3144.9; Social Links y3647.4; My Films y3895.5; Liked Reviews y4204.7; footer y4715.6; page height4981. Manual live-canvas view of 238:596 shows hero, overview rail, Favorites, Activity, Reviews, Following, Lists and then footer. Thus geometry/source widths are checked at frame width, while extra product sections shift the footer roughly522px beyond the Figma frame. The canvas also shows a member photo and Follow button; live API has no avatar image, and guest source shows no Follow control. API identity/counts/posters differ. Keep these exact content/action/composition items open; do not invent image or state data. Figma MCP get_design_context was Starter-limited. No code/API/data changes, builds, automated tests, Docker, Figma edits, commit or push.



### Global Search All phone — UK/EN exact-width live data review — 26.10.2026

Figma current-Copy Search All phone node 1480:8934 was selected in Chrome; inspector confirms393×2801. At CSS393, fresh unauthenticated previews for UK and EN both keep document width393. Shared anchors: phone header y0–187, search input x16/y120/361×32, category selector y222, results panel y267 and fixed bottom navigation y2716. For Journey, the live API returns5 Users and4 Lists; the Users group is x16/y267/361×356 (five52px rows at76px pitch) and Lists begins x16/y647, four361×189.3 cards. For film, the live API returns152 Films and101 Reviews; film group begins y267 and Reviews y408. Dune examples in Figma have different query/data and several populated categories, so missing categories in these live responses are data variation, not an absent endpoint. UK/EN keyboard traversal reaches Back, filter, query/search fields, All selector, focused result panel, user links and list links. Back/Search/nav controls show3px cyan outline, the input has its amber2px focus treatment and the result panel2px gold; no result link was activated. This extends the existing Search All geometry mapping at the exact frame width, but doesn't close other query/loading/error/no-match variants. Figma get_design_context remains Starter-limited. No source/API/data changes, build, automated tests, Docker, Figma edits, commit or push. Screenshots were saved to the Windows temporary directory.


### Lists Popular phone — exact frame-size review — 26.10.2026

After reboot, current-Copy Figma canvas `1480:7927` confirms the phone frame at393×1301. Local EN `/en/lists/discover?feed=popular` at CSS393×1301 has `scrollWidth=393`; title x16/y96, feed title x16/y265, static sort x279/y271/98×12, first live card x17/y320.3/359×31.9, pagination y983 and fixed bottom nav y1209. UK also has no horizontal overflow; translation moves feed title/sort down4.7px and the first card to y325. The existing live API returns one preview film per list while Figma shows multi-poster sample collections; period sorting is unsupported by the API. This adds exact-height viewport evidence, without claiming sample-data parity or closing the sorting gap. Figma `whoami` works, while `get_design_context` remains blocked by the Starter call limit. No code/API/data changes, build or tests.


### Films Discovery phone — exact-width review with composition gap — 26.10.2026

Opened current-Copy Figma frame `1480:7843`; inspector confirms393×1235. Compared with local `/uk/films/discover` and `/en/films/discover` at CSS393×1235: both keep `scrollWidth=393`, render four popular-film slots, two live review cards and a fixed bottom navigation. Source anchors are Popular films y137.2, slots y182–298, Just reviewed y343.2, review cards y608/770, Crew picks y971, bottom nav y1143. The Figma canvas shows a taller gradient hero and later upper sections; Crew picks and navigation appear near their source anchors. Record the upper composition as open until structured layer context becomes available; do not infer a specific CSS correction from a scaled canvas alone. Keyboard traversal in UK/EN reaches bottom nav, Back, View all and film links with visible3px cyan focus. Live API records currently use letter fallback art when image URLs are absent, and Crew Picks has no matching API contract. Structured Figma context remains blocked by Starter quota. No code/API/data changes, build or tests.


### All Films phone — exact-width source recheck — 26.10.2026

Selected current-Copy Figma `1480:9187`; inspector confirms393×1215. At100% zoom, selected child `Frame 421` gives the poster-group box x16/y228.25/361×791; its structure is four columns, six rows,79×116 posters and19px vertical gaps. Updated mobile `/films` layout to match these exact dimensions: UK/EN local previews at CSS393×1215 measure grid x16/y228.25/361×791 and row pitch135px; `scrollWidth=393`. The real total count remains in an accessible clipped `role=status`; the duplicate visible count is removed on phone, and pagination remains visible at y1053.25 above fixed nav y1123. API returns24 records per page,203 total and9 pages. No usable poster URLs are present in current API records, so live cards show text fallbacks instead of Figma sample art; preserve the API data. Filter/Escape in UK/EN returns focus to its trigger with visible3px cyan ring.
npm run verify:build` passed TypeScript + Vite (231 modules). No automated tests or API/data changes. Captures are in `%TEMP%` (`rewind-all-films-{en,uk}-393x1215-final.png`). Structured Figma context remains Starter-rate-limited.

### Global Search Journal phone — exact-width live-data recheck — 26.10.2026

After reboot, Figma `whoami` and `create_session` succeeded; `get_design_context` for current Copy again returned the Starter call-limit error. The Chrome canvas visibly shows frame `1480:8889` at393×1150 with three Dune article cards and fixed phone navigation. A fresh headless Chromium capture of `/en/search?q=Dune&tab=journal` used the same CSS viewport; the API returned `Journal (0)` and the actual no-results state, so populated-content parity cannot be checked without inventing records. UK/EN at CSS320 and393 all report `scrollWidth=393` or320, respectively; the mobile search field is intentionally hidden for the empty state, and the first Tab focuses Add with a visible3px cyan outline. Figma empty-state candidate `1480:8856` reports393×852, but its frame contents were blank in the canvas capture, so it remains visually unclassified. No source/API/data changes, build, automated tests, Figma edits, Docker actions, commit or push; temporary EN capture: `%TEMP%\rewind-search-journal-en-393x1150.png`.

### Popular Reviewers phone — mobile shell adjustment — 26.10.2026

Figma Current-Copy frame `1480:7698` is393×852. Its visible phone layout begins with Back/title/Search and list rows; it has no global Rewind logo/menu row. Before the change, local EN `/community/reviewers` rendered that row and placed its toolbar at y78, first list row at y156.5. The route now uses the existing mobile Community header treatment, and `PopularReviewers.module.css` top padding moved from64px to34px. After the change, at CSS393×852 UK/EN the header is1px high with brand/menu hidden, toolbar x16/y48/361×44, first API row x16/y128.5, fixed bottom navigation y760/393×92, and document width393. At320×852 UK/EN, document width remains320. Desktop CSS1440 retains the106px application header and no horizontal overflow; a desktop Figma frame was not compared here. The live list has ten `social_race_*` profiles with one review each; Figma shows named sample users, much larger counts, and photography, so this remains a sample-data/content gap. In both locales the first Tab has visible3px cyan focus; More opens a dialog with localized Follow/Block/member actions and initial focus on Done; Escape closes it and restores focus to More. No follow/block action was activated.
npm run verify:build` passed TypeScript and Vite (231 modules). No automated tests, API/data changes, Docker actions, Figma edits, commit or push. Manual captures: `%TEMP%\rewind-reviewers-{en,uk}-393x852-after.png` and `%TEMP%\rewind-reviewers-{en,uk}-320x852-after.png`.


### PublicProfile guest Follow CTA — build and route smoke — 26.10.2026

Current-Copy `238:596` (1440×4459) was reselected in the live Figma canvas; selected child `238:616` confirms the white Follow pill at265×59 with20×14px padding. The guest-only branch renders a localized Follow link to the existing Login route with these bounds, and makes no relationship mutation or contract change.
npm run verify:build` passed TypeScript and Vite (231 modules). Read-only Chrome smoke on `/en/users/7749` used the existing authenticated session at its natural CSS1920 width and confirmed the API-backed Follow/Block/Message controls remain available. A new tab on `127.0.0.1:5174` also rendered the authenticated controls, so it was not a guest context. Guest behavior and matched1440 geometry remain open. No automated tests, API/data changes, Docker actions, Figma edits, commit or push.


### PublicProfile authenticated actions keyboard focus — 26.10.2026

At natural CSS1920 on `/en/users/7749`, keyboard Tab reaches Follow, Block, and Message in sequence. Each control has a visible gold focus outline. No relationship action was activated, and the Message link was not opened. This verifies keyboard focus for the authenticated EN action row only; the guest Follow route, UK focus, and Figma-matched1440 geometry remain open. No code/API/data changes, build, automated tests, Docker actions, Figma edits, commit or push.

### Popular Reviewers desktop — exact-width structural audit — 26.10.2026

Figma current-Copy frame `1413:13364` is1440×2850. Local EN `/en/community/reviewers` was captured at CSS1440 with a1000px browser viewport: `scrollWidth=1440`, hero y0/h628, H1 x410/y280/620×65, section heading x120/y713/1200×45.9, table x120/y865.9/1200×1129, ten live API rows, and footer y2138.9. The frame's hero/table dimensions and centered1200px table structure are present. The Figma frame additionally shows page-number navigation and a Popular members avatar rail, both absent locally; the backend popular-reviewers contract returns only a list for a capped `size` (no page or total metadata), and no separate Popular members feed exists. Current local identities, review totals, and images differ from Figma samples. Desktop Tab traversal reaches the global header and first reviewer link with a visible3px/2px focus outline; no action was activated. Frame remains open for pagination/member-feed contract gaps and content parity. No source/API/data changes, build or tests in this checkpoint; no Docker/Figma edits/commit/push. Capture: `%TEMP%\rewind-reviewers-en-1440-natural.png`.


### Own Profile Films desktop — matched-width UK/EN composition and focus — 26.10.2026

Current-Copy Figma node `341:3348` is1440×3256. At CSS1440×900 with classic scrollbar (layout client width1425), UK and EN `/profile?view=collection&collection=watched` both hide the profile identity/actions/metrics while retaining the hero artwork and five-tab navigation, matching the Films frame composition. In both locales the rail is x120/y1105/1200×79, the collection heading is x120/y1269, and the first poster slot is x120/y1343.875/174.156×260.219. Keyboard traversal focuses the selected Films tab with a visible gold outline. The live API contains one film and fallback artwork; Figma shows a populated sample grid. No sample data was added. This supersedes the earlier suspected back/title/action composition mismatch and verifies these geometry/focus anchors only; loading/error/retry, other widths and full pixel parity remain open. No code/API/data changes, build or automated tests in this recheck.


### Own Profile Watchlist EN phone — matched-width shell, empty-state geometry and focus — 26.10.2026

Current-Copy Figma `1015:3356` is393×1564. Its selected canvas frame shows the owner hero, selected Watchlist rail, four-column “Wants to see” poster grid, and fixed five-item mobile navigation. Local authenticated EN `/en/profile?view=collection&collection=watchlist` was inspected at CSS393×900 with mobile device metrics (`innerWidth=clientWidth=scrollWidth=393`). The hero ends y496; profile rail x16/y531/361×44; selected Watchlist x107.5/y531/86.5×44; section x16/y598/361 wide; H2 x16/y607; empty panel x16/y647/361×23.2. Recorded Figma heading/content anchors are y606/y646, a1px vertical difference. Keyboard traversal reaches the selected Watchlist link and the empty `tabpanel`; each receives a visible2px amber focus outline. The live API is empty while Figma displays sample posters, explaining the poster and page-height difference; no fixture data was added. No error/retry state was forced. No source/API/data changes, build or automated tests.

### Own Profile Authentication summary phone — exact-width form comparison — 26.10.2026

Figma current-Copy `1043:2233` is393×852; current canvas and inspector confirm a Settings header with one read-only email row, and no Account password row is visible. The earlier “Account password” Find query returned no match on this page; no prototype destination is established. Local authenticated EN `/profile?settings=authentication` was checked at CSS393×852 with mobile metrics (`innerWidth=clientWidth=scrollWidth=393`). It renders the existing Change password form rather than the summary screen: heading at x34/y147, three 325×46 password inputs at x34 with y219.8,322.6,425.4, plus the existing Settings shell. Tab reaches Cancel, Save, current/new/confirm fields, then settings links; every checked control has a visible2px amber focus outline. Password fields were left empty and the form was not submitted. This is not a matched visual or confirmed prototype route; keep the frame `open`, preserve current password API and do not invent a summary-row transition. UK matched-width and real submit success/error states remain open. No source/API/account/Figma changes;
npm run verify:build` passed TypeScript and Vite (231 modules). No automated tests.

### Own Profile overview desktop keyboard recheck — 26.10.2026

Rechecked current-Copy Figma `238:865` (inspector1440×4459) and authenticated UK `/profile` at CSS1440×900. Source layout viewport is1440 with scrollbar client width1425; document remains4307px high and the recorded rail/section anchors are unchanged. Keyboard Tab reaches the profile actions button at x1380/y120/44×44 with a visible2px amber outline and3px offset; no action was activated. The selected Figma hero shows only background art, while this source route and sibling owner frames include identity/avatar/metrics. Keep this cross-variant question open; do not remove identity based on this single frame. The frame is not newly counted. No code/API/data/Figma edits, build or automated tests in this read-only check; full regression remains deferred until visual `open=0`.


### Own Profile phone overview canvas boundary recheck — 26.10.2026

Current-Copy Figma `896:1838` inspector confirms393×2319. At zoom-to-selection, the complete canvas frame visibly ends with Following, Likes, Lists, six quick links and fixed bottom navigation; required Statistics therefore remains outside this Figma frame. User directed continuing without a matched-width runtime review, so no runtime geometry or parity claim is added here. The row stays `open` due to data/sample and required-section placement differences. No code/API/data/Figma edits, build or automated tests in this read-only recheck.


### PublicProfile phone overview canvas recheck — 26.10.2026

Current-Copy Figma `825:1378` inspector confirms393×2355. The full selected canvas frame visibly includes the identity/Follow hero, Favorite Films, Recent Activity, Recent Reviews, Following, Lists and bottom navigation. Keep the existing `open` status: authenticated Block/Message controls change the runtime hero height and the required lower content extends beyond this overview frame. This canvas-only recheck adds no matched-width runtime or pixel-parity claim. No code/API/data/Figma edits, build or automated tests.


### Own Profile Connections UK field-focus recheck — 26.10.2026

On the local preview at its natural CSS1920 width, `/uk/profile?settings=connections` renders the Connections heading, four existing URL fields (Website, Instagram, TikTok, Letterboxd), Save and the profile actions links. The Website input receives a visible gold focus ring when focused; no field value was entered and Save was not activated. This does not verify Figma-matched geometry or mobile behavior. The OAuth/connect/import actions in Figma still have no matching API contract, so preserve the documented gap. No source/API/account/Figma change, build or automated tests.


### Own Profile Authentication UK form-focus review — 26.10.2026

At the local preview's natural CSS1920 width, `/uk/profile?settings=authentication` exposes the existing Current/New/Confirm password fields, Change button and UTF-8 password-limit note. Keyboard traversal from Current to New shows a visible gold focus ring on New. No password was entered; the form was not submitted. Figma `251:549` geometry at1440 and submit success/error states remain open. No source/API/account/Figma change, build or automated tests.


### Own Profile Avatar Settings UK field-focus review — 26.10.2026

At natural CSS1920, `/uk/profile?settings=avatar` shows the avatar preview, supported avatar URL input, and Save; the input has a visible gold focus ring. No value was entered or saved. The Figma Banner selection/upload action remains unsupported by the current profile API and is a documented gap. Matched1440/phone geometry and submit outcome remain open. No source/API/account/Figma change, build or automated tests.


### Current-Copy frame 845:1679 and local preview availability — 26.10.2026

The Figma inspector confirms node `845:1679` is 393×1162. The visible canvas region shows a partial row of editorial/review-style cards and a footer, but not enough context to assign the frame to a route; its handoff status remains `open`. A local `/uk/home` browser tab displayed an unrelated offline page, and a direct request to `http://localhost:3000/uk/home` was refused. `docker compose ps` showed API, DB, Mailpit and Redis, with no web container. No viewport was simulated, no containers or code were changed, and no build or tests were run.

The documented Vite dev preview was then started at `http://127.0.0.1:5173/uk/home`; Compose API, DB, Mailpit and Redis were left running. At the natural browser viewport the live Home News section is empty, while Popular Reviews renders vertical review rows. This differs from the three horizontal cards in the partial Figma crop, but the crop's route identity remains unresolved, so no mismatch is assigned to Home and `845:1679` remains open. No source/API/data/Figma changes, build or tests.


### Journal UK/EN live empty-state and keyboard review — 26.10.2026

The same local Vite preview loaded `/uk/journal` and `/en/journal` at the browser's natural viewport. Both locales expose the section selector and archive, and the live API has zero published articles with an empty archive. In EN, the first Tab focuses the REWIND link with a visible cyan outline. The page was not compared at a Figma-matched width, and this does not close the seven desktop feed variants, article screen, mobile states or newsletter. No Figma sample content was inserted; no source/API/data changes, build or tests.


### Journal newsletter route clarification — 26.10.2026

Current-Copy canvas node `604:967` remains confirmed as1440×3561; its full-frame view shows editorial rows and the shared footer, with no standalone signup form in that feed variant. Source/API review confirms `GET/PUT /api/newsletter/subscription` already exists and is managed in Profile settings; the Journal `Newsletter` option is a feed category. This is not a matched-width review and does not close other Journal variants. No Figma/source/API/data changes, build or tests.


### Journal Article frame 844:1547 canvas recheck — 26.10.2026

Selected current-Copy node `844:1547`; the inspector confirms1440×3120. The full frame shows a hero collage, article-body sections with related images, and the shared footer. No public newsletter signup is visible in this Article variant. Local API content has no corresponding sample story, so the missing-slug error state is the only runtime Article content state reviewed; populated-content parity remains open. No Figma/source/API/data changes, build or tests.


### Auth entry frame `605:2173` route mapping — 26.10.2026

The selected Current-Copy desktop frame is1440×1614 and shows a welcome message, film image, Create Account and Log In actions, plus the shared footer. The Prototype panel has no configured flow start or interaction on the frame. Current-Copy review evidence maps `605:2175` to Login and `605:2176` to Register; this distinct `605:2173` welcome frame has no known app route, and `App.tsx` exposes no separate auth-entry route. Keep its route mapping open; do not infer a destination or add a route. No viewport simulation or source/API/data/Figma changes; no build or tests.


### Help frame `1062:1993` natural-width keyboard review — 26.10.2026

Figma canvas inspector confirms1440×4025. Local EN `/help` renders at the natural browser viewport with the shared shell, Help hero, nine guide sections and their navigation links. Manual keyboard traversal reached logo, primary navigation, global search and the Help sidebar, with visible cyan focus on the logo and sidebar link. No matched-width claim: page geometry and remaining Help variants stay open. No source/API/data/Figma changes, build or tests.


### FAQ frame `1162:2193` route cross-check — 26.10.2026

Current-Copy canvas identifies the selected frame as Frequent Questions, 1440×2051, with six Q&A entries and the shared footer. Local `/en/faq` resolves to Not Found; the `App.tsx` route table contains no FAQ path. This confirms a Figma-only service route gap, distinct from the existing Help route and outside the current named route set. No new route/content was added. No code/API/data/Figma changes, build or tests.


### HQ Accounts and Important Data route cross-check — 26.10.2026

Current-Copy `1162:2105` HQ Accounts is1440×1610 and describes HQ-tier capabilities; `1164:2398` Important Data is1440×1574 and describes metadata sources/updates and duplicate entries. Local `/en/hq-accounts` and `/en/important-data` both resolve to Not Found, and `App.tsx` defines neither route. Together with FAQ `1162:2193`, these are three confirmed Figma-only service route gaps, distinct from current Help/Film Data. No routes or content were added; no code/API/data/Figma changes, build or tests.

### FAQ route and build checkpoint — 26.10.2026

Implemented localized `/faq` for current-Copy frame `1162:2193`, added six Q&A entries and service navigation, and updated the Contact FAQ link. Manual EN/UK Chrome review at natural viewport confirmed all six entries and the page content; UK keyboard Tab visibly focuses the Rewind home link, and Contact links to `/en/faq`.
npm run verify:build` passed TypeScript and Vite (231 modules). This does not close Figma geometry: the browser was not at the frame’s 1440px width, and phone variants remain unchecked. No automated tests were run; the agreed visual inventory remains open. No API or Docker changes.


### Films Discovery desktop frame recheck — 26.10.2026

**Films Discovery frame recheck — 26.10.2026:** Reopened Current-Copy 1480:6235; inspector confirms1440×2722. The canvas shows six ranked Popular films, eight Just reviewed posters, four Popular reviews in a 2×2 grid, eight Crew Picks posters, and the footer. Local UK /films/discover at natural CSS1920 shows a large discovery hero, six API-backed Popular films, the recent rail and four review cards; live poster URLs are absent so cards use letter fallbacks, and Crew Picks remains unavailable. This confirms route/state ordering and current data only; first Tab gives REWIND a visible cyan focus outline. Frame geometry and the visible hero/layout difference remain open because the natural viewport is wider than the frame. Structured get_design_context remains Starter-quota limited. No code/API/data/build/test changes.


### UK Login desktop frame and focus recheck — 26.10.2026

**UK Login recheck — 26.10.2026:** Current-Copy Figma `605:2175` inspector confirms1440×1614. Local UK `/login` at natural CSS1920 exposes email/password, visibility toggle, Forgot Password, submit and Register link. Tab traversal reaches email with a visible cyan focus ring. No credentials were entered or submitted. Figma also shows Remember me and Google sign-in; current UI/auth API has neither persistence selection nor OAuth provider, matching the already documented contract/provider gap. No matched geometry, source/API/data change, build or tests.


### Contact frame and UK content recheck — 26.10.2026

**Contact frame recheck — 26.10.2026:** Current-Copy Figma `1122:2497` inspector confirms1440×1920; its visible canvas has the service sidebar, Contact hero, Account Support + Film Data, Editorial + Partnerships, Press + Advertising, and the footer. Local UK `/contact` at natural CSS1920 exposes the translated sidebar and corresponding support, editorial and press sections, plus the FAQ link and the user-confirmed `anonimua910@gmail.com`. Figma sample addresses are not copied. First Tab gives REWIND a visible cyan focus outline. This confirms route/content structure only; matched-width geometry remains open. No source/API/data/build/test changes.


### Help frame and UK content recheck — 26.10.2026

**Help frame recheck — 26.10.2026:** Current-Copy Figma `1062:1993` inspector confirms1440×4025; the visible frame shows the service sidebar, Help hero, alternating instructional copy/illustrations and the route footer. Local UK and EN `/help` at natural CSS1920 expose the same nine localized instructional sections and real route links; the visible first and middle sections follow the same copy/illustration composition. The decorative profile/movie screenshots retain their embedded English sample UI while surrounding headings, instructions and links are Ukrainian, consistent with preserving the original Figma artwork. In UK and EN, first Tab gives REWIND a visible cyan focus outline. Existing release evidence records an earlier1440px UK/EN comparison with an approximately8px page-height difference and320/393px overflow checks. This recheck adds composition/content/focus evidence at natural width; exact article-copy and per-image placement remain open. No source/API/data/build/test changes.


### Movie Details desktop live-data recheck — 26.10.2026

**Movie Details desktop live-data recheck — 26.10.2026:** Current-Copy Figma `39:2` inspector confirms1440×3579; its canvas shows the dark full-bleed film hero, poster/actions, rating and reviews, cast, recent reviews, similar films, storyline and footer. Local UK `/films/5` at natural CSS1920 renders the API-backed The Wrecking Crew with its own hero/poster art and the same major section order, including cast links, paged reviews and similar-film links. The design sample is Oppenheimer, so title, artwork, cast and review content differ; live cast portraits are initials and the trailer has its localized empty state. This is a current-data composition check only; it does not replace prior1440 geometry evidence or add a new parity claim. No source/API/data changes, build or tests.

### Figma frame `845:1679` profile candidate — canvas recheck — 26.10.2026

Opened the exact Current-Copy node in a separate Figma tab; the inspector confirms393×1162. The visible canvas region shows profile identity/statistics (“zoe fujii”, 5,323 films, 2,545 reviews), a “More” link, three horizontal editorial cards and the shared footer. This is evidence for a profile-page candidate, but the complete identity header and active profile state were not visible together, so the exact PublicProfile/own-Profile route mapping remains unresolved. The local `.fig` inventory labels node `845:1679` “Profile Page \"Profile\" phone - Simchuk”, but archive provenance names a different file key from Current-Copy; that old label is not treated as proof. No browser viewport was changed, and no route mismatch or pixel-parity claim is assigned. No source/API/data/Figma changes, build or automated tests.

### Member Home duplicate-composition recheck — 26.10.2026

Live Chrome canvas/inspector review confirms `473:492` and `1413:6263` are both1440×5020. Their visible member Home compositions match: hero, movie rails, Latest News, Popular Reviews, Popular Lists, Recent News, and footer occur in the same order. The earlier raw-node comparison still reports a different text sequence, so this establishes composition-level duplication but not identical layer/copy content; retain that copy question as open and do not add a unique route/state count. The local preview remains authenticated, so this does not verify guest rendering or matched-width parity. Figma structured context remains Starter-quota limited. No code/API/data changes, build or tests.


### Home prototype frame candidate — 26.10.2026

Live canvas selection confirms `1112:2560` is1440×4934 and explicitly titled “main page прототип”. Its guest Home layout contains gray placeholder cards/rails across the same major section order. The current `Home.tsx` displays textual loading statuses while API sections load, so this is a possible loading-state design difference; the frame's prototype status means acceptance relevance is unconfirmed. Sibling `1112:2068` is separately titled “list прототип”, measures1440×2033 and shows list-detail copy with placeholder poster rows; this supports treating these as a prototype/loading family. Keep Home open while comparing the remaining copies; do not count it as a confirmed distinct route/state or change loading UI from one candidate alone. No code/API/data changes, build or tests.


### Legacy Figma prototype family visual comparison — 26.10.2026

Live canvas/inspector comparison confirms `1112:2132` (Review prototype,1440×1905) and current `1480:6826` (Review Details,1440×1905) share the Dune hero/details, liked-members strip and footer composition. The prototype uses a gray poster and gray liker circles and omits the current frame's hero/poster/portrait art. `1112:2204` is explicitly “Film Page prototype”,1440×3506, with movie details, rating, cast, reviews, similar films and storyline; its art slots are placeholders. `1112:2400` (“Profile Page Profile prototype”) and `238:865` are both1440×4459 and share profile header/tabs plus Favorites, Activity, Reviews, Following and Lists; sample identity/data and media differ, with placeholders in the prototype. Together with the previous Home/list review, these are verified prototype relationships but not exact duplicate frames or accepted production loading states. They do not add route/state rows; target relevance remains open. No source/API/data changes, build or tests.


### Figma access after workstation restart — 26.10.2026

Figma authentication and the Chrome canvas are available after restart, but a new `get_design_context` request for Current-Copy `845:1679` again returns the Starter-plan MCP call-limit message. The canvas inspector still confirms the selected frame is393×1162; its current canvas view only exposes profile statistics, a “More” link, three editorial cards and footer, so the exact route/state remains unresolved. User asked to continue without matched-width review for PublicList/Ranked List; those states remain open under that exception. No browser viewport was changed and no source/API/data/Figma changes, build or automated tests were made.

**Post-restart MCP entitlement recheck — 26.10.2026:** Started a Figma session for Current-Copy and retried `get_design_context` on `845:1679`; the MCP rejected the request with the Starter call-limit message. `whoami` confirms the connected account has a Full seat on the `starter` tier. Chrome canvas access still works and the inspector confirms393×1162, but the visible crop does not establish the frame's route. Keep it open; retain the user's exception for matched-width PublicList/Ranked List review. No Figma design or source edits, browser viewport changes, build or tests.


### Member Home API data recheck at natural browser width — 26.10.2026

Local `/uk/home` at the existing, unmodified browser viewport finishes auth hydration into the member variant. Its live API renders movie, review and public-list entries, while Journal returns no articles and Home displays the localized empty state “Новин журналу поки немає.” The open Figma canvas shows three Recent News sample cards; this is the already known data/content difference, not evidence of a layout defect. No matched-width comparison, source/API/data changes, build or tests.


### Current frontend source build — 26.10.2026


npm run verify:build` completed successfully from `frontend/`: `tsc --noEmit` passed and Vite 7.3.7 built the current working tree, transforming231 modules. This is build/type evidence only; automated frontend/backend tests and the remaining release gates have not been run.


### Admin Lists current-canvas frame and API contract — 26.10.2026

Selected Current-Copy frame `1344:5249`; Figma inspector confirms1440×3238. The canvas shows the Admin Lists workspace with a “View Reported Lists” control and list cards carrying Year, Likes and “Edit List” actions. Current `AdminLists.tsx` provides paginated collection loading, visibility toggle and custom-list deletion only. `AdminListController` exposes `GET /api/admin/lists`, `PUT /{id}/visibility` and `DELETE /{id}`; `AdminListResponse` has `createdAt` (so a year can be derived) but no likes/report fields, and no list detail/edit endpoint exists. Reported-list review, engagement metadata and editing are confirmed capability gaps. No ADMIN session was available for rendered-runtime geometry, so that remains open. No source/API/data changes, matched-width browser review, build or tests.

Figma Find on the same Current-Copy page resolves the adjacent frames: `1389:3464` “Reported List - Sulyma Bohdan” (1440×2921) and `1390:3326` “Edit Reported List - Sulyma Bohdan” (1440×2815). The first frame shows three reported-list cards with report reasons/counts, year/likes and pagination. The edit frame shows list status, report reason, complaint count per review, list text, films, history, Delete List, Block and Mark Complaint Resolved. Backend `AdminModerationQueueRepository` and `AdminModerationQueueItem` cover only reviews/comments; list endpoints have no report reason/count/status/history or block/resolve operations. Deletion exists for custom lists, but editing, report review/metadata, list blocking and complaint resolution are missing capabilities. These exact current-file frames therefore replace the unclassified-candidate note. No authenticated runtime comparison; no matched-width preview, source/API/data changes, build or tests.


### Admin Lists `View Reported Lists` prototype link — 26.10.2026

Selected the CTA text node `1344:5372` on Current-Copy frame `1344:5249` and opened its Prototype sidebar. The Interactions section is empty and offers “Add action”; no destination to Reported List `1389:3464` is configured on this selected node. This does not establish whether a parent layer or another prototype is linked, so route mapping remains open. No Figma edits, source/API/data changes, browser viewport changes, build or tests.


### Auth desktop canvas/runtime recheck — 26.10.2026

Current-Copy Login `605:2175` is1440×1614; Register `605:2176` is1440×1752. Their live canvas forms show email/password and username/email/password respectively; both include Google sign-in/up, and Login includes Remember me. Local EN `/login` and `/register` at the existing natural browser width expose the matching main forms, password visibility, account links and UTF-8 password guidance. OAuth and Remember me remain unsupported by the current auth contract, so they are documented gaps. This is structure/content evidence, not matched-width geometry; no form was submitted. A fresh
npm run verify:build` passed TypeScript and Vite with231 modules. `get_design_context` and direct `get_screenshot` calls for valid Current-Copy nodes both returned the Starter-plan tool-call limit; canvas review remained available. No code/API/data or Figma edits, and no tests.


### PublicProfile phone identity — live source/API check — 26.10.2026

At the existing natural browser width, `/en/users/7748?view=overview` renders the API-backed profile and its initial avatar fallback. Read-only `GET /api/users/7748/profile` returns `avatarUrl:null`; the frontend correctly passes the nullable value to `ResilientImage` and uses the username initial when there is no image. `PublicProfile.module.css` constrains the mobile identity copy to361px and enables wrapping for the H1, but long-name behavior was not remeasured at a phone viewport in this pass. The live canvas then loaded Current-Copy `825:1378`; inspector confirms393×2355 and the frame shows a sample portrait with the short name “Jeremy B.” This does not confirm long-name behavior or runtime geometry. No source/API/data changes, build or tests in this profile check.


### Rules of Use content recheck — 26.10.2026

The live canvas selection `1164:2790` confirms the1440×2469 Rules frame. The current local UK route at its natural browser width presents the same nine section headings in order, the four-item ordered prohibited-conduct list, service navigation and footer. Existing release evidence already contains matched anchor, UK/EN responsive-width and keyboard-focus checks; this pass adds no geometry or pixel-parity claim. No code/API/data changes and no tests.


### Films Discovery phone backdrop — 26.10.2026

Current-Copy `1480:7843` inspector confirms393×1235; the selected phone frame visibly uses a dark cyan/amber gradient behind its upper controls and poster rail. Figma's35×35 filter control has no configured Prototype interaction. Added a356px phone-only backdrop using the existing local hero image; its height is approximate, read from the selected canvas frame at62% zoom. Desktop `/uk/films/discover` remains rendered at the natural browser width.
npm run verify:build` passed (TypeScript and Vite,231 modules). The post-change phone capture was not performed, so this is an implementation checkpoint, not a fixed/matched status. Existing API poster fallbacks and unavailable Crew Picks remain data/contract differences. No tests, API/data changes or Figma edits.


### Films Discovery phone measured composition — 26.10.2026

Current-Copy frame `1480:7843` is393×1235. Direct selected-layer measurements: popular carousel x16/y168,424×149,gap8; “Just reviewed” heading x16/y388,361×24 and poster rail x16/y436,361×116,gap15; Popular Reviews heading x16/y587,361×27; cards x16/y635 and x16/y784,361×125; Crew Picks heading x16/y944,361×24. The locally captured pre-change 393px screen used a fixed four-column first row, and populated review cards exceeded the Figma card height. Source CSS now uses a horizontal100px poster rail (424px for four cards), fixed anchor spacing, and125px-minimum review cards; an existing “View all” link is reused in the top visual control with the same destination because Figma has no configured prototype action. TypeScript and Vite build pass, and the natural-width desktop route still renders its original desktop hero/content. The post-change 393px screenshot and phone keyboard/focus path remain unverified; do not mark this route fixed/matched yet. No automated tests, API/data changes or Figma edits.


### Films Discovery preview after reboot — 26.10.2026

Chrome’s authenticated Current-Copy canvas remains readable and confirms phone frame `1480:7843` at393×1235, but Figma MCP `get_design_context` is still Starter-rate-limited. Compose reports API, DB, Redis and Mailpit running while `web` is absent; `localhost:3000/uk/films/discover` showed an unrelated offline page. Started Vite on `127.0.0.1:5174` for a source-only manual preview. `/uk/films/discover` loaded live API records and desktop sections at the browser’s natural wide viewport; first Tab produced a visible cyan outline on REWIND. This is route/API/first-focus evidence only, not a matched comparison to the 393px frame or verification of the remaining keyboard path. No app source, API, data, Docker, database, `.env`, build, test, commit or push changes in this check.


### Journal API data recheck — 26.10.2026

Read-only GET requests to `/api/journal/articles` and `/api/journal/articles/archive` returned `totalElements=0`, `content.length=0`, and `archive.length=0` for both `language=uk` and `language=en`. Current-Copy Figma `604:967` remains a populated editorial feed sample at1440×3561; this is live-data/content variance, not evidence that static sample articles should be copied into production or that the API contract is missing. Prior manual route evidence confirms the localized feed/archive empty states; this API recheck adds no geometry or matched-width claim. No source/API/data/Docker changes, build or automated tests.

**Journal UK/EN browser recheck — 26.10.2026:** Local `/uk/journal` and `/en/journal` rendered localized empty feed and archive messages against the empty live API. In both locales, keyboard traversal reached the category select and its cyan focus outline was visible. The browser remained at its natural wide width (~1905 CSS px), versus the Figma `604:967` 1440px frame; this is route/state and focus evidence only, with no geometry/parity claim. No content or filters were submitted; no source/API/data, build or test changes.


### Forgot Password source/canvas recheck — 26.10.2026

Current-Copy desktop frame `605:2174` is1440×1614. Inspector selection `629:1132` measures the card background at x121/y316,1198×873; `AuthShared.module.css` defines the shared card width as1198px and min-height873px. Local `/en/forgot-password` at the browser's natural wide width renders the localized email-only instruction, email input, reset action and account link. It was not reviewed at CSS1440, so only frame-to-source component dimensions and route structure are confirmed, not full matched-width parity. The phone frame `944:1887`'s email-or-phone copy remains unsupported by the email-only backend request contract and is already tracked as a documented gap. No form was submitted, and no code/API/data changes, build or tests were made.


### Account Deletion payment-copy and runtime review — 26.10.2026

Current-Copy `1176:2515` is1440×1748. Local UK and EN `/delete-account` accessibility trees expose the same Purpose → four deletion effects → Security and Privacy → Policy Updates order. Figma's third effect states that subscriptions and paid services terminate; the app's localized copy states that follows and active sessions end. `ProfileController.deleteMe` delegates to `ProfileService.deleteMyAccount`, which verifies the current password, revokes all sessions and deletes the user; backend search finds newsletter subscription support but no paid billing service. The paid-services claim is therefore a product/API gap, not a reason to invent a billing flow or promise. The existing account-deletion form remains on Profile, and this service page remains informational. Route review was at the natural browser width, not a fresh matched-width measurement; no destructive action, source/API/data change, build or test.


### Important Data separate route and unsupported report behavior — 26.10.2026

The Current-Copy canvas shows `1162:2305` Film Data (1440×1533) and a separate adjacent `1164:2398` Important Data frame (1440×1574). The latter has its own introductory copy, Sources and Updates section, and Duplicates section; its text directs users to a Report flag near runtime or in a menu and promises duplicate-page merging with activity preserved. The app has `/film-data` but no `/important-data` route. Source/API inspection finds only watched, watchlist and favorite film flags; there is no film report action, report endpoint or duplicate-merge contract. The existing Film Data page remains the supported route and gives contact-based guidance for duplicate pages without promising an in-app report or automatic merge. No source/API/data changes, matched-width runtime review, build or tests.


### HQ Accounts route and capability gap — 26.10.2026

Current-Copy `1162:2105` is1440×1610. The visible page describes organization accounts with follower-feed stories/links, uploaded backdrops, linked personal accounts, a pinned list, highlighted reviews and impression analytics; it also says HQ accounts have no ads and their ratings do not affect weighted film averages. `/hq-accounts` is not registered, and source search finds no organization account models/endpoints or story/analytics contracts. This remains a Figma-only route/product capability gap. No source/API/data changes, matched-width runtime review, build or tests.


### Search Reviews desktop frame and live API state — 26.10.2026

Current-Copy `1480:7311` is1440×2176 and visually shows four sample Dune review cards. Selected group `1480:7333` reports x120/y377,1200×1374 with38px vertical spacing. Source CSS caps the centered shell at1200px and uses315px minimum-height desktop review cards with38px gaps; `4×315 + 3×38 = 1374px`, matching the selected group height. At `127.0.0.1:5173/en/search?q=film&tab=reviews`, the live API returned101 matching reviews and the accessible first page exposed six result cards. Current review titles, authors and dates differ from Figma; the first two current film poster URLs are absent and render the existing fallback. At the browser's natural wide viewport, keyboard Tab focuses REWIND with a visible cyan outline. This confirms source/frame aggregate sizing, not matched-width rendered geometry; the local viewport did not match1440px, so the desktop frame remains open. No source/API/data changes, build or tests.


### Search Reviews keyboard focus follow-up — 26.10.2026

A manual keyboard walkthrough exposed that the first focused review poster was hidden under the fixed header. The source now gives `.reviewPoster` a 120px block scroll margin. Chrome confirms the focused poster and cyan outline appear below the header.
npm run verify:build` passed (TypeScript + Vite 7.3.7, 231 modules). Automated suites remain deferred until the visual inventory is closed; Search Reviews matched-width geometry and remaining states are still open.


### Forgot Password focus-scroll verification — 26.10.2026

Manual EN `/forgot-password` Tab traversal showed the Reset password button's lower focus ring clipped by the viewport edge. Added a12px block scroll margin and verified in Chrome that the entire focused button and outline are visible. The form was not submitted. Email-only recovery matches the backend contract; the phone-recovery wording in frame `944:1887` remains a documented gap.
npm run verify:build` passed (TypeScript + Vite 7.3.7,231 modules). No automated suites run.


### Home member-frame session mismatch — 26.10.2026

Figma canvas inspector confirms `1413:6263` is a1440×5020 registered-user Home. The local `/uk/home` preview in the current browser context is unauthenticated and renders the guest variant, so the two states cannot be compared. The guest page exposes live API sections (six popular films, four reviews, three lists, empty Journal); first Tab focus on REWIND is visible at the natural ~1904px viewport. No login, source/API/data change, build or tests; Home member parity stays open.


### Community directory keyboard focus — 26.10.2026

On the live UK `/community` route at the browser's natural ~1904px width, keyboard traversal reached the Popular reviewers link, first member link and Follow control, then the directory search field. Chrome confirms a visible cyan outline on each focused target; the search input remains fully visible. The API currently returns an empty Featured/HQ section and populated Popular/Directory sections; no follow action was activated. This is keyboard/runtime evidence only, not a matched-width comparison to Community frame `605:1112`; the frame remains open. No source/API/data changes, build or tests.


### Films Discovery keyboard review at natural browser width — 26.10.2026


npm run verify:build` passes TypeScript and Vite (231 modules). On `/uk/films/discover` at Chrome's natural ~1904px width, the live API renders the popular films, recent films, popular reviews and Crew Picks unavailable state. Keyboard traversal from REWIND through the primary navigation reaches the first popular-film poster; Chrome shows a clear cyan focus outline around it. This is desktop keyboard evidence only: the viewport does not match the 393×1235 phone frame `1480:7843`, so mobile placement and focus behavior remain open. No source/API/data changes; no automated tests were run.


### Correction: Current-Copy node 845:1679 canvas crop — 26.10.2026

The inspector confirms `845:1679` is393×1162, but Figma's canvas remains panned to another area after direct selection. Clicking the visible editorial card selected `472:646` Group 81 inside the guest Home frame `1413:6471`. Therefore earlier profile/statistics, editorial-card and footer observations from that crop are not evidence about node `845:1679`; its layer identity, content and route remain unknown. Handoff and current progress have been corrected. No Figma or source edits; no API/data changes, build or tests.


### Browser and MCP recheck after restart — 26.10.2026

Figma session and `whoami` succeed, but `get_design_context(1480:7843)` is rejected by the Starter call limit. The local Films Discovery tab is still at the natural 1904×855 viewport; the requested live 393×1235 review has not occurred. Previous CSS-sized captures are retained as supporting evidence only and do not close that manual review gate. The first canvas observation was `845:1679` at393×1162 with an unrelated crop. A later direct link selected Film Data `1162:2305` at1440×1533 and revealed its complete hero, two editorial sections and footer; this does not establish local matched-width parity. No source/API/data changes, build or tests in this recheck.


### Films Discovery phone source-anchor and build recheck — 26.10.2026

Current
npm run verify:build` passes TypeScript and Vite (231 modules). At the 393px CSS breakpoint, the source sequence is popular carousel y168; Recent heading/rail y388/y436; Popular Reviews heading/cards y587/y635/y784; Crew Picks y944. These align with the previously measured Figma frame anchors for `1480:7843`. The local Chrome window is still 1904×855, so the post-change live matched-width screenshot and phone focus walkthrough remain outstanding; this evidence does not close the frame. No source/API/data changes or automated tests in this check.


### Current-Copy candidate `845:1679` isolation attempt — 26.10.2026

The inspector confirms `845:1679` is393×1162 at x−4892.76/y4538. Figma Find for the visible “Funny Papers” title selects distinct text node `472:655` at x540/y4397, and the visible editorial card is not evidence about `845:1679`; `Shift+2` did not recenter/isolate the candidate in this canvas view. The frame's title, route, and content remain unknown, so it stays unclassified with no row-count change. Figma structured context remains unavailable under the Starter call limit. No source/API/data changes, build, or automated tests in this investigation.


### All Films phone frame and live route recheck — 26.10.2026

Current-Copy `1480:9187` is visibly selected as the All Films phone frame; the inspector confirms393×1215. Its canvas shows a four-column poster grid, Year/Rating/Genre filters, pagination and fixed bottom navigation. Local `/uk/films` at natural1514px renders203 API-backed films, page1/6, localized filters and poster art; `GET /api/genres` returns17 genres. A keyboard check confirms the genre select is enabled: Space opens it, ArrowDown changes “Усі жанри” to “Бойовик”, and ArrowUp restores “Усі жанри” without applying the filter. Thus the earlier transient AX snapshot showing disabled options was not a defect. This is route/data/control evidence, not a matched-width runtime comparison. No source/API/data changes, build or tests.


### Films Discovery keyboard targets and rail outline — 26.10.2026

Source inspection found that the≤560px popular-film h3 elements were clipped to1×1px while their nested links remained focusable. The mobile rule now hides duplicate h3/year elements with display:none; poster links retain their accessible names and film destinations. The phone keyboard path is pending a real393px viewport, so this source fix does not close the phone frame.

At the natural1514px-wide Chrome viewport, keyboard focus on the first Just Reviewed poster showed its external cyan outline clipped by the scrolling rail. Changing only the rail-poster outline offset to−3px keeps the existing3px outline entirely inside the poster. The manual repeat showed all four edges; poster geometry and data did not change. npm run verify:build passed TypeScript and Vite7.3.7,231 modules. No automated tests, backend/API/account/data changes, Docker refresh, commit or push.

The canonical handoff table also consolidated duplicate Search Reviews phone1480:8631 and Public/Ranked List rows, and removed the superseded Popular Reviewers desktop1480:5486 row in favor of current-Copy1413:13364. Existing historical checks remain evidence with their original limits; no coverage count was increased. PLAN now begins with the newly approved execution order; older checkpoints are explicitly historical. PROGRESS is a concise current status.


### Disposable Admin runtime and PublicProfile guest Follow — 26.10.2026

Created one local disposable user through the existing CSRF/register flow, then promoted only that generated ID/email to ADMIN using the same SQL scope as verify-admin-browser.ps1. No automated suite was run. Logged into the fixture through the real Login UI and manually inspected UK Admin Dashboard, Reviews, Comments and Settings at the browser's natural1514px width.

Dashboard renders six real counters. Reviews and Comments show the existing createdAt as a localized full date under Year; the Reviews Hide button has a complete cyan keyboard outline. Settings renders default_locale, journal_enabled, maintenance_mode and site_name; keyboard focus on Save is visible. No review/comment visibility or settings value was changed. Matching1440px geometry, other views/states, UK/EN comparison and mutation outcomes remain open.

Logged out through the UI, deleted the fixture with an exact ID/email predicate, and verified COUNT(*)=0 for that same identity. No real-user role or data was edited. The generated temporary cleanup metadata was removed after successful deletion.

Then verified PublicProfile guest Follow in the logged-out session: on UK users/7748, keyboard Enter on Follow navigates to /uk/login; EN users/7748 exposes Follow: social_race_5a62c9ea with /en/login. This closes the earlier unexercised guest-branch behavior, not matched-width visual parity. No follow/block request was submitted.


### Person retry focus and state-heading visibility — 26.10.2026

Manually opened /uk/people/actor/2147483647: the real API returns the missing-person error. Keyboard Enter on Retry removed the focused button while loading and returned focus to body after the repeated error. Person now records explicit retries and focuses its heading after the request settles, with cancellation on route/type/locale changes. Both initial-state h1 and populated-state h1 use the same ref. Genre retry uses a separate pending flag and filmography h2 target; that error/recovery branch is implemented but not runtime fault-injected or claimed verified.

The initial/error layout also inherited the desktop hero padding80px despite a106px fixed header, hiding part of h1. A scoped statePage class now gives error/loading content140px top padding (mobile64px); the loaded hero layout is unaffected. UK and EN Chrome manual retries both land on person-title with a fully visible cyan outline below the header. The browser remained at its natural~1514px width, so phone/other widths and matched Figma geometry remain open. Navigating to the API-backed actor162 renders Jason Momoa, Films Starring, genre/sort controls and The Wrecking Crew.

During this check, HTTP requests confirmed the old Vite listener on5173 had stopped while Chrome retained the old document. Restarted the source dev server at127.0.0.1:5173 (exec session5916), then reloaded before the successful UK/EN repeats. npm run verify:build passed TypeScript and Vite7.3.7,231 modules after the final CSS change. No automated tests or backend/API/data changes. No Docker refresh, commit or push; full visual inventory stays open.


### Community shell anchor and source cross-check — 26.10.2026

Reconciled the saved raw-reference summary in `.codex-backups/profile-community-reference-review-20261020/reference-summary.json`, current `Community.module.css`, and the prior UK/EN runtime measurements in “Community empty-feed frame runtime measurement”. The phone frame `1517:4931` measures the hero background to y234, Featured heading y242, first avatar row y282, and Popular heading y499. Current CSS reconstructs these anchors: 234px hero, 8px first heading offset, 21px heading-to-row spacing, a 230px reserved first section plus 24px grid gap, then an 11px next-heading offset. Its 4-column row in a361px content rail with16px gaps yields78.25px cells, matching the reference's78/79px avatars. On desktop `605:1112`, the 501px hero plus80px section margin yields Featured y661; its435px reserve,41px bottom margin and44px grid gap yield Popular y1181. Prior runtime captures measured these section anchors in UK at393/1440, with empty HQ API data. This cross-check supports shell/empty-state rhythm only; populated-row height/content, directory downstream composition and sample poster/reviewer data remain open. No source/API/data changes, viewport simulation, build or tests.


### Admin Activity raw hierarchy classification — 26.10.2026

Read-only traversal of preserved archive file `orb73jiLJnIsZNCRtJsWgS` for visible top-level `orb73…/1390:4021` (“Activity - Sulyma Bohdan”,1440×3111) found an Activity heading, six average/user metric groups (lists, films watched, reviews, session time and watchlist activity), an “Activity List” containing Name/Email/Followers/Status and four sample users, “More Users”, plus separate Notifications and History groups. This is an Admin activity/dashboard candidate, not a chronological public profile feed and not the existing audit Logs `1404:3804`. The sibling archive candidate `orb73…/1393:3652` is the distinct “More Users Activity” screen. Current AdminDashboard has no Activity workspace; current APIs do not establish the sample metrics, table semantics or notification/history contract. Keep mapping as unresolved candidate `/admin?view=activity`; no route, endpoint or sample data was added. Raw evidence does not verify current-Copy identity, prototype destination or rendered parity. No source/API/data changes, build or tests.


### Legacy phone list-frame classification — 26.10.2026

Read-only raw hierarchy for archive frames `orb73…/1033:6171` and `orb73…/1034:6494` corrects the earlier “Profile list sheets” label. `1033:6171` is a complete393×852 list-detail screen: title “My Top”, description, Public and Ranked chips, tags, film rows and an “Edit entries…” action. `1034:6494` is a complete393×852 “Edit List” screen with editable list metadata and poster rows. Existing routes provide the likely crosswalks (`/lists/public/:id` and `/lists` → UserLists), but these are archive frames; no confirmed current-Copy identity or prototype transition is available. Ranked persistence remains absent from `MovieList`, so the Ranked label is still an API gap. Both frames are now listed as explicit open List candidates in the canonical table, and removed from the Profile-frame interpretation. No route/API/data changes, matched-width review, build or tests.


### Current Figma and local-browser access check — 26.10.2026

Retried the Figma file session for current-Copy `BDO9GO1oscOeUTcu4VXVKA`; the connector returned `UNAUTHORIZED` and explicitly requires reauthentication, so no design read was attempted. The native computer-use surface returned no apps or browsers (`User unavailable`). The separate browser connector could not open the source preview at `127.0.0.1:5173`; its `host.docker.internal` request reached Vite but was rejected by the normal dev server's allowed-host check. This establishes a current access limit, not a UI result. No viewport simulation, source, API, account, database, or Figma changes; no build or tests.

**Recheck after user reconnected Figma — 26.10.2026:** the Figma tools are listed in this runtime, but both `create_session(BDO9GO1oscOeUTcu4VXVKA)` and `whoami` fail with MCP `Unknown tool` for `figma.create_session` / `figma.whoami`. The computer-use bridge also reports `User unavailable`; the supported `@oai/sky` Computer Use initialization separately fails because its native pipe is unavailable. No app/window inventory, live canvas read or browser comparison was possible; this is connector/bridge availability, not a design result. Local archived references and source remain available. No source, API, account, database, or Figma changes; no build or tests.


### Community empty-state geometry reconciliation — 26.10.2026

A source audit resolved conflicting checkpoints. Current `Community.module.css` has `.grid > .card:first-child { min-height:435px; margin-bottom:41px }` on desktop and `min-height:230px; margin-bottom:0` through720px; grid gaps are44px desktop and24px phone. Combined with the recorded hero/grid anchors, this calculates Featured y661 → Popular y1181 desktop, and Featured top234/height230 → Popular section y488 → heading row y499 phone. The older runtime capture of a117px empty Featured section and Popular y822 predates this reserve rule; later evidence recorded the source rule but not a fresh runtime re-measure. Therefore no CSS change was warranted from the stale measurement. Post-rule runtime confirmation and populated-row composition remain open; no browser/viewport mutation, source/API/data change, build or tests were made.


### Current frontend build verification — 26.10.2026

Ran
npm run verify:build` from `frontend/` against the current worktree. TypeScript completed, then Vite7.3.7 transformed232 modules and built successfully in5.95s. `git diff --check` also exited0; Git emitted only its configured LF→CRLF working-copy warnings. This verifies compilation/build only: no Playwright/backend suites or manual browser/Figma parity were performed in this checkpoint. No source/API/data/Docker changes.


### Admin Movies populated read-only credits API check — 26.10.2026

Read-only GETs to the running local API `/api/movies/{id}/details` confirmed populated existing detail payloads for movie33 (Send Help: three genres, Sam Raimi, four inspected cast rows, TMDB7.2; `rating=4`), movie31 (The Avengers: three genres, Joss Whedon, cast, TMDB7.9; `rating=null`), and movie50 (Avatar: The Way of Water: three genres, James Cameron, cast, TMDB7.6). The current Admin editor maps genres/directors/actors from this endpoint into its read-only `movieCredits` panel; no new contract is needed for populated credits. The nullable `rating` field differs from `externalRatings` (including TMDB) and does not establish the Figma “Average User Rating” metric or review aggregates. This verifies data availability and source mapping only; authenticated Admin rendered placement, layout, empty values and keyboard/focus remain open. GET-only: no API/database/source changes or test/build.

### Figma reconnected; current node read is Starter-rate-limited — 26.10.2026

After the user's reconnect, `create_session` for Current-Copy `BDO9GO1oscOeUTcu4VXVKA` succeeded and `whoami` returned the authenticated Starter plan. A read attempt for current Admin Movies node `1260:3772` was rejected with “You've reached the Figma MCP tool call limit on the Starter plan.” This supersedes the later stale `Unknown tool` entry as the present connection status: authorization/session works; structured node reads are rate-limited. No node data or screenshot was received, so this is not new visual evidence and no parity status changes. No source/API/Figma data changes, build or tests.


### Admin Movies async action scope guard — 26.10.2026

Added a separate account/locale generation guard to delete, TMDB sync, and TMDB import/discovery flows. Responses started under a prior user/role/locale are now ignored for UI state, and action messages/busy flags are cleared when that scope changes. Requests retain the existing API calls and are not claimed canceled server-side.
npm run verify:build` passed: TypeScript plus Vite 7.3.7, 232 modules, 6.43s. No automated tests were run; manual browser action/error flows remain open. No backend/API contract changes.


### Figma canvas recovered; Admin runtime still unavailable — 27.10.2026

The connected Chrome Figma canvas loaded Current-Copy frames without the structured MCP endpoint. Reopened Dashboard `1178:2466`; the inspector reports1440×2669 and the visible frame shows Lola James, the shared admin navigation, and nine dashboard metric cards (including watched films, average rating, communities, reviews, likes, lists, session time, new users and engagement). Only API-backed counters are represented in the application; unsupported sample metrics remain a documented API gap. Reopened Reviews `1310:3108` at1440×3401 and Movies `1260:3772` at1440×3352 on canvas; this adds frame visibility/identity only, not local runtime parity.

`get_design_context(1260:3772)` remains Starter-rate-limited despite successful Figma session/auth. The local Vite Admin route redirects to `/uk/home` in the current unauthenticated browser session. `docker compose ps` cannot contact the Docker Desktop Linux engine, and local API port8081 refuses connections; no disposable Admin fixture was created and no role/data was changed. No source/API changes, build or tests in this check.


### Push and CI checkpoint — 26.10.2026

Commit `d09f41cbea04558cd7fa68cf6de7dacd4746dc9d` (`Continue Figma UI implementation across Rewind`) was pushed to `master`. GitHub Actions [`CI / verify (push)` run 40416354812](https://github.com/anton5267/rewind-letterboxd/actions/runs/40416354812) completed successfully in2m03s. The job passed backend tests with MySQL, frontend build/typecheck, and HTTPS proxy validation. This is the standard CI gate for that commit; it is not the planned full Playwright/admin/security/backup regression, and visual inventory, Docker refresh/smoke and remaining goal criteria are still open. Diploma artifacts, local `AGENTS.md`, and the temporary Vite visual-audit config were excluded from the commit and remain local.


### Admin read-only runtime recheck — 27.10.2026

Docker Desktop is running again; `docker compose ps` reports the existing API, MySQL, Redis and Mailpit containers up, and API health returns HTTP200. Existing project DB/Redis volumes and `.env` were preserved; no image rebuild or container recreation was performed. Local Vite served Admin routes on5174. In a natural Chrome viewport (no viewport override), UK Movies showed six cards/page across34 pages (203 records); UK Reviews showed115 records/3 pages; Comments106/3; Moderation220/5. Read-only DOM/screenshots confirmed populated cards, visibility controls, Review/Comment Hide and Delete buttons, and moderation type/search/reason/bulk controls. Admin Logs rendered the API's genuine empty state. Settings rendered four supported settings with four Save buttons; read-only DOM inspection measured each input at257×41 in a1536×639 viewport, with document width1521/1521. Values were not read and no Save was submitted. No moderation or content action was submitted. Visible leading data includes old synthetic concurrency/E2E records; their provenance is not safely attributable from this visual pass, so they were left untouched. The Movies card fallback is visible where those records have no poster. This is not matched-width Figma parity, nor does the no-overflow observation generalize beyond the ordinary browser viewport.

For authentication, created disposable Admin users ID8617 and ID8618, promoted only each exact new row, and used them for read-only navigation. Each was deleted with the exact ID+email predicate; DB counts were `before=1`, `after=0`. An earlier disposable visual fixture ID8616 was also confirmed `before=1`, `after=0`. No existing account role or movie/review/comment data was modified. `get_design_context` remains Starter-rate-limited; these observations supplement runtime review but leave Admin matched geometry, keyboard and mutation checks open. No source/API changes, build or automated tests in this checkpoint.


### PublicProfile phone identity canvas recheck — 27.10.2026

Live Current-Copy canvas reselected `825:1378`; inspector reports393×2355. The visible identity uses the short name “Jeremy B.”, a portrait and a Follow action, so this frame does not exercise long-name wrapping. Existing browser evidence from 25.10 already verifies the 22-character API display name at UK320/393 and EN320, with the avatar slot and y317 identity anchor preserved; that check is not repeated or expanded here. Current source keeps a120×120 avatar/fallback and a361px bounded identity rail with `overflow-wrap:anywhere`; API user7748 has `avatarUrl:null`, so the live API does not supply the Figma sample portrait. The mobile hero references the local Whiplash still. Figma structured reads remain rate-limited: `get_design_context` was denied and `whoami` confirms the connected seat is Starter. The archived local `.fig` is key `orb73jiLJnIsZNCRtJsWgS`, not the current Copy `BDO9GO1oscOeUTcu4VXVKA`, so it was not substituted. Authenticated Block/Message placement and full composition remain open. No source/API/data changes, build or tests.

The current-Copy Reviews canvas frame `1310:3108` is1440×3401 and labels the metadata column “Year” while showing full calendar dates. That confirms the application’s localized full-date treatment under this label is compatible with the reference; it is canvas evidence only and does not close the Admin layout/interaction parity checks.


### Community empty-reserve runtime spot check — 27.10.2026

Opened a fresh local Vite preview on port5175 with the existing API at8081 and reviewed UK `/community` in the ordinary1536×639 Chrome viewport. The API rendered the genuine empty Featured Members state, five Popular reviewers, and a populated directory with page1 of38; no fixture data was injected. A scrolled visual inspection confirms the post-reserve blank Featured region precedes the Popular section, consistent with the intent of the CSS reserve. This viewport does not prove the exact1440 anchor or the full frame geometry, and no populated Featured/HQ state was available. Keep the 605:1112 and1517:4931 rows open for matched geometry and populated-state comparison. No source/API/account/data changes, tests or build.


### Community directory keyboard pagination focus — 27.10.2026

On the API-backed UK `/community` page in the natural1536×639 Chrome viewport, sequential Tab navigation reached the directory search, visible user rows, and pagination; the next tab entered the footer. Shift+Tab returned focus to the enabled “Далі” button, and a fresh screenshot showed its cyan focus ring. The existing page state remained page1of38; the button was not activated. This verifies keyboard reachability and visible focus for this pagination control only, not matched Figma geometry, other locale/state variants, or the full directory interaction set. No source/API/account/data changes, tests or build.


### Admin Movies authenticated route recheck — 27.10.2026

Created disposable local user ID8619 through the CSRF-protected registration route, promoted only the new ID/email to ADMIN, and signed into the UK Vite preview. `/uk/admin?view=movies` rendered the admin navigation and a catalog with203 items/34 pages in the natural1536×639 viewport. The first nine pages exposed synthetic-looking `Concurrent ...` records; they were left untouched and no edit/delete/import action was invoked. This confirms route access and data presence only; it does not inspect the editor workspace or populated credits. Cleanup by exact ID+email predicate reported `before=1`, `after=0`; the preview tab was closed. No existing user role or movie/review/comment data was changed, and no build or tests were run.


### Admin Movies Delete action placement and keyboard focus — 27.10.2026

Reopened Current-Copy Edit Film frame `1260:4840` on the Figma canvas; the inspector reports1440×3128. At50% canvas zoom the editor card visibly includes Name, Duration, Status, Original Language, poster change controls, Year, Genre, Description, Director, Main Actors, Average User Rating, Number of Reviews, Popularity Dynamics, and a red Delete Film action at the card's lower right. Structured `get_design_context` and `get_screenshot` both returned the Starter MCP call-limit response; `whoami` confirms the connected full seat is on the Starter tier. The reference was read from the existing Chrome canvas only; the Figma document was not edited. The workspace height target was already measured in the earlier matched-width checkpoint as1485px; this review does not replace that measurement.

**Superseding canvas check later on 27.10:** reopening the exact `1260:4840` URL and inspecting the selected frame at50% showed a reviewer/recent-news page segment and footer rather than the editor card reported above. The inspector still showed1440×3128 and the export label “Edit Film - Sulyma Bohdan”. Because the visible content does not reconcile, suspend the Figma frame identification and all poster/workspace/Delete-placement parity claims attributed to this node. The local editor's API behavior and standalone keyboard/focus evidence below remain runtime evidence, independent of frame parity. See [node-content ambiguity](#admin-movies-figma-node-12604840-canvas-content-ambiguity--27102026).

Implemented a lower-right Delete button inside the local editor, reusing the existing localized `deleteMovie` label, `removeMovie()` handler, `window.confirm` and DELETE API. It is also available from the catalog's existing action menu. In the UK `/admin?view=movies` natural1536×639 preview, a temporary ADMIN opened one existing synthetic concurrency movie read-only; no fields were changed and no delete/save/import was invoked. Tab traversal reached the editor's Delete button and a fresh screenshot showed the cyan focus ring. Clicking Cancel closed the editor and returned focus to that row's Edit button. Temporary Admin ID8621 was deleted with exact ID+email predicate (`before=1`, `after=0`); the browser tab was closed. The final red pill styling sets a 44px minimum target and right-aligns the action; post-style
npm run verify:build` passed TypeScript and Vite7.3.7 (232 modules,5.00s). No automated tests were run. This verifies action placement and keyboard/Cancel behavior, not populated credits or full editor geometry. The Figma frame's status, original-language and three aggregate metrics have no matching supported semantics in the current admin/movie detail contract; do not synthesize them or map `Movie.rating`/TMDB scores to user aggregates. No backend/API contract changes, no existing film/user mutations.


### Admin Movies live session and disposable fixture cleanup — 27.10.2026

After Docker Desktop resumed, `docker compose ps` showed the existing API, MySQL, Redis and Mailpit containers up; `/actuator/health` returned `UP`. Created local disposable Admin ID8622 through CSRF-protected registration, promoted only its exact ID/email, and reached `/uk/admin?view=movies` in the UK Vite preview. The real catalog reported203 records across34 pages; visible `Concurrent ...` records were left untouched and no movie editor/save/delete/import action was submitted. This confirms authenticated route and catalog availability only; populated-credit rendering and editor geometry remain open. The fixture was removed using its exact ID+email predicate (`before=1`, `after=0`); no existing account role or content was changed. No containers were recreated, automated tests were not run, and `.env`/DB volumes were not modified.


### Admin Movie Editor keyboard recheck and fixture cleanup — 27.10.2026

Created disposable ADMIN8643 through the CSRF-protected local registration flow, promoted only its exact user row, and opened `/uk/admin?view=movies` in Vite at the available natural1519×688 viewport. Opened the existing synthetic `Concurrent review film 93e0dbd5` row read-only. Keyboard traversal reached the editor Delete button and the screenshot showed a cyan focus ring; Cancel closed the editor and returned focus to that row's Edit button. No field changed and no save/delete/import action ran. Logged out and deleted only the fixture using exact ID+username+email+ADMIN predicates; database count verified1→0. The Current-Copy canvas inspector for Movies catalog candidate `1260:3772` reports1440×3352, but the canvas screenshot timed out in this pass, so no frame-content or runtime-parity claim is added. This is behavior/focus evidence, not matched-width geometry. No source/API/film changes, build, automated tests or Docker changes.


### Admin Movies populated-credit viewport targeting and Figma access — 27.10.2026

The current Figma file/session remains authorized, but the exact Edit Film node `1260:4840` still returns the Starter MCP call-limit response; `whoami` confirms Full seat on Starter. The open Chrome canvas itself remains readable and its inspector confirms the selected frame is1440×3128. Source review confirms the Admin movie API sorts by descending ID and the editor requests six records per page. Read-only DB counts locate existing populated-credit candidates: Avatar: The Way of Water (ID50) is zero-based catalog position153/page26; Send Help (ID33) is position170/page29; The Avengers (ID31) is position172/page29. A new disposable Admin session ID8623 reached the catalog and navigated through page7; the current synthetic-looking entries remained untouched, and this session did not reach the target record or open the editor. Cleanup used the exact ID/email predicate (`before=1`, `after=0`). No source/API/Figma changes, no movie mutation, build, or automated tests.

### Admin Movies populated credits rendered in editor — 27.10.2026

Used disposable ADMIN ID8624 on the local UK preview at its natural1536×639 viewport to open Avatar: The Way of Water (catalog page26) without submitting any editor action. The API-backed editor rendered the stored title, runtime/date, IMDb ID, poster/backdrop URLs, description, genres (Science Fiction, Action, Adventure), director (James Cameron), and eight cast/character entries. This closes the prior question of whether populated credits reach the Admin editor; it does not establish matched Figma geometry or cover other locales/states. Scrolling away from the editor showed the underlying catalog card, so a full-frame visual geometry comparison was not captured. The editor was closed with Cancel and focus returned to that film's Edit button. Disposable user ID8624 was deleted with exact ID+email predicate (`before=1`, `after=0`), then logged out; the tab returned to guest Home. API health remains `UP`. No film fields or existing accounts/data were changed; no build or tests were run. Figma structured context remains Starter-rate-limited.


### PublicProfile guest desktop content spot check — 27.10.2026

Opened the current UK `/users/7748` route in the ordinary Chrome window (1519×688 screenshot; no viewport override). The live guest state showed the fallback avatar, localized Follow link to Login, desktop profile rail, genuine empty Favorites/Lists sections, and API-backed Activity, Reviews and Following previews; the accessibility tree also exposed the supported Statistics, Social Links, collection tabs and Liked Reviews later in the page. Sequential Tab navigation reached the Follow link after the profile statistics links; the gold focus outline was visible, and its destination remained the localized Login route. The link was not activated. This is a state/content and keyboard spot check only: the selected Figma frame `238:596` is1440×4459, so the natural window is not a matched-width geometry comparison. Existing exact-width evidence and documented live-vs-sample data gaps remain authoritative. The user-owned Figma canvas was not edited; structured `get_design_context` again returned the Starter MCP call-limit and `whoami` confirmed the connected Full seat is on Starter. No source/API/account/data changes, build or tests.


### Current-Copy frame 845:1679 route identity recheck — 27.10.2026

Opened the exact Current-Copy URL for node `845:1679` in a separate Figma browser tab. After the editor loaded, the inspector identified a393×1162 frame at x−4892.76/y4538. The canvas crop showed the unrelated “Funny Papers” and “Coming Home” editorial cards; it did not show the selected off-canvas frame's descendants. A fresh Find for “Funny Papers” returned eight text matches; the selected text node was at x540/y4253, while the candidate frame inspector remained at x−4892.76/y4538, confirming the visible article crop cannot identify this frame. Toggled the selected frame visibility once to inspect it and immediately restored its original hidden state; the visible crop remained unchanged and still did not expose the candidate contents. The prior assumption that these visible cards demonstrated a PublicProfile Films grid is therefore withdrawn. No frame contents, route, owner/prototype link, or transition are established; keep the candidate unclassified and do not count it as Profile Films. No persistent Figma design change remains; the candidate's original hidden visibility state was restored. Structured `get_design_context` still returns the Starter call-limit. This corrects conflicting active wording in PLAN and FIGMA_HANDOFF; historical checkpoint text remains only as provenance of the withdrawn hypothesis. No source/API/data changes, build or tests.

### Admin Logs UK/EN populated runtime spot check — 27.10.2026

Created disposable ADMIN user8625 and one exact audit-log render fixture (`USER_ACTIVATED`, target USER8625, unique metadata marker). The Admin Logs route rendered the live API row in UK and EN in an ordinary1519×688 Chrome screenshot: administrator ID/target at the left, localized action and timestamp at the right, within the existing rounded card. This is populated route/localization/render evidence only, not matched1440 Figma geometry, mobile composition, keyboard/focus coverage, or proof that an application mutation generated the fixture row; the row was inserted directly as temporary database fixture data. Logged out, then deleted user8625 using exact ID+email+ADMIN predicate; the FK cascade removed the linked row. Counts were user1/log1 before and user0/log0 after. API health returned200. No existing account or application content was changed; no build or tests.


### Admin Review/Comments Figma canvas and contract review — 27.10.2026

Opened current-Copy Figma Review `1310:3108` and Comments `1342:3589` on a separate read-only Chrome tab. The inspector confirms1440×3401 and1440×2855 respectively; both canvas frames show three editorial cards within the admin page composition. The Comments frame includes a View Reported Comments affordance and per-row Year/Likes/Replies fields. Cross-checking the current code confirms `AdminReviewResponse` and `AdminCommentResponse` expose no Likes/Replies counts, while `AdminCommentController` only lists, hides, unhides and deletes comments—there is no reported-comments/report route. Preserve these as API/product gaps; do not render invented counts or inactive controls. The existing source cards use a1200 px desktop rail, two columns, rounded translucent surfaces, and Figma-derived 429 px Review / 249 px Comment row minimums. This pass did not use a matched-width source viewport or prove those rendered geometry values; matched1440/mobile and keyboard/focus remain open. `get_design_context` was blocked by the Figma Starter call limit, so the evidence is manual canvas plus source/API inspection, not structured node data. No Figma values, source, API, or application data changed. After this audit,
npm run verify:build` passed TypeScript and Vite7.3.7 (232 modules,5.01s); no automated tests were run because the visual stage remains open.


### Admin Reviews/Comments populated UK/EN render — 27.10.2026

Used disposable ADMIN user8626 to inspect the live `/uk/admin?view=reviews`, `/en/admin?view=reviews`, `/uk/admin?view=comments` and `/en/admin?view=comments` routes in Chrome at the natural1519×688 viewport (no viewport override). Existing API rows rendered in both locales: Reviews showed115 records across3 pages; Comments showed106 across3 pages. Screenshots showed translucent rounded cards with review/comment text and identity at the left and rating/date/status/actions at the right; visibility labels, Hide and Delete actions were localized in UK/EN. The development database rows carry E2E/concurrency-like content, so this confirms API-backed layout/localization only, not representative production copy, matched1440 Figma geometry, mobile composition, keyboard/focus, or mutation outcomes. No existing review/comment was changed. Signed out and deleted only fixture user8626 with exact ID+email+ADMIN predicate; user count1→0, audit rows0→0. API health remained UP. No build or tests.


### Admin Comments keyboard focus spot check — 27.10.2026

On the UK `/admin?view=comments` route, used disposable ADMIN user8627 and keyboard Tab navigation from the visibility filter into the first comment's Hide and Delete controls. Both controls showed the cyan focus outline in a Chrome screenshot at the natural1519×688 viewport. Neither action was activated, so no existing comment changed. This checks the two first-row actions only; other rows, locale, pagination and dialog return-focus paths remain open. Signed out; deleted only user8627 with exact ID+email+ADMIN predicate. User count1→0 and admin audit rows0→0; API health returnedUP. No source/API/comment changes, build or automated tests.


### Admin Comment DELETE Cancel/Confirm, focus return and fixture cleanup — 27.10.2026

Using disposable ADMIN8629, created review4078/movie33 and comments18297 (`codex-delete-audit-… cancel`) and18298 (`… delete`). In the UK Admin Comments route at Chrome's natural viewport, activating Delete on18297 opened the localized native confirmation. Escape canceled it; the row remained in the API-backed list and the cyan focus ring returned to that row's Delete button. Activating Delete on18298 and confirming removed that row; the list count changed108→107, only the cancel-marker row remained, and a fresh screenshot showed visible cyan focus on the Comments h2. Read-only SQL confirmed comment18297 and review4078 remained before exact cleanup while18298 was absent. Cleanup deleted only user8629 with the exact ID/email/ADMIN predicate; user, review4078, comments18297/18298 and related audit counts were all0 afterward. API health returned `UP`. No existing account or content was changed. No source/API changes, build, automated tests, Docker rebuild, commit or push. This closes the manual Comment DELETE cancel/confirm/focus path at the natural viewport; matched Figma geometry and remaining locale/failure/page permutations remain open.


### Admin Review DELETE native-dialog interruption and exact fixture cleanup — 27.10.2026

Created disposable ADMIN user8630 (`reviewdeld2dcc7d19ede40`) and review4079 for movie33 through the real API. The UK Admin Reviews route rendered the unique review as the first row. Clicking its Delete action opened Chrome's native `Видалити цей огляд назавжди?` confirm. Chrome accessibility showed Cancel/OK, but interaction with Cancel and subsequent tab recovery timed out in focus emulation; no second Delete click or confirmation was issued. A read-only database query confirmed review4079 still existed after the interruption. To ensure no fixture/session remained, deleted only user8630 with its exact ID, username, email and ADMIN role predicate; the cascade removed only its review/audit data (user/review/audit counts all0). API health returned `UP`. No existing content or user was changed. **This interruption was later superseded by the complete manual check below.** No source/API changes, build, tests, Docker rebuild, commit or push.


### Admin Review DELETE Cancel/Confirm focus and fixture cleanup — 27.10.2026

On the live UK `/admin?view=reviews` route at Chrome's natural viewport, disposable ADMIN8640 authored two unique reviews for Zootopia 2. The first review (4081) was selected in the admin list and deleted by accepting the native confirmation; the API-backed count fell116→115 and focus moved to the Reviews h2. A second fixture review (4082) was used for Cancel: dismissing the same native confirmation left the row in place and returned visible focus to its Delete button. Reopening and accepting the dialog removed only that row; the count fell116→115 and the focused element was the Reviews h2. This verifies both branches and their focus destinations. An earlier isolated disposable ADMIN8639/review4080 was also used for Cancel; after dismissing it, the exact row remained in the DB, but Chrome focus emulation timed out before the DOM focus could be observed, so that first attempt added no focus claim. Cleanup removed only fixture-owned review4082, rating, admin audit rows and user8640 by exact IDs/identity; fixture8639/review4080 were likewise removed with exact ID predicates. Counts for reviews, ratings, audit rows, and users were0 after cleanup; API health returned `UP`. Existing content and accounts were not modified. No source/API changes, build, tests, Docker rebuild, commit or push.


### Owner Profile empty-state and settings baseline — 27.10.2026

Authenticated a disposable USER8641 and opened UK `/profile` plus `/profile?settings=profile` in Chrome at its natural1519×688 viewport. The empty overview exposed Favorites, Activity, Reviews, Following, the system Watched list and statistics with the expected empty messages. Profile settings exposed only the supported editable Display Name plus read-only Username and Email, with the Favorite Films empty state; no unsupported profile fields were invented or changed. The settings screenshot showed the shared hero and the form aligned to the left content rail. This is a live API-backed empty-state and supported-field baseline only; no matched1440 frame comparison was made and the visual identity/settings section anchors remain open. Logged out, deleted only USER8641 by exact ID/email, and verified user/review/rating counts0 and API health `UP`. No existing user or data changed; no source/API changes, build, tests, Docker rebuild, commit or push.


### Owner Profile frame section-order cross-check — 27.10.2026

The connected current-Copy Figma canvas selected own Profile frame `238:865`; its inspector reports1440×4459. At50% zoom, the visible populated center section shows Recent Activity followed by Recent Reviews, with poster and review cards. A fresh full-frame canvas capture at12% additionally shows the hero, profile tabs, Favorites grid, Activity and Reviews cards, Following rail, Lists preview and footer in that composition. The previously captured local owner Profile accessibility tree presents the supported order Favorites → Activity → Reviews → Following → Lists → Statistics. Thus the visible Activity/Reviews ordering is consistent, while complete section order/placement and matched1440 runtime geometry remain open. A fresh `/uk/profile` preview without an authenticated session redirects to `/uk/login`, so this pass adds no authenticated owner-runtime comparison. Figma's example content is populated while the disposable local API profile was empty; no sample data was copied. Structured `get_design_context` and screenshot MCP calls are currently at the Starter call limit; this is manual canvas + existing runtime-tree evidence only. No source/API changes or tests.


### Admin Reviews Figma field/action contract comparison — 27.10.2026

Opened current-Copy Reviews frame `1310:3108`; Figma inspector confirms1440×3401. At50% canvas zoom, the populated card visibly includes film/user/text, User Rating, Year, Likes, Comments and an Edit Review action; the frame also has View Reported Reviews. The current UK `/admin?view=reviews` route rendered real API rows at Chrome's natural1519×688 viewport (not a matched1440 check); its cards expose title, username, review content, rating, localized full date, visibility and the supported Hide/Delete actions. Source cross-check: `AdminReviewResponse` has rating/createdAt but no per-review likes/comments counts; `AdminReviewController` provides list, hide, unhide and delete but no report-list or edit operation. Keep these as explicit API/product gaps; don't add synthetic counts or inert controls. Logged out through the UI; disposable ADMIN8631 was then deleted by exact ID+username+email+role predicate and verified user/audit counts0; API health remained `UP`. No existing review was changed. No source/API changes, build or automated tests.


### PublicProfile authenticated Followers runtime and fixture cleanup — 27.10.2026

Using disposable USER fixtures `profileview24bd5e3007a4` (ID8632) and `profiletarget24bd5e3007a4` (ID8633), registered through the local CSRF-protected flow, the UK `/users/8633` route at Chrome's natural1519×688 viewport exposed authenticated Follow/Unfollow, Block and Message controls. Activating Follow changed the control to Unfollow and updated the displayed follower count to1. Opening `?view=followers` showed the API-backed fixture user as a populated row; this verifies behavior/data rendering, not the own-profile network-list design. On return to the overview, the Unfollow control had keyboard focus and a fresh screenshot showed its gold outline; Block/Message were not activated in this pass. The action placement is not a matched1440 geometry comparison. Current Figma desktop `238:596` (1440×4459) shows a guest Follow CTA; the phone `825:1378` shows a sample portrait/short name. This live target had no avatar URL and rendered its username initial fallback, so sample media/identity variance remains. The viewer was signed out. Exact-ID/username/email predicates removed both disposable USER rows (2 deleted); afterward, counts for IDs8632/8633 and all involving follow rows were0. API health remained `UP`. No existing accounts or content were changed; no source/API changes, build or tests.


### Admin Movies workspace-height evidence clarification — 27.10.2026

The earlier matched1440 editor measurement of workspace height752.8px used the empty-credit movie fixture4162; the Figma Edit Film frame is1485px tall. Source review in `AdminMovies.tsx` confirms `.editorMetadata` only renders when the movie details response contains genres, directors or actors. Populated credits were later confirmed in the Avatar ID50 editor, but that pass did not capture the full workspace height. Therefore the 752.8px figure is not evidence for the populated state, and no artificial `min-height` is added to compensate. Remeasure the existing Avatar record at matched1440 and compare the supported-field composition before changing CSS. The disposable Admin fixture ID8634 created for this follow-up was signed out and removed by exact ID+username+email+ADMIN predicates; user and audit counts were0 afterward. No movie fields, source code, API, or tests changed.


### Admin Movies Figma access recheck and fixture cleanup — 27.10.2026

Created a Figma session for current-Copy `BDO9GO1oscOeUTcu4VXVKA`; `whoami` confirms the connected Full seat is on Starter, and `get_design_context` for Edit Film `1260:4840` again returned the Starter call-limit response. The read-only Chrome canvas and inspector remain available: the selected Edit Film frame is1440×3128 and visibly contains Year, Genre, Description, Director, Main Actors, aggregate metrics and Delete Film. This is canvas evidence only; no matched-width runtime workspace measurement was obtained. Keep unsupported editable credit controls and aggregate metrics as contract/product gaps, and leave the populated Avatar workspace-height comparison open. A stray disposable ADMIN fixture ID8636 (`adminvisuale81f9c3ea8`) created by an interrupted command was removed with exact ID, username, email and ADMIN predicates: before user count1/audit0, deleted1, after user0/audit0. No login, movie mutation, existing account/content change, source change, build or tests occurred.


### Guest Home frame sequence cross-check — 27.10.2026

The current-Copy Figma canvas selected the guest Home frame `1413:6471`; its inspector reports1440×4934. At20% canvas zoom, the full-page composition shows the hero, newest-film rail, six-item product explainer, guest review/sign-up section, popular reviews, popular lists, reviewers, Recent News and footer. The live UK `/home` route was opened in Chrome at its natural1519×688 viewport; the accessibility tree confirms the same section order and localized headings, with API-backed film/review/list rows. The development data includes test-like `Concurrent social film` reviews and generated journey-list names, and the Journal route is genuinely empty, so those values are not representative design content. This confirms route/state composition only: no matched1440 geometry, long-copy wrapping, member session or delayed shared-feed state was checked. No source/API/data changes, build or tests.


### Admin Movies editor UK keyboard and cancel review — 27.10.2026

Created disposable ADMIN8637 through the local registration flow and limited the role change to the exact new user/email. After logging in, `/uk/admin?view=movies` loaded real catalog rows. Opened Edit on the first existing test-like record and made no edits. The visible form exposed only supported fields (title, duration, release date, IMDb ID, age rating, rating, poster/backdrop/trailer URLs and description), plus Save/Cancel/Delete; no unsupported Figma status/language/credits controls were fabricated. At the natural1519×688 viewport, keyboard traversal scrolled to the description textarea and its cyan focus outline was visible. Cancel closed the editor and returned focus to that row's Edit button. This is a runtime/accessibility check, not matched1440 parity; the selected Figma frame `1260:4840` is1440×3128 and includes other metadata outside the current API write contract. The existing film was not changed or deleted. Logged out and removed only fixture8637 using ID+username+email+ADMIN predicates; matching user and audit counts were0 afterward, API health `UP`. Current
npm run verify:build` passed TypeScript and Vite (232 modules,5.08s). No automated tests, Docker rebuild, commit or push.


### PublicProfile desktop overview data and section cross-check — 27.10.2026

Reselected current-Copy `238:596` (“Profile Page Profile - Simchuk”); the Figma inspector reports1440×4459 and the canvas shows its populated profile hero/rail and sample identity “Jeremy B.” The live UK `/users/7748` route was opened at the available natural1519×688 browser viewport. Its accessibility tree contains the real API-backed profile sections (favorite films, activity, recent reviews, following, lists, statistics, social links, collections and liked reviews); the sample account has username `social_race_5a62c9ea`, no avatar URL and one recent review, so its initial-avatar fallback/content differs from the Figma sample. The route remains guest with Follow linking to Login. This confirms current route/data composition only: the browser width is not1440 and no pixel/anchor parity is claimed. Existing matched-width/keyboard evidence remains the only geometry evidence; desktop overview placement stays open. No relation action, account/data/source/API/Figma mutation, build or automated tests.

### Global Search no-match keyboard focus check — 27.10.2026

At the available natural Chrome viewport (1519×688), UK `/uk/search?q=duna` returned zero matches across all eight categories. The existing no-match layout displays its explanation and localized “На головну” link; keyboard traversal reached that link and Chrome showed its visible cyan focus outline. The selected Figma Search no-matches frame `1480:5809` was still loading on the canvas, so this is runtime state/accessibility evidence only, not a matched-frame comparison. The development dataset has no Dune rows; no static Figma samples were introduced. No source/API/data changes, build, automated tests, Docker actions or Figma edits.


### Admin Movies populated Avatar editor natural viewport review — 27.10.2026

Created disposable ADMIN8638 through the local CSRF-protected registration route and promoted only its exact ID/email row. In UK `/admin?view=movies`, page26/34 contained the existing Avatar: The Way of Water record (ID50). Opening Edit rendered the populated read-only credits from the existing movie-details API: three genres, James Cameron, and eight cast entries. The API-backed fields were visibly grouped beside the 275×411 poster, followed by the long plot and Save/Cancel/Delete actions. A read-only DOM measurement at Chrome's natural1536×639 viewport recorded the editor card at1200×969.2px, fields/form width1140px and credits metadata198.4px high; this is not a matched1440 comparison and does not establish the Figma1485px workspace target. The editor was canceled without changing Avatar; the Admin session was logged out. Exact ID/username/email/ADMIN cleanup deleted fixture8638 and verified its count1→0. No existing user/movie, API, source, Figma, or test data was changed; no build or automated tests.


### Admin Movies Edit Film canvas/runtime content cross-check — 27.10.2026

On current-Copy Figma canvas, `1260:4840` is1440×3128. At50% canvas zoom its edit card visibly groups poster and editable Name/Duration/Status/Original Language, poster change, Year, Genre, Description and Change actions; the broader frame also contains director, cast and aggregate metrics. Opened existing Avatar: Fire and Ash in the local UK Admin editor using disposable ADMIN8642 at Chrome's natural1519×639 viewport. Runtime places its275×411 poster beside a two-column API-backed form, read-only Genre/Director/Cast from movie details, then Description and Save/Cancel/Delete. This confirms the populated-credit condition and shared poster-plus-fields hierarchy, but not exact frame geometry: runtime additionally exposes date, IMDb ID, age rating, rating and image/trailer URLs; Figma's Status/Original Language/change actions and review/popularity metrics lack matching current AdminMovie semantics or controls. Preserve these as explicit contract/product gaps; do not fabricate fields or force a workspace height from the frame. The movie editor was canceled without saving, then the test admin was logged out. Exact ID/username/email/ADMIN cleanup deleted fixture8642 and verified user/audit counts0. The canvas was left at50% zoom; an accidental opacity keystroke was immediately undone and the selected frame's opacity was verified back at100%. No persistent Figma/app/data changes, source edits, build, or tests.


### Popular Reviewers UK/EN runtime and frame composition check — 27.10.2026

Read current-Copy Figma frame `1413:13364` at1440×2850; its desktop design contains the hero, reviewer table, pagination dots, a separate Popular Members avatar rail and footer. The local `/uk/community/reviewers` route was inspected at Chrome's natural1519×688 viewport: it renders ten real API rows with watched/list/like metrics, login-bound Follow links for guests, and no pagination or separate member rail. The list ends before the footer. Source confirms `GET /users/popular-reviewers?size=10` returns an array with a capped size, not page metadata; there is no separate API feed for the member rail. EN route renders localized title, intro, column labels and metrics with the same API records. A Tab pass reached the first reviewer link with a visible cyan focus ring. Development names are generated `social_race_*` records, not Figma sample identities. Keep pagination/member rail as documented data/API gaps; do not fabricate members or page controls. Matched1440 runtime geometry, phone frames and full loading/error/empty permutations remain open. No source/API/data changes, test/build, or Figma edits.


### All Films desktop UK/EN populated runtime check — 27.10.2026

Current-Copy Figma `1413:12611` is1440×2956 and visually duplicates desktop composition `1480:4797`: title, filters, query/count and a six-column poster grid with pagination. At the natural1519×688 Chrome viewport, `/en/films?sort=rating_desc` and its UK route preserve Highest rated / Найвища оцінка, render localized filters and return203 API records on page1 of6 (36 per desktop page); `GET /api/genres` returns200 with17 options. The query field focus ring is visible; keyboard ArrowDown/ArrowUp changes Genre and restores All genres without applying the form or changing the URL. A read-only direct API check confirms all36 first-page rows are generated `Concurrent rating film` records with `photoUrl: null` (203 total records); visible blank poster fallbacks are therefore current development-data variance, not an app rendering defect. No Figma samples are copied. This is a natural-width route/state comparison, not matched1440 geometry; full-page exact geometry, populated real posters, query/error/empty/retry/locale permutations remain open. No source/API/data edits, tests or build.


### Person UK/EN live API and genre keyboard check — 27.10.2026

Opened `/uk/people/actor/287` and `/en/people/actor/287` in local Vite preview at the available natural1519×688 viewport. The existing API returns Rafi Gavron with one linked film; both routes render the localized Person headings, sort and genre controls, including17 genre choices. On EN, keyboard ArrowDown selected Action and ArrowUp restored All genres; first Tab focus on REWIND has a visible cyan outline. Separate read-only API requests for actor287, director138 and actor500 returned one film for Rafi Gavron and404 for the latter two IDs, so those 404s are absent-record responses rather than a retry defect. On missing actor500, UK and EN each render a localized Retry control; activating it returns focus to the Filmography h1, and both screenshots show its cyan outline at the natural viewport. Current-Copy Figma MCP context/screenshot requests remain blocked by the Starter call limit. A later canvas re-poll loaded Actor Page `545:676`; its inspector confirms1440×2842 and the screenshot shows populated Brad Pitt artwork with multiple filmography sections. This remains a frame-only comparison, not matched-width runtime geometry. Person matched1440 and phone retry/focus states remain open. No source/API/data changes, build or automated tests.


### Current-Copy Journal newsletter text search — 27.10.2026

In Figma Find, set the scope to All pages and object types to All. The exact queries `newsletter` and `subscribe` both returned “No results in this file.” This narrows the search evidence: no text/name match identifies a public newsletter frame in the current Copy. It does not prove there is no unlabeled or image-only signup design, so the public newsletter mapping remains open and the Admin newsletter queue stays separate. No app/source/API/data/Figma edits, build, tests or Docker actions.


### Current-Copy Films frame route reclassification — 27.10.2026

Selected current-Copy node `1260:3772` in the connected Chrome Figma canvas. The inspector identifies a1440×3352 frame named “Films - Sulyma Bohdan”; the visible composition includes a centered profile identity/avatar header, profile navigation, a two-column film-card grid, pagination and site footer. Its Prototype panel has no configured outgoing interaction. This contradicts the earlier Admin Movies / Film Database classification, which was based on a prior mistaken canvas interpretation. The canvas places it beside `User Profile - Sulyma Bohdan` (`1237:4369`) and `Reviews - Sulyma Bohdan`, so it is most likely a selected-user Films view, distinct from the separately named own Profile Films frame `341:3348`. Its exact prototype destination is not configured. Current `AdminUsers.tsx`/`AdminUserOverview` exposes aggregate `stats.watched` but no per-user films list route or API payload; keep this as an open route/contract gap and do not fabricate a list. The prior Figma card/poster measurements remain observations of this frame, not proof of AdminMovies parity. An initial navigation on the old Chrome preview tab timed out at focus emulation. A fresh Chrome tab reached `/uk/profile?view=collection&collection=watched` but redirected to Login because this preview has no authenticated session; the public `/uk/users/7748?view=collection&collection=watched` loaded the localized empty collection, which is not evidence for this candidate route. No runtime comparison was made. Updated PLAN and FIGMA_HANDOFF mappings; no app/API/Figma data changes, build, tests or Docker actions.


### PublicProfile live API tree and frontend build — 27.10.2026

Opened the local UK `/users/7748` route in Chrome and inspected its accessibility tree. It exposed the live profile shell, localized section links, Favorites and Lists empty messages, API-backed Activity/Reviews/Following rows, statistics, social links empty message, and the three collection tabs. The owner-only `/profile` route redirected to Login without an authenticated session. The observed user/review data is the local development database's real response; no rows were created or removed. This is a content/route check at the browser's natural viewport, not visual geometry or matched-width evidence. `Page.captureScreenshot` timed out, so no visual screenshot comparison is claimed.

`npm run verify:build` in `frontend/` passed on 27.10.2026: `tsc --noEmit` succeeded; Vite7.3.7 transformed232 modules and completed in5.14s. No source, API, or data changes were made in this checkpoint. The authenticated Admin tab's snapshot also timed out at Chrome focus emulation; Admin visual gaps remain open. No automated suites, Docker rebuild, commit, or push were performed.

### PublicProfile natural runtime vs current Figma canvas — 27.10.2026

The current Figma canvas opened node `238:596`; the inspector confirms1440×4459, and a full-frame capture shows the public profile hero, profile navigation, collection/review sections and footer. In the local UK `/users/7748` runtime, the natural browser capture is1536×639 and the accessibility tree exposes the corresponding supported profile sections: favorites, activity, reviews, following, lists, statistics, social links, collections and liked reviews. The local account has no display name and uses the configured avatar fallback; Figma's “Jeremy B.” identity and portrait are sample content, so this is an API/data variance. The runtime capture shows the hero region only; it does not establish matched-width or full-page geometric parity. The owner `/profile` route still requires authentication and redirected to Login in this guest browser context.

Figma `get_design_context` and `get_screenshot` remain blocked by the Starter MCP call limit, confirmed by `whoami`; the regular Chrome Figma canvas is available and provided the frame capture. A separate natural PublicProfile screenshot call after scrolling timed out in Chrome, so lower-section visual layout remains unverified. No source, API, Figma, or database changes were made. No automated tests or Docker actions were run in this checkpoint.

### PublicProfile exact-frame identity recheck — 27.10.2026

Reopened the connected Figma canvas at Current-Copy node `238:596`. The selected frame inspector reports1440×4459, and the visible frame contains the public profile hero, follower/following counts, a Follow action, Profile/Films/Watchlist/Likes/Lists tabs, Favorites, Recent Activity, Recent Reviews, Following, Lists, and footer. The layer's export label says “Profile Page ‘Profile’ - Simchuk”, but the visible Follow CTA and profile content confirm the public-profile mapping; the generic export label is not an owner-state signal. The frame identity is now visually confirmed, while matched runtime geometry, all states, and the separate owner frame remain open. Figma structured context is still blocked by the Starter MCP limit. No app/API/data/Figma edits, build, tests, or Docker actions.

### PublicProfile phone hero alignment — matched viewport review — 27.10.2026

Compared Figma phone frame `825:1378` (393×2355) with the live UK/EN public profile at CSS393×852, and UK at320px. Before the adjustment, the hero measured572.2px and Favorites began at y616; the frame places the hero boundary near547px and Favorites near y590. Reduced only the phone hero's bottom padding from35px to10px. Afterward, the hero measures547.2px at393, with title y317 and Favorites y591 in UK and EN. At320px, the hero measures547px, title y317 and Favorites y590.8. No horizontal overflow was observed at either width (the 320px browser reports305px client/scroll width because of its classic scrollbar).

At matched1440px, the runtime has no horizontal overflow. The document is4978px tall while Figma frame `238:596` is4459px; measured lower anchors include Statistics y3144, Social y3646, Collections y3894 and Liked Reviews y4202. The overview frames do not place these sections; `PROJECT_REQUIREMENTS.md` requires preserving them, so this is an open Figma placement/content gap. This checkpoint verifies only the phone top anchors, not all states, interactions, or page content. `npm run verify:build` passed after the CSS change (TypeScript and Vite; exit0). No tests, API/data changes, Docker actions, commits, or push.


### PublicProfile desktop full-page composition cross-check — 27.10.2026

Compared current-Copy frame `238:596` (1440×4459) in the Figma canvas with the live UK `/users/7748` page at the available natural1536×639 viewport. The frame shows hero/navigation, Favorites, Recent Activity, Recent Reviews, Following, Lists and footer. The live page has those supported sections in the same order, then adds Statistics, Social links, My Films and Liked Reviews before its footer; its full document height is4978px. This is an observed composition/data-scope mismatch, not matched-width geometry. `docs/project/PROJECT_REQUIREMENTS.md` requires preserving these sections. Neither reviewed overview frame places them, so their placement remains a Figma content gap; do not remove them to shorten the page. The local development account, test-like film/review content, and avatar fallback differ from Figma's sample identity/artwork. No source, API, or data changes; no tests/build/Docker actions in this visual-only checkpoint. Figma `get_design_context` remains unavailable because the account's Starter MCP call limit is exhausted; the connected Figma canvas is available for manual inspection.


### Own Profile overview frame — required-section placement recheck — 27.10.2026

Reopened current-Copy node `238:865` in the Figma canvas; inspector confirms1440×4459. The selected frame shows the owner overview with Favorites, Recent Activity, Recent Reviews, Following, Lists and footer. It does not show Statistics/rating distribution, Social links, detailed collection tabs or Liked Reviews. This agrees with the PublicProfile overview frame `238:596`. `docs/project/PROJECT_REQUIREMENTS.md` requires these features across profile routes, so the layout omission is a design placement gap; retain the supported sections while searching for dedicated route/variant frames. The owner frame also omits the identity overlay present in sibling variants, which remains a separate cross-variant question. No app/API/data changes, tests or build.

### Owner Profile current-canvas screenshot recheck — 27.10.2026

Fresh Figma screenshot of `238:865` confirms the visible owner “Profile” overview, distinct from public `238:596`; the inspector remains1440×4459. It shows an identity hero, tabs, Favorites, Recent Activity, Reviews, Following, Lists and footer. This reinforces frame identity/composition only; matched1440 runtime anchors, product-required sections without placement, and curated-vs-live data variance remain open. No app/API/data changes or test/build run.


### Admin Movies Delete button styling — 27.10.2026

Manual Chrome review of the disposable Admin Movies edit form exposed a CSS specificity collision: the dashboard's generic `.page button:not([data-retry-button])` rule overrode the module's plain `.deleteAction` styling, rendering Delete as a neutral button. Scoped the selector through the editor/actions hierarchy so the destructive action keeps its red treatment. Rechecked the live UK form without activating Delete: computed background `rgb(101, 48, 52)`, border `rgb(201, 104, 109)`, pill radius, and44px height (button box 122×44); accessible label remains “Видалити”. `npm run verify:build` passed TypeScript and Vite (232 modules). Disposable Admin user id8644 was removed by exact id/email; SQL count verified1 before and0 after. No film was edited or deleted; no automated tests were run.


### PublicProfile guest desktop keyboard path — 27.10.2026

Opened the public UK `/uk/users/7748` route in the local Chrome preview. At the browser's natural1536×639 viewport (document client/scroll width1521/1521; full document height4978), sequential keyboard traversal reached the localized guest Follow CTA (`/uk/login`), profile tabs, activity links, and review links without activating them. Focus outlines were visible; the Follow CTA measured141×59px with a1.6px amber outline when focused. The current-Copy Figma overview `238:596` is1440×4459; this runtime observation is deliberately classified as natural-width keyboard evidence, not matched geometry or full parity. The sample API identity/content are synthetic-looking development records. No data or source changes; no automated tests.


### Journal desktop full-bleed width and empty state — 27.10.2026

Current-Copy canvas frame `604:848` (КК) was selected; inspector confirms1440×3560 and the visible layout has a lead story, four editorial rows, and footer. Local UK `/journal` was reviewed at the natural1536×639 viewport, not a matched width. Before the fix, the desktop `.intro { width:100vw }` measured1536px against `documentElement.clientWidth=1521`, creating15px horizontal overflow. Changed the desktop rule to `width:100%`; after rebuilding, intro measured1520.8px and document client/scroll widths were1521/1521, with no descendant extending beyond the client viewport. The gradient remains full-bleed across the available layout width. After the API settled, the actual empty article feed and empty archive were visible. The local API has no Journal articles; Figma story content/collage remains a documented content-contract gap. `npm run verify:build` passed TypeScript and Vite (232 modules). No data mutation or automated tests.


### Global Search category target size — 27.10.2026

On UK `/search?q=duna`, the natural Chrome viewport was1536×639 (document client/scroll width1521/1521). The zero-result view rendered localized zero counts for Films, Users, Lists, Tags, People, Reviews and Journal; the API-backed result is empty. Inspection showed the desktop category `<select>` was only26px tall; the phone CSS used32px in regular results and16px for the overlaid empty-state control. Increased the category control and its empty-state row to44px while retaining the compact visible prompt; the phone no-match picker now has a44px minimum width so a short label cannot shrink its hit area. After `npm run verify:build` passed (TypeScript and Vite,232 modules), the live natural-width selector measured200×44 and no horizontal overflow remained. An earlier Playwright Tab sequence timed out, but a later direct CUA keyboard traversal reached the desktop select after the header links/account; at natural1536×695 the select remained200×44, `:focus-visible` was true, no horizontal overflow remained, and the gold focus ring was visible. The current Figma mobile no-match frame `1480:8856` is393×852; phone geometry/focus and matched1440 remain open. No API/data mutation or automated tests.


### Global Search category select keyboard focus — 27.10.2026

On the local UK `/search?q=duna` no-match route, used direct browser Tab presses from the page start through Rewind, Films, Lists, Participants, Journal, Account and Global Search to the category selector. The accessibility tree identified “Показати результати” as the focused popup/select. At natural1536×695, DOM geometry measured200×44, `:focus-visible` was true, document client/scroll widths were1521/1521, and the screenshot showed the gold outline. Query remains an empty-result response from the local API. This closes only the desktop natural-width keyboard-focus check; phone matched-width state, matched1440 geometry, and other Search result states remain open. No data change or automated tests.


### Admin Movies Delete focus recovery source fix — 27.10.2026

Source review of `removeMovie` found that a successful DELETE removed the focused action from the page without scheduling focus to a stable destination. It now records the focused origin and target page, waits for the refreshed catalog data, then uses the existing catalog-focus mechanism to move focus to the catalog heading when the origin was removed or focus fell to `body`. When the deleted movie was the only row on a later page, the expected prior page is used. Cancel remains handled by the native confirmation before any mutation. `npm run verify:build` passed TypeScript and Vite (232 modules). The existing Admin browser tab timed out at Chrome focus emulation, so runtime post-delete focus is not yet manually confirmed; no delete request was made, and no data changed. No automated tests.


### Admin Movies Delete focus recovery runtime — 27.10.2026

Using the existing loopback Compose API and a disposable ADMIN fixture (`id=8645`), opened `/uk/admin?view=movies` in the local Vite preview at the natural1536×639 viewport. Created only movie `Manual Delete Focus Fixture 8645` (`id=4164`), expanded that exact row's More actions, and confirmed its Delete prompt. After the API reload, the fixture disappeared, the Admin pagination returned to203 movies, and the accessibility tree named `База фільмів` as the focused heading; the screenshot showed its visible cyan focus ring. The temporary user was logged out and deleted using exact id/username/email/role; database checks returned0 matching users and0 matching fixture movies. Other movie rows were unchanged. This verifies the source fix at natural width; it does not establish matched1440 parity or the rest of the Admin screens. No automated tests or Docker rebuild.


### Current-Copy Admin Activity candidate — 27.10.2026

Read-only Figma Find search for `Users` selected current-Copy frame `1494:8217`, titled `More Users Activity - Sulyma Bohdan`; the inspector reports1440×2720. Its canvas shows the Rewind Admin shell with Users highlighted, an `Activity List` heading, and a table with Name, Email, Followers and Status columns, plus sample actor/profile chrome. The current frontend `AdminUser` type and backend `AdminUserResponse` contain identity, email, role, avatar, active/HQ flags and creation time, but no follower count. This is a separate file-qualified candidate related to preserved-archive `orb73…/1393:3652`. The similar title, dimensions and composition suggest a related/duplicate variant, but do not prove equivalence. The frame content does not establish whether it is an Admin Users variant or an Activity route, and no matching prototype transition was checked. Do not treat its sample follower counts or rows as API requirements, merge it with `1222:3530`, or count it as runtime-verified. Keep its identity/route and parity open in the canonical inventory. No Figma edits, app/API/data changes, build, automated tests, or Docker actions.


### PublicProfile lower-section keyboard focus scroll — 27.10.2026

At natural Chrome viewport1536×695 on UK and EN `/users/7748`, the populated local profile has no horizontal overflow (`clientWidth/scrollWidth=1521/1521`). Before the fix, sequential keyboard navigation could focus the last liked-review link at viewport y25 while the fixed header covered y0–106; the gold focus outline and text were hidden beneath it at the document's maximum scroll. Added `scroll-margin-block:122px` to keyboard-focused links and controls inside PublicProfile sections, matching the existing section-heading offset and applying across breakpoints. After rebuilding and reloading, UK and EN keyboard traversal to “Concurrent like review” moved the document to `scrollY≈3998`; the link and gold outline are visible at y311–329, below the header. This is a natural-width keyboard/focus recovery check only, not matched1440 geometry or Figma placement. The local API supplies test-like review data. Figma Find exact text searches for `Liked Reviews`, `Statistics`, `My films` and `Social links` returned no matches; that does not rule out unlabeled/image-only variants, so extra-section placement remains open. No links were activated and no data changed. The final `npm run verify:build` passed TypeScript and Vite (232 modules); no automated tests or Docker actions.


### Continuation — Profile source alignment, Figma quota and build — 27.10.2026

Read-only review of owner phone frame `896:1838` (393×2319) and `Profile.tsx`/`Profile.module.css` confirms the implemented overview order: Favorite Films → Recent Activity → Recent Reviews → Following → Lists → six collection/network links, with API-backed loading, empty, error/retry and pagination behavior. No supported visual mismatch was established, so no UI/source edit was made. A fresh Figma session succeeded, but `get_design_context` again returned the Starter call-limit response; the connected Chrome Admin tab also timed out before exposing page state. No Admin/profile data or browser state was changed. `npm run verify:build` passed TypeScript and Vite (232 modules). Automated tests and Docker were not run; visual work remains open, including owner extra-section placement, Admin matched geometry/remaining keyboard states, and other routes in `PLAN.md`.


### Admin Movies delete error focus — 27.10.2026

Source review found that a failed delete displayed the alert above the catalog while focus stayed on the action-menu button; the alert could remain outside the viewport. `AdminMovies.tsx` now schedules focus to the rendered `role="alert"` paragraph on the next animation frame, guarded by the existing component/action scope so stale requests cannot steal focus after navigation. The existing `.error:focus` rule supplies a visible cyan outline and scroll margin. `npm run verify:build` passed TypeScript and Vite (232 modules). Runtime failure-state confirmation remains open because the connected Admin Chrome tab timed out; no delete was attempted and no data changed. No automated tests or Docker actions were run.


### Own Profile phone variants — canvas-to-source review — 27.10.2026

The connected Figma canvas loaded in Chrome after opening the file in a fresh tab. Visually inspected current-Copy own-profile variants: Watchlist `1015:3356` (393×1564), Likes `1015:4508` (393×1666), Lists `1017:1841` (393×1666), and Profile/Reviews `1023:1867` (393×1434; the Profile tab is selected above the review cards). Their visible shells and content families map to the existing `/profile?view=collection&collection=watchlist|favorites`, `/profile?view=lists`, and `/profile?view=reviews` implementations. Source inspection confirms a four-column phone collection grid, API-backed list cards, and the full review-card view. This is canvas-to-source mapping only: no matched-width authenticated runtime comparison, no assertion of sample data parity, and no change to the Figma file or application source. The Watchlist frame shows no visible items, while the live page must retain its localized empty/loading/error states. Related profile geometry and state permutations remain open.


### Own Profile Films phone frame conflict recheck — 27.10.2026

Reopened the exact current-Copy node `1015:2131` in the Figma canvas. Its selected frame is 393×1162 and visibly contains only the Film toolbar and fixed bottom navigation, with a blank content area; there is no poster grid or star row in this selected canvas state. This conflicts with the earlier 26.10 checkpoint, which records a poster anchor at x16/y123/79×116 for the same node. The star rows visible in the latest wide canvas screenshot were on the neighboring owner Profile overview, so that screenshot does not resolve the prior poster-anchor evidence. `Profile.tsx` renders a localized `noCollectionFilms` message when the watched API collection is empty. The two observations do not establish whether the frame changed, represents an alternate state, or the earlier poster anchor was assigned to a different canvas selection. Preserve the localized API empty message and keep the frame/state mapping open until reconciled. No source/API/data changes, builds, tests, or Docker actions were made in this recheck.

### UserLists Add a film control and existing API review — 27.10.2026

Rechecked the local `UserLists.tsx`, `lists.api.ts`, and `search.api.ts` against the documented Figma phone affordance. The API already exposes movie search and adding a movie to an existing list; the current editor offers Browse films through `/films`, where the movie-detail flow can add to a list. The Figma Add a film field has no configured Prototype action, so the intended inline search/selection flow is not defined. Kept this as an interaction-spec gap, separate from the unsupported persisted Ranked flag, and did not add a speculative UI flow or create list data. Read-only source review; no build or tests.


### Guest Home UK/EN natural-width runtime recheck — 27.10.2026

Reopened the current-Copy guest Home frame `1413:6471`; the Figma inspector confirms 1440×4934. A fresh local Chrome tab loaded `/uk/home` and `/en/home` at the browser's natural desktop viewport (no viewport override). The accessibility trees in both locales show the same major order: hero/registration CTA, New on Rewind, guest recent-review rail, explanatory CTA, Popular Reviews, Popular Lists, Popular Reviewers, Recent News, footer. After the initial image-only viewport, PageDown revealed the complete English hero headline, Get Started CTA and first API-backed poster row; this captures the below-fold hero composition as well. Local API content is current development data with synthetic-looking review/list rows, and the Journal response is genuinely empty; neither was treated as Figma sample parity. The Figma canvas confirms the long-page section families. This is a cross-locale natural-width route/state check only, not matched-1440 or phone geometry, full frame parity, keyboard, or recovery evidence. No source/API/data changes, build, tests, or Docker actions.


### Film Data UK/EN content and links keyboard check — 27.10.2026

At Chrome's natural desktop viewport (no viewport override), UK and EN `/film-data` showed localized hero title/lead and the same two supported content sections: TMDB attribution/correction guidance and duplicate-reporting guidance. Tab traversal showed the cyan focus outline on the external TMDB link and the local Contacts page link in both locales; neither link was activated. The EN footer was visually reviewed and showed the existing About/News/Help/Terms/Contacts, social and service links. UK footer structure was present in the accessibility tree but was not visually captured. This is natural-width content, link and keyboard evidence only; matched Figma geometry and Privacy checks remain open. No source/API/data changes, build, tests, or Docker actions.


### Privacy UK/EN content, footer and keyboard focus — 27.10.2026

At Chrome's natural desktop viewport (no viewport override), `/en/privacy` and `/uk/privacy` exposed the complete localized policy sections and both supported profile-update/account-deletion links in the accessibility tree. Tab traversal visibly focused each in-content link in both locales without activating it. End-of-page screenshots reviewed the localized footer navigation, social links, source/credits and service links in both locales. The Figma-mapped Privacy body/footer content and route-specific links are covered at natural width; matched frame geometry and phone behavior remain open. No source/API/data changes, build, tests, or Docker actions.

### Admin Edit Film second current-Copy candidate — 27.10.2026

Figma canvas Find for `Edit Film` returned a second frame node `1494:6790`, named “Edit Film - Sulyma Bohdan” under Group 415. Its inspector confirms1440×3128 and position X−50710/Y14882; the canvas shows a “Lola James” hero, populated film editor card, and footer. At100%, the editor displays Published/Change Status, English, Change Poster, Change Year, Change Genre and Change Description for Marty Supreme (2025). The already tracked `1260:4840` is another same-name/same-size node at X6790/Y−20221 whose visible sample was Top Gun with Published status,900 reviews and rating3.0. They are distinct content examples. Its Prototype panel shows only general scroll behavior and no visible outgoing interaction, so route/state and change-action semantics remain unconfirmed. Keep `1494:6790` open; do not add coverage credit or treat these visible controls as supported Admin Movies features. Figma MCP structured reads remain Starter-limited; manual canvas only. No Figma edits, app/data changes, build, or tests.

### PublicProfile lower composition cross-check — 27.10.2026

Reopened current-Copy PublicProfile `238:596`; the inspector confirms1440×4459. At50% the lower frame shows Recent Reviews, Following, Lists, then the shared footer. The local UK `/users/7748` route at natural1519×688 exposes API-backed Favorites, Activity, Reviews, Following, Lists, Statistics/rating distribution, Social links, My Films and Liked Reviews in its accessibility tree; the latter four are present after Lists and before footer in runtime. This confirms the known Figma placement/content gap and supports preserving the required live sections. The two views use different sample identities/content and were not compared at matched width; no pixel parity is claimed. `npm run verify:build` passed TypeScript and Vite (232 modules). No source/API/data changes, automated tests or Docker actions.


### PublicProfile extra-section all-pages search — 27.10.2026

In the live Current-Copy Figma file, Find was explicitly switched from “This page” to “All pages.” Exact searches for `Statistics`, `Liked Reviews`, `Social links` and `My Films` each returned “No results in this file.” This supports that no text-named standalone frame for those live PublicProfile sections is available in the current file. Search cannot rule out unlabeled/image-only frames; the placement gap remains open and the supported sections stay in the application. Read-only canvas search; no Figma, source, API or data edits.


### Admin Lists read-only runtime recheck and fixture cleanup — 27.10.2026

Opened the UK Admin Lists view under disposable ADMIN `8647` at the local natural browser width. The API-backed view rendered the existing list collection and pagination (1,430 rows across 29 pages); the visible row actions were Publish/Hide and Delete. No row action was activated and no list data was changed. This is a runtime/content check only: no matched-width geometry, keyboard path, or full-frame parity was established. Current-Copy canvas evidence for `1344:5249` remains the “All Lists” workspace with a “View Reported Lists” CTA and Year/Likes metadata; report review and list editing remain unsupported by the current Admin list API and were not added to runtime. The `View Reported Lists` text node `1344:5372` has no direct Prototype interaction; parent/other outgoing connections remain unresolved.

Signed out through the account menu, then removed only the temporary ADMIN row after matching exact `id=8647`, username, email and role. SQL reported deleted `1`, remaining `0`. No list content rows were changed. No source/API changes, build, tests or Docker actions.


### Admin Movies delete from editor closes stale create form — 27.10.2026

Source review found that confirmed deletion from the editor reset `editingMovieId` but left the native `<details>` panel open, so the UI changed into an empty Add Movie form after deleting the current movie. The successful-delete path now also closes the editor and clears its editing trigger, matching Cancel/Save behavior; existing catalog heading focus recovery still applies after reload. `npm run verify:build` passed TypeScript and Vite (232 modules). Manual runtime confirmation is still open: the local Chrome snapshot timed out. No automated tests, API/data changes, or Docker actions.


### Own Profile Films phone exact-node canvas reconciliation — 27.10.2026

Reopened current-Copy node `1015:2131` directly by its node URL. The Figma inspector identifies a393×1162 frame titled “Profile Page ‘Profile’ phone”; the selected outline encloses only the Film toolbar and fixed bottom navigation, with a blank content area. The populated posters visible to its right are in the neighboring owner Profile overview frame and outside the selected outline. This resolves the earlier contradiction enough to withdraw the 26.10 claim that the poster x16/y123/79×116 belongs to `1015:2131`; that claim is treated as a likely canvas-selection attribution error. The separate public Watchlist frame `861:1474` has its own verified poster slot and is not this owner Film frame. Keep the app’s localized API empty-state copy for accessibility and do not add poster fixtures. The owner Films visual/empty-state parity and own Profile matched-width runtime review remain open. No Figma edits, source/API/data changes, build or tests.


### Admin Movies editor Delete runtime attempt and exact cleanup — 27.10.2026

Created local disposable ADMIN8648 and movie4165 through the development registration/Admin UI flows. Confirmed the editor showed the new record and a Delete button. Activating Delete opened the native browser `confirm`; CDP timed out before an accepted/cancelled outcome could be observed, so the successful-delete close behavior remains unverified and no UI-delete success is claimed. SQL confirmed movie4165 still existed and had zero review/rating/list/credit/activity references. Removed exactly the disposable movie by `id=4165 AND title='Fixture admin editor deletion 20261027-1328'` and exactly the temporary ADMIN by `id=8648`, username, email and role. Transaction reported one movie and one user deleted; both exact remaining counts are zero. The browser prompt on the original tab may still need dismissal; a separate clean Rewind tab works. No existing user or movie records were modified. No automated tests or Docker rebuild.

### Journal controls target size and keyboard focus — 27.10.2026

Raised the Journal category select, Clear Archive action, Read link, pagination, archive and inline error buttons to a minimum 44px height. The global `:focus-visible` rule supplies the 3px cyan outline. `npm run verify:build` passed TypeScript and Vite (232 modules). A fresh UK `/uk/journal` Chrome view at its natural ~1519×639 viewport showed the API-backed empty feed/archive; keyboard Tab reached the category select with a visible focus ring. This is not matched-width geometry and does not verify populated content, other breakpoints or all error/retry states. No TSX/API changes or automated tests.


### Admin Reviews filter target size — 27.10.2026

Raised the Admin Reviews visibility filter from a 41px to 44px minimum height across breakpoints; row actions already have a 44px minimum. `npm run verify:build` passed TypeScript and Vite (232 modules). A fresh unauthenticated Admin route redirected to Home, so no administrator runtime claim is made and no data was changed. The populated Admin Reviews layout, other widths and keyboard behavior remain open.

### Community showcase action target size — 27.10.2026

Source review found the Community showcase action in `UserFollowRow` was34×34px at desktop sizes, while its phone override was already44×44px. Increased the desktop target to44×44px; the icon and follow action/API are unchanged. `npm run verify:build` passed TypeScript and Vite (232 modules). A fresh UK PublicProfile loaded real API data at the natural browser viewport, but it did not render a Community showcase card, so no runtime dimension/focus or Figma parity is claimed. The matching Figma page remained on Loading during this check. No data changes or automated tests.

### Films catalog filter target sizes — 27.10.2026

Raised the All Films catalog filter inputs/selects and Apply button from32px to44px minimum height in the `min-width:1400px` rule. `npm run verify:build` passed TypeScript and Vite (232 modules). A fresh UK `/films?sort=rating_desc` natural-width Chrome page loaded the catalog and showed the filter row; because no viewport override or computed-style inspection was used, this does not prove that the1400px media query was active in the browser. Figma canvas was still Loading. No API/data changes or automated tests; exact matched-width layout remains open.

### Global Search phone control target sizes — 27.10.2026

Raised the mobile search input, its 44px-wide submit button, and the no-match Home CTA from32px to44px high. The category select, mobile filter trigger and shortcuts already meet or exceed44px. `npm run verify:build` passed TypeScript and Vite (232 modules). No matched-width mobile runtime check was performed in this pass, and Figma remained Loading; the phone composition and content fit after this change remain open. No API/data changes or automated tests.

### User Lists mobile control target sizes — 27.10.2026

Raised User Lists form/action, picker, pagination and item remove/reorder controls to44px minimums. Mobile item action column was widened from78px to94px so the two44px controls plus6px gap fit without overlap; title remains a wrapping grid column. The mobile list editor inputs/textarea now reserve44px minimum height. `npm run verify:build` passed TypeScript and Vite (232 modules). No authenticated matched-width runtime review was made, so narrow-screen fit and Figma parity remain open. Existing list API and reorder/remove behavior are unchanged; no list data was modified and no automated tests were run.

### Public Lists phone control target sizes — 27.10.2026

Raised Public Lists hero actions, tag-search CTA, and Back/Filter links to44px at the base and phone breakpoints, including the narrow `max-width:380px` overrides that previously reduced icon controls to34px and tag search to38px. `npm run verify:build` passed TypeScript and Vite (232 modules). No phone-width runtime or matched Figma comparison was made in this pass; composition/overflow remains open. Destinations and API behavior are unchanged; no data edits or automated tests.

### Movie Details Comments target sizes and empty-state keyboard focus — 27.10.2026

Raised Comments expand/edit/delete/form buttons and pagination to44px minimum height. In a fresh UK `/films/3939` natural-width Chrome view, expanded the real API-backed empty-comments state without submitting or mutating data; keyboard Tab reached “Hide comments” and the cyan focus outline was visible. Build passed TypeScript and Vite (232 modules). No authenticated edit/delete controls or populated comments were present; no matched Figma geometry or phone-width check is claimed. No API changes or automated tests.

### Review Details mobile action target sizes — 27.10.2026

Raised the phone Back link from35×35px to44×44px, rating trigger from36px to44px, trailer link at≤380px from30px to44px, and the compact like control from42px to44px. `npm run verify:build` passed TypeScript and Vite (232 modules). A natural-width UK Review Details route rendered API review data, but it does not exercise the phone media queries; Figma canvas remained Loading. Treat the CSS change as source-only for those dimensions; phone fit and matched-frame parity remain open. No API/data changes or tests.

### PublicProfile navigation and list-tag target sizes — 27.10.2026

Raised profile-rail links to44px in phone/tablet variants (the existing wide desktop rail stays79px) and public-list tag links from36px/32px to44px, including the narrow-phone override. `npm run verify:build` passed TypeScript and Vite (232 modules). A fresh UK `/users/7748` view loaded live profile data and its keyboard path reached the profile rail; the natural viewport did not exercise the compact sizing, and the focused-link outline was not independently confirmed in the screenshot. No matched-width or Figma comparison was made; the optional local snapshot index is absent. Favorite/list empties are real API states. No navigation/API/data changes or automated tests.


### Admin Dashboard settings target sizes — 27.10.2026

Raised shared Admin Dashboard action buttons and settings inputs from40/41px to44px minimum height, including the phone override. `npm run verify:build` passed TypeScript and Vite (232 modules). Runtime visual/keyboard verification is still open because the current browser session has no Admin authorization; no API or data changed and no automated tests were run.


### Admin control target sizes (27.10.2026)

Dashboard buttons/inputs, shared Admin filters and controls, detail links, user row actions, and notification controls now have44px minimum heights in source. Build passed; proceed with the next visual gap. Authenticated Admin runtime, keyboard behavior, and matched Figma geometry are still open.


### Home section link target size — 27.10.2026

The guest UK Home at natural Chrome viewport1536×639 exposed five “Більше” section links at53×23px. They now render61×44px; the fixed member desktop section-heading heights were changed to allow the44px action without clipping. A read-only browser measurement confirmed all five links at44px and `documentElement.scrollWidth === clientWidth === 1521` (viewport1536px including scrollbar). `npm run verify:build` passed TypeScript and Vite (232 modules). This is a runtime accessibility check, not matched1440/mobile Figma parity; EN and member variants remain open. No API/data changes or automated tests.


### PublicProfile target sizes — 27.10.2026

На природному UK `/users/7748`, viewport1536×639, виміряно tabs колекцій по44px, links у заголовках Following/Lists по44px та лічильники Following/Followers по44×44px. До зміни tabs були43px, заголовки26px, лічильники20×44px. Після CSS-зміни `npm run verify:build` пройшов; document width1521 дорівнює client width1521. Це runtime/accessibility evidence без matched Figma viewport; keyboard focus, phone та EN залишаються відкритими. API/data не змінювались, automated tests не запускалися.


### Guest Home EN section action sizing — 27.10.2026

On `/en/home` at natural Chrome1536×639, the fully loaded page retained five localized “More” section links, each measured44×44px after the shared target-size fix. `documentElement.scrollWidth` equals `clientWidth` at1521px; the development API content loaded, including populated review/list cards and empty Journal. This confirms EN desktop target sizing and that translation length does not overflow at this viewport. Matched Figma geometry, keyboard/focus, mobile/member states remain open; no data changed and no automated tests ran.


### Admin Dashboard natural-width comparison and keyboard focus — 27.10.2026

Opened Figma Current-Copy frame `1178:2466`; inspector confirms1440×2669. A local disposable ADMIN (`id=8650`, exact generated username/email) opened UK `/admin?view=dashboard` at natural Chrome1536×639. Runtime hero measured1521×1020, six API-backed summary cards rendered as three columns/two rows, and the workspace rail was1200px wide centered at x160 (expected x120 at a1440-wide layout, not manually viewport-tested). All six values came from the existing Admin dashboard API; observed user/active counts include the one temporary ADMIN account and are not a clean post-cleanup baseline. Figma's example metrics include watched films, average rating, lists, review likes and engagement values absent from the API; keep the agreed data gap, do not substitute fake numbers. The Figma frame and runtime share centered identity/hero plus icon navigation; runtime fallback initial differs from Figma sample portrait as API data variance. Keyboard Tab reached the Dashboard nav link with a visible gold focus outline (computed2.4px including offset), and the icon/text rail targets are at least48×76px. Natural runtime document/client width both1521; matched1440/phone geometry and EN remain open. Signed out and exact-deleted only ADMIN8650; SQL remaining count0. No existing records changed and no automated tests ran.


### Cross-route interactive target audit — 27.10.2026

Source audit found undersized controls in Movie Details (actions/selects 32–40px), Profile (menu, form, navigation, tabs and pagination 38–42px), Movie Action Sheet (buttons/selects 42px), Person filters (phone select28px), Header search (40px), and User Lists desktop item actions with no minimum height. Raised these targets to44px; movie toolbar buttons are44×44, and mobile Movie Details links, Profile compact controls and Person selects retain the same minimum. `npm run verify:build` passed TypeScript and Vite (232 modules). No API/data changes or automated tests.

Fresh local Chrome tab opened UK Movie Details `/uk/films/5` at natural1536×639 and rendered API-backed title, cast, reviews, pagination and similar films. Keyboard navigation showed a visible focus outline first on Account then on Global Search. Person `/uk/people/actor/162` then rendered its API-backed Jason Momoa filmography; the Sort dropdown received visible keyboard focus and remained at its default option. This is a natural-width keyboard smoke only, not matched Figma geometry, computed target measurement, phone behavior or full interaction coverage. No records changed.


### PublicProfile overview sections versus Figma frame — 27.10.2026

Current-Copy canvas node `238:596` is1440×4459. Its visible overview contains identity, collections/overview cards and Lists before the service footer; it provides no separate placement for the supported Statistics, Social links, My Films or Liked Reviews sections. The natural1536×639 unauthenticated UK runtime `/uk/users/7748` exposes those four sections after Lists, using the existing profile, stats, collection and liked-review APIs. The accessibility tree confirms the order; the visible scrolled runtime shows Statistics/rating distribution and Social links, and the lower viewport shows My Films and Liked Reviews. Preserve these required sections; classify their missing Figma layout/content as an open design gap. Sample/user content differs because runtime uses live API data. No code/API/data changes or automated tests.


### Own Profile overview and settings runtime — 27.10.2026

Figma Current-Copy own Profile node `238:865` inspector reports1440×4459 and its frame screenshot shows populated sample account content. A fresh local USER fixture (`id=8651`, generated `visualprofile…@example.invalid`) opened UK `/profile` at natural Chrome1536×639. The runtime shows API-backed empty Favorites/activity/reviews/following states, an empty Watched system list and zeroed statistics; no Figma sample content was seeded. This is not matched1440 geometry or a populated-data parity check.

On that fixture, opened Profile, Authentication, Avatar URL and Social Links settings in UK; EN Social Links showed localized Website/Instagram/TikTok/Letterboxd labels. No field was edited and no form submitted. The Profile actions menu focused its first item; Escape closed it and restored focus to the menu trigger. Opening Account Settings navigated to `?settings=profile` and moved focus to the settings page heading. The accessibility tree confirms these focus destinations; a screenshot of the visible focus ring and form validation/save/error states remain open.

Signed out, then deleted only user8651 with exact ID, username, email and role predicates. SQL confirmed one user row deleted, zero exact user rows after cleanup, and zero rows referencing8651 across all29 user foreign-key columns. No existing account or related data was changed. No automated tests or Docker rebuild.


### Movie Details, Profile and Movie Action Sheet target sizes — 27.10.2026

Earlier source-only target-size review also covered these three routes; the CSS changes are now included in the cross-route audit above. The original Rewind tab did not respond to CDP, so this source-only checkpoint did not establish route-specific runtime geometry. The separate fresh-tab Movie Details focus observation is documented above.

Source audit found remaining undersized controls: guest Home phone CTA32px, Public List phone hero actions40px, RatingSheet stars40px and like control38px, Review Details liker avatar links42px desktop/40px phone, and Films Discovery reviewer avatar links35px. These are now at least44px; the Discovery mobile review grid's first column also grew to44px to contain its avatar link. `npm run verify:build` passed TypeScript and Vite (232 modules). Phone-specific dimensions are source-verified only because this browser session did not use a viewport override; mobile composition, keyboard focus and matched-frame parity remain open. No API/data or automated tests changed.


### Admin Movies Avatar populated-record check and fixture cleanup — 27.10.2026

Opened `/uk/admin?view=movies` as a disposable ADMIN and used the ordinary catalog pagination to reach page26/34 (203 API records). Opened Avatar: The Way of Water (`movieId=50`) without submitting the form. The editor rendered the stored title, 192-minute runtime, release date, IMDb ID, poster/backdrop URLs, genres, James Cameron credit, eight cast credits and plot through existing API fields. The heading was visible below the sticky header after the title input received focus; the apparent crop came from the current scroll position, so no CSS change was warranted. Cancel closed the editor with no mutation.

Figma Current-Copy node `1260:4840` inspector confirms “Edit Film - Sulyma Bohdan”, 1440×3128. The canvas stayed at the neighboring editorial-card content even after Zoom to selection; this turn therefore confirms the selected frame metadata only and does not claim a visual form comparison or matched-width parity. API write-field limitations remain as recorded in the existing Admin Edit Film gap.

Signed out and deleted only ADMIN id8652 with exact id, username, email and role predicates. SQL confirmed one row deleted, zero matching user rows remaining and zero references across user foreign-key columns. No existing data changed. No build, automated tests or Docker rebuild this turn.


### Login password focus and Forgot Password spacing — 27.10.2026

At `/uk/login` in the natural Chrome viewport1536×639, keyboard navigation reached the email and password inputs and the password focus ring was visible. The Forgot Password link sat against/inside that ring because a desktop `margin-top:-17px` overrode the form's14px grid gap. Changed the desktop row margin to0 so the form gap separates the link from the focused input; retained the existing mobile `-17px` override. A second manual screenshot shows clear separation while the password field is focused. `npm run verify:build` passed TypeScript and Vite (232 modules). No form was submitted and no API/data changed. Exact Auth frame comparison is still open: direct Figma node navigation stayed on Loading, so no visual parity claim. No automated tests.


### Forgot Password UK/EN desktop keyboard review — 27.10.2026

Local `/uk/forgot-password` and `/en/forgot-password` were opened at the natural Chrome viewport1536×639. Both show the localized title, email-only explanation, email field, recovery button, divider and Create account link. Clicking the required submit control with an empty field invoked native email validation and kept focus on the email input; no request was sent. Tab from the email field reached the localized recovery button and showed its cyan focus outline in both languages. No email was entered and the form was not submitted. This is a natural-width structure/keyboard check, not matched Figma geometry; the known phone-recovery copy/API gap remains. No source/API/data changes or build/tests this pass.


### Admin Users UK/EN read-only keyboard review — 27.10.2026

Opened `/uk/admin?view=users` as disposable ADMIN8653. The live table returned448 users across9 pages, with supported Name/Email/Role/Status/Actions columns. At natural1536×639, Tab focus was visibly outlined on Search input, Search button, the row role selector, View profile, Grant HQ and Block. None of these actions was activated. The first disposable row's generated name/email wrap across lines; this is fixture-length variance, not evidence of a production-row layout regression. `/en/admin?view=users` rendered localized table headings, roles, statuses, actions and page controls over the same API rows. This is natural-width UI/accessibility evidence, not a matched1440 or phone comparison; no real-user role/status changed.

Logged out and exact-deleted only id8653 (`auditusersecfba64a0737`, `auditusersecfba64a0737@example.invalid`, role ADMIN). SQL confirmed deleted1, remaining exact users0 and references0 across user foreign-key columns. No build or automated tests; no source/API changes.


### Journal EN empty state and keyboard focus — 27.10.2026

Opened `/en/journal` in a fresh local Chrome tab at its natural 1519×688 viewport. The API-backed feed and archive both returned their localized empty states; the category control listed the supported sections. Keyboard navigation reached the native Section select, and a screenshot showed a visible cyan focus outline. No category was changed, no newsletter action was triggered, and no source/API/data changes were made. This adds EN empty-state/focus evidence only; populated article parity, phone layout and remaining Journal frame variants stay open. No build or automated tests were run.

### Profile Settings EN Display name focus and fixture cleanup — 27.10.2026

Created disposable USER8656 through the local EN registration flow, signed in, and opened `/en/profile?settings=profile` at Chrome's natural1519×688 viewport. After keyboard traversal, `#profile-display-name` was the active element; the input showed a visible gold focus outline, and the current fixture value remained unchanged. Save was not activated. Signed out through the account menu. Before cleanup, the account had only its three default lists and one refresh-session row among user-linked records; all other checked user foreign-key references were0. Deleted exactly `id=8656 AND username='rewind-profile-en-20261027' AND email='rewind-profile-en-20261027@example.invalid' AND role='USER'` (one row), then verified the user and every listed user-FK reference were0. The three default lists and refresh session cascaded with the fixture. No existing account or profile data changed. No source/API change, build, or automated test.

### Profile Settings EN Display name save and persistence — 27.10.2026

Using disposable USER8657 at natural Chrome1519×688, changed the test profile's Display name to `Profile Save Check` and activated Save. The UI entered its Saving state, then displayed the localized success status “Name updated.” A page reload retained the new value in the Profile details form. Signed out through the account menu. Before cleanup, the fixture had only its three default lists and one refresh-session row among user-linked records; other checked user foreign-key references were0. Deleted exactly `id=8657 AND username='rewind-profile-save-20261027' AND email='rewind-profile-save-20261027@example.invalid' AND role='USER'` (one row). Verified the user and every listed user-FK reference were0 afterward; default lists and refresh session cascaded with the fixture. No existing account or profile data changed. No source/API change, build, or automated test.

### Profile Settings EN empty Display name fallback — 27.10.2026

Created disposable USER8658 via EN registration and opened `/en/profile?settings=profile` at Chrome's natural1519×688 viewport. Cleared `#profile-display-name`; DOM validity showed the field is not required. Save was accepted, the UI showed `Name updated.`, and the value returned to `rewind-profile-invalid-20261027`, confirming username fallback rather than an empty persisted name. Signed out; exact SQL deleted `id=8658 AND username='rewind-profile-invalid-20261027' AND email='rewind-profile-invalid-20261027@example.invalid' AND role='USER'` (one row), and a follow-up exact identity query returned0. No existing account was changed. No source/API changes, build, or automated tests.


### Profile Settings EN minimum-length keyboard validation — 27.10.2026

Created disposable USER8659 through EN registration and opened `/en/profile?settings=profile` at Chrome's natural1519×688 viewport. Entered one character (`A`) sequentially into `#profile-display-name`; native validity reported `tooShort=true` for minlength2. Activating Save kept focus in the input and exposed Chrome's minimum-length validation message; no request was submitted. A programmatic `fill()` did not reproduce the native validation, so sequential keyboard entry is the accepted evidence. Signed out and exact-deleted `id=8659 AND username='rewind-profile-short-20261027' AND email='rewind-profile-short-20261027@example.invalid' AND role='USER'` (one row); follow-up exact identity query returned0; all29 user-FK references to id8659 also returned0. No existing account changed. No source/API changes, build, or automated tests.


### Auth Reset Password missing-token state UK/EN — 27.10.2026

Opened `/uk/reset-password` and `/en/reset-password` without a query token in Chrome at its natural1519×688 viewport. Both routes expose localized missing-token messages and a return link to the corresponding Login route; the first Tab showed a visible focus outline on the REWIND logo. A subsequent attempt to advance keyboard focus timed out in the browser tool; it was not repeated. Return-link focus remains unverified. No reset request was sent; no source/API/account changes, build or tests.

The EN route with a synthetic `?token=invalid-visual-audit-token` displayed New Password, Confirm Password and Change Password controls. This only confirms the token-present form state; the token was not established as valid or invalid, and no successful password reset was observed. Follow-up interaction inspection timed out, so mismatch/server-error feedback and keyboard focus remain open. No product code was changed.

In a fresh tab, activated Change Password with both fields empty on synthetic-token Reset routes. UK and EN both stayed on the form, exposed the browser's required-field message, and focused the New Password input in the accessibility tree; native validation stopped submission before the reset API. This verifies only the empty required state. It does not establish token validity or a successful reset. No password/account/source/API data changed.

### Profile Settings EN maximum Display name boundary — 27.10.2026

Created disposable USER8660 through EN registration, signed in, and opened `/en/profile?settings=profile` at Chrome's natural1519×688 viewport. Saved `Alexandria Alexanderson, Film Critic and Cinema Storytellers`; the form showed “Name updated.” The attempted 61st sequential character was rejected by the input limit; after save, SQL confirmed `CHAR_LENGTH(display_name)=60` and the exact 60-character value. On `/en/profile`, the accessible heading exposed the full name, and the screenshot showed a centered two-line wrap with no visible clipping. Exact-delete matched `id=8660`, username, email and role; remaining identity matches0 and all29 user-FK references returned0. This does not verify matched Figma geometry, phone wrapping or server-error feedback. No source/API changes, build or automated tests.

### Global Search EN no-match and populated Films category — 27.10.2026

Opened `/en/search?q=duna` in Chrome at its natural1519×688 viewport. The API returned zero counts across All, Films, Users, Lists, Tags, Cast & Crew, Reviews and Journal; the localized no-match message and Back to home link rendered. `/en/search?tab=films&q=avatar` then selected `Films (2)` in the URL and category control and rendered API-backed cards for Avatar: Fire and Ash and Avatar: The Way of Water. No result or filter action changed data. Natural-width state evidence only; matched1440, phone focus and the remaining result categories/error/retry variants remain open. No source/API/data changes, build or automated tests.


### Movie Details EN populated guest state — 27.10.2026

Opened `/en/films/50` from the visible Avatar: The Way of Water Search poster in Chrome at its natural1519×688 viewport. The API-backed page exposed poster/hero, title, year, 192-minute runtime, genres, plot, James Cameron, five cast entries, the localized no-trailer copy, Ratings & Reviews, Cast & Crew, the genuine empty Reviews state and six similar-film links. The first viewport screenshot shows the full-width hero; the accessibility tree confirms the downstream section order. This is populated guest data and route-composition evidence only, not matched1440 geometry, authenticated actions or populated reviews. No rating/list/review action was activated; no source/API/data changes, build or tests.


### Community UK populated directory and empty Featured state — 27.10.2026

Opened `/uk/community` and `/en/community` at Chrome's natural1536×695 viewport. Both locales showed the API-backed empty Featured state, five Popular reviewer rows, real searchable directory rows and pagination at page1 of38, with localized labels. A scrolled screenshot confirmed the UK directory layout and search controls. Document scroll width was1521px against a1536px viewport in both locales (no horizontal overflow). This is a natural desktop runtime/state check only; no matched1440 or phone comparison, keyboard path, loading/error/retry states, or populated Featured feed is claimed. No control changed data; no source/API changes, build or automated tests.


### Journal Article missing-slug error and Retry focus UK/EN — 27.10.2026

Opened a deliberately nonexistent, non-sensitive slug at `/uk/journal/rewind-preview-missing-20261027` and its EN route at Chrome's natural1536×695 viewport. Both localized article error views exposed Retry and a link back to Journal. After activating Retry, the failed fetch remained visible and keyboard focus moved to the Journal state heading in both locales. The local feed itself currently returns zero published articles, so no production article content was substituted. This verifies only the missing-slug error/retry-focus route behavior, not populated article parity or network-recovery success. No account/data/source/API changes, build or automated tests.


### Login UK keyboard focus and phone-frame contract gaps — 27.10.2026

Opened `/uk/login` at Chrome's natural1536×639 viewport. The localized email/password fields, password-visibility checkbox, Forgot Password, Log in and Register controls were present. Clicking Email and pressing Tab focused Password with a visible cyan outline; document width1521px stayed within the1536px viewport. No credentials were entered. The current Figma canvas showed phone Login `944:1582` at393×852, including Remember me and Google sign-in; these remain documented unsupported persistence/OAuth gaps because the existing auth contract has no matching behavior. This is a keyboard/state check, not a matched-width comparison. No source/API/account/data changes, build or tests.


### Admin UK views and disposable fixture cleanup — 27.10.2026

Created disposable USER `adminvisual3077475414`, promoted only that exact row (`id=8661`) to ADMIN in the local dev DB, signed in through the normal UK UI, and reviewed Admin Movies, Users, Reviews, Comments, Lists, Moderation, Conversations, Notifications, Journal Editor, Logs and Settings without activating data-changing controls. At natural1536×639, Movies rendered6 API cards with 203 total across34 pages; Users rendered the searchable role/status/action table with448 users across9 pages. The other populated moderation/social feeds rendered their current API rows; Journal Editor and Logs showed empty states; Settings exposed the four supported controls. Several current DB records have E2E/Concurrent sample labels; they were not modified. Movies document width1521px stayed within the1536px viewport; this is natural-width route/state evidence only, not matched Figma geometry or a keyboard audit. Logged out, then deleted only `id=8661 AND username='adminvisual3077475414' AND email='adminvisual3077475414@example.invalid' AND role='ADMIN'`. Follow-up exact identity count and aggregate user-FK reference count were both0. No existing account role, movie, review, comment, list, setting or notification was changed. No tests/build/source/API changes.


### Auth native validation focus below sticky header — 27.10.2026

Empty required submission was manually checked on Login, Register, Forgot Password and Reset Password in UK/EN at Chrome's natural1536×695. Before the fix, Chrome scrolled Login Email partly beneath the sticky header. A shared `onInvalidCapture` handler now schedules one viewport adjustment for the first invalid field in each form; the focused controls were Email/Username/New Password as expected and sat around y122–227, fully below the header ending at y106. Native validation bubbles and focus remain; empty submissions sent no requests. `npm run verify:build` passed. Other auth error/success states and matched Figma geometry remain open; this is a focus visibility fix, not frame parity evidence.


### Admin Movies editor title focus below sticky header — 27.10.2026

Disposable ADMIN8662 opened `/uk/admin?view=movies`, navigated to page26, and opened Avatar: The Way of Water (`id=50`) read-only. Runtime showed the supported API data, including three genres, James Cameron and eight cast credits. At natural1536×639 before the fix, the focused title field was visible but section heading y96 overlapped the sticky header ending at y106. The focus effect now moves the viewport only enough to keep that heading visible beneath the current header height; after the change heading y122, title input y324 and header bottom106, with visible input focus and document width1521. No Avatar field, action, or image was changed. Figma `1260:4840` still measures1440×3128, but its selected canvas screenshot continues to show neighboring editorial cards, so matched-frame visual parity remains open. Logged out, deleted only the exact fixture identity `id=8662/username/email/ADMIN`, and verified identity count0 and no remaining user-FK references. `npm run verify:build` passed; no automated tests.


### Admin Movies editor Delete confirm flow — historical unresolved checkpoint — 27.10.2026

Historical evidence before the custom-dialog change below: browser-native confirmation prevented a reliable completion check. The current cancellation, Escape and focus-return status is recorded in [the later manual dialog review](#admin-movies-custom-delete-confirmation-and-escape-focus-return--27102026); successful Delete/API response remains unverified.

Three manual attempts used disposable ADMIN identities 8663/8664/8665 and films 4166/4167/4168. The first two had already shown the same native-confirm/CDP failure. In a fresh local Rewind tab, the third attempt successfully logged in, created the uniquely titled film through Admin Movies, opened its editor, and exposed the browser confirm. The supported CUA dialog handle accepted it, but Chrome returned a CDP Emulation.setFocusEmulationEnabled timeout; an exact database read still found film4168, so successful deletion through the editor remains unverified. Before cleanup, the exact movie had zero references across all eleven movie-FK tables; exact SQL cleanup removed only `id=4168 AND title=<unique fixture title>` and `id=8665 AND username/email=<unique fixture identity> AND role=ADMIN`. Final movie/user counts and movie-FK references were all0. No permanent film/account data or product source was changed. A fresh tab navigates and renders normally before this native confirm; querying the tab after the confirm times out. No build or automated tests were run for these attempts.


### Admin Dashboard EN natural-width read-only and keyboard review — 27.10.2026

Opened `/en/admin` with disposable ADMIN8666 in a fresh Chrome tab at the natural1536×688 viewport. The API-backed dashboard rendered localized Users448, Active448, HQ users0, Films203, Reviews115 and Hidden reviews0. First Tab reached the REWIND link with a clearly visible cyan focus outline. The visible identity hero and admin navigation rendered without loading/error state; this is a natural-width runtime check, not matched1440/mobile geometry or full keyboard traversal. No dashboard or site data was changed. Logged out and exact-deleted only `id=8666 AND username='adminvisual00b7466d6b0a' AND email='adminvisual00b7466d6b0a@example.invalid' AND role='ADMIN'`; final user count and every user-FK reference count were0. No build or automated tests.

### PublicProfile EN natural-width populated state and keyboard focus — 27.10.2026

Opened `/en/users/7748` in a fresh local Chrome tab at the natural1536×688 viewport. The API-backed PublicProfile rendered the hero identity, Following/Followers navigation, Follow link, Profile/Films/Watchlist/Likes/Lists tabs, and the supported Favorite films, Recent activity, Recent reviews, Following, Lists, Statistics, Social links, My films and Liked reviews sections in the accessibility tree. The first Tab exposed a visible cyan focus outline on REWIND. Scrolled runtime screenshot confirmed the fixed header and five-tab profile rail; no horizontal overflow was visibly apparent, but document width was not measured. The underlying dev feed contains test-like social/movie records, so their text and artwork are not treated as design samples. This is natural-width EN route/focus evidence only, not a matched1440 or phone comparison, nor full keyboard traversal. No controls were activated and no source/API/data changed; no build or automated tests.

### Admin Dashboard current-Copy canvas and supported analytics gap — 27.10.2026

Opened the exact current-Copy Figma node `1178:2466` in the live canvas. The inspector identifies “Dashboard - Sulyma Bohdan” at1440×2669; the selected canvas screenshot shows the full hero, icon navigation, WatchSphere and Key Metrics areas, and footer. The EN Admin runtime AX tree exposes only six API-backed counters; watched-film totals over time, average viewing time, list creation, review likes, sessions and engagement metrics shown in Figma are not in the current `/api/admin/dashboard` response. Keep this as a confirmed API/data gap and do not invent values. The screenshot is a Figma frame overview at19% canvas zoom; it does not establish matched1440 runtime parity or exact typography/spacing. No Figma or product data was changed; no build or tests.


### PublicProfile Lists desktop live empty-state recheck — 27.10.2026

Reopened current-Copy Figma `175:619`; the selected frame is 1440×2805 and shows two public-list cards with tags. Opened local EN `/en/users/7748?view=lists` in Chrome at natural1536×688. The EN accessibility tree exposes the profile hero/navigation and API-backed “Public lists” empty state. A follow-up UK visit first exposed the loading state and then the localized “Публічних списків поки немає.” empty state. Earlier EN/UK checks of `/users/439` saw one list and two tags, so runtime data differs by account/current fixture; neither state should be replaced with Figma samples. This confirms the data gap and current empty-state route only. It is not a matched-width geometry, visual-state, error/retry, or full keyboard comparison. No controls were activated; no source/API/account data changed; no build or automated tests.


### Journal Section keyboard switch and restore — 27.10.2026

On local UK `/uk/journal` and EN `/en/journal` at natural Chrome1536×639, Tab traversal reached the Section native select with a visible cyan focus ring. ArrowDown changed its selected value from All sections/Усі розділи to News/Новини; ArrowUp restored the initial value in both locales while focus stayed on the select. Both API feeds and archives remained empty. This confirms keyboard selection and restoration in the current empty-data state only; it does not establish matched1440 geometry, populated-category rendering, error/retry, or phone parity. No data was submitted or persisted, and no source/API changes, build, or automated tests.


### Journal Newsletter category UK/EN keyboard state — 27.10.2026

At the same natural Chrome width, UK `/uk/journal` and EN `/en/journal` were reopened; the Section select was changed to `Бюлетень` / `Newsletter` with the keyboard. A screenshot in each locale shows the cyan focus outline still visible. The localized published-article and archive empty states remain present. This verifies the newsletter category as an empty API result; it does not imply a public signup form or populated article content. No data was submitted or persisted. No source/API changes, build, or automated tests.


### Contact UK/EN live content recheck — 27.10.2026

Opened `/uk/contact` and `/en/contact` in the local Vite app. The accessibility trees show the confirmed `mailto:anonimua910@gmail.com` in both locales, a localized FAQ link, and the supported account/film-data, editorial/partnerships, and press/advertising groups. The EN screenshot at natural1536×639 confirms the service sidebar and Contact hero; its width is not the Figma frame's1440px, and this does not establish matched geometry, phone behavior, or full-page parity. No mail client was opened and no message was sent. No source/API/data changes, build, or tests.


### Public Lists catalog EN live feed state — 27.10.2026

Opened local `/en/lists/discover` in Chrome at natural1536×639 and waited for route loading to resolve. The accessibility tree shows empty Featured and Recently liked feeds, six API-backed rows in Popular and six in Recent, plus the popular-tag rail with generated long test-like labels. The screenshot confirms the hero and first empty Featured section only; no matched1440 or phone geometry was examined. These are current development API records and must not be substituted with Figma samples or used to redefine the agreed Featured/Crew API gap. No controls activated; no source/API/data changes, build, or automated tests.


### PublicList UK locale state recheck — 27.10.2026

Opened `/uk/lists/public/19606` in a fresh local Chrome tab. After route loading, the accessibility tree showed localized “Список від”, “Теги”, and “Фільми” labels, the same API-backed list `Journey list 1792631973150185`, and one film link to `/uk/films/3940`. The record has no poster URL and is test-like development data; no list or movie mutation occurred. This is a UK route/locale-state check only. No matched-width PublicList/Ranked List review was performed, honoring the existing waiver; no source/API/data changes, build, or automated tests.


### Reset Password mismatch Enter focus/scroll fix — 27.10.2026

Before the source change, submitting mismatched passwords with Enter from the confirmation input left that input focused while the red mismatch alert rendered below the visible portion of the natural desktop viewport. Clicking the submit button did focus the alert. Root cause: `submit` preferred `SubmitEvent.submitter` over the actual active element when saving the focus origin, so the async focus guard rejected the still-focused input. Updated `ResetPassword.tsx` to record `document.activeElement` first and use submitter only as fallback. `npm run verify:build` passed. After HMR, UK and EN Enter submissions focus the localized `role=alert`, scroll it into view and show its cyan outline. Mismatch is rejected client-side before any API request; no account/token data changed. Other reset errors and real valid-token/session behavior remain open.


### Reset Password invalid-token response UK/EN — 27.10.2026

On local UK and EN `/reset-password` routes, submitted matching password values with fabricated unknown tokens. Both responses were HTTP400 and rendered the localized invalid/expired-link message as an alert; focus moved to it and screenshots show the visible cyan outline. This confirms error behavior for missing tokens only. No known user token was used and no account password/session could be changed. Real valid-token reset/session revocation remains a final regression gate. No source or data changes, automated tests, or Docker actions.


### Forgot Password generic result UK/EN — 27.10.2026

Manually submitted nonexistent `forgot-audit-20261027@example.invalid` on local `/uk/forgot-password` and `/en/forgot-password`. Both return the generic “if the account exists” confirmation in the active locale. The green status receives focus and screenshots show its cyan focus outline. Backend inspection confirms tokens/mail are created only for an existing active account; read-only DB checks returned0 matching users and0 reset tokens. No account or data was created, and no email was sent. This covers only the natural-width generic-result state; real account token/session reset and other error states remain final regression work. No source changes, automated tests, or Docker changes.


### Login invalid-credentials error UK/EN — 27.10.2026

Manually submitted a nonexistent `.invalid` email and a disposable password string to the local UK and EN Login routes. The API returned the expected invalid-credentials result in both locales. The page renders localized error copy in its red alert surface, the alert receives programmatic focus, and screenshots show its visible cyan focus outline. This covers only this natural-width error state; no user/account data was created or changed, no automated tests ran, and matched Figma/authentication success geometry remains open.


### Rules UK/EN natural-width content review — 27.10.2026

Read-only Chrome review of `/uk/rules` and `/en/rules` confirms localized page/sidebar/footer headings, eight rule sections, and the four-item prohibited-conduct list in both languages. This is natural-width content/route evidence only; matched Figma geometry and keyboard traversal are covered separately or remain open. No source or data changes, build, or tests in this read-only pass.


### Delete account copy corrected to match cascade behavior — 27.10.2026

Source/API inspection confirmed `ProfileService.deleteMyAccount` revokes sessions and deletes the user row; the schema cascades the user's reviews, comments, likes, follows and associated activity. It does not anonymize those records. The service-page copy inaccurately said reviews/likes/comments might be anonymized. Changed UK and EN copy to say the related records will be deleted. `npm run verify:build` passed, and fresh `/uk/delete-account` + `/en/delete-account` accessibility trees show the corrected copy. The irreversible account-deletion form was not submitted. No API/database changes or automated tests.


### Contact UK/EN natural-width email and keyboard review — 27.10.2026

Read-only Chrome review of `/uk/contact` and `/en/contact` confirms localized headings and support/editorial/press categories, TMDB-first correction guidance, and the previously confirmed `anonimua910@gmail.com` link (`mailto:` in both locales). On EN, keyboard navigation reaches the email link and its screenshot shows the cyan focus outline. No external mail client was opened. This is natural-width route/content/focus evidence only; existing matched-width Contact measurements remain separate. No app data changed, build, or tests.


### FAQ UK/EN natural-width content and keyboard review — 27.10.2026

Opened `/uk/faq` and `/en/faq` in the local Vite app. Both accessibility trees expose the localized service navigation and six question/answer groups; the EN screenshot shows the intended left service rail and centered FAQ heading/content at the browser’s natural desktop viewport. After one Tab, AX reports focus on the REWIND link and the screenshot shows its visible cyan outline. Existing matched-width FAQ measurements remain the source for geometry; this pass confirms neither mobile parity nor the remaining small vertical-height difference. Read-only; no application data changes, build, or tests.


### PublicProfile More/Less toggle with disposable tag fixture — 27.10.2026

Created disposable USER `id=8668` and public list `id=21088` with four tags, crossing the More threshold missing from current live API data. On `/uk/users/8668?view=lists`, the AX tree showed three tag links and «Більше». Activating it exposed the fourth tag and «Менше» with `aria-expanded=true`; focus remained on the same button. Pressing Enter collapsed to three tags, restored «Більше» and `aria-expanded=false`, and kept focus on the button. The implementation keeps one button mounted across both states and localizes Less/Менше. `npm run verify:build` passed after the change. UI logout completed; exact deletion by ID/username/email/role removed one user, and follow-up queries confirmed zero matching users and zero list21088. Screenshot evidence for the visible focus ring, EN toggle, matched phone geometry, and the ambiguous Figma node `1480:9814` mapping remain open. No persistent data was changed; no automated tests or Docker rebuild were run.


### PublicProfile Lists tag cloud live runtime recheck — 27.10.2026

The older `1480:9718` crosswalk text claiming that the aggregated tag cloud was absent is stale; the 25.10 implementation checkpoint below it records that UI change. Opened current local EN and UK `/users/8211?view=lists`: both AX trees contain the separate localized tag-cloud heading (“List tags” / “Теги списків”) and the API-derived `e2e-tag-73150185` link to the existing recent-tag search route. A scrolled EN screenshot visibly confirms the cloud beneath the one live public list. The account currently exposes one unique tag, so the Figma “More” state (>3 tags) was not exercised. This is natural-width EN route/state evidence, not matched phone geometry or sample-content parity. Keep the list/sample-count difference as a data gap; no API/static data was added. No source/data changes, build, or tests.


### Service Film Data UK/EN live runtime review — 27.10.2026

Opened local `/uk/film-data` and `/en/film-data` in the running Vite app. The accessibility trees show the localized TMDB source and non-endorsement disclaimer, instructions to correct missing/inaccurate metadata through TMDB, duplicate-report guidance, and a localized Contact link. This confirms route/content structure only at the natural Chrome viewport; it is not matched-width geometry, mobile behavior, keyboard traversal, or a full Service parity review. No external link was opened and no message was sent. No source/API/data changes, build, or tests.


### Figma PublicProfile More-tags phone node recheck — 27.10.2026

Selected current-Copy node `1480:9814` in the open Figma canvas. The layer name is “Crew lists more tags (svergunova phone)” and the inspector reports393×1674. The visible canvas crop contains a “More” heading, editorial-looking cards and a footer, but no clear profile identity or list-tag cloud; this view alone does not prove the node's route/content mapping or More-state parity. Structured `get_design_context` is still blocked by the Starter MCP call limit. No lasting Figma changes: a one-pixel keyboard nudge was undone immediately and the original X coordinate was confirmed in the inspector.


### Public Lists live API tag availability — 27.10.2026

A read-only GET to local `/api/lists/public?page=0&size=50` returned all38 public-list records. Grouping the response's actual tags by owner found no profile with more than two unique tags; several owners currently have no tags. This explains why the existing PublicProfile live runtime cannot reach the `More` state (>3 tags). It does not validate that state visually or behaviorally, and does not change the Figma phone node's unresolved content mapping. No data/API/source changes, fixtures, build or tests.


### Movie Details populated Reviews card contrast fix — 27.10.2026

Read-only local API discovery found `The Wrecking Crew` (movie5) with E2E-labeled review records. UK and EN `/films/5` were opened in Chrome at its natural1517px-wide viewport. Both locales render the review feed and paginated cards; Show comments expands to localized empty-state and login copy. Keyboard traversal returns to the expanded Hide comments button with a visible cyan focus ring. The lower additional-review cards initially rendered white on white because the desktop dark theme selectors matched only direct `.reviewsSection` children, while later cards are nested under `additionalReviews`. Widened the selectors to all review descendants. `npm run verify:build` passed; after reload, natural-width screenshots confirmed visible nested cards on page1 and page2 use dark surfaces with legible text. A test record containing HTML-looking text is visibly rendered as literal text in its card. Current review identities/content are test-generated, so this is component-state and contrast evidence only—not Figma content parity or representative production data. No API/data mutations, automated tests or Docker actions.


### Review Details UK/EN natural-width runtime check — 27.10.2026

Read-only UK/EN `/reviews/1972` loaded an existing E2E review. The route shows the API-provided film, poster, reviewer, review text, rating, date, login-to-like action and empty liker state; UK labels and duration/date are localized. At natural Chrome width, EN Tab traversal visibly focuses the `Sign in to like` link with a cyan ring and scrolls it into view. The username, “Concurrent social film” title and “Concurrent like review” body match the naming pattern in `CoreFilmFlowIntegrationTests`; treat these as synthetic test records, not Figma sample content. No record was modified. This does not establish matched1440/mobile geometry, authenticated like behavior, or populated likers. No API/data mutations, build or tests.


### Figma phone “review page” candidate remains unmapped — 27.10.2026

On the open Current-Copy canvas, selecting the layer row named `review page (svergunova phone)` showed a393×932 frame in the inspector, while the visible canvas crop contained editorial cards (“Funny Papers”, “Coming Home”), not an identifiable Review Details screen. The canvas URL retained its prior `1480:9718` selection and did not expose a reliable node ID for the selected row. Do not map this candidate to Review Details or count it as coverage. `get_design_context` is still blocked by the Starter call limit. Layer visibility was restored to its original visible state; no Figma design changes were retained.


### PublicProfile guest Following row — 27.10.2026

UK `/users/7748?view=following` at natural desktop Chrome width loads one API row and a visible Back-to-profile link. For the logged-out viewer, Follow resolves to localized Login; More is hidden at desktop widths by the `max-width:720px` rule. This does not indicate an auth restriction: the guest phone sheet and keyboard loop were already verified at393px (see [phone More sheet evidence](#publicprofile-mobile-followers-keyboard-and-action-review--25102026)). The username and associated review/movie labels match the naming pattern in the backend concurrency integration test, so this is synthetic fixture data rather than design sample content. No control was activated; no API/account data changed. This adds natural-desktop route/state evidence only, not matched1440 geometry.


### Community directory no-match empty state UK/EN — 27.10.2026

At the natural Chrome viewport (1519×639), UK and EN `/community` each kept the API-backed Popular reviewers section visible, showed the genuine empty Featured members state, and returned the localized directory empty state for the read-only query `RewindNoMatchingUser987`. The focused search field retained its cyan outline after submission. No horizontal overflow was visible; no data was submitted beyond the GET search, and no records changed. This verifies only the desktop no-match state and search-field focus; populated-row parity, phone layout, pagination variants, error/retry, and matched Figma geometry remain open. No source changes, build, or automated tests.


### Person genre no-match state UK/EN — 27.10.2026

On UK and EN `/people/actor/287` at the natural Chrome viewport, the live API filmography contained one film. Selecting Comedy / Комедія with the keyboard returned the localized “No films found” / “Фільмів не знайдено” state; a screenshot in both locales shows the visible cyan focus ring still on the Genre select. This verifies a genuine filter-empty state without changing data. Genre-request failure/retry, phone layout, and matched Figma geometry remain open. No source/API/data changes, build, or automated tests.


### Admin Movies UK read-only route check and exact fixture cleanup — 27.10.2026

Disposable ADMIN `id=8669` opened UK `/admin?view=movies` at the natural Chrome viewport. The page rendered six API-backed catalog rows, edit/more-actions controls, and page 1 of 34 with 203 total records; concurrency-labeled sample records were left untouched. This confirms only natural-width route/list availability, not matched Figma geometry or editor/action behavior. Logged out through the UI, then removed exactly `id=8669 AND username='auditadmin1027' AND email='auditadmin1027@example.invalid' AND role='ADMIN'`; SQL deleted one row, the identity query returned0, and all29 FK columns targeting `users.id` returned0 references. No movie or existing account was changed. No build or automated tests.


### Admin Movies custom delete confirmation and Escape focus return — 27.10.2026

Replaced browser `window.confirm` with a native modal `<dialog role="alertdialog">` used by both the editor and row action menu. It announces the localized prompt and film title, initially focuses Cancel, and supports Escape. Cancellation restores focus to the exact Delete trigger; the post-Escape screenshot shows the cyan focus outline and the catalog row remains present. No DELETE request was submitted. A disposable ADMIN `id=8670` was signed out and exact-deleted by ID/username/email/role; its identity count and the aggregate references across all29 user-FK columns are0. `npm run verify:build` passed (TypeScript and Vite,233 modules). Successful Delete/API response and error behavior remain unverified; matched1440/phone Figma geometry remains open.


### Admin Movies EN dialog keyboard cycle and Cancel follow-up — 27.10.2026

In EN `/admin?view=movies`, the confirmation prompt and film title rendered localized. Focus began on Cancel; Tab moved to Delete, and Shift+Tab wrapped from Cancel to Delete. Clicking Cancel closed the dialog, left all203 catalog entries intact, and returned focus to the corresponding row action. The fixture ADMIN `id=8671` was logged out and exact-deleted by ID/username/email/role; matching identity count and references across all29 user-FK columns are0. No Delete confirmation or API mutation occurred. The earlier UK check verified Escape and a visible keyboard focus ring. This adds EN keyboard/cancel evidence only; successful Delete/error, matched-width parity, and full modal keyboard permutations remain open. Build is recorded in the preceding checkpoint; no second build or automated tests.


### Current Copy Admin Movies reference access recheck — 27.10.2026

A fresh Figma MCP session for Current-Copy file `BDO9GO1oscOeUTcu4VXVKA` and `get_design_context(1260:4840)` still returns the Starter-plan call-limit response. `whoami` confirms a Full seat on the Starter team; no upgrade or purchase was initiated. Read-only local archive provenance identifies its source as a different file, `orb73jiLJnIsZNCRtJsWgS`. Its page inventory has an old same-number “Edit Film - Sulyma Bohdan” frame at1440×3128, X6790.49/Y−20221, but no matching focused raw subtree or rendered export exists in that archive. Treat the old inventory only as historical size/placement metadata; it cannot prove Current-Copy content or rendered parity. [Current handoff](../frontend/FIGMA_HANDOFF.md#current-package-matrix--27102026).


### Profile Settings keyboard and disposable Admin cleanup — 27.10.2026

Created local Admin fixture `id=8667` using the repository's loopback-only registration/role-promotion pattern. UK `/uk/admin?view=dashboard` loaded successfully; `/uk/profile?settings=profile` and `?settings=authentication` exposed localized profile/password fields. Keyboard traversal visibly focused the Display name input with its gold outline; the long generated fixture value fit in the field at the natural browser width. No Profile Save or password action was submitted. Logged out through the UI, then deleted only `id=8667` with its generated username/email and `ADMIN` role predicates. Verified0 matching user rows and0 references across all29 FK columns targeting `users.id`. No product or existing-user data changed. This does not establish matched Figma geometry, mobile/EN settings, or validation/error states. No build or automated tests.

### Global Search UK Users and Lists results keyboard path — 27.10.2026

At Chrome's natural1519×688 viewport, UK `/uk/search?tab=users&q=Journey` returned5 users and4 Lists as related counts; the first user result is `J journey263193286619 @journey263193286619` → `/uk/users/8210`. Keyboard traversal focused that first user link. UK `/uk/search?tab=lists&q=Journey` returned4 list results and5 related users; the first list is `Journey list 1792631973150185 journey631973150185 · 1 фільм Discovery journey` → `/uk/lists/public/19606`. Tab traversal focused the first list card with a full cyan outline. Synthetic-looking names and missing poster art reflect the development dataset; they are not treated as design-content evidence. No links were activated or records changed. This is natural-width UK state/keyboard evidence only; matched1440 geometry, other queries/locales, Tags/Journal and loading/error/retry remain open. No source changes, build, automated tests or Docker actions.


### Global Search UK Tags and Journal query states — 27.10.2026

At Chrome's natural1519×688 viewport, UK `/uk/search?tab=tags&q=e2e-tag` returned four API-backed tags and showed the first tag link with a full cyan keyboard-focus outline. UK `/uk/search?tab=journal&q=film` returned0 Journal results while Films had152 and Reviews101; the Journal category displays the localized no-results message and Home link. This confirms one populated Tags query and one genuine Journal empty query only. Journal article cards remain unavailable from the local API and are not replaced with static Figma samples. Matched1440/phone geometry, other queries/locales and loading/error/retry remain open. No links were activated or records changed; no source changes, build, tests or Docker actions.


### Journal UK feed and archive current API state — 27.10.2026

Read-only Chrome review of /uk/journal at natural1519×688 shows the localized Journal title/subtitle and section selector, with a visible cyan focus ring after keyboard traversal. The active API feed reports ‘Опублікованих статей поки немає.’ and Archive reports ‘Архів поки порожній.’ This is the current empty API state, not parity for the Figma feature story/editorial cards; no sample articles were introduced. The page has no visible horizontal overflow in the screenshot. Populated article/archive behavior, matched frame geometry, phone behavior and EN focus remain separate or open. No source/API/data changes, build, automated tests or Docker actions.


### Journal Article temporary browser fixture UK/EN — 27.10.2026

Because both live API locales return `totalElements=0`, a temporary Node loopback proxy returned synthetic articles only for exact audit slugs. It never wrote to the API or database. At the browser's natural desktop width, EN and UK rendered category/date/title, two body paragraphs, Back link and the `coverUrl:null` branded fallback; first Tab showed a visible outline on the REWIND link. On UK, a separate exact route returned503 once and the localized Retry control fetched the same fixture successfully; focus moved to the loaded article heading. The fixture copy is only a layout/behavior aid, not production editorial content or matched-Figma evidence. Matched frame/mobile geometry, richer body variants and actual populated article data remain open. Temporary proxy and Vite processes were stopped and the local browser was restored to Home. No source/API/DB changes, build or automated tests.


### Journal podcast audio error, retry and localization — 27.10.2026

A second loopback-only article fixture provided an audio URL; the local proxy returned503 for the first audio fetch and then a generated one-second silent WAV. The UK page rendered “Не вдалося завантажити аудіо подкасту.” with Retry; Retry removed the error, loaded the native audio controls and exposed a 0:01 duration. EN rendered the localized “Podcast audio” label and the native player. These synthetic media responses were never persisted or sent to an external service. This verifies one desktop error→retry and locale state only; keyboard traversal of native controls, mobile/matched geometry, other formats, and real editorial media remain open. No source/API/DB changes, build or automated tests.


### Community directory populated search and keyboard focus — 27.10.2026

At the local UK /community route and Chrome's natural1519×688 viewport, entering Anton Lyshtva into the directory search and submitting returned one API-backed user row (/users/438). Keyboard traversal moved from the Search button to the profile link; the screenshot shows a cyan outline around the full result row. No profile was opened and no Follow action was activated. This is a single live query/keyboard check, not matched Figma geometry or representative content parity; the development dataset contains generated-looking accounts. Other query, locale, loading/error/retry and phone states remain open. No source/API/data changes, build or tests.


### Community EN directory search focus follow-up — 27.10.2026

At /en/community and the same natural1519×688 Chrome viewport, searching Anton Lyshtva returned the same API-backed profile as UK. Keyboard focus traversed Search → profile → Follow: the Follow icon receives a cyan outline, and moving Shift+Tab back to the profile link shows a cyan outline around the full row. The first screenshot immediately after search showed the input's prior focus outline despite AX reporting the profile link; a second traversal confirmed the profile row focus. No profile was activated and no Follow action was submitted. This confirms the localized query/focus pair only, not matched Figma geometry, phone behavior, other queries or loading/error/retry. No source/API/data changes, build or tests.


### Guest Messages route guard UK/EN — 27.10.2026

Read-only navigation to /uk/messages and /en/messages in a guest Chrome session redirected to the corresponding localized Login route. Both login pages exposed localized accessible Email/Password fields, password-visibility checkbox, Forgot Password link, submit button and registration link. This verifies only guest route protection and localization; authenticated inbox/conversation/send/read behavior, Figma mapping and focus states remain open. No credentials were entered and no message was sent or data changed. No source changes, build or tests.


### Guest Notifications route guard UK/EN — 27.10.2026

Read-only guest navigation to /uk/notifications and /en/notifications resolves to the matching localized Login route. This confirms only route protection/localized destination; authenticated notification feed, preference controls, read/dismiss behavior, Figma mapping and keyboard states remain open. No credentials or notification actions were used; no data changed. No source changes, build or tests.


### Figma MCP Starter limit recheck through official connector — 27.10.2026

The official Figma connector authenticated successfully: whoami reports a Full seat on a Starter plan. A read-only file session was created for Current-Copy BDO9GO1oscOeUTcu4VXVKA; get_design_context for the known Community desktop frame 605:1112 returned the Starter plan tool-call-limit error before providing node context or a screenshot. No Figma design was edited. The open canvas remains an unreliable visual substitute for that frame; local raw references provide measurements but no matching Community frame screenshot. Continue with code/runtime evidence and keep matched-frame parity open until access or a reliable image becomes available.


### Guest Messages/Notifications Login return destination — 27.10.2026

Guest navigation to `/uk/messages?user=438` and `/en/notifications` was manually checked in Chrome; both routes resolve to their language-matched Login page. UK visible navigation Login → Register → Login → Forgot Password → Login also completed; no form was submitted. Source review found that the redirect had dropped the original local destination, and Login accepted only `/profile`. The route guards now pass the current pathname, query and hash as Router state; Login/Register/Forgot Password accept only localized `/profile`, `/messages` and `/notifications` paths, and carry an accepted destination across Login/Register/Forgot Password links and back-navigation. This is source/build evidence for safe destination preservation, not a post-auth session check: no credentials were entered and no message/notification data changed. `npm run verify:build` passed TypeScript and Vite (234 modules). Router state preservation itself, authenticated return navigation, password-reset email round-trip, and visual/matched-frame states remain open.


### Admin Movies pagination locked during mutation — 27.10.2026

Source review found Admin Movies pagination remained enabled while a movie mutation was busy. A confirmed DELETE can finish after a page change, while its completion logic uses the original page and row count to select the next page and restore focus. The paginator now receives `busy={loading || mutationBusy}`, and its callback also returns if either state is busy. This closes the UI race at source level; there was no Admin browser interaction or DELETE request in this check. `npm run verify:build` passed TypeScript and Vite (234 modules). Runtime behavior during a delayed mutation, successful/error DELETE branches of the current confirmation dialog, and matched Figma geometry remain open.


### Admin Movies ordinary pagination and return focus — 27.10.2026

Using disposable ADMIN `id=8672`, the UK catalog loaded six existing API rows on page1/34 (203 records). Clicking Next rendered page2/34; clicking Previous returned to page1/34 and moved focus to the “База фільмів” heading. No catalog row action was activated, and no film was changed. The temporary account was logged out and exact-deleted using ID, username, email and `ADMIN` role predicates; one row was removed, the exact identity count is0, and a dynamic check across all29 user-FK references returned total0/tables0. This is natural-width interaction evidence, not matched1440 geometry or a delayed DELETE test. It does not verify the source-level pagination lock while a mutation is in flight, successful/error DELETE through the current alert dialog, or previous-page focus after deleting a sole row. `npm run verify:build` passed TypeScript and Vite (234 modules).


### Admin Comments custom delete confirmation UK/EN — 27.10.2026

`AdminComments` now uses a localized native `<dialog role="alertdialog">` instead of `window.confirm`. The EN and UK Admin routes were opened under disposable ADMIN `id=8673`. In both languages the dialog exposes its prompt and actions in the accessibility tree, starts on Cancel, and Escape closes it and returns focus to the originating row's Delete button. Tab and Shift+Tab move between Cancel and Delete. No comment was deleted and no DELETE request was issued. The fixture was logged out and exact-deleted using ID/username/email/ADMIN predicates; identity count is0 and the FK scan reports0 references across the user-reference columns. `npm run verify:build` passed TypeScript and Vite (235 modules). This is natural-width accessibility behavior, not matched-frame geometry or mutation success/error evidence.


### Admin Reviews custom delete confirmation UK/EN — 27.10.2026

`AdminReviews` now uses the shared localized native `<dialog role="alertdialog">` instead of `window.confirm`, with Cancel initially focused and an explicit review/author description. In EN, Tab/Shift+Tab moved between both actions; Escape closed the modal and returned focus to the same row's Delete button. In UK, the title, prompt and Cancel/Delete actions were localized; Cancel closed the modal and returned focus to its trigger. No review was deleted and no DELETE request was issued. Disposable ADMIN `id=8674` was logged out and exact-deleted using ID/username/email/ADMIN predicates; identity count is0 and the FK scan reports0 references. `npm run verify:build` passed TypeScript and Vite (235 modules). Natural-width manual check only; matched-frame geometry and mutation success/error remain open.


### Admin Lists custom delete confirmation UK/EN — 27.10.2026

`AdminLists` now uses the shared localized native `<dialog role="alertdialog">` instead of `window.confirm`. Under disposable ADMIN `id=8675`, the EN route opened the dialog for an existing custom test list; its name/owner were announced, initial focus was on Cancel, Tab reached Delete, and Escape closed it with focus returned to the same row action. UK showed the localized title/prompt/actions, initial Cancel focus, and Cancel closed the dialog with focus return. The list was not deleted and no DELETE request was issued. The account was logged out and exact-deleted with ID/username/email/ADMIN predicates; identity count0 and FK scan0. TypeScript and Vite build passed (235 modules). This is natural-width keyboard/accessibility evidence only; matched geometry and success/error branches remain open.


### Admin Notifications single and filtered-delete dialogs UK/EN — 27.10.2026

Replaced both browser confirmation paths with the shared localized alert dialog. Under disposable ADMIN8676, UK and EN single-delete and filtered-delete prompts were reviewed; the initial focus is Cancel, Escape/Cancel closes and restores focus to the initiating control. No DELETE request ran and the notification list remained unchanged. The disposable account was logged out and exact-deleted; identity and user-FK references were0. `npm run verify:build` passed TypeScript and Vite (235 modules). Successful/error delete outcomes and matched-frame geometry remain open.


### Admin Moderation bulk-hide confirmation UK/EN — 27.10.2026

Under disposable ADMIN8677, selected50 visible queue rows without mutating them and opened the localized bulk-hide alert dialog. EN Tab reached Hide and Escape returned focus to the initiating bulk action; UK wording and initial Cancel focus were confirmed, with Escape returning focus. No moderation request ran. The fixture was logged out and exact-deleted; identity and user-FK references were0. `npm run verify:build` passed (235 modules). Matched-frame geometry and successful/error moderation outcomes remain open.


### Admin Conversations delete dialog source/build review — 27.10.2026

Replaced `window.confirm` with the shared localized alert-dialog component and wired Cancel/Escape focus restoration in source. `npm run verify:build` passed (235 modules). Runtime UK/EN review was later completed; see the follow-up entry below. No conversation was deleted.


### Admin Conversations delete dialog UK/EN runtime — 27.10.2026

Under disposable ADMIN8681, opened a populated conversation's delete dialog in UK and EN. Both exposed localized title, prompt and actions, initially focused Cancel, and Cancel returned focus to the same row's Delete action. No conversation deletion request ran. The fixture was logged out and exact-deleted by ID, username, email and ADMIN role; the identity count and dynamic scan across all user-FK references both returned0. Natural-width interaction only; matched-frame geometry and successful/error DELETE behavior remain open.


### PublicProfile overview and collections UK/EN — 27.10.2026

Read-only review of `/uk/users/438` and `/en/users/438` confirmed localized identity labels, Follow, overview links, activity, recent reviews, empty Following/public Lists, statistics, social-links empty state and collection tabs. The UK Watchlist tab selected correctly and announced its empty state; the EN Watched tab exposed a populated film card. A source check confirmed that summary counts and the system collection both use the corresponding `ListType`; the overview's Send Help card is a favorite/review/activity item and does not represent the Watched collection, so the apparent mismatch was a false alarm. No profile action or data mutation was performed. Natural Chrome viewport only; mobile, matched Figma frame, long-name, authenticated actions and keyboard/focus remain open.


### Movie Details own-review delete dialog EN — 27.10.2026

Disposable USER `id=8682` created a four-star rating and review `id=4084` on movie5 using the UI. On `/en/films/5`, Delete review opened the localized dialog with Cancel initially focused; Escape closed it and returned focus to that review's Delete button. No review deletion request ran. The session was logged out and only the exact fixture `(id=8682, username=reviewdlg9101, email=reviewdlg9101@example.invalid, role=USER)` was removed. Its review and rating cascaded; movie5 remained at average4.0, rating count changed14→13, and the local API still returned rating4. A dynamic scan confirmed0 remaining user-FK references. Natural viewport only; visible focus-ring capture and matched-frame geometry remain open.


### Admin Reviews EN visible/hidden filters — 27.10.2026

Under disposable ADMIN `id=8683`, `/en/admin?view=reviews` loaded the API-backed review list with115 records. The first keyboard Tab showed a visible outline on the REWIND link. The Visible only filter retained the populated list; Hidden only rendered the localized “No reviews found” empty state. No Hide/Delete action was activated. The session was logged out and exact-deleted by ID, username, email and ADMIN role; the user row and all user-FK references returned0. This is a natural-width state/keyboard check, not matched `1310:3108` geometry or report/edit API parity.

### Shared confirmation dialogs for user-facing destructive actions — source/build — 27.10.2026

Added a reusable localized native `<dialog role="alertdialog">` with Cancel initially focused, Escape/cancel focus restoration, and a disabled confirmation action while busy. Replaced browser `window.confirm` for deleting a comment, the signed-in user's review on Movie Details/Profile, a custom User List, and the account. User Lists captures the selected list ID before opening the dialog and rechecks it before issuing the existing delete request. `rg -n -g '*.tsx' 'window\.confirm|\bconfirm\(' frontend/src` returns no matches. `npm run verify:build` passed TypeScript and Vite (236 modules). These routes' new dialogs have not yet received manual browser checks; no deletion/account request was submitted. API behavior, localized screen-reader announcement, Cancel/Escape focus return and matched-frame geometry remain open.

### User-facing confirmation dialogs UK/EN manual review and fixture cleanup — 27.10.2026

Disposable USER8678 created private list “Dialog check 8678”. On `/uk/lists`, the dialog opened with localized title/prompt and Cancel focused; Tab reached Delete, Escape closed it, and focus returned to the same Delete List button. On `/en/lists`, the localized dialog opened with Cancel focused; Tab reached Delete and Cancel restored focus. The list remained intact. USER8679 opened Account Deletion in UK and EN after entering the fixture's current password; UK Escape and EN Cancel both closed the localized dialog and restored focus to the Delete Account button. No account deletion request ran.

Disposable USER8680 created review4083 and one comment through the UI. Comment deletion was reviewed in UK (Cancel) and EN (Escape); both localized dialogs began at Cancel, left the comment present, and restored focus to its Delete Comment action. Movie Details review deletion was checked in UK: localized confirmation, Cancel initially focused, Escape returned focus to Delete Review. Profile review deletion was checked UK/EN: localized content, Cancel initially focused, EN Tab reached Delete, and Escape returned focus to the row action. No review/comment deletion request ran. The fixtures and their dependent data were cleaned by exact user identity; IDs8678/8679/8680 each had0 remaining user rows and0 user-FK references.

`npm run verify:build` for the dialog source passed earlier (236 modules). These were natural-width browser interaction checks; matched-frame geometry and screenshot verification of the visible focus outline remain open. Movie Details review dialog EN, Conversations dialog runtime, and all confirmation success/error paths remain open.


### Guest Home CTA focus scroll under sticky navigation — 27.10.2026

At the natural Chrome viewport1519×688, UK and EN guest `/home` were opened against the current API. Before the fix, tabbing to the hero CTA left the first headline line behind the sticky header. The CTA's keyboard `:focus-visible` handler now waits one animation frame, measures the headline and live header edge, then scrolls only enough to reveal the whole heading. Manual UK and EN screenshots after the change show the entire localized headline, the focused Register CTA with a visible gold ring, and the first poster row; the next Tab reaches the first poster with its visible outline. No link was activated and no data changed. `npm run verify:build` passed TypeScript and Vite (236 modules). This is natural-width accessibility evidence, not matched1440/mobile parity or a full Home visual closure; the API still supplies synthetic-looking development review/list rows and an empty Journal feed.


### Account deletion stale movie rating aggregate and cache fix — 27.10.2026

Manual fixture cleanup exposed a confirmed defect: deleting a user cascaded their rating row but left the denormalized `movies.rating` at4.1 while the13 surviving rows averaged4.0. Repaired only movie5 from its surviving ratings, verified the stored aggregate4.0, evicted only Redis key `movieDetails::5`, and reloaded public UK Movie Details; it now renders4.0. Source changes collect the deleted user's rated movie IDs and recalculate each aggregate after account removal. Rating upsert and deletion also evict the public movie-details cache entry after recalculation, preventing stale guest views. `.\mvnw.cmd -DskipTests test-compile` passed (270 main and40 test sources compiled); tests were not executed. Docker API is not yet rebuilt, so the source fix still needs Docker verification. No other ratings or movie aggregates were changed.

### Person genre API error and Retry focus UK/EN — 27.10.2026

Used a temporary local Vite preview on5175 and a loopback-only proxy on8089 that returned503 only for `/api/genres`; all other requests continued to the existing API on8081. On `/en/people/actor/287`, the localized “Could not load genres” state and Retry rendered, and activating Retry reproduced the error then moved focus to the “Films Starring” heading. Repeated on `/uk/people/actor/287`: “Не вдалося завантажити жанри” and “Спробувати ще” rendered, and Retry returned focus to “Фільми за участі”. No application data was changed. The normal API and original Vite preview were not stopped. Temporary preview/proxy processes were stopped after inspection. This verifies the genre failure/retry/focus state at the natural browser width only; matched Figma geometry and phone focus visibility remain open. No source changes, builds or automated tests.

### Admin Movies Add Film labels UK/EN and fixture cleanup — 27.10.2026

Opened the Add Film editor on `/uk/admin?view=movies` and `/en/admin?view=movies` under disposable ADMIN `id=8687`. The UK form had exposed the untranslated label “URL backdrop” and TMDB quality text “Без backdrop”; both now read “URL фонового зображення” / “Без фонового зображення”. The EN equivalents remain “Backdrop URL” / “Missing backdrop”. No film was created, imported or edited. `npm run verify:build` passed TypeScript and Vite (236 modules). Logged out and deleted only fixture8687 with ID, username, email and ADMIN-role predicates; the database confirmed1 row deleted and0 matching identity rows remaining. Its dependent lists and session were removed by the existing FK cascades. Natural-width label/state check only; matched Figma geometry and mutation paths remain open.

### PublicProfile desktop overview — composition and current API content recheck — 27.10.2026

Reopened Current-Copy `238:596`; inspector confirms1440×4459. Canvas screenshots at50% show Favorites, four Recent Activity poster slots, two Recent Reviews cards, Following avatars, one Lists card, then the footer. UK `/users/7748` at the natural Chrome window retains the same section order through Lists. Its current API data has empty Favorites/Lists, two activity events, one recent review and one Following member; absent poster/avatar images render initials fallbacks. This is development-data variation, not a confirmed layout defect. Statistics, rating distribution, Social links, My Films and Liked Reviews continue after Lists in the application because the product requirements require them; the Figma overview has no placement for those sections. Preserve these sections and keep placement open. No source/API/data/Figma change, build or tests; the live window was not matched to1440.

### Admin Settings typed controls UK/EN and keyboard focus — 27.10.2026

Source review of `AdminSiteSettingsService` confirmed accepted values: `default_locale` is only `uk` or `en`; `journal_enabled` and `maintenance_mode` are booleans; `site_name` remains free text. Replaced the locale text input with a localized UK/EN select and the boolean text inputs with labeled native checkboxes. The API routes, setting keys and save behavior are unchanged. `npm run verify:build` passed TypeScript and Vite (236 modules).

Manual `/uk/admin?view=settings` and `/en/admin?view=settings` checks under disposable ADMIN fixtures8688/8689 confirmed localized labels/options, selected values, both boolean states and the Site Name text field. Keyboard Tab reached the locale select and Journal checkbox with visible focus rings. No setting was changed or saved. Both fixtures were logged out and exact-deleted by ID/username/email/ADMIN predicates; user rows, remaining identity matches and all user-FK references were0. Natural browser width only; matched1440/phone geometry and unsupported Figma controls remain open.

### Admin Settings current canvas confirmation — 27.10.2026

Current-Copy canvas recheck selected exact node `1404:4076`; the inspector and screenshot confirm a1440×2378 Admin Settings composition with the shared identity/navigation hero, centered General Settings title, a single translucent workspace and footer. The workspace visibly includes site name, interface language, time zone, logo, publication policy/limits, colors, font, cache and backup controls. Only `site_name`, `default_locale`, `maintenance_mode` and `journal_enabled` have current API contracts; all other displayed settings remain gaps. This corroborates the existing shell landmark comparison, not a new runtime screenshot or control-by-control pixel match. The Figma MCP returned the Starter plan call-limit error, so this check used the live browser canvas. No design values were changed; no app/API/data changes, build or tests.

### Admin Movies editor DELETE success and exact fixture cleanup — 27.10.2026

Created disposable ADMIN `id=8690` by registering a unique local account, then promoted only that exact row. From UK `/admin?view=movies`, created disposable film `id=4169`, title `Disposable editor delete 20261027 692327d5d572`, opened its Edit form and activated the editor's Delete action. The current localized `<dialog role="alertdialog">` opened with Cancel focused and the exact fixture title in its description. Confirming Delete removed the film through the existing UI/API flow; the dialog and editor closed, the catalog no longer listed the film, and focus returned to the visible “База фільмів” heading. Before deletion, the film had0 references in every movie-FK table; after deletion, the exact movie query and all movie-FK reference counts were0. The disposable Admin was logged out and removed only with `id=8690`, exact username/email and `role='ADMIN'`; deletion count1, identity count0 and all29 user-FK counts0. Its three default lists and refresh session were fixture-owned and cascaded on cleanup. No existing user/movie/data changed. No source changes. `npm run verify:build` passed TypeScript and Vite (236 modules). No Docker rebuild or automated tests. The DELETE error-response branch and matched-frame geometry remain open.

### Community desktop anchor and keyboard recheck — 27.10.2026

Reopened UK `/community` in the ordinary Chrome window (1536×639; no viewport override). The introductory banner begins at y316 with 1152×260 bounds; Featured heading is x160.4/y679.8 and Popular heading x160.4/y1207.4. `documentElement.scrollWidth` equals `clientWidth` at1521, so no horizontal overflow was present. Tab traversal reached a guest Follow link in the Popular rail and its cyan focus ring was visible. The API still returns an empty Featured feed, five generated `social_race_*` Popular records and a populated 38-page directory containing existing generated/E2E accounts; no data was changed. This is natural-width runtime only: Current-Copy matched screenshot access is presently blocked, so matched1440 geometry, phone/populated Featured and full frame parity remain open. No source changes, build, or tests.

### Admin Movies DELETE 503 error state and exact fixture cleanup — 27.10.2026

On the normal local preview, a disposable ADMIN session opened the editor for movie4170 (`Disposable failed delete 20261027 942967db950a`). A temporary loopback-only proxy on port8089 returned HTTP503 only for `DELETE /api/admin/movies/{id}` and forwarded all other traffic to the existing local API; a temporary Vite preview on5175 exercised this controlled failure without changing the API or Docker services. After confirming the localized delete dialog, the editor remained open and showed “Не вдалося видалити фільм.” The alert received keyboard focus with a visible cyan outline. A read-only DB check confirmed the movie still existed and had0 references in every movie-FK table, so the injected failure did not reach the API or alter data. Signed out through the normal preview; exact-deleted only movie4170 and ADMIN8691 (`adminerr942967db950a`, `adminerr942967db950a@example.invalid`, role `ADMIN`). Both exact identity counts returned0; fixture-owned lists and refresh sessions cascaded. Stopped the temporary preview and proxy; ports5175 and8089 are no longer listening. `npm run verify:build` passed TypeScript and Vite (236 modules). Automated suites remain deferred until visual-stage closure; matched Figma geometry and other mutation outcomes remain open.

### Login password visibility and keyboard progression EN — 27.10.2026

Opened `/en/login` in the ordinary Chrome tab at its natural viewport. The page exposes Email, Password, Show password, Forgot password?, Log in, and Create one. Activating the visibility checkbox changed its accessible label to “Hide password”; pressing Tab then moved focus to “Forgot password?”. No credentials were entered and no form was submitted. This is a natural-width interaction check; screenshot-confirmed focus styling and matched-frame geometry remain open. No source, API, or account changes; no build or automated tests.

### Film Data lower content and service footer visual review UK — 27.10.2026

Opened `/uk/film-data` in the ordinary Chrome preview at natural width. The page shows the “Duplicates” section and then the complete service footer: brand, primary service links, social icons, copyright/TMDB credit, Sources link, and Privacy/Film Data/Delete Account links. The localized duplicate guidance and Contacts link remained visible without clipping. Accessibility tree and screenshots were reviewed at the route top and scrolled lower; this is not a matched1440 frame comparison or a phone review. No links were activated and no source, API, or data changed; no build or automated tests.

### Admin Reviews reported and edit frame audit — 27.10.2026

Current-Copy Figma canvas and `get_design_context` confirmed `1319:5033` as the separate “Reported Reviews - Sulyma Bohdan” frame,1440×3217. The context shows an “All Reported Reviews” heading, three populated review cards, a Reported Reason field per card (Spam, Inappropriate Content, Bullying), likes/comments counts, and pagination. Existing `1310:3108` is the ordinary Reviews list,1440×3401, with a “View Reported Reviews” control and Edit Review actions. The canvas also identifies a distinct Edit Review frame `1315:4313`,1440×2435; its follow-up structured-context call hit the Starter quota. Source inspection of `AdminReviews.tsx`, `admin.api.ts`, and `AdminDashboard.tsx` confirms the live route supports paged reviews and All/Visible/Hidden filters, plus hide/delete. No reported-review endpoint/query or review-edit endpoint/form exists; do not synthesize report data or fake the edit flow. Record Reported/Edit as API/contract gaps. Manual UK Chrome review at natural1519×639 with disposable ADMIN8692 opened `/uk/admin?view=reviews`: the visibility filter, populated cards and 115 records/3 pages rendered; the centered card rail and two-column content matched the ordinary-list composition qualitatively. No review action was used and this is not matched1440 geometry or Reported/Edit route parity. The fixture was signed out and exact-deleted by ID/email/ADMIN role; the account count and all27 user-FK reference counts are0. The edit frame did not receive fresh structured context after Figma rate limiting. No source/API change, build, or automated tests.

### Admin Comments, Moderation, Dashboard, Settings and Audit Log read-only sweep — 27.10.2026

Under disposable ADMIN8693, manually opened UK `/admin?view=comments`, `/admin?view=moderation`, `/admin?view=settings`, `/admin?view=logs`, and `/admin`. The loaded accessibility trees confirmed Comments106 records/3 pages with visibility filter and hide/delete actions; Moderation220 items/5 pages with type/search/select/bulk-reason controls; Settings displays only supported `default_locale=uk`, `journal_enabled=true`, `maintenance_mode=false`, and `site_name=Rewind`; Dashboard counters were Users448 (including this fixture), Active448, HQ0, Movies203, Reviews115 and Hidden Reviews0. The account had no own audit entries, so Logs showed its API-backed empty state. A natural-width screenshot of the Moderation workspace showed the centered dark shell and full filter/control row; Reviews card composition was separately captured in the previous entry. Comments, Settings, Dashboard and Logs were checked in the accessibility tree, not by matched-frame screenshots. No moderation action or setting save occurred. Signed out, exact-deleted only fixture8693 by ID/email/ADMIN role, and verified identity0, owned lists0 and all27 user-FK reference counts0. This is natural-width UK state evidence; matched frame geometry, EN, mobile, and populated audit-log variants remain open. No source/API change, build, or automated tests.

### Current-Copy PublicProfile canvas retry — 27.10.2026

Opened the exact Current-Copy URL for PublicProfile frame `238:596`; the canvas remained on its Loading screen. One reload and one back navigation returned to the same Loading screen, with no rendered frame to inspect. This adds no screenshot, node identity, or design-parity evidence. No Figma file changes were made; use existing verified references and continue with independent local route checks until the canvas recovers.

### Lists catalog UK API data and keyboard focus — 27.10.2026

Opened local UK `/lists/discover` in Chrome at its natural desktop viewport. The page rendered empty Featured and Recently liked sections; Popular and Recent each contained six API-backed list rows. The visible cards include generated Journey/Unrelated/Tagged titles, a repeated concurrent-review poster placeholder, and generated E2E/concurrency-like tags. This confirms the current local API state and identifies it as unsuitable for design-content comparison; no data was edited. Keyboard traversal reached a Popular card title link, whose focus outline was visible in the scrolled card view. No card was activated. This is natural-width UK runtime and accessibility evidence only: no matched Figma screenshot/geometry, phone breakpoint, or content parity was verified. No source changes, build, or automated tests.

### Admin Moderation empty search state and focus return UK/EN — 27.10.2026

Created a one-off local account through the app registration form, promoted only exact user id8694 (`codexadm_1zkg49j`) to ADMIN, and used that session to inspect `/uk/admin?view=moderation` and `/en/admin?view=moderation` at Chrome's natural desktop viewport. Both locales rendered the API-backed queue with220 rows across5 pages and localized type, search, filter, select-all, reason and hide-selected controls. Tab navigation showed a visible focus ring on the UK type selector. Searching for `codex_visual_no_match_20261027` and activating Filter produced “Черга модерації порожня.” in UK and “The moderation queue is empty.” in EN; focus returned to the localized Moderation queue heading with a visible outline. No row selection, hide action, setting or data mutation occurred. Logged out through the app, then deleted only id8694 with matching username and ADMIN-role guards; deletion count1, identity count0 and dynamic sum across every user foreign-key column0. This is filter/empty-state/keyboard evidence at natural desktop width, not matched Figma geometry or phone coverage. No source changes, build, or automated tests.

### Authenticated Messages and Notifications empty states UK/EN — 27.10.2026

Created a disposable USER through the local registration form, then inspected `/uk/messages`, `/en/messages`, `/uk/notifications` and `/en/notifications` at Chrome's natural desktop viewport. Both Messages routes returned no conversations and showed the localized “choose a conversation” panel; no conversation was opened, avoiding read-state changes. Both Notifications routes returned no notifications; the two localized preferences (new followers and likes on reviews) were checked by default, while Mark all as read was disabled. No preference was toggled and no message/notification was created. Logged out, then deleted only exact user id8695 (`rewindusr_mbkwyi4`) with the USER-role guard; deletion count1, identity count0 and dynamic sum across every user foreign-key column0. This verifies authenticated empty/default states only; populated conversation/feed rendering, message composition/read state, notification errors/actions, matched Figma geometry and phone breakpoints remain open. No source changes, build, or automated tests.

### Home member UK/EN natural desktop runtime and keyboard focus — 27.10.2026

Created and logged in as disposable USER8696 (`homeusr_w7m7c49`), then reviewed `/uk/home` and `/en/home` at Chrome's natural desktop viewport. Both routes render the localized member welcome hero and the same section order: New, Popular films, Latest News, Popular Reviews, Popular Lists, and Recent News. The live API returns six newest films, six generated “Concurrent rating film” rows, four generated social-race reviews and three generated Journey lists; both Journal sections are empty. These current records are development/E2E-like and not Figma sample content. Keyboard traversal reaches the first poster link in each locale and screenshots show a visible outline; no link was activated. Logged out and exact-deleted only id8696 (`homeusr_w7m7c49`) with the USER-role guard; deletion count1, identity count0 and dynamic sum across every user foreign-key column0. This is natural-width member-state/accessibility evidence, not matched1440 or phone parity. Figma desktop member anchors and earlier393px checks are historical; current responsive comparison, delayed/shared-feed states and design-content parity remain open. No source changes, build, or automated tests.

Current-canvas follow-up confirms Figma node `1413:6263` is titled “для зареєстрованого користувача - Аглая” and its inspector dimensions are1440×5020. This confirms the selected frame identity only; no new matched-width screenshot comparison was performed.

### PublicProfile canvas recovery and local list-state review — 27.10.2026

The earlier Figma `238:596` retry had remained on Loading. A fresh direct open recovered the canvas; screenshot visibly shows the selected “Profile Page ‘Profile’” frame and its1440×4459 inspector size, with the public identity hero, Follow control, tabs, Favorites, activity, reviews, Following, Lists and footer. The local UK `/users/439?view=lists` page at the natural Chrome viewport shows one API-backed verification-like list and two tags; the initials avatar and development records differ from the Figma sample. This confirms the current frame identity and local route state, not matched-width geometry or content parity. No app/Figma/data changes, build, or tests.

### About UK/EN natural desktop runtime and first focus — 27.10.2026

At Chrome's natural desktop viewport, `/uk/about` and `/en/about` expose the same eight mission sections, localized service rails and footer links, plus the shared TMDB attribution. The first Tab in each locale visibly focuses the REWIND home link. This refresh confirms localized structure and first-focus accessibility only; it is not a matched1440 or phone comparison and does not close the About frame geometry. No content or settings were changed; no build or tests.

### Service sidebar desktop label alignment fix — 27.10.2026

The Current-Copy About frame `1011:1915` was opened in the live canvas at readable zoom; every visible Service-rail item starts on a shared left edge. The local About hero centers its intro, and that inherited `text-align:center` also centered wrapped sidebar labels such as Ukrainian “Налаштування акаунта” and “Правила користування”. Set `text-align:left` on base ServiceNavigation links; the `max-width:1100px` mobile rule still explicitly centers link content. Fresh natural-desktop UK/EN screenshots show all rail labels aligned consistently, while localized content and route targets remain intact. No frame-size or phone claim. `npm run verify:build` passed TypeScript and Vite (236 modules). No tests, API/data change, Docker operation or Git delivery.

### Admin Movies Figma node 1494:6790 exact screenshot clarification — 27.10.2026

Reopened Current-Copy node `1494:6790` at50% and captured the visible canvas. The selected 1440×3128 frame contains the film editor: Marty Supreme poster and Name, Duration, Status, Original Language, Change Poster, Year, Genre and Description controls. It does not show a Lola James profile hero; the earlier screenshot interpretation was mistaken. This reinforces the existing semantic mapping to `/admin?view=movies` edit state. This is Figma composition evidence only, not matched-width runtime parity, and does not establish unsupported API behavior for status/original language/genre/credits or the Change actions. No Figma/app/data changes, build, or tests.

### Figma node 1480:9718 canvas context recheck — 27.10.2026

The Figma MCP remains at the Starter tool-call limit (`whoami` confirms Full seat on Starter). In the live canvas, selected layer `Crew lists (svergunova phone)` reports393×1546. At25% canvas zoom, its visible selected fragment shows the “Funny Papers” and “Coming Home” article cards; the surrounding canvas labels this larger composition `Recent news` and shows other Home-style content. No PublicProfile identity, tabs or list profile shell are visible. This supports keeping the node unclassified rather than treating its layer name/dimensions as route proof. An exact isolated export or parent hierarchy remains unavailable; do not count the node as PublicProfile coverage or definitively assign it to Home based only on canvas overlap. No Figma design changes, source/API/data changes, build or tests.

### Admin Dashboard UK/EN read-only data gap and keyboard check — 27.10.2026

Current-Copy `1178:2466` is an1440×2669 Dashboard frame. At50% canvas view the Workspace contains personal analytics cards (films watched, average rating, lists created, reviews written, review likes, session/watchlist/engagement metrics). Local `/uk/admin` and `/en/admin` under disposable ADMIN8697 show the supported six site-level values: Users, Active, HQ users, Films, Reviews and Hidden reviews, with locale-specific labels. Tab from the site logo reaches the selected Admin Dashboard navigation item and shows a visible focus indicator. The composition is three columns/two rows in the local workspace; no unsupported personal analytics were fabricated. This confirms the agreed API/data gap, not matched1440 geometry, mobile parity or Retry-state behavior. The fixture logged out and was deleted exactly by id8697, username and email with role guard; exact identity count returned0 and the FK-reference query yielded no remaining rows. No setting or content mutation, source change, build, automated test or Docker change.

### PublicProfile Following empty state UK/EN — 27.10.2026

Read-only natural-desktop review of existing public profile `/users/439` in UK and EN. Both `?view=following` routes rendered the same identity and empty state, localized as “Підписок поки немає.” / “Not following anyone yet.” Both `?view=followers` routes likewise rendered “Підписників поки немає.” / “There are no followers yet.” The profile counters remained zero. No network action was activated and no user/data state changed. This checks route and localized empty copy only; matched Figma geometry, populated network rows, mobile layout, and More-sheet actions remain open. No source changes, build, or tests.

### PublicProfile populated network rows UK/EN — 27.10.2026

Read-only review of existing API records at natural desktop width: `/users/7748?view=following` shows one row (`social_target_5a62c9ea`) in UK and EN, and `/users/7749?view=followers` shows the reciprocal `social_race_5a62c9ea` row in both locales. Guest Follow controls route to local Login, and list/profile links resolve to the respective profile routes. The records are generated-looking development/social-race data, not Figma content. No links or follow actions were activated; no user or relationship data changed. This confirms populated row rendering, locale copy and guest route only; populated visual parity, phone More sheet, keyboard focus and authenticated actions remain open. No source changes, build, or tests.

### Global Search no-results route and locale recheck — 27.10.2026

Natural-width Chrome review of `/uk/search?q=Dune` and `/en/search?q=Dune` returned the API-backed empty result state in both locales, with All selected and each of the seven result categories at zero, plus localized guidance/Home actions. The category selector is keyboard reachable and displays a visible gold focus outline. No result action was activated. This supplements the existing 393px matched phone evidence with current route/locale state only; it does not add matched geometry, populated-result parity, or error/retry coverage. No source/API/data changes, build, or tests.
### Global Search populated UK/EN category and locale follow-up — 27.10.2026

At Chrome's natural desktop viewport, UK `q=Journey` returned five API-backed users and four lists. Keyboard selection moved between the visible desktop category selector options, updated the `tab` query parameter, and retained the selected category; the first user and list links were reached with visible focus in the earlier same-session pass. EN navigation preserved `/en/search?q=Journey&tab=lists`; the page localized the selected Lists state and rendered four list links. These records have generated/development-like labels and are not Figma sample content. A fresh EN `q=avatar` query returned two API-backed films (`Avatar: Fire and Ash`, `Avatar: The Way of Water`); ArrowDown on the named category selector selected Films, updated the URL to `?q=avatar&tab=films`, and exposed both film links. Natural viewport1536×639 showed no horizontal overflow. No result link was activated and no source/API/data was changed. This is populated route, category-keyboard and locale-preservation evidence only; matched1440 geometry, phone recheck, other query/category states and error/retry remain open. No build or automated tests.

### Admin Reviews and Moderation heading alignment — 28.10.2026

Figma Admin Reviews frame `1310:3108` calls the workspace “All Reviews”; the live page previously used the shorter navigation label. The page heading now uses its own UK/EN localized title. The Moderation frame `1399:3300` similarly specifies “List of Content for Moderation”; the live page heading now matches in UK and EN. `npm run verify:build` passed (TypeScript + Vite, 236 modules). Read-only local Admin review under disposable ADMIN8705 showed 115 review rows across 3 pages; moderation under ADMIN8706 showed 220 items across 5 pages. Both fixtures were logged out and exact-cleaned; identity and user-FK reference counts returned zero. No moderation action or real-user mutation was submitted.

The Figma Moderation table includes email, report reason/source, List reports and edit/delete-report actions that the current API does not supply; the backend queue supports Review/Comment records and hide/restore. These remain an API/data gap and were not fabricated. The frame screenshot is 1440×2171; runtime was reviewed at Chrome's natural width, so matched geometry and other moderation states remain open. No automated suites or Docker changes.

### Profile and PublicProfile frame route crosswalk — 28.10.2026

Reviewed Figma context and rendered screenshots for desktop `238:596` (public profile) and `238:865` (own profile), plus phone `825:1378` and `896:1838`. Public profile maps to `/users/:id`; owner profile maps to `/profile`. The phone frames retain the large identity hero, Favorite Films, Recent Activity, optional Recent Reviews, Following and Lists sections, with the bottom app navigation. The owner phone also exposes its own Profile/Watchlist/Likes/Lists tab rail and settings action; the public phone has Follow and a back/menu action. These are composition references, not local runtime parity evidence.

The normalized metadata for `238:596` and `1413:9302` is identical after stripping node IDs and canvas coordinates, so the latter is a copy of the public desktop frame. Owner `238:865` and nested `1413:10278` share the same route and section composition, but differ in hidden/visible layers and sample identity; keep them as related variants, not exact duplicates. The matrix now maps 63 Profile/settings/social candidates to existing routes and UI states, including collections, reviews, Following/Followers, list editing, and settings. It leaves exact relationships pending where frames show similar labels without matching metadata.

Settings frames include pronoun and reply-preference controls; verify their current API support before treating those as implementable fields. Existing routes cover profile settings, public collections, network views and User Lists editing. This crosswalk does not claim matched geometry, API parity, or keyboard-state acceptance. No source, Figma content, API data, build or tests changed in this mapping pass. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Admin frame route crosswalk and duplicate audit — 28.10.2026

Mapped 41 Admin candidates to existing `/admin` views and documented their visible editor, report, confirmation or route states. Dashboard, Users, User Profile, Movies, Reviews, Comments, Lists, Moderation, Moderator Logs and Settings are represented. Figma editor/report frames for Reviews, Comments and Lists exceed current Admin API capabilities; these are recorded as gaps rather than as working controls. The Activity and More Users Activity frames (`1390:4021`, `1494:7567`, `1393:3652`, `1494:8217`) do not yet have a verified route/API relationship and remain open questions.

Normalized metadata confirms exact copies for Users `1218:2982`/`1494:5956`, Movies `1260:3772`/`1494:7305`, Comments `1342:3589`/`1494:6480`, Lists `1344:5249`/`1494:6641`, Moderation `1399:3300`/`1494:7795`, Logs `1404:3804`/`1494:7933`, and Settings `1404:4076`/`1494:8086`. Dashboard, User Profile and Reviews pairs have metadata differences and remain related variants. The hidden Movies editor `1260:4840` and visible `1494:6790` are already documented as duplicate frames after a separate 173-node comparison. This pass is Figma structure and route classification only; it does not establish live visual parity or authorize new Admin endpoints. No application source or data changed. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Search, Films and Reviews frame crosswalk — 28.10.2026

Mapped 48 desktop/phone candidates to existing routes: Films Discovery `/films/discover`, All Films `/films`, Search entry/results and no-match states (`/search` with `tab=films|reviews|users|tags|lists|journal`), tagged Lists discovery, Popular Reviews `/reviews`, Popular Reviewers `/community/reviewers`, and Review Details `/reviews/:id`. Hidden phone and desktop frames remain identified as hidden variants rather than discarded. Journal search candidates depend on the currently empty Journal API/content; they remain a data gap and are not replaced with Figma sample data.

Normalized metadata confirms duplicate copies for All Films `1413:12611`/`1480:4797`, Popular Reviews `1413:12701`/`1480:4880`, Popular Reviewers `1413:13364`/`1480:5486`, Search no-match `1413:15102`/`1480:5809`, Films Discovery `1413:14110`/`1480:6235`, Review Details `1413:14527`/`1480:6826`, Search tagged lists `1413:14607`/`1413:7979`/`1480:6898`, All Search `1413:15143`/`1480:6991` and expanded All Search `1413:15240`/`1480:7083`, plus the Films, Members, Tags, Lists and Journal Search category pairs. The Reviews-results candidate `1480:7311` differs from the nested `1413:15476` frame and remains a separate hidden variant. These are route/identity classifications, not matched-width runtime parity; no source/API/data was changed and no build or tests were run. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Admin Moderation → Moderator Logs route link — 28.10.2026

Figma `1399:3300` includes a visible “Moderator Logs” pill between the queue search controls and reports table. The existing Admin Logs view and API already exist, but Moderation had no in-page path to them. Added a localized UK/EN React Router link to the existing `/admin?view=logs` route and styled it as a keyboard-accessible pill; no API or route contract changed. `npm run verify:build` passed (TypeScript + Vite, 236 modules).

This is source/build evidence only: no authenticated browser session was available for a fresh live route check, and the current queue still has additional API-backed filters/bulk controls absent from the screenshot. Link placement and matched1440 geometry remain open. Report email/reason/List/edit/delete gaps remain unchanged; no data action, automated suite or Docker operation was performed.

## Full Figma access and design rebase — 28.10.2026

Figma MCP returned the full Page `0:1` metadata tree (~3 MB), containing252 top-level frame nodes /214 normalized name groups. Created the raw inventory at [FIGMA_FRAME_INVENTORY.md](FIGMA_FRAME_INVENTORY.md); its rows remain unclassified until components, prototypes, hidden variants, duplicates and canonical screens are distinguished and mapped to routes/states. Re-read design-system frame `153:2`: SF Pro Display; sample font sizes58/24/22/20/13px; colors `#000000`, `#1f1f1f`, `#282828`; sample radius20px; gradient, layout grid and poster-card sizes. This starts a full design rebase; it does not claim these examples are the complete token set or that existing screens already match. The new order is in [PLAN.md](../../PLAN.md).

### First-pass Figma frame family classification — 28.10.2026

Added provisional family labels to all252 rows in `FIGMA_FRAME_INVENTORY.md`; the labels are based on node names plus direct context/screenshot review of ambiguous nodes. Current groups include Profile46, Admin27 (+ one Add User modal/component), Search27, Lists22, Service13, Auth13, Movie/person10, Journal8, Reviews7, Home/community6, five explicitly named prototypes, Films4, shared components/design system53, eight brand/design references, one non-app diploma/gallery reference and Page404. These totals are only family candidates, not canonical routes or final screen counts; exact route/state mapping and duplicate/hidden variant relationships remain pending.

Read selected nodes: `1423:4557` is a REWIND logo/brand board; `1423:4621` is a brand color slide listing `#5A8A90`, `#938D7D`, `#D69251`, `#1A1E1F`, `#FFFFFF`; `896:1607` is an exhibition-style image with embedded diploma work, treated as out-of-app material; `1222:3312` is an Admin Add User modal/component with empty and populated variants, whose route and API support still need validation. `1399:3300` is a real Admin Moderation frame. No interface or Figma content changed; no build or tests in this inventory pass.

### Root design-token source audit — 28.10.2026

Compared Figma system/brand frames with `frontend/src/global.css`. Figma specifies SF Pro Display and gives sample type sizes58/24/22/20/13px. Current app root still declares Arial, black `#151515`, raised surface `#292929`, 3px/12px generic radii and1280px content width. Figma system samples include `#000000`, `#1f1f1f`, `#282828`, and brand references add `#5A8A90`, `#938D7D`, `#D69251`, `#1A1E1F`, `#FFFFFF`. Repeated frames also use1200px content rails and38px card corners, but these may be component-specific rather than universal tokens. No local woff/ttf/otf font asset was found in `frontend`.

This confirms that the design foundation needs a planned rebuild. No token was changed in this audit: exact font availability/licensing, token scope and route-specific surfaces still need resolution against representative frames before applying global values.

### Home canonical frame and duplicate mapping — 28.10.2026

Recursive analysis included nested frames under `1480:11279 Group 415`. Figma metadata confirms desktop guest Home `1413:6471` and top-level `472:492` have the same normalized 23,079-character subtree after removing IDs and canvas coordinates. These are copies of the same content/state; use nested `1413:6471` as the current reference and retain `472:492` as a duplicate. Member Home `1413:6263` and `473:492` have identical text/component structure after normalizing IDs/coordinates/dimensions, with only a 0.00024px nested width difference. Phone variants `1411:3473` guest and `1327:3210` member are separate 393px frames. All four map to `/home`; these are frame identity/route mappings only, not new runtime parity evidence. [Recursive inventory](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Recursive Figma screen inventory correction — 28.10.2026

The first `FIGMA_FRAME_INVENTORY.md` lists only the252 direct children of Page `0:1`; it is not the whole screen inventory. The full metadata contains9,417 frame nodes. Recursive filtering identified268 frames with desktop1440 or phone393 width and height>600:192 desktop,76 phone,14 hidden. Many complete screens are nested under the large Group415 `1480:11279`. Added `FIGMA_SCREEN_CANDIDATES.md` with all268 IDs, dimensions, nearest frame ancestor and sample text labels. Name/size family tags remain provisional; route/state and canonical/duplicate status are pending.

The first runtime route mapping is Home: guest/member desktop `1413:6471`/`1413:6263`, phone `1411:3473`/`1327:3210` map to `/home`. Guest desktop top-level `472:492` is structurally identical to nested `1413:6471` after normalizing IDs and canvas coordinates. Member desktop top-level `473:492` matches `1413:6263` structure with a 0.00024px nested width difference. These are copies, not extra Home states. The earlier counts/classification in the top-level index remain valid only for that limited direct-child set and must not be reported as the full design inventory.

### Movie and Person frame route crosswalk — 28.10.2026

Figma metadata maps desktop Film examples `39:2` (Oppenheimer) and `61:244` (Dune) to the existing `/films/:id` detail route. Their nested counterparts `1413:8875` and `1413:9082` have exactly matching normalized metadata subtrees respectively after stripping node IDs and canvas coordinates/dimensions (7,585 and 7,305 characters); retain them as duplicate copies. Phone `560:1003` is a full Dune detail composition for `/films/:id`; `736:1107` contains lower-page Similar Films/Storyline content, but its compact 852px root's relationship to the full phone frame remains open.

Actor desktop examples `545:676` and `551:705` map to `/people/actor/:id`; the latter is a longer content sample. Director desktop `547:904` maps to `/people/director/:id`. Phone `721:1085` is an Actor sample; `731:1085` and `736:1339` show Films Directed/Written and map semantically to Director despite both Figma layers being named “Actor Page”. The longer Director sample's state relationship remains open. These mappings follow page labels, content roles and existing routes; they do not establish matched geometry, data/API parity or runtime visual acceptance. `Person.tsx` currently provides one filmography feed per person type, so separate “Produced” and “Written” collections shown in Figma require API review before implementation. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Auth and Service frame route crosswalk — 28.10.2026

Metadata text and current `App.tsx` routes identify desktop Login `605:2175`, Register `605:2176`, Forgot Password `605:2174`, and their phone counterparts Login `944:1582`, Register `944:1828`, Forgot Password `944:1887`. The phone-only start frame `915:1598` remains the previously agreed unused intro/splash prototype; current direct Login/Register routes stay in place. `605:2173` contains only a welcome paragraph and service footer links, with no form labels; keep its exact role/route open instead of assigning it to Login or Register. OAuth, Remember me and phone recovery text remain unsupported contract gaps.

Service frames map directly to current `/about` (`1011:1915`), `/faq` (`1162:2193`), `/privacy` (`1164:2679`), `/rules` (`1164:2790`), `/delete-account` (`1176:2515`), `/film-data` (`1162:2305`), `/contact` (`1122:2497`), and `/help` (`1062:1993`) routes. Separate Terms `1117:2235`, Conditions `1164:2918`, Safety Notice `1176:2355`, and HQ Accounts `1162:2105` frames have no matching route. At the time of this crosswalk, Important Data `1164:2398` was distinct from Film Data `1162:2305` but its route relationship remained open. The additive `/important-data` route is now implemented in the evidence section below; the unsupported report/duplicate-merge actions remain omitted. Runtime/matched geometry is still open. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Lists and Journal frame route crosswalk — 28.10.2026

Figma metadata maps the Lists landing `1413:6725` (1440×3816) and phone `1480:8280` (393×1809) to `/lists/discover`. Its text hierarchy has Featured lists, a separate Crew lists section, and popularity/recent sections. Existing PublicLists supports `/lists/discover?feed=team`, popular/recent/recently-liked and tagged results; the distinct Crew section still needs to be compared with the team profile/API feed before treating them as one feed. Popular frames `1413:13256`/phone `1480:7927` map to `?feed=popular`; Featured frames `1413:13704`/phone `1480:8012` map to the existing `?feed=team` route.

Create-list frames `1413:13189` (empty) and `1413:13030` (populated `My Top`) map to `/lists` creation/editor states. Their `1413:7127`/`1413:6968` counterparts form repeated same-family copies; local API supports list creation, editing, tags and items. Public list detail `1413:13951` (unranked), `1413:14028` (ranked), and phone examples `1480:9302`, `9353`, `9446`, `9494` map to `/lists/public/:id`. The matrix records likely repeated copies separately where exact cross-parent metadata equality has not been checked.

The key interpretation from Current-Copy phone screenshot `1480:9718` is that “Crew lists” is an HQ member profile page, not a standalone Lists feed: it shows the Rewind identity with HQ badge, profile counters, tabs (Profile/Watchlist/Likes/Lists), list cards, tags and bottom navigation. Map `1413:14256` desktop and `1480:9718` phone to `/users/:id?view=lists`; `1413:14389`/`1480:9814` show the same tab with the tag expansion state. The screenshot confirms intended screen semantics, not matching local runtime data or geometry. This means the earlier unknown-layer classification is superseded, while the separate Crew section on the Lists landing remains an API/feed question.

Journal List frames `604:848`, `604:967`, `604:1074`, `604:1172`, `604:1275`, `604:1380` and aliases `1494:4802`, `5045`, `5182`, `4932`, `5287`, `5387` crosswalk to six Journal article-card/layout clusters on `/journal`; they are not PublicLists screens. The existing article/archive API remains empty in local environment, so no Figma sample articles are added to production. These are route/state metadata classifications only; no matched-width visual parity is claimed. [Candidate matrix](../frontend/FIGMA_SCREEN_CANDIDATES.md).

### Movie Details desktop action panel layout update — 28.10.2026

Figma frame `39:2` shows Watch/Like/Watchlist actions, five-star rating, Add to lists and Review in a compact dark panel to the right of the hero copy. Moved the existing API-backed watched/favorite/watchlist toggles, rating controls and list picker from the post-hero section into a desktop hero-side panel; added a button that scrolls to the review section. Wide desktop uses the panel's right column; 701–1100px uses a full-width row, and widths through700px keep the existing mobile action sheet behavior. `npm run verify:build` passed: TypeScript and Vite,236 modules. Windows Computer Use `list_apps` timed out twice, then again after kernel reset/reinitialization, so no browser screenshot or interaction review was made. This records source/build only; visual geometry, authenticated actions and mobile parity remain open. No API/data change or automated tests.

### Movie Details dark-surface Figma rebase — 28.10.2026

Fresh Figma screenshot for `39:2` confirms a black full-width hero fading into `#1f1f1f` content, with a 1200px information rail and `#282828` action/review cards. The Movie Details page and loading state now use dark surfaces; the desktop shell follows the 1200px token; sections, review cards, similar-film cards and editor controls use dark surfaces with white/gray text. The <=700px page background also uses the dark Figma surface. Existing API actions and the mobile action sheet remain intact. `npm run verify:build` passed TypeScript and Vite (236 modules). No local screenshot/runtime geometry check was made because the connected computer-use session timed out earlier. This is source/build evidence only, not matched-frame parity; no API/data changes or automated tests.

### Recursive candidate inventory triage completed — 28.10.2026

All268 size-based candidates in `FIGMA_SCREEN_CANDIDATES.md` now have an initial disposition: route/state, duplicate/related frame, reusable component, prototype, design reference or open question. The inventory is no longer counting unclassified rows. This is triage, not acceptance: duplicate relationships remain pending where noted, runtime frame matching is still required, and Admin Activity's two route/API relationships remain open. The remaining27 entries include community members, Journal article variants, Auth splash/intro, reusable components, prototype screens, a404 route, a logo-grid reference and Admin Activity questions. The main remaining API/content gaps are called out in their crosswalks. No source or data changed during this inventory pass.

### Figma root token baseline — 28.10.2026

Figma design-system frame `153:2` confirms SF Pro Display and sample type sizes58/24/22/20/13px; surfaces `#000000`, `#1f1f1f`, `#282828`; brand references `#5A8A90`, `#938D7D`, `#D69251`, `#1A1E1F`, and white; sample card radius20px; pill radius37px; and a1200px content rail. Added these as explicit root tokens/fallbacks in `frontend/src/global.css`: black and raised-surface values now match Figma, existing surface remains `#1f1f1f`, and the display font stack prefers SF Pro Display then platform system fonts. No SF Pro font file was found in the frontend or Windows Fonts directory; browsers use the available system fallback. Existing small-control radii and purple/cyan accessibility colors are retained until route-level token mapping confirms replacement scope. `npm run verify:build` passed TypeScript and Vite (236 modules). This is source/build evidence only; no browser screenshot review, pixel comparison, automated tests or API/data changes.

### Shared header/footer reference and Journal header correction — 28.10.2026

Figma shared navigation frame `202:729` screenshot shows the dark desktop header with Rewind logo, Films/Lists/Members/Journal/Account links and search, followed by the black multi-column footer and social row. Current desktop source uses a184px logo,14px navigation text, 265px footer, 184px footer logo and24px footer links, consistent with the displayed frame at its 1440px source width. The Figma Journal Article frame `844:1547` also shows the same dark header over the teal/amber hero. Removed the route-specific warm “light” header treatment from `/journal/:slug`; the route now keeps the shared white logo and dark header. `npm run verify:build` passed TypeScript and Vite (236 modules). This is screenshot-to-source review, not local runtime or matched-width verification; footer component source was unchanged.


### Auth shared control sizing rebase — 28.10.2026

Current-Copy Login desktop `605:2175` (1440×1614), phone `944:1582` (393×852), Register desktop `605:2176`, phone `944:1828`, Forgot Password desktop `605:2174`, and phone `944:1887` screenshots share rounded inputs and primary actions. Their scaled dimensions are about72px desktop and45px phone. `AuthShared.module.css` now applies these control sizes across Login/Register/Forgot/Reset, with input horizontal padding40px desktop and21px phone. Figma shows Google OAuth and Remember me for Login/Register and phone-number recovery copy for Forgot; those remain unsupported auth/API contract gaps, so no inactive controls or unsupported phone recovery were added. No dedicated token-confirmation/reset-password frame is mapped in the current candidate matrix; the existing route remains active and its visual mapping is open. `npm run verify:build` passed TypeScript and Vite with236 modules. No local runtime screenshot was captured after this CSS change, so route geometry and visual parity remain open. No tests, auth submissions, API/data changes, Docker actions, commits or push.

### Important Data Figma frame route implementation — 28.10.2026

Current-Copy `1164:2398` is a separate1440×1574 Important Data page, distinct from Film Data `1162:2305`. It shows the shared service hero/sidebar, TMDB attribution intro, Sources and Updates, Duplicates and footer. Added localized `/important-data` route and service-navigation entry, with responsive editorial content in `ServicePage`. Copy is grounded in the actual TMDB source and avoids promising a refresh interval. The Figma duplicate section describes a report-and-merge capability that the current API does not provide; the page directs people to Contacts with both film links and explicitly avoids promising automatic merge or activity transfer. `npm run verify:build` passed TypeScript and Vite with236 modules. This is Figma screenshot/source/build evidence only; no matched runtime view, keyboard review, mobile-specific frame or pixel-parity claim was made. No API/backend/data changes, tests, Docker, commit or push.

### Service rail Figma rebase — 28.10.2026

Current-Copy About `1011:1915` and Contact `1122:2497` both show the same nine-item service rail in this order: HQ Accounts, Frequent Question, Film Data, Important Data, Privacy Policy, Rules of Use, Conditions, Safety Notice, Account Deletion. The app supports six of those destinations: FAQ, Film Data, Important Data, Privacy, Rules, and Account Deletion. `ServiceNavigation` now exposes those six in the matching order with localized frame labels; About, Help, Contact and Profile Settings were removed from this rail because they are not part of the Figma service rail, and remain reachable from the shared header/footer or other existing links. HQ Accounts, Conditions and Safety Notice remain documented route/capability gaps rather than inert links. `npm run verify:build` passed TypeScript and Vite (236 modules). No local runtime screenshot after the nav change, no keyboard/responsive review, and no matched geometry claim. No tests, API/data changes, Docker, commits or push. This supersedes the earlier eight-link count at the 26.10 Service navigation checkpoint.

### Home current-Copy desktop and phone source review — 28.10.2026

Read Current-Copy screenshots for guest desktop `1413:6471` (1440×4934), member desktop `1413:6263` (1440×5020), guest phone `1411:3473` (393×2265) and member phone `1327:3210` (393×2463). Desktop member sections are two poster rows, a featured Journal row, full-width stacked reviews/lists, and a three-card Recent News rail. Phone member retains the two four-poster rails, compact Journal card, stacked review cards, one list card, one Recent News card and bottom navigation. Phone guest uses the feature explainer, recently-reviewed rail, popular review, popular lists, reviewers and news. Source review found these paths already represented in `Home.tsx`/`Home.module.css`; no supported action or API gap justified copying static Figma data. No source change, runtime capture, matched-width comparison, tests, Docker, commit or push. All Home frame states remain open pending local runtime review, content parity where API data exists, and loading/error/empty checks.

### FAQ current-Copy content and capability review — 28.10.2026

Current-Copy `1162:2193` is a1440×2051 FAQ frame with six question/answer groups. Current source has corresponding UK/EN questions and answers. Figma's “Is Rewind free?” sample claims some professional/analytics features may require a subscription; no paid subscription or billing capability exists in the current product/API. Existing copy accurately states that the core service is free and no subscription is currently offered; it was preserved rather than importing the unsupported product claim. Existing natural-width UK/EN runtime and focus evidence remains valid; this pass adds screenshot/content and capability review only, not a new local capture or geometry claim. No source/API/data change, build, tests, Docker, commit or push.

### Account Deletion copy aligned to supported behavior — 28.10.2026

Current-Copy `1176:2515` shows four editorial sections with no deletion CTA. Source and existing release evidence confirm deletion requires the current password, runs through the Profile form, revokes sessions and removes the user plus related database records. Replaced unsupported Security and Privacy claims about post-deletion data use and unspecified “modern security measures” with the confirmed password/form flow. Replaced a promise about future legal/policy updates with factual instructions to describe the current process and save needed information. UK and EN structure and the Figma section layout remain intact. `npm run verify:build` passed TypeScript and Vite (236 modules). No local runtime capture, exact matched geometry, tests, destructive account action, API/data, Docker, commit or push.

### Reset button component classification — 28.10.2026

Current-Copy node `915:1774` is330×161 and contains only two `Reset password` button variants, each290×56; it is not a reset form or full-page frame. It remains classified as a reusable component in the raw frame inventory and is excluded from the 393/1440 screen candidate matrix. Existing `/reset-password` state checks remain route evidence, not Figma page parity. No source/API/data change, build, test, auth submission, Docker, commit or push.

### Auth phone primary-action component geometry — 28.10.2026

Current-Copy contexts for Login `944:1582`, Register `944:1828` and Forgot Password `944:1887` each use a290×56px primary-action component. The visible glass panel occupies45px, with an11px blurred shadow below; the label is14px medium. Updated the shared mobile Auth button to preserve this56px action area while drawing the 45px surface and shadow separately. This supersedes the earlier shorthand that described the entire phone button as45px; the phone input remains45px. `npm run verify:build` passes TypeScript and Vite (236 modules). No local runtime capture, matched geometry, automated tests, auth submission, API/data, Docker, commit or push.

### Search category picker matches Current-Copy — 28.10.2026

Current-Copy expanded desktop `1480:7083` and collapsed/expanded phone `1480:8464`/`1480:8934` show the matches heading with a persistent “Show results for” label and chevron. The previous local markup showed that label only when no matches existed; populated results exposed the selected option text instead. Desktop and phone now keep the prompt visible in both populated and empty states and layer the existing transparent native `<select>` over it. Desktop uses the20px label treatment; phone uses12px and a44px interaction target. The select retains its localized accessible name, native keyboard behavior, category options/counts and URL-backed state change. `npm run verify:build` passed TypeScript and Vite (236 modules). No browser capture or width-matched runtime validation was performed. No API/data or automated-test changes; other Search variants and responsive/focus checks remain open. No Docker, commit or push.

### Search phone no-match source review — 28.10.2026

Current-Copy `1480:8856` is a393×852 phone no-match state. It omits the search input, keeps the “Showing matches for” heading and category control, centers the no-match message and hint, shows a white Back to home action, and retains the fixed bottom navigation. Current `GlobalSearch` uses the same localized English source copy, hides the search input through the existing state selector, and renders the equivalent CTA/empty layout; Ukrainian uses its translation. The new persistent category prompt now covers this state too. This source/frame review justified no additional source change. No local capture, matched-width geometry, focus/keyboard, error/retry or other Search-variant check was performed. No API/data change, automated tests, Docker, commit or push.

### Films Discovery phone source-anchor recheck — 28.10.2026

Current-Copy `1480:7843` is a393×1235 phone frame. Its measured visual anchors agree with current CSS: mobile content starts at168px after the toolbar; the popular rail uses100×149 cards with8px gaps; Just Reviewed begins at y388 and its79×116 rail at y436 with15px gaps; Popular Reviews begins at y587, its two125px cards at y635 and y784 with24px gap; Crew Picks begins at y944. These values follow from the responsive source rules and Figma positions; no source change was justified. The frame contains populated Crew Picks artwork, but the backend has no such feed. The app keeps the documented unavailable state and does not inject sample records. This is a Figma/source comparison only, not a live browser capture: matched-width runtime geometry, current API content, keyboard/focus and retry states remain open. No build/test/API/data changes in this recheck; no Docker, commit or push.

### Films Discovery desktop Current-Copy recheck — 28.10.2026

Current-Copy `1480:6235` is1440×2722. Its desktop frame shows Popular films, Just reviewed, Popular reviews and Crew picks; the Year/Rating/Genre filter and film search controls start at y280. Current `.hero` source computes that y-position from the356px hero,27px bottom inset and49px controls. The current 1200px rail and six-column popular grid represent the same composition. Figma also shows an aggregate “films watched” number. Code/API search found no global aggregate count contract; the existing Admin `adminWatchedMovies` value is attached to one user's activity overview and is not this metric. No source change was justified without a supported count; Crew Picks remains the separate missing-feed gap. No matched runtime screenshot, current API-data comparison, focus, or responsive checks were done. No API/data, build, tests, Docker, commit or push.

### Popular Reviews reviewer More route — 28.10.2026

Current-Copy desktop `1480:4880` shows a small More link aligned right on the Popular reviewers heading. `PopularReviews.tsx` previously rendered only the heading even though `/community/reviewers` is an implemented route. Added a UK/EN `homeMore` link to that route and a contextual accessible label; focus receives a visible cyan outline. At phone widths, the reviewer heading row keeps the link beside the title. `npm run verify:build` passed TypeScript and Vite (236 modules). No local browser capture, route activation or matched-width check was performed. The phone `1480:9087` frame is hidden and remains an open variant. No API/data change, automated tests, Docker, commit or push.

### Review Details desktop publication and action panel — 28.10.2026

Current-Copy `1480:6826` (1440×1905) places “Published 3 months ago” beside the author and shows a compact right panel with a heart/count, divider, “Rate” label and five stars. Updated `ReviewDetails.tsx` to put localized relative time from the existing `createdAt` field beside the author. The action panel now renders the live `review.likes` count with the existing authenticated like/unlike mutation or sign-in link, then the rating label/stars; authenticated stars still open the existing `RatingSheet`. Added UK/EN “Published” labels and `Intl.RelativeTimeFormat`; invalid timestamps fall back to the existing localized absolute date-time formatter. The desktop star palette now follows the frame's white active/gray inactive treatment. `npm run verify:build` passed TypeScript and Vite (236 modules). No runtime capture, matched geometry, click-through, automated tests, API/data changes, Docker, commit or push. Hidden phone frame `1480:9249` and all responsive/focus checks remain open.
