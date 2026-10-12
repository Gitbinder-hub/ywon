import pathlib, subprocess, hashlib, shutil, os, time
ROOT=pathlib.Path(".").resolve()
out_tmp=pathlib.Path(r"C:\Temp\YwonTray.exe")
stage=ROOT/"outputs/companion-windows-installer-2026-10-06/payload_stage/YwonTray.exe"
# kill any running YwonTray blocking file
try:
    subprocess.run(["taskkill","/F","/IM","YwonTray.exe"],capture_output=True)
except: pass
time.sleep(0.5)
# retry copy with retries
for i in range(5):
    try:
        shutil.copy2(out_tmp, stage)
        print("copied",stage.stat().st_size, hashlib.sha256(stage.read_bytes()).hexdigest())
        break
    except PermissionError as e:
        print("retry",i,e)
        time.sleep(0.5)
        try: os.remove(stage) 
        except: pass
        try: shutil.copy2(out_tmp, stage)
        except Exception as e2: print("second",e2)
        else: break

# also rebuild zip+setup quickly
import zipfile, json
OUTDIR=ROOT/"outputs/companion-windows-installer-2026-10-06"
zip_path=OUTDIR/"Ywon-Companion-0.0.7.zip"
rows=[]
for p in (OUTDIR/"payload_stage").rglob("*"):
    if p.is_file(): rows.append((p.relative_to(OUTDIR/"payload_stage"),p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
    for rel,full in rows: zf.write(full, str(rel).replace("\\","/"))
    zf.writestr("Ywon.cmd", b'@echo off\r\nstart "" "%~dp0START.cmd"\r\n')
    zf.writestr("installer-version.txt", b"0.0.7\nYwon Companion\nunsigned pilot\nLARGE B-060\n")
print("zip",zip_path.stat().st_size, hashlib.sha256(zip_path.read_bytes()).hexdigest()[:16])
CSC=pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
inst_cs=ROOT/"installer/YwonInstaller.cs"
uninst_cs=ROOT/"installer/YwonUninstaller.cs"
def comp(cs_path,out_exe,resources):
    refs=[r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.FileSystem.dll"]
    cmd=[str(CSC),"/nologo","/target:winexe",f"/out:{out_exe}"]
    for r in refs:
        if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
    for p,n in resources: cmd.append(f"/resource:{p},{n}")
    cmd.append(str(cs_path))
    res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
    print(res.stdout[:500],res.stderr[:500],res.returncode)
    return pathlib.Path(out_exe)
uninstall_exe=OUTDIR/"uninstall.exe"
comp(uninst_cs,str(uninstall_exe),[])
print("uninstall",uninstall_exe.stat().st_size)
setup_exe=OUTDIR/"Ywon-Companion-Setup-0.0.7.exe"
comp(inst_cs,str(setup_exe),[(str(zip_path),"payload.zip"),(str(uninstall_exe),"uninstall.exe")])
print("setup",setup_exe.stat().st_size, hashlib.sha256(setup_exe.read_bytes()).hexdigest())
# manifest update
inner=hashlib.sha256(zip_path.read_bytes()).hexdigest()
sha=hashlib.sha256(setup_exe.read_bytes()).hexdigest()
(OUTDIR/"Ywon-Companion-Setup-0.0.7.exe.sha256").write_text(f"{sha}  Ywon-Companion-Setup-0.0.7.exe\n",encoding="ascii")
(OUTDIR/"Ywon-Companion-0.0.7.zip.sha256").write_text(f"{inner}  Ywon-Companion-0.0.7.zip\n",encoding="ascii")
mf=json.loads((OUTDIR/"manifest.json").read_text(encoding="utf-8"))
mf["payloadZipSha256"]=inner
mf["installerSha256"]=sha
mf["installerSize"]=setup_exe.stat().st_size
mf["payloadZip"]=zip_path.name
mf["tray"]["size"]=stage.stat().st_size
mf["tray"]["sha256"]=hashlib.sha256(stage.read_bytes()).hexdigest()
(OUTDIR/"manifest.json").write_text(json.dumps(mf,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(mf,ensure_ascii=False,indent=2))
