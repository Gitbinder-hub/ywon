import pathlib
p=pathlib.Path("installer/YwonTray.cs")
text=p.read_text(encoding="utf-8")
once=text.find("  static void OnOutput")
main=text.find("  [STAThread]")
before=text[:once]
after=text[main:]
a=pathlib.Path("installer/webview_newblock_part1.txt")
b=pathlib.Path("installer/webview_newblock_part2.txt")
new=a.read_text(encoding="utf-8")+b.read_text(encoding="utf-8")
full=before+new+after
p.write_text(full, encoding="utf-8")
print("patched", len(full))
# cleanup temp parts after patch
try: a.unlink()
except: pass
try: b.unlink()
except: pass
try: pathlib.Path("installer/webview_partA.cs").unlink()
except: pass
try: pathlib.Path("installer/webview_block.cs").unlink()
except: pass
