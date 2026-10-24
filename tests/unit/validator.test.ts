import { describe, it, expect } from "vitest";
import { validateProposal } from "../../lib/agent/validator";
import type { TaskBase } from "../../lib/types";

describe("Proposal Validator", () => {
  const paragraphIds = new Set(["N1-P1", "N1-P2", "N1-P3", "N1-P4", "N1-P5"]);
  const paragraphTexts = new Map<string, string>([
    ["N1-P1", "The Registrar's Office will renew student ID cards for the 2026/27 academic year."],
    ["N1-P2", "Each student must submit two documents: a completed renewal form and one recent passport photo."],
    ["N1-P3", "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026."],
    ["N1-P4", "Final-year students are exempt from the passport photo requirement and submit only the form."],
    ["N1-P5", "The renewal form must be signed by the department head before submission."],
  ]);
  const existingTaskIds = new Set(["TSK-0001", "TSK-0002"]);

  it("passes a valid, clean proposal", () => {
    const tasks: TaskBase[] = [
      {
        client_id: "C1",
        action: "create",
        task_id: null,
        description: "Submit completed renewal form and photo",
        source_refs: ["N1-P2", "N1-P3"],
        deadline_date: "2026-11-15",
        deadline_text: "15 November 2026",
        deadline_source: "document",
        condition: null,
        owner: "Student",
        owner_source: "document",
      },
    ];

    const result = validateProposal({
      tasks,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round: 1,
    });

    expect(result.passed).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.questions).toHaveLength(0);
  });

  it("fails with UNKNOWN_PARAGRAPH on invalid source refs", () => {
    const tasks: TaskBase[] = [
      {
        client_id: "C1",
        action: "create",
        task_id: null,
        description: "Submit documents",
        source_refs: ["N1-P99"], // Does not exist
        deadline_date: null,
        deadline_text: null,
        deadline_source: "none",
        condition: null,
        owner: "Student",
        owner_source: "document",
      },
    ];

    const result = validateProposal({
      tasks,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round: 1,
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.code === "UNKNOWN_PARAGRAPH")).toBe(true);
  });

  it("fails with DEADLINE_NOT_IN_SOURCE when deadline text is not in cited paragraphs", () => {
    const tasks: TaskBase[] = [
      {
        client_id: "C1",
        action: "create",
        task_id: null,
        description: "Submit documents",
        source_refs: ["N1-P2"], // Does NOT contain deadline text
        deadline_date: "2026-11-15",
        deadline_text: "15 November 2026",
        deadline_source: "document",
        condition: null,
        owner: "Student",
        owner_source: "document",
      },
    ];

    const result = validateProposal({
      tasks,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round: 1,
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.code === "DEADLINE_NOT_IN_SOURCE")).toBe(true);
  });

  it("fails with INVALID_DATE when deadline date is not a real calendar date", () => {
    const tasks: TaskBase[] = [
      {
        client_id: "C1",
        action: "create",
        task_id: null,
        description: "Submit documents",
        source_refs: ["N1-P3"],
        deadline_date: "2026-02-31", // Invalid date!
        deadline_text: "15 November 2026",
        deadline_source: "document",
        condition: null,
        owner: "Student",
        owner_source: "document",
      },
    ];

    const result = validateProposal({
      tasks,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round: 1,
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.code === "INVALID_DATE")).toBe(true);
  });

  it("generates a clarification question when owner is missing", () => {
    const tasks: TaskBase[] = [
      {
        client_id: "C3",
        action: "create",
        task_id: null,
        description: "Get department head signature",
        source_refs: ["N1-P5"],
        deadline_date: null,
        deadline_text: null,
        deadline_source: "none",
        condition: null,
        owner: null, // Missing owner!
        owner_source: "document",
      },
    ];

    const result = validateProposal({
      tasks,
      paragraphIds,
      paragraphTexts,
      existingTaskIds,
      round: 1,
    });

    expect(result.passed).toBe(false);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].field).toBe("owner");
    expect(result.questions[0].task_client_id).toBe("C3");
  });
});
