import pathlib, hashlib, json, zipfile, subprocess, shutil, sys, struct
ROOT = pathlib.Path(".").resolve()
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
STAGE = OUTDIR / "payload_stage"
CSC = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
def digest(b): return hashlib.sha256(b).hexdigest()

sync_list = [
    "apps/web/public/index.html",
    "apps/web/public/studio.html",
    "apps/web/public/billing.html",
    "apps/web/public/journey.html",
    "apps/web/public/settings.html",
    "apps/web/public/style.css",
    "apps/web/public/studio.css",
    "apps/web/public/shell.css",
    "apps/web/public/shell.js",
    "apps/web/public/billing.js",
    "apps/web/public/studio.js",
    "apps/web/public/app.js",
    "apps/api/src/server.ts",
    "apps/api/src/billing.ts",
    "FACTORY.cmd",
    "installer/QvunaTray.cs",
    "installer/QvunaInstaller.cs",
]
for rel in sync_list:
    src = ROOT / rel
    dst = STAGE / rel
    if not src.exists():
        print(f"MISS {rel}")
        continue
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"synced {rel}")

# ico
if not (STAGE/"Ywoom.ico").exists() or (STAGE/"Ywoom.ico").stat().st_size < 1000:
    w=h=32; pixels=[]
    import math
    for y in range(h):
        for x in range(w):
            r,g,b=15,20,30;a=255
            cx,cy=w//2,h//2
            dist=math.hypot(x-cx,y-cy)
            if dist<11:
                r2,g2,b2=142,216,190
                k=max(0,1-dist/11)
                r=int(r*(1-k)+r2*k); g=int(g*(1-k)+g2*k); b=int(b*(1-k)+b2*k)
                if abs(x-cx)<2 and -2<y-cy<8: r,g,b=15,20,30
            pixels.extend([b,g,r,a])
    flat=bytes(pixels)
    bmp_header=struct.pack('<IiiHHIIiiII',40,w,h*2,1,32,0,len(flat),0,0,0,0)
    and_mask=b'\x00'*(((w+31)//32)*4*h)
    img_data=bmp_header+flat+and_mask
    ico_header=struct.pack('<HHH',0,1,1)
    ico_dir=struct.pack('<BBBBHHII',0 if w==256 else w,0 if h==256 else h,0,0,1,32,len(img_data),22)
    data=ico_header+ico_dir+img_data
    pathlib.Path(STAGE/"Ywoom.ico").write_bytes(data)
    print(f"ico {len(data)}")
    shutil.copy2(STAGE/"Ywoom.ico", STAGE/"Ywon.ico")

# Ensure packages completeness
for name in [d.name for d in (ROOT/"packages").iterdir() if d.is_dir()]:
    src=ROOT/f"packages/{name}"
    dst=STAGE/f"packages/{name}"
    if not dst.exists():
        shutil.copytree(src,dst)
        print(f"added package {name}")
if (STAGE/"workers/workers").exists(): shutil.rmtree(STAGE/"workers/workers")
if (STAGE/"workers/media/media").exists(): shutil.rmtree(STAGE/"workers/media/media")

# tray
tray_cs = ROOT / "installer/QvunaTray.cs"
tray_out = pathlib.Path(r"C:\Temp\QvunaTray.exe")
refs=[r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll", r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll"]
cmd=[str(CSC),"/nologo","/target:winexe","/platform:x64",f"/out:{tray_out}"]
for r in refs:
    if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
cmd.append(str(tray_cs))
print("CSC tray ...")
res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
print(res.stdout[:800],res.stderr[:800],res.returncode)
if res.returncode!=0 or not tray_out.exists():
    print("CSC FAIL"); sys.exit(2)
print(f"tray {tray_out.stat().st_size} {digest(tray_out.read_bytes())[:16]}")
shutil.copy2(tray_out, STAGE/"QvunaTray.exe")
shutil.copy2(tray_out, STAGE/"YwonTray.exe")
(STAGE/"Ywon.cmd").write_text('@echo off\r\nif exist "%~dp0QvunaTray.exe" ( start "" "%~dp0QvunaTray.exe" & exit /b )\r\nstart "" "%~dp0START.cmd"\r\n',encoding="ascii")

# Re-ensure web files after potential overwrite
for rel in ["apps/web/public/index.html","apps/web/public/studio.html","apps/web/public/billing.html","apps/web/public/journey.html","apps/web/public/settings.html","apps/web/public/shell.css","apps/web/public/shell.js","apps/web/public/studio.js","apps/web/public/app.js"]:
    src=ROOT/rel
    dst=STAGE/rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src,dst)

VERSION="0.15"
PAYLOAD_ZIP=f"Ywon-Companion-0.15.zip"
EXE_NAME=f"Ywon-Companion-Setup-0.15.exe"
zip_path=OUTDIR/PAYLOAD_ZIP
rows=[]
for p in STAGE.rglob("*"):
    if p.is_file(): rows.append((p.relative_to(STAGE),p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
    for rel,full in rows: zf.write(full,str(rel).replace("\\","/"))
with zipfile.ZipFile(zip_path) as zf: assert zf.testzip() is None
print(f"zip {zip_path} n={len(rows)} size={zip_path.stat().st_size}")

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
for ver in ["0.14","0.13","0.12"]:
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
mf["notes"]=f"{VERSION}: studio polish — ver bump, unified shell on all pages, dashboard grid, timeline, autostart, settings / Ctrl+S/N"
(OUTDIR/"manifest.json").write_text(json.dumps(mf,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(mf,ensure_ascii=False,indent=2))
print(f"BUILD {VERSION} OK")
