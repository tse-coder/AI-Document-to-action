import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDocuments, getDocument, getChecklist } from "../api-client";
import { mockDocuments, mockChecklistDetailN1 } from "../mock-data";

describe("FE-06 & FE-07 Workspace State and Notice Selection", () => {
  const originalMock = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalMock;
  });

  it("fetches documents for the sidebar", async () => {
    const { documents } = await getDocuments();
    expect(documents).toHaveLength(2);
    expect(documents[0].doc_id).toBe("N1");
    expect(documents[1].doc_id).toBe("N2");
  });

  it("loads document details and paragraphs on selection", async () => {
    const docResult = await getDocument("N1");
    expect(docResult.document.doc_id).toBe("N1");
    expect(docResult.paragraphs).toHaveLength(5);
    expect(docResult.paragraphs[0].paragraph_id).toBe("N1-P1");
  });

  it("loads checklist details for the selected notice", async () => {
    const checklistResult = await getChecklist("N1");
    expect(checklistResult.doc_id).toBe("N1");
    expect(checklistResult.tasks.length).toBeGreaterThan(0);
    expect(checklistResult.tasks[0].sources.length).toBeGreaterThan(0);
  });

  it("provides correct document metadata for badges (demo vs pasted)", () => {
    expect(mockDocuments[0].origin).toBe("demo");
    expect(mockDocuments[0].paragraph_count).toBe(5);
  });

  it("correctly links tasks to source paragraphs", () => {
    const task = mockChecklistDetailN1.tasks[0];
    expect(task.source_refs).toContain("N1-P2");
    expect(task.sources.some((s) => s.paragraph_id === "N1-P2")).toBe(true);
  });
});
