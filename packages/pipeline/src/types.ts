/** Q-014 pipeline types */
export type PipelineStep = 'script'|'generate'|'qa'|'review'|'export';
export interface PipelineRun { runId:string; workspaceId:string; steps: PipelineStep[]; approvedScriptHash:string|null; revision:number; costMinor:number; status:'pending'|'needs_approval'|'succeeded'|'failed'|'unknown'|'budget_stop'; budgetDenied?:boolean }
