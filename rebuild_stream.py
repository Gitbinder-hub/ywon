import pathlib, hashlib
p = pathlib.Path("packages/companion/src/asr-stream-process.ts")
size = p.stat().st_size if p.exists() else 0
print("before", size)
if size != 10194:
    # reconstruct from parts
    part1 = pathlib.Path("packages/companion/src/asr-stream-process.ts").read_text(encoding="utf-8") if size==1876 else None
    # if size !=1876 we need to recreate part1 from writer_stream1 source
    if part1 is None or size not in (1876,10194):
        # generate part1 directly
        part1_text = """\"\"\"dummy\"\"\""""
        # read from writer file to get original
        import ast
        # instead just re-create part1 by reading writer_stream1.py
        w = pathlib.Path("writer_stream1.py").read_text(encoding="utf-8")
        # extract string between p.write_text(\"\"\" and \"\"\", encoding
        import re
        m = re.search(r'p\.write_text\(\"\"\"(.*)\"\"\", encoding', w, re.S)
        if m:
            part1_text = m.group(1)
        else:
            part1_text = pathlib.Path("packages/companion/src/asr-stream-process.ts").read_text(encoding="utf-8") if size==1876 else ""
        if size==10194:
            print("already ok")
        else:
            # write full from concatenated files
            a = pathlib.Path("add_stream_partA.txt").read_text(encoding="utf-8")
            b = pathlib.Path("add_stream_partB.txt").read_text(encoding="utf-8")
            # part1_text is actual part1
            if len(part1_text) < 100:
                # fallback: use current file as part1 if it is 1876
                part1_text = pathlib.Path("packages/companion/src/asr-stream-process.ts").read_text(encoding="utf-8")
                if len(part1_text) > 5000:
                    part1_text = part1_text[:1876]
            full = part1_text + a + b
            # need to ensure part1 is correct 1876
            cur1876 = pathlib.Path("packages/companion/src/asr-stream-process.ts").read_text(encoding="utf-8") if pathlib.Path("packages/companion/src/asr-stream-process.ts").exists() and pathlib.Path("packages/companion/src/asr-stream-process.ts").stat().st_size==1876 else None
            if cur1876:
                full = cur1876 + a + b
            else:
                # try to reconstruct part1 from scratch using known header
                header = pathlib.Path("add_stream_partA.txt").read_text(encoding="utf-8")[:10]
                full = part1_text + a + b
            pathlib.Path("packages/companion/src/asr-stream-process.ts").write_text(full, encoding="utf-8")
            print("rebuilt", pathlib.Path("packages/companion/src/asr-stream-process.ts").stat().st_size)
    else:
        # size 1876 -> append
        a = pathlib.Path("add_stream_partA.txt").read_text(encoding="utf-8")
        b = pathlib.Path("add_stream_partB.txt").read_text(encoding="utf-8")
        cur = pathlib.Path("packages/companion/src/asr-stream-process.ts").read_text(encoding="utf-8")
        pathlib.Path("packages/companion/src/asr-stream-process.ts").write_text(cur + a + b, encoding="utf-8")
        print("appended", pathlib.Path("packages/companion/src/asr-stream-process.ts").stat().st_size)
else:
    print("already 10194 ok")
print("after", pathlib.Path("packages/companion/src/asr-stream-process.ts").stat().st_size, hashlib.sha256(pathlib.Path("packages/companion/src/asr-stream-process.ts").read_bytes()).hexdigest()[:16])
