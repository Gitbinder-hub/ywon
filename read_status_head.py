import pathlib
p=pathlib.Path("bootstrap/STATUS.md")
t=p.read_text(encoding="utf-8",errors="replace")
print(t[:5000])
print("\n---STATUS lines",len(t.splitlines()))
# also report
r=pathlib.Path("reports/COMPANION_WINDOWS_INSTALLER_2026-10-05.md")
print("\n=== report tail ===")
print(r.read_text(encoding="utf-8",errors="replace")[-2500:])
# b060 draft if exists
import os
print([x.name for x in pathlib.Path("bootstrap").glob("B06*")])
