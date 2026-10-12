# B-058 — silent autostart/no-desktop + tray-check / REVIEW

Base B-057 (09bed4ba...208384). Bounded extension без tasks/project.json, без paid/sign.

## Implementation
- `installer/YwonInstaller.cs:Main` — парсит `--silent` + `--autostart` / `--no-desktop` / `--no-autostart`; silent теперь `DoInstall(!noDesktop, autostart, true)`. GUI-ветка без изменений.
- `installer/YwonUninstaller.cs` — после удаления ярлыков/ключей чистит пустой `%LOCALAPPDATA%\Ywon` родителя.
- `scripts/build_installer.py` — охранa перезаписи теперь допускает `--force`.
- `apps/desktop-companion/Ywon-tray.ts` — лёгкий `--check` ярлыков/реестра/target (Node 24 strip-types), не native tray.
- Пересборка `--force`: `Ywon-Companion-Setup-0.0.6.exe` 208896 sha256 `813525bc8a2cee2239e1608789bfa42e4fbe33bfbd353180e95cac18384fd82d` + `uninstall.exe` 7168 + payload 70 файлов 186558 sha `115fedc07b2e119f1b629d5fdc38c164fea56f8ee15a8845185cde119d55a505` (payload байт-идентичен B-057, только хэш-формат пересчитан). csc 4.0 winexe, no NSIS.

## Fresh evidence
Windows 10 19045 x64 Node24.19 Python3.14 csc4.0.30319. Три цикла:
1) `--silent` -> 24 entries, Desktop ON, Run ABSENT, Uninstall OK -> `uninstall --silent` -> shortcuts/keys gone, installDir gone (сразу, без reboot).
2) `--silent --autostart` -> Run PRESENT "…\Ywon.cmd", Desktop ON -> uninstall -> Run gone, dir gone.
3) `--silent --no-desktop` -> Desktop ABSENT, Start Menu ON, Run ABSENT -> uninstall -> clean.
certutil hash == manifest/sha256. `Ywon-tray.ts --check` PASS в обоих состояниях. Подробно: `reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md` (B-058 appendix) + `reports/evidence/companion-windows-installer-2026-10-06.json`.

## NOT_RUN / temporary
GUI-диалог/SmartScreen screenshot, Windows 11, реальный микрофон/ASR, signed MSI/MSIX/автообновление, native tray/service — NOT_RUN. Трей в B-058 только чекер, не background.

## Transitions / rollback
B-058 закрывает проверяемую ON-ветку автозапуска без GUI; TR-05/TR-06 signed/tray остаются future Q. P0/not_started, `project.py validate` PASS. Откат: `uninstall.exe --silent` или Параметры -> Удалить; при занятой папке — удалить `%LOCALAPPDATA%\Ywon` вручную.
