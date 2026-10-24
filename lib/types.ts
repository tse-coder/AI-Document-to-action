// =============================================
// Shared TypeScript types — Single source of truth
// Owner: Member 4 (Backend Engineer)
// =============================================
// All members import from here. If you need a new field,
// ask Member 4 to add it.
// =============================================

// --- Document ---

export interface Document {
  doc_id: string;
  title: string;
  origin: "demo" | "pasted";
  paragraph_count: number;
  created_at: string; // ISO 8601
}

export interface Paragraph {
  paragraph_id: string;
  position: number;
  text: string;
}

// --- Task ---

export type DeadlineSource = "document" | "user" | "none";
export type OwnerSource = "document" | "user" | "none";
export type TaskAction = "create" | "update";

export interface TaskBase {
  client_id: string;
  action: TaskAction;
  task_id: string | null;
  description: string;
  source_refs: string[];
  deadline_date: string | null;
  deadline_text: string | null;
  deadline_source: DeadlineSource;
  condition: string | null;
  owner: string | null;
  owner_source: OwnerSource;
}

export type Task = TaskBase;
export type TaskInput = TaskBase;

/** Persisted task fields; proposal-only client_id and action are not stored. */
export interface SavedTask {
  task_id: string;
  doc_id: string;
  description: string;
  source_refs: string[];
  deadline_date: string | null;
  deadline_text: string | null;
  deadline_source: DeadlineSource;
  condition: string | null;
  owner: string | null;
  owner_source: OwnerSource;
  status: "open" | "done";
  updated_at: string;
}

export interface SavedTaskWithSources extends SavedTask {
  sources: { paragraph_id: string; text: string }[];
}

// --- Question ---

export interface Question {
  question_id: string;
  field: "owner" | "deadline";
  task_client_id: string;
  text: string;
  source_refs: string[];
  allow_not_stated: boolean;
}

// --- Validation ---

export type ValidationSeverity = "error" | "question" | "warning";

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  task_client_id: string;
  message: string;
}

// --- Proposal ---

export interface AbsentInfo {
  topic: string;
  note: string;
}

export interface Proposal {
  version: number;
  summary: string;
  tasks: TaskBase[];
  absent_information: AbsentInfo[];
  answers_to_request: string | null;
  validation: {
    passed: boolean;
    issues: ValidationIssue[];
  };
}

// --- Tool Log ---

export interface ToolLogEntry {
  seq: number;
  phase: "loop" | "finalize" | "gate";
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  result_summary: string;
  result: Record<string, unknown> | null;
  duration_ms: number;
  at: string;
}

// --- Run ---

export type RunStatus =
  | "running"
  | "needs_clarification"
  | "awaiting_approval"
  | "error"
  | "saved";

export interface RunLimits {
  max_model_turns: number;
  max_tool_calls: number;
  max_clarification_rounds: number;
  model_turns_used: number;
  tool_calls_used: number;
  limit_hit: boolean;
}

export interface RunError {
  code: string;
  message: string;
}

export interface Run {
  run_id: string;
  doc_id: string;
  status: RunStatus;
  request: string;
  round: number;
  retry_count: number;
  created_at: string;
  updated_at: string;
  questions: Question[];
  proposal: Proposal | null;
  tool_log: ToolLogEntry[];
  limits: RunLimits;
  error: RunError | null;
}

// --- API Envelopes ---

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  error?: never;
}

export interface ApiError {
  ok: false;
  data?: never;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    run_id?: string;
    details: ApiErrorDetail[];
  };
}

/** Structured validation details or field-level request errors. */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  severity?: ValidationSeverity;
  task_client_id?: string;
  question_id?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// --- Request Bodies ---

export interface CreateRunRequest {
  doc_id?: string;
  text?: string;
  title?: string;
  request: string;
  simulate_failure?: "none" | "model" | "tool";
}

export interface AnswerInput {
  question_id: string;
  answer: string;
  not_stated: boolean;
}

export interface ConfirmRequest {
  proposal_version: number;
  tasks: TaskBase[];
}

export interface ConfirmResponse {
  run_id: string;
  status: "saved";
  doc_id: string;
  saved_at: string;
  saved: { client_id: string; task_id: string; action: TaskAction }[];
  warnings: ValidationIssue[];
  reopen_path: string;
}

// --- Checklist ---

export interface ChecklistSummary {
  doc_id: string;
  title: string;
  task_count: number;
  last_saved_at: string | null;
}

export interface ChecklistDetail {
  doc_id: string;
  title: string;
  last_saved_at: string | null;
  tasks: SavedTaskWithSources[];
}

// --- Endpoint payloads ---

export interface HealthData {
  status: "ok";
  db: "ok" | "error";
  model: string;
}

export interface DocumentsData {
  documents: Document[];
}

export interface DocumentData {
  document: Document;
  paragraphs: Paragraph[];
}

export interface RunData {
  run: Run;
}

export interface ChecklistsData {
  checklists: ChecklistSummary[];
}

export interface AnswerRequest {
  answers: AnswerInput[];
}

// --- Agent/backend integration contract ---

export interface SearchDocumentArgs {
  doc_id: string;
  query: string;
  max_results?: number;
}

export interface SearchResult {
  doc_id: string;
  total_paragraphs: number;
  matches: { paragraph_id: string; position: number; text: string; score: number }[];
}

/** Compact task shape returned by the read_checklist agent tool. */
export interface ReadChecklistTask {
  task_id: string;
  description: string;
  source_refs: string[];
  deadline_date: string | null;
  deadline_text: string | null;
  condition: string | null;
  owner: string | null;
  status: "open" | "done";
}

export interface ReadChecklistResult {
  doc_id: string;
  tasks: ReadChecklistTask[];
}

export interface RunAgentParams {
  docId: string;
  request: string;
  round: number;
  previousMessages?: unknown[];
  answers?: { questionId: string; answer: string; notStated: boolean }[];
  simulateFailure?: "none" | "model" | "tool";
  searchDocument: (args: SearchDocumentArgs) => Promise<SearchResult>;
  readChecklist: (args: { doc_id: string }) => Promise<ReadChecklistResult>;
}

export interface AgentResult {
  status: "awaiting_approval" | "needs_clarification" | "error";
  proposal: Proposal | null;
  questions: Question[];
  toolLog: ToolLogEntry[];
  messages: unknown[];
  limitsUsed: { modelTurns: number; toolCalls: number; limitHit?: boolean };
  error: RunError | null;
}
