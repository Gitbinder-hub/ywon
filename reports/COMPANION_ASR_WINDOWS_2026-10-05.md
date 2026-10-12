# Ywon — Windows ASR setup continuation / REVIEW

2026-10-05, Asia/Bangkok. User asked to continue after local package delivery.
Bounded continuation of B-056: Windows pipe fixes and explicit local provisioning
helper. No Q acceptance, policy/budget/grant changes, paid calls, cloud speech,
microphone activation, production deployment or new model capability claims.

## Changed

- `packages/companion/src/asr-process.ts`: invoke Python with `-I -X utf8`.
  Actual Windows Python3.14.8 pipe stdout is cp1252 by default; Cyrillic output
  from `json.dumps(..., ensure_ascii=False)` cannot be encoded there. The isolated
  interpreter ignores PYTHONUTF8, so a command-line option is necessary.
- Synchronous `spawn` failures now produce the same redacted
  `asr_process_failed` error as asynchronous failures and release the busy lane.
  This was found by an actual sandbox EPERM failure during the speech tests.
- `scripts/companion_asr_install.py`: default is read-only preflight. Explicit
  `--install-local-asr` downloads only the existing pinned official RU0.22 model,
  checks length/hash and bounded archive paths, creates a fresh venv, installs
  unchanged hash-locked build/runtime dependencies from PyPI, checks packages,
  tests native import and one second of generated silence, then creates fresh
  local config. Only srt source builds are allowed; other packages require wheels.
  No system install, auto retry, config overwrite, TLS/proxy bypass or audio capture.
- New package `SETUP-ASR.cmd` performs preflight and asks Y/N before downloading
  or installing. `--check` returns after read-only preflight. START remains
  Node-only; START-ASR still requires the configured engine and browser consent.
- Setup privacy exclusions added to `.gitignore`; source-only package 0.0.4,
  Russian instructions, original B-056 manifest/readme retained, old ZIP unchanged.

No dependency versions/hashes, core intent or browser permissions were loosened.
The new version changes source packaging, not canonical product spec/task state.

## Fresh observations and checks

Windows10 build19045 x64, Node24.19.0, CPython3.14.8 x64. Only one installed
Python was found. Vosk/model were not present in inspected locations.
Source snapshot has no Git metadata; ancestry/diff/commit/push NOT_RUN.
`project.py validate/status/next` on actual source tree completed: consistency
PASS, P0/product not_started, Q-001 owner gate still sole ready task.

Actual `python -I` stdout encoding: cp1252. With `-I -X utf8`: utf-8;
Russian JSON `проверь файлы` printed successfully through the command pipe.
This is Python pipe evidence, not ASR recognition.

Node regression scope: 69 tests PASS, zero failures/skips after the sync-spawn
fix. Command: `node --test --experimental-test-isolation=none --test-reporter=spec
tests/companion-asr-process.test.mjs tests/companion-speech.test.ts
tests/companion-audio-device.test.mjs tests/companion-pcm.test.mjs
tests/companion-voice.test.ts tests/companion-audio-host.test.ts
tests/companion-asr-host.test.ts`. New process tests use a fake child to exercise
UTF-8 pipe decoding/argv and synchronous denial, not native Vosk. OS sandbox
stayed enabled. Full subprocess runner suite remains separate NOT_RUN.

`python -X utf8 -m unittest discover -s tests_companion -v`: 7 PASS.
Tests cover model hash/length, safe extraction/no overwrite, traversal/Windows
paths/link/case collision/member bounds, no install by default and no retries.
Initial Windows tempfile private-ACL failures were test-infrastructure errors;
fixtures now use inherited-ACL workspace dirs with validated cleanup paths.
One initial malformed-name fixture was normalized by Python ZIP on Windows;
it now tests actual backslash traversal, which is rejected. No protection was
disabled and no failed run is counted as PASS.

Read-only installer preflight completed for the installed interpreter and exact
dependency locks. Prior B-056 metadata includes Windows CPython3.14 wheels for
cffi/charset-normalizer/websockets and generic win_amd64 Vosk. This is historical
metadata, not current availability, license recertification or native ABI proof.

## Blocked / NOT_RUN

Official PyPI metadata requests failed from the network sandbox (WinError10061).
The request for expanded network access was NOT EXECUTED: automatic approval
review returned HTTP503. This is an unavailable review service, not a judgment
that the metadata read is unsafe. No alternate channel bypass or retry occurred.

Actual download/install/model native load/real speech decode/end-to-end ASR are
NOT_RUN. No models, wheels, venv or private audio are bundled. Browser mic remains
off. CPython3.14 compatibility must pass setup on the actual machine; the helper
refuses failed dependency/native checks rather than selecting an unpinned version.
TypeScript compiler/full make/check/CI, Windows11, hardware audio/latency and
speech quality are NOT_RUN. Seven setup unit tests do not certify the installer
end-to-end. Full conversational LLM/TTS remains unimplemented.

## Artifact and continuation

Builder: `scripts/package_companion_windows.py`. Output:
`outputs/companion-windows-asr-2026-10-05/Ywon-Companion-Windows-0.0.4.zip`.
Source manifest validation, ZIP CRC/extracted hashes and launcher check are
recorded separately in `reports/evidence/companion-asr-windows-2026-10-05.json`.
That record is generated after the artifact; no circular archive hash claim.

TR-05/TR-06: source folder/CMD remains temporary; native signed installer/tray,
pairing, update and per-OS evidence still required. Q-006/Q-008/Q-044 dependencies
remain; Companion task decomposition/activation pending in canonical registry.
TR-10: per-clip/cold-load/manual review remains temporary. Preserve streaming,
one-activation dialog, addressability/VAD/AEC, TTS/duplex/privacy/hardware evidence
and separately authorized provider caps. No new access from transcription.

No schema or stable-ID migration. Old packages, grants, journals and task state
are preserved. Rollback: stop host, use default START without ASR. New setup
directories are local/private; failed attempts are kept and never auto-deleted.
Do not move a configured folder: config points to its specific runtime paths.

Next concrete action once network access is available: explicitly run SETUP-ASR,
inspect exact install/probe outcome, then START-ASR and separately consent to mic
and local PCM in the browser. If native checks fail, inspect the failure without
unpinning dependencies. Real speech corpus/CPU/latency must be measured separately.
REVIEW remains owner-reviewed, not automatically accepted.
