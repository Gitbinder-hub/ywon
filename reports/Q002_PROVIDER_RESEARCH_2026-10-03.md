# Q-002 — official-source provider research / REVIEW, zero generation calls

Owner confirmed Q-001 and Q-002/Q-003 preparation at zero spend on 2026-10-03 12:24 Asia/Bangkok. Base remote f80409ce8742ebf609080ea9e108278666970b20. Checked public official sources on 2026-10-03. This is a bounded explainer shortlist, not an exhaustive catalog or completed production integration. No provider API credentials, account access checks, purchases, user uploads or generation requests were used.

## Recommended route — proposed, not yet agreed

Primary proposal: fal hosted fal-ai/flux/schnell images + direct OpenAI gpt-4o-mini-tts with a later owner-selected built-in voice + existing local FFmpeg assembly. Reserve proposal: fal-ai/flux/dev images and ElevenLabs eleven_multilingual_v2 narration if an eligible commercial account is separately approved. Reserve models are NOT interchangeable guaranteed equivalents and are never selected silently.

Neural video is optional for the first narrated explainer. Static generated images plus honest local movement/editing are a video assembly path, NOT neural video generation. Do not claim camera/ref/identity control or photoreal continuity from these text-to-image candidates. The deprecated Kling 2.1 standard endpoint below is rejected, not a backup. No Director LLM is selected by this media shortlist; no cheaper hidden text model or assumed owner preference.

Q-002 AC3 remains NOT_RUN: owner has not yet agreed the exact route/cost/limitations. Q-003 remains dependent on accepted Q-002; do not begin its implementation or any live eval from this research alone.

## Image candidates

### fal-ai/flux/schnell — primary candidate
- Official model page: http://fal.ai/models/fal-ai/flux/schnell ; schema entry: https://fal.ai/models/fal-ai/flux/schnell/api . The rendered API page was dynamic; full formal schema limits were not extracted. Do not treat marketing text as schema validation.
- Official displayed price: USD 0.003 per megapixel, images rounded UP to the next megapixel. Public price only, not an owner/account quote; taxes excluded by platform terms, pricing can change. Recheck via the authorized pricing service before any eventual execution.
- Published parameters include prompt, image_size, num_inference_steps (1–4), num_images, seed, safety checker and output format. Exact min/max dimensions, image count bounds, accepted enum values and endpoint support for references: UNKNOWN from retrieved formal schema. No guaranteed deterministic rerun from a seed; retain exact outputs and hashes.
- Platform/model page labels hosted inference commercial-use eligible. This is NOT a blanket guarantee against third-party rights and does not license arbitrary self-hosted weights, likenesses or source images. Applicable account/model terms must be confirmed.
- Duration/audio/native camera/ref-image control: not applicable for text-to-image; related endpoint capabilities do not automatically apply to this exact ID.

### fal-ai/flux/dev — image reserve candidate
- https://fal.ai/models/fal-ai/flux/dev
- Official displayed price: USD 0.025 per megapixel, rounded up. Hosted endpoint labels commercial use; do not import this license statement into self-hosted FLUX dev deployment.
- Text-to-image, image output; exact formal dimensions/step/ref constraints UNKNOWN in retrieved excerpt. Slower/costlier is not evidence of accepted-result quality; must be measured in approved evals.
- Same platform cancel/retention/retry rules below; it is not an independent provider outage reserve.

## Narration candidates

