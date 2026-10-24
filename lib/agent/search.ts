// =============================================
// Keyword Document Retrieval Engine
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Specification:
// Lowercase the query, drop stop words, score each paragraph by
// the count of distinct query terms it contains, return matches with
// score > 0 sorted by score DESC, position ASC.
// =============================================

import type { Paragraph } from "../types";

export interface ParagraphMatch {
  paragraph_id: string;
  position: number;
  text: string;
  score: number;
}

export interface SearchResult {
  doc_id: string;
  total_paragraphs: number;
  matches: ParagraphMatch[];
}

export const COMMON_STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any",
  "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "can't", "cannot", "could", "couldn't", "did",
  "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few",
  "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
  "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
  "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
  "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
  "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "should", "shouldn't", "so", "some", "such", "than", "that",
  "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasn't", "we", "were", "weren't", "what", "when", "where", "which", "while", "who",
  "whom", "why", "with", "won't", "would", "wouldn't", "you", "your", "yours", "yourself",
  "yourselves"
]);

/**
 * Extracts distinct non-stop-word query terms.
 */
export function extractQueryTerms(query: string): string[] {
  if (!query) return [];

  const tokens = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !COMMON_STOP_WORDS.has(t));

  return Array.from(new Set(tokens));
}

/**
 * Deterministically searches document paragraphs by keyword score.
 */
export function searchParagraphs(
  docId: string,
  paragraphs: Paragraph[],
  query: string,
  maxResults: number = 5
): SearchResult {
  const terms = extractQueryTerms(query);
  const total = paragraphs.length;

  if (terms.length === 0 || total === 0) {
    return {
      doc_id: docId,
      total_paragraphs: total,
      matches: [],
    };
  }

  const scored: ParagraphMatch[] = [];

  for (const p of paragraphs) {
    const textLower = p.text.toLowerCase();
    let score = 0;

    for (const term of terms) {
      // Check if distinct term appears in paragraph text
      if (textLower.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({
        paragraph_id: p.paragraph_id,
        position: p.position,
        text: p.text,
        score,
      });
    }
  }

  // Sort by score DESC, then position ASC
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.position - b.position;
  });

  const matches = scored.slice(0, Math.max(1, maxResults));

  return {
    doc_id: docId,
    total_paragraphs: total,
    matches,
  };
}
