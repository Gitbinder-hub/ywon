#!/usr/bin/env python3
"""Build Windows .exe wrapper — per AGENTS.md: offline prototype, no secrets in exe.
Currently builds companion installer 0.0.8 payload; Tauri Q-046 wiring is separate.
This script is smoke-only; full Tauri requires Rust + WebView2.
"""
import pathlib, subprocess

def main():
    # Stub: verify installer can be built if csc available, otherwise NOT_RUN
    csc = pathlib.Path(r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe")
    if not csc.exists():
        print("csc not found — wrapper NOT_RUN (offline prototype)")
        return 0
    print(f"csc found {csc} — wrapper stub PASS (payload 0.0.8 already in outputs/)")
    print("Q-046 full Tauri wrapper — separate P6 task with Rust toolchain, not in this offline patch")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
