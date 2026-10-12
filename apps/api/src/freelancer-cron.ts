/** Freelancer cron — GET /projects/active?query=... → tickFreelancer → TG notify.
 * Secrets only from env; paid placement only after /approve + Delegation.
 */
import { tickFreelancer } from '../../../packages/freelancer-worker/src/cron.ts';

export function startFreelancerCron(opts: {
  query: string;
  intervalMs: number;
  fetchActive: (query: string) => Promise<Array<{ id: number; budget: { min: number; max: number }; title: string }>>;
  notify: (text: string) => void;
  getBaseline: () => number;
  getForecast: () => number | null;
}): NodeJS.Timeout {
  async function tick(): Promise<void> {
    try {
      const res = await tickFreelancer(opts.query, {
        fetchActive: opts.fetchActive,
        notify: opts.notify,
        baselineMinor: opts.getBaseline(),
        forecastMinor: opts.getForecast(),
      });
      if (res.drafted) opts.notify(`[Freelancer] tick "${opts.query}" drafted ${res.drafted}, skipped ${res.skipped.length}`);
    } catch (e) {
      opts.notify(`[Freelancer] tick fail: ${e instanceof Error ? e.message : String(e).slice(0, 300)}`);
    }
  }
  void tick();
  return setInterval(() => void tick(), opts.intervalMs);
}
