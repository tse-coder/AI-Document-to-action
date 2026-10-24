import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { deleteChecklist, deleteDocument, sendChatMessage } from "./api-client";

describe("Checklist Deletion & Document Chat Functionality", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
  });

  describe("Delete Checklist Functionality", () => {
    it("successfully calls deleteChecklist and returns deleted confirmation", async () => {
      const result = await deleteChecklist("N1");
      expect(result).toBeDefined();
      expect(result.doc_id).toBe("N1");
      expect(result.deleted).toBe(true);
    });
  });

  describe("Delete Document/Notice Functionality", () => {
    it("successfully calls deleteDocument and returns deleted confirmation", async () => {
      const result = await deleteDocument("N1");
      expect(result).toBeDefined();
      expect(result.doc_id).toBe("N1");
      expect(result.deleted).toBe(true);
    });
  });


  describe("Document Chat Assistant Functionality", () => {
    it("sends a chat query and receives an answer with cited paragraphs", async () => {
      const response = await sendChatMessage("N1", "What is the deadline for renewal?");
      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(typeof response.answer).toBe("string");
      expect(response.cited_paragraphs).toBeDefined();
      expect(response.cited_paragraphs.length).toBeGreaterThan(0);
      expect(response.cited_paragraphs).toContain("N1-P2");
    });

    it("extracts cited paragraph chips from model text", () => {
      const answerText =
        "Renewal documents must be submitted by 15 November 2026 as stated in [N1-P2] and [N1-P3]. Final-year students are exempted under [P4].";
      const matches = answerText.match(/\[([A-Za-z0-9_-]+P\d+|P\d+)\]/g) || [];
      const cited = Array.from(new Set(matches.map((m) => m.replace(/[\[\]]/g, ""))));

      expect(cited).toEqual(["N1-P2", "N1-P3", "P4"]);
    });
  });
});
