import pathlib
cs=(pathlib.Path("installer/YwonTray.cs").read_text(encoding="utf-8",errors="replace"))
print("=== YwonTray.cs snippets ru ===")
for line in cs.splitlines():
    if "u04" in line.lower() or "Открыть" in line or "tray.Text" in line or "itemOpen" in line or "ShowBalloon" in line:
        print(repr(line))
print("--- contains \\u041e?", "\\u041e" in cs)
# also stage copy
cs2=(pathlib.Path("outputs/companion-windows-installer-2026-10-06/payload_stage/installer/YwonTray.cs").read_text(encoding="utf-8",errors="replace"))
print("stage same?", cs==cs2)
print("stage has \\u041e", "\\u041e" in cs2)
ah=(pathlib.Path("packages/companion/src/audio-host.ts").read_text(encoding="utf-8",errors="replace"))
print("\n=== audio-host header search ===")
for line in ah.splitlines():
    if "Ywon" in line.lower() or "asr-stream" in line.lower() or "X-Ywon" in line or "x-Ywon" in line:
        print(repr(line))
print("has X-Ywon", "X-Ywon" in ah)
print("has x-Ywon", "x-Ywon" in ah)
print("has X-Ywon-Sequence", "X-Ywon-Sequence" in ah or "x-Ywon-sequence" in ah.lower())
# also stage
ah2=(pathlib.Path("outputs/companion-windows-installer-2026-10-06/payload_stage/packages/companion/src/audio-host.ts").read_text(encoding="utf-8",errors="replace"))
print("stage audio-host same len", len(ah), len(ah2))
