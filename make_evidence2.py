import pathlib, json, hashlib, datetime
ROOT=pathlib.Path(".").resolve()
OUTDIR=ROOT/"outputs/companion-windows-installer-2026-10-06"
MANIFEST=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
old_ev=ROOT/"reports/evidence/companion-windows-installer-2026-10-06.json"
old=json.loads(old_ev.read_text(encoding="utf-8")) if old_ev.exists() else {}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
tray_path=OUTDIR/"payload_stage"/"YwonTray.exe"
payload_zip=OUTDIR/"Ywon-Companion-0.0.7.zip"
setup_exe=OUTDIR/"Ywon-Companion-Setup-0.0.7.exe"
evidence={"schemaVersion":1,"task":"B-060 LARGE","version":"0.0.7","builtAt":now,"host":"Windows 10 19045 x64 Node24 Py3.14 csc4.0","artifacts":{"installer":{"file":MANIFEST["installerExe"],"size":MANIFEST["installerSize"],"sha256":MANIFEST["installerSha256"]},"payloadZip":{"file":MANIFEST["payloadZip"],"size":payload_zip.stat().st_size,"sha256":MANIFEST["payloadZipSha256"]},"uninstall":{"file":"uninstall.exe","size":(OUTDIR/"uninstall.exe").stat().st_size,"sha256":hashlib.sha256((OUTDIR/"uninstall.exe").read_bytes()).hexdigest()},"tray":{"file":"YwonTray.exe","size":tray_path.stat().st_size,"sha256":hashlib.sha256(tray_path.read_bytes()).hexdigest(),"features":MANIFEST["tray"]["features"],"checks":MANIFEST["tray"]["checks"]},"workers":["asr_worker.py 3759","asr_stream_worker.py 5249"],"adapters":["asr-stream-process.ts 10194","audio-host.ts + /api/audio/asr-stream","pcm-stream-capture.mjs 1632"]},"installerType":"unsigned pilot winexe csc4.0","installMode":"per-user %LOCALAPPDATA%\\Ywon\\Ywon Companion, no admin","trayVerification":{"compile":"csc winexe RC0 13312 sha d9973e06 + AllocConsole for --help/--check","staticChecks":{"DefaultDir":"LocalApplicationData+Ywon Companion","RunSetupAsr":"cmd /c start SETUP-ASR.cmd","DoCheck":"HKCU Uninstall/Run + lnc + rc0/2","StartServer":"CreateNoWindow/RedirectStandardOutput/WindowStyle.Hidden","OnOutput":"Regex http://127.0.0.1:\\d+ -> Process.Start/Balloon","Main":"--minimized/--check/--help EnableVisualStyles NotifyIcon ContextMenu Timer1800s Application.Run","UiStrings":"unicode Открыть Ywon/Проверить установку/Настройка ASR/Выход"},"runtime":"NOT_RUN needs owner click on payload_stage/YwonTray.exe"},"liveStreaming":{"worker":"asr_stream_worker.py 5249 4-byte LE 0=finalize 0xFFFFFFFF=exit","adapter":"asr-stream-process.ts 10194 VoskStreamProcess sendChunk/finalize/close","host":"audio-host.ts /api/audio/asr-stream chunked 32k X-Ywon-Last","client":"pcm-stream-capture.mjs+audio-client.mjs YwonStartLiveStream","status":"CODE_WRITTEN_NOT_LIVE_VERIFIED"},"buildEvidence":{"payloadStage":"75 files","csc":["uninstall 7168","setup 224768 sha 06e404bf"],"zip":"202553 sha e179c1f9"},"productionReady":False,"paidCalls":0}
p=ROOT/"reports/evidence/companion-windows-installer-2026-10-06.json"
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(p.stat().st_size)
print(p.read_text(encoding="utf-8"))
