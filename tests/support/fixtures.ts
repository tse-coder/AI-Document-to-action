import type { AgentResult } from "../../lib/agent/run-agent";
import type { Question, TaskBase, ValidationIssue } from "../../lib/types";

export const N1_REQUEST = "Make a checklist for this notice";
export const N1_DOC = "N1";
export const N1_TITLE = "Student ID Card Renewal Notice";

export const UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const RUN_ID_RE = /^RUN-[0-9A-Z]{8}$/;
export const PASTED_DOC_ID_RE = /^U-[0-9A-F]{6}$/;
export const CREATED_TASK_ID_RE = /^TSK-[0-9A-F]{8}$/;

export function validTask(overrides: Partial<TaskBase> = {}): TaskBase {
  return {
    client_id: "C1",
    action: "update",
    task_id: "TSK-0001",
    description: "Submit the completed renewal form to Room 12",
    source_refs: ["N1-P2", "N1-P3"],
    deadline_date: "2026-11-15",
    deadline_text: "15 November 2026",
    deadline_source: "document",
    condition: null,
    owner: "Student",
    owner_source: "document",
    ...overrides,
  };
}

export function createTask(overrides: Partial<TaskBase> = {}): TaskBase {
  return validTask({
    client_id: "C3",
    action: "create",
    task_id: null,
    description: "Get the renewal form signed by the department head",
    source_refs: ["N1-P5"],
    deadline_date: null,
    deadline_text: null,
    deadline_source: "none",
    condition: null,
    owner: "Student",
    owner_source: "user",
    ...overrides,
  });
}

export function question(overrides: Partial<Question> = {}): Question {
  return {
    question_id: "Q1",
    field: "owner",
    task_client_id: "C3",
    text: "Who is responsible for getting the form signed?",
    source_refs: ["N1-P5"],
    allow_not_stated: true,
    ...overrides,
  };
}

export type ProposalFixture = {
  version: number;
  summary: string;
  tasks: TaskBase[];
  absent_information: { topic: string; note: string }[];
  answers_to_request: string | null;
  validation: { passed: boolean; issues: ValidationIssue[] };
};

export function proposalFixture(
  tasks: TaskBase[] = [validTask(), createTask()],
  issues: ValidationIssue[] = [],
  version = 1
): ProposalFixture {
  return {
    version,
    summary: "Submit a renewal form and passport photo by 15 November 2026.",
    tasks,
    absent_information: [],
    answers_to_request: null,
    validation: {
      passed: !issues.some((issue) => issue.severity === "error"),
      issues,
    },
  };
}

export function agentAwaiting(
  proposal: ProposalFixture = proposalFixture(),
  modelTurns = 2,
  toolCalls = 2
): AgentResult {
  return {
    status: "awaiting_approval",
    proposal,
    questions: [],
    toolLog: [
      {
        seq: 1,
        phase: "finalize",
        tool: "finalize_proposal",
        args: { round: 1 },
        ok: true,
        result_summary: "Proposal finalized",
        result: {},
        duration_ms: 10,
        at: "2026-10-24T07:15:36Z",
      },
    ],
    messages: [{ role: "assistant", content: "proposal" }],
    limitsUsed: { modelTurns, toolCalls },
    error: null,
  };
}

export function agentNeedsClarification(
  questions: Question[] = [question()],
  modelTurns = 3,
  toolCalls = 2
): AgentResult {
  return {
    status: "needs_clarification",
    proposal: null,
    questions,
    toolLog: [],
    messages: [{ role: "assistant", content: "question" }],
    limitsUsed: { modelTurns, toolCalls },
    error: null,
  };
}

export function agentError(
  code: string,
  message = "Agent failed",
  modelTurns = 1,
  toolCalls = 0
): AgentResult {
  return {
    status: "error",
    proposal: null,
    questions: [],
    toolLog: [],
    messages: [],
    limitsUsed: { modelTurns, toolCalls },
    error: { code, message },
  };
}

export function newRunId(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RUN-${suffix}`;
}
