"""Build 0.0.8 payload_stage from current project + installer fix (QvunaTray as main target)."""
import pathlib, hashlib, json, zipfile, subprocess, shutil, sys, os, time
ROOT = pathlib.Path(".").resolve()
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
STAGE = OUTDIR / "payload_stage"
CSC = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
PAYLOAD_ZIP = "Ywon-Companion-0.0.8.zip"
EXE_NAME = "Ywon-Companion-Setup-0.0.8.exe"
VERSION = "0.0.8"

def digest(b): return hashlib.sha256(b).hexdigest()

# 1) rebuild payload_stage from current working tree (copy relevant dirs/files)
# Keep QvunaTray.exe, copy web companion assets, model-switch/freelancer are web-side not needed in tray payload but keep scripts.
# For payload we package the Companion per-folder: same as before plus updated billing web files.

# Stage already exists from B-060; just ensure billing files + fixed Ywon.cmd + version
# Inject billing.html/js into payload's apps/web/public
for name in ["billing.html", "billing.js"]:
    src = ROOT / "apps" / "web" / "public" / name
    dst = STAGE / "apps" / "web" / "public" / name
    if src.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print("injected", dst.relative_to(STAGE))
# Also inject apps/api/src/billing.ts
src_billing = ROOT / "apps" / "api" / "src" / "billing.ts"
dst_billing = STAGE / "apps" / "api" / "src" / "billing.ts"
if src_billing.exists():
    dst_billing.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_billing, dst_billing)
    print("injected", dst_billing.relative_to(STAGE))
# Ensure server.ts updated
shutil.copy2(ROOT / "apps" / "api" / "src" / "server.ts", STAGE / "apps" / "api" / "src" / "server.ts")
print("synced server.ts")

# Ensure QvunaTray.exe staged - compile if needed from QvunaTray.cs
tray_cs = ROOT / "installer" / "QvunaTray.cs"
tray_out = pathlib.Path(r"C:\Temp\QvunaTray.exe")
refs = [
    r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll",
    r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll",
    r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll",
]
cmd = [str(CSC), "/nologo", "/target:winexe", f"/out:{tray_out}"]
for r in refs:
    if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
cmd.append(str(tray_cs))
print("CSC tray:", " ".join(cmd[:6]), "...")
res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
print(res.stdout[:800], res.stderr[:800], res.returncode)
if res.returncode != 0 or not tray_out.exists():
    print("CSC tray FAILED"); sys.exit(2)
print("tray built", tray_out.stat().st_size, digest(tray_out.read_bytes())[:16])
# copy into stage and also legacy name YwonTray.exe for compat
shutil.copy2(tray_out, STAGE / "QvunaTray.exe")
shutil.copy2(tray_out, STAGE / "YwonTray.exe")
print("staged tray", (STAGE/"QvunaTray.exe").stat().st_size)

# Fix Ywon.cmd in stage
(STAGE / "Ywon.cmd").write_text('@echo off\r\nif exist "%~dp0QvunaTray.exe" ( start "" "%~dp0QvunaTray.exe" & exit /b )\r\nstart "" "%~dp0START.cmd"\r\n', encoding="ascii")
print("Ywon.cmd fixed")

# 2) build zip
zip_path = OUTDIR / PAYLOAD_ZIP
rows=[]
for p in STAGE.rglob("*"):
    if p.is_file(): rows.append((p.relative_to(STAGE), p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for rel, full in rows:
        zf.write(full, str(rel).replace("\\","/"))
with zipfile.ZipFile(zip_path) as zf:
    assert zf.testzip() is None
print(f"zip {zip_path} n={len(rows)} size={zip_path.stat().st_size} sha={digest(zip_path.read_bytes())[:16]}")

# 3) compile uninstall + installer (YwonInstaller now points to QvunaTray.exe)
def compile_exe(cs_path, out_exe, resources):
    cmd = [str(CSC), "/nologo", "/target:winexe", f"/out:{out_exe}"]
    for r in [r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.FileSystem.dll"]:
        if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
    for p,n in resources: cmd.append(f"/resource:{p},{n}")
    cmd.append(str(cs_path))
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(res.stdout[:500], res.stderr[:500], res.returncode)
    if res.returncode != 0 or not pathlib.Path(out_exe).exists(): raise RuntimeError(f"csc fail {res.returncode}")
    return pathlib.Path(out_exe)

inst_cs = ROOT / "installer" / "QvunaInstaller.cs"
uninst_cs = ROOT / "installer" / "QvunaUninstaller.cs"
uninstall_exe = OUTDIR / "uninstall.exe"
compile_exe(uninst_cs, str(uninstall_exe), [])
print("uninstall", uninstall_exe.stat().st_size)
setup_exe = OUTDIR / EXE_NAME
compile_exe(inst_cs, str(setup_exe), [(str(zip_path),"payload.zip"),(str(uninstall_exe),"uninstall.exe")])
print("setup", setup_exe.stat().st_size, digest(setup_exe.read_bytes())[:16])
inner = digest(zip_path.read_bytes())
sha = digest(setup_exe.read_bytes())
(OUTDIR / (PAYLOAD_ZIP+".sha256")).write_text(f"{inner}  {PAYLOAD_ZIP}\n", encoding="ascii")
(OUTDIR / (EXE_NAME+".sha256")).write_text(f"{sha}  {EXE_NAME}\n", encoding="ascii")
# Also keep 0.0.7 files as compat names
shutil.copy2(zip_path, OUTDIR / "Ywon-Companion-0.0.7.zip")
shutil.copy2(setup_exe, OUTDIR / "Ywon-Companion-Setup-0.0.7.exe")
shutil.copy2(OUTDIR / (PAYLOAD_ZIP+".sha256"), OUTDIR / "Ywon-Companion-0.0.7.zip.sha256")
shutil.copy2(OUTDIR / (EXE_NAME+".sha256"), OUTDIR / "Ywon-Companion-Setup-0.0.7.exe.sha256")
mf = json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
mf["version"]=VERSION
mf["payloadZip"]=PAYLOAD_ZIP
mf["payloadZipSha256"]=inner
mf["payloadFiles"]=len(rows)
mf["installerExe"]=EXE_NAME
mf["installerSha256"]=sha
mf["installerSize"]=setup_exe.stat().st_size
mf["tray"]["size"]=(STAGE/"QvunaTray.exe").stat().st_size
mf["tray"]["sha256"]=digest((STAGE/"QvunaTray.exe").read_bytes())
mf["shortcuts"]=["Start Menu\\Ywon\\Ywon.lnk -> QvunaTray.exe","Desktop\\Ywon Companion.lnk -> QvunaTray.exe"]
(OUTDIR/"manifest.json").write_text(json.dumps(mf, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print(json.dumps(mf, ensure_ascii=False, indent=2))
print("BUILD 0.0.8 OK")
