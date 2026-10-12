import pathlib
p = pathlib.Path("outputs/companion-windows-webview-2026-10-06/manifest.json")
t = p.read_text(encoding="utf-8")
# The file is valid JSON except the perRunCap has escaped dollar incorrectly: "\\.25" should be "$0.25"
t2 = t.replace('"\\\\.25-1.00', '"$0.25-1.00')
t2 = t2.replace('/ \\\\-5', '/ $2-5')
# After this, the extra data error was because we rewrote with extra content? Actually current file is valid single JSON plus extra?
# Let's just rewrite cleanly
import json
try:
    obj = json.loads(t2)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("rewrote", obj["perRunCap"])
except Exception as e:
    print("fail", e)
    # dump raw first 2000 chars
    print(repr(t2[:2000]))
