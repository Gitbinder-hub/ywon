import pathlib, os, re, json, sys
p = pathlib.Path(".env")
txt = p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""
lines = txt.splitlines()
keys = {}
for line in lines:
    s=line.strip()
    if not s or s.startswith("#"):
        continue
    if "=" not in s:
        continue
    k,v = s.split("=",1)
    k=k.strip()
    v=v.strip().strip('"').strip("'").strip()
    # remove inline comment? not needed
    keys[k]=v

def masked(v):
    if not v:
        return "EMPTY len=0"
    if len(v) <= 8:
        return f"len={len(v)} masked=****"
    return f"len={len(v)} {v[:4]}...{v[-4:]}"

for k in ["GOOGLE_API_KEY","GEMINI_API_KEY","FAL_KEY","ANTHROPIC_API_KEY","OPENAI_API_KEY","ELEVENLABS_API_KEY"]:
    print(f"{k}: {masked(keys.get(k,''))}")

# also check if any other set
print("--- all keys in .env ---")
for k,v in keys.items():
    print(k, masked(v))

# check ffmpeg
import shutil
print("--- ffmpeg ---")
print("which:", shutil.which("ffmpeg"))
# node version
import subprocess
try:
    print(subprocess.check_output(["node","--version"], text=True).strip())
except Exception as e:
    print("node error", e)

# check .env.example vs .env
print("--- project validate ---")
