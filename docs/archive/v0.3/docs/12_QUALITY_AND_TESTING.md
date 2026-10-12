# 12. Проверки — разные доказательства для разных обещаний

## Spec pack (уже есть)
project.py validate + tests_spec: связность задач/фич/документов, переходы/приёмка/handoff,
синхронизация views и исторического архива. НЕ проверяет приложение/медиа/площадки.

## Будущее приложение
Unit: merge/version/language/price/reserve/policies. Contract: provider schemas/errors/fixtures.
Integration: DB+queue+storage+workers, duplicate requests, crashes, concurrent reserve, upload reconcile.
Security: tenant consistency, API/worker/assets/auth access, secret leakage, injection.
E2E scripted fixtures: онбординг → pilot → review → export, deterministically mocked.
Отдельные real E2E/pipeline eval в пределах approved budget — не CI по умолчанию.

## Real media evaluation
Фиксированные задания и references; технический pass, соответствие смыслу, readability,
audio quality, factual/source accuracy, legal/consent, identity/camera fidelity where relevant.
Живой human review; blinded comparisons при проверке новой версии. Judge model только advisory.
Critical failures отдельно от общей оценки. Golden set frozen/versioned и отдельный holdout для изменений.
Все попытки и стоимость учтены, не отбирать только лучшие примеры.

## QA thresholds
Пороги именованы, калиброваны на выбранном методе и отчётно изменены.
Face cosine 0.8 не универсальный критерий. Alignment error reporting includes method/sample.
Language QA разрешает имена/бренды/quotes из allowlist; нет требования «0 непереведённых» вообще.
QA model false-positive/false-negative rate проверяется на размеченных примерах.

## Onboarding / Owner Launch
Owner ordinary account, no bypass. Детерминированные synthetic fixtures проверяют ветвления.
LLM synthetic users — optional UX exploration, не доказательство удобства и не платный CI.
Настоящие внешние пользователи проходят pilot; результат failed/needs_help фиксируется.

## Неудачные результаты
not_run/unsupported/insufficient_material/needs_human/inconclusive — допустимы и видимы.
Тесты не отключают ради статуса. 100% coverage budget code не означает корректность: обязательны invariants,
races/property scenarios и audit. Требования без теста/ручной evidence не маркируются fulfilled.
