-- 004 — storage / provenance / remount / retain-delete-restore (Q-010 offline prototype)
-- Private object keys: workspaces/{ws}/projects/{proj}/assets/{id}/v1/{sha} derived server-side.
-- Quarantine -> verified only via clean scan + approved rights + consent provenance.
-- Last verified copy never deleted silently; forceDelete explicit, restore tested, hash verification.
BEGIN;

CREATE TABLE IF NOT EXISTS retention_policies (
  id TEXT PRIMARY KEY,
  ttl_days INT CHECK (ttl_days IS NULL OR ttl_days > 0),
  retain_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO retention_policies (id, ttl_days) VALUES
  ('retain-30d', 30),
  ('retain-7d', 7),
  ('retain-forever', NULL)
ON CONFLICT (id) DO NOTHING;

-- Expand assets to full StoredAsset shape (Q-010). Keep 001 minimal assets intact, add columns idempotently.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS retention_policy_id TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','infected','error'));
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rights_status TEXT NOT NULL DEFAULT 'pending' CHECK (rights_status IN ('pending','approved','revoked'));
ALTER TABLE assets ADD COLUMN IF NOT EXISTS consent_ids JSONB NOT NULL DEFAULT '[]';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS renderer_version TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS font_refs JSONB NOT NULL DEFAULT '[]';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS manifest_hash TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS source_ref TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS license_ref TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_reason TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS checksum_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS provenance_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Relax state check to include quarantine lifecycle used by StorageStore
DO $$ BEGIN
  ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_state_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE assets ADD CONSTRAINT assets_state_check CHECK (state IN ('quarantined','verified','blocked','deletion_pending','deleted'));

-- Unique version per (workspace_id, id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_ws_id_version ON assets(workspace_id, id, version);
CREATE INDEX IF NOT EXISTS idx_assets_ws_state ON assets(workspace_id, state);
CREATE INDEX IF NOT EXISTS idx_assets_retention ON assets(retention_policy_id);

-- Pinned manifest: exact assets/manifest/renderer/fonts refs + hash (AC1)
CREATE TABLE IF NOT EXISTS storage_manifests (
  workspace_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  version INT NOT NULL,
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  bytes INT NOT NULL CHECK (bytes > 0),
  object_key TEXT NOT NULL,
  renderer_version TEXT,
  font_refs JSONB NOT NULL DEFAULT '[]',
  source_asset_refs JSONB NOT NULL DEFAULT '[]',
  manifest_hash TEXT NOT NULL CHECK (manifest_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, asset_id, version)
);
CREATE INDEX IF NOT EXISTS idx_manifests_hash ON storage_manifests(manifest_hash);

-- Provenance / lineage for remount (approved consent links)
CREATE TABLE IF NOT EXISTS asset_dependencies (
  parent_asset_id TEXT NOT NULL,
  input_asset_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_asset_id, input_asset_id)
);

-- Append-only audit for retain/delete/restore/verify (AC2 migration/restore tested)
CREATE TABLE IF NOT EXISTS storage_audit (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  version INT,
  action TEXT NOT NULL CHECK (action IN ('ingest','revision','verify','delete','force_delete','restore','consent_revoked')),
  actor TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_ws_asset ON storage_audit(workspace_id, asset_id);

COMMIT;
