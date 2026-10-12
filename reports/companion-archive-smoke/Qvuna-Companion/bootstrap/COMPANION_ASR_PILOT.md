# Ywon — локальный русский ASR B-056

Добавление к B-055, не полноценный разговор с языковой моделью/голосовой ответ. Optional Vosk0.3.45 + vosk-model-small-ru-0.22. По умолчанию ничего не устанавливается/не скачивается/не распознаётся: старый --local-audio-pilot работает без Python. Нужны отдельные CLI opt-in и согласие UI для передачи PCM именно локальному Python-процессу, НЕ в облако. Распознанная речь — черновик, не полномочие.

## Подготовка на Windows — предложенный owner smoke, NOT Windows certification
Нужны Node24, CPython 3.10+ x64 и современный локальный Chrome/Edge с AudioWorklet. Linux Python3.13.14 + pinned dependencies реально проверены; Windows10/11 Python/browser/build/permissions/DLL отдельно НЕ проверены. Windows x64 wheel в PyPI существует, но это не доказательство совместимости твоего ноутбука. Не запускать в Codespaces/forwarded origin, не отключать OS защиты, не использовать admin.

1. Создай отдельный venv, не устанавливай зависимости в системный Python. Из корня проекта/source bundle:
```powershell
py -3 -m venv .venv-asr
.\.venv-asr\Scripts\python.exe -m pip --isolated install --require-hashes --only-binary=:all: -r workers/companion/requirements-asr-build.txt
.\.venv-asr\Scripts\python.exe -m pip --isolated install --no-cache-dir --require-hashes --no-build-isolation -r workers/companion/requirements-asr.txt
```
Версию Python и среды запиши. Включена условная Windows dependency colorama для tqdm (на Linux не устанавливается). Runtime и build tools закреплены версиями/артефактными SHA256 из PyPI metadata. srt строится из pinned source с предварительно pinned setuptools/wheel/packaging, без скрытой build isolation. Linux clean hash-locked/no-cache source build проверен. Это не полный security/license audit зависимостей и не воспроизводимость бинарников на всех OS.

2. Модель скачивается отдельно с официального сайта, НЕ приложением. Ссылка:
https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip
Размер полученного архива46236750 bytes, observed SHA256:
`961d5ff98a17f4aa6de69864d0aa71fa5bac682301d2b5d17a3f24c5c99a46d4`
На Windows проверь `Get-FileHash PATH_TO_ZIP -Algorithm SHA256` до распаковки. Не отключать проверку при несовпадении; расследовать release/source drift. Этот hash фиксирует просмотренный HTTPS download, НЕ подпись издателя/автоматическое доверие произвольному архиву. Распакуй в свою nonsensitive model folder; model files в пакете намеренно отсутствуют. Reviewed extracted model:14 files,91289240 bytes. Не использовать untrusted замену с тем же именем.

3. Создай fresh локальные manifest/config. Пути ниже заменить своими; output dir новый, вне модели:
```powershell
.\.venv-asr\Scripts\python.exe scripts/companion_asr_setup.py --model-root "C:\YwonModels\vosk-model-small-ru-0.22" --python-executable "$PWD\.venv-asr\Scripts\python.exe" --output-dir "$PWD\local-asr-config" --inspect-local-model
```
Helper читает/хеширует только выбранную модель, не скачивает/устанавливает ничего и не выдаёт доступ к пользовательским папкам. Старые config/manifest не перезаписываются. `asr-config.json` содержит личные локальные пути: не коммитить/публиковать. Модель/manifests должны быть локальными проверенными обычными файлами; links/hardlinks/лишние или изменённые файлы/oversized model denied. Existing Unix venv python symlink can be an explicitly trusted executable; model path links are rejected. Manifest source approval локальная, не SaaS trust root.

4. Явно включи optional engine:
```powershell
node scripts/companion_audio.ts --local-audio-pilot --asr-config "$PWD\local-asr-config\asr-config.json" --allow-local-asr
```
Preflight проверяет manifest/file hashes, наличие exact Vosk version и native library import; Model lazy-load per clip. Открой напечатанный127.0.0.1 URL у себя. Ошибка → redacted code и stop, никакого cloud fallback или изменения прав автоматически.

