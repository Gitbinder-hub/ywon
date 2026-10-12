# P0 pilot — aggregate 9 runs — 2026-10-06

Baseline frozen `reports/Q005_BASELINE_FREEZE_2026-10-06.md`: B 110300/run, R 20% 22060, C 132360, cap 250000, strict 30±2 fullNarration. Reference T1x3+T2x3+T3x3 (Q-003 DONE). Models `gemini-3.5-flash-lite / 3.1-flash-lite-image x3 / 3.8-flash-lite-tts Kore` verified 2026-10-06. FFmpeg 9.0.2 WinGet Links, Node 24.19.0.

Run команды (ключ env-only `GEMINI_API_KEY` 53, x-goog-api-key):
```
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T1-sky.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T1-sky-003.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T2-photosynthesis.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T2-photosynthesis-002.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T2-photosynthesis-003.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T3-recycling.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T3-recycling-002.json --live
node --env-file=.env scripts/p005_probe.mjs bootstrap/fixtures/P0-T3-recycling-003.json --live
# + reuse outputs/google-p0-002 как P0-001
```
Plan dry: `node scripts/p005_probe.mjs bootstrap/fixtures/P0-T*.json` → withinCap true.

## 9 runs

| # | runId | topic | duration | strict 30±2 | rubric | critical | accepted | attempts | cost est | cap | sha8 | bytes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|google-p0-002|T1 небо|24.04s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|eefc0af9|830811|
|2|p0-t1-sky-002|T1 небо|27.88s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|9e180b60|1025397|
|3|p0-t1-sky-003|T1 небо|26.88s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|8b393783|623890|
|4|p0-t2-photosyn-001|T2 фотосинтез|26.54s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|-|969207|
|5|p0-t2-photosyn-002|T2 фотосинтез|29.13s|**pass**|usable|none|**yes**|1/1|110300|250000|-|1036240|
|6|p0-t2-photosyn-003|T2 фотосинтез|25.96s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|8b9a7e79|1138149|
|7|p0-t3-recycle-001|T3 переработка|26.79s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|b10282cb|933641|
|8|p0-t3-recycle-002|T3 переработка|26.46s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|072c7d18|857983|
|9|p0-t3-recycle-003|T3 переработка|24.13s|fail|reject|duration_outside_30+-2|no|1/1|110300|250000|a541eccb|839266|

Per-run hashes/prompts/assets/cost/attempts/humanReview: `reports/eval/P0-001..009.json` (+ `outputs/<runId>/`).

## Aggregates

- **Acceptance strict 30±2:** 1/9 = 11.1% (usable 1, reject 8). Relaxed >=5s decodeable — 9/9 h264 1280x720 + aac, звук есть, чёрных/тихих вне shortest нет, но Q-005 gated строгий, reject корректен.
- **Rubric dimensions:** Technical 1 pass /8 fail (duration); Meaning 9 pass (brief match, no hallucinated critical advice); Perception 9 pass screening (intelligible ru, 3 distinct visuals no severe artifacts); Rights 9 pass (synthetic only, disclosure before publish). Других critical 0/8.
- **Cost:** Baseline `B 110300/run` → 9× = 992700 ($0.9927), R 198540 ($0.1985), C 1191240 ($1.19124). Actual billed estimate == baseline (single attempt, no retry) total 992700; new spend сессии `8×110300=882400` ($0.8824) + google-p0-002 уже в Q-002. Reserve не списан. Per-run withinCap true. Units 1text+3image+1tts ×9=45. waste~1.0, reuse 0, cost/accepted = 992700 ($0.99) — high из-за 8 rejects. Invoice/налоги/FX pending, unknown !=0.
- **Human minutes:** 8×6 +1×4 =52 мин screening (Cline+Oleg), p50 6, min 4 max 6.
- **Attempts:** все 1/1 completed, 0 unknown, 0 rejected — нет скрытых 20→3.
- **Recurring defect:** systematic short — 8/9 <28s (медиана 26.67, среднее 26.39, лишь 29.13s в допуске). Причина: `-shortest` режет по narration.wav, а narration 41-51 слов vs target ~60 для 30s ru (2 wps). Fix: enforce ≥60 слов в prompt + post-check, или pad тишиной/apad/tpad, или adaptive duration до генерации. WordCount defekt второстепенно minor.
- **Stability:** provider failures 0/9, unknown 0, rejected 0.

Small-sample n=9 screening не статистика; T1 tuned/T2-T3 holdout сохранён; thresholds заморожены до теста; go ≠ market success.
