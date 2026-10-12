# 15. Ywoom Studio Skills — собственная студия вместо Higgsfield

## Цель
Все студийные возможности (камера, кино-студия, эффекты, персонажи, липсинк, монтаж, апскейл, one-click приложения) — **внутри Ywoom**, без зависимости от Higgsfield или похожих платформ. Higgsfield используется только как ориентир для исследования и как конкурент в Benchmark Suite.

Принцип: **навык (Skill) = воспроизводимый рецепт режиссёра**. Director LLM выбирает навыки, навыки вызывают Model Router (прямые API видео/изображений/аудио), Blender-воркер и FFmpeg. Каждый навык версионируется, проходит evals и дообучается на Golden Library.

## Что взяли из экспресс-исследования (паттерны, не код)
Подробности и источники: `docs/research/HIGGSFIELD_EXPRESS_RESEARCH.md`.
1. Навык = Markdown-инструкция + CLI/API-инструменты, их загружает любой агент.
2. Навыки собираются в цепочку: обучить identity → использовать reference_id в генерации.
3. Режимы внутри навыка (UGC, unboxing, TV spot, product showcase…) с подстройкой промпта под режим.
4. Правила надёжности: задачу, которая упала по таймауту, подхватывают заново и не дублируют; две одинаковые ошибки подряд → поменять промпт или параметры.
5. Навык заканчивается отчётом о результате: URL, длительность, формат, язык, стиль, голос, субтитры, источники.
6. У навыков есть папка evals.
7. Кино-студия: виртуальный риг (сенсор, объектив, фокусное, диафрагма), выбор движений камеры, стартовый и конечный кадр, мульти-шот, speed ramp, жанровая логика движения, эмоции персонажей.
8. Virality Predictor — оценка хука и внимания в готовом видео.

## Где мы сильнее (целевые отличия)
| Ограничение у референса | Как у нас |
|---|---|
| Мульти-шот до 6 шотов и 12 с в сумме (Cinema Studio 2.0) | Сцены любой длины: цепочка шотов с непрерывностью (последний кадр → стартовый кадр, общие референсы персонажа, style lock). Поддержка Long 9+ мин |
| Движение камеры задаётся только промптом модели | Три реализации каждого пресета: Blender-траектория (детерминированно) → prompt-шаблон под конкретную модель → 2.5D/FFmpeg-фолбэк (T0/T1) |
| Навыки не знают канон канала | Навык получает Bible, Genome, язык канала, инсайты и эталоны серии |
| Одна платформа и её цены | Router выбирает модель по цене за секунду, качеству и доле отказов; смета до запуска |
| Результат не учится на метриках канала | Каждый запуск навыка → метрики → Golden Library → предложение новой версии навыка |
| Язык и дубляж — отдельная задача | Навыки language-aware (docs/16) |

## Формат навыка
```
skills/<skill-id>/
  SKILL.md        # для LLM: назначение, когда применять, шаги, правила, анти-паттерны
  skill.yaml      # машинный манифест (ниже)
  prompts/        # шаблоны промптов под модели: <capability>/<model-family>.md
  blender/        # (опц.) скрипты сцены/камеры
  evals/          # golden-кейсы + чек-лист QA + пороги
  CHANGELOG.md
```
```yaml
id: cinema.multishot
version: 1.3.0
status: active            # draft | canary | active | deprecated
intent: "Снять сцену из N шотов с непрерывностью и заданной режиссурой"
triggers: ["сцена", "мульти-шот", "кинематографично"]
inputs:  { schema: contracts/skills/cinema.multishot.input.json }
outputs: { schema: contracts/skills/cinema.multishot.output.json }
requires: [video.i2v, image.gen, vlm.judge]   # capabilities роутера
optional: [blender.camera, video.upscale]
routing_hints: { prefer: [start_end_frame, audio_optional], max_usd_per_second: 0.15 }
budget: { estimate: true, hard_cap_usd: from_scene }
steps: [plan_shots, lock_style, keyframes, camera_paths, generate, continuity_check, assemble]
qa: [identity_similarity>=0.8, no_artifacts, camera_match, duration_ok, language_ok]
retry:
  rejoin_timeouts: true          # не дублировать работающую задачу
  same_error_twice: change_params
  max_attempts_per_shot: 2
  safety_block: safety_rephrase_then_alternative
delivery_report: [asset_ids, duration, aspect, resolution, language, models, cost_usd, seconds_generated, seconds_kept, qa_scores, open_issues]
evals: evals/
```
Навык — это граф шагов с LLM-узлами, а не свободный промпт: исполняется orchestrator'ом, пишет каждый шаг в Command Journal и `skill_runs`.

