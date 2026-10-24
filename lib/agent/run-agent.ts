// =============================================
// Agent Orchestration — Main entry point
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Member 4 calls runAgent() from API route handlers.
// This function manages the tool loop + finalize call.
// =============================================

// TODO: Implement using Vercel AI SDK:
//
// import { generateText, generateObject } from "ai";
// import { google } from "@ai-sdk/google";
// import { tool } from "ai";
// import { SYSTEM_PROMPT } from "./system-prompt";
// import { searchDocumentParams, readChecklistParams, saveChecklistChangesParams } from "./tools";
// import { finalizeSchema } from "./schemas";

export interface SearchResult {
  doc_id: string;
  total_paragraphs: number;
  matches: { paragraph_id: string; position: number; text: string; score: number }[];
}

export interface ReadResult {
  doc_id: string;
  tasks: { task_id: string; description: string; source_refs: string[]; deadline_date: string | null; deadline_text: string | null; condition: string | null; owner: string | null; status: string }[];
}

export interface AgentParams {
  docId: string;
  request: string;
  round: number;
  previousMessages?: unknown[];
  answers?: { questionId: string; answer: string; notStated: boolean }[];
  simulateFailure?: "none" | "model" | "tool";
  // Tool implementations injected by Member 4:
  searchDocument: (args: { doc_id: string; query: string; max_results: number }) => Promise<SearchResult>;
  readChecklist: (args: { doc_id: string }) => Promise<ReadResult>;
}

export interface AgentResult {
  status: "awaiting_approval" | "needs_clarification" | "error";
  proposal: unknown | null;
  questions: unknown[];
  toolLog: unknown[];
  messages: unknown[];
  limitsUsed: { modelTurns: number; toolCalls: number };
  error: { code: string; message: string } | null;
}

export async function runAgent(params: AgentParams): Promise<AgentResult> {
  // TODO: Implement the full agent loop:
  //
  // 1. Build messages array (system prompt + user request + any previous context)
  // 2. Call generateText() with tools and maxSteps: 4
  //    - search_document tool → calls params.searchDocument()
  //    - read_checklist tool → calls params.readChecklist()
  //    - save_checklist_changes tool → BLOCKED, return { blocked: "Awaiting user approval" }
  // 3. Collect tool_log from steps
  // 4. Call generateObject() with finalize schema (no tools)
  // 5. Return AgentResult

  throw new Error("runAgent not yet implemented");
}
