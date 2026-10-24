import { describe, it, expect } from "vitest";
import { searchParagraphs, extractQueryTerms } from "../../lib/agent/search";
import type { Paragraph } from "../../lib/types";

describe("Keyword Document Retrieval", () => {
  const mockParagraphs: Paragraph[] = [
    {
      paragraph_id: "N1-P1",
      position: 1,
      text: "The Registrar's Office will renew student ID cards for the 2026/27 academic year.",
    },
    {
      paragraph_id: "N1-P2",
      position: 2,
      text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
    },
    {
      paragraph_id: "N1-P3",
      position: 3,
      text: "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
    },
    {
      paragraph_id: "N1-P4",
      position: 4,
      text: "Final-year students are exempt from the passport photo requirement and submit only the form.",
    },
    {
      paragraph_id: "N1-P5",
      position: 5,
      text: "The renewal form must be signed by the department head before submission.",
    },
  ];

  it("extracts distinct query terms excluding stop words", () => {
    const terms = extractQueryTerms("the student must submit by deadline");
    expect(terms).toContain("student");
    expect(terms).toContain("submit");
    expect(terms).toContain("deadline");
    expect(terms).not.toContain("the");
    expect(terms).not.toContain("by");
  });

  it("scores and ranks paragraphs matching query terms", () => {
    const result = searchParagraphs("N1", mockParagraphs, "documents deadline submitted", 5);
    expect(result.matches.length).toBeGreaterThan(0);
    // P3 has "documents", "submitted", but not "deadline" (it has "by 15 November")
    expect(result.matches[0].score).toBeGreaterThan(0);
    expect(result.doc_id).toBe("N1");
    expect(result.total_paragraphs).toBe(5);
  });

  it("returns empty matches when query has zero matches", () => {
    const result = searchParagraphs("N1", mockParagraphs, "astronomy spaceship", 5);
    expect(result.matches).toHaveLength(0);
  });
});
