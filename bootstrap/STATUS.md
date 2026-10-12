# YwonTray LARGE + Live ASR streaming 0.0.7 — 2026-10-06 / REVIEW (B-060 LARGE)

Bounded LARGE на базе B-059 0.0.6: native `YwonTray.exe` (трей + авто-открытие `http://127.0.0.1:PORT`, меню Открыть/Проверить/Настройка ASR/Выход, `--minimized/--check/--help`) + Live ASR streaming (`asr_stream_worker.py` persistent 4-byte LE `0`=finalize `0xFFFFFFFF`=exit + `VoskStreamProcess` + `audio-host.ts /api/audio/asr-stream` + `pcm-stream-capture.mjs`+`audio-client.mjs YwonStartLiveStream`). YwonTray `installer/YwonTray.cs` 9325 → winexe 13312 sha `9380b4f1a5e9dfe348410124ae0c28bc8ef504deca88fbe0fb7abd6160719853` (csc 4.0, русификация `\uXXXX` escapes, `AllocConsole/AttachConsole` для winexe, `--help` non-blocking `UserInteractive && !Redirected` + Flush — исправлен TIMEOUT). Runtime `--help` RC0 help text, `--check` RC0 `OK installDir/Ywon.cmd/START.cmd/uninstall.exe/Start+Desktop lnc/HKCU Uninstall` на живой системе Marina PASS. Streaming: `asr-stream-process.ts` 10194 sha `29342bed` + `audio-host.ts` 17646 `x-Ywon-*` chunked 32k + `pcm-stream-capture.mjs` 1632 `Ywon-pcm-stream` 1024 + `audio-client.mjs` 13915 live fetch `X-Ywon-Last` — синтаксис и payload_stage идентичность PASS, live микрофон/Vosk модель CODE_WRITTEN_NOT_LIVE_VERIFIED. Сборка `Ywon-Companion-Setup-0.0.7.exe` 224768 sha `e6078cc3b2d13cc66316ba949e13862be9651c33ae98a2879be4a910a93f9f73` + `Ywon-Companion-0.0.7.zip` 202570 sha `3266ffbf1253f37880115f7493e4981a0dbe2d09a89e9580d5f2519302ad61af` + `uninstall.exe` 7168 + payload_stage 75 файлов (manifest/sha256 рядом). `project.py validate` PASS. GUI tray live (иконка/баллун/авто-открытие) и живой микрофон — NOT_RUN, нужен клик владельца по `payload_stage/YwonTray.exe --minimized` и Node run с моделью. Handoff `bootstrap/B060_HANDOFF.md`, evidence `reports/evidence/companion-windows-installer-2026-10-06.json` (0.0.7), manifest `outputs/companion-windows-installer-2026-10-06/manifest.json`, `C:\Temp\YwonTray.exe` синхронизирован.

---

# Owner GUI verified — 2026-10-06 / REVIEW (B-059 supplement to B-058)

Скрины владельца (профиль Marina) закрывают GUI-NOT_RUN из B-058: диалог Ywon Companion 0.0.6 — папка C:\Users\Marina\AppData\Local\Ywon\Ywon Companion (per-user, без админа), Desktop ON отмечен / autostart OFF не отмечен, кнопки Установить/Отмена; диалог завершения — установлен в .../Ywon Companion — ярлык создан, автозапуск выключен — Ywon.lnk Пуск/десктопа, SmartScreen ожидаем. Владелец: всё остальное, кроме вин 11 проверил — Пуск/Ywon/Ywon.lnk + Uninstall, Desktop lnk и удаление через Параметры (ключи/ярлыки/%LOCALAPPDATA%/Ywon) — PASS на Win10 19045 x64. Win11/mic/signed/native tray остаются NOT_RUN. Артефакты без пересборки от B-058: Setup 208896 sha256 813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d + payload 186558 sha 115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505 (70 файлов) + uninstall 7168. project.py validate PASS. Handoff bootstrap/B059_HANDOFF.md, evidence reports/evidence/companion-windows-installer-2026-10-06.json (ownerGuiVerified), report reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md (B-059 appendix).

---

# Unsigned installer — autostart CLI + tray-check — 2026-10-06 / REVIEW (B-058)

