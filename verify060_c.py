import subprocess, pathlib
def run(cmd,timeout=4):
    try:
        p=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding="utf-8",errors="replace")
        try: out,err=p.communicate(timeout=timeout); return p.returncode,out,err
        except subprocess.TimeoutExpired:
            p.kill(); out,err=p.communicate(); return None,out,err
    except Exception as e: return None,"",str(e)
for args in [["--help"],["--check"]]:
    rc,out,err=run([r"C:\Temp\YwonTray.exe"]+args,timeout=3)
    print(args,rc,repr(out[:400]),repr(err[:400]))
# also stage
rc,out,err=run([str(pathlib.Path("outputs/companion-windows-installer-2026-10-06/payload_stage/YwonTray.exe").resolve()),"--help"],timeout=3)
print("stage --help",rc,repr(out[:400]))
