/**
 * Freelancer autobid worker — watch active projects, draft bid, await DelegationEnvelope approve in TG, then place.
 * No auto-bid without explicit approve + BudgetLedger >10% check.
 */
import type { BidDraft, WorkerState } from './types.ts';

let state: WorkerState='idle';
let draft: BidDraft| null=null;
const outbox: string[]=[];

export function setState(s:WorkerState){ state=s; }
export function getState():WorkerState{ return state; }
export function getDraft(): BidDraft| null{ return draft ? {...draft} : null; }

export function watchTick(): void { state='watching'; }

export function prepareDraft(projectId:number, budget:{min:number,max:number}, query:string): BidDraft | null {
  // BudgetLedger + needsFallback already checked by caller; here just draft
  if (budget.min < 50) return null; // filter low budget
  draft = { projectId, amountMinor: Math.round((budget.min+budget.max)/2*100), periodDays:7, description: `Ywon AI: готов выполнить "${query}" — кратко, по делу, с примерами. Работаю через официальный API с вашего согласия.`, createdAt: new Date().toISOString(), approved:false };
  state='draft_ready';
  return {...draft};
}

export function notifyDraftReady(chatId:string): string { state='awaiting_approve'; const msg=`[Freelancer] draft #${draft?.projectId} готов (${draft?.amountMinor} minor, 7д). Ответь в ТГ: /approve ${draft?.projectId} или /reject`; outbox.push(msg); return msg; }
export function getOutbox(): string[]{ return [...outbox]; }

export function approveDraft(projectId:number, delegation:{ allowed:boolean }): { ok:true }|{ ok:false; code:string }{
  if (!draft || draft.projectId!==projectId) return {ok:false, code:'no_draft'};
  if (!delegation.allowed) return {ok:false, code:'delegation_denied'};
  draft.approved=true;
  state='idle';
  // actual POST /bids/ is done by caller with freelancer-oauth token
  return {ok:true};
}

export async function placeBid(projectId:number, envToken:string): Promise<{status:number; body:string}>{
  if (!draft || !draft.approved || draft.projectId!==projectId) throw new Error('not_approved');
  const res = await fetch('https://www.freelancer.com/api/projects/0.1/bids/', {
    method:'POST',
    headers:{ 'freelancer-oauth-v1': envToken, 'Content-Type':'application/json' },
    body: JSON.stringify({ project_id: projectId, bidder_id: 82806433, amount: draft.amountMinor/100, period: draft.periodDays, milestone_percentage:100, description: draft.description })
  });
  const text=await res.text();
  return {status: res.status, body: text.slice(0,1200)};
}
