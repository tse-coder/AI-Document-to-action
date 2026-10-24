// =============================================
// API Client — Frontend fetch wrappers
// Owner: Member 2 (Frontend Engineer)
// =============================================

import type {
  Document,
  Paragraph,
  Run,
  CreateRunRequest,
  AnswerInput,
  ConfirmRequest,
  ConfirmResponse,
  ChecklistSummary,
  ChecklistDetail,
  ApiResponse,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.ok) {
    const err = new Error(json.error.message) as Error & {
      code: string;
      retryable: boolean;
      runId?: string;
      details: { field?: string; message: string }[];
    };
    err.code = json.error.code;
    err.retryable = json.error.retryable;
    err.runId = json.error.run_id;
    err.details = json.error.details;
    throw err;
  }

  return json.data;
}

// --- Documents ---

export async function getDocuments(): Promise<{ documents: Document[] }> {
  return request("/documents");
}

export async function getDocument(
  docId: string
): Promise<{ document: Document; paragraphs: Paragraph[] }> {
  return request(`/documents/${docId}`);
}

// --- Runs ---

export async function createRun(body: CreateRunRequest): Promise<{ run: Run }> {
  return request("/runs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRun(runId: string): Promise<{ run: Run }> {
  return request(`/runs/${runId}`);
}

export async function submitAnswers(
  runId: string,
  answers: AnswerInput[]
): Promise<{ run: Run }> {
  return request(`/runs/${runId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function retryRun(runId: string): Promise<{ run: Run }> {
  return request(`/runs/${runId}/retry`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function confirmRun(
  runId: string,
  body: ConfirmRequest
): Promise<ConfirmResponse> {
  return request(`/runs/${runId}/confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// --- Checklists ---

export async function getChecklists(): Promise<{
  checklists: ChecklistSummary[];
}> {
  return request("/checklists");
}

export async function getChecklist(docId: string): Promise<ChecklistDetail> {
  return request(`/checklists/${docId}`);
}
