// Owner: Member 2 (Frontend Engineer)
// Main page — shared state, document selection, and analyze flow (FE-02, FE-07, FE-08, FE-09, FE-10)

"use client";

import { useState } from "react";

import SavedNoticesList from "@/components/sidebar/SavedNoticesList";
import TextInput from "@/components/document/TextInput";
import ParagraphViewer from "@/components/document/ParagraphViewer";
import SavedChecklist from "@/components/checklist/SavedChecklist";
import DraftChecklist from "@/components/checklist/DraftChecklist";
import ClarificationForm from "@/components/checklist/ClarificationForm";
import ApproveButton from "@/components/checklist/ApproveButton";
import ToolLog from "@/components/checklist/ToolLog";
import DocumentChat from "@/components/document/DocumentChat";
import ErrorBanner from "@/components/shared/ErrorBanner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useWorkspace } from "@/lib/hooks/useWorkspace";
import {
  FileTextIcon,
  MessageSquareIcon,
  TrashIcon,
  ClipboardListIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/icons";

type ActiveTab = "notices" | "document" | "checklist";

export default function Home() {
  // Mobile active tab state for switching panels on small screens
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");
  // Center panel view mode: document paragraphs or chat assistant
  const [centerViewMode, setCenterViewMode] = useState<"paragraphs" | "chat">("paragraphs");

  const {
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
    analyzing,
    draftTitle,
    draftText,
    editedTasks,
    updateTask,
    submittingAnswers,
    answerError,
    answerQuestions,
    confirming,
    confirmError,
    confirmValidationErrors,
    saveSuccessMessage,
    confirmDraft,
    highlightedParas,
    setHighlightedParas,
    selectDocument,
    clearSelection,
    retryDocuments,
    retrySelection,
    startAnalysis,
    retryAnalysis,
  } = useWorkspace();

  const [confirmDeleteNotice, setConfirmDeleteNotice] = useState(false);
  const [isDeletingNotice, setIsDeletingNotice] = useState(false);

  const handleSelectNotice = (docId: string) => {
    setConfirmDeleteNotice(false);
    selectDocument(docId);
    setActiveTab("document");
  };

  const handleNewNotice = () => {
    setConfirmDeleteNotice(false);
    clearSelection();
    setActiveTab("document");
  };

  const handleAnalyze = (data: { title: string; text: string }) => {
    void startAnalysis(data);
    setActiveTab("checklist");
  };

  // Determine current display title
  const displayTitle = selectedDocId
    ? activeDocument?.title ??
    documents.find((doc) => doc.doc_id === selectedDocId)?.title ??
    "Selected notice"
    : draftTitle.trim() || "Pasted notice";

  // Determine status pill for right panel
  let panelStatus = "Idle";
  let panelStatusClasses = "bg-gray-200 text-gray-700";

  if (analyzing || run?.status === "running") {
    panelStatus = "Reading notice...";
    panelStatusClasses = "bg-blue-100 text-blue-800 animate-pulse";
  } else if (submittingAnswers) {
    panelStatus = "Updating draft...";
    panelStatusClasses = "bg-amber-100 text-amber-800 animate-pulse";
  } else if (confirming) {
    panelStatus = "Saving checklist...";
    panelStatusClasses = "bg-emerald-100 text-emerald-800 animate-pulse";
  } else if (run?.status === "error") {
    panelStatus = "Error";
    panelStatusClasses = "bg-red-100 text-red-800";
  } else if (run?.status === "needs_clarification") {
    panelStatus = "Needs Clarification";
    panelStatusClasses = "bg-amber-100 text-amber-800";
  } else if (run?.status === "awaiting_approval") {
    panelStatus = "Ready for Approval";
    panelStatusClasses = "bg-indigo-100 text-indigo-800";
  } else if (selectedDocId) {
    if (checklistLoading) {
      panelStatus = "Loading";
      panelStatusClasses = "bg-blue-100 text-blue-800";
    } else if (checklistError) {
      panelStatus = "Unavailable";
      panelStatusClasses = "bg-red-100 text-red-800";
    } else if (checklist && checklist.tasks.length > 0) {
      panelStatus = "Saved";
      panelStatusClasses = "bg-green-100 text-green-800";
    } else {
      panelStatus = "No checklist";
      panelStatusClasses = "bg-amber-100 text-amber-800";
    }
  }

  const isViewingDocument = selectedDocId !== null || paragraphs.length > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900">
      {/* Top Application Header */}
      <header className="h-14 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              AI Document-to-Action Agent
            </h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Administrative Notice Analysis & Task Checklist Verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Agent Active</span>
          </span>
        </div>
      </header>

      {/* Mobile Tab Bar (visible on < md screens) */}
      <nav
        aria-label="Mobile panel switcher"
        className="md:hidden flex border-b bg-gray-100 flex-shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notices"}
          onClick={() => setActiveTab("notices")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "notices"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileTextIcon className="w-4 h-4" />
          <span>Notices</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "document"}
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "document"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileTextIcon className="w-4 h-4" />
          <span>Document</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "checklist"}
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "checklist"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <ClipboardListIcon className="w-4 h-4" />
          <span>Checklist</span>
        </button>
      </nav>

      {/* 3-Panel Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Saved Notices */}
        <aside
          aria-label="Saved Notices Sidebar"
          className={`w-full md:w-64 lg:w-72 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto ${activeTab === "notices" ? "block" : "hidden md:block"
            }`}
        >
          <SavedNoticesList
            documents={documents}
            selectedId={selectedDocId}
            loading={documentsLoading}
            error={documentsError}
            onSelect={handleSelectNotice}
            onRetry={retryDocuments}
            onNewNotice={handleNewNotice}
            onDeleteNotice={deleteSavedNotice}
          />
        </aside>

        {/* Center Panel — Document Input / Viewing */}
        <main
          aria-label="Notice Input and Document Viewer"
          className={`flex-1 flex flex-col bg-white overflow-y-auto ${activeTab === "document" ? "flex" : "hidden md:flex"
            }`}
        >
          {isViewingDocument ? (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {selectedDocId ? "Saved Notice" : "Analyzed Notice"}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {displayTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-2 self-start flex-wrap">
                  {selectedDocId && (
                    confirmDeleteNotice ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isDeletingNotice}
                          onClick={async () => {
                            setIsDeletingNotice(true);
                            try {
                              await deleteSavedNotice(selectedDocId);
                            } finally {
                              setIsDeletingNotice(false);
                              setConfirmDeleteNotice(false);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:bg-red-300 transition-colors"
                        >
                          {isDeletingNotice ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingNotice}
                          onClick={() => setConfirmDeleteNotice(false)}
                          className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteNotice(true)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                        title="Delete this notice"
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete notice</span>
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={handleNewNotice}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Paste new notice</span>
                  </button>
                </div>
              </div>

              {/* Center Panel Mode Toggle: Notice Paragraphs vs Chat Assistant */}
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setCenterViewMode("paragraphs")}
                  className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    centerViewMode === "paragraphs"
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <FileTextIcon className="w-4 h-4" />
                  <span>Document Paragraphs</span>
                  {paragraphs.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {paragraphs.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCenterViewMode("chat")}
                  className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    centerViewMode === "chat"
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <MessageSquareIcon className="w-4 h-4" />
                  <span>Chat with Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                </button>
              </div>

              {centerViewMode === "chat" ? (
                <DocumentChat
                  docId={selectedDocId || activeDocument?.doc_id || "draft"}
                  docTitle={displayTitle}
                  onCitationClick={(pId) => {
                    setHighlightedParas([pId]);
                    setCenterViewMode("paragraphs");
                  }}
                />
              ) : (
                <>
                  {documentLoading && (
                    <div className="py-8">
                      <LoadingSpinner label="Loading notice paragraphs..." />
                    </div>
                  )}

                  {!documentLoading && documentError && (
                    <ErrorBanner message={documentError} onRetry={retrySelection} />
                  )}

                  {!documentLoading && !documentError && paragraphs.length === 0 && (
                    <div className="p-4 rounded-md border border-dashed border-gray-300 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">
                        This notice has no paragraphs to display.
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Try selecting another notice or pasting a new one.
                      </p>
                    </div>
                  )}

                  {!documentLoading && !documentError && paragraphs.length > 0 && (
                    <ParagraphViewer
                      paragraphs={paragraphs}
                      highlightedRefs={highlightedParas}
                      onParagraphClick={(pId) =>
                        setHighlightedParas((prev) =>
                          prev.includes(pId)
                            ? prev.filter((x) => x !== pId)
                            : [...prev, pId]
                        )
                      }
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <TextInput
              initialTitle={draftTitle}
              initialText={draftText}
              loading={analyzing}
              onAnalyze={handleAnalyze}
            />
          )}
        </main>

        {/* Right Panel — Draft checklist / Approval / Saved */}
        <aside
          aria-label="Checklist and Approval Panel"
          className={`w-full md:w-80 lg:w-96 bg-gray-50 border-l border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${activeTab === "checklist" ? "block" : "hidden md:block"
            }`}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${panelStatusClasses}`}
            >
              {panelStatus}
            </span>
          </div>

          {/* Success Banner (FE-16) */}
          {saveSuccessMessage && (
            <div
              role="status"
              className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-sm"
            >
              <span className="text-sm select-none" aria-hidden="true">
                ✅
              </span>
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Active Analysis Flow States (FE-10) */}
          {analyzing || run?.status === "running" ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <LoadingSpinner label="Agent is reading the notice..." />
              <p className="text-xs text-gray-500 max-w-xs">
                Analyzing requirements, extracting actionable tasks, and cross-referencing source paragraphs...
              </p>
            </div>
          ) : run?.status === "error" ? (
            <div className="space-y-3">
              <ErrorBanner
                message={
                  run.error?.message ||
                  "The model did not respond in time. Click Retry to try again."
                }
                attempt={(run.retry_count || 0) + 1}
                maxAttempts={3}
                onRetry={retryAnalysis}
              />
              <p className="text-xs text-gray-500">
                Your pasted text has been preserved in the center panel.
              </p>
            </div>
          ) : run?.status === "needs_clarification" && run.questions?.length > 0 ? (
            <ClarificationForm
              questions={run.questions}
              submitting={submittingAnswers}
              error={answerError}
              onSubmit={answerQuestions}
              onSourceRefClick={(refs) => {
                setHighlightedParas(refs);
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setActiveTab("document");
                }
              }}
            />
          ) : run?.status === "needs_clarification" ? (
            <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-base">❓</span>
                <h3 className="text-sm font-semibold text-amber-900">
                  Clarification Required
                </h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                No open questions remaining.
              </p>
            </div>
          ) : run?.status === "awaiting_approval" && run.proposal ? (
            <div className="space-y-4">
              <DraftChecklist
                proposal={run.proposal}
                tasks={
                  editedTasks.length > 0 ? editedTasks : run.proposal.tasks
                }
                serverErrors={confirmValidationErrors}
                onTaskChange={updateTask}
                onSourceRefClick={(refs) => {
                  setHighlightedParas(refs);
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setActiveTab("document");
                  }
                }}
                highlightedRefs={highlightedParas}
              />

              {confirmError && (
                <ErrorBanner message={confirmError} />
              )}

              <ApproveButton
                disabled={
                  confirming ||
                  (run.questions && run.questions.length > 0) ||
                  (editedTasks.length === 0 && run.proposal.tasks.length === 0)
                }
                loading={confirming}
                taskCount={
                  editedTasks.length > 0
                    ? editedTasks.length
                    : run.proposal.tasks.length
                }
                onApprove={confirmDraft}
              />
            </div>
          ) : run?.status === "awaiting_approval" ? (
            <div className="space-y-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs">
              <div className="flex items-center gap-2">
                <ClipboardListIcon className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-semibold text-indigo-900">
                  Draft Checklist Ready
                </h3>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Review the generated draft tasks below.
              </p>
            </div>
          ) : selectedDocId ? (
            <div>
              {checklistLoading && (
                <div className="py-4">
                  <LoadingSpinner label="Loading saved checklist..." />
                </div>
              )}

              {!checklistLoading && checklistError && (
                <ErrorBanner message={checklistError} onRetry={retrySelection} />
              )}

              {!checklistLoading &&
                !checklistError &&
                checklist &&
                checklist.tasks.length > 0 && (
                  <SavedChecklist
                    checklist={checklist}
                    onSourceRefClick={(refId) => setHighlightedParas([refId])}
                    onNewAnalysis={handleNewNotice}
                    onDeleteChecklist={deleteSavedChecklist}
                  />
                )}

              {!checklistLoading &&
                !checklistError &&
                (!checklist || checklist.tasks.length === 0) && (
                  <SavedChecklist
                    checklist={
                      checklist ?? {
                        doc_id: selectedDocId,
                        title: displayTitle,
                        last_saved_at: null,
                        tasks: [],
                      }
                    }
                    onNewAnalysis={handleNewNotice}
                    onDeleteChecklist={deleteSavedChecklist}
                  />
                )}
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-gray-300 bg-white text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ClipboardListIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-800">
                  No checklist to show yet
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Paste a notice and click <span className="font-semibold text-gray-700">&quot;Analyze Notice&quot;</span> in the center panel, or select a saved notice from the sidebar.
                </p>
              </div>
            </div>
          )}

          {/* Collapsible Tool Log for Agent Demo Observability (FE-22) */}
          {run?.tool_log && run.tool_log.length > 0 && (
            <ToolLog toolLog={run.tool_log} />
          )}
        </aside>
      </div>
    </div>
  );
}
