import { randomBytes } from "node:crypto";
import { sql } from "./connection";
import type {
  ChecklistDetail,
  ChecklistSummary,
  Document,
  Paragraph,
  Question,
  ReadChecklistResult,
  ReadChecklistTask,
  Run,
  RunStatus,
  SearchResult,
  TaskBase,
  ToolLogEntry,
} from "../types";

const runId = () => `RUN-${randomBytes(4).toString("hex").toUpperCase()}`;
const taskId = () => `TSK-${randomBytes(4).toString("hex").toUpperCase()}`;
const pastedDocId = () => `U-${randomBytes(3).toString("hex").toUpperCase()}`;
const utc = (column: string) =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "in", "is", "it", "of", "on", "or", "the", "to", "with", "who",
]);

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function documentFromRow(row: Record<string, unknown>): Document {
  return {
    doc_id: String(row.doc_id),
    title: String(row.title),
    origin: row.origin as Document["origin"],
    paragraph_count: Number(row.paragraph_count),
    created_at: String(row.created_at),
  };
}

// --- Document queries ---

export async function getDocuments(): Promise<Document[]> {
  const rows = await sql`
    SELECT d.id AS doc_id, d.title, d.origin,
           (SELECT count(*)::int FROM paragraphs p WHERE p.doc_id = d.id) AS paragraph_count,
           ${sql.unsafe(utc("d.created_at"))} AS created_at
    FROM documents d
    ORDER BY CASE WHEN d.origin = 'demo' THEN 0 ELSE 1 END,
             CASE WHEN d.origin = 'pasted' THEN d.created_at END DESC,
             d.id
  `;
  return rows.map((row) => documentFromRow(row));
}

export async function getDocumentWithParagraphs(
  docId: string
): Promise<{ doc: Document; paragraphs: Paragraph[] } | null> {
  const [docRow] = await sql`
    SELECT d.id AS doc_id, d.title, d.origin,
           (SELECT count(*)::int FROM paragraphs p WHERE p.doc_id = d.id) AS paragraph_count,
           ${sql.unsafe(utc("d.created_at"))} AS created_at
    FROM documents d WHERE d.id = ${docId}
  `;
  if (!docRow) return null;

  const paragraphRows = await sql`
    SELECT id AS paragraph_id, position, text
    FROM paragraphs WHERE doc_id = ${docId} ORDER BY position
  `;
  return {
    doc: documentFromRow(docRow),
    paragraphs: paragraphRows.map((row) => ({
      paragraph_id: String(row.paragraph_id),
      position: Number(row.position),
      text: String(row.text),
    })),
  };
}

export async function createDocument(text: string, title?: string): Promise<Document> {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 1 || paragraphs.length > 40) {
    throw new Error("Pasted text must contain between 1 and 40 paragraphs.");
  }
  const rawTitle = title?.trim() || text.trim().slice(0, 40);
  const safeTitle = rawTitle.slice(0, 80);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = pastedDocId();
    try {
      await sql.begin(async (tx) => {
        await tx`INSERT INTO documents (id, title, origin) VALUES (${id}, ${safeTitle}, 'pasted')`;
        await tx`
          INSERT INTO paragraphs (id, doc_id, position, text)
          SELECT ${id} || '-P' || item.position, ${id}, item.position, item.text
          FROM unnest(${tx.array(paragraphs)}::text[]) WITH ORDINALITY AS item(text, position)
        `;
        await tx`
          WITH pasted_count AS (
            SELECT count(*)::int AS total FROM documents WHERE origin = 'pasted'
          ), oldest_unsaved AS (
            SELECT d.id
            FROM documents d
            WHERE d.origin = 'pasted'
              AND NOT EXISTS (SELECT 1 FROM checklist_tasks t WHERE t.doc_id = d.id)
            ORDER BY d.created_at ASC, d.id ASC
            LIMIT GREATEST((SELECT total - 200 FROM pasted_count), 0)
          )
          DELETE FROM documents d
          WHERE d.id IN (SELECT id FROM oldest_unsaved)
        `;
      });
      const created = await getDocumentWithParagraphs(id);
      if (!created) throw new Error("New document could not be read after insert.");
      return created.doc;
    } catch (error) {
      if (attempt === 2 || !(error instanceof Error) || !error.message.includes("duplicate key")) {
        throw error;
      }
    }
  }
  throw new Error("Could not allocate a document ID.");
}

// --- Search and checklist tools ---

