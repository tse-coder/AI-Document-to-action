// Owner: Member 2 (Frontend Engineer)
// Main page — shared state, document selection, and analyze flow (FE-02, FE-07, FE-08, FE-09, FE-10)

"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

import SavedNoticesList from "@/components/sidebar/SavedNoticesList";
import ChatInterface from "@/components/chat/ChatInterface";
import ChecklistTree from "@/components/checklist/ChecklistTree";
import ClarificationForm from "@/components/checklist/ClarificationForm";
import ToolLog from "@/components/checklist/ToolLog";
import RunProgressStepper from "@/components/checklist/RunProgressStepper";
import ErrorBanner from "@/components/shared/ErrorBanner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useWorkspace } from "@/lib/hooks/useWorkspace";
import { savedTaskToTaskBase } from "@/lib/paragraph-utils";
import type { TaskBase } from "@/lib/types";
import {
  FileTextIcon,
  MessageSquareIcon,
  ClipboardListIcon,
  SparklesIcon,
} from "@/components/icons";
import Link from "next/link";

type ActiveTab = "notices" | "chat" | "checklist";

export default function Home({ guestMode = false }: { guestMode?: boolean }) {
  // Mobile active tab state for switching panels on small screens
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");

  const {
    documents,
    documentsLoading,
    documentsError,
    selectedDocId,
    activeDocument,
    paragraphs,
    checklist,
    checklistLoading,
    checklistError,
    deleteSavedNotice,
    run,
    analyzing,
    draftTitle,
    editedTasks,
    updateTask,
    addTask,
    deleteTask,
    submittingAnswers,
    answerError,
    answerQuestions,
    answerSingleQuestion,
    chatMessages,
    sendChatMessage,
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
    retryAnalysis,
  } = useWorkspace();

  const handleSelectNotice = (docId: string) => {
    selectDocument(docId);
    setActiveTab("chat");
  };

  const handleNewNotice = () => {
    clearSelection();
    setActiveTab("chat");
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
              Administrative Notice Analysis &amp; Task Checklist Verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Agent Active</span>
          </span>
          {guestMode ? (
            <Link href="/sign-in" className="text-xs font-semibold text-blue-700 hover:underline">
              Sign in
            </Link>
          ) : (
            <UserButton />
          )}
        </div>
      </header>

      {guestMode && (
        <div role="status" className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Guest demo: changes are temporary and use sample data. <Link href="/sign-in" className="font-semibold underline">Sign in</Link> to use your account.
        </div>
      )}

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
          aria-selected={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            activeTab === "chat"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <MessageSquareIcon className="w-4 h-4" />
          <span>Chat &amp; Notice</span>
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
            onDeleteNotice={deleteSavedNotice}
          />
        </aside>

        {/* Center Panel — Chat Interface */}
        <main
          aria-label="Agent Chat and Document Workspace"
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            activeTab === "chat" ? "flex" : "hidden md:flex"
          }`}
        >
          <ChatInterface
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            onAnswerQuestion={answerSingleQuestion}
            onNewNotice={handleNewNotice}
            documentTitle={displayTitle}
            selectedDocId={selectedDocId}
            paragraphs={paragraphs}
            highlightedRefs={highlightedParas}
            onParagraphClick={(pId) =>
              setHighlightedParas((prev) =>
                prev.includes(pId)
                  ? prev.filter((x) => x !== pId)
                  : [...prev, pId]
              )
            }
            loading={analyzing || run?.status === "running"}
            submittingAnswer={submittingAnswers}
          />
        </main>

        {/* Right Panel — Checklist Tree / Approval / Stepper */}
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
            <div className="mb-4">
              <RunProgressStepper
                run={run}
                analyzing={analyzing}
                toolLog={run?.tool_log}
              />
            </div>
          ) : run?.status === "error" ? (
            <div className="space-y-3 mb-4">
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
                Your notice context has been preserved in the center panel.
              </p>
            </div>
          ) : run?.status === "needs_clarification" && run.questions?.length > 0 ? (
            <div className="mb-4">
              <ClarificationForm
                questions={run.questions}
                submitting={submittingAnswers}
                error={answerError}
                onSubmit={answerQuestions}
                onSourceRefClick={(refs) => {
                  setHighlightedParas(refs);
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setActiveTab("chat");
                  }
                }}
              />
            </div>
          ) : null}

          {/* Loading Indicator for Saved Checklist */}
          {checklistLoading && (
            <div className="py-4">
              <LoadingSpinner label="Loading saved checklist..." />
            </div>
          )}

          {/* Checklist Error if no tasks */}
          {!checklistLoading && checklistError && editedTasks.length === 0 && !checklist?.tasks?.length && (
            <div className="mb-4">
              <ErrorBanner message={checklistError} onRetry={retrySelection} />
            </div>
          )}

          {/* Main Interactive Checklist Tree (FE-07, FE-10, FE-16) */}
          {(() => {
            const currentTasks: TaskBase[] =
              editedTasks.length > 0
                ? editedTasks
                : run?.proposal?.tasks ?? (checklist?.tasks ? checklist.tasks.map(savedTaskToTaskBase) : []);

            if (currentTasks.length > 0) {
              return (
                <div className="space-y-4">
                  {confirmError && <ErrorBanner message={confirmError} />}

                  <ChecklistTree
                    title={displayTitle}
                    tasks={currentTasks}
                    isDraft={
                      Boolean(run?.status === "awaiting_approval") ||
                      (run?.status !== "saved" && editedTasks.length > 0)
                    }
                    onTaskChange={updateTask}
                    onTaskDelete={deleteTask}
                    onAddTask={addTask}
                    onApprove={confirmDraft}
                    approving={confirming}
                    validationErrors={confirmValidationErrors}
                    onSourceRefClick={(refs) => {
                      setHighlightedParas(refs);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setActiveTab("chat");
                      }
                    }}
                    highlightedRefs={highlightedParas}
                    lastSavedAt={checklist?.last_saved_at}
                  />
                </div>
              );
            }

            // Notice selected but has no checklist tasks yet
            if (selectedDocId && !checklistLoading && !analyzing && run?.status !== "running") {
              return (
                <div className="p-6 rounded-xl border border-dashed border-gray-300 bg-white text-center space-y-3">
                  <div
                    className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg select-none"
                    aria-hidden="true"
                  >
                    📋
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-800">
                      No checklist for this notice yet
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                      Ask in the chat to generate actionable tasks, or add tasks manually below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <span>+ Add First Task</span>
                  </button>
                </div>
              );
            }

            // No notice selected and no tasks
            if (!selectedDocId && !analyzing && run?.status !== "running") {
              return (
                <div className="p-6 rounded-xl border border-dashed border-gray-300 bg-white text-center space-y-3">
                  <div
                    className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg select-none"
                    aria-hidden="true"
                  >
                    📋
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-800">
                      No checklist to show yet
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                      Select an administrative notice from the sidebar or paste a notice into the chat to view and edit its verified checklist.
                    </p>
                  </div>
                </div>
              );
            }

            return null;
          })()}

          {/* Collapsible Tool Log for Agent Demo Observability (FE-22) */}
          {run?.tool_log && run.tool_log.length > 0 && (
            <ToolLog toolLog={run.tool_log} />
          )}
        </aside>
      </div>
    </div>
  );
}
