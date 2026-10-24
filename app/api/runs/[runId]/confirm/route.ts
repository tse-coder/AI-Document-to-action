// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/confirm — Approve and save the checklist

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as chrono from "chrono-node";
import { ApiRequestError, apiError, errorResponse, parseJson } from "../../../../../lib/api-response";
import { getDocumentWithParagraphs, getRunById, readChecklist, saveChecklist } from "../../../../../lib/db/queries";
import { validateProposal } from "../../../../../lib/agent/validator";
import type { TaskBase, ValidationIssue } from "../../../../../lib/types";

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const taskSchema = z.object({
  client_id: z.string().regex(/^C\d+$/u),
  action: z.enum(["create", "update"]),
  task_id: z.string().nullable(),
  description: z.string(),
  source_refs: z.array(z.string().min(1)),
  deadline_date: z.string().nullable(),
  deadline_text: z.string().nullable(),
  deadline_source: z.enum(["document", "user", "none"]),
  condition: z.string().nullable(),
  owner: z.string().nullable(),
  owner_source: z.enum(["document", "user", "none"]),
}).strict().superRefine((task, ctx) => {
  if (new Set(task.source_refs).size !== task.source_refs.length) {
    ctx.addIssue({ code: "custom", path: ["source_refs"], message: "Source paragraph references must be unique." });
  }
  if (task.action === "create" && task.task_id !== null) {
    ctx.addIssue({ code: "custom", path: ["task_id"], message: "Create tasks must have a null task_id." });
  }
  if (task.action === "update" && task.task_id === null) {
    ctx.addIssue({ code: "custom", path: ["task_id"], message: "Update tasks must identify an existing task." });
  }
});

const confirmSchema = z.object({
  proposal_version: z.number().int().positive(),
  tasks: z.array(taskSchema).max(12),
}).strict();

