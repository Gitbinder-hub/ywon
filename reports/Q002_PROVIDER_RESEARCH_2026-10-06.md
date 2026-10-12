# Q-002 — official-source provider research — 2026-10-06 09:45 Asia/Bangkok / zero generation calls

Checked public official sources 2026-10-06 via fetch. No API keys, no live calls, no purchases. Bounded P0 explainer shortlist only. Prices are public display, not owner invoice; taxes excluded; can change.

Owner Q-001 approved 2026-10-06 pay-as-you-go unlimited, per-run cap USD 0.25-1.00 media / USD 2-5 Architect, reserve 20% explicit, WebView2 yes (reports/P0_APPROVAL.md). Base HEAD = current checkout (validate PASS). This research covers Q-002 AC1/AC2; AC3 pending owner route agreement.

## Fetched sources (checked_at 2026-10-06)
- https://ai.google.dev/gemini-api/docs/pricing — Gemini pricing (per-1M tokens, Free/Paid/Batch/Flex/Priority)
- https://ai.google.dev/gemini-api/docs/models/gemini — catalog, deprecations, naming stable/preview/latest, updated 2026-10-01
- https://ai.google.dev/gemini-api/docs/image-generation — Nano Banana via gemini-3.1-flash-image, interactions API
- https://ai.google.dev/gemini-api/docs/speech-generation — TTS via gemini-3.8-flash-tts / lite-tts, 24kHz wav/pcm, voice_... keys
- https://ai.google.dev/gemini-api/docs/available-regions — 180+ territories, 2026-04-28 (Russia not listed in excerpt)
- https://fal.ai/models/fal-ai/flux/schnell — FLUX.1 schnell 12B, USD 0.003/mpx rounded UP
- https://fal.ai/docs/documentation/model-apis/pricing — per-model billing, success-only, prepaid credits, programmatic pricing API
- https://docs.anthropic.com/en/docs/about-claude/pricing — Opus 5.5 Input $4 / Output $20 per MTok, cache writes $5/$8, hits $0.20
- https://platform.openai.com/docs/models/gpt-4o-mini-tts — Input $0.60 / Output $12 per 1M, max 2000 tokens, voices alloy/coral
- https://platform.openai.com/docs/guides/text-to-speech + /pricing — POST /v1/audio/speech, formats mp3/opus/aac/flac/wav/pcm, ru supported

Local pin: packages/architect/src/google-live.ts — GOOGLE_LIVE_MODELS gemini-3.5-flash-lite / gemini-3.1-flash-lite-image / gemini-3.8-flash-lite-tts (B-035/B-036). Current docs show 3.8 family stable; pinned IDs need live recheck.

## 1) Image candidates

### fal-ai/flux/schnell — PRIMARY
- ID: `fal-ai/flux/schnell`; pages: https://fal.ai/models/fal-ai/flux/schnell ; https://fal.ai/docs/documentation/model-apis/pricing
- Price: **USD 0.003 per megapixel, rounded UP** to next mpx. Text: "Images are billed by rounding up to the nearest megapixel." Prepaid credits, taxes excluded, may change. Programmatic: `GET /v1/models/pricing?endpoint_id=fal-ai/flux/schnell` Authorization: Key $FAL_KEY.
- Params: `prompt`, `image_size` (presets/custom W/H), `num_inference_steps` 1-4 default 4, `num_images`, `seed`, `enable_safety_checker` true, `output_format` default PNG. Exact min/max enum/ref support UNKNOWN.
- Region/access: eligibility, concurrency (scales with credits), rate limits UNKNOWN without account. US export controls apply.
- Commercial: hosted page labels **commercial use** for this endpoint; does not license self-hosted weights/likenesses/third-party assets.
- Duration/audio/camera/ref: N/A (image only).

### fal-ai/flux/dev — RESERVE (same platform)
- https://fal.ai/models/fal-ai/flux/dev — **USD 0.025 per megapixel, rounded UP**, same rounding. Hosted commercial label; do not import to self-host.
- Same platform controls; costlier != proven quality.

## 2) Narration candidates