B-057 extended bounded: `YwonInstaller.cs:Main` now parses `--autostart`/`--no-desktop` for silent branch; `YwonUninstaller.cs` cleans empty `%LOCALAPPDATA%\Ywon`. Rebuilt per-user EXE `Ywon-Companion-Setup-0.0.6.exe` 208896 sha256 `813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d` certutil PASS via `scripts/build_installer.py --force` (csc 4.0 winexe), payload 186558 sha `115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505` + `uninstall.exe` 7168. `apps/desktop-companion/Ywon-tray.ts --check` (Node 24 strip-types) checks installDir/shortcuts/registry without native tray (needs signing).

Windows 10 19045 x64 Node24.19 Python3.14 csc4.0.30319: three silent cycles PASS — `--silent` (Run ABSENT, Desktop ON) → uninstall clean (dir gone) → `--silent --autostart` (Run PRESENT -> Ywon.cmd) → uninstall clean (Run removed) → `--silent --no-desktop` (Desktop ABSENT) → uninstall clean. tray --check PASS both installed/clean. Defaults unchanged (DisplayName Ywon Companion, desktop ON, autostart OFF). GUI/SmartScreen/Windows 11/mic/signed MSI/native tray NOT_RUN. Handoff: `bootstrap/B058_HANDOFF.md`, evidence: `reports/evidence/companion-windows-installer-2026-10-06.json`, report: `reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md` (B-058 appendix), manifest: `outputs/companion-windows-installer-2026-10-05/manifest.json`.

---

# Unsigned Windows installer 0.0.6 — 2026-10-05 / REVIEW (B-057)

Per-user EXE without admin (DisplayName `Ywon Companion`, desktop shortcut ON, autostart OFF) built with only .NET 4.0 csc.exe/winexe (no NSIS/Inno/WiX/Tauri). `Ywon-Companion-Setup-0.0.6.exe` (208384, sha256 `09bed4ba2f1022f458a32a0cbd808c772460a183b8d8d18a1281f89a1ad66540`, certutil matches) + payload `Ywon-Companion-0.0.6.zip` (70 files, 186558, `f12fd17ca39d6b21a769e950bd67fca2177dbdeabea45215e669ce59fe3f8029`) + `uninstall.exe` (6656) produced by `scripts/build_installer.py` from `installer/YwonInstaller.cs` + `YwonUninstaller.cs` embedding payload as resource and extracting via ZipArchive with path-traversal check to `%LOCALAPPDATA%\Ywon\Ywon Companion`. Registry `HKCU\...\Uninstall\YwonCompanion` + shortcuts `Start Menu\Ywon\Ywon.lnk` (+ Uninstall) + `Desktop\Ywon Companion.lnk` + optional `Run\YwonCompanion` only when checked; SmartScreen warning expected for unsigned pilot.

Windows 10 19045 x64 Node24.19 Python3.14 csc4.0.30319: `--silent` install creates 24 top-level entries + both shortcuts + Uninstall key, Run absent (OFF), `--silent` uninstall removes shortcuts/keys and clears install dir (verified clean after run). Full `project.py validate` PASS. GUI dialog/SmartScreen screenshot/autostart ON/Windows 11/real mic ASR/signed MSI NOT_RUN; asrRuntime not bundled. Handoff: `bootstrap/B057_HANDOFF.md`, report: `reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md`, evidence: `reports/evidence/companion-windows-installer-2026-10-05.json`, manifest: `outputs/companion-windows-installer-2026-10-05/manifest.json`.

---

# Single local launch entry — 2026-10-05 / REVIEW

Root `Ywon.cmd` routes to the owner's repaired extracted package. Missing ASR
config calls its explicit Y/N setup; only successful setup plus an existing
config starts the audio host. Read-only `Ywon.cmd --check` PASS: chosen
E:/Ywon-ASR, verified cached model, installed=false. Runtime directory/config
still absent; actual ASR install/mic NOT_RUN. No new archive or product state.
Handoff: `reports/COMPANION_LAUNCH_ENTRY_2026-10-05.md`.

# Windows ASR long-path repair — 2026-10-05 / REVIEW

