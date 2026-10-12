import pathlib, hashlib, json, zipfile, subprocess, shutil, sys
ROOT = pathlib.Path(".").resolve()
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-06"
STAGE = OUTDIR / "payload_stage"
CSC = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
def digest(b): return hashlib.sha256(b).hexdigest()

# Sync all changed files
sync_list = [
    "apps/web/public/index.html",
    "apps/web/public/studio.html",
    "apps/web/public/billing.html",
    "apps/web/public/journey.html",
    "apps/web/public/style.css",
    "apps/web/public/studio.css",
    "apps/web/public/shell.css",
    "apps/web/public/shell.js",
    "apps/web/public/billing.js",
    "apps/web/public/studio.js",
    "apps/api/src/server.ts",
    "apps/api/src/billing.ts",
    "FACTORY.cmd",
    "installer/QvunaTray.cs",
    "installer/QvunaInstaller.cs",
]
for rel in sync_list:
    src = ROOT / rel
    dst = STAGE / rel
    if src.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"synced {rel}")
    else:
        print(f"MISS {rel}")

# Generate simple Ywoom.ico — 32x32 PNG-like ICO via Python PIL-free: 32x32 blue gradient
# Use minimal ICO: BMP 32x32 32bpp
import struct
def make_ico(path, size=32):
    # Create 32x32 BGRA: dark bg + accent circle Y
    w,h=size,size
    pixels=[]
    for y in range(h):
        for x in range(w):
            # BG
            r,g,b=15,20,30
            a=255
            # Circle Y
            cx,cy=w//2,h//2
            dx,dy=x-cx,y-cy
            dist=(dx*dx+dy*dy)**0.5
            if dist<11:
                r2,g2,b2=142,216,190
                k=max(0,1-dist/11)
                r=int(r*(1-k)+r2*k); g=int(g*(1-k)+g2*k); b=int(b*(1-k)+b2*k)
                if abs(dx)<2 and dy>-2 and dy<8:
                    r,g,b=15,20,30
                if abs(dx+dy)<2 and dy<-2 and dy<2:
                    r,g,b=15,20,30
                if abs(dx-dy)<2 and dy<-2 and dy<2:
                    r,g,b=15,20,30
            pixels.extend([b,g,r,a])
    row=b''.join(bytes([b,g,r,a]) for a in [0] for b,g,r,a in [pixels[i:i+4] for i in range(0,len(pixels),4)])
    # Actually pixels already B,G,R,A flat
    flat=bytes(pixels)
    # ICO: header + dir + BMP header + pixels + AND mask
    bmp_header=struct.pack('<IiiHHIIiiII',40,w,h*2,1,32,0,len(flat),0,0,0,0)
    and_mask=b'\x00'*( (w+31)//32*4 * h )
    img_data=bmp_header+flat+and_mask
    ico_header=struct.pack('<HHH',0,1,1)
    ico_dir=struct.pack('<BBBBHHII',0 if w==256 else w,0 if h==256 else h,0,0,1,32,len(img_data),22)
    data=ico_header+ico_dir+img_data
    pathlib.Path(path).write_bytes(data)
    print(f"ico {len(data)} {path}")

ico_path=STAGE/"Ywoom.ico"
make_ico(str(ico_path),32)
# Also copy to root payload as Ywon.ico compat
shutil.copy2(ico_path, STAGE/"Ywon.ico")

# Compile tray x64
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

# Ensure packages completeness
for name in [d.name for d in (ROOT/"packages").iterdir() if d.is_dir()]:
    src=ROOT/f"packages/{name}"
    dst=STAGE/f"packages/{name}"
    if not dst.exists():
        shutil.copytree(src,dst)
        print(f"added package {name}")

# Ensure workers/apps
for src_rel in ["workers/media","apps/api","apps/web","apps/desktop-companion"]:
    src=ROOT/src_rel
    dst=STAGE/src_rel
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src,dst)
        # re-inject web files that we already synced (they may be overwritten)
for rel in ["apps/web/public/index.html","apps/web/public/studio.html","apps/web/public/billing.html","apps/web/public/journey.html","apps/web/public/style.css","apps/web/public/studio.css","apps/web/public/shell.css","apps/web/public/shell.js","apps/web/public/billing.js"]:
    src=ROOT/rel
    dst=STAGE/rel
    if src.exists():
        dst.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src,dst)

# Fix workers/workers nesting if present
dup=STAGE/"workers/workers"
if dup.exists():
    shutil.rmtree(dup)
dup2=STAGE/"workers/media/media"
if dup2.exists():
    shutil.rmtree(dup2)

VERSION="0.12"
PAYLOAD_ZIP=f"Ywon-Companion-0.12.zip"
EXE_NAME=f"Ywon-Companion-Setup-0.12.exe"
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
# compat
shutil.copy2(zip_path, OUTDIR/"Ywon-Companion-Setup-0.11.exe".replace("Setup-0.11.exe","0.11.zip"))
# Fix compat naming
for ver in ["0.11","0.10","0.09"]:
    try:
        shutil.copy2(zip_path, OUTDIR/f"Ywon-Companion-{ver}.zip")
        shutil.copy2(setup_exe, OUTDIR/f"Ywon-Companion-Setup-{ver}.exe")
        (OUTDIR/f"Ywon-Companion-{ver}.zip.sha256").write_text(f"{inner}  Ywon-Companion-{ver}.zip\n",encoding="ascii")
        (OUTDIR/f"Ywon-Companion-Setup-{ver}.exe.sha256").write_text(f"{sha}  Ywon-Companion-Setup-{ver}.exe\n",encoding="ascii")
    except: pass
mf=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
mf["version"]=VERSION
mf["payloadZip"]=PAYLOAD_ZIP
mf["payloadZipSha256"]=inner
mf["payloadFiles"]=len(rows)
mf["installerExe"]=EXE_NAME
mf["installerSha256"]=sha
mf["installerSize"]=setup_exe.stat().st_size
mf["tray"]={"exe":"QvunaTray.exe","size":pathlib.Path(STAGE/"QvunaTray.exe").stat().st_size,"sha256":digest(pathlib.Path(STAGE/"QvunaTray.exe").read_bytes())}
mf["displayName"]="Ywoom"
mf["notes"]=f"{VERSION}: unified shell (sidebar+shell.css/js) on all pages, dashboard grid, onboarding, billing cards, Ywoom.ico, single window, x64 tray"
(OUTDIR/"manifest.json").write_text(json.dumps(mf,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(mf,ensure_ascii=False,indent=2))
print(f"BUILD {VERSION} OK")
