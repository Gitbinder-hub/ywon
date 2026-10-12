import pathlib
out=pathlib.Path("packages/editable-document/src/store.ts")
cur=out.read_text(encoding="utf-8")
if cur.endswith("\n}\n"): cur=cur[:-2]
tail=open(pathlib.Path("scripts/tail.txt"),encoding="utf-8").read()
out.write_text(cur+"\n"+tail,encoding="utf-8")
print(out.stat().st_size)
