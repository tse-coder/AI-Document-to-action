// =============================================
// Date & Text Citation Utilities
// Owner: Member 3 (AI Agent Engineer)
// =============================================

import * as chrono from "chrono-node";

/**
 * Normalizes text for lenient verbatim checking:
 * strips extra whitespace, normalizes quotes and punctuation.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Checks if the needle (substring) appears verbatim inside any of the haystack paragraphs.
 */
export function isTextInSources(needle: string, haystacks: string[]): boolean {
  if (!needle || !needle.trim()) return false;
  const normalizedNeedle = normalizeText(needle);

  for (const paragraph of haystacks) {
    const normalizedParagraph = normalizeText(paragraph);
    if (normalizedParagraph.includes(normalizedNeedle)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates whether a string is a real calendar date in YYYY-MM-DD format.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parses natural language date text (e.g. "15 November 2026") into ISO YYYY-MM-DD.
 * Returns null if no valid date can be extracted.
 */
export function parseDateFromText(text: string): string | null {
  if (!text || !text.trim()) return null;

  try {
    const parsed = chrono.parseDate(text);
    if (!parsed) return null;

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");

    const iso = `${year}-${month}-${day}`;
    return isValidCalendarDate(iso) ? iso : null;
  } catch {
    return null;
  }
}
