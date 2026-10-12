# B-060 LARGE — tray + live ASR streaming / REVIEW

Base B-059/B-058 (0.0.6 Setup 208896 sha 813525bc, payload 186558 sha 115fedc, uninstall 7168).
Bounded LARGE без tasks/project.json, без paid/sign, без переключения production.

## Что сделано 2026-10-06
- **YwonTray.exe native tray** `installer/YwonTray.cs` 9325 bytes → winexe 13312 sha `9380b4f1a5e9dfe348410124ae0c28bc8ef504deca88fbe0fb7abd6160719853` (csc 4.0). Фичи: `DefaultDir()` → `%LOCALAPPDATA%\Ywon\Ywon Companion`, `DoCheck()` → HKCU `Uninstall/YwonCompanion`+`Run/YwonCompanion` + lnc `Start/Ywon.lnk`+`Desktop` (rc 0 если dirOk иначе 2, non-blocking когда `Console.IsOutputRedirected`), `RunSetupAsr()` → `cmd /c start SETUP-ASR.cmd` с `UseShellExecute`, `StartServer()` → `CreateNoWindow/RedirectStandardOutput/WindowStyle.Hidden/BeginOutputReadLine`, `OnOutput()` → Regex `http://127\.0\.0\.1:\d+` → capture url → `Process.Start(url)` или `ShowBalloonTip` если `--minimized`, `Main()` → парсит `--minimized/--check/--help` + `EnableVisualStyles`+`NotifyIcon`+`ContextMenuStrip` (Открыть Ywon/Проверить установку/Настройка ASR/Выход + separator) + `Timer 1800ms` → `Application.Run`, на `Exit` → `tray.Visible=false; server.Kill`. Русификация через `\uXXXX` escapes (cp1252-safe). Фикс winexe: `AllocConsole/AttachConsole(-1)` перед `--help/--check`, второй фикс `--help` не блокирует автоматику (`UserInteractive && !Redirected` перед MessageBox + Flush).
- **Live ASR streaming**: `workers/companion/asr_stream_worker.py` 5249 sha `5387c75` (persistent, 4-byte LE, `0`=finalize, `0xFFFFFFFF`=exit) + `packages/companion/src/asr-stream-process.ts` 10194 sha `29342bed` (VoskStreamProcess `sendChunk(≤32000 even)/finalize/close/recognize` queue+waiters, timeoutMs, sha256+duration валидация) + `packages/companion/src/audio-host.ts` 17646 sha `16609f95` (импорт VoskStreamProcess, опция `AudioHostOptions.asrStream`, asset `pcm-stream-capture.mjs`, роут `POST /api/audio/asr-stream` chunked `application/octet-stream`+`x-Ywon-sample-rate=16000`, заголовки `x-Ywon-session/sequence/last`, gates `lane.enabled+voice.active+validId`, `lastSequence` tick, `sendChunk/finalize`) + `apps/desktop-companion/pcm-stream-capture.mjs` 1632 sha `8a5c60` (AudioWorkletProcessor `Ywon-pcm-stream` flush 1024) + `apps/desktop-companion/audio-client.mjs` 13915 sha `a834c2a3` (hook `window.YwonStartLiveStream()` → worklet `pcm-stream-capture.mjs` → `fetch /api/audio/asr-stream` с `X-Ywon-Last:0/1`, `partial→transcript live`, `final→apply`).
- **Сборка 0.0.7**: `outputs/companion-windows-installer-2026-10-06/payload_stage` 75 файлов (70 база + `asr-stream-process.ts`+`pcm-stream-capture.mjs`+обновлённые host/client/workers/cs) → `Ywon-Companion-0.0.7.zip` 202570 sha `3266ffbf1253f37880115f7493e4981a0dbe2d09a89e9580d5f2519302ad61af` → `uninstall.exe` 7168 sha `fa583b59` → `Ywon-Companion-Setup-0.0.7.exe` 224768 sha `e6078cc3b2d13cc66316ba949e13862be9651c33ae98a2879be4a910a93f9f73` (winexe, payload+uninstall как ресурсы, ZipArchive path-traversal check, per-user). `manifest.json`/`.sha256` рядом. `C:\Temp\YwonTray.exe` синхронизирован со stage.

## Верификация
- `C:\Temp\YwonTray.exe` + stage: оба 13312 sha `9380b4f1`, `csc RC0`. Runtime: `--help` RC0 out help text без TIMEOUT (исправлено), `--check` RC0 `Ywon Companion check: OK installDir/Ywon.cmd/START.cmd/uninstall.exe + OK Start/Ywon.lnk + OK Desktop lnk + OK HKCU Uninstall DisplayName: Ywon Companion + (absent) Run OFF` — PASS на живой системе Marina. `--help/--check` с `AllocConsole` теперь non-blocking для автоматики. Статика `DoCheck/StartServer/OnOutput/Main/UiStrings` проверена grep-ом.
- Streaming: синтаксис `asr-stream-process.ts`/`audio-host.ts`/`audio-client.mjs`/`pcm-stream-capture.mjs`/`asr_stream_worker.py` — PASS, `payload_stage` идентичность PASS. Live микрофон/Vosk модель — CODE_WRITTEN_NOT_LIVE_VERIFIED (нужен реальный `vosk-model-small-ru-0.22` + Node live run, не гонялся в headless-сессии).
- `project.py validate` PASS. `status` показывает нет TODO-задач в текущей фазе (ожидается для bootstrap REVIEW-пилотов).
- GUI tray live (иконка/баллун/авто-открытие браузера по URL) — NOT_RUN, нужен клик владельца по `payload_stage/YwonTray.exe --minimized`.

## Артефакты
- `outputs/companion-windows-installer-2026-10-06/Ywon-Companion-Setup-0.0.7.exe` + `.sha256` + `Ywon-Companion-0.0.7.zip` + `.sha256` + `manifest.json` + `payload_stage/` (75 files) + `uninstall.exe`
- `installer/YwonTray.cs` 9325, `C:\Temp\YwonTray.exe` 13312
- `reports/evidence/companion-windows-installer-2026-10-06.json` (schema 1, B-060 LARGE)
- Этот handoff + prepend `bootstrap/STATUS.md` + appendix в `reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md`

## NOT_RUN / transitions
- Windows 11, signed MSI/MSIX/auto-update, native service/background eligibility — NOT_RUN (требует подписи/отдельных Q).
- Реальный микрофон/ASR streaming корпус, семейные/TV/echo/VAD, single-activation dialogue, TR-10 duplex — частично кодом закрыто, live-тест остаётся NOT_RUN.
- Tray balloon/auto-open — код готов, GUI-live NOT_RUN.
- `scripts/build_installer.py` остаётся 0.0.6; 0.0.7 собран через `build_007a.py`+`build_007b.py`/`recompile_tray2.py` из `payload_stage` — future unification в отдельный флаг `--ver 0.0.7` (не в этом handoff).
- Откат: `uninstall.exe --silent` или Параметры → Удалить; при занятой папке удалить `%LOCALAPPDATA%\Ywon` вручную. Резерв: 0.0.6 артефакты в `outputs/companion-windows-installer-2026-10-05`.
