import pathlib, subprocess, sys, hashlib, json
ROOT=pathlib.Path(".").resolve()
def run(cmd, timeout=4):
    try:
        p=subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", creationflags=0)
        try:
            out,err=p.communicate(timeout=timeout)
            return p.returncode, out[:2000], err[:2000]
        except subprocess.TimeoutExpired:
            p.kill()
            out,err=p.communicate()
            return None, out[:2000] if out else "", err[:2000] if err else "TIMEOUT"
    except Exception as e:
        return None, "", str(e)

print("=== YwonTray --help ===")
rc,out,err=run([r"C:\Temp\YwonTray.exe","--help"],timeout=3)
print("rc",rc)
print("out",repr(out[:500]))
print("err",repr(err[:500]))

print("\n=== YwonTray --check ===")
rc,out,err=run([r"C:\Temp\YwonTray.exe","--check"],timeout=3)
print("rc",rc)
print("out",repr(out[:500]))
print("err",repr(err[:500]))

print("\n=== stage YwonTray --help ===")
stage_tray=ROOT/"outputs/companion-windows-installer-2026-10-06/payload_stage/YwonTray.exe"
rc,out,err=run([str(stage_tray),"--help"],timeout=3)
print("rc",rc)
print("out",repr(out[:500]))

# build_installer.py
bi=ROOT/"scripts/build_installer.py"
print("\n=== build_installer.py exists",bi.exists(), bi.stat().st_size if bi.exists() else 0)
if bi.exists():
    t=bi.read_text(encoding="utf-8",errors="replace")
    print(t[:2500])
    # check if it packs YwonTray
    print("has YwonTray", "YwonTray" in t)
    print("has payload_stage", "payload_stage" in t)

# STATUS.md tail
st=ROOT/"bootstrap/STATUS.md"
print("\n=== STATUS.md size",st.stat().st_size if st.exists() else 0)
if st.exists():
    txt=st.read_text(encoding="utf-8",errors="replace")
    print("last 2000:",txt[-2000:])

# check evidence exists
ev=ROOT/"reports/evidence/companion-windows-installer-2026-10-06.json"
print("\nev exists",ev.exists())
if ev.exists():
    print(ev.read_text(encoding="utf-8")[:2000])
