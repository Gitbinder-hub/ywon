# b-roll-planning — stock vs generation coverage with rights gate

Fidelity: `prompt_guidance` planning (stock vs generation allocation). Actual generation fidelity per selected adapter.

## Fidelity

Per-beat source selection under budget, with placeholder fallback.

## Inputs / Outputs
- Input: `script_beats[]`, `available_stock_ids[]`, `allow_generation`, `protected_entities`, `budget_remaining_minor`.
- Output: `plan[] {beat_index, source: stock|generated|placeholder, asset_id, estimate_minor, rights_note} + manifest_hash + report`.
- Placeholder is `degraded: placeholder_for_uncovered_beat` — visible to user, not silent stock.

## Decision
For each beat: (1) score available stock by rights/quality match, (2) pick cheapest `stock` if rights allow, (3) otherwise `generated` if `allow_generation` and budget, (4) otherwise `placeholder`. Protected entity without matching stock or allowed generation → `unsupported: no_source_for_protected_entity` — never invent a synthetic testimonial (`forbidden_this_iteration`).

## Rights
Every stock asset needs `rights_note` (license/provenance). `stock-pexels/unsplash` require verified source in tool-registry manifest before `stock` selection; otherwise fall back to `generated` or `placeholder`.

## Budget
`limitMinor: 4000`, local planning cost only. Actual generation cost via `packages/budget` GenerationUnit — not booked here, only estimated per beat (`estimate_minor`).

## Provenance
Mechanism from OpenMontage `b-roll-planning / stock-sourcing` — borrowed, original text.
