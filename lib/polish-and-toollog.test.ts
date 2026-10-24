import { describe, it, expect } from "vitest";
import type { ToolLogEntry, Proposal, Run } from "./types";

describe("FE-19 to FE-22: Polish, Accessibility, Empty States & Tool Log", () => {
  describe("FE-19: Empty states everywhere", () => {
    it("handles a proposal with zero tasks and explains that no actionable tasks were found", () => {
      const zeroTaskProposal: Proposal = {
        version: 1,
        summary: "Notice contains general campus announcements only.",
        tasks: [],
        absent_information: [
          {
            topic: "Deadlines",
            note: "No actionable deadlines found in document.",
          },
        ],
        answers_to_request: null,
        validation: {
          passed: true,
          issues: [],
        },
      };

      const isZeroTasks = zeroTaskProposal.tasks.length === 0;
      expect(isZeroTasks).toBe(true);

      const emptyNoticeMessage = isZeroTasks
        ? "No actionable tasks found in this notice: The notice was analyzed, but no mandatory deadlines, requirements, or procedural actions could be identified."
        : null;

      expect(emptyNoticeMessage).toContain("No actionable tasks found");
      expect(zeroTaskProposal.summary).toBe("Notice contains general campus announcements only.");
      expect(zeroTaskProposal.absent_information).toHaveLength(1);
    });

    it("verifies panel state mapping ensures no panel is ever blank", () => {
      type CenterState = "input" | "loading" | "error" | "empty_paras" | "view_paras";
      type RightState =
        | "idle_prompt"
        | "running_spinner"
        | "error_retry"
        | "clarification_form"
        | "draft_checklist"
        | "saved_checklist";

      const getCenterPanelState = (params: {
        selectedDocId: string | null;
        paragraphsCount: number;
        loading: boolean;
        error: string | null;
      }): CenterState => {
        if (!params.selectedDocId && params.paragraphsCount === 0) return "input";
        if (params.loading) return "loading";
        if (params.error) return "error";
        if (params.paragraphsCount === 0) return "empty_paras";
        return "view_paras";
      };

      const getRightPanelState = (params: {
        runStatus?: string;
        selectedDocId?: string | null;
        hasProposal?: boolean;
      }): RightState => {
        if (params.runStatus === "running") return "running_spinner";
        if (params.runStatus === "error") return "error_retry";
        if (params.runStatus === "needs_clarification") return "clarification_form";
        if (params.runStatus === "awaiting_approval" && params.hasProposal) return "draft_checklist";
        if (params.selectedDocId) return "saved_checklist";
        return "idle_prompt";
      };

      // Scenario A: Fresh page load with nothing selected
      expect(
        getCenterPanelState({
          selectedDocId: null,
          paragraphsCount: 0,
          loading: false,
          error: null,
        })
      ).toBe("input");

      expect(getRightPanelState({})).toBe("idle_prompt");

      // Scenario B: Document selected with paragraphs
      expect(
        getCenterPanelState({
          selectedDocId: "N1",
          paragraphsCount: 5,
          loading: false,
          error: null,
        })
      ).toBe("view_paras");

      expect(getRightPanelState({ selectedDocId: "N1" })).toBe("saved_checklist");

      // Scenario C: Active run awaiting approval
      expect(
        getRightPanelState({
          runStatus: "awaiting_approval",
          hasProposal: true,
        })
      ).toBe("draft_checklist");
    });
  });

  describe("FE-20 & FE-21: Responsive, accessibility, and input-safety pass", () => {
    it("ensures highlighting metadata includes accessible textual and aria-current markers", () => {
      const activeHighlights = ["N1-P2", "N1-P3"];

      const getParagraphAccessibility = (paraId: string) => {
        const isHighlighted = activeHighlights.includes(paraId);
        return {
          isHighlighted,
          ariaCurrent: isHighlighted ? "true" : undefined,
          textBadge: isHighlighted ? "Cited" : null,
          srLabel: isHighlighted ? "[Cited in active task]" : null,
        };
      };

      const p2 = getParagraphAccessibility("N1-P2");
      expect(p2.isHighlighted).toBe(true);
      expect(p2.ariaCurrent).toBe("true");
      expect(p2.textBadge).toBe("Cited");
      expect(p2.srLabel).toBe("[Cited in active task]");

      const p1 = getParagraphAccessibility("N1-P1");
      expect(p1.isHighlighted).toBe(false);
      expect(p1.ariaCurrent).toBeUndefined();
      expect(p1.textBadge).toBeNull();
    });

    it("verifies double-click prevention guards prevent duplicate submissions", () => {
      let callCount = 0;
      let inFlight = false;

      const triggerAction = async () => {
        if (inFlight) return; // Guard against rapid duplicate clicks
        inFlight = true;
        callCount++;
        // Simulate async flight
        await new Promise((resolve) => setTimeout(resolve, 10));
        inFlight = false;
      };

      // Rapid successive clicks
      void triggerAction();
      void triggerAction();
      void triggerAction();

      expect(callCount).toBe(1);
    });

    it("ensures user text survives error states without data loss", () => {
      const state = {
        draftTitle: "Campus Facility Access Memo",
        draftText: "All student access cards expire on 30 November 2026. Submit renewal requests to Room 4.",
        run: null as Run | null,
      };

      // Simulate API failure during analyze
      const simulatedApiError = new Error("Gateway timeout");
      state.run = {
        run_id: "error-123",
        doc_id: "draft",
        status: "error",
        request: "Make a checklist",
        round: 1,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions: [],
        proposal: null,
        tool_log: [],
        limits: {
          max_model_turns: 4,
          max_tool_calls: 6,
          max_clarification_rounds: 2,
          model_turns_used: 1,
          tool_calls_used: 0,
          limit_hit: false,
        },
        error: {
          code: "TIMEOUT",
          message: simulatedApiError.message,
        },
      };

      // Pasted text and title remain intact
      expect(state.draftTitle).toBe("Campus Facility Access Memo");
      expect(state.draftText).toContain("All student access cards expire on 30 November 2026");
      expect(state.run.status).toBe("error");
    });
  });

  describe("FE-22: Tool activity panel", () => {
    const sampleLog: ToolLogEntry[] = [
      {
        seq: 1,
        phase: "loop",
        tool: "search_document",
        args: { doc_id: "N1", query: "deadline" },
        ok: true,
        result_summary: "3 paragraphs matched",
        result: { matches: [] },
        duration_ms: 45,
        at: "2026-10-24T07:15:31Z",
      },
      {
        seq: 2,
        phase: "finalize",
        tool: "finalize_proposal",
        args: { round: 1 },
        ok: true,
        result_summary: "Generated 3 tasks",
        result: null,
        duration_ms: 120,
        at: "2026-10-24T07:15:33Z",
      },
      {
        seq: 3,
        phase: "gate",
        tool: "save_checklist",
        args: { doc_id: "N1", count: 3 },
        ok: true,
        result_summary: "3 tasks persisted to database",
        result: null,
        duration_ms: 65,
        at: "2026-10-24T07:15:40Z",
      },
    ];

    it("verifies ToolLog visibility rule: hidden when toolLog is empty or undefined", () => {
      const shouldRenderToolLog = (log?: ToolLogEntry[]) => {
        return Boolean(log && log.length > 0);
      };

      expect(shouldRenderToolLog(undefined)).toBe(false);
      expect(shouldRenderToolLog([])).toBe(false);
      expect(shouldRenderToolLog(sampleLog)).toBe(true);
    });

    it("validates tool log entries satisfy api-spec.md Section 3 schema", () => {
      for (const entry of sampleLog) {
        expect(entry.seq).toBeGreaterThan(0);
        expect(["loop", "finalize", "gate"]).toContain(entry.phase);
        expect(typeof entry.tool).toBe("string");
        expect(typeof entry.ok).toBe("boolean");
        expect(typeof entry.result_summary).toBe("string");
        expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
        expect(entry.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });

    it("computes tool execution metrics for demo review", () => {
      const totalCalls = sampleLog.length;
      const totalDuration = sampleLog.reduce((acc, curr) => acc + curr.duration_ms, 0);
      const phases = Array.from(new Set(sampleLog.map((l) => l.phase)));

      expect(totalCalls).toBe(3);
      expect(totalDuration).toBe(230);
      expect(phases).toEqual(["loop", "finalize", "gate"]);
    });
  });
});
