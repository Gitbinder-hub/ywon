-- 003 — budget ledger / reserves / generation units / cost entries (Q-009 offline prototype)
-- Single authoritative ledger; offline device balance cannot authorise paid work.
-- In Postgres: atomic reserve via SELECT ... FOR UPDATE + tx; unknown != 0.
BEGIN;

CREATE TABLE IF NOT EXISTS budget_scopes (
  scope_id TEXT PRIMARY KEY,
  limit_minor INT NOT NULL CHECK (limit_minor >= 0),
  spent_minor INT NOT NULL DEFAULT 0 CHECK (spent_minor >= 0),
  reserved_minor INT NOT NULL DEFAULT 0 CHECK (reserved_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  pricing_version TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (spent_minor + reserved_minor <= limit_minor)
);

CREATE TABLE IF NOT EXISTS generation_units (
  id TEXT PRIMARY KEY,
  baseline_minor INT NOT NULL CHECK (baseline_minor >= 0),
  reserve_percent INT NOT NULL CHECK (reserve_percent BETWEEN 0 AND 100),
  reserve_minor INT NOT NULL CHECK (reserve_minor >= 0),
  cap_minor INT NOT NULL CHECK (cap_minor >= baseline_minor),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  pricing_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reserve_minor = round(baseline_minor * reserve_percent / 100.0)),
  CHECK (cap_minor = baseline_minor + reserve_minor)
);

CREATE TABLE IF NOT EXISTS budget_reservations (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  generation_unit_id TEXT REFERENCES generation_units(id) ON DELETE SET NULL,
  workflow_id TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  state TEXT NOT NULL CHECK (state IN ('held','settled','released')),
  pricing_version TEXT NOT NULL,
  settled_billed_minor INT CHECK (settled_billed_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_reservation_scopes (
  reservation_id TEXT NOT NULL REFERENCES budget_reservations(id) ON DELETE CASCADE,
  scope_id TEXT NOT NULL REFERENCES budget_scopes(scope_id) ON DELETE RESTRICT,
  amount_minor INT NOT NULL CHECK (amount_minor > 0),
  PRIMARY KEY (reservation_id, scope_id)
);

-- Append-only cost ledger: never UPDATE billed; corrections as separate rows.
CREATE TABLE IF NOT EXISTS cost_ledger (
  id BIGSERIAL PRIMARY KEY,
  operation_id TEXT,
  generation_unit_id TEXT REFERENCES generation_units(id) ON DELETE SET NULL,
  attempt INT NOT NULL CHECK (attempt >= 1),
  pricing_version TEXT NOT NULL,
  billed_minor INT CHECK (billed_minor IS NULL OR billed_minor >= 0),
  status TEXT NOT NULL CHECK (status IN ('estimate','pending','confirmed','corrected')),
  generated_seconds DOUBLE PRECISION CHECK (generated_seconds IS NULL OR generated_seconds >= 0),
  used_seconds DOUBLE PRECISION CHECK (used_seconds IS NULL OR used_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (used_seconds IS NULL OR used_seconds <> 0 OR billed_minor IS NOT NULL)
  -- waste: used=0 => undefined/infinite, not 0; enforced in app layer
);

CREATE INDEX IF NOT EXISTS idx_cost_ledger_op ON cost_ledger(operation_id);
CREATE INDEX IF NOT EXISTS idx_cost_ledger_unit ON cost_ledger(generation_unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_unit ON budget_reservations(generation_unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_state ON budget_reservations(state);

COMMIT;
