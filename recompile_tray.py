import pathlib, subprocess, hashlib, shutil
ROOT=pathlib.Path(".").resolve()
CSC=pathlib.Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")
cs=ROOT/"installer/YwonTray.cs"
out_tmp=pathlib.Path(r"C:\Temp\YwonTray.exe")
stage=ROOT/"outputs/companion-windows-installer-2026-10-06/payload_stage/YwonTray.exe"
refs=[r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll",r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll"]
cmd=[str(CSC),"/nologo","/target:winexe",f"/out:{out_tmp}"]
for r in refs:
    if pathlib.Path(r).exists(): cmd.append(f"/reference:{r}")
cmd.append(str(cs))
print(" ".join(cmd))
res=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace")
print("STDOUT",res.stdout[:1000])
print("STDERR",res.stderr[:1000])
print("RC",res.returncode)
if out_tmp.exists():
    h=hashlib.sha256(out_tmp.read_bytes()).hexdigest()
    print("tmp",out_tmp.stat().st_size,h)
    shutil.copy2(out_tmp, stage)
    print("copied to stage",stage.stat().st_size, hashlib.sha256(stage.read_bytes()).hexdigest()[:16])
    # also need to ensure root YwonTray.exe copy? Check original location
    root_tray=ROOT/"YwonTray.exe"
    if root_tray.exists():
        print("rootTray exists",root_tray.stat().st_size)
    # also copy to root outputs payload_stage? already
