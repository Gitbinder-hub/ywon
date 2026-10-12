# code-scaffold — бот / апка / скрипт / автоматизация по брифу

Универсальный кодовый скил — не контент. `prompt_guidance` с typed входом и `qa_syntax` перед сдачей.

Budget `limitMinor 4000 worstCase 4000` `curiosity_reserve 7%` внутри GenerationUnit.

## Fidelity & Limits
- `prompt_guidance` — код генерируется, но `arbitrary shell / embedded secrets` в payload запрещены (`forbidden_this_iteration`).
- Без live creds отдаётся `degraded: stub_without_live_credentials` с `preview_ready`, не фейковый `live`.
- Неизвестная платформа → `unsupported: unknown_platform`.

## Steps
`validate_brief → select_stack → generate_files → qa_syntax → report`. `qa_syntax` прогоняет `tsc --noEmit / python -m py_compile` по артефакту.

## Provenance
Семейство `код` для `Ywon Factory` — боты/апки/скрипты для пользователя, фриланса и внутренних задач. Код оригинальный.
