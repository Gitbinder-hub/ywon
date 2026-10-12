# P0 — Вывод rework + scope — 2026-10-06 (часть B aggregate)

## Вывод: rework (не go / не pivot)

- **Не go** т.к. acceptance 11% strict — провал контракта Q-003 30±2, cost/accepted $0.99 high. **Не pivot** т.к. маршрут живой 9/9 completed без retries/unknown, все MP4 реальные provider payload (hashes, 1280×720 h264/aac, ru Kore), дефект локализован.
- **Что чинить:** 
  1) Prompt enforce ≥60±10 слов + post-check wordCount, при <55 ретрай text внутри R (explicit да per Q-001).
  2) Или pad тишиной/фризом кадра (`apad`/`tpad`) вместо чистого `-shortest`, или объявить adaptive duration до генерации. Сейчас contract strict.
  3) Smoke 3×1 per T1/T2/T3 (3 runs) → если 3/3 pass, затем полный 9-run. Смета rework: 3×110300=330900 ($0.33)+R 66180 ($0.066)= $0.397 total, cap 250000/run прежний.
- Stop-before-3rd / >10% gate соблюдены: ни один run >1 попытки, forecast == baseline 0%, reserve не списан вслепую.

## Limitations & Next

- Estimate != invoice; налоги/FX unknown.
- Russia not in `ai.google.dev/available-regions` excerpt — риск блока аккаунта.
- VLM advisory не заменяет human reviewer; rubric screening требует Oleg sign-off per P0-00X.json.
- Next gate Q-005G: рекомендуется rework с фиксом narration/duration + 3-run smoke, затем повторный Q-005 full eval (R20% inside generation unit C=B+R).

## Evidence / версии

- Per-run `reports/eval/P0-001..009.json` + `outputs/<runId>/manifest.json|script.json|narration.wav|scene-*.png|scenes.txt|result.mp4` (sha256/bytes/duration ffprobe).
- Aggregate A `reports/P0_EVAL_AGGREGATE_2026-10-06.md` + `reports/Q005_BASELINE_FREEZE_2026-10-06.md` + `reports/Q003_EVAL_PLAN_2026-10-06.md` + `handoffs/Q-002..Q-004.json`.
- Tooling Node 24.19.0, FFmpeg 9.0.2, `packages/architect/src/google-live.ts`, `GEMINI_API_KEY` 53 env-only (x-goog-api-key), pricing checked 2026-10-06.
- `python scripts/project.py validate PASS`.

— Часть B aggregate для Q-005 (вместе с P0_EVAL_AGGREGATE_2026-10-06.md).
