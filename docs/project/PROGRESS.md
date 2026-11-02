# Rewind — поточний прогрес

Оновлено 02.11.2026. Основний редизайн і delivery завершені: `8134fc7` (код) і `43206ee` (release receipt) у `master`; обидва GitHub CI успішні. Детальні докази — у [release evidence](../operations/RELEASE_EVIDENCE.md), frame-рівневі статуси й відмінності — у [матриці Figma](../frontend/FIGMA_SCREEN_CANDIDATES.md).

## Останній follow-up

- Movie Share більше не показує хибне «Збережено»: native Share завершується без цього повідомлення; clipboard fallback повідомляє «Посилання скопійовано» UK/EN. Скасування native Share не створює помилки.
- Виправлено race у Search E2E: desktop auto-applies рік під час зміни поля, тож очікування запиту тепер встановлюється до зміни. `search-controls.spec.ts` пройшов9/9.
- `npm run verify:build` пройшов. Оновлений локальний Docker web `sha256:ca5c4aa6…`; API image незмінний `sha256:800f5b48…`. `.env` hash і DB volume збережені.
- Повний Docker Playwright:157 passed,0 failed,27 fixture-gated skips. Disposable Admin runs:12/12 і15/15 passed; разом184 сценарії успішні. Release responsive matrix1/1, accessibility5/5, ActionSheet flow1/1. Знімки/дані fixtures та cleanup описані в evidence.

## Що ще не можна закрити лише frontend-кодом

- Реальну OS Share-панель, екранну клавіатуру телефону та системний browser zoom200% не вдалося перевірити: Windows automation не зміг перелічити вікна, а Playwright Share-тест підміняє `navigator.share`. Потрібен справжній мобільний браузер/пристрій для фізичного приймання; симуляцію не видаємо за OS-перевірку.
- Admin Moderation/report/edit, низка Admin-полів, ranked-list semantics, редакційні Featured/Crew feeds, Journal collage/inline media та частина профільних полів — документовані API/data gaps. Додаткові endpoint/DTO/міграції не додаємо без окремого підтвердження контракту.
- Деякі READY джерела приховані або мають screenshot1×1; приклади Dune, Journal, actor phone та окремих постерів відсутні в реальному API. Матриця позначає це як source/data limitation, не як підтверджену pixel parity.

Після останнього follow-up обов’язкові локальні build і браузерна регресія завершені. Наступні зміни — лише для нового Figma від дизайнера, підтверджених API/data рішень або конкретно виявленого дефекту. Дипломні артефакти й локальний `AGENTS.md` залишаються поза комітами.
