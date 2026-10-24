// =============================================
// Mock Data File (FE-03)
// Satisfies shared types from lib/types.ts
// Source of truth: docs/api-spec.md
// =============================================

import type {
  Document,
  Paragraph,
  Run,
  ChecklistSummary,
  ChecklistDetail,
  ConfirmResponse,
} from "./types";

// --- Mock Documents ---

export const mockDocuments: Document[] = [
  {
    doc_id: "N1",
    title: "Student ID Card Renewal Notice",
    origin: "demo",
    paragraph_count: 5,
    created_at: "2026-10-24T06:00:00Z",
  },
  {
    doc_id: "N2",
    title: "Lab Equipment Borrowing Procedure",
    origin: "demo",
    paragraph_count: 6,
    created_at: "2026-10-24T06:00:00Z",
  },
];

// --- Mock Paragraphs ---

export const mockParagraphsN1: Paragraph[] = [
  {
    paragraph_id: "N1-P1",
    position: 1,
    text: "The Registrar's Office will renew student ID cards for the 2026/27 academic year.",
  },
  {
    paragraph_id: "N1-P2",
    position: 2,
    text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
  },
  {
    paragraph_id: "N1-P3",
    position: 3,
    text: "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
  },
  {
    paragraph_id: "N1-P4",
    position: 4,
    text: "Final-year students are exempt from the passport photo requirement and submit only the form.",
  },
  {
    paragraph_id: "N1-P5",
    position: 5,
    text: "The renewal form must be signed by the department head before submission.",
  },
];

export const mockParagraphsN2: Paragraph[] = [
  {
    paragraph_id: "N2-P1",
    position: 1,
    text: "All undergraduate students may borrow lab equipment for approved course projects.",
  },
  {
    paragraph_id: "N2-P2",
    position: 2,
    text: "Equipment requests must be submitted online at least 48 hours before the required session.",
  },
  {
    paragraph_id: "N2-P3",
    position: 3,
    text: "Students must present their valid student ID and safety training certificate upon collection.",
  },
  {
    paragraph_id: "N2-P4",
    position: 4,
    text: "All borrowed items must be returned to the lab technician by 5:00 PM on the same day.",
  },
  {
    paragraph_id: "N2-P5",
    position: 5,
    text: "Late returns will result in a suspension of borrowing privileges for two weeks.",
  },
  {
    paragraph_id: "N2-P6",
    position: 6,
    text: "Report damaged or malfunctioning equipment immediately to the lab supervisor in Room 204.",
  },
];

export const mockParagraphsByDocId: Record<string, Paragraph[]> = {
  N1: mockParagraphsN1,
  N2: mockParagraphsN2,
};

// --- Mock Runs across states ---

// 1. Running State
export const mockRunRunning: Run = {
  run_id: "RUN-RUNNING01",
  doc_id: "N1",
  status: "running",
  request: "Make a checklist for this notice",
  round: 1,
  retry_count: 0,
  created_at: "2026-10-24T07:15:30Z",
  updated_at: "2026-10-24T07:15:32Z",
  questions: [],
  proposal: null,
  tool_log: [
    {
      seq: 1,
      phase: "loop",
      tool: "read_checklist",
      args: { doc_id: "N1" },
      ok: true,
      result_summary: "1 existing task found",
      result: { doc_id: "N1" },
      duration_ms: 15,
      at: "2026-10-24T07:15:31Z",
    },
  ],
  limits: {
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
    model_turns_used: 1,
    tool_calls_used: 1,
    limit_hit: false,
  },
  error: null,
};

