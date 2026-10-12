/** Radar 6h cron — calls healthProbeGemini and notifies on degraded/down.
 * Scheduled by apps/api server main; secrets only from env at call site.
 */
import { healthProbeGemini, RADAR_INTERVAL_MS } from '../../../packages/model-switch/src/radar-live.ts';
import type { ProviderEntry } from '../../packages/model-switch/src/types.ts';

export function startRadarCron(getProviders: () => ProviderEntry[], getApiKey: () => string, onNotify: (text: string) => void): NodeJS.Timeout {
  async function tick(): Promise<void> {
    const apiKey = getApiKey();
    if (!apiKey) return;
    for (const p of getProviders()) {
      const res = await healthProbeGemini(p, apiKey);
      if (res.health !== 'healthy') {
        onNotify(`[Radar] ${p.id}@${p.version} ${res.health} latency ${res.latencyMs}ms${res.error ? ' ' + res.error.slice(0, 200) : ''}`);
      }
    }
  }
  void tick();
  return setInterval(() => void tick(), RADAR_INTERVAL_MS);
}
