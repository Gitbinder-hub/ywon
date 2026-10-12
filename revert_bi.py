import pathlib
p=pathlib.Path("scripts/build_installer.py")
t=p.read_text(encoding="utf-8",errors="replace")
t=t.replace('OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-05"\nOUTDIR07 = ROOT / "outputs" / "companion-windows-installer-2026-10-06"','OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-05"')
t=t.replace('\n# B-060 0.0.7 payload_stage helper (large tray+stream) — use build_007a/b scripts or:\n# python scripts/build_installer.py --ver 0.0.7  (reads payload_stage if exists)\n','\n')
p.write_text(t,encoding="utf-8")
print("reverted",len(t))
