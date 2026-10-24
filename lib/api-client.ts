// =============================================
// API Client — Frontend fetch wrappers (FE-04)
// Owner: Member 2 (Frontend Engineer)
// Source of truth: docs/api-spec.md
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

import {
  mockDocuments,
  mockParagraphsByDocId,
  mockParagraphsN1,
  mockRunNeedsClarification,
  mockRunAwaitingApproval,
  mockRunError,
  mockChecklists,
  mockChecklistDetailsByDocId,
  mockConfirmResponse,
} from "./mock-data";

export class ApiError extends Error {
  code: string;
  retryable: boolean;
  runId?: string;
  details: { field?: string; message: string }[];

  constructor(error: {
    code: string;
    message: string;
    retryable?: boolean;
    run_id?: string;
    details?: { field?: string; message: string }[];
  }) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.retryable = Boolean(error.retryable);
    this.runId = error.run_id;
    this.details = error.details ?? [];
  }
}

// FE-14: Real endpoints are used by default; mock mode is active only when NEXT_PUBLIC_USE_MOCK is explicitly "true"
const isMock = () => process.env.NEXT_PUBLIC_USE_MOCK === "true";

const delay = (ms = 250): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (netErr) {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message:
        netErr instanceof Error
          ? netErr.message
          : "Network connection failed. Please check your connection.",
      retryable: true,
      details: [],
    });
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError({
      code: "INVALID_RESPONSE",
      message: `Server returned unexpected response (status ${res.status}).`,
      retryable: res.status >= 500,
      details: [],
    });
  }

  if (!json.ok) {
    throw new ApiError({
      code: json.error.code,
      message: json.error.message,
      retryable: json.error.retryable,
      run_id: json.error.run_id,
      details: json.error.details,
    });
  }

  return json.data;
}

// --- Documents ---

export async function getDocuments(): Promise<{ documents: Document[] }> {
  if (isMock()) {
    await delay();
    return { documents: mockDocuments };
  }
  return request("/documents");
}

export async function getDocument(
  docId: string
): Promise<{ document: Document; paragraphs: Paragraph[] }> {
  if (isMock()) {
    await delay();
    const doc =
      mockDocuments.find((d) => d.doc_id === docId) || mockDocuments[0];
    const paras = mockParagraphsByDocId[docId] || mockParagraphsN1;
    return { document: doc, paragraphs: paras };
  }
  return request(`/documents/${docId}`);
}

// --- Runs ---

export async function createRun(body: CreateRunRequest): Promise<{ run: Run }> {
  if (isMock()) {
    await delay();
    if (body.simulate_failure && body.simulate_failure !== "none") {
      return { run: mockRunError };
    }
    return { run: mockRunNeedsClarification };
  }
  return request("/runs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getRun(runId: string): Promise<{ run: Run }> {
  if (isMock()) {
    await delay();
    return { run: mockRunAwaitingApproval };
  }
  return request(`/runs/${runId}`);
}

export async function submitAnswers(
  runId: string,
  answers: AnswerInput[]
): Promise<{ run: Run }> {
  if (isMock()) {
    await delay();
    return { run: mockRunAwaitingApproval };
  }
  return request(`/runs/${runId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function retryRun(runId: string): Promise<{ run: Run }> {
  if (isMock()) {
    await delay();
    return { run: mockRunAwaitingApproval };
  }
  return request(`/runs/${runId}/retry`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function confirmRun(
  runId: string,
  body: ConfirmRequest
): Promise<ConfirmResponse> {
  if (isMock()) {
    await delay();
    return mockConfirmResponse;
  }
  return request(`/runs/${runId}/confirm`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// --- Checklists ---

export async function getChecklists(): Promise<{
  checklists: ChecklistSummary[];
}> {
  if (isMock()) {
    await delay();
    return { checklists: mockChecklists };
  }
  return request("/checklists");
}

export async function getChecklist(docId: string): Promise<ChecklistDetail> {
  if (isMock()) {
    await delay();
    const checklist = mockChecklistDetailsByDocId[docId];
    if (checklist) return checklist;

    const document = mockDocuments.find((doc) => doc.doc_id === docId);
    return {
      doc_id: docId,
      title: document?.title ?? "Unknown notice",
      last_saved_at: "",
      tasks: [],
    };
  }
  return request(`/checklists/${docId}`);
}
