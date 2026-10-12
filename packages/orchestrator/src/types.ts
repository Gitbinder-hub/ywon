export type WorkflowId = string;
export type StepId = string;
export type OperationId = string;
export type LeaseId = string;

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'needs_user'
  | 'reconciling';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'dead_letter';

export type OutboxStatus =
  | 'pending'
  | 'submitted'
  | 'running'
  | 'unknown'
  | 'succeeded'
  | 'failed'
  | 'dead_letter'
  | 'cancelled';

export interface WorkflowStep {
  id: StepId;
  workflowId: WorkflowId;
  name: string;
  status: StepStatus;
  operationId: OperationId;
  leaseId: LeaseId | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  reversible: boolean;
}

export interface Lease {
  id: LeaseId;
  workflowId: WorkflowId;
  stepId: StepId;
  holder: string;
  fencingToken: number;
  expiresAt: string;
  issuedAt: string;
  ttlMs: number;
}

export interface JournalEntry {
  seq: number;
  workflowId: WorkflowId;
  kind: string;
  payload: unknown;
  reversible: boolean;
  compensationOf: number | null;
  createdAt: string;
  fencingToken?: number;
}

export interface OutboxEntry {
  id: string;
  operationId: OperationId;
  workflowId: WorkflowId;
  stepId: StepId;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_ATTEMPTS_DEFAULT = 3;
export const LEASE_TTL_MS_DEFAULT = 30_000;
export const RETRY_BASE_MS = 1000;
