# B-036 — explicit Google live spike CLI / REVIEW

Adds `scripts/architect_google_spike.ts` with offline `plan` and explicit `run --live`. A run creates a unique directory, calls script + 1–3 images + TTS sequentially, assembles H.264/AAC MP4 with FFmpeg and records hashes/completed calls. Provider failure is never retried automatically and leaves an unknown manifest. The fixture is capped and the runbook explains secure key setup.

Scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-036 tests are 165 PASS. Mocked provider media produced a real decodeable MP4. Live Google call, provider billing, full checkout/project.py/make/CI/browser remain NOT_RUN because no secret was injected and the exact owner cap is still required. No actual spend or Q-state change occurred.

Next: owner confirms the per-run USD cap, language/voice/test topic and rights, installs the key locally or in an approved secret store, runs `plan`, then one live run. Inspect an unknown manifest/provider console before any subsequent attempt.
