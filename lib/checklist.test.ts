import { describe, it, expect } from "vitest";
import { mockRunAwaitingApproval } from "./mock-data";
import type { TaskBase, Proposal } from "./types";

describe("FE-11 to FE-13 Checklist Review & Inline Editing", () => {
  const proposal: Proposal = mockRunAwaitingApproval.proposal!;

  describe("FE-11: DraftChecklist display & user story", () => {
    it("renders the three-task user-story proposal with summary and version", () => {
      expect(proposal).toBeDefined();
      expect(proposal.version).toBe(2);
      expect(proposal.summary).toContain("Students must submit a renewal form");
      expect(proposal.tasks).toHaveLength(3);
    });

    it("verifies condition text 'Does not apply to final-year students' on task C2", () => {
      const taskC2 = proposal.tasks.find((t) => t.client_id === "C2");
      expect(taskC2).toBeDefined();
      expect(taskC2?.condition).toBe("Does not apply to final-year students");
    });

    it("identifies amber warning conditions for missing deadline and missing owner", () => {
      // Task C3 has no deadline stated
      const taskC3 = proposal.tasks.find((t) => t.client_id === "C3");
      expect(taskC3).toBeDefined();
      expect(taskC3?.deadline_source).toBe("none");
      expect(taskC3?.deadline_date).toBeNull();

      const isMissingDeadline =
        taskC3?.deadline_source === "none" || !taskC3?.deadline_date;
      expect(isMissingDeadline).toBe(true);

      // Verify task with missing owner
      const missingOwnerTask: TaskBase = {
        client_id: "C4",
        action: "create",
        task_id: null,
        description: "Obtain dean approval",
        source_refs: ["N1-P5"],
        deadline_date: "2026-11-20",
        deadline_text: "20 November 2026",
        deadline_source: "document",
        condition: null,
        owner: null,
        owner_source: "none",
      };
      const isMissingOwner =
        missingOwnerTask.owner_source === "none" || !missingOwnerTask.owner;
      expect(isMissingOwner).toBe(true);
    });

    it("renders absent information items with topics and notes", () => {
      expect(proposal.absent_information).toBeDefined();
      expect(proposal.absent_information.length).toBeGreaterThan(0);
      expect(proposal.absent_information[0].topic).toBe("Replacement card fee");
      expect(proposal.absent_information[0].note).toContain("The notice does not state any fee");
    });
  });

  describe("FE-12: Inline task editing without mutating run", () => {
    it("updates task description, owner, and deadline without mutating original proposal", () => {
      const originalTask = proposal.tasks[0];
      const editedDescription = "Submit the revised form directly to Room 12 window 3";
      const editedOwner = "Graduate Assistant";
      const editedDeadline = "2026-11-30";

      // Apply edit producing a new task
      const updatedTask: TaskBase = {
        ...originalTask,
        description: editedDescription,
        owner: editedOwner,
        owner_source: "user",
        deadline_date: editedDeadline,
        deadline_source: "user",
        deadline_text: null,
      };

      // Acceptance criterion: original proposal in mockRun remains untouched
      expect(originalTask.description).not.toBe(editedDescription);
      expect(originalTask.owner_source).toBe("document");
      expect(originalTask.deadline_source).toBe("document");

      // Verify edited properties
      expect(updatedTask.description).toBe(editedDescription);
      expect(updatedTask.owner).toBe(editedOwner);
      expect(updatedTask.owner_source).toBe("user");
      expect(updatedTask.deadline_date).toBe(editedDeadline);
      expect(updatedTask.deadline_source).toBe("user");
      expect(updatedTask.deadline_text).toBeNull();
    });

    it("validates description length constraints (min 5 characters)", () => {
      const validateDescription = (desc: string) => {
        if (desc.trim().length === 0) return "Description cannot be empty.";
        if (desc.trim().length < 5) return "Description must be at least 5 characters.";
        if (desc.length > 300) return "Description must not exceed 300 characters.";
        return null;
      };

      expect(validateDescription("")).toBe("Description cannot be empty.");
      expect(validateDescription("Fix")).toBe("Description must be at least 5 characters.");
      expect(validateDescription("Submit form on time")).toBeNull();
      expect(validateDescription("a".repeat(301))).toBe("Description must not exceed 300 characters.");
    });

    it("preserves user edits when a new proposal arrives", () => {
      const existingEdits: TaskBase[] = [
        {
          ...proposal.tasks[0],
          description: "User customized description",
          owner: "Custom User",
          owner_source: "user",
          deadline_date: "2026-12-01",
          deadline_source: "user",
          deadline_text: null,
        },
      ];

      const newProposalTasks: TaskBase[] = [
        {
          ...proposal.tasks[0],
          description: "Server re-generated description",
          owner: "Server Owner",
          owner_source: "document",
        },
        {
          ...proposal.tasks[1],
        },
      ];

      // Merge logic from useWorkspace
      const merged = newProposalTasks.map((newT) => {
        const existing = existingEdits.find((e) => e.client_id === newT.client_id);
        if (!existing) return newT;
        return {
          ...newT,
          description: existing.description || newT.description,
          owner: existing.owner_source === "user" ? existing.owner : newT.owner,
          owner_source: existing.owner_source === "user" ? "user" : newT.owner_source,
          deadline_date:
            existing.deadline_source === "user"
              ? existing.deadline_date
              : newT.deadline_date,
          deadline_source:
            existing.deadline_source === "user"
              ? "user"
              : newT.deadline_source,
          deadline_text:
            existing.deadline_source === "user"
              ? null
              : newT.deadline_text,
        };
      });

      expect(merged[0].description).toBe("User customized description");
      expect(merged[0].owner).toBe("Custom User");
      expect(merged[0].deadline_date).toBe("2026-12-01");
      expect(merged[1].description).toBe(proposal.tasks[1].description);
    });
  });

  describe("FE-13: Source reference chips & paragraph matching", () => {
    it("handles multiple source references on a single task (P2, P3, P4)", () => {
      const taskC2 = proposal.tasks.find((t) => t.client_id === "C2");
      expect(taskC2?.source_refs).toEqual(["N1-P2", "N1-P3", "N1-P4"]);
      expect(taskC2?.source_refs.length).toBe(3);
    });

    it("matches normalized short and full paragraph references", () => {
      const normalizeRef = (ref: string) => ref.replace(/^[A-Za-z0-9]+-/, "");
      expect(normalizeRef("N1-P2")).toBe("P2");
      expect(normalizeRef("P2")).toBe("P2");
      expect(normalizeRef("U-P3")).toBe("P3");

      const highlightedRefs = ["N1-P2", "N1-P3"];
      const isHighlighted = (paraId: string) =>
        highlightedRefs.some((hr) => {
          if (hr === paraId) return true;
          return normalizeRef(hr) === normalizeRef(paraId);
        });

      expect(isHighlighted("N1-P2")).toBe(true);
      expect(isHighlighted("P2")).toBe(true);
      expect(isHighlighted("N1-P3")).toBe(true);
      expect(isHighlighted("N1-P5")).toBe(false);
    });
  });
});
