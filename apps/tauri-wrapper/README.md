# Tauri wrapper Q-046 — 1 .exe для чайников (offline prototype)

Офлайн прототип: окно без `127.0.0.1` в адресе, меню Архитектор/Мастерская/Биржи/Баланс.
Тихий preflight, доустановка по уведомлению, без Pro. Ключи НЕ вшивать в exe — `CLEAN_API_KEY` живёт на сервере (`apps/api → model-switch`), юзер пополняет баланс → кредиты.

Требует Rust + WebView2 — сборка отдельным P6 live task с approved budget.
Текущий `Qvuna-Companion-Setup-0.0.8.exe` (outputs/companion-windows-webview-2026-10-06) остаётся пилотом до Tauri.
Секреты только в `process.env`/`DATABASE_URL`/`S3_*`, не в `packages/*`.

Дальше: `cargo tauri build` с pinned версиями + signing/updater/licence по ADR 0007.