## Каталог v1
### A. Cinema Studio
- **Виртуальный риг**: сенсор/формат, объектив (характер: чистый, винтажный, анаморф), фокусное 8–200 мм, диафрагма/ГРИП, выдержка/моушн-блюр, fps, высота и угол камеры. Хранится как `rig` в пресете и в Bible серии (фирменный «вид» канала).
- **Библиотека движений камеры (цель v1 — 60+ пресетов)**: dolly in/out, truck L/R, pedestal, pan, tilt, crane up/down, orbit/arc, crash zoom, dolly zoom (vertigo), whip pan, FPV-пролёт, bullet time, handheld, snorricam, rack focus, emotional push-in, reveal, top-down, overhead spin, low-angle hero, parallax slide, follow/leading, locked-off. У каждого — кривая скорости, длительность, 3 реализации (Blender / prompt / 2.5D).
- **Жанровая логика движения**: action, horror, comedy, drama, documentary, suspense, intimate, spectacle, vlog, explainer, auto → длина шота, энергия камеры, ритм монтажа, SFX-акценты. Параметры жанра — данные, которые можно дообучать.
- **Мульти-шот секвенсор**: авто (Director раскладывает сцену) и ручной (владелец задаёт шот, длительность, движение, speed ramp). Без лимита на число шотов.
- **Start/End frame**: переход между заданными кадрами. Если модель не умеет, используется Blender-превиз + control.
- **Speed ramp**: slow-mo / linear / speed-up. Подсказка в генерации + пост-обработка (интерполяция кадров, FFmpeg).
- **Эмоции персонажа**: эмоция и интенсивность на каждый шот; QA проверяет VLM-критиком.
- **Превиз в Blender**: блокинг сцены, камера, свет → depth/pose/control-видео или финальный рендер (tier T2).

### B. Эффекты и вирусные пресеты
Библиотека `presets(kind=vfx)`: трансформации (металл, вода, огонь, свет изнутри), левитация, портал, 3D-поворот, «взрыв» стилизованный, распад на фрагменты, наклейка, рисованный переход и т.д. Реализация: prompt-шаблон + композитинг (Blender/FFmpeg-оверлеи). **Trend Harvester** раз в неделю предлагает новые пресеты по трендам площадок; проверка на оригинальность и правила площадок.

### C. Персонажи
- **Character Pack / Identity**: референс-сет лица, тела и гардероба; при доступности — дообучение (LoRA) на арендованном GPU; face-embedding для QA сходства.
- **Recast**: замена персонажа при сохранении света и кадра.
- **Wardrobe / Location packs**: консистентность костюмов и локаций между эпизодами.
- **Voice identity**: голос персонажа (синтез или клон только с согласием).

### D. Storyboard Lock
Фиксация стиля раскадровки: палитра, свет, объектив, композиционная сетка, референсы, seed. Все кадры сцены/серии проходят style-similarity QA.

### E. Монтажная студия
Timeline JSON (docs/03) + UI таймлайна: склейки, J/L-cut, переходы, зумы, караоке-субтитры, LUT серии, биты музыки, SFX-акценты, авто-рефрейм 9:16 с трекингом лица, вырезание пауз, B-roll.

### F. Редактирование изображений и видео
Inpaint/outpaint, edit-by-intent («убери человека слева»), relight, замена фона, restyle, апскейл изображения и видео, удаление артефактов.

### G. Звук и липсинк
TTS (мультиязычный), клон голоса (с согласием), **Lipsync Studio** с несколькими провайдерами через роутер и QA синхронности, музыка (лицензионно-чистая), SFX, дубляж (docs/16).

### H. Приложения (one-click пакеты навыков)
explainer, UGC-реклама (ugc, how-to, unboxing, review, TV spot, try-on), product showcase, talking head из голоса эксперта (Expert Amplifier), миниатюра YouTube, карусель, нарезка подкаста/стрима, трейлер серии, faceless-документалка, серийный эпизод персонажа.

### I. Аналитика креатива
**Hook & Retention Predictor** — сначала LLM/VLM-эвристики, потом модель, обученная на наших метриках удержания. Thumbnail CTR predictor. Оба — советники: не публикуют сами.

## Skill Lab — самоулучшение навыков
1. Версии semver, статусы draft → canary (10% запусков) → active.
2. **Evals**: у каждого навыка golden-набор (≥ 10 кейсов) и чек-лист; прогон на моках в CI и платный прогон по кнопке/лимиту бюджета.
3. **Источник улучшений**: правки человека, QA-отказы, метрики зрителей, Golden Library → Director предлагает diff навыка (промпт, параметры, шаги) → evals → canary → active. Откат одной командой.
4. **Model Scout**: новая модель → прогон навыков, которые её используют → обновление routing_hints.
5. Маркетплейс навыков — после M6 (пользовательские навыки, шеринг).

## Интерфейс
Каждый навык доступен двумя путями: из Director Chat («сделай crash zoom на хук») и из экранов Studio: Cinema, Effects, Characters, Edit, Lipsync, Apps. Новичок видит только результат и кнопки; профи видит риг, пресеты и параметры.

## Правовые и этические рамки
- Не копировать проприетарные промпты и контент сторонних платформ. Репозиторий `higgsfield-ai/skills` под MIT: изучаем структуру и паттерны; дословные заимствования — только с атрибуцией по лицензии.
- Чужая внешность и голос — только с документированным согласием (docs/13).
- Эффекты не должны вводить зрителя в заблуждение о реальных событиях; метка AI — по правилам площадки.

## Приоритет внедрения
- M2: Skill Runtime (манифест, исполнитель, delivery report, retry-правила) + 10 пресетов камеры в 2.5D/FFmpeg + жанровая логика как данные.
- M3: риг + prompt-реализации пресетов для 2–3 видео-моделей, Character Pack, Storyboard Lock, мульти-шот секвенсор, start/end frame.
- M4: Blender-реализации пресетов, Lipsync Studio, апскейл, 10 VFX-пресетов, Apps: explainer, UGC, thumbnail.
- M5: Skill Lab (авто-предложения версий), Trend Harvester, Hook Predictor v1.
