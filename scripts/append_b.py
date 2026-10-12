import pathlib
out=pathlib.Path("packages/editable-document/src/store.ts")
p2=open(pathlib.Path("scripts/tail2a.txt"),encoding="utf-8").read()
p3=open(pathlib.Path("scripts/tail2b.txt"),encoding="utf-8").read()
p4=open(pathlib.Path("scripts/tail2c.txt"),encoding="utf-8").read()
# need to insert before final "}"
cur=out.read_text(encoding="utf-8")
# cur ends with "}\n" from tail.txt block; replace last "}\n" with p2+p3+p4
# tail.txt already added createDocument/getDocument and left with "}\n" - so cur has class not closed? Actually cur has ... getDocument then "}\n"
# We appended tail.txt which ends with not closing class? tail.txt has no class close - ends with getDocument
# So we need to append p2+p3+p4 to close class
cur=cur.rstrip()
if cur.endswith("}"):
    cur=cur[:-1]
out.write_text(cur+"\n"+p2+"\n"+p3+"\n"+p4, encoding="utf-8")
print(out.stat().st_size)
