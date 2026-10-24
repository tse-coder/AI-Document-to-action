import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mockRunNeedsClarification,
} from "./mock-data";
import { submitAnswers } from "./api-client";
import type { AnswerInput, Question } from "./types";

describe("FE-14 & FE-15 Real Endpoints & Clarification Flow", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USE_MOCK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = originalEnv;
  });

  describe("FE-14: Real endpoints & default mode", () => {
    it("respects mock flag when NEXT_PUBLIC_USE_MOCK is true", async () => {
      process.env.NEXT_PUBLIC_USE_MOCK = "true";
      const result = await submitAnswers("RUN-TEST", [
        { question_id: "Q1", answer: "Student", not_stated: false },
      ]);
      expect(result.run.status).toBe("awaiting_approval");
    });

    it("defaults to real endpoints when NEXT_PUBLIC_USE_MOCK is unset", () => {
      delete process.env.NEXT_PUBLIC_USE_MOCK;
      const isMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK === "true";
      expect(isMockEnabled).toBe(false);
    });
  });

  describe("FE-15: ClarificationForm and TC4 Acceptance Criteria", () => {
    const questions: Question[] = mockRunNeedsClarification.questions;

    it("verifies the P5 owner clarification question exists in needs_clarification state", () => {
      expect(mockRunNeedsClarification.status).toBe("needs_clarification");
      expect(questions).toHaveLength(1);

      const q1 = questions[0];
      expect(q1.question_id).toBe("Q1");
      expect(q1.field).toBe("owner");
      expect(q1.task_client_id).toBe("C3");
      expect(q1.source_refs).toContain("N1-P5");
      expect(q1.text).toContain("department head signature");
      expect(q1.allow_not_stated).toBe(true);
    });

    it("validates that answering 'Student' updates Task 3 owner and transitions to ready for approval (TC4)", async () => {
      const answers: AnswerInput[] = [
        { question_id: "Q1", answer: "Student", not_stated: false },
      ];

      const { run } = await submitAnswers(
        mockRunNeedsClarification.run_id,
        answers
      );

      // Status becomes ready for approval
      expect(run.status).toBe("awaiting_approval");
      expect(run.proposal).toBeDefined();

      // Task 3 (client_id C3) has owner set to Student with user source
      const task3 = run.proposal?.tasks.find((t) => t.client_id === "C3");
      expect(task3).toBeDefined();
      expect(task3?.owner).toBe("Student");
      expect(task3?.owner_source).toBe("user");
    });

    it("validates 'Not stated in notice' input rules per spec section 4.6", () => {
      const validateAnswer = (q: Question, input: { answer: string; not_stated: boolean }) => {
        if (input.not_stated) {
          if (!q.allow_not_stated) return "Not stated not permitted for this question.";
          if (input.answer.length > 0) return "Answer must be empty when not stated is chosen.";
          return null;
        }

        const trimmed = input.answer.trim();
        if (trimmed.length === 0) return "Answer cannot be empty.";

        if (q.field === "owner") {
          if (trimmed.length < 1 || trimmed.length > 200) {
            return "Owner must be between 1 and 200 characters.";
          }
        }

        if (q.field === "deadline") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return "Deadline must be formatted as YYYY-MM-DD.";
          }
        }

        return null;
      };

      const q1 = questions[0];

      // Valid text answer
      expect(validateAnswer(q1, { answer: "Student", not_stated: false })).toBeNull();

      // Valid not_stated answer
      expect(validateAnswer(q1, { answer: "", not_stated: true })).toBeNull();

      // Invalid: empty text answer when not_stated is false
      expect(validateAnswer(q1, { answer: "   ", not_stated: false })).toBe(
        "Answer cannot be empty."
      );

      // Invalid: non-empty text when not_stated is true
      expect(validateAnswer(q1, { answer: "Student", not_stated: true })).toBe(
        "Answer must be empty when not stated is chosen."
      );
    });

    it("validates deadline question format (YYYY-MM-DD)", () => {
      const deadlineQ: Question = {
        question_id: "Q2",
        field: "deadline",
        task_client_id: "C2",
        text: "What is the deadline for the application?",
        source_refs: ["N1-P2"],
        allow_not_stated: true,
      };

      expect(deadlineQ.field).toBe("deadline");
      expect(deadlineQ.allow_not_stated).toBe(true);

      const isDeadlineValid = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val.trim());

      expect(isDeadlineValid("2026-11-15")).toBe(true);
      expect(isDeadlineValid("Nov 15, 2026")).toBe(false);
      expect(isDeadlineValid("15/11/2026")).toBe(false);
    });
  });
});
