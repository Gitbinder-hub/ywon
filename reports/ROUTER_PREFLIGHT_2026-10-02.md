# Router / aggregator preflight — preparation, not Q-002 completion

Owner request: Oleg, 2026-10-02 15:00 Asia/Bangkok. This report answers the connector question and prepares setup. It does not accept Q-001, start dependent Q tasks, authorize paid calls, or activate P1/P2. No credentials or user media were used.

## Current repository facts
Checked branch bootstrap/spec-v04-foundation at 58ea518b26028f49f0814e30a72252479b825d74; PR #1 draft/unmerged; main 971b26aca5d3dbb29d6d95239a9b395b83cfb978.
packages/router/README.md explicitly says NOT implemented. Current /api/generate denies. B-002 is local assembly from supplied images/narration, not generation. All 50 Q tasks remain TODO; P0 current; Q-001 unresolved.
Canonical contract: docs/production/06_MODEL_ROUTER.md. Hard constraints first, then measured accepted-result cost/latency/failure. Director proposals cannot bypass code-enforced budget/policy. Aggregators are allowed candidates, not selected providers. Scout proposes candidates for review; no automatic production adoption.

## Public sources checked on 2026-10-02
- OpenRouter pricing: https://openrouter.ai/pricing — provider list-price inference; Standard credit-purchase fee 5.5%, Business 8%; taxes extra where applicable. This is not a wholesale-discount guarantee. Enterprise fee discounts are not inference discounts. Recheck before payment.
- OpenRouter FAQ: https://openrouter.ai/docs/faq — unified access, privacy settings; no current general volume discounts. Opt-in prompt/completion logging offers a 1% discount: NOT recommended for private user content. Underlying provider terms still apply.
- Provider routing: https://openrouter.ai/docs/guides/routing/provider-selection — select endpoints for a model, sort by price/latency/throughput, parameter support, data policies, price ceilings and fallback preferences. Unit-price ceilings are not total project spend caps. Preferred performance thresholds are soft preferences, not guarantees.
- Auto Router: https://openrouter.ai/openrouter/auto — a text/chat routing endpoint exists. We did not run it or establish its quality, savings, selected candidates, or account availability. Do not treat routing as free downstream inference.
- Model catalog: https://openrouter.ai/api/v1/models?output_modalities=all — pricing page documents this public catalog endpoint. We did NOT fetch/validate the entire catalog or approve its models.
- fal overview: https://fal.ai/docs/documentation/model-apis/overview — image/video/audio model endpoints, JSON schemas, direct and queued calls. Shared calling pattern does not make model inputs/rights interchangeable.
- fal pricing: https://fal.ai/docs/documentation/model-apis/pricing — model-specific billing units (image/megapixel/video seconds/etc.); successful outputs billed; server errors/queue waiting not billed per documented policy. Subjectively rejected successful outputs still consume budget. Cancellation/unknown-state billing needs endpoint-specific verification.
- LiteLLM: https://docs.litellm.ai/docs/routing — software gateway with deployment routing, cost-based strategy, timeouts/retries/fallbacks. Not a token wholesaler. Not installed or selected; SDK/gateway retries must not create untracked paid attempts.

## Recommendation — proposed, not implementation
Keep a Ywoom-owned versioned capability/pricing registry and provider adapter boundary. Separate task-to-model selection from model-to-hosted-endpoint selection. An external catalog feeds candidates, not automatically approved routes.
For P0, pin one verified path and a compatible reserve. An LLM gateway such as OpenRouter is a candidate for script/planning; fal is a media candidate. Compare direct APIs for exact chosen endpoints. Do not purchase all accounts or assume one gateway covers every TTS/video capability.
Newer models enter a candidate report, official terms/access check and bounded benchmark before approval. Persist actual model/provider/version, pricing timestamp, parameters, operation/job IDs, usage, attempts and asset hashes. Reject stale/unbounded estimates. Unknown paid outcome means reconcile, not blind retry.
A direct replacement can reuse a chat-compatible boundary where appropriate, but requires contract tests, error/usage normalization, privacy checks and renewed cost evaluation. Changing a base URL alone is not universal migration.
Savings are a hypothesis: cheaper compatible models, shorter prompts, caching when applicable, asset reuse and fewer retries. Compare cost per accepted result including gateway fees, rejected outputs, media/compute/storage and human intervention. No percentage savings promised.

## What the owner needs to do, and when
Now: decide remaining Q-001 staged scope; separate live-eval/development caps, currency, validity period/payment model and stop rule. Confirmed Russian 30–60s/no-cloning/permitted-material/manual-final-review scenario remains unchanged. No key needed to read public documentation.
After route recommendation: approve exact providers/models, data handling/region and estimate; create dedicated test accounts/keys only for selected services. Set billing/key limits where available and disable automatic top-ups. Do not top up until the agreed amount is explicit. Subscription entitlements are not assumed to cover API usage.
Before real Q-004: Q-001 then accepted Q-002/Q-003, approved inputs/rubric/attempt counts, working local secret loading, pre-submit caps/attempt accounting and safe unknown-state handling. The owner puts secrets in their local env/secret store, never in chat/GitHub. This assistant has no access to the owner's local .env.
.env.example is an EMPTY candidate template only; current application does not read/use these candidate keys. No provider client, budget guard or secret loader was implemented by this report. TTS/direct-provider key names remain pending exact selection.

## Verification and limits
Sources were read publicly without inference calls; accounts/region access/real quality/model-level commercial rights are not verified. No complete model registry or live route exists.
Local preparation checks cover exact file inventory, empty ENV assignments and existing .gitignore behavior for .env/.env.local/.env.example. They do not test the product.
GitHub Git checkout was unavailable in this session (DNS); project.py validate/status/next and full make check NOT RUN. Previous 98-test evidence remains historical, not a fresh result. GitHub CI unknown (403). Local assistant/compute costs unknown, not zero.
