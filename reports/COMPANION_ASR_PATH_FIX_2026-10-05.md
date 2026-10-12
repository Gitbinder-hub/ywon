# Ywon — Windows ensurepip/path repair / REVIEW

User reported failed setup after confirming Y. The official model downloaded and
passed its existing hash; venv failed while invoking ensurepip. This continuation
repairs that installation, without new spend/microphone/production authority.

## Confirmed cause and machine limits

Active package:
`outputs/companion-windows-asr-2026-10-05/Ywon-Companion-Windows-0.0.4/Ywon-Companion`.
Reported run: `local-asr-runtime/setup-d22995f0cdf545689200c14a403ddeab`.
Its `venv/Scripts/python.exe` path is 264 characters. Direct subprocess execution
returns Windows error 206 (filename too long), including with the extended-path
prefix. Registry LongPathsEnabled is already 1 and was not changed. This is a
confirmed launcher path failure, not evidence that Python/Vosk are incompatible.

Observed available disk: C 331 MiB; E 63112 MiB. The local selected destination is
`E:/Ywon-ASR`, recorded only in active package `local-asr-setup.json`. The directory
is not created by preflight; actual install still needs execution by the owner.
The previous workspace-path choice was replaced before installation by this short,
ASCII, independent application-data location on E. No files were deleted or moved.

## Fix

Canonical installer now defaults to a short per-user LOCALAPPDATA/Ywon/ASR/r-*
runtime. It also accepts explicit --runtime-base and a bounded exact-schema local
setup options file. Max120 chars at runtime root, absolute/ordinary paths and700MiB
on the target drive are checked before writing. Venv creation and ensurepip are
separate commands, so the stage/exit code and underlying ensurepip output survive
failure. Setup subprocesses use runtime-local TMP/TEMP; OS environment is unchanged.

The original exact-model cache is reused only after full size/hash verification.
Two earlier incomplete files (15 MiB and8 MiB) coexist with the completed file;
they are preserved and skipped. A complete but wrong-hash file still fails closed.
The valid archive is46236750 bytes, SHA256
961d5ff98a17f4aa6de69864d0aa71fa5bac682301d2b5d17a3f24c5c99a46d4.
The old venv is preserved because venvs should not be relocated.

The active extracted package was repaired in place after checking targeted files
against its original manifest. Old installer and pre-repair manifest are retained;
the current manifest describes patched source and excludes private setup options.
SETUP-ASR.cmd still uses the same explicit Y/N installation action. No re-extraction
is necessary for this user's active folder. Generic source packaging is advanced
to0.0.5 separately, with no machine-specific runtime options/models/venvs bundled.

## Evidence

- Source-tree project.py validate/status/next: consistency PASS, P0/product
  not_started/Q-001 only; no Git metadata/commit/Q start/accept.
-12 offline provisioning tests PASS, including short/relative/long paths, local
  override schema, complete-cache reuse alongside partial downloads, tamper denial,
  separate stage errors, previous ZIP security/default-no-install/no-retry checks.
- Exact downloaded model SHA256 and length independently checked.
- Active SETUP-ASR.cmd --check: correct runtime choice, verifiedModelCache=true,
  installed=false, microphoneEnabled=false, paidCalls=false.
- Runtime/worker/voice code unchanged this repair; prior69 Node tests are historical,
  not rerun or claimed as a fresh native-ASR check.

Requested full repaired installation was NOT EXECUTED: automatic approval review
service returned HTTP503. No network/permission bypass was attempted. It was an
approval infrastructure failure, not an unsafe-action decision. Actual new venv,
ensurepip/dependency installation/model load/native Unicode-path behavior/real
speech/Windows11/full CI remain NOT_RUN. Passing installer tests does not certify
the installation. No new dependency/model downloaded in this repair turn.

## Continuation and rollback

Owner can close the old setup window and rerun SETUP-ASR.cmd in the same active
folder. It should report verifiedModelCache=true and runtimeBase=E:/Ywon-ASR;
after Y, stage1 reuses the model. If ensurepip/dependencies/native load fails,
retain exact stage/error; don't disable hashes, change pins or repeatedly retry.
Only after SETUP COMPLETE run START-ASR and explicitly consent to mic/local PCM.

No schema/ID/grant/task migration. Rollback is original source0.0.4/START without
ASR; original archives, model cache, failed venv and all task state remain.
TR-05/TR-06/TR-10 retained: this is setup repair, not native tray/signed installer,
pairing/continuous voice/LLM/TTS/full OS support. Q-006/008/044 dependencies and
Companion decomposition/owner acceptance remain separate. REVIEW only.
