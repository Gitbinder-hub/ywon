# B-057 — unsigned Windows installer / REVIEW

Base B-056 (978c39d). Bounded wrapper без изменения tasks/project.json, без paid/sign.
Owner choices: DisplayName `Ywon Companion`, desktop shortcut ON, autostart OFF.

## Implementation
Payload 0.0.6 (70 files) собран из `outputs/companion-windows-path-fix-2026-10-05/Ywon-Companion` (+ Ywon.cmd launcher + version marker) путём стандартного ZIP без скачки.
Сборка EXE только средствами .NET Framework 4.0 `csc.exe /target:winexe`: `installer/YwonUninstaller.cs` → `uninstall.exe` (6 656), затем `installer/YwonInstaller.cs` + ресурсы `payload.zip` + `uninstall.exe` → `Ywon-Companion-Setup-0.0.6.exe` (208 384). Скрипт: `scripts/build_installer.py`. NSIS/Inno/WiX/Tauri/Rust не требуются.

Per-user install dir `%LOCALAPPDATA%\Ywon\Ywon Companion` (выбор в диалоге; silent — дефолт), распаковка через `ZipArchive` с path-traversal check, без админа и без изменения PATH/переменных. Node/Python не бандлятся.

Реестр: `HKCU\...\Uninstall\YwonCompanion` (DisplayName `Ywon Companion`, Publisher Ywon, DisplayVersion 0.0.6, InstallLocation, UninstallString/QuietUninstallString, DisplayIcon). Ярлыки WScript.Shell: `Start Menu\Ywon\Ywon.lnk` + `Uninstall…lnk`, `Desktop\Ywon Companion.lnk` (вкл по умолчанию, silent тоже ставит). Цель `Ywon.cmd` → `START.cmd`. Автозапуск `HKCU\...\Run\YwonCompanion` только при галочке (по умолчанию отсутствует).

Unsigned — SmartScreen покажет предупреждение; в UI это явно указано, обход не делается.

Uninstall: `uninstall.exe [--silent]` удаляет ярлыки/Run/Uninstall-ключ, запускает отложенный `rmdir /s /q` через temp .cmd; пустая папка может остаться занятой до закрытия проводника — удаляется вручную. ASR runtime/config не трогает.

## Fresh evidence
Windows 10 19045 x64, Node 24.19.0, Python 3.14.8, csc 4.0.30319.
`Ywon-Companion-Setup-0.0.6.exe --silent` exit 0 → `C:\Users\Marina\AppData\Local\Ywon\Ywon Companion` (24 верхнеуровневых), ярлыки Desktop и Start Menu присутствуют, Uninstall-ключ с DisplayName `Ywon Companion` присутствует, Run-ключ отсутствует (OFF по умолчанию). `uninstall --silent` → ярлыки и Uninstall-ключ удалены, Run пуст; пустая папка осталась из-за handles (известная отложенная очистка). certutil hash совпадает с manifest/sha256. Подробно: `reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md` + `reports/evidence/companion-windows-installer-2026-10-05.json`.

## NOT RUN / temporary
GUI-диалог на чистом профиле/скриншот SmartScreen, галочка автозапуска ON, полная очистка после reboot, реальный микрофон/ASR после установленной папки, Windows 11, подписанный MSI/MSIX/автообновление, tray как native/Node service — NOT_RUN / future. Трей в B-057 не добавлен (ярлыки покрывают запуск); лёгкий `Ywon-tray.ts` — следующий bounded шаг при необходимости.

## Transitions / rollback
TR-05/TR-06: ZIP → unsigned EXE wrapper выполнен; signed installer/update, native tray — отдельные future Q без изменения product gates. `tasks/project.json` не менялся, P0/not_started сохранён, `project.py validate` остаётся PASS.
Откат: Параметры → Приложения → Удалить `Ywon Companion` или `uninstall.exe`; при занятой папке удалить `%LOCALAPPDATA%\Ywon` вручную после закрытия проводника. Старые portable ZIP (0.0.4/0.0.5) — резерв.
