import pathlib, hashlib, json
cwd = pathlib.Path(".")
out61 = cwd / "outputs" / "companion-windows-webview-2026-10-06"
manifest = json.loads((out61/"manifest.json").read_text(encoding="utf-8"))
# fix perRunCap double escaping artifact
manifest["perRunCap"] = "$0.25-1.00 media / $2-5 Architect"
# ensure other fields correct
manifest["monthlyCap"] = "none"
(out61/"manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print("fixed", manifest["perRunCap"])
print((out61/"manifest.json").read_text(encoding="utf-8")[:600])