### Google Gemini TTS — pinned P0 route
- Pinned IDs (google-live.ts, B-035): `gemini-3.5-flash-lite` (text), `gemini-3.1-flash-lite-image` (image), `gemini-3.8-flash-lite-tts` (narration). Sources at B-035: /api-key, /pricing, /image-generation, /speech-generation.
- Current docs (2026-10-01) stable: `gemini-3.8-flash`, `gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, plus `gemini-3.1-flash-image` via Interactions API `POST /v1beta/interactions` {model, input, response_format:{type:'image', aspect_ratio}}. Mismatch: pinned 3.5/3.1-lite-image vs documented 3.8/3.1-image — **requires live availability check** (2.0/3.1-preview show shut down).
- Endpoint shape (code): `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` + `x-goog-api-key` (GOOGLE_API_KEY priority, GEMINI_API_KEY fallback); TTS `generationConfig:{responseModalities:['AUDIO'], speechConfig:{voiceConfig:{voice:'Kore'|'Puck'}}}`; default audio/wav 24kHz or raw audio/l16 PCM for concat.
- Price (pricing page 2026-10-06): Paid tier example 2.5 Flash-Lite Input $0.10 text/image/video / $0.30 audio per 1M, Output $0.40, cache $0.01/$0.03, storage $1.00 /1M/hr. Other tiers (3.8 Flash, Batch 50% off, Flex, Priority) differ. Image billed as output tokens (text/image/video column). **Conservative preflight estimate** in repo: `5000 + sceneCount*33600 + ceil(duration/10)*1500` micros USD. For approved 30s/3 scenes/Kore/ru = **USD 0.1103** (110300 micros) < cap 250000. Calls = sceneCount+2 =5; durationContract strict +/-2s fullNarrationRequired true; paidCalls false / executionAllowed false.
- Voices: prebuilt Kore, Puck + extended library voice_.../voicekey_... (200 stored voices 1y TTL, stateless 7d). Spike uses Kore per owner choice.
- Languages: ru supported via text input; multi-speaker 2 prebuilt voices per request; custom/replicated per-turn only.
- Region/access: 180+ territories in regions page (Kazakhstan, Kyrgyzstan etc present; Russia not in excerpt list). Age 18+, API key required. Quota/rate-limit UNKNOWN without account.
- Rights/limits: Google terms; context window/output limits per model page; grounding quotas 500 RPD free / 1500 paid then $35/1000 not used by spike.

### OpenAI gpt-4o-mini-tts — primary reserve narration
- Sources: /models/gpt-4o-mini-tts, /guides/text-to-speech, /pricing ; checked 2026-10-06.
- Endpoint: `POST /v1/audio/speech` Bearer $OPENAI_API_KEY, body model/input/voice/instructions/response_format/stream_format. Audio tokens as output.
- Price: **Input $0.60 / Output $12.00 per 1M tokens**. Formats mp3 default, opus/aac/flac/wav/pcm (wav/pcm lowest latency).
- Voices e.g. alloy/coral; ru supported via Whisper language list (docs: "generate spoken audio in these languages … Russian …"). Optimized for English but accepts ru.
- Limits: max 2000 input tokens. Rate limits Tier1 500/50k, T2 2k/150k, T3 5k/600k, T4/T5 10k/2M-8M. Snapshots gpt-4o-mini-tts, 2025-12-15, 2025-03-20 deprecated.
- Not yet wired in spike; alternative TTS path.

### ElevenLabs eleven_multilingual_v2 — secondary reserve
- Prior 2026-10-03 report; no fresh fetch this run — price/region/voice UNKNOWN until recheck https://elevenlabs.io/pricing . Only if eligible commercial account approved.

## 3) Director / Architect LLM

### Anthropic Claude Opus 5.5 — Ywon Architect/Director
- Sources: https://docs.anthropic.com/en/docs/about-claude/pricing ; https://www.anthropic.com/pricing ; 2026-10-06.
- Model family: Claude Opus 5.5 (docs list Opus 5.5/5/4.6-4.8). API pattern claude-opus-5-5 + versioning stable/preview/latest — exact string via Model IDs page.
- Price USD per MTok: **Input $4 / Output $20**; 5m cache $5 / 1h $8 / hits+refresh $0.20. vs Opus 4.6 $5/$25 $6.25/$10 $0.50 — Opus 5.5 20% cheaper. Sonnet 5.5 $2/$10, Haiku 4.5 $1/$5. Batch/cache combinable. USD, cards/invoicing, volume discounts negotiated.
- Rate limits Start/Build/Scale tiers; enterprise custom. Region global via Anthropic API.
- Note: P0_APPROVAL per-run cap $2-5 per Architect call; 50k in +20k out ≈ $0.20+$0.40=$0.60 fits; 2 calls ~$1.2 within pay-as-you-go.

## 4) Platform controls (shared)

### fal
Source pricing page + prior report:
- Prepaid credits; per-model unit (image/mpx, video seconds, flat per video, fallback compute-seconds). May change.
- Success-only billing: server errors 500+ never billed; queue wait free.
- Programmatic pricing: GET /v1/models/pricing, usage/time-bucketed analytics.
- Cancel/idempotency: no idempotent key in excerpt; client timeout != server stop; start_timeout deadline vs total duration. IN_QUEUE cancel removes, IN_PROGRESS signals but may complete 202 CANCELLATION_REQUESTED — not proof unbilled/refunded. In-progress billing UNKNOWN.
- Retention: Request JSON 30d default; X-Fal-Store-IO:0 prevents JSON storage NOT media privacy. Media URLs **public by default** (unguessable); Expiration header controls; FAQ >=7d default, lifecycle configurable. Public != private.
- Taxes/credits: taxes excluded; credits non-refundable/expiry; US export controls. Region/access UNKNOWN.

### Google
- Auth x-goog-api-key from GOOGLE_API_KEY priority / GEMINI_API_KEY fallback (env only).
- Cancel: no generic generateContent cancel-billing docs; spike code: "No automatic provider retry. Unknown outcomes require manual reconciliation." Network timeout => outcome unknown_check_manifest.
- Retention: logs per Google terms; dashboard/billing shows spend; local receipt store live_result_store.py holds sanitized receipt (hash/dims/duration/sha256, mediaAvailable false).

### OpenAI
- Idempotency header for some endpoints; retention per OpenAI data retention; not verified for TTS here.

## 5) Illustrative economics, NOT a quote

- **Fal schnell 3x1024x1024 (~2Mpx rounded UP):** 3*2*0.003= **USD 0.018** ; 3x1000x1000 (1Mpx) =0.009 if size supported. + TTS OpenAI <500 tokens @ $12/M ≈ <$0.006. So pure fal+OpenAI+FFmpeg ≈ cents per explainer excluding failures/taxes/storage/Director.
- **Google pinned spike (preflight):** USD **0.1103** max for 30s/3 scenes (text+3image+tts =5 calls). Actual invoice = token counts. Within $0.25 cap; with 20% reserve R=0.022 => C=0.132 within per-run bounds, cumulative B+R per GENERATION_RESERVE.md.
- **Director:** Opus 5.5 ~$0.60 per 50k+20k call as above.

**Total accepted-result cost UNKNOWN** until live eval: rejects, all attempts, taxes, storage, compute, human review not measured.

## 6) Recommended minimal route + reserve (proposed, NOT agreed)

Primary for first ru 30-60s explainer (synthetic ordinary voice, no cloning, E:/Ywoom-ASR):
- Images: fal-ai/flux/schnell (cheapest, commercial hosted label, local FFmpeg) OR Google gemini-3.1-flash-image if GEMINI key funded and single-provider preferred.
- Narration: Google gemini-3.8-flash-lite-tts voice Kore (same billing) — fallback OpenAI gpt-4o-mini-tts alloy/coral if unavailable/quality insufficient.
- Assembly: local FFmpeg -shortest h264/aac 1280x720 concat+scale+pad as in google-live.ts — no neural video for MVP.
- Director: Anthropic Claude Opus 5.5 via ANTHROPIC_API_KEY server/worker only, per explicit approval.

Reserve: fal-ai/flux/dev (same platform, not independent). If platform outage, no reserve; second vendor none approved. ElevenLabs eleven_multilingual_v2 only if account separately approved (price recheck). Neural video optional P5; static+honest 2D motion is video path, not camera/ref claim. No silent fallback; each switch needs owner decision. AC3 pending owner confirm before Q-003/Q-004 live.

## 7) Evidence / next decision

- AC1: candidates documented with source/checked_at/model ID/region/commercial + unknowns flagged.
- AC2: duration/rounding/audio/ref/control/idempotency/cancel/retention documented or UNKNOWN.
- AC3: **NOT_RUN** — pending owner agreement on exact route/cost/limitations. No live spend.
- Plan: planGoogleLiveSpike({runId:'google-p0-002', topic:'Почему небо выглядит голубым', language:'ru', durationSec:30, aspectRatio:'16:9', sceneCount:3, voice:'Kore', maxEstimatedUsdMicros:250000}) => 110300 withinCap true calls 5 durationContract strict +/-2s fullNarrationRequired true (google-live.ts). Env GOOGLE/GEMINI/FAL/ANTHROPIC all len 0 — live NOT_RUN expected.
- validate PASS (spec/task/handoff consistency). Product/media NOT tested by validate.
- Next: Owner review this report => explicit Q-002 acceptance (route+cost) => Q-003 rubric before --live. When authorized, run scripts/architect_google_spike.ts with --live + env key + --output-root under E:/Ywoom-ASR/payload_stage, then verifyGoogleLiveResult + live_result_store.py import, poll reconcile, invoice check. Keep local op record; do not recycle historical PASS.

Limitations: excerpt != full JSON schema validation; marketing text != limits; estimate != hard cap; availability/quality/licenses untested until live.