export async function searchDocument(
  docId: string,
  query: string,
  maxResults = 5
): Promise<SearchResult> {
  const rows = await sql`
    SELECT id AS paragraph_id, position, text
    FROM paragraphs WHERE doc_id = ${docId} ORDER BY position
  `;
  const terms = [...new Set(
    query.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [],
  )].filter((term) => !STOP_WORDS.has(term));
  const matches = rows
    .map((row) => {
      const content = String(row.text).toLocaleLowerCase();
      const contentTerms = new Set(content.match(/[\p{L}\p{N}]+/gu) ?? []);
      const score = terms.reduce((sum, term) => sum + (contentTerms.has(term) ? 1 : 0), 0);
      return {
        paragraph_id: String(row.paragraph_id),
        position: Number(row.position),
        text: String(row.text),
        score,
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, Math.max(1, Math.min(8, maxResults)));
  return { doc_id: docId, total_paragraphs: rows.length, matches };
}

export async function readChecklist(docId: string): Promise<ReadChecklistResult> {
  const rows = await sql`
    SELECT id AS task_id, description, deadline_date, deadline_text,
           condition, owner, status
    FROM checklist_tasks
    WHERE doc_id = ${docId}
    ORDER BY deadline_date IS NULL, deadline_date, id
  `;
  const sources = await sql`
    SELECT task_id, paragraph_id FROM task_sources
    WHERE doc_id = ${docId} ORDER BY task_id, ord
  `;
  const refs = new Map<string, string[]>();
  for (const row of sources) {
    const key = String(row.task_id);
    refs.set(key, [...(refs.get(key) ?? []), String(row.paragraph_id)]);
  }
  const tasks: ReadChecklistTask[] = rows.map((row) => ({
    task_id: String(row.task_id),
    description: String(row.description),
    source_refs: refs.get(String(row.task_id)) ?? [],
    deadline_date: row.deadline_date ? String(row.deadline_date) : null,
    deadline_text: row.deadline_text == null ? null : String(row.deadline_text),
    condition: row.condition == null ? null : String(row.condition),
    owner: row.owner == null ? null : String(row.owner),
    status: row.status as ReadChecklistTask["status"],
  }));
  return { doc_id: docId, tasks };
}

// --- Run reads and writes ---

export async function createRun(
  docId: string,
  request: string,
  simulateFailure: "none" | "model" | "tool" = "none"
): Promise<Run> {
  const id = runId();
  await sql`
    INSERT INTO runs (id, doc_id, request, round, simulate_failure)
    VALUES (${id}, ${docId}, ${request}, 1, ${simulateFailure})
  `;
  const run = await getRunById(id);
  if (!run) throw new Error("New run could not be read after insert.");
  return run;
}

export async function getRunById(id: string): Promise<Run | null> {
  const [row] = await sql`
    SELECT r.id AS run_id, r.doc_id, r.status, r.request, r.round, r.retry_count,
           r.proposal, r.error_code, r.error_message,
           r.model_turns_used, r.tool_calls_used, r.limit_hit,
           r.created_at, r.updated_at, r.messages,
           ${sql.unsafe(utc("r.created_at"))} AS created_at_iso,
           ${sql.unsafe(utc("r.updated_at"))} AS updated_at_iso
    FROM runs r WHERE r.id = ${id}
  `;
  if (!row) return null;
  const questionRows = await sql`
    SELECT question_id, field, task_client_id, text, source_refs, allow_not_stated
    FROM run_questions WHERE run_id = ${id} AND answered_at IS NULL ORDER BY round, question_id
  `;
  const logRows = await sql`
    SELECT seq, phase, tool, args, ok, result_summary, result, duration_ms,
           ${sql.unsafe(utc("at"))} AS at
    FROM tool_calls WHERE run_id = ${id} ORDER BY seq
  `;
  const status = row.status as RunStatus;
  return {
    run_id: String(row.run_id),
    doc_id: String(row.doc_id),
    status,
    request: String(row.request),
    round: Number(row.round),
    retry_count: Number(row.retry_count),
    created_at: String(row.created_at_iso),
    updated_at: String(row.updated_at_iso),
    questions: questionRows.map((q) => ({
      question_id: String(q.question_id),
      field: q.field as Question["field"],
      task_client_id: String(q.task_client_id),
      text: String(q.text),
      source_refs: q.source_refs as string[],
      allow_not_stated: Boolean(q.allow_not_stated),
    })),
    proposal: status === "awaiting_approval" || status === "saved" ? row.proposal : null,
    tool_log: logRows.map((entry) => ({
      seq: Number(entry.seq),
      phase: entry.phase as ToolLogEntry["phase"],
      tool: String(entry.tool),
      args: entry.args as Record<string, unknown>,
      ok: Boolean(entry.ok),
      result_summary: String(entry.result_summary),
      result: (entry.result ?? null) as Record<string, unknown> | null,
      duration_ms: Number(entry.duration_ms),
      at: String(entry.at),
    })),
    limits: {
      max_model_turns: 4,
      max_tool_calls: 6,
      max_clarification_rounds: 2,
      model_turns_used: Number(row.model_turns_used),
      tool_calls_used: Number(row.tool_calls_used),
      limit_hit: Boolean(row.limit_hit),
    },
    error: row.error_code
      ? { code: String(row.error_code), message: String(row.error_message) }
      : null,
  };
}

export async function getRunAgentContext(
  id: string,
): Promise<{
  messages: unknown[];
  simulateFailure: "none" | "model" | "tool";
  answers: { questionId: string; answer: string; notStated: boolean }[];
} | null> {
  const [row] = await sql`SELECT messages, simulate_failure FROM runs WHERE id = ${id}`;
  if (!row) return null;
  const questionRows = await sql`
    SELECT question_id, answer, not_stated
    FROM run_questions
    WHERE run_id = ${id} AND answered_at IS NOT NULL
    ORDER BY substring(question_id from 2)::int
  `;
  return {
    messages: (row.messages as unknown[]) ?? [],
    simulateFailure: row.simulate_failure as "none" | "model" | "tool",
    answers: questionRows.map((q) => ({
      questionId: String(q.question_id),
      answer: q.answer == null ? "" : String(q.answer),
      notStated: Boolean(q.not_stated),
    })),
  };
}

export interface RunUpdate {
  status?: RunStatus;
  round?: number;
  retry_count?: number;
  simulate_failure?: "none" | "model" | "tool";
  messages?: unknown[];
  model_turns_used?: number;
  tool_calls_used?: number;
  limit_hit?: boolean;
  proposal_version?: number;
  proposal?: unknown | null;
  error_code?: string | null;
  error_message?: string | null;
}

const RUN_COLUMNS: Record<keyof RunUpdate, string> = {
  status: "status",
  round: "round",
  retry_count: "retry_count",
  simulate_failure: "simulate_failure",
  messages: "messages",
  model_turns_used: "model_turns_used",
  tool_calls_used: "tool_calls_used",
  limit_hit: "limit_hit",
  proposal_version: "proposal_version",
  proposal: "proposal",
  error_code: "error_code",
  error_message: "error_message",
};

export async function updateRun(id: string, data: RunUpdate): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key in RUN_COLUMNS) {
      const column = RUN_COLUMNS[key as keyof RunUpdate];
      if (key === "messages" || key === "proposal") {
        updates[column] = value == null ? null : sql.json(value as any);
      } else {
        updates[column] = value;
      }
    }
  }
  if (Object.keys(updates).length === 0) return;
  await sql`UPDATE runs SET ${sql(updates)}, updated_at = now() WHERE id = ${id}`;
}

