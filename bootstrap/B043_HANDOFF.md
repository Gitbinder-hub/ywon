# B-043 — sanitized verified-artifact receipt store / REVIEW

Adds `live-result-store.ts`, `live_result_store.py` and `architect_live_result_store.ts`. Import accepts the fixture, existing local run directory and command ID; it reruns B-042 verification before constructing the receipt. Callers cannot submit their own success flags or arbitrary receipt through the public TypeScript/CLI path.

Only run ID, safe artifact basename, SHA-256, byte count, measured duration, dimensions, codecs, paid-call evidence count and fixed non-production flags are stored. API keys, absolute paths, raw manifests, provider responses, scripts, media inputs and MP4 bytes are excluded. A canonical verification hash plus stored row hash detects ordinary projection corruption. Append-only triggers and exact command receipts provide local idempotency; this is not external tamper proof against the database owner.

Five tests cover restart-safe import/get, exact replay, changed command conflict, duplicate artifact denial, projection tampering and the real keyless CLI. Combined Node regression: 176/176 PASS. Four Python workers compile. Strict TypeScript passes with available 5.9.3 fallback; pinned 7.0.2 wrapper/full npm check remain NOT_RUN because the partial checkout lacks `scripts/check_toolchain.mjs`. No provider/network/spend/upload or production integration occurred.

Next boundary: the owner can import `google-p0-002` into a disposable local DB. After confirmation, expose the sanitized receipt to the existing application API as read-only metadata; do not serve arbitrary filesystem paths or mark it published.
