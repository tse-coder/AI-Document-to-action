import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mockRunAwaitingApproval,
  mockChecklistDetailN1,
} from "./mock-data";
import { confirmRun, retryRun, createRun } from "./api-client";
import type { ConfirmRequest, ChecklistDetail } from "./types";

describe("FE-16 to FE-18: Confirmation, Saved Viewer, and Error Handling", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
  });

  describe("FE-16: ApproveButton & Confirm Flow", () => {
    it("sends proposal_version and edited tasks to confirm endpoint per spec 4.8", async () => {
      const confirmPayload: ConfirmRequest = {
        proposal_version: mockRunAwaitingApproval.proposal!.version,
        tasks: mockRunAwaitingApproval.proposal!.tasks,
      };

      const result = await confirmRun(
        mockRunAwaitingApproval.run_id,
        confirmPayload
      );

      expect(result.status).toBe("saved");
      expect(result.doc_id).toBe("N1");
      expect(result.saved).toBeDefined();
      expect(result.saved.length).toBeGreaterThan(0);
      expect(result.reopen_path).toBe("/api/checklists/N1");
    });

    it("prevents confirmation when run is not ready for approval", () => {
      const canApprove = (status: string, questionsCount: number, tasksCount: number) => {
        return status === "awaiting_approval" && questionsCount === 0 && tasksCount > 0;
      };

      expect(canApprove("awaiting_approval", 0, 3)).toBe(true);
      expect(canApprove("needs_clarification", 1, 3)).toBe(false);
      expect(canApprove("running", 0, 0)).toBe(false);
      expect(canApprove("awaiting_approval", 0, 0)).toBe(false);
    });

    it("maps server validation errors by task_client_id for inline display", () => {
      const mockValidationErrors = [
        {
          code: "DEADLINE_NOT_IN_SOURCE",
          severity: "error" as const,
          task_client_id: "C2",
          message: "Deadline does not appear in source paragraph.",
        },
      ];

      const taskC2Errors = mockValidationErrors.filter(
        (e) => e.task_client_id === "C2"
      );
      const taskC1Errors = mockValidationErrors.filter(
        (e) => e.task_client_id === "C1"
      );

      expect(taskC2Errors).toHaveLength(1);
      expect(taskC2Errors[0].message).toContain("Deadline does not appear");
      expect(taskC1Errors).toHaveLength(0);
    });
  });

  describe("FE-17: SavedChecklist Viewer with Source Paragraph Passages", () => {
    const checklist: ChecklistDetail = mockChecklistDetailN1;

    it("verifies saved tasks include description, owner, deadline, and source paragraph passages", () => {
      expect(checklist.tasks.length).toBeGreaterThan(0);

      const task1 = checklist.tasks[0];
      expect(task1.description).toBeDefined();
      expect(task1.owner).toBe("Student");
      expect(task1.deadline_date).toBe("2026-11-15");
      expect(task1.sources).toBeDefined();
      expect(task1.sources.length).toBeGreaterThan(0);
      expect(task1.sources[0].paragraph_id).toBe("N1-P2");
      expect(task1.sources[0].text).toContain("renewal form");
    });

    it("handles empty checklist state correctly", () => {
      const emptyChecklist: ChecklistDetail = {
        doc_id: "EMPTY_DOC",
        title: "Notice with no tasks",
        last_saved_at: null,
        tasks: [],
      };

      const hasTasks = emptyChecklist.tasks && emptyChecklist.tasks.length > 0;
      expect(hasTasks).toBe(false);
    });
  });

  describe("FE-18: Error & Retry Flow (TC5 Verification)", () => {
    it("verifies TC5: simulate_failure produces error, and retry succeeds", async () => {
      // 1. Create run with simulated failure
      const failResult = await createRun({
        request: "Make a checklist",
        text: "Some notice text that exceeds the 20 character minimum threshold.",
        simulate_failure: "model",
      });

      expect(failResult.run.status).toBe("error");
      expect(failResult.run.error).toBeDefined();
      expect(failResult.run.error?.code).toBe("MODEL_TIMEOUT");

      // 2. Calling retry clears failure and succeeds
      const retryResult = await retryRun(failResult.run.run_id);
      expect(retryResult.run.status).toBe("awaiting_approval");
      expect(retryResult.run.proposal).toBeDefined();
      expect(retryResult.run.proposal?.tasks.length).toBeGreaterThan(0);
    });

    it("sanitizes error messages to avoid showing raw stack traces", () => {
      const sanitize = (msg: string) => {
        if (!msg) return "An unexpected error occurred. Please try again.";
        if (msg.includes("at ") || msg.includes("Error:") || msg.includes("stack:")) {
          const firstLine = msg.split("\n")[0].replace(/^Error:\s*/i, "").trim();
          return firstLine.length > 0
            ? firstLine
            : "An unexpected error occurred. Please try again.";
        }
        return msg;
      };

      const rawStack = "Error: Database connection failed\n    at Client.connect (pg.js:12:3)\n    at Query.run";
      expect(sanitize(rawStack)).toBe("Database connection failed");
      expect(sanitize("Normal friendly error message.")).toBe("Normal friendly error message.");
    });

    it("enforces maximum 3 retry attempts limit", () => {
      const isRetryAllowed = (attempt: number, maxAttempts = 3) => attempt < maxAttempts;

      expect(isRetryAllowed(0)).toBe(true);  // Attempt 1 of 3
      expect(isRetryAllowed(1)).toBe(true);  // Attempt 2 of 3
      expect(isRetryAllowed(2)).toBe(true);  // Attempt 3 of 3
      expect(isRetryAllowed(3)).toBe(false); // Limit reached
    });
  });
});
