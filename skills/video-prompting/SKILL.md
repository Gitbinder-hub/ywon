# video-prompting — 200-term prompting dictionary with provider templates

Prompt is guidance, not a guarantee. Maps to `docs/production/15_STUDIO_SKILLS.md:11` model-specific templates.

## Fidelity
`prompt_guidance` — approximate semantic guidance. No physical orbit/dolly guarantee from prompt alone. If `exact_3d` or `supported_control` is required, route via `SCENE_COMPILER.md` Exact3D/SupportedModelControl adapters instead — this skill returns `unsupported: fidelity_mismatch`.

## Inputs / Outputs
- Input: `brief` (1–4000 chars), `style` (one of 4 playbooks), `target_duration_sec` (3–60), `language` en/ru, `aspect`, `protected_entities`.
- Output: `prompts[] + negative_prompts[] + manifest_hash + fidelity_note` plus `report {assets, cost, qa, open_issues}`.
- Each prompt is rendered from a provider template; generic fallback is `degraded: template_fallback_to_generic` with explicit note.

## Provider Templates (model-specific)
`prompts/` contains verbatim structures adapted as mechanism (not verbatim AGPL text):
- `veo-3.1-14.md` — 14-component structure (subject, action, scene, style, camera, lighting, composition, motion, mood, detail, constraints, negative, aspect, duration)
- `seedance-8.md` — 8-component premium structure
- `sora-template.md` — Sora storyboard structure
- `ltx-6.md` — 6-element LTX structure
Select by Router `optional_capabilities` intersection; hard constraints first (`06_MODEL_ROUTER.md:13`), then cheapest supported.

## Dictionary
~200 cinema terms for shot type, lens, movement, lighting, composition — used as term bank inside templates, not as freeform prompt injection. Unknown model → `unsupported: unknown_model_template`.

## Budget
`limitMinor: 3000`, `curiosity_reserve: 7` (inside GenerationUnit cap, burns on delivery). Local text-gen cost only; no paid API.

## Provenance
Mechanism borrowed from OpenMontage `skills/creative/video-gen-prompting` — AGPL mechanics studied, text original.
