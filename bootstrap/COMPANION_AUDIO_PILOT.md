# Ywon — локальная проверка микрофона и динамика

B-055: отдельный browser-audio adapter к VoiceSession. Это НЕ полноценный голосовой AI-разговор: ASR, адресат речи, TTS, LLM, pairing и управление компьютером голосом ещё не подключены. Настоящий захват/воспроизведение браузерными API реализованы; Windows10/11 на реальном ноутбуке ещё не проверены. Linux Chromium с синтетическим аудиоустройством проверяет механику, не качество твоего микрофона.

## Запуск на Windows (первый owner smoke)
Нужен Node.js24 и локальный современный Chrome/Edge с getUserMedia/AudioContext. Версии/builds/поддержку OS записать; эта инструкция не сертифицирует Windows10/11 или старые неподдерживаемые браузеры. Ничего автоматически не устанавливается, никаких paid API/ключей. Не запускать панель в удалённом Codespaces: она предназначена для локального процесса на твоём ноутбуке; private forwarding/origins намеренно НЕ поддерживаются.

Из корня распакованного source pilot или репозитория:
```powershell
node scripts/companion_audio.ts --local-audio-pilot
```
Команда напечатает JSON с url вида `http://127.0.0.1:PORT`. Открой ТОЧНО этот адрес в локальном браузере. Адрес без пароля/ключа; server слушает только127.0.0.1 на временном порту, не интернет/LAN. В source bundle также есть run-audio.cmd; реальный CMD запуск на Windows ещё NOT_RUN. Не отключай OS protection ради unsigned пилота. Сначала inspect исходники/manifest; не считать manifest доверенным signing root сам по себе.

1. До согласия/кнопки микрофон выключен. Отметь локальное согласие, нажми «Включить микрофон» и разреши доступ в собственном браузере.
2. Шкала должна реагировать на звук. Она НЕ распознаёт речь/владельца и не запускает действия от уровня громкости. Камера не используется; исходный микрофон НЕ подключён к динамику.
3. «Проверить динамик» проигрывает фиксированный негромкий 1.2s тестовый тон. Это не голос модели. «Перебить» останавливает этот тон, оставляя микрофон активным.
4. «Mute · не слушай» сразу вызывает MediaStreamTrack.stop(), disconnect и AudioContext.close(); одного скрытия индикатора недостаточно. «Завершить» также закрывает захват. Отзыв checkbox выключает микрофон.
5. Пауза45s / maximum5min, потеря связи с локальным процессом, завершённая аудиодорожка, blur/уход из окна и pagehide закрывают захват. Обновление/новая вкладка выдаёт fresh browser binding и прекращает старую сессию. Позднее разрешение микрофона после Mute не должно воскресить захват.
6. Останови сервер Ctrl+C; проверь индикатор микрофона браузера и UI. Для повторного включения нужна физическая кнопка. Нет wake word/background always-listening.

## Границы безопасности и приватности
Аудио не записывается/не сохраняется/не отправляется в Node или облако. Между UI и local host только маленькие {command,sequence}/snapshot/effects, без PCM/transcript/device IDs. Native browser/OS may maintain their own permission/history/telemetry independently; no zero-telemetry OS guarantee. Class/device IDs не логируются. Voice session ephemeral; runner SQLite остаётся отдельно и не получает audio grant.
Single local controller: короткоживущий HttpOnly SameSite=Strict cookie + CSRF; exact Host/Origin/Sec-Fetch-Site, no CORS, no framing, no redirects/proxy exposure. Browser tabs are not SaaS authenticated users; local owner processes can access loopback: не обещать hostile-owner sandbox. Новая page navigation rotates cookie/CSRF. Increasing command sequence fences delayed activate after mute. Limited256-byte command body; no arbitrary paths/shell/grants/task execution/upload endpoint.
Browser executes stop even when server disappears; server heartbeat fallback closes controller too. Suspended/throttled browser/OS can delay timer callbacks: это НЕ hardware kill switch/hard realtime guarantee. Physical browser/OS mic revoke remains independent. During this pilot focus loss deliberately disables capture; target tray/native user-session experience will allow other-app work only with explicit privacy settings/evidence, not a hidden default relaxation.
This adapter is stricter/smaller than final conversational UX. Capture promise and transient user activation behavior vary by browser/build; report errors instead of automatically changing permissions/providers. echoCancellation/noiseSuppression/autoGainControl constraints REQUESTED only; actual AEC/noise/addressability quality not verified by a positive meter.

## Что записать при ручной проверке
OS edition/build/patch status, Node/browser version, device category/headset vs speakers (без serial IDs), started/muted/idle/blur/permission denial/unplug/sleep-resume/process-loss results. Не присылай запись семьи, приватный transcript, cookie или полный machine log. Windows10/11 evidence separate; Linux/macOS future release still explicit.
Actual runtime tests and prototype→target requirements: bootstrap/B055_HANDOFF.md, docs/architecture/COMPANION_VOICE.md, TR-10. Next slice: supported STT route + actual addressability + core proposal review, then separately capped voice model/usage/cancel reconciliation. No cloud call from current panel.

## Optional B-056 extension — privacy scope is explicit
This guide describes default B-055 no-ASR mode. B-056 does not silently change it: only --asr-config + --allow-local-asr and separate UI consent allow one bounded phrase to local Python via loopback, never cloud. App still creates no audio files; PCM/draft are transient memory. Recognised speech/selected paths become proposal only after explicit review. Setup and new constraints: COMPANION_ASR_PILOT.md/B056_HANDOFF.md. B-055 no-ASR instructions are not a claim that opted-in B-056 never sends PCM to the local process.
