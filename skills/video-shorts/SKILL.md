# video-shorts — Shorts/Reels 30–60с: hook + голос + музыка + платформа

Fidelity `prompt_guidance`: сборка по таймлайну из реального материала, генерация только где разрешена.

Budget `limitMinor 7000 worstCase 7000` `curiosity_reserve 6%` внутри GenerationUnit. Retries 2.

## QA
- `duration_ok` 30–60с, `hook_present`, `source_sufficient`. Непригодный исходник → `unsupported: insufficient_source_material` — клипы не обещаются. Пустой hook → `unsupported: hook_missing`.

## Material
- `source_material_ids[]` — если пусто или материал короче `durationSec` без возможности генерации → `insufficient_source_material` с предложением `degraded: trimmed_to_fit_platform` только после согласия.

## Provenance
`MODES_AND_RECIPES.md: Видео` — `материал, длительность, hook/голос/музыка/платформа`.