function issue(code: string, task: TaskBase, message: string): ValidationIssue {
  return { code, severity: "error", task_client_id: task.client_id, message };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  let runExists = false;
  let saving = false;

  try {
    const run = await getRunById(runId);
    if (!run) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
    runExists = true;
    if (run.status === "saved") throw new ApiRequestError("ALREADY_SAVED", "This run has already been saved.", 409);
    if (run.status !== "awaiting_approval") {
      throw new ApiRequestError("RUN_NOT_AWAITING_APPROVAL", "Run is not ready for approval.", 409);
    }

    const raw = await parseJson(request);
    if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
        typeof (raw as Record<string, unknown>).proposal_version !== "number" ||
        !Number.isInteger((raw as Record<string, unknown>).proposal_version)) {
      throw new ApiRequestError("INVALID_REQUEST", "proposal_version must be an integer.", 400, [
        { field: "proposal_version", message: "A proposal version is required." },
      ]);
    }
    if (!run.proposal || (raw as Record<string, unknown>).proposal_version !== run.proposal.version) {
      throw new ApiRequestError("STALE_PROPOSAL", "The proposal changed. Reload it before saving.", 409);
    }
    const parsed = confirmSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiRequestError("INVALID_REQUEST", "The confirmation payload is invalid.", 400,
        parsed.error.issues.map((item) => ({ field: item.path.join("."), message: item.message })));
    }
    if (parsed.data.tasks.length === 0) {
      throw new ApiRequestError("NO_TASKS", "Choose at least one task to save.", 422);
    }
    const tasks = parsed.data.tasks as TaskBase[];
    const clientIds = tasks.map((task) => task.client_id);
    if (new Set(clientIds).size !== clientIds.length) {
      throw new ApiRequestError("INVALID_REQUEST", "client_id values must be unique.", 400, [
        { field: "tasks", message: "Every task needs a unique client_id." },
      ]);
    }

    const [document, existing] = await Promise.all([
      getDocumentWithParagraphs(run.doc_id),
      readChecklist(run.doc_id),
    ]);
    if (!document) throw new ApiRequestError("DOCUMENT_NOT_FOUND", "Document not found.", 404);
    const paragraphMap = new Map(document.paragraphs.map((paragraph) => [paragraph.paragraph_id, paragraph.text]));
    const issues: ValidationIssue[] = [];
    for (const task of tasks) {
      if (task.source_refs.length === 0) issues.push(issue("NO_SOURCE_REFS", task, "Task must cite at least one paragraph."));
      for (const ref of task.source_refs) {
        if (!paragraphMap.has(ref)) issues.push(issue("UNKNOWN_PARAGRAPH", task, `Paragraph ${ref} does not exist in this document.`));
      }
      if (task.action === "update" && !existing.tasks.some((saved) => saved.task_id === task.task_id)) {
        issues.push(issue("UPDATE_TARGET_NOT_FOUND", task, `Task ${task.task_id ?? ""} is not in this document's checklist.`));
      }
      if (task.deadline_source === "document" && task.deadline_text) {
        const cited = task.source_refs.map((ref) => paragraphMap.get(ref) ?? "").join(" ");
        if (!cited.includes(task.deadline_text)) {
          issues.push(issue("DEADLINE_NOT_IN_SOURCE", task, `Deadline text '${task.deadline_text}' is not in the cited paragraphs.`));
        }
        const parsedDeadline = chrono.strict.parseDate(task.deadline_text, {
          instant: new Date(), timezone: 0,
        });
        const parsedDate = parsedDeadline?.toISOString().slice(0, 10) ?? null;
        if (!parsedDate || parsedDate !== task.deadline_date) {
          issues.push(issue("DEADLINE_DATE_MISMATCH", task, "Deadline date does not match the date parsed from the cited deadline text."));
        }
      }
    }
    const validator = validateProposal({
      tasks,
      paragraphIds: [...paragraphMap.keys()],
      paragraphTexts: paragraphMap,
      existingTaskIds: existing.tasks.map((task) => task.task_id),
    });
    issues.push(...validator.issues.filter((item) => item.severity === "error"));
    const uniqueErrors = [...new Map(issues.map((item) => [`${item.code}:${item.task_client_id}`, item])).values()];
    const questionIssues = validator.issues.filter((item) => item.severity === "question");
    if (questionIssues.length === 0) {
      for (const question of validator.questions) {
        questionIssues.push({
          code: question.field === "owner" ? "MISSING_OWNER" : "MISSING_DEADLINE",
          severity: "question",
          task_client_id: question.task_client_id,
          message: question.text,
        });
      }
    }
    if (uniqueErrors.length || questionIssues.length) {
      const allIssues = [...uniqueErrors, ...questionIssues];
      throw new ApiRequestError(
        "VALIDATION_FAILED",
        `${allIssues.length} problem${allIssues.length === 1 ? "" : "s"} must be fixed before saving.`,
        422,
        allIssues,
      );
    }

    saving = true;
    const result = await saveChecklist(runId, run.doc_id, parsed.data.proposal_version, tasks);
    return NextResponse.json({
      ok: true,
      data: {
        run_id: runId,
        status: "saved",
        doc_id: run.doc_id,
        saved_at: result.saved_at,
        saved: result.saved,
        warnings: validator.issues.filter((item) => item.severity === "warning"),
        reopen_path: `/api/checklists/${run.doc_id}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_SAVED") {
      return NextResponse.json({ ok: false, error: {
        code: "ALREADY_SAVED", message: "This run has already been saved.", retryable: false, run_id: runId, details: [],
      } }, { status: 409 });
    }
    if (error instanceof Error && error.message === "RUN_NOT_AWAITING_APPROVAL") {
      return NextResponse.json({ ok: false, error: {
        code: "RUN_NOT_AWAITING_APPROVAL", message: "Run is not ready for approval.", retryable: false, run_id: runId, details: [],
      } }, { status: 409 });
    }
    if (error instanceof Error && error.message === "STALE_PROPOSAL") {
      return NextResponse.json({ ok: false, error: {
        code: "STALE_PROPOSAL", message: "The proposal changed. Reload it before saving.", retryable: false, run_id: runId, details: [],
      } }, { status: 409 });
    }
    if (error instanceof Error && error.message === "RUN_NOT_FOUND") {
      return errorResponse(new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404));
    }
    if (error instanceof ApiRequestError) {
      return errorResponse(error, "The checklist could not be saved.", runExists ? runId : undefined);
    }
    if (saving) {
      return apiError("TOOL_FAILURE", "The checklist could not be saved. Nothing was saved.", 500, {
        retryable: true,
        run_id: runId,
      });
    }
    return errorResponse(error, "The checklist could not be saved.", runExists ? runId : undefined);
  }
}
