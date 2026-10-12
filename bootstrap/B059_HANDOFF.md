# B-059 — owner GUI verification / REVIEW

Base B-058 (Setup 208896 sha 813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d, payload 186558 sha 115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505, uninstall 7168). Bounded docs-only supplement, без кода/sign/paid, без tasks/project.json, без пересборки.

## What owner verified 2026-10-06
- Профиль Marina, Windows 10 19045 x64 (скрины): диалог Ywon Companion 0.0.6 — per-user папка C:\Users\Marina\AppData\Local\Ywon\Ywon Companion, чекбоксы Desktop ON (вкл) / autostart OFF (выкл), кнопки Установить/Отмена + предупреждения SmartScreen unsigned + REVIEW-пилот.
- Диалог успеха: установлен в тот же путь, ярлык на рабочем столе создан. Автозапуск выключен, запуск через Ywon.lnk (Пуск/Ywon или десктоп).
- Дополнительно владелец: всё остальное, кроме вин 11 проверил — ярлыки Start Menu\Ywon\Ywon.lnk + Uninstall Ywon Companion.lnk, Desktop\Ywon Companion.lnk и удаление через Параметры -> Приложения -> Ywon Companion (Uninstall key HKCU\...\YwonCompanion, Run HKCU\...\Run\YwonCompanion когда вкл) — PASS. Дефолты DisplayName Ywon Companion, desktop ON, autostart OFF из B-057 сохранены.

## Evidence
- Скрины в чате 2026-10-06 (2 PNG) — диалог и успех — хранятся как owner verification в evidence JSON.
- Обновлён reports/evidence/companion-windows-installer-2026-10-06.json (поле ownerGuiVerified + checks).
- Обновлён reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md (B-059 appendix).
- Новые bootstrap/B059.json + B059_HANDOFF.md, prepend bootstrap/STATUS.md.

## NOT_RUN / temporary
- Windows 11 матрица (VM нет) — NOT_RUN.
- Реальный микрофон/ASR streaming корпус / семейные/TV/echo/VAD, single-activation dialogue, TR-10 duplex — NOT_RUN.
- Signed MSI/MSIX, auto-update, native tray/service, background eligibility — NOT_RUN (требуют подписи/отдельных Q).
- SmartScreen Windows protected your PC скрин — expected для unsigned pilot, не обходится; отдельный скрин не требуется для REVIEW.

## Transitions / rollback
TR-05/TR-06: wrapper остаётся unsigned REVIEW-пилотом; public signing/distribution — future gates после выбора сертификата, не closed. P0/not_started, project.py validate PASS. Откат: uninstall.exe --silent или Параметры -> Удалить -> при занятой папке удалить %LOCALAPPDATA%\Ywon вручную. Старые portable ZIP 0.0.4/0.0.5 — резерв.
