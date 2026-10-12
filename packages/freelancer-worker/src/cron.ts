/** Freelancer cron — watch active projects, draft, await TG approve, then place.
 * All paid calls go via routeViaSwitch + cost-visibility strict >10%.
 * Secrets only from env at call site; cron never reads them itself.
 */
import { routeViaSwitch } from '../../router/src/index.ts';
import { watchTick, prepareDraft, notifyDraftReady, approveDraft, getDraft } from './index.ts';

export interface CronDeps {
  fetchActive: (query: string) => Promise<Array<{ id: number; budget: { min: number; max: number }; title: string }>>;
  notify: (text: string) => void;
  baselineMinor: number;
  forecastMinor: number | null;
}

export async function tickFreelancer(query: string, deps: CronDeps): Promise<{ drafted: number; skipped: string[] }> {
  watchTick();
  const projects = await deps.fetchActive(query);
  const skipped: string[] = [];
  let drafted = 0;
  for (const p of projects.slice(0, 5)) {
    const routing = routeViaSwitch('prompt_guidance', deps.baselineMinor, deps.forecastMinor);
    if (!routing.allow) { skipped.push(`${p.id}: ${routing.fallback}`); continue; }
    const d = prepareDraft(p.id, p.budget, query);
    if (!d) { skipped.push(`${p.id}: low budget filtered`); continue; }
    notifyDraftReady('tg');
    deps.notify(`[Freelancer] draft #${p.id} "${p.title.slice(0, 60)}" — /approve ${p.id} or /reject`);
    drafted++;
  }
  return { drafted, skipped };
}

export { approveDraft, getDraft };