### OpenAI gpt-4o-mini-tts — primary candidate
- https://developers.openai.com/api/docs/guides/text-to-speech ; https://platform.openai.com/docs/models/gpt-4o-mini-tts
- Endpoint documented: POST /v1/audio/speech. Russian is in the supported-language list, while voices are optimized for English. Russian intelligibility/prosody/number/name pronunciation have NOT been evaluated.
- Official model page: max 2000 input tokens; USD 0.60 / 1M input TEXT tokens and USD 12 / 1M output AUDIO tokens. Do not confuse these units with text LLM tokens or guarantee a fixed per-minute invoice. General pricing extraction did not show a matching TTS row; the model-specific source is the current evidence and must be rechecked before use.
- Formats include MP3, WAV, PCM, AAC, FLAC, Opus per guide; exact compatibility with this model/account to test. Built-in voices only proposed, no cloning. Guide has inconsistent 11-versus-13 voice counts; exact allowed enum/voice remains unselected rather than silently assumed.
- No guaranteed 30/60-second duration lock; measure generated audio, then explicit script/pacing revision or disclosed approved trim. Local B-002 enforces audio compatibility but does not fix upstream quality automatically.
- Guide requires clear disclosure that the voice is AI-generated. API services agreement assigns Output rights as between customer and OpenAI, subject to law/terms; user must have input rights, and accuracy/non-infringement are not guaranteed: https://openai.com/policies/services-agreement
- Thailand is in the API supported-country list: https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories . This is not a finding about the owner's residence, nationality, billing identity, account verification, hosting jurisdiction or account-specific model access. All account access fields remain UNKNOWN/unverified.
- Model page: Free API tier not supported. Existing assistant/ChatGPT subscription is NOT assumed to supply API credits.
- /v1/audio/speech data-controls row: not used for training; default abuse-monitoring retention 30 days; no application-state retention; ZDR eligibility is not proof this account has it: https://developers.openai.com/api/docs/guides/your-data
- Synchronous/streamed audio response, not a confirmed durable asynchronous job. Provider-level create idempotency, cancellation billing, refund and lost-response result retrieval guarantees: UNKNOWN. Network abort is not proof processing/billing stopped; unknown outcome requires stop/reconciliation, not blind retry.

### ElevenLabs eleven_multilingual_v2 — narration reserve candidate
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech ; https://elevenlabs.io/pricing/api ; https://elevenlabs.io/text-to-speech
- Official capability source: Russian included in 29 languages, 10,000-character limit; default MP3, PCM and other formats exist with plan-dependent output quality. Exact built-in voice ID remains unselected. The detailed convert reference load was canceled, so exact request/voice/continuity/idempotency schema is NOT verified here.
- Official API pricing page displays v2 Multilingual USD 0.08 / 1000 characters, with plan/credit/included-quantity tables and promotions. This is not a verified account invoice, universal minimum charge, or a promise of zero monthly cost. Determine plan, eligible credits, minimum commitment, output tier, character accounting/rounding and taxes before use.
- Public TTS page: free plan personal/non-commercial with attribution; paid plans offer commercial usage under terms/policies. Commercial rights for a pay-as-you-go/account-specific arrangement remain UNKNOWN until its exact agreement is checked. Do not buy or upgrade a plan now.
- Enterprise ZRM is conditional, API-only and associated with enable_logging=false; no zero-retention entitlement inferred: https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode
- Region/account access, retention for ordinary account, cancellation billing, durable retrieval for a lost response, idempotent generation and refund: UNKNOWN. No voice cloning or uploaded identity.

## Rejected video candidate

https://fal.ai/models/fal-ai/kling-video/v2.1/standard/image-to-video labels fal-ai/kling-video/v2.1/standard/image-to-video DEPRECATED. It still displays USD 0.28 / 5-second video plus USD 0.056 / additional second and commercial-use label. A price displayed on a deprecated page does not prove availability. Reject for new integrations; do not silently substitute Kling v3 or another endpoint. Exact audio/ref/duration/schema/access constraints remain unknown and are irrelevant to this rejected route.

## fal platform controls — safety-relevant facts

Sources:
- https://fal.ai/docs/documentation/model-apis/inference/queue
- https://fal.ai/docs/documentation/model-apis/common-parameters
- https://fal.ai/docs/documentation/model-apis/inference/reliability
- https://fal.ai/docs/documentation/model-apis/media-expiration
- http://fal.ai/docs/documentation/model-apis/faq
- https://fal.ai/terms.html

