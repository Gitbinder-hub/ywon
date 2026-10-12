# Ywon Companion — local Windows package handoff, 2026-10-05

Scope: user asked to recover the unfinished local prototype delivery from three
versions. This is packaging of existing B-056, not a new Q implementation or
acceptance. REVIEW only. No Q state, production permission/budget, main branch,
paid calls, installs, model downloads or original archive changes.

## Source selection

The workspace is an extracted source snapshot, without `.git`. Git ancestry,
diff/remote comparison/commit/push are NOT_RUN. No claim of a genuine Git checkout.
`python -X utf8 scripts/project.py validate/status/next` ran on the actual source
tree: consistency PASS, P0 / product not_started / only Q-001 owner gate ready.
Initial status/next calls without `-X utf8` hit the Windows console encoding;
both then completed with UTF-8. No `start` or `accept` was called.

- `Ywon/Qevunara-Companion-Pilot`: 13 files; B-051 local file runner.
- `Ywon-Companion-Pilot/Ywon-Companion-Pilot`: 30 files; B-055 audio UI.
- `Ywon-Companion-Pilot-0.0.3/Ywon-Companion-Pilot`: 45 files; B-056 optional ASR.

All three original per-file manifests match. The 0.0.3 package already contains
the preceding runtime functionality. Its source/tests/docs match the current
project byte-for-byte; standalone README/package metadata differ intentionally.
No runtime source merge or rewrite is needed. Old-only files are launch/readme
or historical handoff material, not missing runtime modules.

## Delivery

Builder: `scripts/package_companion_windows.py`. It verifies source hashes and
current-project equality, copies only manifest-listed files, retains the original
README/manifest as historical references, adds relevant transition/handoff docs,
Russian instructions and `START.cmd`, `START-ASR.cmd`, `DEMO.cmd`.
The compatibility `run-audio.cmd` delegates to START. No runtime module changes.
Existing output directories are rejected rather than replaced. No source dirs
are removed. The emitted manifest is an integrity inventory, not signing.

Expected output: `outputs/companion-windows-2026-10-05/` containing a standalone
`Ywon-Companion` folder, ZIP and SHA256 file. A fresh generated manifest describes
this local package only; original root PACKAGE_MANIFEST.json remains untouched.
The builder checks ZIP CRC and byte equality for every packaged file after writing.

## Fresh evidence

Environment observed: Windows 10 build 19045 x64; Node 24.19.0; Python 3.14.8.
No new dependency installed. The source paths include spaces, Cyrillic and parentheses.

Commands and results:

- `python -X utf8 scripts/project.py validate`: PASS, source-tree consistency only.
- `python -X utf8 scripts/project.py status` / `next`: completed, no accepted product work.
- `python -X utf8 scripts/check_architect_spec.py --full-links`: scoped PASS.
- From original 0.0.3 bundle:
  `node --test --experimental-test-isolation=none --test-reporter=spec tests/companion-audio-device.test.mjs tests/companion-pcm.test.mjs tests/companion-voice.test.ts tests/companion-audio-host.test.ts tests/companion-asr-host.test.ts`:
  **55 PASS, 0 fail, 0 skipped**. This removes Node test-worker processes, not OS
  isolation. The OS sandbox remained active. ASR engine and media devices in these
  tests are fixtures, not real speech/hardware evidence.
- `node scripts/companion_demo.ts --data-dir reports/companion-windows-demo --confirm-demo`:
  actual Windows local runner/SQLite/file checks PASS, two synthetic files,
  grant revoked after completion. No personal documents were read.
- From original 0.0.3 bundle, `node scripts/companion_audio.ts --local-audio-pilot`:
  server starts on a random 127.0.0.1 port with asrConnected/modelConnected/paidCalls
  false. In-app browser opened the page; accessibility tree confirmed initial mute,
  unchecked consent, disabled capture and expected disconnected-ASR message.
  Browser microphone permission was not granted and no audio was captured.

The ordinary all-file Node test command was attempted but test workers failed to
spawn with EPERM in the sandbox. Request to run that suite outside the sandbox
was NOT EXECUTED: automatic approval review service returned HTTP 503. This was
an approval infrastructure failure, not an unsafe-action determination. A later
browser screenshot/log request hit the same service error and was not executed.
No bypass or broad permission changes were made. Only the smaller permitted
in-process test scope and direct local demo/server were executed.

## Not checked / material limits

Full 126-test package suite, child-process recovery/admission tests on Windows,
full make/check/typecheck/CI and full Git-checkout validation: NOT_RUN successfully
here. Real mic, speaker sound, permissions, ASR Vosk native engine, current Python
3.14 compatibility, latency/accuracy/AEC, Windows 11 and native tray: NOT_RUN.
Screenshot/layout verification and browser logs: NOT_RUN (503 approval failure).
The browser evidence is a rendered accessibility tree only.
No language model, TTS, cloud pairing or speech-triggered file execution is added.

## Transitions, rollback and next step

TR-05/TR-06: this is a launchable source folder with CMD wrappers; signed native
installer/tray/update/real pairing remain future work. Q-006/Q-008/Q-044 boundaries
remain; Companion implementation decomposition/activation is still pending.
TR-10: per-phrase optional ASR/manual review/cold start are retained temporary
limits, not the final continuous conversational UX. Streaming/addressability,
TTS/duplex, privacy, real Windows 10/11 device evidence and approved provider caps
remain required before the corresponding features are claimed.

There is no data/schema/ID migration. Prior grants/journals/packages are untouched.
Rollback: Mute, stop the launched host, use the original 0.0.3 folder or default
START without ASR. Each demo creates its own new synthetic materials/state folder.

Owner next step: extract ZIP, START.cmd, open its printed local URL in Chrome/Edge,
then explicitly enable microphone and check meter/tone on the actual device.
Optional Vosk setup is a separate local installation/model provenance and
Python-compatibility task; no speech/paid authorization is inferred from packaging.
Acceptance remains with the owner; this delivery does not change canonical state.
