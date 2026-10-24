// =============================================
// Agent Orchestration — Main entry point
// Owner: Member 3 (AI Agent Engineer)
// =============================================

import dns from "node:dns";

// Ensure IPv4 resolution in environments where IPv6 route hangs or is unreachable
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
const origLookup = dns.lookup;
// @ts-expect-error DNS patch for undici/fetch IPv6 timeout
dns.lookup = function (hostname: string, options: unknown, callback?: unknown) {
  const cb = (typeof options === "function" ? options : callback) as (
    err: NodeJS.ErrnoException | null,
    address: string,
    family: number
  ) => void;
  const opts = typeof options === "object" && options !== null ? options : {};
  return (origLookup as unknown as (...args: unknown[]) => unknown).call(
    dns,
    hostname,
    { ...opts, family: 4 },
    cb
  );
};

import { generateObject, type CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system-prompt";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
import { finalizeSchema, type FinalizeOutput } from "./schemas";
import { validateProposal } from "./validator";
import type {
  TaskBase,
  Proposal,
  Question,
  ToolLogEntry,
  DeadlineSource,
  OwnerSource,
} from "../types";

export interface SearchResult {
  doc_id: string;
  total_paragraphs: number;
  matches: {
    paragraph_id: string;
    position: number;
    text: string;
    score: number;
  }[];
}

export interface ReadResult {
  doc_id: string;
  tasks: {
    task_id: string;
    description: string;
    source_refs: string[];
    deadline_date: string | null;
    deadline_text: string | null;
    condition: string | null;
    owner: string | null;
    status: string;
  }[];
}

export interface AgentParams {
  docId: string;
  request: string;
  round?: number;
  previousMessages?: CoreMessage[] | unknown[];
  answers?: { questionId: string; answer: string; notStated: boolean }[];
  simulateFailure?: "none" | "model" | "tool";
  // Paragraph lookup for validation:
  paragraphIds?: string[] | Set<string>;
  paragraphTexts?: Map<string, string>;
  existingTaskIds?: string[] | Set<string>;
  // Injected tool implementations:
  searchDocument: (args: {
    doc_id: string;
    query: string;
    max_results: number;
  }) => Promise<SearchResult>;
  readChecklist: (args: { doc_id: string }) => Promise<ReadResult>;
}

export interface AgentResult {
  status: "awaiting_approval" | "needs_clarification" | "error";
  proposal: Proposal | null;
  questions: Question[];
  toolLog: ToolLogEntry[];
  messages: CoreMessage[];
  limitsUsed: { modelTurns: number; toolCalls: number };
  error: { code: string; message: string } | null;
}

export async function runAgent(params: AgentParams): Promise<AgentResult> {
  const round = params.round || 1;
  const toolLog: ToolLogEntry[] = [];
  let seqCounter = 1;
  let toolCallsUsed = 0;

  // 1. Check for simulated failure hook (TC5)
  if (params.simulateFailure === "model") {
    const err = new Error("Simulated model error for evaluation") as Error & {
      code: string;
      retryable: boolean;
    };
    err.code = "MODEL_ERROR";
    err.retryable = true;
    return {
      status: "error",
      proposal: null,
      questions: [],
      toolLog: [],
      messages: [],
      limitsUsed: { modelTurns: 0, toolCalls: 0 },
      error: { code: "MODEL_ERROR", message: "Simulated model failure." },
    };
  }

  // 2. Build conversation messages
  const messages: CoreMessage[] = params.previousMessages
    ? [...(params.previousMessages as CoreMessage[])]
    : [
        {
          role: "user",
          content: `Document ID: ${params.docId}\nRequest: ${params.request}`,
        },
      ];

  // If this is a clarification pass with answers
  if (params.answers && params.answers.length > 0) {
    const formattedAnswers = params.answers
      .map(
        (a) =>
          `Question ${a.questionId}: ${
            a.notStated ? "[Not stated in document]" : a.answer
          }`
      )
      .join("\n");

    messages.push({
      role: "user",
      content: `Here are the user's answers to the clarification questions:\n${formattedAnswers}\nPlease update the draft proposal accordingly.`,
    });
  }

  if (params.simulateFailure === "tool") {
    return {
      status: "error",
      proposal: null,
      questions: [],
      toolLog: [
        {
          seq: seqCounter++,
          phase: "loop",
          tool: "search_document",
          args: { doc_id: params.docId, query: "deadline" },
          ok: false,
          result_summary: "Simulated tool error for evaluation",
          result: null,
          duration_ms: 1,
          at: new Date().toISOString(),
        },
      ],
      messages: [],
      limitsUsed: { modelTurns: 0, toolCalls: 1 },
      error: { code: "TOOL_FAILURE", message: "Simulated tool error for evaluation" },
    };
  }

  try {
    // 2. Tool Call 1: search_document
    const searchStart = Date.now();
    toolCallsUsed++;
    const searchRes = await params.searchDocument({
      doc_id: params.docId,
      query: params.request || "requirements deadline form submit action",
      max_results: 5,
    });
    const searchDuration = Date.now() - searchStart;

    toolLog.push({
      seq: seqCounter++,
      phase: "loop",
      tool: "search_document",
      args: { doc_id: params.docId, query: params.request, max_results: 5 },
      ok: true,
      result_summary: `${searchRes.matches.length} paragraphs matched`,
      result: searchRes as unknown as Record<string, unknown>,
      duration_ms: searchDuration,
      at: new Date().toISOString(),
    });

    // 3. Tool Call 2: read_checklist
    const readStart = Date.now();
    toolCallsUsed++;
    const readRes = await params.readChecklist({ doc_id: params.docId });
    const readDuration = Date.now() - readStart;

    toolLog.push({
      seq: seqCounter++,
      phase: "loop",
      tool: "read_checklist",
      args: { doc_id: params.docId },
      ok: true,
      result_summary: `${readRes.tasks.length} existing tasks`,
      result: readRes as unknown as Record<string, unknown>,
      duration_ms: readDuration,
      at: new Date().toISOString(),
    });

    // 4. Format prompt with document paragraphs and tool discoveries
    const pTexts = params.paragraphTexts || new Map<string, string>();
    const paragraphsFormatted = Array.from(pTexts.entries())
      .map(([pId, text]) => `[${pId}]: ${text}`)
      .join("\n\n");

    const searchContext = searchRes.matches
      .map((m) => `Match [${m.paragraph_id}] (Score ${m.score}): ${m.text}`)
      .join("\n");

    const existingChecklistContext =
      readRes.tasks.length > 0
        ? readRes.tasks
            .map((t) => `- Task ${t.task_id}: ${t.description}`)
            .join("\n")
        : "No existing checklist tasks.";

    let userContext = `Document ID: ${params.docId}\n\nDocument Paragraphs:\n${paragraphsFormatted}\n\nSearch Tool Findings:\n${searchContext}\n\nExisting Checklist:\n${existingChecklistContext}\n\nUser Request: ${params.request}`;

    if (params.answers && params.answers.length > 0) {
      const formattedAnswers = params.answers
        .map(
          (a) =>
            `Question ${a.questionId}: ${
              a.notStated ? "[Not stated in document]" : a.answer
            }`
        )
        .join("\n");
      userContext += `\n\nClarification Answers provided by user:\n${formattedAnswers}\nPlease update the draft proposal accordingly.`;
    }

    const finalizeMessages: CoreMessage[] = [
      {
        role: "user",
        content: userContext,
      },
    ];

    // 5. Finalize Call (Structured JSON Output via Gemini)
    const finalizeStart = Date.now();
    const finalizeResult = await generateObject({
      model: google(GEMINI_MODEL),
      system: SYSTEM_PROMPT,
      messages: finalizeMessages,
      schema: finalizeSchema,
    });
    const finalizeDuration = Date.now() - finalizeStart;

    toolLog.push({
      seq: seqCounter++,
      phase: "finalize",
      tool: "finalize_proposal",
      args: { round },
      ok: true,
      result_summary: `Synthesized proposal with ${finalizeResult.object.tasks.length} tasks`,
      result: { task_count: finalizeResult.object.tasks.length },
      duration_ms: finalizeDuration,
      at: new Date().toISOString(),
    });

    // 6. Post-Process & Validate Tasks
    const rawOutput: FinalizeOutput = finalizeResult.object;
    const existingTaskIds = params.existingTaskIds || new Set<string>();

    const userAnswersMap = new Map<string, { answer: string; notStated: boolean }>();
    if (params.answers) {
      for (const a of params.answers) {
        userAnswersMap.set(a.questionId, a);
      }
    }

    const tasksWithSources: TaskBase[] = rawOutput.tasks.map((t, idx) => {
      const clientId = t.client_id || `C${idx + 1}`;
      let deadlineSource: DeadlineSource = "document";
      let ownerSource: OwnerSource = "document";

      // If user answered for this task
      const userDeadlineAnswer = Array.from(userAnswersMap.values()).find(
        (a) => a.answer && /^\d{4}-\d{2}-\d{2}$/.test(a.answer)
      );
      const userOwnerAnswer = Array.from(userAnswersMap.values()).find(
        (a) => a.answer && !/^\d{4}-\d{2}-\d{2}$/.test(a.answer)
      );

      if (t.deadline_date) {
        if (userDeadlineAnswer) {
          deadlineSource = "user";
        } else {
          deadlineSource = "document";
        }
      } else {
        deadlineSource = "none";
      }

      if (t.owner) {
        if (userOwnerAnswer) {
          ownerSource = "user";
        } else {
          ownerSource = "document";
        }
      } else {
        ownerSource = "none";
      }

      return {
        client_id: clientId,
        action: t.action,
        task_id: t.task_id || null,
        description: t.description,
        source_refs: t.source_refs,
        deadline_date: t.deadline_date || null,
        deadline_text: t.deadline_text || null,
        deadline_source: deadlineSource,
        condition: t.condition || null,
        owner: t.owner || null,
        owner_source: ownerSource,
      };
    });

    // Extract and fallback paragraph metadata for validation
    const paragraphIds =
      params.paragraphIds instanceof Set
        ? params.paragraphIds
        : new Set(params.paragraphIds || []);
    const paragraphTexts = params.paragraphTexts || new Map<string, string>();

    if (paragraphIds.size === 0) {
      try {
        const docResult = await params.searchDocument({
          doc_id: params.docId,
          query: "",
          max_results: 40,
        });
        for (const m of docResult.matches) {
          paragraphIds.add(m.paragraph_id);
          paragraphTexts.set(m.paragraph_id, m.text);
        }
      } catch {
        // Continue if tool fetch fails
      }
    }

    // Run deterministic validation
    const validationResult = validateProposal({
      tasks: tasksWithSources,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round,
    });

    const proposal: Proposal = {
      version: round,
      summary: rawOutput.summary,
      answers_to_request: rawOutput.answers_to_request,
      tasks: validationResult.tasks,
      absent_information: rawOutput.absent_information,
      validation: {
        passed: validationResult.passed,
        issues: validationResult.issues,
      },
    };

    const status = validationResult.questions.length > 0
      ? "needs_clarification"
      : "awaiting_approval";

    return {
      status,
      proposal,
      questions: validationResult.questions,
      toolLog,
      messages: finalizeMessages,
      limitsUsed: {
        modelTurns: 1,
        toolCalls: toolCallsUsed,
      },
      error: null,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj.code || "MODEL_ERROR";
    const message = errorObj.message || "An unexpected error occurred during agent execution.";

    return {
      status: "error",
      proposal: null,
      questions: [],
      toolLog,
      messages,
      limitsUsed: { modelTurns: 1, toolCalls: toolCallsUsed },
      error: { code, message },
    };
  }
}
