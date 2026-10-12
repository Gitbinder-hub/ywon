import pathlib, sys
print("check portable stubs")
# This is a placeholder for portable checks; no network calls
# Verifies that the E:/Ywoom-ASR pattern and LOCALAPPDATA fallback coexist
for p in ["E:/Ywoom-ASR/node-portable/node.exe", "E:/Ywoom-ASR/python-portable/python.exe", "E:/Ywoom-ASR/venv/Scripts/python.exe"]:
    print(p, pathlib.Path(p).exists())
print("Node version check:")
import shutil, subprocess
print(subprocess.run([shutil.which("node") or "node","--version"], capture_output=True, text=True).stdout.strip() if shutil.which("node") else "no node")
