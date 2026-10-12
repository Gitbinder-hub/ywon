import pathlib
p = pathlib.Path("packages/companion/src/audio-host.ts")
t = p.read_text(encoding="utf-8")
print("len", len(t))
# split into chunks to display
for i in range(0, len(t), 4000):
    chunk = t[i:i+4000]
    print(f"---chunk {i}---")
    print(repr(chunk[:200]))
    open(f"chunk_{i}.txt","w",encoding="utf-8").write(chunk)
    print(chunk[:4000])
