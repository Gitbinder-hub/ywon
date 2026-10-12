import pathlib, hashlib
p = pathlib.Path("packages/companion/src/asr-stream-process.ts")
parts=[]
parts.append(pathlib.Path("add_stream_partA.txt").read_text(encoding="utf-8")[:3000])
print(len(parts[0]))
