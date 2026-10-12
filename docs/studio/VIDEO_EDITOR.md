# Видео: генерация исходников отдельно от монтажа

FFmpeg принят как P0 processing tool. Browser interactive editor выбирается отдельным ADR;
FFmpeg не готовый frontend. Common editable contract не означает один универсальный image/video engine.
Candidate frontend canvas/timeline library должна пройти license/size/mobile/performance/server parity spike.
Programmatic renderer может сочетать FFmpeg и отдельный compositor, если pinned output совместим.

## P2 практичный minimum (Q-039 + Q-014)
Timeline: clips/order, trim/split, actual audio duration, overlay tracks и subtitle cues, basic transitions.
Canvas: position/scale/rotation и overlay appearance interval; subs text/timing, voice/music volume/fades.
Source media сохранены; изменение заголовка/trim не генерирует новый video clip.
Экспорт MP4 + supported subtitle files + metadata/cost/QA; renderer/timebase pinned.
Result/workspace/chat едины; proxy preview не заменяет final checks.

## P5 advanced
Keyframes (transform/opacity), speed ramps/audio adjustments, J/L cuts, B-roll/reframe, grading/LUT,
waveform, motion templates, tracking. Tool поддержка валидируется по renderer; EDL/FCPXML fidelity
проверяется конкретной версией внешнего редактора, не все эффекты переносимы.

## Три разных действия
- Move overlay / change duration: deterministic document edit (render compute может стоить денег).
- Follow object: tracking capability, confidence/fail/review, отдельная обработка.
- Change object inside moving footage: video-edit/generative capability, time mask/model limits,
  отдельные смета/consent/eval; не обещать из-за наличия image inpaint.

Targeted regeneration закреплена за shot/time range/ref version, сохраняет unrelated accepted assets.
Новая длина шота/озвучки явно инвалидирует affected timeline/approval; пересборка только нужных узлов DAG.
Срезаний слова, титров вне safe area, clipping аудио и black frames не допускать через TechnicalQA.

## Mobile
Focus mode: выбери клип → trim handles + time fields; overlays через отдельную панель;
pinch/zoom и layer list. Нет обязательного маленького desktop timeline. Server jobs переживают background app.
Quality/performance limitation видна; нельзя незаметно экспортировать хуже выбранного profile.
