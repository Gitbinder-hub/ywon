import pathlib, hashlib, json
cwd = pathlib.Path(".")
out61 = cwd / "outputs" / "companion-windows-webview-2026-10-06"
zip_path = out61 / "Ywon-Companion-0.0.8.zip"
setup = out61 / "Ywon-Companion-Setup-0.0.8.exe"
tray = out61 / "YwonTray.exe"
manifest={
    "mode":"unsigned_installer_pilot",
    "version":"0.0.8",
    "displayName":"Ywon Companion",
    "webview":"WebView2 embedded via reflection + WebBrowser fallback + external fallback",
    "portableRuntimeBase":"E:/Ywoom-ASR",
    "portablePathLength":23,
    "perRunCap":"USD 0.25-1.00 media / 2-5 Architect",
    "monthlyCap":"none",
    "sourcePayload":"payload_stage (0.0.7 + WebView2 + portable START/SETUP + local-asr-setup.json)",
    "payloadZip":"Ywon-Companion-0.0.8.zip",
    "payloadFiles":78,
    "payloadZipSha256":hashlib.sha256(zip_path.read_bytes()).hexdigest(),
    "installerExe":"Ywon-Companion-Setup-0.0.8.exe",
    "installerSha256":hashlib.sha256(setup.read_bytes()).hexdigest(),
    "installerSize":setup.stat().st_size,
    "tray":{"exe":"YwonTray.exe","size":tray.stat().st_size,"sha256":hashlib.sha256(tray.read_bytes()).hexdigest(),"features":["WebView2 reflection","WebBrowser fallback","external fallback","portable E:/Ywoom-ASR check","--help/--check WebView2","E:/Ywoom-ASR path <=120"]},
    "requiresAdmin": False,
    "paidCalls": 0,
    "cloudProviders":["Anthropic Opus 5.5","Gemini Live","Fal schnell"],
    "transition":"TR-05/TR-10: Process.Start(url) -> WebView2 window (reflection, no NuGet), per IMPLEMENTATION_TRANSITIONS.md; E:/Ywoom-ASR portable base"
}
(out61/"manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print("rewrote", manifest["perRunCap"])
print(json.loads((out61/"manifest.json").read_text(encoding="utf-8"))["perRunCap"])
# also fix sha files if needed
for name in ["Ywon-Companion-0.0.8.zip","Ywon-Companion-Setup-0.0.8.exe"]:
    p = out61 / (name+".sha256")
    h = hashlib.sha256((out61/name).read_bytes()).hexdigest()
    p.write_text(h+"  "+name+"\n", encoding="ascii")
    print(name, h[:16])
