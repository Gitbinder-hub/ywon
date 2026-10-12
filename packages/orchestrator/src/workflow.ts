import type { WorkflowId, WorkflowStep, WorkflowStatus } from './types.ts';
import { Journal } from './journal.ts';
import type { JournalEntry } from './types.ts';
import { LeaseStore } from './lease.ts';
import { Outbox } from './outbox.ts';

export interface Workflow {
  id: WorkflowId;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  generationUnitId?: string;
  envelopeId?: string;
}

export class DurableWorkflowEngine {
  readonly journal = new Journal();
  readonly leases = new LeaseStore();
  readonly outbox = new Outbox();
  private workflows = new Map<WorkflowId, Workflow>();

  create(workflowId: WorkflowId, steps: { id: string; name: string; operationId: string; reversible?: boolean; maxAttempts?: number }[]): Workflow {
    if (this.workflows.has(workflowId)) throw new Error('workflow exists');
    const wf: Workflow = {
      id: workflowId,
      status: 'pending',
      steps: steps.map(s => ({
        id: s.id, workflowId, name: s.name, status: 'pending' as const,
        operationId: s.operationId, leaseId: null, attempts: 0,
        maxAttempts: s.maxAttempts ?? 3, nextRetryAt: null, reversible: s.reversible ?? false,
      })),
    };
    this.workflows.set(workflowId, wf);
    this.journal.append({ workflowId, kind: 'workflow.created', payload: { steps: wf.steps.map(s => s.id) } });
    return wf;
  }

  get(workflowId: WorkflowId): Workflow | null { return this.workflows.get(workflowId) ?? null; }

  // Crash recovery: restore from persisted steps (здесь — из памяти, в Postgres — SELECT)
  recover(workflowId: WorkflowId): Workflow | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    this.journal.append({ workflowId, kind: 'workflow.recovered', payload: { status: wf.status } });
    return wf;
  }

  start(workflowId: WorkflowId): void {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status !== 'pending') throw new Error('cannot start');
    wf.status = 'running';
    this.journal.append({ workflowId, kind: 'workflow.started', payload: {} });
  }

  beginStep(workflowId: WorkflowId, stepId: string, holder: string): void {
    const wf = this.workflows.get(workflowId);
    const step = wf?.steps.find(s => s.id === stepId);
    if (!wf || !step) throw new Error('not found');
    const lease = this.leases.issue({ workflowId, stepId, holder });
    step.status = 'running';
    step.leaseId = lease.id;
    this.journal.append({ workflowId, kind: 'step.started', payload: { stepId, leaseId: lease.id }, fencingToken: lease.fencingToken });
    this.outbox.enqueue({ operationId: step.operationId, workflowId, stepId, payload: { step: step.name } });
    this.outbox.markSubmitted(step.operationId);
  }

  // Crash-after-submit: помечаем unknown, требуем reconcile, не ретрай вслепую
  reportUnknown(workflowId: WorkflowId, stepId: string): void {
    const step = this.workflows.get(workflowId)?.steps.find(s => s.id === stepId);
    if (!step) throw new Error('not found');
    this.outbox.markUnknown(step.operationId);
    const wf = this.workflows.get(workflowId)!;
    wf.status = 'reconciling';
    this.journal.append({ workflowId, kind: 'step.unknown', payload: { stepId, operationId: step.operationId } });
  }

  // Duplicate callback: идемпотентность по operationId, второй вызов не меняет результат
  handleCallback(operationId: string, result: 'succeeded' | 'failed'): string {
    const entry = this.outbox.getByOperation(operationId);
    if (!entry) return 'not_found';
    if (entry.status === 'succeeded' || entry.status === 'failed') return 'duplicate_ignored';
    this.outbox.markResult(operationId, result);
    const wf = this.workflows.get(entry.workflowId);
    const step = wf?.steps.find(s => s.id === entry.stepId);
    if (step) {
      step.status = result === 'succeeded' ? 'succeeded' : 'failed';
      if (result === 'failed' && (step.attempts + 1) < step.maxAttempts) {
        step.attempts += 1;
        step.status = 'failed';
      } else if (result === 'failed') {
        step.status = 'dead_letter';
      }
    }
    this.journal.append({ workflowId: entry.workflowId, kind: `step.${result}`, payload: { stepId: entry.stepId, operationId } });
    return result === 'succeeded' ? 'accepted' : 'accepted_failed';
  }

  // Cancel semantics: помечаем cancelled, не триггерим side effect
  cancel(workflowId: WorkflowId, stepId: string): void {
    const step = this.workflows.get(workflowId)?.steps.find(s => s.id === stepId);
    if (!step) throw new Error('not found');
    step.status = 'cancelled';
    this.outbox.cancel(step.operationId);
    if (step.leaseId) this.leases.release(step.id);
    this.journal.append({ workflowId, kind: 'step.cancelled', payload: { stepId } });
  }

  // Pause drain: не начинать новые pending шаги
  pause(workflowId: WorkflowId): void {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error('not found');
    wf.status = 'paused';
    this.journal.append({ workflowId, kind: 'workflow.paused', payload: {} });
  }

  retryFailed(workflowId: WorkflowId, stepId: string, now?: Date): boolean {
    const step = this.workflows.get(workflowId)?.steps.find(s => s.id === stepId);
    if (!step || step.status !== 'failed') return false;
    const e = this.outbox.scheduleRetry(step.operationId, 1000, step.maxAttempts, now);
    if (!e) return false;
    if (e.status === 'dead_letter') { step.status = 'dead_letter'; this.journal.append({ workflowId, kind: 'step.dead_letter', payload: { stepId } }); return false; }
    step.status = 'pending';
    return true;
  }

  compensate(workflowId: WorkflowId, originalSeq: number, payload: unknown): JournalEntry {
    return this.journal.appendCompensation(originalSeq, payload, workflowId);
  }
}
