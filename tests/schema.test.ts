import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { N1_TITLE } from "./support/fixtures";
import { resetSql, schemaSql, seedSql } from "./support/sql";

describe("SQL schema contract", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
  });

  beforeEach(async () => {
    await db.exec(resetSql);
    await db.exec(schemaSql);
    await db.exec(seedSql);
  });

  afterAll(async () => {
    await db.close();
  });

  it("creates the eight documented tables", async () => {
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name`
    );
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      "checklist_tasks",
      "documents",
      "paragraphs",
      "run_questions",
      "runs",
      "save_events",
      "task_sources",
      "tool_calls",
    ]);
  });

  it("seeds the documented row counts", async () => {
    const counts = await db.query<{
      documents: number;
      paragraphs: number;
      tasks: number;
      sources: number;
    }>(`SELECT
          (SELECT count(*)::int FROM documents) AS documents,
          (SELECT count(*)::int FROM paragraphs) AS paragraphs,
          (SELECT count(*)::int FROM checklist_tasks) AS tasks,
          (SELECT count(*)::int FROM task_sources) AS sources`);

    expect(counts.rows[0]).toEqual({
      documents: 2,
      paragraphs: 11,
      tasks: 2,
      sources: 2,
    });
  });

  it("is idempotent when the seed is applied twice", async () => {
    await db.exec(seedSql);
    const counts = await db.query<{ paragraphs: number; tasks: number }>(
      `SELECT
         (SELECT count(*)::int FROM paragraphs) AS paragraphs,
         (SELECT count(*)::int FROM checklist_tasks) AS tasks`
    );
    expect(counts.rows[0]).toEqual({ paragraphs: 11, tasks: 2 });
  });

  it("seeds both demo documents and keeps N1 paragraphs in order", async () => {
    const docs = await db.query<{
      id: string;
      title: string;
      origin: string;
    }>(`SELECT id, title, origin FROM documents ORDER BY id`);
    expect(docs.rows).toEqual([
      { id: "N1", title: N1_TITLE, origin: "demo" },
      {
        id: "N2",
        title: "Lab Equipment Borrowing Procedure",
        origin: "demo",
      },
    ]);

    const paragraphs = await db.query<{
      id: string;
      doc_id: string;
      position: number;
      text: string;
    }>(`SELECT id, doc_id, position, text
          FROM paragraphs
         WHERE doc_id = 'N1'
         ORDER BY position`);
    expect(paragraphs.rows).toHaveLength(5);
    expect(paragraphs.rows.map((row) => row.id)).toEqual([
      "N1-P1",
      "N1-P2",
      "N1-P3",
      "N1-P4",
      "N1-P5",
    ]);
    expect(paragraphs.rows[2].text).toContain("15 November 2026");
  });

  it("enables RLS on all eight tables", async () => {
    const rls = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT relname, relrowsecurity
         FROM pg_class
        WHERE relnamespace = 'public'::regnamespace
          AND relkind = 'r'
        ORDER BY relname`
    );
    expect(rls.rows).toHaveLength(8);
    expect(rls.rows.every((row) => row.relrowsecurity)).toBe(true);
  });

  it("creates no RLS policies", async () => {
    const policies = await db.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM pg_policies
        WHERE schemaname = 'public'`
    );
    expect(policies.rows[0].count).toBe(0);
  });

  it("makes paragraphs immutable", async () => {
    await expect(
      db.exec(`UPDATE paragraphs SET text = 'changed' WHERE id = 'N1-P1'`)
    ).rejects.toThrow(/immutable/i);
  });

  it("enforces the run status machine at the database boundary", async () => {
    await db.exec(`INSERT INTO runs (id, doc_id, status, request, round)
                   VALUES ('RUN-TEST0001', 'N1', 'running', 'test request', 1)`);

    await expect(
      db.exec(`UPDATE runs SET status = 'saved' WHERE id = 'RUN-TEST0001'`)
    ).rejects.toThrow(/invalid run status transition/i);

    await db.exec(
      `UPDATE runs SET status = 'needs_clarification' WHERE id = 'RUN-TEST0001'`
    );
    await db.exec(`UPDATE runs SET status = 'running' WHERE id = 'RUN-TEST0001'`);
    await db.exec(
      `UPDATE runs SET status = 'error',
                      error_code = 'MODEL_ERROR',
                      error_message = 'failed'
       WHERE id = 'RUN-TEST0001'`
    );

    await db.exec(
      `UPDATE runs SET status = 'error' WHERE id = 'RUN-TEST0001'`
    );
    const stored = await db.query<{ status: string }>(
      `SELECT status FROM runs WHERE id = 'RUN-TEST0001'`
    );
    expect(stored.rows[0].status).toBe("error");
  });

  it("rejects an impossible calendar date", async () => {
    await expect(
      db.exec(`INSERT INTO checklist_tasks
                 (id, doc_id, description, deadline_date, deadline_text,
                  deadline_source, owner, owner_source)
               VALUES
                 ('TSK-DEADBEEF', 'N1', 'A valid description',
                  '2026-02-30', NULL, 'none', NULL, 'none')`)
    ).rejects.toThrow();
  });

  it("rejects a document deadline without copied deadline text", async () => {
    await expect(
      db.exec(`INSERT INTO checklist_tasks
                 (id, doc_id, description, deadline_date, deadline_text,
                  deadline_source, owner, owner_source)
               VALUES
                 ('TSK-DEADBEEF', 'N1', 'A valid description',
                  NULL, '15 November 2026', 'document', NULL, 'none')`)
    ).rejects.toThrow();
  });

  it("rejects cross-document paragraph citations through composite FKs", async () => {
    await expect(
      db.exec(`INSERT INTO task_sources (task_id, doc_id, paragraph_id, ord)
               VALUES ('TSK-0001', 'N2', 'N2-P1', 1)`)
    ).rejects.toThrow();
  });

  it("rejects two save events for the same run", async () => {
    await db.exec(
      `INSERT INTO runs (id, doc_id, status, request, round)
       VALUES ('RUN-TEST0001', 'N1', 'running', 'test request', 1)`
    );
    await db.exec(
      `INSERT INTO save_events (run_id, doc_id, task_count)
       VALUES ('RUN-TEST0001', 'N1', 1)`
    );
    await expect(
      db.exec(
        `INSERT INTO save_events (run_id, doc_id, task_count)
         VALUES ('RUN-TEST0001', 'N1', 1)`
      )
    ).rejects.toThrow();
  });

  it("rejects a malformed pasted document id", async () => {
    await expect(
      db.exec(`INSERT INTO documents (id, title, origin)
               VALUES ('bad-id', 'Bad', 'pasted')`)
    ).rejects.toThrow();
  });

  it("rejects a non-array messages column", async () => {
    await expect(
      db.exec(`INSERT INTO runs (id, doc_id, request, messages)
               VALUES ('RUN-ABCD1234', 'N1', 'test request', '{}'::jsonb)`)
    ).rejects.toThrow(/jsonb_typeof|check/i);
  });

  it("resets the schema cleanly", async () => {
    await db.exec(resetSql);
    const result = await db.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('documents', 'paragraphs', 'runs')`
    );
    expect(result.rows[0].count).toBe(0);

    const funcs = await db.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM pg_proc
        WHERE proname IN ('paragraphs_immutable_fn', 'runs_status_guard_fn')`
    );
    expect(funcs.rows[0].count).toBe(0);
  });
});
