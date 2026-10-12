import pathlib, hashlib, json, sys, zipfile
ROOT=pathlib.Path(".").resolve()
def h(p): return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else "MISSING"
checks=[]
def chk(cond, msg):
    checks.append((cond,msg))
    print(("OK" if cond else "FAIL")+": "+msg)

p_setup=ROOT/"outputs/companion-windows-installer-2026-10-06/Ywon-Companion-Setup-0.0.7.exe"
p_zip=ROOT/"outputs/companion-windows-installer-2026-10-06/Ywon-Companion-0.0.7.zip"
p_tray=ROOT/"outputs/companion-windows-installer-2026-10-06/payload_stage/YwonTray.exe"
p_tray2=ROOT/"C:/Temp/YwonTray.exe"
# use raw
import os
# tray in temp
t2=pathlib.Path(r"C:\Temp\YwonTray.exe")
print("setup", p_setup.exists(), p_setup.stat().st_size if p_setup.exists() else 0)
print("zip", p_zip.exists(), p_zip.stat().st_size if p_zip.exists() else 0)
print("tray stage", p_tray.exists(), p_tray.stat().st_size if p_tray.exists() else 0)
print("tray temp", t2.exists(), t2.stat().st_size if t2.exists() else 0)
if p_setup.exists(): print("setup sha", h(p_setup))
if p_zip.exists(): print("zip sha", h(p_zip))
if p_tray.exists(): print("tray sha", h(p_tray))
if t2.exists(): print("tray temp sha", h(t2))
# manifest
mf=ROOT/"outputs/companion-windows-installer-2026-10-06/manifest.json"
print("manifest", mf.exists())
if mf.exists():
    j=json.loads(mf.read_text(encoding="utf-8"))
    print(json.dumps(j,ensure_ascii=False,indent=2)[:2000])
# stage files
stage=ROOT/"outputs/companion-windows-installer-2026-10-06/payload_stage"
files=list(stage.rglob("*"))
print("stage files", len([x for x in files if x.is_file()]))
for want in ["packages/companion/src/asr-stream-process.ts","apps/desktop-companion/pcm-stream-capture.mjs","workers/companion/asr_stream_worker.py","installer/YwonTray.cs","YwonTray.exe"]:
    pp=stage/want
    print(want, pp.exists(), pp.stat().st_size if pp.exists() else 0)
# check cs contains unicode escapes
cs=stage/"installer/YwonTray.cs"
if cs.exists():
    t=cs.read_text(encoding="utf-8",errors="replace")
    chk("AllocConsole" in t, "YwonTray.cs has AllocConsole")
    chk("\\u041e\\u0442\\u043a\\u0440" in t or "Открыть" in t or "\\u041e" in t, "YwonTray.cs ru escapes")
    chk("http://127" in t, "YwonTray.cs url regex")
    chk("ShowBalloonTip" in t, "YwonTray.cs balloon")
    chk("--help" in t, "YwonTray.cs --help")
    chk("--check" in t, "YwonTray.cs --check")
    chk("DoCheck" in t, "YwonTray.cs DoCheck")
# check asr-stream-process
asp=stage/"packages/companion/src/asr-stream-process.ts"
if asp.exists():
    t=asp.read_text(encoding="utf-8",errors="replace")
    chk("VoskStreamProcess" in t, "asr-stream-process has VoskStreamProcess")
    chk("sendChunk" in t, "has sendChunk")
    chk("0xFFFFFFFF" in t, "has 0xFFFFFFFF exit")
    chk("probe" in t.lower(), "has probe")
    print("asr-stream size", len(t))
# check audio-host
ah=stage/"packages/companion/src/audio-host.ts"
if ah.exists():
    t=ah.read_text(encoding="utf-8",errors="replace")
    chk("/api/audio/asr-stream" in t, "audio-host has /asr-stream route")
    chk("VoskStreamProcess" in t, "audio-host imports VoskStreamProcess")
    chk("X-Ywon" in t, "audio-host X-Ywon headers")
    print("audio-host size", len(t))
# pcm-stream
pcm=stage/"apps/desktop-companion/pcm-stream-capture.mjs"
if pcm.exists():
    t=pcm.read_text(encoding="utf-8",errors="replace")
    chk("Ywon-pcm-stream" in t, "pcm-stream has Ywon-pcm-stream")
    chk("AudioWorkletProcessor" in t, "pcm-stream AudioWorkletProcessor")
    print("pcm-stream size", len(t))
# audio-client
ac=stage/"apps/desktop-companion/audio-client.mjs"
if ac.exists():
    t=ac.read_text(encoding="utf-8",errors="replace")
    chk("YwonStartLiveStream" in t or "startLiveStream" in t, "audio-client has live stream fn")
    chk("pcm-stream-capture" in t, "audio-client imports pcm-stream-capture")
    chk("/api/audio/asr-stream" in t, "audio-client posts to /asr-stream")
    print("audio-client size", len(t))
# worker
w=stage/"workers/companion/asr_stream_worker.py"
if w.exists():
    t=w.read_text(encoding="utf-8",errors="replace")
    chk("0xFFFFFFFF" in t or "4294967295" in t, "worker has exit sentinel")
    print("worker size", len(t))
print("DONE checks", sum(1 for c,m in checks if c), "/", len(checks))
for c,m in checks:
    if not c: print("FAIL",m)
