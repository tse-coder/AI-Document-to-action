// Owner: Member 2 (Frontend Engineer)
// Client-side paragraph utility for immediate preview upon analysis

import type { Paragraph } from "./types";

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
