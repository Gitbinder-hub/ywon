# Q-005 — Baseline freeze для 9 реальных запусков — 2026-10-06

Freeze перед платными Q-005 прогонами. Основано на Q-001 pay-as-you-go unlimited (per-run $0.25-1.00 media / $2-5 Architect, R20% explicit, WebView2 yes — reports/P0_APPROVAL.md), Q-002 verified route Google gemini-3.5-flash-lite / 3.1-flash-lite-image / 3.8-flash-lite-tts Kore (reports/Q002_PROVIDER_RESEARCH_2026-10-06.md), Q-003 reference set T1/T2/T3 3x3=9 (reports/Q003_EVAL_PLAN_2026-10-06.md), Q-004 dry reuse google-p0-002 (reports/Q004_SPIKE_2026-10-06.md, outputs/google-p0-002/).

## Замороженный baseline (generation unit по GENERATION_RESERVE.md)

- RunId scheme: T1 `google-p0-002` + `p0-t1-sky-002` + `p0-t1-sky-003`; T2 `p0-t2-photosyn-001..003`; T3 `p0-t3-recycle-001..003` = 9 независимых runs, каждый `bootstrap/fixtures/P0-T*.json` (schemaVersion 1, durationSec 30, 16:9, 3 scenes, Kore, max 250000).
- Per-run B = `110300 micros` ($0.1103) = 1 text +3 image +1 tts (estimate `5_000+3*33_600+ceil(30/10)*1_500` в google-live.ts). `withinCap true` vs `approvedCap 250000` ($0.25 hard cap).
- R = 20% of B = `22060 micros` ($0.02206) — proposed repair preset, тратится только после explicit да per Q-001, не авто.
- C per-run = B+R = `132360 micros` ($0.13236) — если обе попытки нужны. Cumulative B+R per attempt, не двойной учёт.
- Baseline 9 runs (без rework): `B_total = 9*110300 = 992700 micros` ($0.9927). `R_total = 198540` ($0.1985). `C_total = 1191240` ($1.19124).
- Accepted-result cost при rejects: до 12 попыток (9 + 3 rework) внутри Q-001 per-run bounds => $1.3-1.6 best, $2-3 with waste/taxes. Director/Architect extra $2-5 per call (1-2 calls) → общий pilot $3-8 worst, но per-run media остаётся в $0.25-1.00 cap.
- Hard cap per paid submission: `250000 micros` ($0.25). Strict duration `30±2s` + fullNarrationRequired true; too-short/long = technical fail (reject), не молчаливый accept.
- Taxes/FX/rounding/invoice delay — unknown, не 0; invoiceStatus pending до reconcile.
- Stop: после 2 неудачных попыток пауза перед 3-й; unknown job → `unknown_check_manifest` + manual reconcile, no blind resubmit. `+10%` vs baseline требует re-approval per COST_VISIBILITY.md; текущий freeze — baseline для сравнения.

## Фикстуры (frozen до теста)

- `bootstrap/fixtures/B036-google-live.json` = T1 google-p0-002 (baseline, reused)
- `bootstrap/fixtures/P0-T1-sky.json` → p0-t1-sky-002 (T1 repeat)
- `bootstrap/fixtures/P0-T2-photosynthesis.json` → p0-t2-photosyn-001 (T2)
- `bootstrap/fixtures/P0-T3-recycling.json` → p0-t3-recycle-001 (T3)
- Дополнительные runs: p0-t1-sky-003, p0-t2-photosyn-002/003, p0-t3-recycle-002/003 — генерируются из тех же T1/T2/T3 topics с инкрементом runId (фиксация перед запуском).
- Все фикстуры — ru, 30s, 16:9, 3 scenes, Kore. Изменения темы после freeze = новый baseline version, старый виден в финале.

## Команда/окружение/лимиты

- Plan (без spend): `node scripts/architect_google_spike.ts plan --input bootstrap/fixtures/P0-Tx.json` → 110300 withinCap true.
- Live (платно, явный флаг): `node --env-file=.env scripts/architect_google_spike.ts run --live --input bootstrap/fixtures/P0-Tx.json --output-root outputs/<runId>` — ключ `GEMINI_API_KEY` (53 chars) fallback `GOOGLE_API_KEY` приоритет, header `x-goog-api-key`, FFmpeg `C:\Users\Marina\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe|ffprobe.exe` (9.0.2).
- Env keys — env-only, never git. `GOOGLE_API_KEY` сейчас пусто, используется `GEMINI_API_KEY`. Лимит на каждый submit проверяется `planGoogleLiveSpike` vs `maxEstimatedUsdMicros`.
- Для Q-005: каждый run пишет `outputs/<runId>/manifest.json|script.json|narration.wav|scene-*.png|scenes.txt|result.mp4` + per-run `reports/eval/P0-00X.json` (см. Q003 §3) + aggregate `reports/P0_EVAL_AGGREGATE_*.md`.

## Evidence

- Этот файл + Q-003 §3 + Q-002 pricing + Q-004 report. `python scripts/project.py validate PASS`.
- Дата freeze: 2026-10-06T09:30+00:00, agent cline/act, owner approval для spend — Q-001 unlimited уже покрывает pilot в caps, но каждый новый платный batch требует отдельного «да» если превысит +10% или исчерпает reserve — см. handoff Q-005.
