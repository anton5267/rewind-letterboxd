# Rewind — поточний прогрес

Оновлено 02.11.2026. Основний редизайн, Member Home і Search no-match follow-ups доставлені в `master`, поточний commit `47b70a2`; CI run `41408245386` зелений. На поточному Docker runtime цільово пройшли Profile/Social, Home guest, Search/Films, Journal та Admin API-supported suites (48/48). Це підтверджує поведінку зазначених станів, але не є новим matched-source pixel review. Наступний порядок — незакриті Lists/Person та інші READY стани, придатні source exports і фізичне device acceptance; підтверджені API/data gaps лишаються окремо. Пріоритети й зовнішні залежності зведено у [поточному плані](../../PLAN.md#актуальний-план-завершення--02112026). Детальні докази — у [release evidence](../operations/RELEASE_EVIDENCE.md), frame-рівневі статуси й відмінності — у [матриці Figma](../frontend/FIGMA_SCREEN_CANDIDATES.md).

## Останній follow-up

- Member Home READY `473:492`/`1327:3210` повторно звірено з актуальними Figma зображеннями. Source Vite і Docker пройшли1/1: API-backed Home, контрольований Journal503→Retry і фокус, UK/EN, ширини320–1440 без overflow; desktop anchors1049/1487/1927/2300 збігаються, повна довжина та mobile content мають невеликі/API-зумовлені відмінності. Mobile section titles виправлено до16px; desktop vertical rhythm стиснено. `npm run verify:build` і Docker production build пройшли технічно. Новий Docker web `sha256:c9c9a24a…`; API, `.env` та DB volume без змін. [Evidence](../operations/RELEASE_EVIDENCE.md#member-home-current-ready-pair-runtime-and-recovery--02112026).
- Search empty READY `1480:5809`/`1480:8856` reread and paired to current source. Empty-state section/heading and home action were aligned on phone; desktop EN now fits the source's two-line title, CTA y608.7 vs610, footer y774. Source Vite and Docker scoped E2E passed1/1 each; `npm run verify:build` passed. Docker web is now `sha256:46a823e0…`, API, `.env`, DB volume unchanged. Delivery commit `24ea8d2` is pushed; CI `41407982157` passed. Screenshot pair and measurements: [release evidence](../operations/RELEASE_EVIDENCE.md#global-search-no-match-current-ready-pair-and-runtime--02112026).

- Movie Share більше не показує хибне «Збережено»: native Share завершується без цього повідомлення; clipboard fallback повідомляє «Посилання скопійовано» UK/EN. Скасування native Share не створює помилки.
- Виправлено race у Search E2E: desktop auto-applies рік під час зміни поля, тож очікування запиту тепер встановлюється до зміни. `search-controls.spec.ts` пройшов9/9.
- `npm run verify:build` пройшов. Оновлений локальний Docker web `sha256:ca5c4aa6…`; API image незмінний `sha256:800f5b48…`. `.env` hash і DB volume збережені.
- Повний Docker Playwright:157 passed,0 failed,27 fixture-gated skips. Disposable Admin runs:12/12 і15/15 passed; разом184 сценарії успішні. Release responsive matrix1/1, accessibility5/5, ActionSheet flow1/1. Знімки/дані fixtures та cleanup описані в evidence.

## Що ще не можна закрити лише frontend-кодом

- Реальну OS Share-панель, екранну клавіатуру телефону та системний browser zoom200% не вдалося перевірити: Windows automation не зміг перелічити вікна, а Playwright Share-тест підміняє `navigator.share`. Потрібен справжній мобільний браузер/пристрій для фізичного приймання; симуляцію не видаємо за OS-перевірку.
- Admin Moderation/report/edit, низка Admin-полів, ranked-list semantics, редакційні Featured/Crew feeds, Journal collage/inline media та частина профільних полів — документовані API/data gaps. Додаткові endpoint/DTO/міграції не додаємо без окремого підтвердження контракту.
- Деякі READY джерела приховані або мають screenshot1×1; приклади Dune, Journal, actor phone та окремих постерів відсутні в реальному API. Матриця позначає це як source/data limitation, не як підтверджену pixel parity.

Залишок для проєкту зведений у `PLAN.md`: актуалізувати frame-level open/pending записи з урахуванням пізніших доказів, закривати лише незавершені supported UI states, отримати 1×1 READY source exports та виконати device acceptance для OS Share/keyboard/zoom. Погоджені API/data gaps лишаються документованими. Дипломні артефакти й локальний `AGENTS.md` залишаються поза комітами.
