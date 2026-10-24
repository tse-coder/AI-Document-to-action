-- Project 10 schema for PostgreSQL on Supabase.
-- Apply:  psql "$DATABASE_URL" -f lib/db/schema.sql
-- Reset:  psql "$DATABASE_URL" -f lib/db/reset.sql   (development only)
--
-- The server connects as the database owner through DATABASE_URL (Supabase
-- transaction pooler). Row level security is enabled with no policies so the
-- anon/authenticated REST roles cannot read or write these tables.

------------------------------------------------------------------
-- documents: demo notices (N1, N2) and pasted notices (U-XXXXXX)
------------------------------------------------------------------
CREATE TABLE documents (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 80),
  origin     TEXT NOT NULL CHECK (origin IN ('demo', 'pasted')),
  user_id    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (origin = 'demo'   AND id ~ '^N[0-9].*$') OR
    (origin = 'pasted' AND id ~ '^U-[0-9A-F]{6}$')
  )
);

CREATE INDEX idx_documents_origin_created ON documents (origin, created_at);
CREATE INDEX idx_documents_user ON documents (user_id);

------------------------------------------------------------------
-- paragraphs: numbered original text, immutable so citations never drift
------------------------------------------------------------------
CREATE TABLE paragraphs (
  id       TEXT PRIMARY KEY,
  doc_id   TEXT NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 40),
  text     TEXT NOT NULL CHECK (length(trim(text)) >= 1),
  UNIQUE (doc_id, position),
  UNIQUE (doc_id, id),
  CHECK (id = doc_id || '-P' || position)
);

CREATE OR REPLACE FUNCTION paragraphs_immutable_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'paragraphs are immutable';
END;
$$;

CREATE TRIGGER paragraphs_immutable
BEFORE UPDATE ON paragraphs
FOR EACH ROW EXECUTE FUNCTION paragraphs_immutable_fn();

------------------------------------------------------------------
-- runs: one agent run per request, holds state between HTTP calls
------------------------------------------------------------------
CREATE TABLE runs (
  id                TEXT PRIMARY KEY,
  doc_id            TEXT NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  user_id           TEXT,
  status            TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'needs_clarification', 'awaiting_approval', 'saved', 'error')),
  request           TEXT NOT NULL CHECK (length(trim(request)) BETWEEN 3 AND 500),
  round             INTEGER NOT NULL DEFAULT 0 CHECK (round BETWEEN 0 AND 2),
  retry_count       INTEGER NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
  simulate_failure  TEXT NOT NULL DEFAULT 'none' CHECK (simulate_failure IN ('none', 'model', 'tool')),
  messages          JSONB NOT NULL DEFAULT '[]'::jsonb
                    CHECK (jsonb_typeof(messages) = 'array' AND length(messages::text) <= 400000),
  model_turns_used  INTEGER NOT NULL DEFAULT 0 CHECK (model_turns_used BETWEEN 0 AND 4),
  tool_calls_used   INTEGER NOT NULL DEFAULT 0 CHECK (tool_calls_used BETWEEN 0 AND 6),
  limit_hit         BOOLEAN NOT NULL DEFAULT false,
  proposal_version  INTEGER NOT NULL DEFAULT 0 CHECK (proposal_version >= 0),
  proposal          JSONB CHECK (proposal IS NULL OR jsonb_typeof(proposal) = 'object'),
  error_code        TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id ~ '^RUN-[0-9A-Z]{8}$'),
  CHECK (status NOT IN ('awaiting_approval', 'saved') OR proposal IS NOT NULL),
  CHECK (
    (status = 'error' AND error_code IS NOT NULL AND error_message IS NOT NULL) OR
    (status <> 'error' AND error_code IS NULL AND error_message IS NULL)
  )
);

CREATE INDEX idx_runs_doc ON runs (doc_id);
CREATE INDEX idx_runs_user ON runs (user_id);
CREATE INDEX idx_runs_status_updated ON runs (status, updated_at);

-- The status machine is enforced by the database as well as the application.
CREATE OR REPLACE FUNCTION runs_status_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
    (OLD.status = 'running' AND NEW.status IN ('needs_clarification', 'awaiting_approval', 'error')) OR
    (OLD.status IN ('needs_clarification', 'error') AND NEW.status = 'running') OR
    (OLD.status = 'awaiting_approval' AND NEW.status = 'saved')
  ) THEN
    RAISE EXCEPTION 'invalid run status transition';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER runs_status_guard
BEFORE UPDATE OF status ON runs
FOR EACH ROW EXECUTE FUNCTION runs_status_guard_fn();

