/** Live radar helpers — 6h cron wiring.
 * Pure + fetch-bound: healthProbe does real generateContent for Gemini; pricing fetch is separate.
 * Secrets only via env at call site; this module never reads them itself.
 */
import type { ProviderEntry } from "./types.ts";
import { registerProvider, radarSnapshot } from "./index.ts";

export interface ProbeResult { health: ProviderEntry["health"]; latencyMs: number; error?: string }

export async function healthProbeGemini(entry: ProviderEntry, apiKey: string): Promise<ProbeResult> {
  const t0 = Date.now();
  const model = entry.id.includes("gemini") ? entry.id : "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({ contents: [{ role: "user", parts: [{ text: "say hi in 3 words" }] }] });
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(12000) });
    const ok = r.ok;
    return { health: ok ? "healthy" : r.status >= 500 ? "down" : "degraded", latencyMs: Date.now() - t0 };
  } catch (e) {
    return { health: "down", latencyMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function healthProbe(entry: ProviderEntry, apiKey: string, _baseUrl: string): Promise<ProviderEntry> {
  if (!apiKey) return { ...entry, health: "down" };
  const res = await healthProbeGemini(entry, apiKey);
  return { ...entry, health: res.health };
}

export function radarTick(deltaPercent: number | null): ReturnType<typeof radarSnapshot> {
  return radarSnapshot(deltaPercent);
}

export function registerWithLiveFees(entry: ProviderEntry): { ok: true } | { ok: false; code: string } {
  return registerProvider(entry);
}

// 6h cron entry — caller schedules; we expose interval for docs/tests
export const RADAR_INTERVAL_MS = 6 * 60 * 60 * 1000;
