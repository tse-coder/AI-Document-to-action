// =============================================
// Agent Orchestration — Main entry point
// Owner: Member 3 (AI Agent Engineer)
// =============================================

import { generateText, generateObject, tool, type CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system-prompt";
import {
  searchDocumentParams,
  readChecklistParams,
  saveChecklistChangesParams,
} from "./tools";
import { finalizeSchema, type FinalizeOutput } from "./schemas";
import { validateProposal } from "./validator";
import type {
  TaskBase,
  Proposal,
  Question,
  ToolLogEntry,
  RunLimits,
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

  try {
    // 3. Multi-turn Agent Tool Loop (max 4 turns)
    const agentTools = {
      search_document: tool({
        description:
          "Search the document paragraphs by keyword to find required actions, deadlines, conditions, or fees.",
        parameters: searchDocumentParams,
        execute: async (args) => {
          if (params.simulateFailure === "tool") {
            throw new Error("Simulated tool error for evaluation");
          }
          const start = Date.now();
          toolCallsUsed++;
          const result = await params.searchDocument({
            doc_id: args.doc_id,
            query: args.query,
            max_results: args.max_results ?? 5,
          });
          const duration = Date.now() - start;

          toolLog.push({
            seq: seqCounter++,
            phase: "loop",
            tool: "search_document",
            args: args as Record<string, unknown>,
            ok: true,
            result_summary: `${result.matches.length} paragraphs matched`,
            result: result as unknown as Record<string, unknown>,
            duration_ms: duration,
            at: new Date().toISOString(),
          });

          return result;
        },
      }),

      read_checklist: tool({
        description:
          "Read existing saved checklist tasks for this document to avoid duplicates and propose updates.",
        parameters: readChecklistParams,
        execute: async (args) => {
          const start = Date.now();
          toolCallsUsed++;
          const result = await params.readChecklist({ doc_id: args.doc_id });
          const duration = Date.now() - start;

          toolLog.push({
            seq: seqCounter++,
            phase: "loop",
            tool: "read_checklist",
            args: args as Record<string, unknown>,
            ok: true,
            result_summary: `${result.tasks.length} existing tasks`,
            result: result as unknown as Record<string, unknown>,
            duration_ms: duration,
            at: new Date().toISOString(),
          });

          return result;
        },
      }),

      save_checklist_changes: tool({
        description:
          "Save approved checklist tasks to the remote database. (Gated: requires user approval).",
        parameters: saveChecklistChangesParams,
        execute: async (args) => {
          // SAFETY GATE: Intercept direct saves during loop
          toolCallsUsed++;
          toolLog.push({
            seq: seqCounter++,
            phase: "gate",
            tool: "save_checklist_changes",
            args: args as Record<string, unknown>,
            ok: false,
            result_summary: "Blocked by safety gate",
            result: { blocked: "Awaiting user approval" },
            duration_ms: 1,
            at: new Date().toISOString(),
          });

          return { blocked: "Awaiting user approval" };
        },
      }),
    };

    // Run tool-calling loop (Max 4 steps / turns)
    const loopResult = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages,
      tools: agentTools,
      maxSteps: 4,
    });

    const modelTurnsUsed = loopResult.steps.length;

    // 4. Finalize Call (Structured JSON Output via Gemini)
    const finalizeStart = Date.now();
    const finalizeMessages: CoreMessage[] = [
      ...messages,
      {
        role: "assistant",
        content: loopResult.text || "I have analyzed the document and retrieved the relevant sections.",
      },
      {
        role: "user",
        content:
          "Now formulate the final proposal. Output the summary, extracted tasks with source paragraph IDs, and absent information in the required structured format.",
      },
    ];

    const finalizeResult = await generateObject({
      model: google("gemini-2.5-flash"),
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
      result_summary: "Proposal synthesized",
      result: { task_count: finalizeResult.object.tasks.length },
      duration_ms: finalizeDuration,
      at: new Date().toISOString(),
    });

    // 5. Post-Process & Validate Tasks
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
        modelTurns: modelTurnsUsed + 1,
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
