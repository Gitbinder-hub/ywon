# Ywoom + Ywon — Spec Pack v0.4 / Architect Foundation

**Из намерения в полезный результат, из принятого образца — в управляемую автоматику.**
Base spec 0.4.0; owner Oleg Gitbinder. Architecture amendment A-20261003 dated 2026-10-03.
Ywon is the user-confirmed canonical display name of the shared core/Architect. Qevunara / Кевунара and JEWEL remain historical/compatibility aliases; stable paths/IDs/history stay unchanged. Naming source: docs/governance/BRAND_NAME.md; Ywon availability/trademark screening NOT_CHECKED. Ywoom Factory name unchanged.

## Начать следующему агенту
1. AGENTS.md → docs/governance/ARCHITECT_AMENDMENT_2026-10-03.md → docs/governance/COMPANION_AMENDMENT_2026-10-05.md → docs/INDEX.md → handoffs/COMPANION_SPEC_2026-10-05.md. Read applicable transition/overlay and bootstrap/STATUS.md + latest referenced handoff + actual code; prior handoffs remain historical evidence.
2. On genuine complete source checkout: python3 scripts/project.py validate; status; next; python3 scripts/check_architect_spec.py --full-links; make spec-check; make check. No fabricated PASS.
3. tasks/project.json sole task status; tasks/architect_acceptance_overlay.json adds normative AC/context for existing tasks, not second task state. REVIEW != DONE.
4. Q-001 unresolved product gate; no positive live/incremental spend/deploy/publish authorization inferred from documentation update.

## Новое ядро
Upper runtime Architect supervises existing Strategist/Producer/Quality/Guardian, deterministic execution guards, versioned evidence/module/capability contracts. Factory is first module, future Business/Capital/Personal/Physical preserved.
Pilot manual approval retained; target delegated mode runs approved plan within explicit envelope after evidence/policy activation. Monetary repair reserve proposed 20% per user result; all attempts cumulative; smart local repair/auto or manual recovery; pause BEFORE third unsuccessful attempt; unknown paid outcome reconciled, not blind retry.
Scene Compiler translates scene contracts to own 2D/3D/native control/hybrid/prompt routes; Higgsfield substitute matrix now explicit. Stage vs final fidelity distinct. Quality/cost/autonomy goals measured, not achieved claims. Controlled lab and future model adaptation do not self-modify protected production policy.

## Что реально реализовано
Specification/task/handoff tooling plus bounded bootstrap prototypes. Product accepted stages not_started.
B-001 localhost dry-run scaffold; node apps/api/src/server.ts. Production auth/database/generation/native clients not implemented.
B-002 /studio: persistent local projects/scenes + own PNG/JPEG/pre-created WAV/MP3/M4A → real FFmpeg MP4. bootstrap/OFFLINE_STUDIO.md and B002_HANDOFF.md. No AI/TTS/live provider acceptance; technical sample not real narration.
B-003 /journey: deterministic guided RU UX/shared browser draft and handoff to studio; not AI chat. Read bootstrap/B003_HANDOFF.md for actual historical test evidence/limits. /api/generate denies; health productReady=false. Python/FFmpeg/ffprobe required for offline media.
packages/orchestrator/router/budget/policy/memory remain planned. Later bounded B-004…B-052 add packages/architect offline planner, SQLite state/registry/signed local authority/admission/reservation evidence, separate Google live-spike and artifact receipts/UI metadata/media-boundary contracts. These are NOT an integrated production executor/ledger/auth; inspect current source and bootstrap/STATUS.md. B-041 records owner-reported live MP4 after keyless local recovery; invoice/content quality are not independently certified. Historical/partial test totals are not fresh full regression. A-20261003/A-20261005 specification work itself adds no runtime implementation.

## Scope retained
P0 real narrated spike → P1 reliable core/Architect contracts → P2 first editable workflow (short + bounded static recipe) → P3 repeatability/ordinary users/delegation evidence → P4 measured learning → P5 chosen studios → P6 safe scale/public clients.
Full existing F01…52 retained: Cinema/Blender/VFX/characters/twin/long/dub/mirrors/analytics/learning/skills/marketplace/future modules. Web P2, Android/iOS + languages explicit P6 public-release gates; internal pilot/web beta != all-client release. No dates promised.
Three entries, shared result/editor/assistant workspace, editable layers/local edits separate from generated media. USD/verified provider units, frozen baselines and strict >10% visibility with approved bounded repair exception. UI static catalogs/locales independent; no hidden data sharing through shell.

