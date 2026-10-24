// Owner: Member 2 (Frontend Engineer)
// Shared page state for the sidebar, document panel and checklist panel (FE-07, FE-10)
// Source of truth for API shapes: docs/api-spec.md and lib/types.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  createRun,
  getChecklist,
  getDocument,
  getDocuments,
  retryRun,
} from "@/lib/api-client";
import { splitParagraphs } from "@/lib/paragraph-utils";
import type {
  ChecklistDetail,
  Document,
  Paragraph,
  Run,
  TaskBase,
} from "@/lib/types";
import { useRunPolling } from "./useRunPolling";

export type WorkspaceBanner = {
  kind: "success" | "error" | "warning";
  message: string;
} | null;

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

  // Analysis & Run state (FE-08, FE-10)
  const [run, setRun] = useState<Run | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftText, setDraftText] = useState("");
  const [editedTasks, setEditedTasks] = useState<TaskBase[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [highlightedParas, setHighlightedParas] = useState<string[]>([]);
  const [banner, setBanner] = useState<WorkspaceBanner>(null);

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
        setParagraphs(sortParagraphs(documentResult.value.paragraphs));
        setDocumentError(null);
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
      } else {
        setChecklist(null);
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
      if (updatedRun.proposal?.tasks) {
        setEditedTasks(updatedRun.proposal.tasks);
      }
    },
    onError: (err) => {
      setRun((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              error: {
                code: err instanceof ApiError ? err.code : "MODEL_TIMEOUT",
                message: err.message,
              },
            }
          : null
      );
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

        // Refresh sidebar documents list so the new notice appears
        void loadDocuments();
      } catch (err) {
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
            message: friendlyMessage(
              err,
              "Analysis failed. Please check your notice and try again."
            ),
          },
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [loadDocuments]
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
  }, [run, draftText, draftTitle, startAnalysis]);

  useEffect(() => {
    void loadDocuments();

    return () => {
      documentsRequestRef.current += 1;
      selectionRequestRef.current += 1;
    };
  }, [loadDocuments]);

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
    run,
    setRun,
    analyzing,
    draftTitle,
    setDraftTitle,
    draftText,
    setDraftText,
    editedTasks,
    setEditedTasks,
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
  };
}
