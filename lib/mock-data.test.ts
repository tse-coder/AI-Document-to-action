import { describe, it, expect } from "vitest";
import {
  mockDocuments,
  mockParagraphsN1,
  mockRunRunning,
  mockRunNeedsClarification,
  mockRunAwaitingApproval,
  mockRunError,
  mockRunSaved,
  mockChecklists,
  mockChecklistDetailN1,
} from "./mock-data";

describe("FE-03 Mock Data File", () => {
  it("provides hardcoded documents with required fields", () => {
    expect(mockDocuments.length).toBeGreaterThanOrEqual(2);
    expect(mockDocuments[0].title).toBe("Student ID Card Renewal Notice");
    expect(mockDocuments[1].title).toBe("Lab Equipment Borrowing Procedure");
  });

  it("provides five numbered paragraphs for N1", () => {
    expect(mockParagraphsN1).toHaveLength(5);
    expect(mockParagraphsN1[0].paragraph_id).toBe("N1-P1");
    expect(mockParagraphsN1[4].paragraph_id).toBe("N1-P5");
  });

  it("provides runs in each required state", () => {
    expect(mockRunRunning.status).toBe("running");
    expect(mockRunNeedsClarification.status).toBe("needs_clarification");
    expect(mockRunNeedsClarification.questions.length).toBeGreaterThan(0);
    expect(mockRunAwaitingApproval.status).toBe("awaiting_approval");
    expect(mockRunError.status).toBe("error");
    expect(mockRunError.error?.code).toBe("MODEL_TIMEOUT");
    expect(mockRunSaved.status).toBe("saved");
  });

  it("contains the 3-task draft with condition and absent information", () => {
    const proposal = mockRunAwaitingApproval.proposal;
    expect(proposal).not.toBeNull();
    expect(proposal?.tasks).toHaveLength(3);

    const exemptTask = proposal?.tasks.find((t) =>
      t.condition?.includes("final-year")
    );
    expect(exemptTask).toBeDefined();
    expect(exemptTask?.condition).toBe("Does not apply to final-year students");

    const noDeadlineTask = proposal?.tasks.find(
      (t) => t.deadline_source === "none"
    );
    expect(noDeadlineTask).toBeDefined();

    expect(proposal?.absent_information.length).toBeGreaterThan(0);
  });

  it("provides mock checklists satisfying summary and detail schemas", () => {
    expect(mockChecklists).toHaveLength(1);
    expect(mockChecklistDetailN1.tasks.length).toBeGreaterThan(0);
    expect(mockChecklistDetailN1.tasks[0].sources.length).toBeGreaterThan(0);
  });
});
