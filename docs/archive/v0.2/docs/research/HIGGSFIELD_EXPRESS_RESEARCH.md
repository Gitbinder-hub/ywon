# Экспресс-исследование: Higgsfield (30.09.2026)

Цель: понять функции и паттерны навыков, чтобы спроектировать собственные, лучшие (docs/15). Факты ниже взяты с публичных страниц; перед реализацией задача T-018 перепроверяет их и углубляет.

## Продукт
- Генерация изображений, видео и голоса из текста или референсов; редактирование и апскейл; агент-LLM; web и mobile. — http://higgsfield.ai/
- Camera Controls: 50+ кинематографичных пресетов движения (crash zoom и др.). — https://higgsfield.ai/camera-controls
- Viral presets / VFX (Levitation, Portal, 3D Rotation, Turning Metal, Water Element и др.) и Apps (one-click контент). — https://higgsfield.ai/viral-presets , https://higgsfield.com/
- Cinema Studio 2.0: риг (сенсор, объектив, фокусное 8–50 мм, диафрагма), выбор движений камеры, start/end frame, мульти-шот (до 6 шотов, 1–12 с на шот, до 12 с всего, 1080p), speed ramp (slow-mo/linear/speed-up), жанры (Action, Horror, Comedy, Western, Suspense, Intimate, Spectacle, Auto), эмоции персонажей, сохранённые пресеты камеры. — https://higgsfield.ai/blog/cinema-studio-guide
- Lipsync Studio: несколько моделей липсинка в одном месте. — https://higgsfield.ai/lipsync-studio
- API: асинхронный цикл (submit, status, cancel, webhooks), много моделей через одну интеграцию. — https://docs.higgsfield.ai/
- MCP/CLI для агентов (`@higgsfield/cli`, `npx skills add higgsfield-ai/skills`). — https://higgsfield.ai/mcp , https://higgsfield.ai/cli

## Репозиторий навыков `higgsfield-ai/skills` (MIT)
Источник: https://github.com/higgsfield-ai/skills
| Навык | Суть |
|---|---|
| higgsfield-generate | изображения, видео, 3D, аудио на 30+ моделях; Marketing Studio (9 режимов рекламы: ugc, how-to, unboxing, showcase, review, TV spot, wild card, try-on); Virality Predictor |
| higgsfield-soul-id | обучение identity по 5–20 фото → reference_id |
| higgsfield-product-photoshoot | 10 режимов продуктовых фото (студия, lifestyle, Pinterest, hero, карусель, ad pack, try-on, restyle…) |
| higgsfield-brandkit | фирменный стиль: палитра, SVG-логотип, типографика, брендбук |
| higgsfield-marketplace-cards | карточки маркетплейсов |
| higgsfield-websites | сайты и игры с деплоем |
| higgsfield-video-explainer | озвученный explainer блоками аудио+видео, сборка в MP4 |
| higgsfield-youtube-thumbnail | миниатюры и обложки, варианты, правки |
В репозитории есть `evals/`, `COOKBOOK.md`, плагины для Claude Code, Codex, Cursor.

Правила из `higgsfield-video-explainer/SKILL.md`: подхватывать задачу после таймаута и не дублировать; две одинаковые ошибки → менять промпт/параметры; итоговый отчёт (URL, длительность, формат, язык, стиль, голос, субтитры, источники). — https://github.com/higgsfield-ai/skills/blob/main/higgsfield-video-explainer/SKILL.md

## Выводы для Ywoom
1. Их сила — удобные пресеты и one-click режимы. Мы повторяем это как данные (`presets`) + навыки.
2. Их навыки не знают канона канала, аналитики и бюджета — это наш главный рычаг.
3. Мульти-шот ограничен 12 с — у нас сцены и эпизоды любой длины через непрерывность.
4. Прямые API видео-моделей с посекундной оплатой убирают наценку посредника (docs/10).

## Цены видео-моделей (ориентир, проверить перед M3)
Официальные API-цены за секунду при 720p, по сравнению от 23.09.2026 — https://www.teamday.ai/blog/best-ai-video-models-2026
| Модель | $/с 720p | Примечание |
|---|---|---|
| Veo 3.1 Lite / Fast / Standard | 0.05 / 0.10 / 0.40 | со звуком |
| MiniMax H3 | 0.08 (768p) | со звуком, открытые веса |
| Wan 3.0 | ~0.083 | до 30 с, звук |
| Kling 3.0 | 0.084 без звука / 0.126 со звуком | start/end frame |
| Gemini Omni Flash | ~0.10 | лидер по качеству в слепых голосованиях (по статье) |
| LTX-2.5 Fast / Pro | 0.09 / 0.12 | открытые веса |
| Seedance 2.0 / 2.5 | ~0.15 / ~0.23 | image-to-video, референсы |
| Sora 2 | — | по статье, удаляется из API 24.09.2026 |
Агрегаторы (fal, Runware) тоже продают посекундно — допустимы как запасной адаптер, но основной путь — прямые API.