Queue submission returns request_id and URLs for status/result/cancel. Save the ID durably before later operations; queue COMPLETED can also contain an error. Checking an existing request is not creating a new request. Exactly-once create/idempotency for a lost submit response is NOT established by possessing a later request ID.

Default queue retry can reach ten attempts, and model fallbacks are enabled by default. Verified controls: X-Fal-No-Retry: 1 disables platform retry; x-app-fal-disable-fallback: true disables model fallback for that request. X-Fal-Retry-Config condition counts apply only to own apps and are ignored on shared/public model APIs; do not use it to enforce the owner's two-failure rule on these candidates. Headers are documented, not live-tested on this account. Both client SDK retries and server model routing need validation before eventual use; do not assume the no-retry header covers every network layer.

Client timeout stops polling, not server processing. start_timeout is a time-to-start deadline, not total inference duration. Cancel IN_QUEUE removes the request; cancel IN_PROGRESS sends a signal and the app may still complete. 202 CANCELLATION_REQUESTED is not proof canceled, unbilled or refunded. Exact in-progress cancellation billing/refunds remain UNKNOWN.

Media URLs are public by default; fal CDN input uploads and generated outputs need a separate access-control/retention decision. Request JSON retained 30 days by default. X-Fal-Store-IO: 0 prevents JSON storage but DOES NOT privatize/delete media. Expiration header controls media lifecycle; FAQ says media available at least seven days by default, detailed lifecycle page says configurable. Do not interpret a public unguessable URL or shorter TTL as privacy. Do not send private/confidential owner/customer materials under the default setup. Disabling remote payload history can reduce reconciliation evidence; keep a local protected operation record, and agree data handling before live use.

fal terms require prepaid credits; displayed prices exclude taxes and can change, credits are generally non-refundable/subject to expiry. Platform third-party terms and US export controls apply. Exact country/account eligibility is unverified; timezone is not legal/account evidence. Account region/access/rate-limit/billing scope is UNKNOWN for both fal candidates. No provider availability claim from public docs alone.

## Illustrative economics, NOT a project quote

Three independently generated 1024×1024 images each exceed one decimal megapixel and round UP to two megapixels under the literal published rounding rule: 3 × 2 × USD 0.003 = USD 0.018 for schnell; USD 0.150 for dev. Three EXACT 1000×1000 images would instead be USD 0.009 / USD 0.075 if that size is formally supported and accepted. Exact dimensions and billed-unit rounding must be confirmed before reserving budget. Batch rounding semantics also remain UNKNOWN; do not optimize with an assumption.

TTS cost depends on output audio tokens or plan/characters; failed/rejected outputs, all attempts, taxes, storage, Director work, provider minimum commitments and actual compute cost are not measured. TOTAL accepted-result cost remains UNKNOWN; no claim a full video costs cents or that cheap generation will satisfy quality. No generation spend occurred in this research.

## Evidence / next decision

Q-002 AC1/AC2: bounded candidates documented with sources/date/exact IDs and explicit unknowns; actual provider access/quality still untested. AC3: pending owner route/cost/limitations agreement. Recommend confirming the primary proposal for planning ONLY, with reserve candidate review and paid execution separately gated. Then owner review/acceptance of Q-002 before Q-003.

Workflow test issue discovered after the first real Q-001 acceptance: 44-test spec suite had 2 assertion failures and 14 errors because temporary tests inherited the progressed real registry instead of a baseline. Fixed only test fixture setup in tests_spec/test_project.py and test_v04.py; added two refusal/isolation regressions. No task acceptance criteria, dependency, policy/budget/production guard or project.py implementation was weakened. The real registry stays progressed; baseline reset refuses the actual root and operates only inside disposable test copies. Updated suite: 46 tests PASS. Complete check results and publication state are recorded in the session handoff; do not recycle historical full-check PASS as a new run.
