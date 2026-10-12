# bot-factory — Telegram / Discord / web-виджет боты

Fidelity `supported_control` — готовый scaffold, не болтовня. Токены никогда не попадают в артефакт.

Budget `limitMinor 5000 worstCase 5000` `curiosity_reserve 6%`.

## Inputs
- `platform` `telegram|discord|web_widget`, `goal`, `commands[]`, `language`.

## Outputs
- `artifact_id + manifest_hash + qa {commands_ok, preview_url}`. Без токена → `degraded: stub_without_token` — пользователь вставляет свой токен локально, апка не хранит.

## Limits
- `token_in_artifact` и `auto_publish_without_approval` запрещены. Публикация бота только после `human approval` и отдельного разрешения `delegated publishing`.

## Provenance
Поверх `packages/telegram-relay` уже в репо. Код оригинальный.
