// Owner: Member 2 (Frontend Engineer)
// Shared page state for the sidebar, document panel and checklist panel (FE-07, FE-10)
// Source of truth for API shapes: docs/api-spec.md and lib/types.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  confirmRun,
  createRun,
  deleteChecklist,
  deleteDocument,
  getChecklist,
  getDocument,
  getDocuments,
  retryRun,
  submitAnswers,
} from "@/lib/api-client";
import { savedTaskToTaskBase, splitParagraphs } from "@/lib/paragraph-utils";
import type {
  AnswerInput,
  ChecklistDetail,
  Document,
  Paragraph,
  Run,
  TaskBase,
  ValidationIssue,
} from "@/lib/types";
import type { ChatMessage } from "@/components/chat/ChatMessageItem";
import { useRunPolling } from "./useRunPolling";

export type WorkspaceBanner = {
  kind: "success" | "error" | "warning";
  message: string;
} | null;

const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: "initial-welcome",
  sender: "agent",
  text: "Welcome! Paste an administrative notice or select one from the sidebar. I will analyze requirements, request any needed clarifications, and build a verified checklist.",
  timestamp: new Date().toISOString(),
  type: "text",
};

function friendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.message.trim().length > 0) {
      return error.message;
    }
  }
  return fallback;
}

function sortParagraphs(paragraphs: Paragraph[]): Paragraph[] {
  return [...paragraphs].sort((a, b) => a.position - b.position);
}

