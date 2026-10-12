# 19. P0/P3 — как доказать результат, не красивую демонстрацию

## P0 дизайн (Q-003)
До генераций владелец принимает:
- поддерживаемый язык(и), voice/presentation, narrated explainer 30–60 с;
- исходные задания/knowledge refs и права;
- потолок live-eval и всех попыток, max retries и stop conditions;
- quality rubric, critical failures, acceptable cost/human-time envelope;
- сценарии проверки и решение go/rework/pivot.
Все пороги здесь намеренно не утверждены автоматически. Рекомендуемый небольшой pilot:
3 разные темы/задания × 3 независимых запуска = 9 результатов, если бюджет позволяет.
Это инженерный screening, не статистическое доказательство рыночного успеха.

## Что генерировать
Несколько простых сцен T0/T1 + ограниченный T3; real images/TTS/video и финальный FFmpeg MP4.
Сначала один рабочий API path. Дополнительные модели только если дают проверяемый смысл.
Учитывать все failed attempts, prompts, версии, billed units, runtime, human intervention.
Нельзя выбирать 3 лучших результата из 20 и скрывать стоимость остальных.

## Rubric
Technical: decodeable file, target duration/aspect, sound, no unintended black/silent sections, subtitle sync.
Meaning: script matches brief, sources/claims correct, no hallucinated critical advice.
Perception: speech intelligible, text readable, no severe artifacts, visual variety appropriate.
Rights: licenses/consents/disclosure. Critical failure → reject regardless total score.
Human reviewer: usable as-is / minor changes / major changes / reject + minutes and reason.
VLM feedback отдельно; не заменяет reviewer.

## Отчёт
Для каждого run: accepted? rubric, attempts/cost/time, used outputs hashes, rejects, limitations.
Aggregates: pass/acceptance with small-sample caution, cost distribution, human minutes, recurring defects.
Spec-derived threshold не считать выполненным без реальных данных.
Go означает «этот bounded format стоит строить», не «все Studio функции готовы».
Rework фиксирует задачи и повторный approved spend; pivot сохраняет причины/feature map.

## P3
Повторные разные реальные задания и 5 внешних пользователей с обычными аккаунтами.
Объём и цели выбираются до теста из доступного бюджета; не обещаем статистическую значимость по 20 эпизодам.
Publish/engagement отдельное наблюдение: API acceptance не доказывает audience value.
Проверить качество, cost envelope, review time, user friction и failure recovery.
Для expansion — отдельный benchmark; недоступные platform metrics оставлять unavailable.
