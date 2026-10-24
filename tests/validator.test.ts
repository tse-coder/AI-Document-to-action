import { describe, expect, it } from "vitest";
import { validateProposal } from "../lib/agent/validator";
import type { TaskBase } from "../lib/types";
import { createTask, validTask } from "./support/fixtures";

describe("validateProposal", () => {
  const paragraphIds = ["N1-P1", "N1-P2", "N1-P3", "N1-P4", "N1-P5"];
  const paragraphTexts = new Map<string, string>([
    [
      "N1-P1",
      "The Registrar's Office will renew student ID cards for the 2026/27 academic year.",
    ],
    [
      "N1-P2",
      "Each student must submit two documents: a completed renewal form and one recent passport photo.",
    ],
    [
      "N1-P3",
      "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
    ],
    [
      "N1-P4",
      "Final-year students are exempt from the passport photo requirement and submit only the form.",
    ],
    [
      "N1-P5",
      "The renewal form must be signed by the department head before submission.",
    ],
  ]);
  const existingTaskIds = ["TSK-0001", "TSK-0002"];

  function validate(
    tasks: TaskBase[],
    overrides: Partial<{
      paragraphIds: string[];
      paragraphTexts: Map<string, string>;
      existingTaskIds: string[];
    }> = {}
  ) {
    return validateProposal({
      tasks,
      paragraphIds: overrides.paragraphIds ?? paragraphIds,
      paragraphTexts: overrides.paragraphTexts ?? paragraphTexts,
      existingTaskIds: overrides.existingTaskIds ?? existingTaskIds,
    });
  }

  function issueCodes(tasks: TaskBase[]) {
    return validate(tasks).issues.map((issue) => issue.code);
  }

  it("accepts a valid update with a document deadline and an existing target", () => {
    const result = validate([validTask()]);

    expect(result.passed).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.questions).toEqual([]);
  });

  it("accepts a valid create with no deadline and a user owner", () => {
    const result = validate([createTask()]);
    expect(result.passed).toBe(true);
  });

  it("emits UNKNOWN_PARAGRAPH for a missing or foreign paragraph", () => {
    expect(issueCodes([validTask({ source_refs: ["N1-P99"] })])).toContain(
      "UNKNOWN_PARAGRAPH"
    );
    expect(issueCodes([validTask({ source_refs: ["N2-P1"] })])).toContain(
      "UNKNOWN_PARAGRAPH"
    );
  });

  it("emits NO_SOURCE_REFS for a task without citations", () => {
    const result = validate([validTask({ source_refs: [] })]);
    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "NO_SOURCE_REFS",
          severity: "error",
          task_client_id: "C1",
        }),
      ])
    );
  });

  it("emits DEADLINE_NOT_IN_SOURCE when the document deadline is not cited", () => {
    expect(
      issueCodes([
        validTask({
          deadline_date: "2026-11-20",
          deadline_text: "20 November 2026",
        }),
      ])
    ).toContain("DEADLINE_NOT_IN_SOURCE");
  });

  it("emits DEADLINE_DATE_MISMATCH when the date contradicts the text", () => {
    expect(
      issueCodes([
        validTask({
          deadline_date: "2026-11-20",
          deadline_text: "15 November 2026",
        }),
      ])
    ).toContain("DEADLINE_DATE_MISMATCH");
  });

  it("emits INVALID_DATE for an impossible calendar date", () => {
    expect(
      issueCodes([
        validTask({
          deadline_date: "2026-02-30",
          deadline_text: "15 November 2026",
        }),
      ])
    ).toContain("INVALID_DATE");
  });

  it("emits UPDATE_TARGET_NOT_FOUND for an update with no matching existing task", () => {
    expect(
      issueCodes([validTask({ task_id: "TSK-9999" })])
    ).toContain("UPDATE_TARGET_NOT_FOUND");
  });

  it("emits EMPTY_DESCRIPTION for a whitespace-only description", () => {
    expect(issueCodes([validTask({ description: "   " })])).toContain(
      "EMPTY_DESCRIPTION"
    );
  });

  it("turns a missing owner into a clarification question", () => {
    const result = validate([
      validTask({ owner: null, owner_source: "document" }),
    ]);

    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_OWNER",
          severity: "question",
        }),
      ])
    );
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({
      field: "owner",
      task_client_id: "C1",
      allow_not_stated: true,
    });
  });

  it("turns a missing deadline into a clarification question when the source has one", () => {
    const result = validate([
      validTask({
        source_refs: ["N1-P3"],
        deadline_date: null,
        deadline_text: null,
        deadline_source: "document",
      }),
    ]);

    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_DEADLINE",
          severity: "question",
        }),
      ])
    );
    expect(result.questions[0].field).toBe("deadline");
  });

  it("emits OWNER_NOT_STATED as a non-blocking warning", () => {
    const result = validate([validTask({ owner: null, owner_source: "none" })]);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "OWNER_NOT_STATED",
          severity: "warning",
        }),
      ])
    );
    expect(result.passed).toBe(true);
  });

  it("emits DEADLINE_NOT_STATED as a non-blocking warning", () => {
    const result = validate([
      validTask({
        deadline_date: null,
        deadline_text: null,
        deadline_source: "none",
      }),
    ]);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DEADLINE_NOT_STATED",
          severity: "warning",
        }),
      ])
    );
    expect(result.passed).toBe(true);
  });

  it("does not require a deadline to appear in source when the source is the user", () => {
    const result = validate([
      validTask({
        source_refs: ["N1-P2"],
        deadline_date: "2026-12-01",
        deadline_text: null,
        deadline_source: "user",
      }),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it("reports multiple independent errors at once", () => {
    const result = validate([
      validTask({
        client_id: "C1",
        source_refs: ["N1-P99"],
        description: "   ",
        task_id: "TSK-9999",
      }),
      createTask({
        client_id: "C2",
        source_refs: [],
      }),
    ]);

    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNKNOWN_PARAGRAPH", task_client_id: "C1" }),
        expect.objectContaining({ code: "EMPTY_DESCRIPTION", task_client_id: "C1" }),
        expect.objectContaining({ code: "UPDATE_TARGET_NOT_FOUND", task_client_id: "C1" }),
        expect.objectContaining({ code: "NO_SOURCE_REFS", task_client_id: "C2" }),
      ])
    );
  });
});
