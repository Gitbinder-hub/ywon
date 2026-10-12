# code-scaffold — промпт-шаблон (prompt_guidance)

Goal: {{goal}}
Language: {{language}}
Platform: {{platform}}
Constraints: {{constraints}}

Produce:
1) file tree (one artifact, typed publish)
2) each file with manifest hash
3) preview/verification render (syntax check)
4) report {cost, qa, limitations, open_issues}

Rules:
- No secrets in payload, no arbitrary shell
- If live credentials missing → stub + degraded note
- Keep generation inside GenerationUnit cap, curiosity_reserve burns on delivery
