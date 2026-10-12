// Leases + fencing token: кто держит шаг, тот и действует.
// Lease expiry/Cancellation не даёт право blind resubmit.

import type { Lease, WorkflowId, StepId } from './types.ts';
import { LEASE_TTL_MS_DEFAULT } from './types.ts';

export class LeaseStore {
  private leases = new Map<string, Lease>();
  private fencingCounter = 0;

  issue(input: { workflowId: WorkflowId; stepId: StepId; holder: string; ttlMs?: number; now?: Date }): Lease {
    const now = input.now ?? new Date();
    const ttlMs = input.ttlMs ?? LEASE_TTL_MS_DEFAULT;
    const token = ++this.fencingCounter;
    const lease: Lease = {
      id: `lease_${input.workflowId}_${input.stepId}_${token}`,
      workflowId: input.workflowId,
      stepId: input.stepId,
      holder: input.holder,
      fencingToken: token,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      ttlMs,
    };
    this.leases.set(input.stepId, lease);
    return lease;
  }

  renew(stepId: StepId, holder: string, now?: Date): Lease | null {
    const cur = this.leases.get(stepId);
    if (!cur) return null;
    if (cur.holder !== holder) return null;
    if (Date.parse(cur.expiresAt) <= (now ?? new Date()).getTime()) return null;
    const next = { ...cur, expiresAt: new Date((now ?? new Date()).getTime() + cur.ttlMs).toISOString() };
    this.leases.set(stepId, next);
    return next;
  }

  get(stepId: StepId): Lease | null { return this.leases.get(stepId) ?? null; }

  expired(stepId: StepId, now?: Date): boolean {
    const cur = this.leases.get(stepId);
    if (!cur) return false;
    return Date.parse(cur.expiresAt) <= (now ?? new Date()).getTime();
  }

  holderForToken(stepId: StepId, fencingToken: number): boolean {
    const cur = this.leases.get(stepId);
    return !!cur && cur.fencingToken === fencingToken && !this.expired(stepId);
  }

  release(stepId: StepId): void { this.leases.delete(stepId); }
}
