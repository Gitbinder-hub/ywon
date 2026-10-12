import pathlib
p = pathlib.Path("packages/editable-document/src/store.ts")
p.write_text(pathlib.Path("scripts/store_src.txt").read_text(encoding="utf-8"), encoding="utf-8")
print("done", p.stat().st_size)