User's actual install reached ensurepip after verified model download. Confirmed
264-character venv executable path fails with Windows206 even though
LongPathsEnabled=1. Installer now uses short runtime paths, separates ensurepip
for useful diagnostics, reuses complete hash-checked model cache while preserving
partial downloads, and checks free space on the selected disk. Owner's active
extracted0.0.4 folder repaired in place; private choice E:/Ywon-ASR because C had
331MiB free.12 offline installer tests + active read-only preflight/manifest PASS.
Actual repaired install NOT_RUN: automatic approval service503; no bypass.
Generic0.0.5 source ZIP also built, original archives and failed venv preserved.
Handoff: `reports/COMPANION_ASR_PATH_FIX_2026-10-05.md`; final evidence:
`reports/evidence/companion-asr-path-fix-2026-10-05.json`.
No mic/model-quality/paid/Q acceptance; TR-05/TR-06/TR-10 remain open requirements.

# Windows ASR preparation follow-up — 2026-10-05 / REVIEW

B-056 bounded continuation: Python worker now explicitly uses isolated UTF-8
output; synchronous spawn denial is redacted and releases the busy lane. Added
separate opt-in provisioning helper and SETUP-ASR.cmd; normal START stays offline
Node-only. New source ZIP:
`outputs/companion-windows-asr-2026-10-05/Ywon-Companion-Windows-0.0.4.zip`.
Windows10/Node24.19/Python3.14: 69 scoped in-process Node + 7 offline setup tests
PASS; read-only setup CMD, actual Python UTF-8 output and extracted hashes PASS.
Model/dependency install, real ASR/mic, Windows11/full CI/typecheck NOT_RUN:
network sandbox blocked metadata access, automatic approval review returned503.
No model/venv/wheels/audio bundled or installed; no paid/permission/Q changes.
Handoff: `reports/COMPANION_ASR_WINDOWS_2026-10-05.md`; final evidence:
`reports/evidence/companion-asr-windows-2026-10-05.json`. TR-05/TR-06/TR-10 retained.
Old source archives and packages preserved; no task/gate acceptance.

# Local Windows source-package delivery — 2026-10-05 / REVIEW

Existing B-056/0.0.3 selected from the three local packages; no runtime merge or
rewrite. New ZIP + Russian instructions + CMD launchers:
`outputs/companion-windows-2026-10-05/Ywon-Companion-Windows-0.0.3.zip`.
Windows10 build19045/Node24.19.0: 55 selected in-process tests, direct/extracted
synthetic-file demo, CMD host start, missing-ASR-config denial and ZIP/hash checks
PASS. Browser initial muted state checked through accessibility tree only.
Full subprocess suite and screenshot/log request blocked by sandbox/approval
service503; real mic/Vosk/Windows11/full CI NOT_RUN. No dependencies/models
installed, paid calls or Q acceptance. Full handoff:
`reports/COMPANION_WINDOWS_PACKAGE_2026-10-05.md`; final artifact evidence:
`reports/evidence/companion-windows-package-2026-10-05.json`. Old packages untouched.
TR-05/TR-06/TR-10 retained; latest runtime implementation is still B-056 below.

# Latest block — B-056 optional offline Russian recognition / REVIEW

2026-10-05. Real pinned Vosk0.3.45/small-ru0.22 optional local subprocess, explicit local PCM consent/bounded15s clips, editable transient draft and separately reviewed shared-core inventory proposal; no automatic tool/file/model execution/cloud/paid calls/audio files/transcript persistence. Default Node-only B055 meter/tone retained. Per-clip/cold-load pilot temporary; one-activation dialog/native/streaming/TTS/addressability target retained in TR-10.
Fresh151/151 scoped Node PASS, strict TS PASS;6 actual pinned-engine Linux checks PASS,10 actual Worklet/Vosk synthetic-input browser +15 retained browser scenarios PASS. Core command owner-edited, not claimed ASR recognized. Final desktop/mobile/error/helper frames separately inspected, truthful labels fixed. Clean Linux hash-locked dependency source build verified, Windows-only colorama pinned after metadata review; real Windows/human mic/quality/complete checkout/CI NOT_RUN. No Q/owner acceptance/main merge/deploy/registry/production policy/budget changes. Unsigned source ZIP CRC/manifest PASS, extracted126 Companion tests +6 real engine/host checks PASS; no models/wheels/audio/private config bundled. B056_HANDOFF.md, COMPANION_ASR_PILOT.md, evidence/2026-10-05-companion-asr/verification.json. Older entries historical.

---

# Latest block — B-055 local browser audio / REVIEW

