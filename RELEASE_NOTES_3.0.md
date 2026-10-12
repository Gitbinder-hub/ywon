# Ywoom 3.0

PWA + мобильная полировка + облако-заглушка (FAST_PROTOTYPE).

## Что нового (3.0)

- **PWA:** `manifest.webmanifest` + `sw.js` (offline shell cache, never /api) + `serviceWorker.register` на всех страницах + `beforeinstallprompt` кнопка «Установить как приложение» на главной.
- **Мобильная полировка:** `shell.css` safe-area, `standalone` tweak, `index` badge `3.0 · PWA + локально`, шторка онбординга `3.0`.
- **Облако (скоро):** бейдж/текст в Настройках — «Облако — скоро (TR-02/03/05)», без реального бэкапа.
- **Версия 3.0 везде:** `GET /api/version 3.0`, экспорт `version 3.0`, `DisplayVersion 3.0`, все HTML `3.0`, `manifest.json 3.0`.

Предыдущее: `2.9 массовый zip...`, `2.2 экспорт всех`, `1.0 фикс скилов`.

## Версии
- `GET /api/version 3.0`, экспорт `version 3.0`, `DisplayVersion 3.0`, все HTML `3.0`.
