# Research baseline — reference, not implementation proof

Проверено в ходе разбора 01.10.2026:
- https://github.com/higgsfield-ai/skills — MIT repo; Markdown skills вызывают Higgsfield CLI/backend.
  README описывает server prompt enhancement, Soul reference_id, Marketing Studio и Virality Predictor.
  Лицензия открытой инструкции не означает доступ к server-side model/hidden prompts.
- https://higgsfield.ai/blog/cinema-studio-guide — описывает Cinema Studio 2.0, limits до 6 shots/12 seconds,
  3D scene/optics/motion и уже упоминает Studio 3.5. Не переносить ограничения 2.0 на весь текущий продукт.
- https://developers.google.com/youtube/v3/docs/videos/insert — unverified API project uploads могут быть private;
  current audit/quota details подтвердить перед интеграцией.

Эти источники проверены как исходные ориентиры, не как полный benchmark и не как принятие цен/API terms.
Полный оригинальный research v0.2 сохранён в docs/archive/v0.2/docs/research/.
Таблица цен из сторонней статьи НЕ переносится в pricing.yaml как подтверждённый прайс.

## Следующее исследование
Official provider/API/model ID; region/account access; caps; durations/min billed units;
input control/ref/seed/audio; commercial/voice/model licenses; cancellation billing; output TTL;
webhook security/idempotency; verified price URL/date. Сделать Q-002 с отчетом и owner choice.
В последующих Studio tasks: функция → open recipe → closed backend → candidate substitute →
fidelity/limitations → rights → measured cost/quality. «Лучше» только после benchmark.
Не устанавливать/исполнять чужие навыки в рамках чтения источников без разрешения.
