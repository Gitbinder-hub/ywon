-- 002 — durable workflow / journal / leases / outbox (P1 offline prototype)
BEGIN;

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending','running','paused','succeeded','failed','cancelled','needs_user','reconciling')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT NOT NULL,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','succeeded','failed','cancelled','dead_letter')),
  operation_id TEXT NOT NULL UNIQUE,
  lease_id TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  next_retry_at TIMESTAMPTZ,
  reversible BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (workflow_id, id)
);

-- append-only journal: no UPDATE/DELETE in app (enforced by revoke, RLS future)
CREATE TABLE IF NOT EXISTS workflow_journal (
  seq BIGSERIAL PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  reversible BOOLEAN NOT NULL DEFAULT false,
  compensation_of BIGINT REFERENCES workflow_journal(seq),
  fencing_token BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_journal_wf ON workflow_journal(workflow_id, seq);

-- leases with fencing token (monotonic per step) + TTL
CREATE TABLE IF NOT EXISTS workflow_leases (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  holder TEXT NOT NULL,
  fencing_token BIGINT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ttl_ms INT NOT NULL DEFAULT 30000 CHECK (ttl_ms BETWEEN 1000 AND 300000),
  UNIQUE (workflow_id, step_id, fencing_token)
);

-- outbox: one row per operationId, idempotent enqueue
CREATE TABLE IF NOT EXISTS workflow_outbox (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','submitted','running','unknown','succeeded','failed','dead_letter','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
