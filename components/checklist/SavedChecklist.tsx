// Owner: Member 2 (Frontend Engineer)
// Displays a saved checklist with source paragraphs (FE-07, FE-17)
// Source of truth: docs/api-spec.md Section 4.10 (GET /api/checklists/:docId)

"use client";

import { useState } from "react";
import type { ChecklistDetail } from "@/lib/types";

interface Props {
  checklist: ChecklistDetail;
  onSourceRefClick?: (refId: string) => void;
  onNewAnalysis?: () => void;
  onDeleteChecklist?: (docId: string) => Promise<void> | void;
}

export default function SavedChecklist({
  checklist,
  onSourceRefClick,
  onNewAnalysis,
  onDeleteChecklist,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = checklist.last_saved_at
    ? new Date(checklist.last_saved_at).toLocaleString()
    : "Recently saved";

  const formatSourceChip = (ref: string) => {
    const match = ref.match(/P\d+$/i);
    return match ? match[0] : ref;
  };

  // Empty state handling (FE-17)
  if (!checklist.tasks || checklist.tasks.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-dashed border-gray-300 bg-white text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
          📋
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            No saved checklist for this notice yet.
          </h3>
          <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
            Analyze this notice and approve the generated draft tasks to create an official checklist.
          </p>
        </div>
        {onNewAnalysis && (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span aria-hidden="true">+</span>
            <span>New analysis</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-gray-200 gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {checklist.title || "Saved Checklist"}
          </h3>
          <p className="text-xs text-gray-500">Last saved: {formattedDate}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            {checklist.tasks.length}{" "}
            {checklist.tasks.length === 1 ? "task" : "tasks"}
          </span>
          {onNewAnalysis && (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="text-xs font-semibold min-h-[40px] px-3 py-2 inline-flex items-center justify-center text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              New analysis
            </button>
          )}
          {onDeleteChecklist && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDeleteChecklist(checklist.doc_id);
                    } finally {
                      setIsDeleting(false);
                      setConfirmDelete(false);
                    }
                  }}
                  className="text-xs font-bold min-h-[40px] px-2.5 py-1.5 inline-flex items-center justify-center text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors disabled:bg-red-300"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs font-medium min-h-[40px] px-2 py-1.5 inline-flex items-center justify-center text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold min-h-[40px] px-2.5 py-1.5 inline-flex items-center justify-center text-red-700 bg-white border border-red-200 rounded hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                title="Delete this saved checklist"
              >
                <span aria-hidden="true" className="mr-1">🗑️</span>
                <span>Delete</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {checklist.tasks.map((task, index) => (
          <div
            key={task.task_id || `saved-task-${index}`}
            className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2.5 transition-shadow hover:shadow-md"
          >
            {/* Task Description and Task ID */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                {task.description}
              </p>
              {task.task_id && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold flex-shrink-0">
                  {task.task_id}
                </span>
              )}
            </div>

            {/* Badges: Owner, Deadline, Condition */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {task.owner && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  Owner: {task.owner}
                </span>
              )}
              {task.deadline_date && (
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                  Due: {task.deadline_date}
                </span>
              )}
              {task.condition && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  {task.condition}
                </span>
              )}
            </div>

            {/* Source Reference Chips (FE-17) */}
            {task.source_refs && task.source_refs.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5 text-xs text-gray-500">
                <span className="font-semibold text-gray-600">Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {task.source_refs.map((refId) => (
                    <button
                      key={refId}
                      type="button"
                      onClick={() => onSourceRefClick?.(refId)}
                      title={`Highlight source ${refId}`}
                      className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {formatSourceChip(refId)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Source Paragraph Passages Text (FE-17) */}
            {task.sources && task.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Cited Source Text:
                </span>
                <div className="space-y-1">
                  {task.sources.map((src) => (
                    <div
                      key={src.paragraph_id}
                      className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 flex items-start gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => onSourceRefClick?.(src.paragraph_id)}
                        className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 transition-colors flex-shrink-0"
                      >
                        {formatSourceChip(src.paragraph_id)}
                      </button>
                      <p className="italic text-gray-600 leading-snug">
                        &ldquo;{src.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
