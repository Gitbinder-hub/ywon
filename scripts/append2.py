import pathlib
a=pathlib.Path("scripts/store_src.txt")
b=pathlib.Path("scripts/store_src2.txt")
out=pathlib.Path("packages/editable-document/src/store.ts")
out.write_text(a.read_text(encoding="utf-8")+b.read_text(encoding="utf-8"),encoding="utf-8")
print(out.stat().st_size)
