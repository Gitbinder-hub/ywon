# Домовой: первый запускаемый локальный пилот B-051

Не полный AI-агент и не подключённый клиент сервиса. Этот пакет проверяет настоящий локальный исполнитель: разрешение папки, задание, SQLite, чтение, хеши, результат и восстановление. Он не выходит во внешнюю сеть, не ищет деньги, не запускает модель, не публикует, не вводит пароли и не меняет системные настройки. Используется Node.js **24**; node:sqlite пока experimental. Пакет — исходный unsigned pilot, не production installer. Windows10/11 ещё не проверены на реальном устройстве.

## Самая простая проверка на Windows
1. Нужен установленный Node.js 24; этот пилот ничего не устанавливает. Распаковать пакет в свою рабочую папку.
2. Открыть `scripts/companion_demo.cmd`, либо из терминала выполнить:

```powershell
node scripts/companion_demo.ts --data-dir "$env:LOCALAPPDATA\Qevunara\CompanionPilot" --confirm-demo
```

Будет создана НОВАЯ папка demo-* с двумя синтетическими материалами, локальным state и result.json. Чужие/личные файлы демонстрация не читает. Существующие результаты не перезаписывает. Успех: JSON с ok=true, filesChecked=2, grantRevokedAfterDemo=true и путём результата. Node SQLite может напечатать experimental warning в stderr — это не спрятано.
Если Node другой версии, команда отказала или OS security policy блокирует запуск — не отключать защиту ради пилота; сохранить сообщение без приватных данных. Можно использовать прямую node-команду. CMD launcher проверен только чтением, реальный запуск на Windows НЕ выполнен.

## Своё read-only задание (для владельца локального стенда)
Сначала `info` с общими `--data-dir STATE --device-id DEVICE --workspace-id WORKSPACE`. STATE вне разрешаемой папки. Local IDs — локальная привязка, НЕ облачная аутентификация.
Создать grant.json с точными полями:

```json
{"schemaVersion":1,"grantId":"g1","deviceId":"d1","workspaceId":"w1","root":"C:\\Users\\USER\\Documents\\TestMaterials","expiresAt":"REPLACE_WITH_FUTURE_ISO_TIMESTAMP_WITHIN_24H","maxTasks":1,"maxFiles":4,"maxTotalBytes":1048576}
```

Root и expiresAt заменяются владельцем; пример не рабочий доступ. Использовать только выбранные несекретные тестовые .txt/.md/.csv/.json. Все node-команды ниже дополняются `--data-dir STATE --device-id d1 --workspace-id w1`:
- `node scripts/companion_local.ts approve --input grant.json --confirm-local-folder`
- paths.json: например `["brief.md","notes.txt"]`.
- `node scripts/companion_local.ts plan --grant-id g1 --task-id t1 --operation-id o1 --files paths.json` возвращает JSON envelope в `value`. Сохранить **только value** как task.json.
- `node scripts/companion_local.ts enqueue --input task.json`
- `node scripts/companion_local.ts run --task-id t1`
- `node scripts/companion_local.ts status --task-id t1`
- `node scripts/companion_local.ts stop --task-id t1` или `revoke --grant-id g1`.
- `node scripts/companion_local.ts events` — локальный журнал, не отправлять его без проверки приватности.

Служебные данные включают локальную root path в DB permit: каталог STATE личный, не коммитить/рассылать. Результат содержит имена, хеши и размеры, не исходные тексты; имена тоже могут быть приватными. Переотправка ровно того же task не создаёт новую операцию; смена task ID не обходит operation ID. После аварии read-only task можно продолжить после истечения lease (обычно30s); failed/cancelled tasks не перезапускаются автоматически.

## Переходы
Это TR-05 local execution, не cloud pairing/GUI/public distribution и не полный F41. Следующие блоки: authenticated protocol/server grants, минимальное управление в пользовательской сессии, Windows10 и11 отдельно, совместное end-to-end evidence. Общая архитектура и будущие Linux/macOS сохраняются. Ни один прототип не получает production=true только потому, что demo работает.

## B-055 — дополнительная аудиопроверка Ywon
Отдельный запуск без доступа к папкам: `node scripts/companion_audio.ts --local-audio-pilot`. Аудио остаётся в локальном браузере, ASR/модель не подключены. Полная инструкция bootstrap/COMPANION_AUDIO_PILOT.md; механизм tested on Linux Chromium synthetic device, real Windows still NOT_RUN. Историческое имя Qevunara в existing demo data path остаётся совместимым; display name Ywon не переносит/не очищает данные.
