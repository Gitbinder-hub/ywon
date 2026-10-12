# Qevunara Companion — B-051 offline local owner pilot

Actual read-only execution, not an autonomous LLM, production client or connected cloud Companion. Node 24 required; uses built-in experimental node:sqlite via a typed adapter, no new dependency or Python for this runner. Existing media subsystem still needs Python/FFmpeg separately.

## Implemented
- Strict local task/permit contracts from packages/companion-protocol.
- Explicit trusted owner folder approval; device/workspace binding, finite expiry/task/file/byte bounds, revocation.
- Durable local SQLite task state, append-only hash-linked events, exact task replay, operation dedup and atomic permit usage.
- Read only selected UTF-8 .txt/.md/.csv/.json, max32 files/1MiB each/8MiB task; pinned hashes, text metadata, no raw text in result. No recursive crawl or shell/browser/plugin execution.
- Persist checkpoint before advancing; live leases/epochs prevent two local writers; expired read-only tasks can resume. This safe retry property DOES NOT extend to future external side effects.
- Stop/revoke checks between files and before commit; final revalidation; artifact hash derived from checked metadata. Event/projection hashes detect ordinary corruption, not malicious DB owner.
- Portable CLI entry via pathToFileURL, BOM-friendly JSON, synthetic-material demo.

## Trust boundary / limitations
Local caller/owner and data directory trusted; same OS user can edit DB/code, so this is NOT technical owner authentication or a security sandbox. No cloud/server pairing, API/service/storage/paid ledger integration, secrets, network calls, GUI/browser tools, auto publish or wallet. No privileged daemon. Junction/symlink/hardlink/UNC/portable path checks reduce unsafe paths but do not prove adversarial reparse/TOCTOU isolation on Windows. Windows10/11, macOS and distribution builds NOT_RUN; real Linux-host source checks are not desktop support certification. Node SQLite experimental status stays explicit.
`run()` trusted onCheckpoint callback is embedding/test control, not accepted tool/JSON input. If it throws, committed task stays leased until expiry, simulating crash. Real process-kill recovery also tested. No grant/counter refund just because task failed or stopped. No boundless idle LLM loop.

## Next target, not hidden TODO
TR-05/TR-06: authenticated device protocol + small user-session UI + Windows10/11 acceptance; then Linux/macOS. Preserve LocalTask contracts, map richer public TaskEnvelope explicitly, do not call protocolVersion1 local subset the full cloud wire contract. Schema v1 rejects foreign DB; future version requires migration/backup/rollback before opening. Keep SQLite for device and Postgres as authoritative server state. No production readiness switch without evidence.
Guide: bootstrap/COMPANION_LOCAL_PILOT.md. Evidence/handoff: bootstrap/B051_HANDOFF.md. Existing Factory manual/API publication is independent. Q states/gates remain unchanged.
