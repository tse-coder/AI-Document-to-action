import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getDocuments,
  getDocument,
  createRun,
  getRun,
  submitAnswers,
  confirmRun,
  retryRun,
  getChecklists,
  getChecklist,
  ApiError,
} from "./api-client";

describe("FE-04 API Client", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
  });

  it("fetches documents in mock mode", async () => {
    const res = await getDocuments();
    expect(res.documents.length).toBeGreaterThanOrEqual(2);
  });

  it("fetches a specific document with paragraphs in mock mode", async () => {
    const res = await getDocument("N1");
    expect(res.document.doc_id).toBe("N1");
    expect(res.paragraphs).toHaveLength(5);
  });

  it("fetches run status in mock mode", async () => {
    const res = await getRun("RUN-AWAITING01");
    expect(res.run.status).toBe("awaiting_approval");
  });

  it("creates a run and returns clarification in mock mode", async () => {
    const res = await createRun({
      doc_id: "N1",
      request: "Make a checklist",
    });
    expect(res.run.status).toBe("needs_clarification");
    expect(res.run.questions.length).toBeGreaterThan(0);
  });

  it("simulates model failure when simulate_failure is set", async () => {
    const res = await createRun({
      doc_id: "N1",
      request: "Make a checklist",
      simulate_failure: "model",
    });
    expect(res.run.status).toBe("error");
    expect(res.run.error?.code).toBe("MODEL_TIMEOUT");
  });

  it("handles answer submission in mock mode", async () => {
    const res = await submitAnswers("RUN-CLARIFY01", [
      { question_id: "Q1", answer: "Student", not_stated: false },
    ]);
    expect(res.run.status).toBe("awaiting_approval");
  });

  it("handles retry in mock mode", async () => {
    const res = await retryRun("RUN-ERROR01");
    expect(res.run.status).toBe("awaiting_approval");
  });

  it("handles confirmation in mock mode", async () => {
    const res = await confirmRun("RUN-AWAITING01", {
      proposal_version: 2,
      tasks: [],
    });
    expect(res.status).toBe("saved");
    expect(res.saved.length).toBeGreaterThan(0);
  });

  it("fetches checklists in mock mode", async () => {
    const listRes = await getChecklists();
    expect(listRes.checklists.length).toBeGreaterThan(0);

    const detailRes = await getChecklist("N1");
    expect(detailRes.doc_id).toBe("N1");
    expect(detailRes.tasks.length).toBeGreaterThan(0);
  });

  it("ApiError class correctly stores fields", () => {
    const err = new ApiError({
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      retryable: false,
      run_id: "RUN-123",
      details: [{ field: "title", message: "Too short" }],
    });
    expect(err.name).toBe("ApiError");
    expect(err.code).toBe("VALIDATION_FAILED");
    expect(err.message).toBe("Validation failed");
    expect(err.retryable).toBe(false);
    expect(err.runId).toBe("RUN-123");
    expect(err.details).toHaveLength(1);
  });
});
