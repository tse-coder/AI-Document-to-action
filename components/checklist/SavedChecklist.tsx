// Owner: Member 2 (Frontend Engineer)
// Displays a saved checklist with source paragraphs (used by FE-07 and FE-17)

"use client";

import type { ChecklistDetail } from "@/lib/types";

interface Props {
  checklist: ChecklistDetail;
  onSourceRefClick?: (refId: string) => void;
}

export default function SavedChecklist({ checklist, onSourceRefClick }: Props) {
  const formattedDate = checklist.last_saved_at
    ? new Date(checklist.last_saved_at).toLocaleString()
    : "Recently saved";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {checklist.title || "Checklist"}
          </h3>
          <p className="text-xs text-gray-500">Last saved: {formattedDate}</p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-800">
          {checklist.tasks.length}{" "}
          {checklist.tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="space-y-3">
        {checklist.tasks.map((task, index) => (
          <div
            key={task.task_id || `saved-task-${index}`}
            className="p-3 bg-white rounded-md border border-gray-200 shadow-sm space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">
                {task.description}
              </p>
            </div>

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

            {task.source_refs && task.source_refs.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-500">
                <span className="font-medium">Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {task.source_refs.map((refId) => (
                    <button
                      key={refId}
                      type="button"
                      onClick={() => onSourceRefClick?.(refId)}
                      className="px-1.5 py-0.5 rounded font-mono text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {refId}
                    </button>
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
