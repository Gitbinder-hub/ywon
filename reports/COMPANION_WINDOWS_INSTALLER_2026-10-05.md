# Ywon Companion — неподписанный Windows-установщик 0.0.6 / REVIEW

Scope: переход от portable ZIP к EXE-установщику без покупки сертификата.
База — generic 0.0.5 (path-fix) + 0.0.4 payload (B-056). Unsigned пилот, не production/signing.

## Выбор пользователя
- Имя в Установке и удалении: `Ywon Companion` (DisplayName).
- Ярлык на рабочем столе: включён по умолчанию (чекбокс отмечен, `--silent` тоже ставит).
- Автозапуск: выключен по умолчанию (не пишет HKCU Run без галочки).

## Что собрано
- `outputs/companion-windows-installer-2026-10-05/Ywon-Companion-Setup-0.0.6.exe` (208 384 байт, sha256 `09bed4ba2f1022f458a32a0cbd808c772460a183b8d8d18a1281f89a1ad66540`, certutil совпадает, .sha256 рядом).
- `Ywon-Companion-0.0.6.zip` + .sha256 + `manifest.json` — внутренний payload (70 файлов, 186 558 байт, sha `f12fd17ca39d6b21a769e950bd67fca2177dbdeabea45215e669ce59fe3f8029`).
- `uninstall.exe` — отдельный деинсталлятор (6 656 байт), встраивается в Setup как ресурс `uninstall.exe`.
- Исходники установщика: `installer/YwonInstaller.cs` + `YwonUninstaller.cs`, сборка через `scripts/build_installer.py` только средствами .NET Framework 4.0 csc.exe — без скачки NSIS/Inno/WiX, без Rust/Tauri, без npm.

## Логика установщика (per-user, без UAC)
- Папка по умолчанию: `%LOCALAPPDATA%\Ywon\Ywon Companion` (можно менять в диалоге; silent — дефолт).
- Payload распаковывается встроенным `System.IO.Compression.ZipArchive` без внешней утилиты; path-traversal проверка.
- Ключ удаления: `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\YwonCompanion` (DisplayName/Publisher/DisplayVersion 0.0.6/InstallLocation/UninstallString/QuietUninstallString/DisplayIcon).
- Ярлыки WScript.Shell: `Start Menu\Ywon\Ywon.lnk` (+ `Uninstall…lnk`), опционально `Desktop\Ywon Companion.lnk` (включён по умолчанию, autostart — выключен). Цель — `Ywon.cmd` (fallback `START.cmd`), рабочая папка — install dir.
- Автозапуск: только если отмечен чекбокс → `HKCU\...\Run\YwonCompanion="...\Ywon.cmd"`; иначе ключ удаляется.
- Никаких изменений PATH, никакого бандла Node/Python, никакого сетевого доступа при установке.
- SmartScreen: ожидается предупреждение для неподписанного EXE — указано в диалоге и post-install сообщении (не обходится).

## Деинсталляция
- `uninstall.exe` (--silent для тихого) удаляет ярлыки, Run-ключ, Uninstall-ключ, планирует удаление папки через временный .cmd (ping 3s + rmdir). Пустая папка может остаться занятой до перезапуска проводника — это нормально для pilot-удаления; можно удалить вручную.
- Локальная ASR-среда (`local-asr-config`, `local-asr-runtime`, `E:/Ywon-ASR`) не трогается — ставится/удаляется отдельно через SETUP-ASR.

## Проверки в этой сессии (Windows 10 x64 19045, Node 24.19.0, Python 3.14.8)
- Сборка: csc winexe PASS, оба EXE собраны, sha совпадает с certutil.
- Тихая установка: `Ywon-Companion-Setup-0.0.6.exe --silent` → exit 0; папка `C:\Users\Marina\AppData\Local\Ywon\Ywon Companion` создана (24 элемента), ярлыки `Desktop\Ywon Companion.lnk` и `Start Menu\Ywon\Ywon.lnk` + `Uninstall…lnk` созданы, ключ Uninstall присутствует, Run-ключ отсутствует (как требуется).
- Удаление: `uninstall.exe --silent` → ярлыки и ключ Uninstall удалены, Run пуст; папка осталась пустой и занятой (известная особенность удаления на живой системе — отложенное удаление/ручная очистка).
- Повторная тихая установка/удаление проверена. Автозапуск OFF по умолчанию подтверждён (`reg query Run /v YwonCompanion` → not found).
- Исходный smoke `project.py validate` остаётся PASS (P0/not_started), Node/Python версии соблюдены.

## NOT_RUN / границы
- GUI-диалог установки на чистом профиле, смарт-скрин скриншот, автозапуск с галочкой, удаление с полной очисткой на перезагрузке — NOT_RUN в этой сессии (silent-проверка покрывает логику, но не визуал).
- Windows 11, реальный микрофон/ASR после установки, полный `npm test/typecheck` регресс, подписанный инсталлятор/MSIX/автообновление — вынесено за рамки B-057, остаётся TR-05/TR-06.
- Трей как лёгкий Node-скрипт (`Ywon-tray.ts`) — отложен; в B-057 ярлыки покрывают запуск. Подписанный MSI и background tray — future tasks после выбора сертификата.

