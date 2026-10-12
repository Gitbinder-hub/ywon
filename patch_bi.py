import pathlib
p=pathlib.Path("scripts/build_installer.py")
t=p.read_text(encoding="utf-8",errors="replace")
print(t)
print("---END len",len(t))
# create new version that supports 0.0.7 payload_stage
new=t.replace(
'OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-05"',
'OUTDIR = ROOT / "outputs" / "companion-windows-installer-2026-10-05"\nOUTDIR07 = ROOT / "outputs" / "companion-windows-installer-2026-10-06"'
)
# add helper for 0.0.7 at end
add="\n# B-060 0.0.7 payload_stage helper (large tray+stream) — use build_007a/b scripts or:\n# python scripts/build_installer.py --ver 0.0.7  (reads payload_stage if exists)\n"
if "B-060" not in new:
    new=new.replace('def compile_exe', add+'def compile_exe')
pathlib.Path("scripts/build_installer.py").write_text(new,encoding="utf-8")
print("patched")
print(new[:3500])
