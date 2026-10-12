import pathlib, hashlib, json, zipfile, shutil, subprocess
cwd = pathlib.Path(".")
stage = cwd / "outputs" / "companion-windows-installer-2026-10-06" / "payload_stage"
# update stage with portable templates and fresh tray
shutil.copy2("scripts/START_portable.cmd", stage / "START.cmd")
shutil.copy2("scripts/SETUP-ASR_portable.cmd", stage / "SETUP-ASR.cmd")
shutil.copy2("installer/YwonTray.cs", stage / "installer" / "YwonTray.cs")
shutil.copy2(pathlib.Path("C:/Temp/YwonTray_new2.exe"), stage / "YwonTray.exe")
if pathlib.Path("local-asr-setup.json").exists():
    shutil.copy2("local-asr-setup.json", stage / "local-asr-setup.json")
print("stage updated", len(list(stage.rglob("*"))))
out61 = cwd / "outputs" / "companion-windows-webview-2026-10-06"
out61.mkdir(parents=True, exist_ok=True)
rows=[]
for p in stage.rglob("*"):
    if p.is_file():
        rows.append((p.relative_to(stage), p))
rows.sort(key=lambda x: str(x[0]).replace("\\","/"))
zip_path = out61 / "Ywon-Companion-0.0.8.zip"
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
    for rel, full in rows:
        zf.write(full, str(rel).replace("\\","/"))
    zf.writestr("Ywon.cmd", b'@echo off\r\nstart "" "%~dp0START.cmd"\r\n')
    zf.writestr("installer-version.txt", b"0.0.8\nYwon Companion\nWebView2 pilot\n")
print("zip", zip_path, zip_path.stat().st_size, hashlib.sha256(zip_path.read_bytes()).hexdigest()[:16])
# copy uninstall via previous outputs
prev_uninstall = cwd / "outputs" / "companion-windows-installer-2026-10-06" / "uninstall.exe"
if prev_uninstall.exists():
    shutil.copy2(prev_uninstall, out61 / "uninstall.exe")
    print("uninstall", (out61/"uninstall.exe").stat().st_size)
# build setup exe via csc (embed zip)
csc = pathlib.Path("C:/Windows/Microsoft.NET/Framework/v4.0.30319/csc.exe")
# prepare temp copies without unicode path issues
import tempfile, os
tmp = pathlib.Path("C:/Temp/webview_build")
tmp.mkdir(exist_ok=True)
shutil.copy2(cwd / "installer" / "YwonInstaller.cs", tmp / "YwonInstaller.cs")
shutil.copy2(cwd / "installer" / "YwonUninstaller.cs", tmp / "YwonUninstaller.cs")
shutil.copy2(zip_path, tmp / "payload.zip")
shutil.copy2(out61 / "uninstall.exe", tmp / "uninstall.exe")
out_exe = out61 / "Ywon-Companion-Setup-0.0.8.exe"
# compile uninstall first
res = subprocess.run([str(csc), "/nologo", "/target:winexe", "/out:"+str(tmp / "uninstall.exe"), str(tmp / "YwonUninstaller.cs")], capture_output=True, text=True, cwd=str(tmp))
print("uninstall compile rc", res.returncode, res.stderr[:1000])
if res.returncode!=0:
    print(res.stdout[:2000])
# compile setup with resources
res2 = subprocess.run([str(csc), "/nologo", "/target:winexe", "/out:"+str(out_exe), "/resource:"+str(tmp/"payload.zip")+","+"payload.zip", "/resource:"+str(tmp/"uninstall.exe")+","+"uninstall.exe", str(tmp/"YwonInstaller.cs")], capture_output=True, text=True, cwd=str(tmp))
print("setup compile rc", res2.returncode, res2.stderr[:2000])
print(res2.stdout[:2000])
if out_exe.exists():
    print("setup", out_exe.stat().st_size, hashlib.sha256(out_exe.read_bytes()).hexdigest()[:16])
    # also copy tray exe standalone
    shutil.copy2(stage / "YwonTray.exe", out61 / "YwonTray.exe")
    print("tray", (out61/"YwonTray.exe").stat().st_size, hashlib.sha256((out61/"YwonTray.exe").read_bytes()).hexdigest()[:16])
    manifest = {
        "mode":"unsigned_installer_pilot",
        "version":"0.0.8",
        "displayName":"Ywon Companion",
        "webview":"WebView2 embedded via reflection + WebBrowser fallback + external fallback",
        "portableRuntimeBase":"E:/Ywoom-ASR",
        "portablePathLength": len("E:/Ywoom-ASR/r-12345678"),
        "perRunCap": "$0.25-1.00 media / $2-5 Architect",
        "monthlyCap": "none",
        "sourcePayload":"payload_stage (from 0.0.7 + WebView2)",
        "payloadZip":"Ywon-Companion-0.0.8.zip",
        "payloadFiles": len(rows),
        "payloadZipSha256": hashlib.sha256(zip_path.read_bytes()).hexdigest(),
        "installerExe":"Ywon-Companion-Setup-0.0.8.exe",
        "installerSha256": hashlib.sha256(out_exe.read_bytes()).hexdigest(),
        "installerSize": out_exe.stat().st_size,
        "tray": {"exe":"YwonTray.exe","size": (out61/"YwonTray.exe").stat().st_size, "sha256": hashlib.sha256((out61/"YwonTray.exe").read_bytes()).hexdigest(), "features":["WebView2 reflection","WebBrowser fallback","external fallback","portable E:/Ywoom-ASR check","--help/--check"]},
        "requiresAdmin": False,
        "paidCalls": 0,
        "cloudProviders": ["Anthropic Opus 5.5","Gemini Live","Fal schnell"],
        "transition":"TR-05/TR-10: Process.Start -> WebView2 window, per TR-06 portable E:/Ywoom-ASR"
    }
    (out61/"manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    (out61/"Ywon-Companion-0.0.8.zip.sha256").write_text(hashlib.sha256(zip_path.read_bytes()).hexdigest()+"  Ywon-Companion-0.0.8.zip\n")
    (out61/"Ywon-Companion-Setup-0.0.8.exe.sha256").write_text(hashlib.sha256(out_exe.read_bytes()).hexdigest()+"  Ywon-Companion-Setup-0.0.8.exe\n")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
