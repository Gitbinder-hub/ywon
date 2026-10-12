# 06. Model Router — универсальная надстройка над моделями

## Цель
Любая модель (LLM, изображение, видео, голос, музыка, ASR, VLM, 3D) — сменный картридж. Система выбирает лучшую по задаче/цене/качеству и сама переключается.

## Интерфейс адаптера
```ts
interface ProviderAdapter {
  id: string;                         // "vendor/model@version"
  capabilities: Capability[];         // text.chat, image.gen, image.edit, video.i2v, video.t2v, tts, music, sfx, asr, vlm.judge ...
  limits: { maxDurationS?: number; resolutions?: string[]; aspect?: string[] };
  price(req): UsdEstimate;            // смета до вызова
  submit(req): Promise<JobRef>;
  poll(job): Promise<JobStatus>;
  normalizeError(e): RouterError;     // SAFETY_BLOCK | RATE_LIMIT | TIMEOUT | BAD_INPUT | PROVIDER_DOWN
}
```
- Режим `PROVIDER_MODE=mock` — детерминированные фикстуры для тестов и CI.
- Каждый адаптер имеет contract-тест на записанных ответах.

## Политика выбора
`score = quality_estimate(capability, style) − λ·cost − μ·latency − ν·failure_rate`
- `quality_estimate` — из собственных данных: QA-оценки + acceptance rate + метрики зрителей по моделям (docs/08). На старте — ручные приоры.
- Fallback-цепочки: при PROVIDER_DOWN/RATE_LIMIT → следующая модель той же capability.
- Бюджет-guard: запрос дороже лимита шота → понижение tier или запрос человеку.

## Model Scout (поиск новых инструментов)
Еженедельная задача JEWEL: собрать анонсы новых моделей/API/open-weight релизов → карточка кандидата → автогенерация адаптера по шаблону → прогон **Benchmark Suite** (фиксированный набор 20 шотов/10 текстов серии) → сравнение с текущими → предложение владельцу (или авто-включение в пределах L2 для capability с низким риском).

## Независимость
- Уровень 1 (сейчас): коммерческие API за адаптерами.
- Уровень 2: open-weight модели (видео, изображение, TTS, ASR) на арендуемом GPU за тем же интерфейсом — страховка от блокировок и роста цен.
- Уровень 3: дообучение (LoRA и т.п.) на собственных эталонах, когда накопится датасет. Архитектура не меняется.

## Director (режиссёр) — v0.2
- Capability `text.director`: топовая LLM через API (целевая — класса Opus, напр. Opus 5.5; ID в `config/models.yaml`). Fallback — сильная модель другого вендора.
- Выход Director — только типизированные команды (structured output): `plan_episode`, `run_skill`, `revise_shot`, `ask_user`, `report`. Никаких прямых вызовов провайдеров — всё через навыки и роутер.
- Контекст собирается для prompt caching: [роль + каталог навыков] → [Bible + Genome канала] → [задача]. Первые два блока меняются редко.
- Дешёвая модель `text.worker` — для рутины; Director эскалирует только сложное.

## Прямые API и посекундные цены — v0.2
- Основные адаптеры — напрямую к вендорам видео-моделей. Агрегатор — отдельный запасной адаптер. Higgsfield как зависимость не используется.
- `price(req)` считает по `config/pricing.yaml`: `usd_per_second[resolution][audio]`, доплаты за входные изображения/референс-видео, минимальная длительность, токенные формулы (для моделей, где цена в токенах).
- `limits` расширены: `startEndFrame`, `maxRefs`, `audio`, `cameraControl: none|prompt|native`, `maxClipS`.
- Скоринг использует **цену за принятую секунду** = цена/с × средний waste_ratio модели на данном навыке.
- После каждого вызова — запись в `cost_ledger`.
