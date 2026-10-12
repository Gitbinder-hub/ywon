import pathlib, shutil, hashlib, json, zipfile, subprocess
ROOT = pathlib.Path(".").resolve()
SRC = ROOT / "outputs" / "companion-windows-path-fix-2026-10-05" / "Ywon-Companion"
if not SRC.exists():
    SRC = ROOT / "outputs" / "companion-windows-asr-2026-10-05" / "Ywon-Companion"
print("SRC", SRC, SRC.exists())
# copy staged outputs to new 0.0.7 dir
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
PAYLOAD_DIR = OUTDIR / "payload_stage"
PAYLOAD_DIR.mkdir(parents=True, exist_ok=True)
# clean
for p in PAYLOAD_DIR.iterdir():
    if p.is_dir(): shutil.rmtree(p)
    else: p.unlink()
# copy all from SRC
import os
for src in SRC.rglob("*"):
    if src.is_file():
        rel = src.relative_to(SRC)
        dst = PAYLOAD_DIR / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
print("copied payload stage", len(list(PAYLOAD_DIR.rglob("*"))))
# ensure YwonTray.exe from C:\Temp
tray_src = pathlib.Path(r"C:\Temp\YwonTray.exe")
if tray_src.exists():
    shutil.copy2(tray_src, PAYLOAD_DIR / "YwonTray.exe")
    print("tray copied", (PAYLOAD_DIR/"YwonTray.exe").stat().st_size, hashlib.sha256((PAYLOAD_DIR/"YwonTray.exe").read_bytes()).hexdigest()[:16])
# ensure pcm-stream-capture + audio-client patched + host patched are in apps/desktop-companion and packages/companion/src - but payload is START.cmd + Node assets? Actually payload is for installer extraction. The Node files are not in payload zip directly; payload zip is Ywon Companion app (Node bundle). We need to inject new companion files into payload.
# Check what is in PAYLOAD_DIR: list
for f in PAYLOAD_DIR.rglob("*"):
    if f.is_file():
        print(f.relative_to(PAYLOAD_DIR), f.stat().st_size)
        if f.stat().st_size>50000:
            print(" large")
            break
print("DONE prepare")