export async function appendRunOutput(
  id: string,
  params: {
    status: RunStatus;
    round: number;
    proposal: unknown | null;
    questions: Question[];
    toolLog: ToolLogEntry[];
    messages: unknown[];
    limitsUsed: { modelTurns: number; toolCalls: number; limitHit?: boolean };
    error: { code: string; message: string } | null;
    finalizeCalled?: boolean;
  },
): Promise<void> {
  await sql.begin(async (tx) => {
    const [run] = await tx`SELECT proposal_version FROM runs WHERE id = ${id} FOR UPDATE`;
    if (!run) throw new Error("RUN_NOT_FOUND");
    const finalized = params.finalizeCalled ?? params.status !== "error";
    const proposalVersion = Number(run.proposal_version) + (finalized ? 1 : 0);
    const boundedMessages = boundMessages(params.messages);
    const storedProposal = params.proposal && typeof params.proposal === "object"
      ? { ...(params.proposal as Record<string, unknown>), version: proposalVersion }
      : null;
    const [maxQuestion] = await tx`
      SELECT COALESCE(MAX(substring(question_id from 2)::int), 0)::int AS n
      FROM run_questions WHERE run_id = ${id}
    `;
    const firstQuestion = Number(maxQuestion.n) + 1;
    await tx`
      UPDATE runs SET status = ${params.status}, round = ${params.round},
        proposal = ${storedProposal == null ? null : tx.json(storedProposal as any)},
        proposal_version = ${proposalVersion},
        messages = ${tx.json(boundedMessages as any)},
        model_turns_used = ${params.limitsUsed.modelTurns},
        tool_calls_used = ${params.limitsUsed.toolCalls},
        limit_hit = ${params.limitsUsed.limitHit ?? false},
        error_code = ${params.error?.code ?? null},
        error_message = ${params.error?.message ?? null},
        updated_at = now()
      WHERE id = ${id}
    `;
    for (const [index, question] of params.questions.entries()) {
      const qid = `Q${firstQuestion + index}`;
      await tx`
        INSERT INTO run_questions
          (run_id, question_id, round, field, task_client_id, text, source_refs, allow_not_stated)
        VALUES (${id}, ${qid}, ${params.round}, ${question.field}, ${question.task_client_id},
          ${question.text}, ${tx.json(question.source_refs as any)}, ${question.allow_not_stated})
      `;
    }
    const [lastLog] = await tx`SELECT COALESCE(MAX(seq), 0)::int AS n FROM tool_calls WHERE run_id = ${id}`;
    for (const [index, entry] of params.toolLog.entries()) {
      await tx`
        INSERT INTO tool_calls
          (run_id, seq, phase, tool, args, ok, result_summary, result, duration_ms, at)
        VALUES (${id}, ${Number(lastLog.n) + index + 1}, ${entry.phase}, ${entry.tool},
          ${tx.json(entry.args as any)}, ${entry.ok}, ${entry.result_summary},
          ${entry.result == null ? null : tx.json(entry.result as any)},
          ${entry.duration_ms}, ${entry.at}::timestamptz)
      `;
    }
  });
}

