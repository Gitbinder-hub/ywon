import pathlib
p=pathlib.Path("tests/editable-document.test.ts")
p.write_text(pathlib.Path("scripts/ed_test_src.txt").read_text(encoding="utf-8"),encoding="utf-8")
print(p.stat().st_size)
