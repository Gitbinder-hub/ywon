import pathlib, hashlib, json, zipfile, subprocess, shutil, sys, struct
ROOT = pathlib.Path(r"E:\Загрузки Браузера\Qwoom-bootstrap-spec-v04-foundation (3)\Qwoom-bootstrap-spec-v04-foundation")
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
STAGE = OUTDIR / "payload_stage"
CSC = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
def digest(b): return hashlib.sha256(b).hexdigest()

VERSION="0.16"
# Tray already built, ensure copied
tray_out = pathlib.Path(r"C:\Temp\QvunaTray.exe")
if tray_out.exists():
    shutil.copy2(tray_out, STAGE/"QvunaTray.exe")
    shutil.copy2(tray_out, STAGE/"YwonTray.exe")
    (STAGE/"Ywon.cmd").write_text('@echo off\r\nif exist "%~dp0QvunaTray.exe" ( start "" "%~dp0QvunaTray.exe" & exit /b )\r\nstart "" "%~dp0START.cmd"\r\n',encoding="ascii")

PAYLOAD_ZIP=f"Ywon-Companion-0.16.zip"
EXE_NAME=f"Ywon-Companion-Setup-0.16.exe"
zip_path=OUTDIR/PAYLOAD_ZIP
rows=[]
for p in STAGE.rglob("*"):
    if p.is_file(): rows.append((p.relative_to(STAGE),p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
    for rel,full in rows: zf.write(full,str(rel).replace("\\","/"))
with zipfile.ZipFile(zip_path) as zf: assert zf.testzip() is None
# Use ascii safe prints
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
print(f"zip {PAYLOAD_ZIP} n={len(rows)} size={zip_path.stat().st_size}")

def compile_exe(cs_path,out_exe,resources):
    cmd=[str(CSC),"/nologo","/target:winexe",f"/out:{out_exe}"]
    for r in [r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.FileSystem.dll"]:
        if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
    for p,n in resources: cmd.append(f"/resource:{p},{n}")
    cmd.append(str(cs_path))
    res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
    if res.stdout.strip(): print(res.stdout[:400])
    if res.stderr.strip(): print(res.stderr[:400],file=sys.stderr)
    print(f"csc {pathlib.Path(out_exe).name} -> {res.returncode}")
    if res.returncode!=0 or not pathlib.Path(out_exe).exists(): raise RuntimeError(f"csc fail {res.returncode}")
    return pathlib.Path(out_exe)

inst_cs=ROOT/"installer/QvunaInstaller.cs"
uninst_cs=ROOT/"installer/QvunaUninstaller.cs"
uninstall_exe=OUTDIR/"uninstall.exe"
compile_exe(uninst_cs,str(uninstall_exe),[])
print(f"uninstall {uninstall_exe.stat().st_size}")
setup_exe=OUTDIR/EXE_NAME
compile_exe(inst_cs,str(setup_exe),[(str(zip_path),"payload.zip"),(str(uninstall_exe),"uninstall.exe")])
print(f"setup {setup_exe.stat().st_size} {digest(setup_exe.read_bytes())[:16]}")
inner=digest(zip_path.read_bytes())
sha=digest(setup_exe.read_bytes())
(OUTDIR/(PAYLOAD_ZIP+".sha256")).write_text(f"{inner}  {PAYLOAD_ZIP}\n",encoding="ascii")
(OUTDIR/(EXE_NAME+".sha256")).write_text(f"{sha}  {EXE_NAME}\n",encoding="ascii")
for ver in ["0.15","0.14","0.13","0.12"]:
    shutil.copy2(zip_path, OUTDIR/f"Ywon-Companion-{ver}.zip")
    shutil.copy2(setup_exe, OUTDIR/f"Ywon-Companion-Setup-{ver}.exe")
    (OUTDIR/f"Ywon-Companion-{ver}.zip.sha256").write_text(f"{inner}  Ywon-Companion-{ver}.zip\n",encoding="ascii")
    (OUTDIR/f"Ywon-Companion-Setup-{ver}.exe.sha256").write_text(f"{sha}  Ywon-Companion-Setup-{ver}.exe\n",encoding="ascii")
mf=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
mf["version"]=VERSION
mf["payloadZip"]=PAYLOAD_ZIP
mf["payloadZipSha256"]=inner
mf["payloadFiles"]=len(rows)
mf["installerExe"]=EXE_NAME
mf["installerSha256"]=sha
mf["installerSize"]=setup_exe.stat().st_size
mf["displayName"]="Ywoom"
try:
    mf["tray"]={"exe":"QvunaTray.exe","size":pathlib.Path(STAGE/"QvunaTray.exe").stat().st_size,"sha256":digest(pathlib.Path(STAGE/"QvunaTray.exe").read_bytes())}
except: pass
mf["notes"]=f"{VERSION}: studio onboarding + billing limits Free3/Pro100 + updates check"
(OUTDIR/"manifest.json").write_text(json.dumps(mf,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(mf,ensure_ascii=False,indent=2))
print(f"BUILD {VERSION} OK")
