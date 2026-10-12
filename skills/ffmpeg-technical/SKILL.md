# ffmpeg-technical — honest 2D motion via FFmpeg/compositor

Versioned graph with typed inputs/outputs, capabilities, evidence, pricing/reserve, retries, approval, delivery report.

## Fidelity
`2d_approximation` only. Honest: pan/zoom/push_in/shake via local 2D transforms. Not orbit, not dolly, not FPV. Real orbit/dolly require geometry or unseen-region generation — denied via `orbit_not_supported_by_2d_preset`. Maps to `docs/production/15_STUDIO_SKILLS.md` Cameras.

## Inputs / Outputs
- Input: `source_asset_id` (pinned asset hash), `preset_id`, optional `durationSec` (1–10s), `protected_regions`.
- Output: `artifact_id + preview_url + manifest_hash + report {assets, cost, qa, open_issues}`.
- Reuse key: `inputHash + skill/version + adapter/renderer + params + dependencies` — invalidates only affected nodes.

## Capabilities & Limits
- Requires `ffmpeg-transform`. No `control_video/depth/pose` inputs → `unsupported`.
- `protected_regions` preserved; violation → `unsupported: protected_region_violation` with review card.
- Duration capped to preset `maxDurationSec`; request beyond cap → `degraded: capped_duration` with human-visible note.

## Budget & Reserve
- `limitMinor: 5000` (USD cents), `worstCaseMinor` = limit, `curiosity_reserve: 5` burns on delivery. Reserve via `packages/budget` GenerationUnit — single unit keeps cumulative cap.
- Retries `maxAttempts: 2` with `backoffMs: 800`; third attempt before pause per AGENTS Stop rule needs bounded repair plan.

## Steps & Approval
`validate_input → apply_transform → qa_duration_resolution → report` — QA checks duration/resolution/fps per `docs/production/05_PIPELINE.md:29`. Approval: `qa` card.

## Provenance
Mechanism adapted from OpenMontage `skills/core/ffmpeg` — mechanism borrowed, code original, not AGPL derivative. See `skills/_provenance.md`.