function boundMessages(messages: unknown[]): unknown[] {
  let bounded = [...messages];
  const length = () => JSON.stringify(bounded).length;
  const replaceContent = (index: number) => {
    const message = bounded[index];
    if (message && typeof message === "object") {
      bounded[index] = {
        ...(message as Record<string, unknown>),
        content: "[Earlier model or tool output omitted to fit run storage limit]",
      };
    }
  };
  while (length() > 390_000) {
    const toolResult = bounded.findIndex((message, index) => {
      if (index === 0 || !message || typeof message !== "object") return false;
      const role = (message as { role?: unknown }).role;
      return (role === "tool" || role === "function") &&
        (message as { content?: unknown }).content !== "[Earlier model or tool output omitted to fit run storage limit]";
    });
    if (toolResult >= 0) {
      replaceContent(toolResult);
      continue;
    }
    const olderAssistant = bounded.findIndex((message, index) => {
      if (index === 0 || index === bounded.length - 1 || !message || typeof message !== "object") return false;
      return (message as { role?: unknown }).role === "assistant" &&
        (message as { content?: unknown }).content !== "[Earlier model or tool output omitted to fit run storage limit]";
    });
    if (olderAssistant >= 0) {
      replaceContent(olderAssistant);
      continue;
    }
    const removable = bounded.findIndex((_, index) => index > 0 && index < bounded.length - 1);
    if (removable >= 0) {
      bounded.splice(removable, 1);
      continue;
    }
    if (bounded.length > 1) replaceContent(bounded.length - 1);
    else replaceContent(0);
    if (length() > 390_000) bounded = bounded.slice(0, 1);
    if (length() > 390_000) break;
  }
  if (length() > 390_000) {
    bounded = [
      { role: "system", content: "Earlier model and tool context was truncated to the database storage limit." },
      { role: "user", content: "Continue using the persisted run request, document, and answers." },
    ];
  }
  return bounded;
}

export async function staleRunToError(id: string): Promise<void> {
  await sql`
    UPDATE runs SET status = 'error', error_code = 'MODEL_TIMEOUT',
      error_message = 'The model did not respond in time. Retry.', updated_at = now()
    WHERE id = ${id} AND status = 'running'
      AND updated_at < now() - interval '90 seconds'
  `;
}

