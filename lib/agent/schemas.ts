// =============================================
// Finalize Call Zod Schema
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Used with generateObject() for the finalize call.
// The model must return structured JSON matching this schema.
// =============================================

import { z } from "zod";

export const finalizeSchema = z.object({
  summary: z.string().describe("Short summary of the notice and its main requirements"),

  answers_to_request: z
    .string()
    .nullable()
    .describe("Direct answer if the user asked a question about the notice, otherwise null"),

  tasks: z
    .array(
      z.object({
        client_id: z.string().describe("Unique ID within this proposal, e.g. C1, C2"),
        action: z.enum(["create", "update"]).describe("Whether to create a new task or update an existing one"),
        task_id: z.string().nullable().optional().describe("Existing task ID for updates, null for creates"),
        description: z.string().min(5).max(300).describe("Clear action description"),
        source_refs: z.array(z.string()).min(1).max(6).describe("Paragraph IDs this task is based on"),
        deadline_date: z.string().nullable().optional().describe("YYYY-MM-DD date or null"),
        deadline_text: z.string().nullable().optional().describe("Literal deadline text copied from source paragraph"),
        condition: z.string().nullable().optional().describe("Any condition or exception, max 200 chars"),
        owner: z.string().nullable().optional().describe("Responsible person/role or null"),
      })
    )
    .min(1)
    .max(12)
    .describe("Proposed checklist tasks"),

  absent_information: z
    .array(
      z.object({
        topic: z.string().describe("What information is missing"),
        note: z.string().describe("Explanation of what the notice does not state"),
      })
    )
    .describe("Important topics not covered by the notice"),
});

export type FinalizeOutput = z.infer<typeof finalizeSchema>;
