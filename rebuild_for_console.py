import pathlib, subprocess, hashlib
# The winexe target has no console, so --help/--check can't return text via stdout.
# We need to compile a console helper OR make YwonTray.cs allocate console.
# Easiest: patch YwonTray.cs to call AllocConsole for --help/--check and use console
p = pathlib.Path("installer/YwonTray.cs")
t = p.read_text(encoding="utf-8")
# Add P/Invoke
if "AllocConsole" not in t:
    t = t.replace("using Microsoft.Win32;", "using Microsoft.Win32;\nusing System.Runtime.InteropServices;")
    t = t.replace(" static string url = null;", " static string url = null;\n [DllImport(\"kernel32.dll\")] static extern bool AllocConsole();\n [DllImport(\"kernel32.dll\")] static extern bool AttachConsole(int pid);")
    # In Main, before help/check, allocate console
    t = t.replace("   minimized = flagMinimized;\n   if(help){", "   minimized = flagMinimized;\n   if(help||checkOnly){ try{ AllocConsole(); }catch{} try{ AttachConsole(-1); }catch{} }\n   if(help){")
    p.write_text(t, encoding="utf-8")
    print("patched alloc", p.stat().st_size)
else:
    print("already alloc")
print(t[t.find("AllocConsole")-200:t.find("AllocConsole")+600])
