/** Freelancer autobid worker types */
export interface BidDraft { projectId:number; amountMinor:number; periodDays:number; description:string; createdAt:string; approved:boolean }
export type WorkerState = 'idle'|'watching'|'draft_ready'|'awaiting_approve'|'paused';
