"""Package B-056 plus the reviewed Windows ASR setup/pipe follow-up.

No downloads, installation, runtime edits, existing-folder replacement or Q-state changes.
The source manifest is an integrity inventory, not a publisher signature.
"""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'Ywon-Companion-Pilot-0.0.3' / 'Ywon-Companion-Pilot'
OUTPUT = ROOT / 'outputs' / 'companion-windows-path-fix-2026-10-05'
PACKAGE = OUTPUT / 'Ywon-Companion'
UPDATED_SOURCE = {'packages/companion/src/asr-process.ts', 'bootstrap/COMPANION_ASR_PILOT.md'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    manifest_bytes = (SOURCE / 'manifest.json').read_bytes()
    original = json.loads(manifest_bytes)
    payload = {}
    for name, expected in original['files'].items():
        relative = Path(name)
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Unsafe source manifest path')
        content = (SOURCE / relative).read_bytes()
        if digest(content) != expected:
            raise ValueError(f'Source checksum mismatch: {name}')
        if name not in ('README.md', 'package.json', 'run-audio.cmd'):
            canonical = ROOT / relative
            if not canonical.is_file() or (name not in UPDATED_SOURCE and canonical.read_bytes() != content):
                raise ValueError(f'Current project differs: {name}')
            if name in UPDATED_SOURCE:
                content = canonical.read_bytes()
        payload[name] = content
    payload['README-original-0.0.3.md'] = payload['README.md']
    payload['manifest-original-0.0.3.json'] = manifest_bytes
    for name in (
        'bootstrap/B051_HANDOFF.md', 'bootstrap/B053_HANDOFF.md',
        'bootstrap/B054_HANDOFF.md', 'bootstrap/B055_HANDOFF.md',
        'docs/architecture/DESKTOP_COMPANION.md',
        'docs/governance/IMPLEMENTATION_TRANSITIONS.md',
        'docs/adr/0006-desktop-companion-boundary.md',
        'docs/adr/0007-working-prototype-stack.md',
        'reports/COMPANION_WINDOWS_PACKAGE_2026-10-05.md',
        'reports/COMPANION_ASR_WINDOWS_2026-10-05.md',
        'reports/COMPANION_ASR_PATH_FIX_2026-10-05.md',
        'scripts/companion_asr_install.py',
        'tests/companion-asr-process.test.mjs',
        'tests_companion/test_asr_setup.py',
        'bootstrap/evidence/2026-10-05-companion-asr/model-provenance.json',
        'bootstrap/evidence/2026-10-05-companion-asr/dependency-provenance.json',
        'bootstrap/evidence/2026-10-05-companion-asr/dependency-closure.json',
    ):
        payload[name] = (ROOT / name).read_bytes()

    def add(name, text, encoding='utf-8'):
        payload[name] = text.replace('\r\n', '\n').replace('\n', '\r\n').encode(encoding)

    add('README.md', '''# Ywon — Домовой: локальный прототип для Windows

Это пакет 0.0.5 на основе B-056 с исправленным выводом русского текста на
Windows и отдельной командой настройки ASR. Склеивать старые папки не нужно.
Код соответствует текущему проекту; основной Factory для запуска не нужен.

## Настройка распознавания русской речи
1. Распакуй архив в постоянную папку. Нужны Node.js 24 и Python 3.10–3.14 x64.
2. Запусти SETUP-ASR.cmd и подтверди установку клавишей Y. Этот отдельный
   helper скачивает модель с alphacephei.com (46 MB) и закреплённые зависимости
   с PyPI, проверяет SHA256, создаёт локальную Python-среду и проверяет движок
   на искусственной тишине. Обычный START ничего не скачивает.
3. Только после SETUP COMPLETE открой START-ASR.cmd, затем его локальный
   адрес в Chrome/Edge. Включи микрофон сам и отдельно разреши передачу фразы
   локальному Python-процессу. «Начать фразу» → говори → «Закончить».
4. Полученный черновик можно исправить. Свободного разговора с ИИ пока нет.

Runtime по умолчанию расположен в %LOCALAPPDATA%/Ywon/ASR, отдельно от папки
программы. Так Python и native-модель не получают слишком длинные пути.
Для другого диска предусмотрены --runtime-base и приватный local-asr-setup.json.
Существующая полная загрузка модели в старой папке пакета повторно проверяется
и используется без скачивания. Неполные загрузки и старый venv сохраняются.
Настройка требует интернета и минимум 700 MiB на целевом диске. Ошибка hash,
зависимостей или native probe останавливает её, без отключения защиты и
повторов. Незавершённые папки сохраняются; старый config не заменяется.
Runtime/config относятся к этому компьютеру: не пересылай их, не перемещай
настроенную папку. Полная установка здесь ещё НЕ проверена из-за недоступной
сети/службы согласования; helper не равен уже установленному распознаванию.

## Запуск
1. Полностью распакуй ZIP. Не запускай файлы прямо внутри архива.
2. В папке Ywon-Companion дважды нажми START.cmd.
3. В чёрном окне появится строка с адресом вида http://127.0.0.1:12345.
   Скопируй только адрес из поля "url" в обычный Chrome или Edge.
   Номер порта выбирается заново при каждом запуске.
4. Оставь чёрное окно открытым. На странице микрофон сначала выключен.
   Для проверки отметь согласие и нажми «Включить микрофон».
   Разрешение браузера на микрофон подтверждаешь ты сам.
5. Говори — должна двигаться шкала уровня. «Проверить динамик» включает
   тестовый тон. Mute выключает микрофон. Уход из окна тоже выключает его.
6. Для полной остановки нажми Mute и закрой чёрное окно, затем вкладку.

Нужен Node.js 24. На компьютере, где собран пакет, найден Node 24.19.0.
Пакет ничего не устанавливает. Если Node отсутствует, официальный сайт:
https://nodejs.org/ — нужна ветка 24.x, без обязательных Docker/WSL/npm install.
Права администратора для запуска пилота не нужны. Не отключай защиту OS.

## Что уже доступно
- Локальная браузерная панель, шкала микрофона и проверка звука.
- Отдельная демонстрация исполнителя: DEMO.cmd. Она создаёт только два
  синтетических файла в новой local-demo/demo-* папке рядом с программой,
  проверяет их и сохраняет result.json. Существующие файлы не заменяет.
- Опциональное распознавание русской речи Vosk: после отдельной настройки
  START-ASR.cmd. Модель и Python-зависимости не входят в архив.

## Что означает отключённое распознавание
В обычном запуске надпись «Офлайн-распознавание не подключено» ожидаема.
START.cmd проверяет аудиоканал, но не превращает речь в текст.
Подробная ручная инструкция: bootstrap/COMPANION_ASR_PILOT.md. Она включает
отдельную Python-среду, проверенную модель и local-asr-config/asr-config.json.
После настройки START-ASR.cmd включает движок; в браузере всё равно нужно
отдельное согласие на передачу фразы локальному Python-процессу.
Зависимости и совместимость Vosk с установленным Python 3.14.8 на этой
Windows в этой работе не проверены. Автоустановки и облачного fallback нет.

## Граница прототипа
Свободного разговора с ИИ, голосовых ответов, работы в трее и подключения
к облачному Factory здесь пока нет. Текст из речи создаёт черновик и
предложение после ручной проверки; команды на компьютере из речи не
выполняются. Платных запросов нет. Это unsigned исходный пилот, не установщик.

## Проверки этой сборки
Windows 10 build 19045 x64, Node 24.19.0: 69 выбранных тестов аудио/речи PASS
внутри одного процесса (предыдущий Windows ASR block); 12 offline-тестов setup
PASS после исправления длинных путей. UTF-8 вывод русского
текста проверен с Python 3.14.8. Прежний запуск панели/demo записан отдельно.
Реальный микрофон/качество речи/Vosk/Windows 11/полный набор тестов не проверены.
Подробности: reports/COMPANION_ASR_PATH_FIX_2026-10-05.md и предыдущий ASR handoff.
manifest.json фиксирует SHA256 содержимого, но не является подписью издателя.

Старые папки остаются резервными копиями. Для запуска используй только эту.
''')
    add('START-HERE.txt', '''Ywon — запуск

1. Распакуй весь архив в постоянную папку.
2. Для речи: SETUP-ASR.cmd → подтверди Y → дождись SETUP COMPLETE.
   Нужен интернет для модели/зависимостей. Установка ещё не проверена здесь.
3. Открой START-ASR.cmd и скопируй адрес http://127.0.0.1:... в Chrome/Edge.
4. Оставь чёрное окно открытым. Оба согласия на микрофон/ASR дай сам.

START.cmd работает без настройки: только проверка микрофона и динамика.

Обычный запуск — проверка микрофона и динамика. Свободного разговора с ИИ
пока нет. Для распознавания русской речи нужна отдельная настройка:
bootstrap/COMPANION_ASR_PILOT.md, затем START-ASR.cmd.

DEMO.cmd — проверка двух искусственных файлов, без доступа к твоим документам.
Подробности и ограничения — README.md.
''')
    preflight = r'''@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto no_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 2)"
if errorlevel 1 goto wrong_node
'''
    errors = ''':no_node
echo Node.js 24 was not found. See README.md and https://nodejs.org/
pause
exit /b 2
:wrong_node
echo This pilot requires Node.js 24.x. Installed version:
node --version
pause
exit /b 2
'''
    add('START.cmd', preflight + r'''echo Ywon Companion - local audio pilot
echo Copy the http://127.0.0.1:PORT URL below into Chrome or Edge.
echo Keep this window open. Close it to stop the server.
echo Speech recognition and conversational AI are NOT enabled in this mode.
node scripts\companion_audio.ts --local-audio-pilot
set "Ywon_exit=%errorlevel%"
if not "%Ywon_exit%"=="0" pause
exit /b %Ywon_exit%
''' + errors, 'ascii')
    add('run-audio.cmd', '@echo off\ncall "%~dp0START.cmd"\n', 'ascii')
    add('SETUP-ASR.cmd', r'''@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 goto no_python
python -I -X utf8 scripts\companion_asr_install.py
if errorlevel 1 goto failed
if /I "%~1"=="--check" exit /b 0
if not "%~1"=="" goto failed
echo This downloads the Russian model from alphacephei.com and dependencies from PyPI.
echo Runtime directory is shown above. No admin, microphone access or paid API calls.
echo Read README.md and bootstrap\COMPANION_ASR_PILOT.md first.
choice /C YN /N /M "Download and install the local ASR environment? [Y/N] "
if errorlevel 2 exit /b 0
if not errorlevel 1 exit /b 2
python -I -X utf8 scripts\companion_asr_install.py --install-local-asr
set "Ywon_exit=%errorlevel%"
pause
exit /b %Ywon_exit%
:no_python
echo Python 3.10-3.14 x64 was not found. See README.md and https://www.python.org/
:failed
echo Setup did not complete. Keep the error for review; do not disable checks.
pause
exit /b 2
''', 'ascii')
    add('START-ASR.cmd', preflight + r'''if not exist "local-asr-config\asr-config.json" goto no_config
echo Ywon Companion - optional LOCAL speech recognition
echo Copy the http://127.0.0.1:PORT URL below into Chrome or Edge.
echo Browser consent is still required. Keep this window open.
node scripts\companion_audio.ts --local-audio-pilot --asr-config "%~dp0local-asr-config\asr-config.json" --allow-local-asr
set "Ywon_exit=%errorlevel%"
if not "%Ywon_exit%"=="0" pause
exit /b %Ywon_exit%
:no_config
echo ASR is not configured. Read bootstrap\COMPANION_ASR_PILOT.md.
echo No files were downloaded or installed. START.cmd works without ASR.
pause
exit /b 2
''' + errors, 'ascii')
    add('DEMO.cmd', preflight + r'''echo Ywon Companion - synthetic file demonstration
node scripts\companion_demo.ts --data-dir "%~dp0local-demo" --confirm-demo
set "Ywon_exit=%errorlevel%"
pause
exit /b %Ywon_exit%
''' + errors, 'ascii')
    package_info = json.loads(payload['package.json'])
    package_info['version'] = '0.0.5'
    payload['package.json'] = (json.dumps(package_info, indent=2) + '\n').encode('utf-8')
    add('.gitignore', 'local-asr-runtime/\nlocal-asr-config/\nlocal-asr-setup.json\n.venv-asr/\nlocal-demo/\n__pycache__/\noutputs/\n')
    payload['manifest.json'] = (json.dumps({
        'mode': 'unsigned_local_source_pilot', 'version': '0.0.5',
        'packagingRevision': 'windows-asr-path-fix-2026-10-05', 'productionReady': False,
        'windowsCertification': False, 'asrBundled': False, 'cloudProviderCalls': 0,
        'sourceManifestSha256': digest(manifest_bytes),
        'files': {name: digest(data) for name, data in sorted(payload.items())},
    }, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    if OUTPUT.exists():
        raise FileExistsError(f'Refusing to overwrite existing output: {OUTPUT}')
    PACKAGE.mkdir(parents=True)
    for name, data in payload.items():
        path = PACKAGE / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    archive = OUTPUT / 'Ywon-Companion-Windows-0.0.5.zip'
    with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED) as out:
        for name, data in sorted(payload.items()):
            out.writestr('Ywon-Companion/' + name, data)
    with zipfile.ZipFile(archive) as check:
        if check.testzip() is not None:
            raise ValueError('ZIP CRC failed')
        for name, data in payload.items():
            if check.read('Ywon-Companion/' + name) != data:
                raise ValueError(f'ZIP content mismatch: {name}')
    (OUTPUT / (archive.name + '.sha256')).write_text(
        digest(archive.read_bytes()) + '  ' + archive.name + '\n', encoding='ascii')
    print(json.dumps({'archive': str(archive), 'files': len(payload),
                      'zip_crc': 'PASS', 'content_hashes': 'PASS'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