2026-10-05. Isolated loopback audio host + browser capture/analyser/fixed diagnostic tone around existing VoiceSession. Explicit local consent, Mute actually stops media tracks/context, interruption clears oscillator; idle/hard timeout, focus/track/connection loss, fresh browser binding and stale permission/command fences. No raw audio upload/recording, ASR/TTS/model/wake classifier, core tool/file/OS execution or cloud transport. Focus-loss mute is stricter pilot, native/tray/background privacy target retained.
Fresh124/124 Node PASS, zero skips/failures; retained103 +13 host +8 audio-device. Scoped strict TS7.0.2/@types-node18.19.130/Node24.14.1 PASS; browser JS syntax/unit separately.15 actual Linux headless Chromium synthetic-device scenarios PASS including physical media-track cleanup and45s idle. Final1440px/390px/permission-error screenshots inspected separately; contrast checked, not full WCAG/real Windows voice proof. Windows10/11/macOS/hardware mic/AEC/sleep/native signing, full checkout/make/project.py/CI, ASR/provider/paid usage NOT_RUN. No Q/owner acceptance/main merge/deploy/keys/new runtime dependency or production policy/budget edit. Source bundle ZIP CRC/manifest PASS, extracted99/99 Companion tests and host/browser-assets smoke PASS; dark idle additionally inspected. Unsigned, real Windows launcher NOT_RUN. Read B055_HANDOFF.md, COMPANION_AUDIO_PILOT.md and TR-10. Evidence: evidence/2026-10-05-companion-audio/verification.json. Older entries historical.

---

# Name confirmation — Ywon / docs-only

2026-10-05. User supplied exact name Ywon; canonical display name for shared Architect core/Factory Companion updated in docs/governance/BRAND_NAME.md and active entry/voice documents. Ywoom Factory unchanged; old Qevunara/JEWEL references are compatibility/history. No runtime/ID/DB/task/policy/budget/wake phrase changes. New-name availability NOT_CHECKED. Exact replacements and AGENTS/CLAUDE equality checked; no new runtime test result claimed. Earlier missing-spelling notes below/handoffs are historical, superseded for name only.

---

# Latest blocks — B-053 signed staging / B-054 voice controller — REVIEW

2026-10-05. Signed bounded read-only dispatch around B-051 reuses local task/operation journal, binds pinned public-key issuer/policy/device/workspace/grant/TTL, rechecks before reads/checkpoints/final commit, rejects drift/revocation/tamper, supports exact replay and local checkpoint resume. Trusted embedding authority only, NOT SaaS pairing/current production authorizer; no schema migration/new ledger or grant/policy widening.
Voice pure control-plane: one activation per finite dialog, barge-in cancellation/flush, background/uncertain/echo ignored, timed sleep/mute, stale/duplicate callback rejection, bounded memory, proposal-only read-only intents. No microphone/ASR/TTS/AEC/classifier/live transport or real voice-quality/Windows proof. Synthetic demo explicitly no audio capture/playback/provider call. New requested name missing exact spelling: no rename or stable-ID migration.
Fresh joint subset103/103 PASS, zero skips/failures; 20 new signed-dispatch +19 voice tests, retained64 rerun. Strict TS7.0.2/@types/node18.19.130/Node24.14.1 PASS; initial compiler discovery and native strip-only issue fixed before green rerun. Full checkout/make/project.py/CI/real desktop audio/auth/paid provider NOT_RUN. Zero paid calls; no secrets/new dependencies/production policy or budget edit/Q state/main merge/deploy. Evidence: evidence/2026-10-05-companion-voice/verification.json. Read B053_HANDOFF.md/B054_HANDOFF.md, canonical COMPANION_VOICE.md and TR-10; prior entries historical.

---

# Latest blocks — B-051 offline Companion / B-052 pinned media checks — REVIEW

2026-10-05. Actual bounded read-only local executor with shared typed local contracts, native Node24 SQLite state/events, explicit owner folder grants, task/operation dedup, finite resources/expiry/revocation, leases/epochs/checkpoints, stop/restart and portable CLI/demo. 39 Companion tests, including real child SIGKILL recovery and cross-process admission. No production auth/cloud pairing/LLM/browser/GUI or Windows support claim. Media plan declares strict +/-2s and pins request hash; verifier rejects too-short/too-long/clipped source narration and changed/missing binding. Legacy manifests are not silently promoted; existing non-production receipts remain historical.
Fresh joint subset64/64 PASS, zero skips; scoped strict TypeScript7.0.2, @types/node18.19.130, Node24.14.1. Only genuine partial MCP source available; full checkout/project.py/make/CI/Windows10/11/macOS/desktop Linux/cloud/live provider/invoice NOT_RUN. Native node:sqlite experimental. No paid calls, keys, production policy/budget edit, deployment, public distribution, Q-state acceptance or main merge. Source pilot bundle uses same module bytes, no dependency installs. Evidence: evidence/2026-10-05-companion-media/verification.json. Read B051_HANDOFF.md/B052_HANDOFF.md and COMPANION_LOCAL_PILOT.md; old entries below are historical.

