-- Development reset. Drops everything created by schema.sql.
-- Never run on the judged deployment.
DROP TABLE IF EXISTS save_events;
DROP TABLE IF EXISTS task_sources;
DROP TABLE IF EXISTS checklist_tasks;
DROP TABLE IF EXISTS tool_calls;
DROP TABLE IF EXISTS run_questions;
DROP TABLE IF EXISTS runs;
DROP TABLE IF EXISTS paragraphs;
DROP TABLE IF EXISTS documents;
DROP FUNCTION IF EXISTS runs_status_guard_fn();
DROP FUNCTION IF EXISTS paragraphs_immutable_fn();
