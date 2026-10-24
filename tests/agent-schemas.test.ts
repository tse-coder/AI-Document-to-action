import { describe, expect, it } from "vitest";
import { finalizeSchema } from "../lib/agent/schemas";
import {
  readChecklistParams,
  saveChecklistChangesParams,
  searchDocumentParams,
} from "../lib/agent/tools";

describe("agent request schemas", () => {
  it("accepts the minimum and maximum search_document args", () => {
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "ab",
      }).success
    ).toBe(true);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "q".repeat(120),
        max_results: 1,
      }).success
    ).toBe(true);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "q".repeat(120),
        max_results: 8,
      }).success
    ).toBe(true);
  });

  it("rejects out-of-range search_document args", () => {
    expect(
      searchDocumentParams.safeParse({ doc_id: "N1", query: "a" }).success
    ).toBe(false);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "q".repeat(121),
      }).success
    ).toBe(false);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "valid",
        max_results: 0,
      }).success
    ).toBe(false);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "valid",
        max_results: 9,
      }).success
    ).toBe(false);
    expect(
      searchDocumentParams.safeParse({
        doc_id: "N1",
        query: "valid",
        max_results: 2.5,
      }).success
    ).toBe(false);
  });

  it("defaults search max_results to 5", () => {
    const parsed = searchDocumentParams.parse({
      doc_id: "N1",
      query: "deadline",
    });
    expect(parsed.max_results).toBe(5);
  });

  it("requires a document id for read_checklist", () => {
    expect(readChecklistParams.safeParse({ doc_id: "N1" }).success).toBe(true);
    expect(readChecklistParams.safeParse({}).success).toBe(false);
  });

  it("accepts 1 and 12 save_checklist tasks and rejects 0 and 13", () => {
    const base = {
      run_id: "RUN-ABCD1234",
      doc_id: "N1",
    };
    const task = {
      client_id: "C1",
      action: "create" as const,
      task_id: null,
      description: "A sufficiently long task",
      source_refs: ["N1-P1"],
      deadline_date: null,
      deadline_text: null,
      deadline_source: "none" as const,
      condition: null,
      owner: null,
      owner_source: "none" as const,
    };

    expect(
      saveChecklistChangesParams.safeParse({
        ...base,
        tasks: [task],
      }).success
    ).toBe(true);
    expect(
      saveChecklistChangesParams.safeParse({
        ...base,
        tasks: Array.from({ length: 12 }, (_, i) => ({
          ...task,
          client_id: `C${i + 1}`,
        })),
      }).success
    ).toBe(true);
    expect(
      saveChecklistChangesParams.safeParse({
        ...base,
        tasks: [],
      }).success
    ).toBe(false);
    expect(
      saveChecklistChangesParams.safeParse({
        ...base,
        tasks: Array.from({ length: 13 }, (_, i) => ({
          ...task,
          client_id: `C${i + 1}`,
        })),
      }).success
    ).toBe(false);
  });

  it("validates the finalize structured-output shape", () => {
    const valid = {
      summary: "A sufficiently detailed summary.",
      answers_to_request: null,
      tasks: [
        {
          client_id: "C1",
          action: "create",
          task_id: null,
          description: "A sufficiently long task",
          source_refs: ["N1-P1"],
          deadline_date: null,
          deadline_text: null,
          condition: null,
          owner: null,
        },
      ],
      absent_information: [],
    };

    expect(finalizeSchema.safeParse(valid).success).toBe(true);
    expect(
      finalizeSchema.safeParse({ ...valid, tasks: [] }).success
    ).toBe(false);
    expect(
      finalizeSchema.safeParse({
        ...valid,
        tasks: Array.from({ length: 13 }, (_, i) => ({
          ...valid.tasks[0],
          client_id: `C${i + 1}`,
        })),
      }).success
    ).toBe(false);
    expect(
      finalizeSchema.safeParse({ ...valid, summary: undefined }).success
    ).toBe(false);
  });
});
