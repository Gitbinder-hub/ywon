# Q-001 — owner approval — pay-as-you-go unlimited (2026-10-06)

APPROVED: YES
Owner: Oleg Gitbinder
Date: 2026-10-06 09:15 Asia/Bangkok
Task: Q-001
Source: explicit owner selection in this session: «В, 1-да» = variant B + confirm budget formulation pay-as-you-go unlimited, per-run cap $0.25-1.00 media / $2-5 Architect. Replaces 2026-10-03 zero-spend. New deposit confirmed separately for live eval.

## AC1 — accepted scope and sequence
Staged evidence-first v0.4 P0→P6, expanded baseline P2 (practical editors and one bounded static recipe), and separate all-client public release gate — as accepted 2026-10-02 15:15 and 2026-10-03 12:24, unchanged. Future scope preserved. Sequencing: complete Q-002 real API/prices/rights research before full production; offline B-001/B-002/B-003 remain bounded pilots, not P0/P1 acceptance.

## AC2 — spend and stop limits
Live-eval cap: **pay-as-you-go unlimited — monthly cap = none** (no automatic monthly limit). Bounding is **per-run**: `$0.25-1.00 per media generation` (image/TTS/video) / `$2-5 per Architect/Director call`. Currency: USD. Period: from this confirmation until explicitly replaced by another recorded owner decision; no auto-expiry into permission. Minimal start deposit ~$20 covers: Google Live ×9 (~$1) + Fal schnell ×10 (~$0.16) + Architect 1-2 calls ($10-25).
Development cap: same pay-as-you-go unlimited; no separate fixed dev cap, bounded by the same per-run caps and explicit owner approval per batch.
Reserve: per GENERATION_RESERVE.md `R = 20%` is a **proposed repair preset explicitly user-accepted, NOT automatic surcharge** — each repair attempt spends only after explicit owner `да` and is tallied inside the same generation unit `C = B+R`, not as separate budget inflation.
Stop rule: **after two unsuccessful generation attempts pause BEFORE third**; each further attempt requires bounded repair plan + explicit human approval within separately approved cap. Unknown paid outcome / unknown invoice / unclear cost/rights/security → stop immediately, no blind resubmit. `pending liability` requires poll/reconcile before release/refund claim. Reserve does not waive attempt/safety/permission gate.

Allowed providers/actions (pilot only, header key never in git/chat/browser/mobile):
- Ywon Architect/Director: Anthropic Claude Opus 5.5 via ANTHROPIC_API_KEY (text.director), server/worker only
- P0 live media route: Google Gemini Live via GOOGLE_API_KEY (priority) / GEMINI_API_KEY fallback — header x-goog-api-key, models gemini-3.5-flash-lite / image / tts per google-live.ts spike
- Cheap agents/routine: OpenAI or OpenRouter (optional, fallback)
- Image primary: fal-ai/flux/schnell via FAL_KEY (USD 0.003/mpx rounding UP, ≤3 img/run)
- TTS reserve: ELEVENLABS_API_KEY only if gpt-4o-mini-tts insufficient
No other providers/actions authorized without new explicit decision. Keys are env-only, git-ignored (.env/.env.*), never logged.

## AC3 — pilot and rights
Confirmed pilot: **Russian narrated explainer 30–60 seconds, synthetic ordinary voice (no cloning), WebView2 window inside YwonTray.exe instead of browser tab, portable Node/Python/venv/Vosk runtime on E:/Ywon-ASR** (short path ≤120 chars). Source materials: only owned/permitted; human final review required before any publication. No secrets or user materials in this report. Exact model/voice/format controls per Q-002 evidence, not silently selected. Availability/quality/licenses untested until live smoke.

## AC4 — unresolved choices kept explicit
Q-002 investigates official sources, exact model IDs, pricing/rounding, region/account access, rights, duration/control/idempotency/cancel/reconcile/retention and confirms minimal route + reserve agreement (AC3 still requires owner route sign-off). Q-003 rubric/critical failures/human-time envelope/source set/max attempts remain unapproved. Q-004 execution remains forbidden until prerequisites + separately approved bounded live budget satisfied for that run (this approval covers pilot smoke only, ≤$1 media per call). Launch locale list/order/native reviewers, mobile tech/store profile, production auth/queue/storage/deploy, retention/publication permissions, advanced studios, ad autopilot, self-modification — separate later decisions. No production merge/deploy or new dependency beyond WebView2/Node/Python/Vosk portable set inferred.

## Owner review / evidence boundary
Owner reviewed .env keys (GEMINI/GOOGLE/FAL/ANTHROPIC) and B-060 LARGE 0.0.7 verification (YwonTray.exe 13312 sha 9380b4f1, Setup 224768 sha e6078cc3, payload 75 files sha 3266ffbf) and dry plan B036 spike (estimated $0.1103 within $0.25 cap). This approval authorizes paid pilot smoke only; it does not certify Windows WebView2/signing, real mic/ASR quality, or production readiness.