// 2. Needs Clarification State
export const mockRunNeedsClarification: Run = {
  run_id: "RUN-CLARIFY01",
  doc_id: "N1",
  status: "needs_clarification",
  request: "Make a checklist for this notice",
  round: 1,
  retry_count: 0,
  created_at: "2026-10-24T07:15:30Z",
  updated_at: "2026-10-24T07:15:36Z",
  questions: [
    {
      question_id: "Q1",
      field: "owner",
      task_client_id: "C3",
      text: "Paragraph N1-P5 requires a department head signature but does not say who obtains it. Who is responsible?",
      source_refs: ["N1-P5"],
      allow_not_stated: true,
    },
  ],
  proposal: null,
  tool_log: [
    {
      seq: 1,
      phase: "loop",
      tool: "read_checklist",
      args: { doc_id: "N1" },
      ok: true,
      result_summary: "1 existing task",
      result: { doc_id: "N1" },
      duration_ms: 12,
      at: "2026-10-24T07:15:31Z",
    },
    {
      seq: 2,
      phase: "loop",
      tool: "search_document",
      args: { doc_id: "N1", query: "documents deadline exempt signed", max_results: 5 },
      ok: true,
      result_summary: "4 paragraphs matched",
      result: { doc_id: "N1", total_paragraphs: 5 },
      duration_ms: 38,
      at: "2026-10-24T07:15:32Z",
    },
  ],
  limits: {
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
    model_turns_used: 3,
    tool_calls_used: 2,
    limit_hit: false,
  },
  error: null,
};

// 3. Awaiting Approval State (3-task draft with condition & absent info)
export const mockRunAwaitingApproval: Run = {
  run_id: "RUN-AWAITING01",
  doc_id: "N1",
  status: "awaiting_approval",
  request: "Make a checklist for this notice",
  round: 1,
  retry_count: 0,
  created_at: "2026-10-24T07:15:30Z",
  updated_at: "2026-10-24T07:16:20Z",
  questions: [],
  proposal: {
    version: 2,
    summary:
      "Students must submit a renewal form and a passport photo to Room 12 by 15 November 2026. Final-year students submit only the form. The form needs a department head signature first.",
    tasks: [
      {
        client_id: "C1",
        action: "update",
        task_id: "TSK-0001",
        description: "Submit the completed renewal form to Room 12 of the Registrar's Office",
        source_refs: ["N1-P2", "N1-P3"],
        deadline_date: "2026-11-15",
        deadline_text: "15 November 2026",
        deadline_source: "document",
        condition: null,
        owner: "Student",
        owner_source: "document",
      },
      {
        client_id: "C2",
        action: "update",
        task_id: "TSK-0002",
        description: "Submit one recent passport photo to Room 12 of the Registrar's Office",
        source_refs: ["N1-P2", "N1-P3", "N1-P4"],
        deadline_date: "2026-11-15",
        deadline_text: "15 November 2026",
        deadline_source: "document",
        condition: "Does not apply to final-year students",
        owner: "Student",
        owner_source: "document",
      },
      {
        client_id: "C3",
        action: "create",
        task_id: null,
        description: "Get the renewal form signed by the department head before submission",
        source_refs: ["N1-P5"],
        deadline_date: null,
        deadline_text: null,
        deadline_source: "none",
        condition: null,
        owner: "Student",
        owner_source: "user",
      },
    ],
    absent_information: [
      {
        topic: "Replacement card fee",
        note: "The notice does not state any fee for replacement cards.",
      },
      {
        topic: "Signature deadline",
        note: "The notice gives no separate date for the department head signature.",
      },
    ],
    answers_to_request: null,
    validation: {
      passed: true,
      issues: [
        {
          code: "DEADLINE_NOT_STATED",
          severity: "warning",
          task_client_id: "C3",
          message: "No deadline is stated for the signature task.",
        },
      ],
    },
  },
  tool_log: [
    {
      seq: 1,
      phase: "loop",
      tool: "read_checklist",
      args: { doc_id: "N1" },
      ok: true,
      result_summary: "1 existing task",
      result: { doc_id: "N1" },
      duration_ms: 12,
      at: "2026-10-24T07:15:31Z",
    },
  ],
  limits: {
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
    model_turns_used: 4,
    tool_calls_used: 2,
    limit_hit: false,
  },
  error: null,
};

// 4. Error State
export const mockRunError: Run = {
  run_id: "RUN-ERROR01",
  doc_id: "N1",
  status: "error",
  request: "Make a checklist for this notice",
  round: 1,
  retry_count: 0,
  created_at: "2026-10-24T07:15:30Z",
  updated_at: "2026-10-24T07:15:55Z",
  questions: [],
  proposal: null,
  tool_log: [],
  limits: {
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
    model_turns_used: 1,
    tool_calls_used: 0,
    limit_hit: false,
  },
  error: {
    code: "MODEL_TIMEOUT",
    message: "The model did not respond in time. Click Retry to try again.",
  },
};