## Проверка в панели
- Сначала обычное согласие микрофона/«Включить». Затем отдельное «Разрешаю передать одну фразу локальному Python-процессу».
- «Начать фразу» → говори → «Закончить». Максимум15s, mono PCM16LE16000Hz,480000 bytes. PCM только RAM/browser→loopback→Python stdin; без аудиофайла/облака. Capture worklet outputs silence, not mic monitoring; box-averaging resampler is a bounded pilot, not quality-certified DSP.
- Текст появляется в editable черновике. Ни речь семьи, ни confidence не дают permission. Проверь/исправь и нажми «Это обращение к Ywon». Без этой review-кнопки обычная речь не поступает в core intent recipe.
- Pilot shared-core recipe распознаёт ровно «проверь файлы», «проверить файлы», «проверь выбранные файлы», «составь список файлов». Явно укажи relative .txt/.md/.csv/.json paths. Без путей needs_context, черновик сохраняется для уточнения; no invented folder/files. Предложение не читает файлы и остаётся executionAllowed=false/requiresLocalGrant=true; существующий runner/grant/dispatch должен отдельно разрешить реальное выполнение.
- Другие запросы честно needs_model; языковой модуль/TTS не подключены, modelCallAllowed=false, платных вызовов нет. Это не имитация ответа ассистента.
- Точно распознанные «выключи микрофон»/«не слушай»/«это не тебе»/«спи»/«закончи разговор» могут сразу уменьшить доступ, закрыв микрофон. Это fail-safe disarm, не speaker proof; возможен ложный stop от чужой речи. Уже submitted jobs/деньги не отменяются голосовым sleep.
- Mute/Escape (только focused browser window)/отзыв ASR consent/закрытие/смена вкладки/timeout отменяют текущий ASR и уничтожают draft. Поздний результат игнорируется. ASR opt-out может оставить обычный local mic meter включённым; Mute прекращает обе части. Не говорить пароли/seed/секреты.

## Бюджет, privacy и незавершённый target
Один fixed subprocess на фразу;30s timeout по умолчанию,1 native job,10 clip attempts per session, не daily CPU/cost cap. Native model cold-start/90MB file hashing повторяются на clip: deliberate isolation first, NOT low-latency full-duplex architecture. CPU threads requested1 via library env, не OS hard resource sandbox. Нет GPU/large LLM. Electricity/CPU cost и latency твоего i5 не измерены; факт no paid provider call не равен нулевой себестоимости.
Приложение не пишет audio/transcript в disk/log/SQLite. PCM buffers best-effort zeroed, private draft clears; Python process exits per clip. Это НЕ cryptographic erasure всех копий/OS swap/dumps/browser telemetry и не hostile-owner sandbox. Dependencies/model download нужен на setup, runtime worker имеет только фиксированный local model path и не вызывает downloader/network; OS-level egress isolation future.
Кнопка на каждую фразу + review — ВРЕМЕННЫЙ pilot, не отмена one-activation conversational target. Далее persistent ASR/streaming, проверяемая addressability/family/TV/echo/VAD, native/tray/global hotkey, short-lived provider route + separately approved caps/usage/cancel/unknown reconciliation, local or provider TTS and duplex. Speaker embedding не единственный authorizer; no silent removal of review/grant/budget boundaries. Windows10/11 hardware proof first; Linux/macOS release separate.
Source/handoff/evidence: B056_HANDOFF.md, COMPANION_VOICE.md, TR-10. Public voice/file models/dependencies redistribution/security/license review отдельно; модель/wheels не bundled.

## Проверенные источники
Official API: https://alphacephei.com/vosk/ ; models: https://alphacephei.com/vosk/models (RU0.22 Apache2.0,45M; general small-model memory claim≈300MB is vendor claim, not our device benchmark). Package/native wheel hashes: https://pypi.org/pypi/vosk/0.3.45/json ; source: https://github.com/alphacep/vosk-api . Public Russian word fixture used only for offline QA, not redistributed; no claims about unrestricted dictation/family accuracy from it.
