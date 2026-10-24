import { describe, it, expect } from "vitest";
import { runAgent } from "../../lib/agent/run-agent";
import type { SearchResult, ReadResult } from "../../lib/agent/run-agent";

describe("Agent Orchestrator (runAgent)", () => {
  const paragraphIds = new Set(["N1-P1", "N1-P2", "N1-P3"]);
  const paragraphTexts = new Map<string, string>([
    ["N1-P1", "Notice regarding renewal."],
    ["N1-P2", "Submit form and photo."],
    ["N1-P3", "Deadline is 15 November 2026."],
  ]);

  const mockSearchDocument = async (): Promise<SearchResult> => ({
    doc_id: "N1",
    total_paragraphs: 3,
    matches: [
      { paragraph_id: "N1-P3", position: 3, text: "Deadline is 15 November 2026.", score: 2 },
    ],
  });

  const mockReadChecklist = async (): Promise<ReadResult> => ({
    doc_id: "N1",
    tasks: [],
  });

  it("handles simulated model failure (simulateFailure: 'model')", async () => {
    const result = await runAgent({
      docId: "N1",
      request: "Make a checklist",
      simulateFailure: "model",
      paragraphIds,
      paragraphTexts,
      searchDocument: mockSearchDocument,
      readChecklist: mockReadChecklist,
    });

    expect(result.status).toBe("error");
    expect(result.error?.code).toBe("MODEL_ERROR");
  });

  it("handles simulated tool failure (simulateFailure: 'tool')", async () => {
    const result = await runAgent({
      docId: "N1",
      request: "Make a checklist",
      simulateFailure: "tool",
      paragraphIds,
      paragraphTexts,
      searchDocument: mockSearchDocument,
      readChecklist: mockReadChecklist,
    });

    expect(result.status).toBe("error");
    expect(result.error).not.toBeNull();
  });
});