// 5. Saved State
export const mockRunSaved: Run = {
  run_id: "RUN-SAVED01",
  doc_id: "N1",
  status: "saved",
  request: "Make a checklist for this notice",
  round: 1,
  retry_count: 0,
  created_at: "2026-10-24T07:15:30Z",
  updated_at: "2026-10-24T07:17:02Z",
  questions: [],
  proposal: mockRunAwaitingApproval.proposal,
  tool_log: [],
  limits: {
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
    model_turns_used: 4,
    tool_calls_used: 3,
    limit_hit: false,
  },
  error: null,
};

export const mockRunsByState: Record<string, Run> = {
  running: mockRunRunning,
  needs_clarification: mockRunNeedsClarification,
  awaiting_approval: mockRunAwaitingApproval,
  error: mockRunError,
  saved: mockRunSaved,
};

// --- Mock Checklists ---

export const mockChecklists: ChecklistSummary[] = [
  {
    doc_id: "N1",
    title: "Student ID Card Renewal Notice",
    task_count: 3,
    last_saved_at: "2026-10-24T07:17:02Z",
  },
];

export const mockChecklistDetailN1: ChecklistDetail = {
  doc_id: "N1",
  title: "Student ID Card Renewal Notice",
  last_saved_at: "2026-10-24T07:17:02Z",
  tasks: [
    {
      client_id: "C1",
      action: "update",
      task_id: "TSK-0001",
      description: "Submit the completed renewal form to Room 12 of the Registrar's Office",
      source_refs: ["N1-P2", "N1-P3"],
      deadline_date: "2026-11-15",
      deadline_text: "15 November 2026",
      deadline_source: "document",
      condition: null,
      owner: "Student",
      owner_source: "document",
      doc_id: "N1",
      status: "open",
      updated_at: "2026-10-24T07:17:02Z",
      sources: [
        {
          paragraph_id: "N1-P2",
          text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
        },
        {
          paragraph_id: "N1-P3",
          text: "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
        },
      ],
    },
    {
      client_id: "C2",
      action: "update",
      task_id: "TSK-0002",
      description: "Submit one recent passport photo to Room 12 of the Registrar's Office",
      source_refs: ["N1-P2", "N1-P3", "N1-P4"],
      deadline_date: "2026-11-15",
      deadline_text: "15 November 2026",
      deadline_source: "document",
      condition: "Does not apply to final-year students",
      owner: "Student",
      owner_source: "document",
      doc_id: "N1",
      status: "open",
      updated_at: "2026-10-24T07:17:02Z",
      sources: [
        {
          paragraph_id: "N1-P2",
          text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
        },
        {
          paragraph_id: "N1-P3",
          text: "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
        },
        {
          paragraph_id: "N1-P4",
          text: "Final-year students are exempt from the passport photo requirement and submit only the form.",
        },
      ],
    },
    {
      client_id: "C3",
      action: "create",
      task_id: "TSK-9F31C2AB",
      description: "Get the renewal form signed by the department head before submission",
      source_refs: ["N1-P5"],
      deadline_date: null,
      deadline_text: null,
      deadline_source: "none",
      condition: null,
      owner: "Student",
      owner_source: "user",
      doc_id: "N1",
      status: "open",
      updated_at: "2026-10-24T07:17:02Z",
      sources: [
        {
          paragraph_id: "N1-P5",
          text: "The renewal form must be signed by the department head before submission.",
        },
      ],
    },
  ],
};

// --- Mock Confirm Response ---

export const mockConfirmResponse: ConfirmResponse = {
  run_id: "RUN-AWAITING01",
  status: "saved",
  doc_id: "N1",
  saved_at: "2026-10-24T07:17:02Z",
  saved: [
    { client_id: "C1", task_id: "TSK-0001", action: "update" },
    { client_id: "C2", task_id: "TSK-0002", action: "update" },
    { client_id: "C3", task_id: "TSK-9F31C2AB", action: "create" },
  ],
  warnings: [
    {
      code: "DEADLINE_NOT_STATED",
      severity: "warning",
      task_client_id: "C3",
      message: "No deadline is stated for the signature task.",
    },
  ],
  reopen_path: "/api/checklists/N1",
};
