import pathlib
a=pathlib.Path("scripts/ed_part1.txt").read_text(encoding="utf-8")
b=pathlib.Path("scripts/ed_part2.txt").read_text(encoding="utf-8")
pathlib.Path("tests/editable-document.test.ts").write_text(a+b,encoding="utf-8")
print(pathlib.Path("tests/editable-document.test.ts").stat().st_size)
