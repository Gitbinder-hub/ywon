"""Build unsigned Windows EXE installer for Ywon 0.0.6. Per-user, no admin."""
from pathlib import Path
import hashlib, json, zipfile, subprocess, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
SRC05 = ROOT / "outputs" / "companion-windows-path-fix-2026-10-05" / "Ywon-Companion"
SRC04 = ROOT / "outputs" / "companion-windows-asr-2026-10-05" / "Ywon-Companion"
SOURCE = SRC05 if SRC05.exists() else SRC04
OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-05"
INSTALLER_DIR = ROOT / "installer"
PAYLOAD_ZIP_NAME = "Ywon-Companion-0.0.6.zip"
EXE_NAME = "Ywon-Companion-Setup-0.0.6.exe"
VERSION = "0.0.6"
CSC = Path(r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe")

def digest(b): return hashlib.sha256(b).hexdigest()

def ensure_payload_zip():
    if not SOURCE.exists(): raise FileNotFoundError(str(SOURCE))
    OUTDIR.mkdir(parents=True, exist_ok=True)
    payload_dir = OUTDIR / "payload"
    payload_dir.mkdir(exist_ok=True)
    zip_path = payload_dir / PAYLOAD_ZIP_NAME
    rows=[]
    for p in SOURCE.rglob("*"):
        if p.is_file():
            rows.append((p.relative_to(SOURCE), p))
    rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
    with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
        for rel, full in rows:
            zf.write(full, str(rel).replace("\\","/"))
        zf.writestr("Ywon.cmd", b'@echo off\r\nstart "" "%~dp0START.cmd"\r\n')
        zf.writestr("installer-version.txt", f"{VERSION}\nYwon Companion\nunsigned pilot\n".encode())
    with zipfile.ZipFile(zip_path) as zf:
        if zf.testzip() is not None: raise ValueError("crc")
    return zip_path, len(rows)


def compile_exe(cs_path, out_exe, resources, is_winexe=True):
    if not CSC.exists(): raise FileNotFoundError(str(CSC))
    refs=[
        r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Windows.Forms.dll",
        r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.Drawing.dll",
        r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.dll",
        r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.dll",
        r"C:\Windows\Microsoft.NET\Framework\v4.0.30319\System.IO.Compression.FileSystem.dll",
    ]
    cmd=[str(CSC),"/nologo",f"/target:{'winexe' if is_winexe else 'exe'}",f"/out:{out_exe}"]
    for r in refs:
        if Path(r).exists(): cmd.append(f"/reference:{r}")
    for p,name in resources:
        cmd.append(f"/resource:{p},{name}")
    cmd.append(str(cs_path))
    print("CSC:", " ".join(cmd))
    res=subprocess.run(cmd,capture_output=True,text=True)
    print(res.stdout); print(res.stderr,file=sys.stderr)
    if res.returncode!=0 or not out_exe.exists(): raise RuntimeError(f"csc fail {res.returncode}")
    return out_exe

def main():
    import sys as _sys
    force = "--force" in _sys.argv
    if (OUTDIR/EXE_NAME).exists() and not force:
        print("Refusing to overwrite", OUTDIR/EXE_NAME, "use --force to rebuild"); sys.exit(1)
    INSTALLER_DIR.mkdir(parents=True, exist_ok=True)
    zip_path, n = ensure_payload_zip()
    print(f"payload {zip_path} n={n} size={zip_path.stat().st_size}")
    inst_cs = INSTALLER_DIR/"YwonInstaller.cs"
    uninst_cs = INSTALLER_DIR/"YwonUninstaller.cs"
    if not inst_cs.exists() or not uninst_cs.exists(): raise FileNotFoundError("installer cs missing")
    uninstall_exe = OUTDIR/"uninstall.exe"
    compile_exe(uninst_cs, uninstall_exe, [], True)
    print(f"uninstall {uninstall_exe} {uninstall_exe.stat().st_size}")
    setup_exe = OUTDIR/EXE_NAME
    compile_exe(inst_cs, setup_exe, [(str(zip_path),"payload.zip"),(str(uninstall_exe),"uninstall.exe")], True)
    print(f"setup {setup_exe} {setup_exe.stat().st_size}")
    sha=digest(setup_exe.read_bytes())
    (OUTDIR/(EXE_NAME+".sha256")).write_text(f"{sha}  {EXE_NAME}\n",encoding="ascii")
    inner=digest(zip_path.read_bytes())
    (OUTDIR/(PAYLOAD_ZIP_NAME+".sha256")).write_text(f"{inner}  {PAYLOAD_ZIP_NAME}\n",encoding="ascii")
    manifest={"mode":"unsigned_installer_pilot","version":VERSION,"displayName":"Ywon Companion","desktopShortcutDefault":True,"autostartDefault":False,"productionReady":False,"windowsCertification":False,"asrBundled":False,"cloudProviderCalls":0,"sourcePayload":str(SOURCE.relative_to(ROOT)),"payloadZip":PAYLOAD_ZIP_NAME,"payloadFiles":n,"payloadZipSha256":inner,"installerExe":EXE_NAME,"installerSha256":sha,"installerSize":setup_exe.stat().st_size,"perUserInstallDir":"%LOCALAPPDATA%\\Ywon\\Ywon Companion","shortcuts":["Start Menu\\Ywon\\Ywon.lnk","Desktop\\Ywon Companion.lnk (on by default)"],"uninstallKey":"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YwonCompanion","autostartKey":"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\YwonCompanion","requiresAdmin":False,"smartScreenWarning":"expected for unsigned pilot"}
    (OUTDIR/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    shutil.copy2(zip_path, OUTDIR/PAYLOAD_ZIP_NAME)
    print(json.dumps(manifest,ensure_ascii=False,indent=2))
    print("BUILD OK:", setup_exe)
if __name__=="__main__": main()
