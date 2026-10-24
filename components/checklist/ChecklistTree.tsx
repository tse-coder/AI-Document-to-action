// Owner: Member 2 (Frontend Engineer)
// Interactive Checklist Tree with expandable subfolder picker UI, inline task editing, and citation links

"use client";

import React, { useState } from "react";
import type { TaskBase, ValidationIssue } from "@/lib/types";

interface ChecklistTreeProps {
  title: string;
  tasks: TaskBase[];
  isDraft: boolean;
  onTaskChange?: (task: TaskBase) => void;
  onTaskDelete?: (clientIdOrTaskId: string) => void;
  onAddTask?: () => void;
  onApprove?: () => void;
  approving?: boolean;
  validationErrors?: ValidationIssue[];
  onSourceRefClick?: (refs: string[]) => void;
  highlightedRefs?: string[];
  lastSavedAt?: string | null;
}

export default function ChecklistTree({
  title,
  tasks,
  isDraft,
  onTaskChange,
  onTaskDelete,
  onAddTask,
  onApprove,
  approving = false,
  validationErrors = [],
  onSourceRefClick,
  highlightedRefs = [],
  lastSavedAt,
}: ChecklistTreeProps) {
  // Track open/collapsed state of each task folder (keyed by client_id or task_id)
  const [openTaskIds, setOpenTaskIds] = useState<Record<string, boolean>>(() => {
    // By default, open the first task or all tasks if <= 3
    const initial: Record<string, boolean> = {};
    tasks.forEach((t, idx) => {
      const id = t.client_id || t.task_id || `t-${idx}`;
      initial[id] = tasks.length <= 4 || idx === 0;
    });
    return initial;
  });

  const [filterOwner, setFilterOwner] = useState<string>("all");

  const toggleTask = (id: string) => {
    setOpenTaskIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    tasks.forEach((t, idx) => {
      const id = t.client_id || t.task_id || `t-${idx}`;
      all[id] = true;
    });
    setOpenTaskIds(all);
  };

  const collapseAll = () => {
    setOpenTaskIds({});
  };

  const formatSourceChip = (ref: string) => {
    const match = ref.match(/P\d+$/i);
    return match ? match[0] : ref;
  };

  const uniqueOwners = Array.from(
    new Set(tasks.map((t) => t.owner).filter(Boolean))
  ) as string[];

  const filteredTasks = tasks.filter((t) => {
    if (filterOwner === "all") return true;
    if (filterOwner === "unassigned") return !t.owner;
    return t.owner === filterOwner;
  });

  return (
    <div className="space-y-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tree Folder Root Header */}
      <div className="p-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-900 truncate tracking-tight">
              {title || "Checklist Tasks"}
            </h3>
            <p className="text-[10px] text-gray-500 truncate">
              {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Interactive Task Tree"}
            </p>
          </div>
        </div>

        {/* Action badges & Expand controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
          <div className="flex items-center border border-gray-200 rounded-md bg-white overflow-hidden text-[10px] font-medium text-gray-600">
            <button
              type="button"
              onClick={expandAll}
              title="Expand all tasks"
              className="px-2 py-1 hover:bg-gray-100 transition-colors"
            >
              Expand
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={collapseAll}
              title="Collapse all tasks"
              className="px-2 py-1 hover:bg-gray-100 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Owner Filter Tabs if multiple owners exist */}
      {uniqueOwners.length > 0 && (
        <div className="px-3 py-1.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-semibold uppercase text-gray-400 mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilterOwner("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filterOwner === "all"
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            All ({tasks.length})
          </button>
          {uniqueOwners.map((owner) => (
            <button
              key={owner}
              type="button"
              onClick={() => setFilterOwner(owner)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterOwner === owner
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {owner}
            </button>
          ))}
        </div>
      )}

      {/* Task Tree Nodes */}
      <div className="p-3 space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center rounded-lg border border-dashed border-gray-200 text-gray-500 space-y-1">
            <p className="text-xs font-semibold">No tasks match this filter.</p>
            <p className="text-[11px] text-gray-400">Click &quot;All&quot; above to view all tasks.</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const taskId = task.client_id || task.task_id || `task-${idx}`;
            const isOpen = !!openTaskIds[taskId];
            const hasError = validationErrors.some(
              (e) => e.task_client_id === task.client_id
            );

            return (
              <div
                key={taskId}
                className={`rounded-xl border transition-all ${
                  hasError
                    ? "border-red-300 bg-red-50/20"
                    : isOpen
                    ? "border-indigo-200 bg-white shadow-sm ring-1 ring-indigo-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Task Node Header (Folder trigger row) */}
                <button
                  type="button"
                  onClick={() => toggleTask(taskId)}
                  className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                >
                  {/* Tree dropdown chevron */}
                  <span
                    className={`mt-0.5 flex-shrink-0 transition-transform duration-200 text-gray-400 ${
                      isOpen ? "rotate-90 text-indigo-600" : ""
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>

                  {/* Node icon & summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {task.client_id || task.task_id || `T${idx + 1}`}
                      </span>

                      {task.deadline_date && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          📅 {task.deadline_date}
                        </span>
                      )}

                      {task.owner && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          👤 {task.owner}
                        </span>
                      )}

                      {task.condition && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200 truncate max-w-[120px]">
                          ⚡ {task.condition}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs mt-1 leading-snug ${isOpen ? "font-semibold text-gray-900" : "text-gray-800 line-clamp-2"}`}>
                      {task.description}
                    </p>
                  </div>

                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      "status" in task && (task as { status?: string }).status === "done"
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                  />
                </button>

                {/* Subfolder Body (Details & Inline Editing) */}
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/40 rounded-b-xl space-y-3">
                    {/* Description Edit Area */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block">
                        Task Description:
                      </label>
                      <textarea
                        rows={2}
                        value={task.description}
                        onChange={(e) =>
                          onTaskChange?.({
                            ...task,
                            description: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 leading-relaxed resize-none"
                      />
                    </div>

                    {/* Metadata Grid: Owner & Deadline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 block">
                          Assigned Owner:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Student"
                          value={task.owner || ""}
                          onChange={(e) =>
                            onTaskChange?.({
                              ...task,
                              owner: e.target.value.trim() || null,
                              owner_source: e.target.value.trim() ? "user" : "none",
                            })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 block">
                          Deadline (YYYY-MM-DD):
                        </label>
                        <input
                          type="date"
                          value={task.deadline_date || ""}
                          onChange={(e) =>
                            onTaskChange?.({
                              ...task,
                              deadline_date: e.target.value || null,
                              deadline_source: e.target.value ? "user" : "none",
                            })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Condition / Note if applicable */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block">
                        Condition / Exemption:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Final-year students exempt"
                        value={task.condition || ""}
                        onChange={(e) =>
                          onTaskChange?.({
                            ...task,
                            condition: e.target.value.trim() || null,
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      />
                    </div>

                    {/* Source Citations & Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          Sources:
                        </span>
                        {task.source_refs && task.source_refs.length > 0 ? (
                          task.source_refs.map((ref) => {
                            const isSelected = highlightedRefs.includes(ref);
                            return (
                              <button
                                key={ref}
                                type="button"
                                onClick={() => onSourceRefClick?.([ref])}
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                                  isSelected
                                    ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                                }`}
                              >
                                ¶{formatSourceChip(ref)}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-gray-400">None cited</span>
                        )}
                      </div>

                      {onTaskDelete && (
                        <button
                          type="button"
                          onClick={() => onTaskDelete(task.client_id || task.task_id || "")}
                          className="text-[11px] font-medium text-red-600 hover:text-red-800 hover:underline transition-colors"
                        >
                          Delete task
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Add Task Button */}
        {onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>Add Task to Checklist</span>
          </button>
        )}
      </div>

      {/* Approve & Save Footer Button (if in draft mode) */}
      {isDraft && onApprove && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
          {validationErrors.length > 0 && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-bold">Please correct validation issues:</p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={onApprove}
            disabled={approving || tasks.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {approving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Saving Checklist...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Approve &amp; Save Checklist ({tasks.length} tasks)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
