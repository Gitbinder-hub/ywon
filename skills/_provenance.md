# Provenance — skills scaffold

- Source system studied: OpenMontage (github.com/calesthio/OpenMontage) — AGPL-3.0.
- What was borrowed: **mechanisms** only — stage-director decomposition, 200-term prompting dictionary shape,
  B-roll stock-vs-generation planning, tool auto-discovery taxonomy, style playbooks, Backlot living storyboard concept.
- What was NOT copied: no Python `tools/*.py`, no verbatim `skills/**/*.md` text, no YAML manifests copied.
  All `skills/*/skill.yaml`, `SKILL.md`, `prompts/*.md`, `recipes/*.yaml` are original Ywon-authored and conform to
  `docs/production/15_STUDIO_SKILLS.md` typed graph (skill.yaml + SKILL.md + model templates + eval/CHANGELOG later).
- License note per `15_STUDIO_SKILLS.md:68`: borrowing mechanism does not require copying code; distributing derivative
  components would require a separate license review. No derivative AGPL distribution is created by this scaffold.
- If a future skill needs verbatim OpenMontage text/code, a per-file license check and AGPL obligations review is required first.
