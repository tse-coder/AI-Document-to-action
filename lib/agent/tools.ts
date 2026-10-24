// =============================================
// Agent Tool Definitions
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Vercel AI SDK tool definitions.
// The execute functions are injected at runtime by Member 4.
// =============================================

import { z } from "zod";

// Tool parameter schemas (used in run-agent.ts with Vercel AI SDK tool())

export const searchDocumentParams = z.object({
  doc_id: z.string().describe("The document ID to search"),
  query: z
    .string()
    .min(2)
    .max(120)
    .describe("Keyword query to search for in the document"),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(5)
    .describe("Maximum number of paragraph matches to return"),
});

export const readChecklistParams = z.object({
  doc_id: z.string().describe("The document ID to read checklist for"),
});

export const saveChecklistChangesParams = z.object({
  run_id: z.string().describe("The current run ID"),
  doc_id: z.string().describe("The document ID"),
  tasks: z
    .array(
      z.object({
        client_id: z.string(),
        action: z.enum(["create", "update"]),
        task_id: z.string().nullable().optional(),
        description: z.string(),
        source_refs: z.array(z.string()),
        deadline_date: z.string().nullable().optional(),
        deadline_text: z.string().nullable().optional(),
        deadline_source: z.enum(["document", "user", "none"]),
        condition: z.string().nullable().optional(),
        owner: z.string().nullable().optional(),
        owner_source: z.enum(["document", "user", "none"]),
      })
    )
    .min(1)
    .max(12)
    .describe("Tasks to save"),
});

export type SearchDocumentArgs = z.infer<typeof searchDocumentParams>;
export type ReadChecklistArgs = z.infer<typeof readChecklistParams>;
export type SaveChecklistChangesArgs = z.infer<typeof saveChecklistChangesParams>;