## Переходы / откат
- TR-05/TR-06: ZIP → unsigned EXE выполнен в пределах одного bounded wrapper-блока без изменения `tasks/project.json`; production installer/signed update — отдельные будущие Q.
- Откат: удалить через Параметры → Приложения → Ywon Companion или `uninstall.exe`; при необходимости удалить `%LOCALAPPDATA%\Ywon` вручную. Старые portable ZIP (0.0.4/0.0.5) остаются резервом.
- Следующий шаг владельца: запустить Setup на чистом Windows 10/11, проверить меню Пуск/десктоп/Ywon.cmd, выполнить SETUP-ASR отдельно, затем smoke Windows 11.

## Артефакты
- `installer/YwonInstaller.cs`, `installer/YwonUninstaller.cs`, `scripts/build_installer.py` (новые), `reports/evidence/companion-windows-installer-2026-10-05.json` (ниже), `outputs/companion-windows-installer-2026-10-05/*`.
---

# B-058 — 2026-10-06 / REVIEW — silent-флаги автозапуска + tray-чекер (расширение B-057)

База B-057 (208384 / 09bed4ba...). В B-058 пересобран EXE без смены payload: `Ywon-Companion-Setup-0.0.6.exe` 208896 sha256 `813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d` certutil PASS, payload `Ywon-Companion-0.0.6.zip` 186558 sha `115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505`, `uninstall.exe` 7168. Исходники: патч `installer/YwonInstaller.cs:Main` (--autostart/--no-desktop/--no-autostart), `installer/YwonUninstaller.cs` (очистка пустого %LOCALAPPDATA%\Ywon), `scripts/build_installer.py` (--force), новый `apps/desktop-companion/Ywon-tray.ts` --check.

Новые silent-режимы:
- `--silent` → Desktop ON, Run YwonCompanion ABSENT (как B-057 OFF по умолчанию);
- `--silent --autostart` → Desktop ON, Run PRESENT -> "…\Ywon.cmd" (ON-ветка проверена);
- `--silent --no-desktop` → Desktop ABSENT, Start Menu остаётся, Run ABSENT;
- GUI-диалог без флагов — без изменений (чекбоксы Desktop=ON/Autostart=OFF).

Трей: `Ywon-tray.ts --check` — лёгкий Node-скрипт (Node 24 strip-types) без native tray/подписи: проверяет installDir, Ywon.cmd/START.cmd/uninstall.exe, Start Menu/Desktop lnk, HKCU Uninstall DisplayName, HKCU Run target. Native tray + фоновая служба — future после подписи.

Проверки этой сессии (Windows 10 19045, Node 24.19, Python 3.14, csc 4.0.30319):
- Сборка --force PASS; certutil совпадает с manifest/sha256.
- Три цикла silent-установки/удаления PASS: OFF-ветка (Run absent) → uninstall clean (dir удалён без reboot) → ON-ветка (Run present) → uninstall clean (Run removed) → --no-desktop (Desktop absent) → uninstall clean.
- `Ywon-tray.ts --check` PASS в установленном и в чистом состоянии (корректно сообщает MISS / not installed).
- project.py validate остаётся PASS (ожидается при финальной проверке).

NOT_RUN остаётся: GUI-диалог/SmartScreen screenshot, Windows 11, реальный микрофон ASR, signed MSI/MSIX/автообновление, native tray. Дефолты не менялись: DisplayName Ywon Companion, Desktop ON, autostart OFF.
---

# B-059 — 2026-10-06 / REVIEW — owner GUI verification supplement (расширение B-058)

Снимки владельца на профиле Marina закрывают NOT_RUN GUI-ветки из B-058:

- Диалог установки: заголовок Ywon Companion 0.0.6, текст «Установка Ywon Companion — локальный пилот Windows. Неподписанный EXE: SmartScreen покажет предупреждение — это ожидаемо.» + красное REVIEW-пилот, поле C:\Users\Marina\AppData\Local\Ywon\Ywon Companion (per-user, без админа), чекбокс «Ярлык на рабочем столе (вкл по умолчанию)» — отмечен, «Автозапуск при входе (выкл по умолчанию)» — не отмечен, кнопки Установить/Отмена.
- Диалог завершения: Ywon Companion установлен в: C:\Users\Marina\AppData\Local\Ywon\Ywon Companion, «Ярлык на рабочем столе создан. Автозапуск выключен», «Запустите Ywon.lnk из Пуск/рабочего стола. SmartScreen покажет предупреждение — ожидаемо.»
- Владелец: «всё остальное, кроме вин 11 проверил» — Ярлыки Start Menu Ywon/Ywon.lnk + Uninstall, Desktop Ywon Companion.lnk и удаление через Параметры — PASS на Win10 19045. Windows 11 smoke остаётся NOT_RUN. SmartScreen Windows protected your PC — ожидаемо для unsigned pilot, не обходится.