export async function beginRunRetry(id: string): Promise<Run | null> {
  const rows = await sql`
    UPDATE runs SET status = 'running', retry_count = retry_count + 1,
      simulate_failure = 'none', model_turns_used = 0, tool_calls_used = 0,
      limit_hit = false, error_code = NULL, error_message = NULL, updated_at = now()
    WHERE id = ${id} AND status = 'error' AND retry_count < 3
    RETURNING id
  `;
  if (!rows.length) return null;
  return getRunById(id);
}

export async function recordAnswers(
  id: string,
  answers: { question_id: string; answer: string; not_stated: boolean }[],
): Promise<void> {
  await sql.begin(async (tx) => {
    const [run] = await tx`SELECT messages FROM runs WHERE id = ${id} FOR UPDATE`;
    if (!run) throw new Error("RUN_NOT_FOUND");
    for (const answer of answers) {
      const [row] = await tx`
        UPDATE run_questions SET answer = ${answer.not_stated ? null : answer.answer},
          not_stated = ${answer.not_stated}, answered_at = now()
        WHERE run_id = ${id} AND question_id = ${answer.question_id} AND answered_at IS NULL
        RETURNING question_id
      `;
      if (!row) throw new Error("ANSWER_NOT_OPEN");
    }
    const answerMessage = {
      role: "user",
      content: answers.map((answer) =>
        answer.not_stated
          ? `${answer.question_id}: The user acknowledged this information is not stated.`
          : `${answer.question_id}: ${answer.answer}`,
      ).join("\n"),
    };
    const messages = boundMessages([...(run.messages as unknown[]), answerMessage]);
    await tx`UPDATE runs SET status = 'running', messages = ${tx.json(messages as any)},
      model_turns_used = 0, tool_calls_used = 0, limit_hit = false,
      updated_at = now() WHERE id = ${id}`;
  });
}

// --- Saved checklist reads ---

export async function getChecklists(): Promise<ChecklistSummary[]> {
  const rows = await sql`
    SELECT d.id AS doc_id, d.title, count(t.id)::int AS task_count,
           ${sql.unsafe(utc("max(t.updated_at)"))} AS last_saved_at
    FROM documents d JOIN checklist_tasks t ON t.doc_id = d.id
    GROUP BY d.id, d.title ORDER BY max(t.updated_at) DESC, d.id
  `;
  return rows.map((row) => ({
    doc_id: String(row.doc_id), title: String(row.title),
    task_count: Number(row.task_count), last_saved_at: String(row.last_saved_at),
  }));
}

export async function getChecklist(docId: string): Promise<ChecklistDetail | null> {
  const [doc] = await sql`SELECT id AS doc_id, title FROM documents WHERE id = ${docId}`;
  if (!doc) return null;
  const tasks = await sql`
    SELECT t.id AS task_id, t.doc_id, t.description, t.deadline_date, t.deadline_text,
      t.deadline_source, t.condition, t.owner, t.owner_source, t.status,
      ${sql.unsafe(utc("t.updated_at"))} AS updated_at
    FROM checklist_tasks t WHERE t.doc_id = ${docId}
    ORDER BY t.deadline_date IS NULL, t.deadline_date, t.id
  `;
  const sources = await sql`
    SELECT ts.task_id, ts.paragraph_id, p.text
    FROM task_sources ts JOIN paragraphs p ON p.doc_id = ts.doc_id AND p.id = ts.paragraph_id
    WHERE ts.doc_id = ${docId} ORDER BY ts.task_id, ts.ord
  `;
  const byTask = new Map<string, { paragraph_id: string; text: string }[]>();
  for (const row of sources) {
    const key = String(row.task_id);
    byTask.set(key, [...(byTask.get(key) ?? []), {
      paragraph_id: String(row.paragraph_id), text: String(row.text),
    }]);
  }
  const [lastSaved] = await sql`
    SELECT ${sql.unsafe(utc("max(updated_at)"))} AS last_saved_at
    FROM checklist_tasks WHERE doc_id = ${docId}
  `;
  return {
    doc_id: String(doc.doc_id), title: String(doc.title),
    last_saved_at: lastSaved?.last_saved_at == null ? null : String(lastSaved.last_saved_at),
    tasks: tasks.map((row) => ({
      task_id: String(row.task_id), doc_id: String(row.doc_id),
      description: String(row.description), source_refs: (byTask.get(String(row.task_id)) ?? []).map((s) => s.paragraph_id),
      deadline_date: row.deadline_date == null ? null : String(row.deadline_date),
      deadline_text: row.deadline_text == null ? null : String(row.deadline_text),
      deadline_source: row.deadline_source as TaskBase["deadline_source"],
      condition: row.condition == null ? null : String(row.condition),
      owner: row.owner == null ? null : String(row.owner),
      owner_source: row.owner_source as TaskBase["owner_source"],
      status: row.status as "open" | "done", updated_at: String(row.updated_at),
      sources: byTask.get(String(row.task_id)) ?? [],
    })),
  };
}

