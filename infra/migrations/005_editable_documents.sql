-- 005 — editable document / media-neutral contracts (Q-036 offline prototype)
-- Normative: docs/architecture/EDITABLE_DOCUMENT_CONTRACT.md + docs/architecture/04_DATA_MODEL.md v0.4 supplement
-- No FK to shift history: tenant-consistent FK via workspace_id, unique (workspace_id,id), retention/source/approval/rollback tested.
BEGIN;

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','text','video','sequence')),
  brief_version TEXT NOT NULL DEFAULT 'v1',
  recipe_version TEXT NOT NULL DEFAULT 'v1',
  primary_channel_id TEXT REFERENCES channels(id),
  content_locale TEXT NOT NULL CHECK (content_locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','planned','published','archived')),
  current_revision_ref INT,
  episode_id TEXT REFERENCES episodes(id),
  retention_policy_id TEXT REFERENCES retention_policies(id),
  source_refs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1,
  PRIMARY KEY (workspace_id, id),
  CONSTRAINT chk_planned_channel CHECK (state NOT IN ('planned','published') OR primary_channel_id IS NOT NULL),
  CONSTRAINT chk_fake_episode CHECK (kind NOT IN ('image','text') OR episode_id IS NULL),
  FOREIGN KEY (project_id, workspace_id) REFERENCES projects(id, workspace_id)
);
CREATE INDEX IF NOT EXISTS idx_content_items_project ON content_items(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_content_items_state ON content_items(workspace_id, state);

CREATE TABLE IF NOT EXISTS content_variants (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  parent_variant_id TEXT,
  purpose TEXT NOT NULL CHECK (purpose IN ('original','localization','platform_adaptation','draft')),
  platform_profile_ref TEXT,
  market TEXT,
  locale TEXT NOT NULL CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  document_revision_ref INT,
  accepted_revision_ref INT,
  accepted_hash TEXT CHECK (accepted_hash IS NULL OR accepted_hash ~ '^[0-9a-f]{64}$'),
  accepted_export_profile TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, item_id) REFERENCES content_items(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, parent_variant_id) REFERENCES content_variants(workspace_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS editable_documents (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  kind TEXT NOT NULL CHECK (kind IN ('canvas','timeline','sequence','text')),
  coordinate_space TEXT NOT NULL DEFAULT 'canonical',
  timebase TEXT,
  color_profile TEXT,
  current_revision_ref INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, item_id) REFERENCES content_items(workspace_id, id) ON DELETE CASCADE
);

-- Kind compatibility is enforced by trigger (Postgres does not allow subquery in CHECK)
CREATE OR REPLACE FUNCTION check_editable_document_kind_compat() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind_expected TEXT;
BEGIN
  SELECT CASE NEW.kind
    WHEN 'canvas' THEN 'image'
    WHEN 'text' THEN 'text'
    WHEN 'timeline' THEN 'video'
    WHEN 'sequence' THEN 'sequence'
  END INTO kind_expected;
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE workspace_id = NEW.workspace_id AND id = NEW.item_id AND kind = kind_expected) THEN
    RAISE EXCEPTION 'kind_incompatible: document kind % incompatible with item % (expected item kind %)', NEW.kind, NEW.item_id, kind_expected;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_editable_document_kind_compat ON editable_documents;
CREATE TRIGGER trg_editable_document_kind_compat BEFORE INSERT OR UPDATE ON editable_documents
  FOR EACH ROW EXECUTE FUNCTION check_editable_document_kind_compat();


CREATE TABLE IF NOT EXISTS document_revisions (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  revision INT NOT NULL CHECK (revision > 0),
  parent_revision INT,
  immutable_json JSONB NOT NULL,
  hash TEXT NOT NULL CHECK (hash ~ '^[0-9a-f]{64}$'),
  renderer_version TEXT,
  font_refs JSONB NOT NULL DEFAULT '[]',
  source_asset_refs JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, document_id, revision),
  FOREIGN KEY (workspace_id, document_id) REFERENCES editable_documents(workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT chk_json_size CHECK (octet_length(immutable_json::text) <= 2097152)
);
CREATE INDEX IF NOT EXISTS idx_revisions_hash ON document_revisions(hash);

CREATE TABLE IF NOT EXISTS editor_commands (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  base_revision INT,
  idempotency_key TEXT NOT NULL,
  validated_intent JSONB NOT NULL,
  actor TEXT NOT NULL,
  result_revision INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, document_id, idempotency_key),
  FOREIGN KEY (workspace_id, document_id, result_revision) REFERENCES document_revisions(workspace_id, document_id, revision)
);

CREATE TABLE IF NOT EXISTS variant_approvals (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL CHECK (revision_hash ~ '^[0-9a-f]{64}$'),
  export_profile TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL,
  PRIMARY KEY (workspace_id, variant_id),
  FOREIGN KEY (workspace_id, variant_id) REFERENCES content_variants(workspace_id, id) ON DELETE CASCADE
);

COMMIT;