## Truth / integrity
Tasks/features/requirements + amendment/overlay; generated STATE/FEATURE_STATUS/BACKLOG not manually edited. Archive v0.2/v0.3 untouched historical record. PACKAGE_MANIFEST.json remains original shipping snapshot, not new-release certification; make package-check can fail after intentional development changes. Rebuild only for next actually verified release.
No automatic next-agent launch, git push, keys, paid calls or deployment by project.py. No main merge by this spec amendment.

## Detachable Desktop Companion — target, not downloaded product
A-20261005 adds one-core/two-runtime direction, Windows10/11 first pilot, Linux/macOS later, pairing/revocation, isolated scopes and reviewed skill transfer. Canonical contract: docs/architecture/DESKTOP_COMPANION.md. Eight experimental use cases: docs/learning/COMPANION_SCENARIOS.md. Prototype→production obligations and observed code gaps: docs/governance/IMPLEMENTATION_TRANSITIONS.md. Stack specifics proposed in ADR0007, client boundary ADR0006. No second task state, gate acceptance, paid actions, public desktop release or main merge.

## B-051/B-052 — first executable local Companion subset
`node scripts/companion_demo.ts --data-dir YOUR_DEMO_FOLDER --confirm-demo` executes synthetic local inventory with durable SQLite, then revokes its permit. Node24 required; SQLite experimental; no cloud pairing/LLM/network/production authority. Windows10/11 execution not yet verified. Guide: bootstrap/COMPANION_LOCAL_PILOT.md; current fresh subset evidence/handoffs in bootstrap/STATUS.md. Media verifier now pins original request and checks both duration bounds/source narration preservation; legacy manifests without request binding are not upgraded automatically. Stored historical non-production receipts do not inherit new fulfillment checks. Full repo tests not run in this partial checkout.

## B-053/B-054 — signed staging и голосовая сессия
SignedDispatchBridge validates Ed25519 envelope/device/workspace/grant/expiry around the existing local read-only runner, with guard rechecks and durable exact replay. Trusted caller supplies pinned authority: no SaaS pairing/auth or second production policy store.
`node scripts/companion_voice_demo.ts` demonstrates finite session/background rejection/barge-in/late callback discard without a microphone or provider. VoiceSession implements effects and proposal-only actions, not actual live audio. Canonical UX and prototype→target contract: docs/architecture/COMPANION_VOICE.md, transition TR-10. User confirmed Ywon; display name changes only, no stable-ID or wake-phrase migration. Fresh tested subset and remaining limits: bootstrap/STATUS.md + B053/B054_HANDOFF.md. All product Q states and main preserved.

## B-055 — локальная аудиопанель Ywon
`node scripts/companion_audio.ts --local-audio-pilot` prints an ephemeral127.0.0.1 URL. Open locally in Chrome/Edge, consent and enable mic. Real browser capture/meter, fixed diagnostic tone, interruption, actual track-stop on Mute/idle/blur/disconnect; audio neither recorded nor uploaded. No ASR/TTS/model or file/OS task execution. Separate loopback process/core session adapter, Factory server unchanged. Guide bootstrap/COMPANION_AUDIO_PILOT.md and B055_HANDOFF.md. Linux Chromium synthetic audio-device evidence is not real Windows/native client proof. No npm install/new dependency/paid call from launcher. Native tray, genuine conversation and Windows10/11 OS smoke remain future gated slices.

## B-056 — optional local Russian ASR + shared-core proposal
Vosk0.3.45/RU0.22 behind fixed local Python subprocess; separate setup/config/CLI opt-in and browser local-PCM consent.15s RAM clip→actual ASR→editable private draft→explicit review→shared Architect companion-intent recipe. No cloud/TTS/general LLM or automatic file/OS action. Word confidence is not identity/permission. Mute/Escape focused window/ASR opt-out cancels worker/capture and stale drafts. Recognised stop only closes voice. Optional dependencies/model not auto-installed/bundled; hash-pinned setup guide bootstrap/COMPANION_ASR_PILOT.md. Clip/review/cold-start are TEMPORARY, full one-activation conversation/streaming/addressability/native/Windows gates retained in B056_HANDOFF.md/TR-10. No Q acceptance, root dependency or protected policy/budget change.
