# Rewind — докази перевірок

Оновлено 20.10.2026, Europe/Berlin. Це локальні результати. Реалізацію зупинено за командою користувача. Останній full frontend передує Home/Search, Lists та Profile/Community; окремі targeted runs не підсумовуються в один full. Production не розгорнуто.

## Актуальні checkpoints

| Блок | Результат | Межа підтвердження / доказ |
| --- | --- | --- |
| CI повторення на чистій MySQL | Backend `87 tests`, failures/errors/skips 0; frontend `tsc` і Vite build PASS; Caddy config valid | 20.10.2026, окрема тимчасова MySQL 8.4 на 3308 прибрана після перевірки. Два тести, що впали в [попередньому GitHub run](https://github.com/anton5267/rewind-letterboxd/actions/runs/39322186922), пройшли зі своїми fixtures. [GitHub CI для `f0df409`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39485802412) — PASS, 5m29s. |
| Profile/Community build | PASS 20:54:20–20:54:41, 21.343 s; 213 modules, entry 323.74 kB/gzip 105.23 kB; 135 hashes, drift 0 | Усі поточні frontend files збігаються після user stop; `frontend/test-results/profile-community-build-final-20261020/` |
| Profile review poster contract | Backend 2 PASS, frontend 3 PASS; errors/skips/retries 0 | DB-free actual service→controller JSON: review movies поза recent 10, nullable image; intercepted UI UK/EN × 4 widths та omitted-field compatibility. Main API image ще старий. `backend/target/profile-review-contract-20261020_205031/`, `frontend/test-results/profile-review-posters-compatible-20261020_205200/` |
| Profile/Community focus/Chrome | CSS 24 views/80 focus/120 hit points; root 20 loaded views, overflow/console 0; Community keyboard 1 PASS | [Зведений доказ](../../artifacts/profile-community-verification-20261020.json). Search empty/reset/Enter, old API real review poster loaded; viewport reset, own tab closed. All controlled API writes 0. Community initial assertion race fixed by exact expect.poll; failed report retained |
| Lists combined build | PASS 20:26:45–20:27:02, 17.329 s; 213 modules, entry 323.74 kB / gzip 105.23 kB; 134 hashes, drift 0 | Після останніх modal focus/backdrop fixes. `frontend/test-results/lists-build-final-20261020/post-focus/` |
| Lists Header / dialog | Окремо 10/10 Header, 21.628 s і 2/2 UK/EN modal, 7.727 s; skipped/flaky/retries 0 | Back 44 px/corner, 5 bottom links; Tab/Escape/Done/backdrop/focus, resize 768 → h1, tag route, pending/503/retry. HTTP intercepted: server writes 0; 4 intentional 503 console errors, інших 0. Reports `frontend/test-results/list-mobile-header-20261020_201503/` і `list-information-modal-20261020_202618/` |
| Lists layouts | Catalog 10 scenarios; editor 32 state views; overflow/pageerrors 0 | Catalog preview 0/1/3/5 без додаткових API rows; editor UK/EN × 320/393/768/1440 × 4 states, controlled CRUD/reorder/guards. Final CSS paint перевірено окремо. [Lists evidence](../../artifacts/lists-verification-20261020.json) |
| Lists real Chrome | 16 loaded views, overflow/errors/warnings 0, 1 main; viewport reset | Create/system-selected/public-empty/landing× 4 widths; 393 фактично 394. Реальний authenticated API, business mutations 0. Фінальний dialog resize/focus повторено після source fixes |
| Home/Search build | PASS 19:43:16–19:43:32, 16.433 s; 213 modules, entry 322.40 kB / gzip 104.81 kB; 134 hashes, drift 0 | [Home/Search evidence](../../artifacts/home-search-verification-20261020.json); build `frontend/test-results/home-search-build-final-20261020/post-rail-focus/` |
| Home/Search behavior / Chrome | Search 4/4 і Home 2/2 окремо; root 8 loaded views, overflow/console 0 | URL/Back, native select/roving tabs, real empty/counts. Controlled UK/EN states і фактичний paint після CSS fixes — у тому самому evidence. Anonymous smoke мав 8 очікуваних 401 та 8 aborted refresh; інших errors 0 |
| Останній full frontend | 108 passed, 0 failed/skipped/flaky/retries; 267.816 s, 18:40:42–18:45:10 | Movie/Review/auth Profile checkpoint, headed Chrome, video/trace OFF. Workspace `.codex-backups/rewind-figma-20261020-a7c84e21/full-corrected-20261020_184029/playwright-final.json` |
| Попередній full backend | 85 tests/39 classes, failures/errors/skips 0 | Передує новому additive ProfileReview moviePhotoUrl; `backend/target/backend-regression-csrf-final-20261020_163753/` |

Lists modal спочатку мав 0/2 через втрату focus після default backdrop mousedown; `preventDefault` виправив дефект, failed report `list-information-modal-20261020_202518/` збережений. Header 10 передують dialog edits; фактичний Back hit root перевірив після JSX wrapper. Поведінкові editor/Home/Search checks передують останнім CSS-only corrections; для них є окремі фінальні paint proofs.

Старий результат 31 passed / 12 skipped був без admin credentials. У новому full admin fixture надається явно, skips 0. Попередні failures і проміжні runs не зараховуються до нових passing totals.

## Локальний runtime і дані

Поточний frontend source — Vite 5173; Docker web 3000 містить попередній Movie/Review/Profile image `90f98717c23438771df0d3a847bdaf94c85d1b6a9145d15705adfb0274445817`. API image — `08f91c3e29b45bae1f83123a7248b024158bb6deeb74b9e663b7cd549662fd0a`. Після Home/Search, Lists і Profile/Community Docker не оновлювався; latest API field лишається source/test verified, old API supported.

Попереднє оновлення лише API/Web пройшло 18:50:26–18:51:13: API health UP, web 200, served bundle SHA збігався; 38 table counts, 31 Flyway rows та env збережені. Старі images лишилися для rollback. Докази: workspace `.codex-backups/runtime-refresh-preflight-20261020_1842/refresh-1849/`; [Chrome runtime proof](../../artifacts/local-release-chrome-20261020.json). Isolated full стек прибрано 18:46:57: власних containers/volumes/networks 0/0/0, основні 6 контейнерів не змінені.

Один підготовчий discovery run був перерваний після 2 Home cases. Register/login і 2 disposable lists справді досягли main API: це **не writes 0 для всього Lists блоку**. Наявний helper видалив exact account 7924 із 204; root незалежно отримав JSON 404 для нього та lists 18751/18752. [Cleanup proof](../../artifacts/lists-interrupted-fixture-cleanup-20261020.json). Історичні main data не очищали; raw traces лишилися приватними.

## Джерела додаткових доказів

Шляхи `frontend/`, `backend/`, `artifacts/` — від кореня Git. Workspace `.codex-backups/` — поза Git.

- Lists catalog: `.codex-backups/lists-catalog-checks-20261020/source-freeze-4.json` і `desktop-paint-freeze4/summary.json`; editor: `.codex-backups/user-lists-alignment-before-20261020_1950/handoff-summary.json`; Header/modal: `.codex-backups/list-mobile-header-20261020_201503/handoff-summary.json`. Catalog freeze3 typography limitation закрита freeze4.
- Movie/Review/Profile build: `frontend/test-results/figma-alignment-build-final-20261020/`; focused cases — `movie-mobile-alignment-20261020-v2/`, `review-alignment/`, `profile-alignment-20261020/`, `detail-header-20261020/`. [Реальний Chrome smoke](../../artifacts/figma-movie-review-smoke-20261020.json).
- Локальний Figma `.fig`, focused raw nodes/image mappings і PNG provenance — `.codex-backups/figma-local-copy-20261020/`. Це read-only reference, не повний REST/variables export; frames — лише у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).
- Попередні CSRF, proxy/navigation, Community/Admin/Auth, password і backup/config checks збережені у повному звіті перед скороченням: `.codex-backups/docs-cleanup-before-20261020_2035/docs/operations/RELEASE_EVIDENCE.md`. Generated reports та images збережені на своїх місцях.
- Документація: повний SHA-verified backup 20 MD — `.codex-backups/docs-cleanup-before-20261020_2035/manifest.json`. Після cleanup окремо перевіряються links/anchors і application source hashes; результат — `artifacts/docs-cleanup-verification-20261020.json`. Це не новий application regression.

## Межа релізу

Роботу призупинено користувачем; повний підсумок і незастосований останній PublicProfile composition крок — у [PROGRESS](../project/PROGRESS.md).


Локальний Compose/config audit не підтверджує production. Відкриті: решта UI variants/fonts, погоджені Journal UK/EN articles/covers/audio/dates, TMDB key rotation, production credentials/VPS/domain/HTTPS, mail/scheduler/monitoring/backup-restore на цільовому середовищі. Наступні задачі — [PLAN](../../PLAN.md), розгортання — [DEPLOYMENT](DEPLOYMENT.md). Користувач уже має відео; нового запису немає.