---

# Latest block — B-050 fail-closed production media-boundary contract / REVIEW

2026-10-04. Stopped extending local filesystem delivery and added a contracts-first P1 media boundary aligned with retained modular-monolith/Postgres/object-storage direction. Ingest derives a tenant/project/asset object key from bounded IDs/hash and always starts `quarantine_required`; caller keys/status/URLs are rejected. Delivery evaluation requires exact tenant binding, authenticated role, verified asset, clean scan, approved rights, active retention, non-deleted state, 60–900s TTL and separate publisher approval for publication upload. Even a clean evaluation returns only `ready_for_authorized_signer`, `signedUrl=null`, and all execution/upload/delivery/publication flags false; a future authenticated signer must re-read durable state. ADR 0005, CLI and fixtures added. 7 new tests; available partial suite 181/181 PASS; scoped strict TypeScript 5.9.3, CLI syntax and four Python workers PASS. Full checkout/pinned 7.0.2/full npm/CI/cloud/auth/scanner/object-store NOT_RUN. No credentials, network, purchase, upload, provider call, signed URL, deploy, main merge or Q-status change. Evidence: evidence/2026-10-04-media-boundary/verification.json.

---

# Latest block — B-049 project evidence links in Studio / REVIEW

2026-10-04. Studio now shows “Открыть evidence JSON” and “Скачать evidence JSON” only after the current project has an immutable B-046 reference. Links are built from the server-issued project ID and relative same-origin B-048 endpoint; they are removed/hidden for unsaved or unlinked projects and add no media URL, generation, execution or publication action. Six focused node:vm Studio tests PASS, including hidden-before-link and exact post-attachment paths; JS syntax PASS. Desktop 1440px and mobile 390px visual QA found no overlap, clipping, console error or horizontal overflow, with 44px link targets and responsive wrapping. The previous broader 185-test result was not rerun in this partial checkout. No network, provider call, spend, media serving, production auth/storage, deploy, main merge or Q-status change. Evidence: evidence/2026-10-04-studio-evidence-links/verification.json.

---

# Latest block — B-048 read-only linked-project evidence export / REVIEW

2026-10-04. Added `GET /api/offline/projects/:projectId/evidence` and optional `?download=1`. The endpoint requires an immutable B-046 reference, re-reads the current B-043 receipt, verifies artifact and verification hashes still match, rejects unsafe reference flags/missing receipt/store/tampering, then emits a canonical `evidenceHash`. Output contains project ID/revision/update time and reference hashes only; title, script, scenes, media, local paths, provider invoice, rights approval and publication authority are excluded. POST and other mutation methods are not routes. Expanded real HTTP test PASS, including missing reference, deterministic hash, download header, no content/path leakage, method denial and tampered reference rejection; scoped strict TypeScript 5.9.3, changed API syntax and Python receipt-worker compile PASS. The previous broader 185-test result was not rerun in this partial checkout. No network, provider call, spend, media serving, production auth/storage, deploy, main merge or Q-status change. Evidence: evidence/2026-10-04-project-evidence-export/verification.json.

---

# Latest block — B-047 exact private Codespaces preview origin / REVIEW

2026-10-04. Owner screenshot proved the API was healthy via container-local curl while VS Code Simple Browser could not connect to manually entered `127.0.0.1`. Added one shared request boundary that still permits localhost HTTP but also permits only the exact private Codespaces HTTPS forwarding host derived at runtime from `CODESPACE_NAME`, `PORT` and `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`. Arbitrary `*.app.github.dev`, lookalike suffixes, HTTP downgrade and cross-origin requests remain denied. Offline Studio, journey assets and live-result metadata now use the same check. Two focused security tests and scoped strict TypeScript 5.9.3 PASS; changed API files pass Node syntax. Full checkout/API/browser/CI and owner forwarded-URL smoke remain NOT_RUN until pull/restart. No provider call, spend, public port change, media serving, deploy, main merge or Q-status change. Evidence: evidence/2026-10-04-codespaces-preview-origin/verification.json.

