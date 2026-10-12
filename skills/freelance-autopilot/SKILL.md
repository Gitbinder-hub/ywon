# freelance-autopilot — поиск проектов и черновики ставок, человек подтверждает

Fidelity `supported_control` — ищем, оцениваем, готовим черновики. Отправляем только после `human approval`.

Budget `limitMinor 3000 worstCase 3000` `curiosity_reserve 5%`.

## Flow
`search_projects → estimate_cost → draft_bids → gate_10percent → await_human_approval → report`.
- `gate_10percent` — строгий `forecast*10 > baseline*11` (`cost-visibility` уже в `packages/model-switch`, `freelancer-worker/cron.ts` и `exchange-sandbox/kwork-live.ts` проводка есть) — при превышении `pause_and_notify`, не шлём ставку.
- `auto_bid_without_approval` и `assumed_revenue` запрещены — никаких обещанных продаж.

## Platforms
- `kwork` `isolatedCookies + socks5 при 403`, `freelancer` `FL API`, `fl` — по очереди, `platform_unreachable` → `unsupported` с отчётом.

## Provenance
Поверх существующих `freelancer-worker` + `exchange-sandbox` — проводка `live_wired` уже `PASS`.