export function useWorkspace() {
  // Sidebar documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  // Selected document
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // Saved checklist for the selected document
  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  // Analysis & Run state (FE-08, FE-10, FE-15, FE-16)
  const [run, setRun] = useState<Run | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmValidationErrors, setConfirmValidationErrors] = useState<
    ValidationIssue[]
  >([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null
  );
  const [draftTitle, setDraftTitle] = useState("");
  const [draftText, setDraftText] = useState("");
  const [editedTasks, setEditedTasks] = useState<TaskBase[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [highlightedParas, setHighlightedParas] = useState<string[]>([]);
  const [banner, setBanner] = useState<WorkspaceBanner>(null);

  // Conversational chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    INITIAL_CHAT_MESSAGE,
  ]);

  const documentsRequestRef = useRef(0);
  const selectionRequestRef = useRef(0);

  const loadDocuments = useCallback(async () => {
    const requestId = ++documentsRequestRef.current;
    setDocumentsLoading(true);
    setDocumentsError(null);

    try {
      const result = await getDocuments();
      if (requestId !== documentsRequestRef.current) return;
      setDocuments(result.documents);
    } catch (error) {
      if (requestId !== documentsRequestRef.current) return;
      setDocumentsError(
        friendlyMessage(error, "Could not load saved notices. Please try again.")
      );
    } finally {
      if (requestId === documentsRequestRef.current) {
        setDocumentsLoading(false);
      }
    }
  }, []);

  const resetDocumentState = useCallback(() => {
    setActiveDocument(null);
    setParagraphs([]);
    setDocumentError(null);
    setChecklist(null);
    setChecklistError(null);
    setRun(null);
    setEditedTasks([]);
    setAnswers({});
    setHighlightedParas([]);
    setBanner(null);
    setAnalyzing(false);
  }, []);

  const loadSelection = useCallback(
    async (docId: string, reset: boolean) => {
      const requestId = ++selectionRequestRef.current;

      if (reset) {
        resetDocumentState();
      }

      setDocumentLoading(true);
      setChecklistLoading(true);
      setDocumentError(null);
      setChecklistError(null);

      const [documentResult, checklistResult] = await Promise.allSettled([
        getDocument(docId),
        getChecklist(docId),
      ]);

      // A newer selection won the race; discard this response.
      if (requestId !== selectionRequestRef.current) return;

      if (documentResult.status === "fulfilled") {
        setActiveDocument(documentResult.value.document);
        const sorted = sortParagraphs(documentResult.value.paragraphs);
        setParagraphs(sorted);
        setDocumentError(null);

        const taskCount =
          checklistResult.status === "fulfilled"
            ? checklistResult.value.tasks.length
            : 0;

        setChatMessages((prev) => [
          ...prev,
          {
            id: `load-${docId}-${Date.now()}`,
            sender: "agent",
            text: `Opened notice "${documentResult.value.document.title}". ${
              taskCount > 0
                ? `Loaded ${taskCount} saved checklist task${taskCount === 1 ? "" : "s"}.`
                : "No saved checklist yet for this notice. You can paste updates or generate a new action plan."
            }`,
            timestamp: new Date().toISOString(),
            type: "notice_submission",
            metadata: {
              docTitle: documentResult.value.document.title,
              paragraphCount: sorted.length,
              taskCount,
            },
          },
        ]);
      } else {
        setActiveDocument(null);
        setParagraphs([]);
        setDocumentError(
          friendlyMessage(
            documentResult.reason,
            "Could not load this notice. Please try again."
          )
        );
      }

      if (checklistResult.status === "fulfilled") {
        setChecklist(checklistResult.value);
        setChecklistError(null);
        if (checklistResult.value.tasks) {
          setEditedTasks(checklistResult.value.tasks.map(savedTaskToTaskBase));
        }
      } else {
        setChecklist(null);
        setEditedTasks([]);
        setChecklistError(
          friendlyMessage(
            checklistResult.reason,
            "Could not load the saved checklist. Please try again."
          )
        );
      }

      setDocumentLoading(false);
      setChecklistLoading(false);
    },
    [resetDocumentState]
  );

  const selectDocument = useCallback(
    (docId: string) => {
      setSelectedDocId(docId);
      void loadSelection(docId, true);
    },
    [loadSelection]
  );

  const clearSelection = useCallback(() => {
    selectionRequestRef.current += 1;
    setSelectedDocId(null);
    resetDocumentState();
    setDocumentLoading(false);
    setChecklistLoading(false);
    setChatMessages([INITIAL_CHAT_MESSAGE]);
  }, [resetDocumentState]);

  const retryDocuments = useCallback(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const retrySelection = useCallback(() => {
    if (!selectedDocId) return;
    void loadSelection(selectedDocId, false);
  }, [loadSelection, selectedDocId]);

  // Polling hook for background agent run progress (FE-10)
  useRunPolling({
    runId: run?.run_id ?? null,
    status: run?.status ?? null,
    onUpdate: (updatedRun) => {
      setRun(updatedRun);

      if (
        updatedRun.status === "needs_clarification" &&
        updatedRun.questions &&
        updatedRun.questions.length > 0
      ) {
        const questionMsgId = `clarify-${updatedRun.run_id}-${updatedRun.round}`;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === questionMsgId)) return prev;
          return [
            ...prev,
            {
              id: questionMsgId,
              sender: "agent",
              text: "I analyzed the notice and need clarification on the following items before finalizing the checklist:",
              timestamp: new Date().toISOString(),
              type: "clarification",
              questions: updatedRun.questions,
              toolSummary: updatedRun.tool_log?.map((t) => ({
                tool: t.tool,
                summary: t.result_summary || "Completed",
                ok: t.ok,
              })),
            },
          ];
        });
      }

      if (updatedRun.status === "awaiting_approval" && updatedRun.proposal) {
        const proposalMsgId = `proposal-${updatedRun.run_id}-${updatedRun.proposal.version}`;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === proposalMsgId)) return prev;
          return [
            ...prev,
            {
              id: proposalMsgId,
              sender: "agent",
              text: `Draft checklist ready! Generated ${updatedRun.proposal!.tasks.length} actionable tasks with source paragraph citations. Review and approve the draft in the right column.`,
              timestamp: new Date().toISOString(),
              type: "proposal",
              metadata: {
                taskCount: updatedRun.proposal!.tasks.length,
              },
              toolSummary: updatedRun.tool_log?.map((t) => ({
                tool: t.tool,
                summary: t.result_summary || "Completed",
                ok: t.ok,
              })),
            },
          ];
        });
      }

      if (updatedRun.proposal?.tasks) {
        setEditedTasks((prev) => {
          if (prev.length === 0) return updatedRun.proposal!.tasks;
          return updatedRun.proposal!.tasks.map((newT) => {
            const existing = prev.find((e) => e.client_id === newT.client_id);
            if (!existing) return newT;
            // Preserves user edits across proposal updates (FE-12)
            return {
              ...newT,
              description: existing.description || newT.description,
              owner:
                existing.owner_source === "user"
                  ? existing.owner
                  : newT.owner,
              owner_source:
                existing.owner_source === "user"
                  ? "user"
                  : newT.owner_source,
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
        });
      }
    },
    onError: (err) => {
      const errMsg = err instanceof ApiError ? err.message : "Request timed out";
      setRun((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              error: {
                code: err instanceof ApiError ? err.code : "MODEL_TIMEOUT",
                message: errMsg,
              },
            }
          : null
      );
      setChatMessages((prev) => [
        ...prev,
        {
          id: `poll-err-${Date.now()}`,
          sender: "agent",
          text: `Agent encountered an error: ${errMsg}`,
          timestamp: new Date().toISOString(),
          type: "error",
        },
      ]);
    },
  });

  // Start analysis flow (FE-10)
  const startAnalysis = useCallback(
    async ({ title, text }: { title: string; text: string }) => {
      setDraftTitle(title);
      setDraftText(text);
      setSelectedDocId(null);
      setActiveDocument(null);
      setChecklist(null);

      // Immediately display split paragraphs in center panel
      const immediateParas = splitParagraphs(text, "U");
      setParagraphs(immediateParas);
      setAnalyzing(true);
      setRun(null);

      const noticeTitle = title.trim() || "Untitled Notice";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `user-submit-${Date.now()}`,
          sender: "user",
          text,
          timestamp: new Date().toISOString(),
          type: "notice_submission",
          metadata: {
            docTitle: noticeTitle,
            paragraphCount: immediateParas.length,
          },
        },
        {
          id: `agent-thinking-${Date.now()}`,
          sender: "agent",
          text: `Analyzing "${noticeTitle}" (${immediateParas.length} paragraphs). Extracting actionable tasks, deadlines, and responsibilities...`,
          timestamp: new Date().toISOString(),
          type: "text",
        },
      ]);

      try {
        const result = await createRun({
          text,
          title: title || undefined,
          request: "Make a checklist for this notice",
        });

        setRun(result.run);
        if (result.run.proposal?.tasks) {
          setEditedTasks(result.run.proposal.tasks);
        }
        if (result.run.doc_id) {
          setSelectedDocId(result.run.doc_id);
          void loadSelection(result.run.doc_id, false);
        }

        if (
          result.run.status === "needs_clarification" &&
          result.run.questions?.length
        ) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `clarify-${result.run.run_id}-${result.run.round}`,
              sender: "agent",
              text: "I analyzed the notice and need clarification on the following items before finalizing the checklist:",
              timestamp: new Date().toISOString(),
              type: "clarification",
              questions: result.run.questions,
              toolSummary: result.run.tool_log?.map((t) => ({
                tool: t.tool,
                summary: t.result_summary || "Completed",
                ok: t.ok,
              })),
            },
          ]);
        } else if (
          result.run.status === "awaiting_approval" &&
          result.run.proposal
        ) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `proposal-${result.run.run_id}-${result.run.proposal!.version}`,
              sender: "agent",
              text: `Draft checklist ready! Generated ${result.run.proposal!.tasks.length} actionable tasks with source paragraph citations. Review and approve the draft in the right column.`,
              timestamp: new Date().toISOString(),
              type: "proposal",
              metadata: {
                taskCount: result.run.proposal!.tasks.length,
              },
              toolSummary: result.run.tool_log?.map((t) => ({
                tool: t.tool,
                summary: t.result_summary || "Completed",
                ok: t.ok,
              })),
            },
          ]);
        }

        // Refresh sidebar documents list so the new notice appears
        void loadDocuments();
      } catch (err) {
        const errMsg = friendlyMessage(
          err,
          "Analysis failed. Please check your notice and try again."
        );
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "agent",
            text: `Analysis failed: ${errMsg}`,
            timestamp: new Date().toISOString(),
            type: "error",
          },
        ]);

        // Preserve typed text and show error
        setRun({
          run_id: `error-${Date.now()}`,
          doc_id: "draft",
          status: "error",
          request: "Make a checklist for this notice",
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
            code: err instanceof ApiError ? err.code : "ANALYSIS_FAILED",
            message: errMsg,
          },
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [loadDocuments, loadSelection]
  );

  // Retry failed analysis
  const retryAnalysis = useCallback(async () => {
    if (!run) return;

    if (run.run_id && !run.run_id.startsWith("error-")) {
      setAnalyzing(true);
      try {
        const result = await retryRun(run.run_id);
        setRun(result.run);
        if (result.run.proposal?.tasks) {
          setEditedTasks(result.run.proposal.tasks);
        }
        if (result.run.doc_id) {
          setSelectedDocId(result.run.doc_id);
          void loadSelection(result.run.doc_id, false);
        }
      } catch (err) {
        setRun((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                error: {
                  code: err instanceof ApiError ? err.code : "RETRY_FAILED",
                  message: friendlyMessage(
                    err,
                    "Retry failed. Please try again."
                  ),
                },
              }
            : null
        );
      } finally {
        setAnalyzing(false);
      }
    } else if (draftText) {
      await startAnalysis({ title: draftTitle, text: draftText });
    }
  }, [run, draftText, draftTitle, startAnalysis, loadSelection]);

  const updateTask = useCallback((updated: TaskBase) => {
    setEditedTasks((prev) => {
      const idx = prev.findIndex(
        (t) =>
          (t.client_id && t.client_id === updated.client_id) ||
          (t.task_id && t.task_id === updated.task_id)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }, []);

  const addTask = useCallback(() => {
    const newTask: TaskBase = {
      client_id: `task-custom-${Date.now()}`,
      action: "create",
      task_id: null,
      description: "New action item",
      source_refs: paragraphs.length > 0 ? [paragraphs[0].paragraph_id] : [],
      deadline_date: null,
      deadline_text: null,
      deadline_source: "user",
      condition: null,
      owner: null,
      owner_source: "none",
    };
    setEditedTasks((prev) => [...prev, newTask]);
  }, [paragraphs]);

  const deleteTask = useCallback((clientIdOrTaskId: string) => {
    setEditedTasks((prev) =>
      prev.filter(
        (t) =>
          t.client_id !== clientIdOrTaskId &&
          t.task_id !== clientIdOrTaskId
      )
    );
  }, []);

  // Submit clarification answers (FE-15)
  const answerQuestions = useCallback(
    async (answerInputs: AnswerInput[]) => {
      if (!run?.run_id) return;
      setSubmittingAnswers(true);
      setAnswerError(null);

      try {
        const result = await submitAnswers(run.run_id, answerInputs);
        setRun(result.run);
        if (result.run.proposal?.tasks) {
          setEditedTasks(result.run.proposal.tasks);
        }
        if (result.run.doc_id) {
          setSelectedDocId(result.run.doc_id);
          void loadSelection(result.run.doc_id, false);
        }

        if (
          result.run.status === "awaiting_approval" &&
          result.run.proposal
        ) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `proposal-answered-${Date.now()}`,
              sender: "agent",
              text: `Clarifications recorded! Updated draft checklist with ${result.run.proposal!.tasks.length} tasks is ready for your review in the right column.`,
              timestamp: new Date().toISOString(),
              type: "proposal",
              metadata: {
                taskCount: result.run.proposal!.tasks.length,
              },
            },
          ]);
        }
      } catch (err) {
        setAnswerError(
          friendlyMessage(
            err,
            "Could not submit answers. Please check your answers and try again."
          )
        );
      } finally {
        setSubmittingAnswers(false);
      }
    },
    [run?.run_id, loadSelection]
  );

  // Single question answer helper for inline chat replies
  const answerSingleQuestion = useCallback(
    async (questionId: string, answer: string, notStated: boolean) => {
      if (!run?.run_id) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ans-bubble-${questionId}-${Date.now()}`,
          sender: "user",
          text: notStated ? "Not stated in notice" : answer,
          timestamp: new Date().toISOString(),
          type: "text",
        },
      ]);
      await answerQuestions([
        {
          question_id: questionId,
          answer: notStated ? "" : answer,
          not_stated: notStated,
        },
      ]);
    },
    [run?.run_id, answerQuestions]
  );

  // Confirm draft checklist and save to database (FE-16)
  const confirmDraft = useCallback(async () => {
    setConfirming(true);
    setConfirmError(null);
    setConfirmValidationErrors([]);
    setSaveSuccessMessage(null);

    const tasksToSave: TaskBase[] =
      editedTasks.length > 0
        ? editedTasks
        : (run?.proposal?.tasks ?? (checklist?.tasks ? checklist.tasks.map(savedTaskToTaskBase) : []));

    try {
      let targetRunId = run?.run_id;
      let proposalVersion = run?.proposal?.version ?? 1;

      // If there isn't an active run awaiting approval, but we have a selected notice,
      // create a run for this document to commit the manual edits.
      if (!targetRunId || run?.status !== "awaiting_approval") {
        const activeDocId = selectedDocId || run?.doc_id;
        if (activeDocId) {
          const runRes = await createRun({
            doc_id: activeDocId,
            request: "Approve and save checklist updates",
          });
          targetRunId = runRes.run.run_id;
          proposalVersion = runRes.run.proposal?.version ?? 1;
        } else {
          setConfirmError("No active notice to save checklist for.");
          setConfirming(false);
          return;
        }
      }

      const result = await confirmRun(targetRunId, {
        proposal_version: proposalVersion,
        tasks: tasksToSave,
      });

      const count = result.saved?.length ?? tasksToSave.length;
      setSaveSuccessMessage(
        `✅ ${count} task${count === 1 ? "" : "s"} saved successfully.`
      );

      setChatMessages((prev) => [
        ...prev,
        {
          id: `saved-confirm-${Date.now()}`,
          sender: "agent",
          text: `Checklist successfully approved and saved! ${count} task${count === 1 ? "" : "s"} are now officially active.`,
          timestamp: new Date().toISOString(),
          type: "text",
          metadata: {
            taskCount: count,
          },
        },
      ]);

      // Transition run status to saved
      setRun((prev) => (prev ? { ...prev, status: "saved" } : null));

      // Refresh sidebar notices list
      void loadDocuments();

      // Load saved checklist for this document
      if (result.doc_id) {
        setSelectedDocId(result.doc_id);
        void loadSelection(result.doc_id, false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        setConfirmValidationErrors(
          (err.details as ValidationIssue[]) || []
        );
        setConfirmError(
          err.message || "Please fix validation errors before saving."
        );
      } else if (err instanceof ApiError && err.code === "ALREADY_SAVED") {
        setSaveSuccessMessage("This checklist has already been saved.");
        setRun((prev) => (prev ? { ...prev, status: "saved" } : null));
        if (run?.doc_id) {
          setSelectedDocId(run.doc_id);
          void loadSelection(run.doc_id, false);
        }
      } else {
        setConfirmError(
          friendlyMessage(err, "Failed to save checklist. Please try again.")
        );
      }
    } finally {
      setConfirming(false);
    }
  }, [run, editedTasks, checklist, selectedDocId, loadDocuments, loadSelection]);

  // Conversational message dispatcher scoped to active notice
  const sendChatMessage = useCallback(
    async (text: string, title?: string) => {
      const activeDocId = selectedDocId || run?.doc_id;

      // Case 1: Active notice selected/open — chat is scoped to this notice and edits its checklist
      if (activeDocId) {
        const userMsg: ChatMessage = {
          id: `user-msg-${Date.now()}`,
          sender: "user",
          text,
          timestamp: new Date().toISOString(),
          type: "text",
        };
        setChatMessages((prev) => [...prev, userMsg]);
        setAnalyzing(true);

        try {
          const result = await createRun({
            doc_id: activeDocId,
            request: text,
          });

          setRun(result.run);
          if (result.run.proposal?.tasks) {
            setEditedTasks(result.run.proposal.tasks);
          }

          let replyText = "";
          if (result.run.proposal?.answers_to_request) {
            replyText = result.run.proposal.answers_to_request;
          } else if (result.run.proposal?.summary) {
            replyText = `I updated the checklist: ${result.run.proposal.summary}. ${result.run.proposal.tasks.length} tasks ready for review.`;
          } else if (result.run.status === "needs_clarification") {
            replyText = "I reviewed your question and need clarification before finalizing:";
          } else if (result.run.status === "awaiting_approval") {
            replyText = `Checklist updated with ${result.run.proposal?.tasks?.length || 0} tasks. Review them in the right column.`;
          } else {
            replyText = "Your request has been processed.";
          }

          const agentMsg: ChatMessage = {
            id: `agent-reply-${result.run.run_id}-${Date.now()}`,
            sender: "agent",
            text: replyText,
            timestamp: new Date().toISOString(),
            type:
              result.run.status === "needs_clarification"
                ? "clarification"
                : result.run.status === "awaiting_approval"
                ? "proposal"
                : "text",
            questions: result.run.questions,
            metadata: {
              taskCount: result.run.proposal?.tasks?.length,
              docTitle: activeDocument?.title,
            },
            toolSummary: result.run.tool_log?.map((t) => ({
              tool: t.tool,
              summary: t.result_summary || "Completed",
              ok: t.ok,
            })),
          };

          setChatMessages((prev) => [...prev, agentMsg]);
        } catch (err) {
          const errMsg = friendlyMessage(
            err,
            "Could not process request for this notice. Please try again."
          );
          setChatMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: "agent",
              text: `Request failed: ${errMsg}`,
              timestamp: new Date().toISOString(),
              type: "error",
            },
          ]);
        } finally {
          setAnalyzing(false);
        }
        return;
      }

      // Case 2: No active notice selected, but pasted text is long enough (>= 20 chars)
      if (text.trim().length >= 20) {
        await startAnalysis({
          title:
            title ||
            (text.length > 50 ? text.slice(0, 45).trim() + "..." : "Notice"),
          text,
        });
        return;
      }

      // Case 3: No notice selected and prompt is short (< 20 chars)
      const userMsg: ChatMessage = {
        id: `user-msg-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date().toISOString(),
        type: "text",
      };
      setChatMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `guidance-${Date.now()}`,
          sender: "agent",
          text: "Please select an existing notice from the sidebar on the left, or paste an administrative notice into this chat so I can analyze it and generate an action checklist.",
          timestamp: new Date().toISOString(),
          type: "text",
        },
      ]);
    },
    [selectedDocId, run?.doc_id, activeDocument?.title, startAnalysis]
  );

  useEffect(() => {
    void loadDocuments();

    return () => {
      documentsRequestRef.current += 1;
      selectionRequestRef.current += 1;
    };
  }, [loadDocuments]);

  const deleteSavedChecklist = useCallback(
    async (docId: string) => {
      try {
        await deleteChecklist(docId);
        setChecklist({
          doc_id: docId,
          title: activeDocument?.title ?? "Notice",
          last_saved_at: null,
          tasks: [],
        });
        setSaveSuccessMessage("Checklist deleted successfully.");
        void loadDocuments();
      } catch (err) {
        setChecklistError(
          friendlyMessage(err, "Could not delete checklist. Please try again.")
        );
      }
    },
    [activeDocument?.title, loadDocuments]
  );

  const deleteSavedNotice = useCallback(
    async (docId: string) => {
      try {
        await deleteDocument(docId);
        if (selectedDocId === docId) {
          clearSelection();
        }
        setBanner({
          kind: "success",
          message: "Notice deleted successfully.",
        });
        await loadDocuments();
      } catch (err) {
        setBanner({
          kind: "error",
          message: friendlyMessage(
            err,
            "Could not delete notice. Please try again."
          ),
        });
      }
    },
    [selectedDocId, clearSelection, loadDocuments]
  );

  return {
    documents,
    documentsLoading,
    documentsError,
    selectedDocId,
    activeDocument,
    paragraphs,
    documentLoading,
    documentError,
    checklist,
    checklistLoading,
    checklistError,
    deleteSavedChecklist,
    deleteSavedNotice,
    run,
    setRun,
    analyzing,
    submittingAnswers,
    answerError,
    setAnswerError,
    answerQuestions,
    confirming,
    confirmError,
    confirmValidationErrors,
    saveSuccessMessage,
    setSaveSuccessMessage,
    confirmDraft,
    draftTitle,
    setDraftTitle,
    draftText,
    setDraftText,
    editedTasks,
    setEditedTasks,
    updateTask,
    addTask,
    deleteTask,
    answers,
    setAnswers,
    highlightedParas,
    setHighlightedParas,
    banner,
    setBanner,
    selectDocument,
    clearSelection,
    retryDocuments,
    retrySelection,
    startAnalysis,
    retryAnalysis,
    chatMessages,
    setChatMessages,
    sendChatMessage,
    answerSingleQuestion,
  };
}
