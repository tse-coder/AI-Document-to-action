// Owner: Member 2 (Frontend Engineer)
// Client-side paragraph utility for immediate preview upon analysis

import type { Paragraph, SavedTask, TaskBase } from "./types";

/**
 * Converts a saved database task into a TaskBase suitable for editing and proposals.
 */
export function savedTaskToTaskBase(saved: SavedTask): TaskBase {
  return {
    client_id: saved.client_id || saved.task_id,
    action: saved.action || "update",
    task_id: saved.task_id,
    description: saved.description,
    source_refs: saved.source_refs || [],
    deadline_date: saved.deadline_date ?? null,
    deadline_text: saved.deadline_text ?? null,
    deadline_source: saved.deadline_source || "none",
    condition: saved.condition ?? null,
    owner: saved.owner ?? null,
    owner_source: saved.owner_source || "none",
  };
}

/**
 * Splits pasted text on blank lines, trims each piece, drops empty parts,
 * and formats numbered paragraphs.
 * Matches docs/api-spec.md Section 1 paragraph splitting rule.
 */
export function splitParagraphs(text: string, docPrefix = "P"): Paragraph[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .slice(0, 40); // Cap at maximum 40 paragraphs

  return parts.map((chunk, index) => ({
    paragraph_id: `${docPrefix}-P${index + 1}`,
    position: index + 1,
    text: chunk,
  }));
}