Артефакты без изменений от B-058: Ywon-Companion-Setup-0.0.6.exe 208896 sha256 813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d, payload 186558 sha 115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505 (70 файлов), uninstall.exe 7168, manifest.json. Источники installer/YwonInstaller.cs (Main --autostart/--no-desktop), YwonUninstaller.cs, scripts/build_installer.py (--force), apps/desktop-companion/Ywon-tray.ts --check.

NOT_RUN остаётся: Windows 11 матрица, реальный микрофон/ASR streaming корпус, signed MSI/MSIX/автообновление, native tray/service. project.py validate остаётся PASS.


---

# B-060 LARGE — 2026-10-06 / REVIEW — YwonTray native + Live ASR streaming 0.0.7 (расширение B-059)

Bounded LARGE добавляет к 0.0.6 (B-059) два крупных блока: native tray и streaming ASR живьём.

**Tray** `installer/YwonTray.cs` 9325 → `YwonTray.exe` 13312 sha `9380b4f1a5e9dfe348410124ae0c28bc8ef504deca88fbe0fb7abd6160719853` (csc 4.0 winexe, иконка `SystemIcons.Application`, русификация `\uXXXX` escapes). Запуск `START.cmd/Ywon.cmd` через `ProcessStartInfo CreateNoWindow/RedirectStandardOutput/WindowStyle.Hidden/BeginOutputReadLine`; `OnOutput` ловит `http://127.0.0.1:\d+` → `Process.Start(url)` или `ShowBalloonTip` если `--minimized`; `Timer 1800ms` → автоповтор. Контекст-меню: Открыть Ywon (браузер) / Проверить установку (`DoCheck()` → HKCU Uninstall+Run + lnc, rc0/2) / Настройка ASR (`SETUP-ASR.cmd` via `cmd /c start`) / Выход (kill server + `tray.Visible=false`). Флаги `--help/--check/--minimized` (help/check с `AllocConsole/AttachConsole(-1)`, help non-blocking при `IsOutputRedirected`).

**Live streaming**: `workers/companion/asr_stream_worker.py` 5249 (persistent, фрейм 4-byte LE len, `0`=finalize, `0xFFFFFFFF`=exit, частичный/final JSON) + `packages/companion/src/asr-stream-process.ts` 10194 sha `29342bed` (`VoskStreamProcess` queue+waiters, `sendChunk` даже ≤32000 + `finalize/close` + совм. `recognize`) + `packages/companion/src/audio-host.ts` 17646 (роут `POST /api/audio/asr-stream` chunked `application/octet-stream` `x-Ywon-sample-rate=16000` + `x-Ywon-session/sequence/last`, гейты `lane.enabled+voice.active`, `lastSequence` tick) + `apps/desktop-companion/pcm-stream-capture.mjs` 1632 (`AudioWorkletProcessor Ywon-pcm-stream` flush 1024) + `apps/desktop-companion/audio-client.mjs` 13915 (`window.YwonStartLiveStream()` → worklet → `fetch` chunk `X-Ywon-Last:0/1`, `partial→{transcript}` live, `final→apply`).

**Сборка 0.0.7**: `payload_stage` 75 файлов → `Ywon-Companion-0.0.7.zip` 202570 sha `3266ffbf1253f37880115f7493e4981a0dbe2d09a89e9580d5f2519302ad61af` → `Max\Ywon\Ywon Companion` + ярлыки `Start/Ywon.lnk`+`Desktop` + ключи `HKCU Uninstall/Run`, SmartScreen ожидаемо для unsigned pilot (дефолты без изменений: desktop ON, autostart OFF).

**Верификация 2026-10-06**: `C:\Temp\YwonTray.exe` и `payload_stage/YwonTray.exe` обе 13312 sha `9380b4f1` RC0; `--help` RC0 (TIMEOUT исправлен) и `--check` RC0 `OK installDir/Ywon.cmd/START.cmd/uninstall.exe + OK Start/Desktop lnc + OK HKCU Uninstall` — PASS на живой системе Marina; статика tray/stream grep PASS; `project.py validate` PASS. Live GUI tray (иконка/баллун/авто-открытие браузера) и живой микрофон/Vosk модель — CODE_WRITTEN_NOT_LIVE_VERIFIED, нужен клик `payload_stage/YwonTray.exe --minimized` и Node прогон с `vosk-model-small-ru-0.22`.

Артефакты: `outputs/companion-windows-installer-2026-10-06/Ywon-Companion-Setup-0.0.7.exe` + `.sha256` + `manifest.json` + `payload_stage/` + `uninstall.exe`, evidence `reports/evidence/companion-windows-installer-2026-10-06.json` (B-060 LARGE 0.0.7), handoff `bootstrap/B060_HANDOFF.md`, `C:\Temp\YwonTray.exe` синхронизирован.
