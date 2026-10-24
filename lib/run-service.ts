import { runAgent } from "./agent/run-agent";
import {
  appendRunOutput,
  getDocumentWithParagraphs,
  getRunAgentContext,
  getRunById,
  readChecklist,
  searchDocument,
} from "./db/queries";
import { ApiRequestError } from "./api-response";
import type {
  AgentResult,
  Question,
  Run,
  ToolLogEntry,
} from "./types";

// The API spec gives a complete agent pass (loop plus finalize) 45 seconds.
// Member 3's orchestration must still cap each individual model call at 25s
// or the remaining pass budget, whichever is smaller.
const MODEL_PASS_TIMEOUT_MS = 45_000;

function withModelTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("The agent pass did not finish in time.") as Error & { code: string };
      error.code = "MODEL_TIMEOUT";
      reject(error);
    }, MODEL_PASS_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function failureCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    if (["MODEL_QUOTA_EXCEEDED", "MODEL_TIMEOUT", "MODEL_ERROR", "TOOL_FAILURE"].includes(error.code)) {
      return error.code;
    }
    if (/^[0-9A-Z]{5}$/u.test(error.code)) return "TOOL_FAILURE";
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/quota|resource exhausted|429/i.test(message)) return "MODEL_QUOTA_EXCEEDED";
  if (/timeout|timed out|deadline/i.test(message)) return "MODEL_TIMEOUT";
  if (/tool/i.test(message)) return "TOOL_FAILURE";
  return "INTERNAL_ERROR";
}

function errorHttpStatus(code: string): number {
  if (code === "MODEL_QUOTA_EXCEEDED") return 429;
  if (code === "MODEL_TIMEOUT") return 504;
  if (code === "TOOL_FAILURE" || code === "INTERNAL_ERROR") return 500;
  return 502;
}

function safeErrorMessage(code: string): string {
  if (code === "MODEL_QUOTA_EXCEEDED") return "The model is temporarily out of quota. Retry shortly.";
  if (code === "MODEL_TIMEOUT") return "The model did not respond in time. Retry.";
  if (code === "TOOL_FAILURE") return "A document tool failed. Retry the run.";
  if (code === "INTERNAL_ERROR") return "The request could not be completed.";
  return "The model could not complete this request. Retry the run.";
}

export async function runAgentPass(
  run: Run,
  options: {
    answers?: { questionId: string; answer: string; notStated: boolean }[];
    clearSimulatedFailure?: boolean;
  } = {},
): Promise<Run> {
  const document = await getDocumentWithParagraphs(run.doc_id);
  if (!document) throw new ApiRequestError("DOCUMENT_NOT_FOUND", "Document not found.", 404);
  const context = await getRunAgentContext(run.run_id);
  if (!context) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);

  try {
    const result = (await withModelTimeout(runAgent({
      docId: run.doc_id,
      request: run.request,
      round: run.round,
      previousMessages: context.messages,
      answers: options.answers ?? (context.answers.length ? context.answers : undefined),
      simulateFailure: options.clearSimulatedFailure ? "none" : context.simulateFailure,
      searchDocument: ({ doc_id, query, max_results }) =>
        searchDocument(doc_id, query, max_results ?? 5),
      readChecklist: ({ doc_id }) => readChecklist(doc_id),
    }))) as AgentResult;

    let error = result.error;
    if (result.status === "error") {
      const code = error ? failureCode(error) : "MODEL_ERROR";
      error = { code, message: safeErrorMessage(code) };
    }
    const proposal = result.status === "awaiting_approval" ? result.proposal : null;
    if (result.status === "awaiting_approval" && !proposal) {
      throw new Error("The model returned no proposal.");
    }

    const questions = result.questions as Question[];
    if (result.status === "needs_clarification" && questions.length === 0) {
      throw new Error("The model returned no clarification questions.");
    }
    const toolLog = result.toolLog as ToolLogEntry[];
    const finalizeCalled = result.status !== "error" || toolLog.some((entry) =>
      entry.phase === "finalize" && entry.tool === "finalize_proposal",
    );
    const nextQuestionRound = options.answers?.length && result.status === "needs_clarification"
      ? Math.min(run.round + 1, 2)
      : run.round;
    const limitsUsed = {
      modelTurns: result.limitsUsed.modelTurns,
      toolCalls: result.limitsUsed.toolCalls,
      limitHit: result.limitsUsed.limitHit ?? (result.limitsUsed.modelTurns >= 4 || result.limitsUsed.toolCalls >= 6),
    };
    await appendRunOutput(run.run_id, {
      status: result.status,
      round: nextQuestionRound,
      proposal,
      questions,
      toolLog,
      messages: result.messages,
      limitsUsed,
      error,
      finalizeCalled,
    });

    if (result.status === "error" && error) {
      throw new ApiRequestError(
        error.code,
        error.message,
        errorHttpStatus(error.code),
        [],
        error.code !== "INTERNAL_ERROR",
        run.run_id,
      );
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.runId === run.run_id) throw error;
    const code = failureCode(error);
    const message = safeErrorMessage(code);
    const retryable = code !== "INTERNAL_ERROR";
    try {
      await appendRunOutput(run.run_id, {
        status: "error",
        round: run.round,
        proposal: null,
        questions: [],
        toolLog: [],
        messages: context.messages,
        limitsUsed: { modelTurns: 0, toolCalls: 0 },
        error: { code, message },
        finalizeCalled: false,
      });
    } catch {
      // Preserve the original model/tool error; the GET endpoint can expose the
      // stale-running timeout if persistence itself was unavailable.
    }
    throw new ApiRequestError(code, message, errorHttpStatus(code), [], retryable, retryable ? run.run_id : undefined);
  }

  const updated = await getRunById(run.run_id);
  if (!updated) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
  return updated;
}