---

# Latest block — B-037 bounded Google live authorization / REVIEW

2026-10-03. Owner approved exactly one first paid Google test: maximum USD 0.25, Russian, 30 seconds, generic topic “why the sky looks blue”, neutral `Kore` voice, three 16:9 images, no user/private assets and no automatic retry. Offline plan estimates USD 0.1103 across five calls and is within cap. The execution environment has no `GOOGLE_API_KEY`/`GEMINI_API_KEY`, so live generation is still NOT_RUN and no spend occurred. Q-001/product gate remains unchanged; this is a bounded bootstrap authorization only.

---

# Latest blocks — B-035/B-036 Google paid P0 spike path / REVIEW

2026-10-03. Added a fixed low-cost Google Gemini route (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite-image`, `gemini-3.8-flash-lite-tts`) plus explicit-cap plan/run CLI, secret-only environment access, no-retry unknown handling, hashed manifests and local FFmpeg MP4 assembly. Offline/mocked end-to-end generation and decode pass; no real API key was available in this environment, so paid/live calls remain NOT_RUN. 5 new tests plus prior 160 = 165 PASS; strict TypeScript 7.0.2 and three Python workers compile. Full checkout/project.py/make/CI/browser NOT_RUN. No actual spend, Q status/gate change, deploy, publication or main merge. Evidence: evidence/2026-10-03-google-live-spike/verification.json.

---

# Latest block — B-034 reservation inspection CLI / REVIEW

2026-10-03. `architect_reservation.ts` now supports `unknown`, signed `reconcile` and read-only `status` in addition to intent/evidence/check. Inspection exposes the persisted outcome, amount/liability bound and reconciliation method without signatures, private keys or production claims. Unknown remains nonzero until signed lookup/poll evidence proves release; all readiness remains denied. 3 new tests plus prior 157 = 160 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls/reservations, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-reservation-inspection/verification.json.

---

# Latest block — B-033 signed reservation reconciliation / REVIEW

2026-10-03. Unknown reservation outcomes now require time-bound Ed25519 evidence from the persisted `budget_reservation_attestor`, bound to the exact reservation receipt, intent, attempt, unit and amount. Only `lookup` or `poll` evidence can preserve or resolve unknown into pending/confirmed/released; blind resubmit and caller assertions are rejected. Unknown keeps the full liability upper bound until signed evidence proves release. Reconciliation receipts are append-only and single-use; readiness remains denied and local-only. 3 new tests plus prior 154 = 157 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls/reservations, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-04-reservation-reconciliation/verification.json.

---

# Latest block — B-032 reservation outcome lifecycle / REVIEW

2026-10-03. Reservation outcomes now persist as `pending`, `confirmed`, `unknown` or `released`; intent starts pending, local signed evidence records a non-production confirmed fixture, and ambiguous results become unknown with the full initial liability upper bound retained. Callers cannot assert a successful/released outcome or zero liability. 4 new tests plus prior 150 = 154 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls/reservations, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-04-reservation-outcomes/verification.json.

---

# Latest blocks — B-028…B-031 reservation intent and local evidence / REVIEW

2026-10-04. Four bounded offline blocks: derived one-per-attempt reservation intent; signed local attestor evidence; transactional single-use persistence/invalidation; actual intent/evidence/check CLI. Local evidence is explicitly `productionVerified=false`, `budgetReserved=false`; readiness still reports missing production reservation. 7 new tests plus prior 143 = 150 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls/reservations, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-04-reservation/verification.json.

---

# Latest blocks — B-024…B-027 attempt preparation and denied readiness / REVIEW

2026-10-03. Four bounded offline blocks: one-time approval consumption into a non-executable attempt preparation; fail-closed readiness report with explicit missing production dependencies; invalidation on revision/recovery/registry drift; actual prepare/check CLI. 8 new tests plus prior 135 = 143 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-execution-readiness/verification.json.

---

# Latest blocks — B-020…B-023 signed and persisted plan approval / REVIEW

2026-10-03. Four bounded offline blocks: time-bound `plan_approver` signature bound to admission/unit/revision/budget; transactional single-use approval persistence; invalidation on revision/recovery/uncertainty plus live registry/budget/expiry checks; actual approve/check CLI. 9 new tests plus prior 126 = 135 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-plan-approval/verification.json.

---

# Latest blocks — B-016…B-019 operation integrity, CLI and plan admission / REVIEW

2026-10-03. Four bounded offline blocks: hash-linked coordinator-operation history and projection checks; actual operator list/get/exact-replay/pre-signed-stop CLI; deterministic plan admission seal; current-registry revalidation blocking tamper, revocation, record drift and evidence expiry. 13 new tests plus prior 113 = 126 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-operation-admission/verification.json.

---

# Latest blocks — B-014 durable coordinator + B-015 signed operator stop / REVIEW

2026-10-03. Authority-store schema v3 now persists claimed operations, exact signed envelopes and final registry receipts; restart inspection and exact replay complete interrupted local sequencing. Pending list/get and a time-bound security-reviewer-signed terminal stop were added. 6 new tests plus prior 107 = 113 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-authority-operations/verification.json.

---

# Latest blocks — B-012 time-bound authority + B-013 single-use consumption / REVIEW

2026-10-03. Registry mutation signatures now bind purpose, audience, policy version, authorization ID, full command and a maximum 15-minute window evaluated by a trusted clock. Authority-store schema v2 consumes each authorization once, permits only exact receipt recovery after expiry and rejects changed reuse. 8 new tests plus prior 99 = 107 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-command-authority/verification.json.

---

# Latest blocks — B-010 authority policy store + B-011 pinned registry path / REVIEW

2026-10-03. Root-anchored Ed25519 policy persistence now supports hash-linked versions, signed key/policy rotation, validity windows and immediate principal removal. Registry mutations can load only that persisted policy and use a trusted clock dependency; callers cannot inject replacement policy into the pinned path. 9 new tests plus prior 90 = 99 PASS; strict TypeScript 7.0.2 and all three Python workers compile. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-authority-policy/verification.json.

---

# Latest blocks — B-008 registry hardening + B-009 signed authority adapter / REVIEW

2026-10-03. Registry schema v2 adds strict capability validation, hash-linked event/projection verification, append-only receipts and fail-closed initialization races. A separate Ed25519 adapter binds signed commands to registry/policy/principal and local role grants, but its policy remains trusted caller input and is not production auth. 10 new tests plus prior 80 = 90 PASS; strict TypeScript 7.0.2 and Python compile PASS. Full checkout/project.py/make/CI/browser/live generation NOT_RUN. No paid calls, Q status/gate changes, deploy, publication or main merge. Evidence: evidence/2026-10-03-registry-hardening/verification.json.

---

# Latest blocks — B-006 registry + B-007 registered planning / REVIEW

2026-10-03. Two bounded offline blocks: evidence-backed lifecycle registry and exact-version registry-resolved planner/store path. Candidate/verified/approved/revoked, provenance/expiry and independent local verifier/approver roles are represented, but identities are not production-authenticated and declarations are not production proof. 15 new tests plus prior 65 = 80 PASS; strict TypeScript 7.0.2 and Python compile PASS. Full checkout/project.py/make/CI/browser/live generation NOT_RUN after private clone authentication failure. No paid calls, generation, Q status/gate changes, deployment, publication or main merge. Evidence: evidence/2026-10-03-capability-registry/verification.json.

---

# Latest block — B-005 persisted offline Architect state / REVIEW

2026-10-03. Additive local SQLite preview store + typed Node/Python bridge/CLI, optimistic versions, atomic state/event/idempotency receipts, pinned budget and cumulative counters, unknown-liability hold, integrity checks. Scope/design/handoff: B005.json, B005_STORE_DESIGN.md, B005_HANDOFF.md. 25 new + 40 B-004 tests rerun jointly = 65 PASS without failures/skips; strict TS/Python compile and actual create/get CLI PASS. Full repository regression/project.py/spec-check/CI/browser/live media NOT_RUN. No paid actions/auth/production queue/ledger, no Q status/gate changes or owner acceptance. SQLite does not replace P1 Postgres ADR. Evidence: evidence/2026-10-03-state/verification.json. Copy-ready new-chat starter: ../handoffs/NEXT_CHAT_B005.txt. Earlier checks below historical only.

---

# Latest block — B-004 offline Architect preflight / REVIEW

2026-10-03. Owner requested continuing code work and delegated choice of one block. Additive packages/architect planner + offline plan/recover CLI + typed contracts + fixture route/DAG/cost/repair checks implemented. Read B004.json and B004_HANDOFF.md. No existing API/UI/media runtime integration or paid execution. Scoped strict TypeScript 7.0.2 compile and 40 Node tests PASS, zero failures/skips; actual sample CLI invocations checked. All outputs executionAllowed=false/budgetReserved=false. Full repository regression/spec-check/project.py/CI/live media NOT_RUN for this block. Existing product gates and all Q task statuses unchanged; owner acceptance null. Evidence: evidence/2026-10-03-architect/verification.json. Remote tested-file hash verification: evidence/2026-10-03-architect/remote-source-verification.json. Earlier full-regression evidence below is historical, NOT a rerun after B-004.

---

# Latest verification — full B-003 source regression PASS / REVIEW

2026-10-02, owner ZIP attached at 19:42 Asia/Bangkok. Complete 303-file source snapshot matches all GitHub top-level blob/tree hashes at 2d03aef. Exact offline npm ci PASS; full make check 117 tests + separate actual Chromium 10 = 127 PASS, zero skips; full strict typecheck/syntax PASS. project.py validate/status/next PASS: P0, all 50 Q TODO, Q-001 owner_gate next. No runtime edits or actual task-gate mutations; no paid calls/main merge/deploy/owner acceptance. ZIP is source-only, not Git ancestry. CI still UNKNOWN (HTTP403); speech quality/production/full WCAG/other clients NOT_RUN. Current evidence: evidence/2026-10-02-full/verification.json and source-verification.json; report: reports/B003_FULL_REGRESSION_2026-10-02_1942.md. Earlier NOT_RUN statements below describe their earlier sessions, superseded only for full local source regression.

---

# Latest follow-up — B-003 offline guided UX / REVIEW

Owner authorized a bounded pre-P0 offline UX exception on 2026-10-02 at 15:35 Asia/Bangkok. See B003.json and B003_HANDOFF.md. /journey: three entrances, shared browser versioned brief, deterministic outline/script/scenes, materials/assumptions/unknown-cost cards, explicit plan confirmation and one-way handoff to existing /studio. NOT AI generation or complete production onboarding.
19 new scoped Node + 10 actual Chromium cases PASS, no skips; real browser uploads → FFmpeg technical tone MP4/download/hash/decode checked. Scoped strict typecheck/syntax PASS. Full repository make check/project.py commands and prior 98-test suite NOT RUN because complete checkout unavailable. GitHub CI unknown. Owner acceptance null; no Q acceptance/spend/deploy/main merge. Original B-002 runtime preserved except guarded static serving/HTML entry integration. Current evidence: evidence/2026-10-02-guided/verification.json.

---

# Bootstrap status — 2026-10-02 offline block published

Full v0.4 remote import COMPLETE/VERIFIED at owner commit 6fbb5d8c6de6566773a541ecb51a221e9803fb14.
B-002 remote code commit: 4502eb2a3b836384cf732731c75478263f3711e1.
Runtime apps/workers/tests subtrees + package.json/.gitignore match tested local Git hashes.
B-001 REVIEW; B-002 separately owner-authorized, implemented/published, REVIEW.
Pull bootstrap/spec-v04-foundation to use /studio; PR #1 draft, no main merge.
Product gates unchanged: P0 current, all 50 Q tasks TODO; no P0/P1 acceptance.

Local B-002 make check PASS including repeat before publication: typecheck + both client
syntax checks + 37 Node + 7 media + 44 spec + 10 transfer, zero skips. Clean ZIP/offline npm ci PASS.
Real synthetic MP4 demo/30s portrait/60s landscape, uploads, hash/decode/Range, snapshots,
conflicts/repeat/cancel/failure/restart checked. Real browser/visual/a11y/real narration quality
NOT RUN; GitHub CI unknown (prior HTTP403). Owner scenario is only partial Q-001 confirmation.
No paid API, deploy, Q acceptance or main merge. See B002_HANDOFF.md, B002.json,
OFFLINE_STUDIO.md and evidence/2026-10-02-offline/verification.json / remote-source-verification.json.
Raw logs and archive source manifest remain in the previously delivered ZIP.
Previous client handoff: handoffs/B-001-client-20261002.json. No old migration kit reapplication.

