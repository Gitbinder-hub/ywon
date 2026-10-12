import pathlib, hashlib, json, zipfile, subprocess, shutil, sys
ROOT = pathlib.Path(".").resolve()
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
STAGE = OUTDIR / "payload_stage"
CSC = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
def digest(b): return hashlib.sha256(b).hexdigest()

# sync web files (new design)
for rel in ["apps/web/public/index.html","apps/web/public/studio.html","apps/web/public/style.css","apps/web/public/studio.css","apps/web/public/billing.html","apps/web/public/billing.js","apps/api/src/server.ts","apps/api/src/billing.ts","FACTORY.cmd","installer/QvunaTray.cs"]:
    src = ROOT / rel
    if src.exists():
        dst = STAGE / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print("synced", rel)

# compile tray
tray_cs = ROOT / "installer" / "QvunaTray.cs"
tray_out = pathlib.Path(r"C:\Temp\QvunaTray.exe")
refs=[r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll"]
cmd=[str(CSC),"/nologo","/target:winexe",f"/out:{tray_out}"]
for r in refs:
    if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
cmd.append(str(tray_cs))
print("CSC tray ...")
res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
print(res.stdout[:800],res.stderr[:800],res.returncode)
if res.returncode!=0 or not tray_out.exists(): print("CSC FAIL"); sys.exit(2)
print("tray",tray_out.stat().st_size, digest(tray_out.read_bytes())[:16])
shutil.copy2(tray_out, STAGE/"QvunaTray.exe")
shutil.copy2(tray_out, STAGE/"YwonTray.exe")

# ensure WebView2 DLLs stay in stage (already there from 0.0.9)
for dll in ["Microsoft.Web.WebView2.Core.dll","Microsoft.Web.WebView2.WinForms.dll","Microsoft.Web.WebView2.Wpf.dll","WebView2Loader.dll"]:
    p = STAGE / dll
    print(dll, "OK" if p.exists() else "MISS", p.stat().st_size if p.exists() else "")

(STAGE/"Ywon.cmd").write_text('@echo off\r\nif exist "%~dp0QvunaTray.exe" ( start "" "%~dp0QvunaTray.exe" & exit /b )\r\nstart "" "%~dp0START.cmd"\r\n',encoding="ascii")

VERSION="0.0.10"
PAYLOAD_ZIP=f"Ywon-Companion-0.0.10.zip"
EXE_NAME=f"Ywon-Companion-Setup-0.0.10.exe"
zip_path=OUTDIR/PAYLOAD_ZIP
rows=[]
for p in STAGE.rglob("*"):
    if p.is_file(): rows.append((p.relative_to(STAGE),p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
    for rel,full in rows: zf.write(full,str(rel).replace("\\","/"))
with zipfile.ZipFile(zip_path) as zf: assert zf.testzip() is None
print(f"zip {zip_path} n={len(rows)} size={zip_path.stat().st_size} sha={digest(zip_path.read_bytes())[:16]}")

def compile_exe(cs_path,out_exe,resources):
    cmd=[str(CSC),"/nologo","/target:winexe",f"/out:{out_exe}"]
    for r in [r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.FileSystem.dll"]:
        if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
    for p,n in resources: cmd.append(f"/resource:{p},{n}")
    cmd.append(str(cs_path))
    res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
    print(res.stdout[:400],res.stderr[:400],res.returncode)
    if res.returncode!=0 or not pathlib.Path(out_exe).exists(): raise RuntimeError("csc fail")
    return pathlib.Path(out_exe)

inst_cs=ROOT/"installer"/"QvunaInstaller.cs"
uninst_cs=ROOT/"installer"/"QvunaUninstaller.cs"
uninstall_exe=OUTDIR/"uninstall.exe"
compile_exe(uninst_cs,str(uninstall_exe),[])
print("uninstall",uninstall_exe.stat().st_size)
setup_exe=OUTDIR/EXE_NAME
compile_exe(inst_cs,str(setup_exe),[(str(zip_path),"payload.zip"),(str(uninstall_exe),"uninstall.exe")])
print("setup",setup_exe.stat().st_size, digest(setup_exe.read_bytes())[:16])
inner=digest(zip_path.read_bytes())
sha=digest(setup_exe.read_bytes())
(OUTDIR/(PAYLOAD_ZIP+".sha256")).write_text(f"{inner}  {PAYLOAD_ZIP}\n",encoding="ascii")
(OUTDIR/(EXE_NAME+".sha256")).write_text(f"{sha}  {EXE_NAME}\n",encoding="ascii")
# compat copies for 0.0.7/0.0.8/0.0.9
for ver in ["0.0.7","0.0.8","0.0.9"]:
    shutil.copy2(zip_path, OUTDIR/f"Ywon-Companion-{ver}.zip")
    shutil.copy2(setup_exe, OUTDIR/f"Ywon-Companion-Setup-{ver}.exe")
    (OUTDIR/f"Ywon-Companion-{ver}.zip.sha256").write_text(f"{inner}  Ywon-Companion-{ver}.zip\n",encoding="ascii")
    (OUTDIR/f"Ywon-Companion-{ver}.exe.sha256").write_text(f"{sha}  Ywon-Companion-Setup-{ver}.exe\n",encoding="ascii")
mf=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
mf["version"]=VERSION
mf["payloadZip"]=PAYLOAD_ZIP
mf["payloadZipSha256"]=inner
mf["payloadFiles"]=len(rows)
mf["installerExe"]=EXE_NAME
mf["installerSha256"]=sha
mf["installerSize"]=setup_exe.stat().st_size
mf["tray"]["size"]=(STAGE/"QvunaTray.exe").stat().st_size
mf["tray"]["sha256"]=digest((STAGE/"QvunaTray.exe").read_bytes())
mf["factory"]={"launcher":"FACTORY.cmd","port":3000,"url":"http://127.0.0.1:3000"}
mf["notes"]="0.0.10: WebView2 bundled (WinForms+bundled DLLs), factory window default (no browser fallback), redesigned Factory/Studio, single-window+mutex, no 100 icons"
(OUTDIR/"manifest.json").write_text(json.dumps(mf,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(mf,ensure_ascii=False,indent=2))
print("BUILD 0.0.10 OK")
