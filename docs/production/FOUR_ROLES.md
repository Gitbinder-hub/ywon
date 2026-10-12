# Четыре управляющие ответственности

Брендовая рамка «четыре короля» возможна; названия/визуальные персонажи пока proposed.
Это роли в одном orchestrator, не требование четырёх постоянно вызываемых LLM.

| Роль | Ответственность | Граница |
|---|---|---|
| Стратег | цель/аудитория/brief/план/обоснование | предлагает; не подтверждает пользовательские факты сам |
| Продюсер | DAG исполнения, sources/generation/edit/export | только allowlisted actions в approved envelope |
| Редактор качества | facts/style/visual/technical evidence/review | не sole oracle; critical uncertainty → human |
| Хранитель | expense/permissions/rights/privacy/policy | модель объясняет, code enforces denies/reserve/approval |

User-facing assistant единый, disagreements раскрываются коротким actionable proposal.
Rules/QA checks выполняются детерминированным кодом где возможно; role-to-model configurable per task.
Roles Writer/DOP/Sound/Editor могут быть sub-configs; не отдельный paid call на каждом переходе.
High-cost model chosen by measured useful output, not forced to deliberate four times.

## Исполнение и разрешения
Typed command→auth/tenant/policy/capability→estimate/reserve→durable outbox→worker→QA→human gate.
Ни один агент не может поднять лимит, изменить policy, выдать доступ или деплоить production.
Independent security/budget review не подменяется мнением «Хранителя».
Конфликт плана/прав/сметы → needs_user; system hard denial выше agent suggestion.
Existing L0…L4 autonomy сохраняется; money/publish limits action-specific, no universal autopilot toggle.

## AC
Q-042: permissions matrix, single-command execution and evidence tests; injection/role escalation denied,
нет duplicate submit от согласующих ролей; costs measured including critique calls.
В UI видны только существенные decisions and checks, no pretend «четверо гарантировали качество».
