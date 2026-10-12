// Outbox + operation-idempotency + retry/dead-letter + cancellation.

import type { OutboxEntry, OperationId, WorkflowId, StepId } from './types.ts';
import { MAX_ATTEMPTS_DEFAULT } from './types.ts';

export class Outbox {
  private byOperation = new Map<OperationId, OutboxEntry>();
  private byId = new Map<string, OutboxEntry>();

  // Идемпотентность по operationId: повтор с тем же id возвращает тот же entry
  enqueue(input: {
    operationId: OperationId;
    workflowId: WorkflowId;
    stepId: StepId;
    payload: unknown;
  }): { entry: OutboxEntry; created: boolean } {
    const existing = this.byOperation.get(input.operationId);
    if (existing) return { entry: existing, created: false };
    const now = new Date().toISOString();
    const entry: OutboxEntry = {
      id: `outbox_${input.operationId}`,
      operationId: input.operationId,
      workflowId: input.workflowId,
      stepId: input.stepId,
      payload: input.payload,
      status: 'pending',
      attempts: 0,
      nextRetryAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.byOperation.set(input.operationId, entry);
    this.byId.set(entry.id, entry);
    return { entry, created: true };
  }

  markSubmitted(operationId: OperationId): OutboxEntry | null {
    const e = this.byOperation.get(operationId);
    if (!e) return null;
    if (e.status !== 'pending') return e; // idempotent
    e.status = 'submitted';
    e.updatedAt = new Date().toISOString();
    return e;
  }

  markResult(operationId: OperationId, status: OutboxEntry['status']): OutboxEntry | null {
    const e = this.byOperation.get(operationId);
    if (!e) return null;
    e.status = status;
    e.updatedAt = new Date().toISOString();
    return e;
  }

  // Crash-after-submit / unknown outcome: ставим unknown, НЕ делаем новый submit вслепую
  markUnknown(operationId: OperationId): OutboxEntry | null { return this.markResult(operationId, 'unknown'); }

  // Retry с exponential backoff, без blind resubmit при unknown (только reconcile)
  scheduleRetry(operationId: OperationId, baseMs = 1000, maxAttempts = MAX_ATTEMPTS_DEFAULT, now?: Date): OutboxEntry | null {
    const e = this.byOperation.get(operationId);
    if (!e) return null;
    if (e.status === 'unknown') return e;
    e.attempts += 1;
    if (e.attempts >= maxAttempts) {
      e.status = 'dead_letter';
      e.nextRetryAt = null;
    } else {
      e.status = 'failed';
      const when = (now ?? new Date()).getTime() + baseMs * Math.pow(2, e.attempts - 1);
      e.nextRetryAt = new Date(when).toISOString();
    }
    e.updatedAt = new Date().toISOString();
    return e;
  }

  // Reconcile: только если known result приходит от provider, можно выйти из unknown
  reconcile(operationId: OperationId, providerStatus: 'succeeded' | 'failed' | 'running' | 'not_found'): OutboxEntry | null {
    const e = this.byOperation.get(operationId);
    if (!e || e.status !== 'unknown') return e ?? null;
    if (providerStatus === 'succeeded') e.status = 'succeeded';
    else if (providerStatus === 'failed') e.status = 'failed';
    else if (providerStatus === 'running') e.status = 'running';
    // not_found остаётся unknown до явного owner decision
    e.updatedAt = new Date().toISOString();
    return e;
  }

  // Cancellation semantics: ставится cancelled, не триггерит новый side effect
  cancel(operationId: OperationId): OutboxEntry | null { return this.markResult(operationId, 'cancelled'); }

  getByOperation(operationId: OperationId): OutboxEntry | null { return this.byOperation.get(operationId) ?? null; }
  all(): OutboxEntry[] { return [...this.byOperation.values()]; }
}
