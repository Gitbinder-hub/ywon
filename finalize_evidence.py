import pathlib, json, hashlib, datetime
ROOT=pathlib.Path(".").resolve()
OUTDIR=ROOT/"outputs/companion-windows-installer-2026-10-06"
mf=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
zip_path=OUTDIR/"Ywon-Companion-0.0.7.zip"
setup=OUTDIR/"Ywon-Companion-Setup-0.0.7.exe"
tray=OUTDIR/"payload_stage/YwonTray.exe"
tray_tmp=pathlib.Path(r"C:\Temp\YwonTray.exe")
stage_files=len([p for p in (OUTDIR/"payload_stage").rglob("*") if p.is_file()])
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
ev={
 "schemaVersion":1,
 "task":"B-060 LARGE",
 "version":"0.0.7",
 "builtAt":now,
 "host":"Windows 10 19045 x64 csc4.0.30319 Node24 Python3.14",
 "artifacts":{
  "installer":{"file":mf["installerExe"],"size":setup.stat().st_size,"sha256":hashlib.sha256(setup.read_bytes()).hexdigest(),"path":"outputs/companion-windows-installer-2026-10-06/Ywon-Companion-Setup-0.0.7.exe"},
  "payloadZip":{"file":mf["payloadZip"],"size":zip_path.stat().st_size,"sha256":hashlib.sha256(zip_path.read_bytes()).hexdigest()},
  "uninstall":{"file":"uninstall.exe","size":(OUTDIR/"uninstall.exe").stat().st_size,"sha256":hashlib.sha256((OUTDIR/"uninstall.exe").read_bytes()).hexdigest()},
  "tray":{"file":"YwonTray.exe","size":tray.stat().st_size,"sha256":hashlib.sha256(tray.read_bytes()).hexdigest(),"shaTmp":hashlib.sha256(tray_tmp.read_bytes()).hexdigest(),"checks":["REGEX http://127.0.0.1:\\d+","CreateNoWindow/RedirectStandardOutput/WindowStyle.Hidden","ShowBalloonTip"],"features":mf["tray"]["features"]},
  "stream":["workers/companion/asr_stream_worker.py 5249","packages/companion/src/asr-stream-process.ts 10194","packages/companion/src/audio-host.ts /api/audio/asr-stream","apps/desktop-companion/pcm-stream-capture.mjs 1632 + audio-client.mjs YwonStartLiveStream"]
 },
 "trayVerification":{
  "compile":"csc winexe RC0 13312 + AllocConsole/AttachConsole + help non-blocking fix (UserInteractive && !Redirected) -> RC0 for --help/--check",
  "runtime":{"--help":"RC0 out help text no TIMEOUT (fixed)","--check":"RC0 out Ywon Companion check OK lines (installDir/Ywon.cmd/startmenu/desktop/HKCU Uninstall)","stage --help":"RC0","minimized/balloon":"NOT_RUN needs GUI live run"},
  "static":{"DefaultDir":"LocalApplicationData/Ywon Companion","DoCheck":"HKCU Uninstall+Run + lnc Existence","StartServer":"CreateNoWindow/RedirectStandardOutput/WindowStyle.Hidden BeginOutputReadLine","OnOutput":"Regex http://127.0.0.1:\\d+ -> url capture -> Process.Start or ShowBalloonTip if minimized","Main":"--minimized/--check/--help EnableVisualStyles NotifyIcon ContextMenuStrip itemSetup Timer1800 Application.Run tray.Visible+server.Kill","Ui":"unicode escapes Открыть Ywon/Проверить установку/Настройка ASR/Выход + balloon Локальный сервер запущен"}
 },
 "liveStreaming":{"worker":"asr_stream_worker.py 4-byte LE 0=finalize 0xFFFFFFFF=exit partial/final JSON","adapter":"asr-stream-process.ts VoskStreamProcess queue+waiters timeout","host":"audio-host.ts chunked octet-stream X-Ywon-Session/Sequence/Last lane.enabled+voice.active gates","client":"pcm-stream-capture.mjs AudioWorkletProcessor Ywon-pcm-stream 1024 + audio-client.mjs YwonStartLiveStream fetch chunked","status":"CODE_WRITTEN_VERIFIED_COMPILE_NOT_LIVE_MIC"},
 "payloadStageFiles":stage_files,
 "build":{"csc":["uninstall 7168 RC0","setup 224768 RC0"],"zipInner":mf["payloadZipSha256"],"installerSha256":mf["installerSha256"]},
 "installMode":"per-user %LOCALAPPDATA%\\Ywon\\Ywon Companion no admin shortcuts Start+Desktop Run OFF default SmartScreen expected",
 "productionReady":False,"paidCalls":0
}
p=ROOT/"reports/evidence/companion-windows-installer-2026-10-06.json"
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(ev,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(p.read_text(encoding="utf-8"))
