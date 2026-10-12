#!/usr/bin/env node
/**
 * Ywon-tray.ts — лёгкий Node-чекер ярлыков/реестра для REVIEW-пилота.
 * Не native tray (требует подписи); только --check / --help.
 * Использование: npx tsx apps/desktop-companion/Ywon-tray.ts --check
 * или node --loader ts-node/esm ...
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function getInstallDir(): string {
  return join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "Ywon", "Ywon Companion");
}

function regQuery(key: string, value: string): { exists: boolean; data?: string } {
  try {
    const out = execSync(`reg query "${key}" /v ${value} 2>&1`, { encoding: "utf-8" });
    // parse value line
    const m = out.match(new RegExp(`${value}\\s+REG_\\w+\\s+(.+)`));
    return { exists: true, data: m ? m[1].trim() : out.trim() };
  } catch (e: any) {
    const s = String(e?.stdout ?? e?.message ?? "");
    if (s.includes("ERROR") || s.includes("не удается найти") || s.includes("unable")) return { exists: false };
    return { exists: false, data: s.slice(0, 400) };
  }
}

function check(): number {
  const dir = getInstallDir();
  const YwonCmd = join(dir, "Ywon.cmd");
  const startCmd = join(dir, "START.cmd");
  const uninstallExe = join(dir, "uninstall.exe");
  const startMenu = join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Microsoft", "Windows", "Start Menu", "Programs", "Ywon");
  const desktop = join(homedir(), "Desktop");

  const rows: Array<{ k: string; v: string; ok: boolean }> = [];
  rows.push({ k: "installDir", v: dir, ok: existsSync(dir) });
  rows.push({ k: "Ywon.cmd", v: YwonCmd, ok: existsSync(YwonCmd) });
  rows.push({ k: "START.cmd", v: startCmd, ok: existsSync(startCmd) });
  rows.push({ k: "uninstall.exe", v: uninstallExe, ok: existsSync(uninstallExe) });
  rows.push({ k: "StartMenu Ywon.lnk", v: join(startMenu, "Ywon.lnk"), ok: existsSync(join(startMenu, "Ywon.lnk")) });
  rows.push({ k: "Desktop lnk", v: join(desktop, "Ywon Companion.lnk"), ok: existsSync(join(desktop, "Ywon Companion.lnk")) });

  const uKey = regQuery("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\YwonCompanion", "DisplayName");
  rows.push({ k: "HKCU Uninstall DisplayName", v: uKey.data ?? "(absent)", ok: uKey.exists && (uKey.data ?? "").includes("Ywon Companion") });
  const run = regQuery("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "YwonCompanion");
  rows.push({ k: "HKCU Run YwonCompanion", v: run.exists ? (run.data ?? "(present)") : "(absent — OFF by default)", ok: true });

  // Pretty print
  let allCoreOk = true;
  for (const r of rows) {
    const isCore = r.k !== "Desktop lnk" && r.k !== "HKCU Run YwonCompanion";
    if (isCore && !r.ok) allCoreOk = false;
    const mark = r.ok ? "OK " : "MISS";
    // eslint-disable-next-line no-console
    console.log(`${mark} ${r.k}: ${r.v}`);
  }
  if (run.exists) {
    const targetOk = (run.data ?? "").toLowerCase().includes("Ywon.cmd");
    if (!targetOk) {
      // eslint-disable-next-line no-console
      console.log("WARN Run target should point to Ywon.cmd ->", run.data);
    }
  }
  if (!existsSync(dir)) {
    // eslint-disable-next-line no-console
    console.log("\nYwon Companion не установлен (per-user %LOCALAPPDATA%\\Ywon\\Ywon Companion). Запусти Ywon-Companion-Setup-0.0.6.exe");
    return 2;
  }
  if (!allCoreOk) {
    // eslint-disable-next-line no-console
    console.log("\nЧастичная установка — проверь ярлыки/реестр выше.");
    return 3;
  }
  // eslint-disable-next-line no-console
  console.log("\nCHECK PASS — локальная установка в порядке. tray native остаётся NOT_RUN (требует подписи).");
  return 0;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  // eslint-disable-next-line no-console
  console.log(`Ywon-tray.ts — локальный чекер Ywon Companion\n\n  --check   проверить ярлыки/реестр/target (per-user, без админа)\n  --help    справка\n\nНе создаёт native tray; native tray + автозапуск-служба — future после подписи.\n`);
  process.exit(0);
}
if (args.includes("--check")) {
  process.exit(check());
}
// default when run directly: show check
if (args.length === 0) {
  process.exit(check());
}
// eslint-disable-next-line no-console
console.log("Unknown args", args, " — use --check or --help");
process.exit(1);
