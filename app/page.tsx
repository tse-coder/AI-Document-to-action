// Owner: Member 2 (Frontend Engineer)
// Main page — shared state, document selection, and analyze flow (FE-02, FE-07, FE-08, FE-09, FE-10)

"use client";

import { useState } from "react";

import SavedNoticesList from "@/components/sidebar/SavedNoticesList";
import TextInput from "@/components/document/TextInput";
import ParagraphViewer from "@/components/document/ParagraphViewer";
import SavedChecklist from "@/components/checklist/SavedChecklist";
import ErrorBanner from "@/components/shared/ErrorBanner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useWorkspace } from "@/lib/hooks/useWorkspace";

type ActiveTab = "notices" | "document" | "checklist";

export default function Home() {
  // Mobile active tab state for switching panels on small screens
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");

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
    run,
    analyzing,
    draftTitle,
    draftText,
    highlightedParas,
    setHighlightedParas,
    selectDocument,
    clearSelection,
    retryDocuments,
    retrySelection,
    startAnalysis,
    retryAnalysis,
  } = useWorkspace();

  const handleSelectNotice = (docId: string) => {
    selectDocument(docId);
    setActiveTab("document");
  };

  const handleNewNotice = () => {
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
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "notices"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Notices
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "document"}
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "document"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Document
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "checklist"}
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "checklist"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Checklist
        </button>
      </nav>

      {/* 3-Panel Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Saved Notices */}
        <aside
          aria-label="Saved Notices Sidebar"
          className={`w-full md:w-64 lg:w-72 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto ${
            activeTab === "notices" ? "block" : "hidden md:block"
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
          />
        </aside>

        {/* Center Panel — Document Input / Viewing */}
        <main
          aria-label="Notice Input and Document Viewer"
          className={`flex-1 flex flex-col bg-white overflow-y-auto ${
            activeTab === "document" ? "flex" : "hidden md:flex"
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
                <button
                  type="button"
                  onClick={handleNewNotice}
                  className="self-start px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Paste new notice
                </button>
              </div>

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
          className={`w-full md:w-80 lg:w-96 bg-gray-50 border-l border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${
            activeTab === "checklist" ? "block" : "hidden md:block"
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
                onRetry={retryAnalysis}
              />
              <p className="text-xs text-gray-500">
                Your pasted text has been preserved in the center panel.
              </p>
            </div>
          ) : run?.status === "needs_clarification" ? (
            <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-base">❓</span>
                <h3 className="text-sm font-semibold text-amber-900">
                  Clarification Required
                </h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The agent identified {run.questions.length} question(s) regarding missing details.
              </p>
            </div>
          ) : run?.status === "awaiting_approval" ? (
            <div className="space-y-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <h3 className="text-sm font-semibold text-indigo-900">
                  Draft Checklist Ready
                </h3>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                {run.proposal?.summary || "Review the generated draft tasks below."}
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
                  />
                )}

              {!checklistLoading &&
                !checklistError &&
                (!checklist || checklist.tasks.length === 0) && (
                  <div className="p-4 rounded-md border border-dashed border-gray-300 bg-white">
                    <p className="text-sm font-medium text-gray-700">
                      No saved checklist for this notice yet.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Approve a draft checklist to save tasks for this notice.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="p-4 rounded-md border border-dashed border-gray-300 bg-white text-center">
              <p className="text-sm text-gray-500">
                Paste a notice and click{" "}
                <span className="font-medium text-gray-700">
                  &quot;Analyze&quot;
                </span>{" "}
                to generate a structured checklist.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