export interface SaveResult {
  saved_at: string;
  saved: { client_id: string; task_id: string; action: TaskBase["action"] }[];
}

export async function saveChecklist(
  runIdValue: string,
  docId: string,
  proposalVersion: number,
  tasks: TaskBase[],
): Promise<SaveResult> {
  const startedAt = Date.now();
  return sql.begin(async (tx) => {
    const [run] = await tx`
      SELECT status, proposal_version FROM runs
      WHERE id = ${runIdValue} AND doc_id = ${docId}
      FOR UPDATE
    `;
    if (!run) throw new Error("RUN_NOT_FOUND");
    if (run.status === "saved") throw new Error("ALREADY_SAVED");
    if (run.status !== "awaiting_approval") throw new Error("RUN_NOT_AWAITING_APPROVAL");
    if (Number(run.proposal_version) !== proposalVersion) throw new Error("STALE_PROPOSAL");

    const [event] = await tx`
      INSERT INTO save_events (run_id, doc_id, task_count)
      VALUES (${runIdValue}, ${docId}, ${tasks.length})
      RETURNING ${sql.unsafe(utc("saved_at"))} AS saved_at
    `;
    const saved: SaveResult["saved"] = [];
    for (const task of tasks) {
      const id = task.action === "create" ? taskId() : task.task_id;
      if (!id) throw new Error("UPDATE_TARGET_NOT_FOUND");
      if (task.action === "create") {
        await tx`
          INSERT INTO checklist_tasks
            (id, doc_id, description, deadline_date, deadline_text, deadline_source,
             condition, owner, owner_source, last_run_id)
          VALUES (${id}, ${docId}, ${task.description}, ${task.deadline_date}, ${task.deadline_text},
             ${task.deadline_source}, ${task.condition}, ${task.owner}, ${task.owner_source}, ${runIdValue})
        `;
      } else {
        const updated = await tx`
          UPDATE checklist_tasks SET description = ${task.description}, deadline_date = ${task.deadline_date},
            deadline_text = ${task.deadline_text}, deadline_source = ${task.deadline_source},
            condition = ${task.condition}, owner = ${task.owner}, owner_source = ${task.owner_source},
            last_run_id = ${runIdValue}, updated_at = now()
          WHERE id = ${id} AND doc_id = ${docId} RETURNING id
        `;
        if (!updated.length) throw new Error("UPDATE_TARGET_NOT_FOUND");
        await tx`DELETE FROM task_sources WHERE task_id = ${id} AND doc_id = ${docId}`;
      }
      for (const [index, paragraphId] of task.source_refs.entries()) {
        await tx`
          INSERT INTO task_sources (task_id, doc_id, paragraph_id, ord)
          VALUES (${id}, ${docId}, ${paragraphId}, ${index + 1})
        `;
      }
      saved.push({ client_id: task.client_id, task_id: id, action: task.action });
    }
    const [lastLog] = await tx`SELECT COALESCE(MAX(seq), 0)::int AS n FROM tool_calls WHERE run_id = ${runIdValue}`;
    await tx`
      INSERT INTO tool_calls
        (run_id, seq, phase, tool, args, ok, result_summary, result, duration_ms, at)
      VALUES (${runIdValue}, ${Number(lastLog.n) + 1}, 'gate', 'save_checklist_changes',
        ${tx.json({ run_id: runIdValue, doc_id: docId, tasks } as any)},
        true, ${`${saved.length} task${saved.length === 1 ? "" : "s"} saved`},
        ${tx.json({ saved, saved_at: event.saved_at } as any)},
        ${Math.max(0, Date.now() - startedAt)}, now())
    `;
    const [updatedRun] = await tx`
      UPDATE runs SET status = 'saved', updated_at = now()
      WHERE id = ${runIdValue} AND doc_id = ${docId} AND status = 'awaiting_approval'
      RETURNING id
    `;
    if (!updatedRun) throw new Error("RUN_NOT_AWAITING_APPROVAL");
    return { saved_at: String(event.saved_at), saved };
  });
}
