-- 006 — Platform shell / Factory boundary (Q-044 offline prototype)
-- Normative: docs/architecture/PLATFORM_SHELL.md + docs/architecture/DESKTOP_COMPANION.md + ARCHITECT_FOUNDATION.md
-- Future personal/business/capital/physical remain future modules; workspace membership and per-module scopes independent.
-- No global admin token, no common unlimited memory bucket, no budget/consent bypass, shell outage keeps Factory export.
BEGIN;

CREATE TABLE IF NOT EXISTS module_registry (
  module_id TEXT PRIMARY KEY CHECK (module_id IN ('factory','personal','business','capital','physical','companion')),
  version TEXT NOT NULL,
  boundary_version TEXT NOT NULL DEFAULT '1',
  status TEXT NOT NULL CHECK (status IN ('active','future')),
  deep_link_prefix TEXT NOT NULL,
  docs TEXT NOT NULL
);
INSERT INTO module_registry(module_id, version, boundary_version, status, deep_link_prefix, docs) VALUES
  ('factory','1.0.0','1','active','/factory','docs/architecture/PLATFORM_SHELL.md'),
  ('companion','1.0.0','1','future','/companion','docs/architecture/DESKTOP_COMPANION.md'),
  ('personal','0.1.0','1','future','/personal','FUTURE F41'),
  ('business','0.1.0','1','future','/business','FUTURE F41'),
  ('capital','0.1.0','1','future','/capital','FUTURE F41'),
  ('physical','0.1.0','1','future','/physical','FUTURE F41')
ON CONFLICT(module_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS module_delegations (
  delegation_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES module_registry(module_id),
  scopes JSONB NOT NULL,
  purpose TEXT NOT NULL CHECK (length(purpose) BETWEEN 1 AND 500),
  retention_days INT CHECK (retention_days IS NULL OR (retention_days BETWEEN 1 AND 3650)),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  boundary_version TEXT NOT NULL DEFAULT '1',
  version INT NOT NULL DEFAULT 1 CHECK (version BETWEEN 1 AND 1000000),
  CONSTRAINT chk_delegation_expiry CHECK (expires_at > issued_at),
  CONSTRAINT chk_delegation_scope_prefix CHECK (jsonb_typeof(scopes) = 'array')
);
CREATE INDEX IF NOT EXISTS idx_delegations_workspace ON module_delegations(workspace_id, module_id);
CREATE INDEX IF NOT EXISTS idx_delegations_actor ON module_delegations(actor_id);

-- Workspace membership stays canonical source of tenancy; this table only records scopes, not tenancy bypass.
CREATE TABLE IF NOT EXISTS cross_module_consents (
  id SERIAL PRIMARY KEY,
  source_module TEXT NOT NULL REFERENCES module_registry(module_id),
  dest_module TEXT NOT NULL REFERENCES module_registry(module_id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (length(purpose) BETWEEN 1 AND 500),
  retention_days INT NOT NULL CHECK (retention_days BETWEEN 1 AND 3650),
  delegation_id TEXT NOT NULL REFERENCES module_delegations(delegation_id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_cross_modules_different CHECK (source_module <> dest_module)
);

CREATE TABLE IF NOT EXISTS module_deep_links (
  module_id TEXT NOT NULL REFERENCES module_registry(module_id),
  path TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_deep_link_prefix CHECK (path ~ '^/[a-z/]+$')
);

COMMIT;
