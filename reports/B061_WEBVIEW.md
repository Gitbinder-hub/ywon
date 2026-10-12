# B-061 WebView2 + portable E:/Ywoom-ASR (A offline)

Без платных вызовов. Goal: окно WebView2 вместо Process.Start(url) + портативный рантайм на E:/Ywoom-ASR.

## Tray WebView2
- YwonTray.cs 16055 sha bae45583 -> YwonTray.exe 21504 sha 6034d938 (C:/Temp + installer + stage sync)
- OnOutput/ OpenBrowser -> ShowWebWindow(url)/NavigateWebWindow(url): reflection LoadFrom Microsoft.Web.WebView2.WinForms.dll, EnsureCoreWebView2Async Wait/GetAwaiter, Source/Navigate, fallback WebBrowser -> fallback Process.Start(url)
- Форма 1120x760 StatusStrip с Открыть в браузере, FormClosed сброс, --help упоминает WebView2
- DoCheck: portable Node/venv/Vosk/WebView2 dll + path length 12 <=120
- Верификация: --help RC0 WebView2, --check RC0 OK installDir/Ywon.cmd/START.cmd/uninstall/lnk/HKCU + (info) not yet + OK 12<=120

## Portable E:/Ywoom-ASR
- E:/Ywoom-ASR создан (len 12, future r-xxxx 23 <=120) + README, local-asr-setup.json {"runtimeBase":"E:/Ywoom-ASR"}
- START_portable.cmd: приоритет E:/Ywoom-ASR/node-portable -> ./node-portable -> system Node 24
- SETUP-ASR_portable.cmd: --runtime-base E:/Ywoom-ASR весь путь
- stage обновлен, реальный Node/Python/Vosk пока не скачаны (info, не ошибка)

## Сборка 0.0.8
- payload 0.0.8.zip 208130 sha 2472763e (78 files) -> uninstall 7168 -> Setup 0.0.8.exe 230400 sha 800321a2 (csc 4.0 winexe, payload+uninstall ресурсы)
- manifest/sha256 рядом, папка companion-windows-webview-2026-10-06 отдельная

## Transitions
- TR-05 Process.Start -> webView.Navigate (reflection, fallback external)
- TR-10 portable E:/Ywoom-ASR <=120
- WebView2 dll не встроена (нужен локальный NuGet), fallback работает

## Not done (B only after да)
- Установка Node/Python/Vosk на E: (46 MB + pip hash)
- Live ASR/GUI smoke, облако Google/Fal/Architect (per-run cap $0.25-1/ $2-5, monthly none)