------------------------------------------------------------------
-- run_questions: clarification questions and the user's answers
-- question_id is unique per run and keeps counting across rounds.
-- A not stated answer stores answer NULL and not_stated true.
------------------------------------------------------------------
CREATE TABLE run_questions (
  run_id           TEXT NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
  question_id      TEXT NOT NULL,
  round            INTEGER NOT NULL CHECK (round BETWEEN 1 AND 2),
  field            TEXT NOT NULL CHECK (field IN ('owner', 'deadline')),
  task_client_id   TEXT NOT NULL,
  text             TEXT NOT NULL CHECK (length(trim(text)) >= 1),
  source_refs      JSONB NOT NULL CHECK (jsonb_typeof(source_refs) = 'array'),
  allow_not_stated BOOLEAN NOT NULL DEFAULT true,
  answer           TEXT,
  not_stated       BOOLEAN,
  answered_at      TIMESTAMPTZ,
  PRIMARY KEY (run_id, question_id),
  CHECK (
    (answered_at IS NULL AND answer IS NULL AND not_stated IS NULL) OR
    (answered_at IS NOT NULL AND not_stated IS NOT NULL AND (
      (not_stated = true AND answer IS NULL AND allow_not_stated = true) OR
      (not_stated = false AND answer IS NOT NULL AND length(trim(answer)) BETWEEN 1 AND 200)
    ))
  )
);

------------------------------------------------------------------
-- tool_calls: the visible tool log, one row per call
-- seq counts across the whole run. finalize_proposal logs the finalize call.
------------------------------------------------------------------
CREATE TABLE tool_calls (
  run_id         TEXT NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
  seq            INTEGER NOT NULL CHECK (seq >= 1),
  phase          TEXT NOT NULL CHECK (phase IN ('loop', 'finalize', 'gate')),
  tool           TEXT NOT NULL CHECK (tool IN ('search_document', 'read_checklist', 'save_checklist_changes', 'finalize_proposal')),
  args           JSONB NOT NULL,
  ok             BOOLEAN NOT NULL,
  result_summary TEXT NOT NULL,
  result         JSONB,
  duration_ms    INTEGER NOT NULL CHECK (duration_ms >= 0),
  at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, seq)
);

------------------------------------------------------------------
-- checklist_tasks: confirmed tasks only
-- Source references live in task_sources so they are real foreign keys.
------------------------------------------------------------------
CREATE TABLE checklist_tasks (
  id              TEXT PRIMARY KEY,
  doc_id          TEXT NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  description     TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 5 AND 300),
  deadline_date   DATE,
  deadline_text   TEXT,
  deadline_source TEXT NOT NULL DEFAULT 'none' CHECK (deadline_source IN ('document', 'user', 'none')),
  condition       TEXT CHECK (condition IS NULL OR length(trim(condition)) BETWEEN 1 AND 200),
  owner           TEXT CHECK (owner IS NULL OR length(trim(owner)) BETWEEN 1 AND 80),
  owner_source    TEXT NOT NULL DEFAULT 'none' CHECK (owner_source IN ('document', 'user', 'none')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  last_run_id     TEXT REFERENCES runs (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doc_id, id),
  CHECK (
    id ~ '^TSK-[0-9A-F]{4}$' OR
    id ~ '^TSK-[0-9A-F]{8}$'
  ),
  CHECK (
    (deadline_source = 'document' AND deadline_date IS NOT NULL AND deadline_text IS NOT NULL) OR
    (deadline_source = 'user'     AND deadline_date IS NOT NULL AND deadline_text IS NULL) OR
    (deadline_source = 'none'     AND deadline_date IS NULL     AND deadline_text IS NULL)
  ),
  CHECK (
    (owner_source = 'none' AND owner IS NULL) OR
    (owner_source IN ('document', 'user') AND owner IS NOT NULL)
  )
);

CREATE INDEX idx_tasks_doc_deadline ON checklist_tasks (doc_id, deadline_date);

------------------------------------------------------------------
-- task_sources: ordered paragraph references for each task
-- Composite keys make it impossible to cite a paragraph from another document.
-- ------------------------------------------------------------------
CREATE TABLE task_sources (
  task_id      TEXT NOT NULL,
  doc_id       TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  ord          INTEGER NOT NULL CHECK (ord BETWEEN 1 AND 6),
  PRIMARY KEY (task_id, paragraph_id),
  UNIQUE (task_id, ord),
  FOREIGN KEY (doc_id, task_id)      REFERENCES checklist_tasks (doc_id, id) ON DELETE CASCADE,
  FOREIGN KEY (doc_id, paragraph_id) REFERENCES paragraphs (doc_id, id)      ON DELETE CASCADE
);

CREATE INDEX idx_task_sources_paragraph ON task_sources (doc_id, paragraph_id);

------------------------------------------------------------------
-- save_events: one row per saved run
-- The primary key on run_id makes a second save fail inside the transaction
-- and roll the whole transaction back, so duplicates are impossible.
------------------------------------------------------------------
CREATE TABLE save_events (
  run_id     TEXT PRIMARY KEY REFERENCES runs (id) ON DELETE CASCADE,
  doc_id     TEXT NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  task_count INTEGER NOT NULL CHECK (task_count BETWEEN 1 AND 12),
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase exposes public through its REST API. RLS with no policies blocks
-- anon/authenticated access; the owner connection used by the app bypasses RLS.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_events ENABLE ROW LEVEL SECURITY;
