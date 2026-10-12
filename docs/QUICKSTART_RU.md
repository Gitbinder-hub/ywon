# Быстрый запуск владельца — v0.4

1. Backup/branch; распаковать Ywoom-spec-v0.4, не затирать написанный код без inventory/diff.
2. Открыть README.md, docs/INDEX.md, docs/CHANGE_IMPACT_v0.4.md, handoffs/RELEASE_v0.4.md.
3. `make spec-check`; затем `python3 scripts/project.py next`.
4. Q-001 всё ещё TODO. Открыть docs/governance/14_OPEN_DECISIONS.md и reports/P0_APPROVAL_TEMPLATE.md.
   Утвердить actual scope/budget/languages/rights/stop, заполнить report без секретов. Zero spend допустим явно.
5. Только после собственного решения выполнять gate с owner-confirmed. Пакет не запускает API/публикации.
6. Агент → ready task → evidence/handoff → REVIEW; владелец проверяет и принимает/возвращает.
7. Передача через registry/generated views/handoff/commit; не полагаться на память старого чата.

Языки и mobile libraries пока proposed; их выбор и реальные проверки прописаны в задачах.
Editor/studio описания не означают, что приложение уже реализовано. All-client release Q-049G отдельный.
