// Owner: Member 2 (Frontend Engineer)
// Displays and edits the agent's draft checklist proposal (FE-11, FE-12, FE-13)
// Source of truth: docs/api-spec.md Section 3 (Proposal & Task schemas)

"use client";

import { useState } from "react";
import type { Proposal, TaskBase } from "@/lib/types";

interface Props {
  proposal: Proposal;
  tasks?: TaskBase[];
  onTaskChange?: (updatedTask: TaskBase) => void;
  onTaskEdit?: (clientId: string, field: keyof TaskBase, value: unknown) => void;
  onSourceRefClick?: (refs: string[]) => void;
  highlightedRefs?: string[];
  readOnly?: boolean;
}

export default function DraftChecklist({
  proposal,
  tasks: controlledTasks,
  onTaskChange,
  onTaskEdit,
  onSourceRefClick,
  highlightedRefs = [],
  readOnly = false,
}: Props) {
  // Use controlled tasks from parent workspace state, or fallback to proposal.tasks
  const tasks = controlledTasks ?? proposal.tasks;

  // Local editing validation errors keyed by client_id
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDescriptionChange = (task: TaskBase, newDesc: string) => {
    if (readOnly) return;

    if (newDesc.trim().length === 0) {
      setErrors((prev) => ({
        ...prev,
        [task.client_id]: "Description cannot be empty.",
      }));
    } else if (newDesc.trim().length < 5) {
      setErrors((prev) => ({
        ...prev,
        [task.client_id]: "Description must be at least 5 characters.",
      }));
    } else if (newDesc.length > 300) {
      setErrors((prev) => ({
        ...prev,
        [task.client_id]: "Description must not exceed 300 characters.",
      }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[task.client_id];
        return copy;
      });
    }

    const updated: TaskBase = {
      ...task,
      description: newDesc,
    };

    onTaskChange?.(updated);
    onTaskEdit?.(task.client_id, "description", newDesc);
  };

  const handleOwnerChange = (task: TaskBase, newOwner: string) => {
    if (readOnly) return;
    const trimmed = newOwner.trim();
    const updated: TaskBase = {
      ...task,
      owner: trimmed || null,
      owner_source: trimmed ? "user" : "none",
    };
    onTaskChange?.(updated);
    onTaskEdit?.(task.client_id, "owner", updated.owner);
  };

  const handleDeadlineChange = (task: TaskBase, newDate: string) => {
    if (readOnly) return;
    const trimmed = newDate.trim();
    const updated: TaskBase = {
      ...task,
      deadline_date: trimmed || null,
      deadline_text: null,
      deadline_source: trimmed ? "user" : "none",
    };
    onTaskChange?.(updated);
    onTaskEdit?.(task.client_id, "deadline_date", updated.deadline_date);
  };

  const formatSourceChip = (ref: string) => {
    const match = ref.match(/P\d+$/i);
    return match ? match[0] : ref;
  };

  const isChipHighlighted = (ref: string) => {
    return highlightedRefs.some((hr) => {
      if (hr === ref) return true;
      const hrNorm = hr.replace(/^[A-Za-z0-9]+-/, "");
      const refNorm = ref.replace(/^[A-Za-z0-9]+-/, "");
      return hrNorm === refNorm;
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Box */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
            Proposal Summary
          </span>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            v{proposal.version}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-blue-950 font-medium">
          {proposal.summary}
        </p>
      </div>

      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          Draft Tasks ({tasks.length})
        </h3>
        <span className="text-xs text-gray-500">
          {readOnly ? "Read-only view" : "Click to edit inline"}
        </span>
      </div>

      {/* Desktop Table View (FE-11) */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <table
          className="w-full text-left text-xs divide-y divide-gray-200"
          aria-label="Draft tasks table"
        >
          <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-3 py-2.5 w-24">
                Action
              </th>
              <th scope="col" className="px-3 py-2.5">
                Description &amp; Conditions
              </th>
              <th scope="col" className="px-3 py-2.5 w-28">
                Owner
              </th>
              <th scope="col" className="px-3 py-2.5 w-32">
                Deadline
              </th>
              <th scope="col" className="px-3 py-2.5 w-24">
                Sources
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tasks.map((task) => {
              const hasError = errors[task.client_id];
              const isMissingDeadline =
                task.deadline_source === "none" ||
                !task.deadline_date ||
                proposal.validation?.issues?.some(
                  (i) =>
                    i.task_client_id === task.client_id &&
                    i.code === "DEADLINE_NOT_STATED"
                );
              const isMissingOwner =
                task.owner_source === "none" ||
                !task.owner ||
                proposal.validation?.issues?.some(
                  (i) =>
                    i.task_client_id === task.client_id &&
                    i.code === "OWNER_NOT_STATED"
                );

              const taskIssues =
                proposal.validation?.issues?.filter(
                  (issue) => issue.task_client_id === task.client_id
                ) ?? [];

              return (
                <tr key={task.client_id} className="align-top hover:bg-gray-50/50">
                  {/* Action / ID */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 block w-max">
                        {task.client_id}
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded block w-max ${
                          task.action === "create"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {task.action === "create"
                          ? "Create"
                          : `Update ${task.task_id ?? ""}`}
                      </span>
                    </div>
                  </td>

                  {/* Description, Condition & Warnings */}
                  <td className="px-3 py-3 space-y-2">
                    {readOnly ? (
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {task.description}
                      </p>
                    ) : (
                      <textarea
                        rows={2}
                        value={task.description}
                        onChange={(e) =>
                          handleDescriptionChange(task, e.target.value)
                        }
                        aria-label={`Description for ${task.client_id}`}
                        placeholder="Task description (min 5 chars)..."
                        className={`w-full text-xs font-medium p-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          hasError
                            ? "border-red-400 ring-1 ring-red-400"
                            : "border-gray-300"
                        }`}
                      />
                    )}
                    {hasError && (
                      <p className="text-[11px] text-red-600 font-medium">
                        ⚠️ {hasError}
                      </p>
                    )}

                    {/* Condition */}
                    {task.condition && (
                      <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start gap-1">
                        <span className="font-bold select-none">Condition:</span>
                        <span>{task.condition}</span>
                      </div>
                    )}

                    {/* Inline Amber Warnings (FE-11) */}
                    <div className="flex flex-wrap gap-1">
                      {isMissingDeadline && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          <span aria-hidden="true">⚠️</span> No deadline stated
                        </span>
                      )}
                      {isMissingOwner && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          <span aria-hidden="true">⚠️</span> Who is responsible?
                        </span>
                      )}
                      {taskIssues.map((issue, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          <span aria-hidden="true">ℹ️</span> {issue.message}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-3">
                    {readOnly ? (
                      <span className="text-xs font-medium text-gray-800">
                        {task.owner || "Not stated"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={task.owner ?? ""}
                        onChange={(e) => handleOwnerChange(task, e.target.value)}
                        placeholder="e.g. Student"
                        aria-label={`Owner for ${task.client_id}`}
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </td>

                  {/* Deadline */}
                  <td className="px-3 py-3">
                    {readOnly ? (
                      <span className="text-xs font-medium text-gray-800">
                        {task.deadline_date || "Not stated"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={task.deadline_date ?? ""}
                        onChange={(e) =>
                          handleDeadlineChange(task, e.target.value)
                        }
                        placeholder="YYYY-MM-DD"
                        aria-label={`Deadline for ${task.client_id}`}
                        className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </td>

                  {/* Sources (FE-13) */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {task.source_refs?.map((ref) => {
                        const isHighlighted = isChipHighlighted(ref);
                        return (
                          <button
                            key={ref}
                            type="button"
                            onClick={() => onSourceRefClick?.(task.source_refs)}
                            title={`Highlight sources: ${task.source_refs.join(", ")}`}
                            className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isHighlighted
                                ? "bg-amber-300 text-amber-950 border-amber-400 ring-1 ring-amber-400"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                            }`}
                          >
                            {formatSourceChip(ref)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View (FE-11) */}
      <div className="md:hidden space-y-3">
        {tasks.map((task) => {
          const hasError = errors[task.client_id];
          const isMissingDeadline =
            task.deadline_source === "none" ||
            !task.deadline_date ||
            proposal.validation?.issues?.some(
              (i) =>
                i.task_client_id === task.client_id &&
                i.code === "DEADLINE_NOT_STATED"
            );
          const isMissingOwner =
            task.owner_source === "none" ||
            !task.owner ||
            proposal.validation?.issues?.some(
              (i) =>
                i.task_client_id === task.client_id &&
                i.code === "OWNER_NOT_STATED"
            );

          const taskIssues =
            proposal.validation?.issues?.filter(
              (issue) => issue.task_client_id === task.client_id
            ) ?? [];

          return (
            <div
              key={task.client_id}
              className="p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3"
            >
              {/* Task Header: ID and Badges */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {task.client_id}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      task.action === "create"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-sky-100 text-sky-800 border border-sky-200"
                    }`}
                  >
                    {task.action === "create"
                      ? "Create"
                      : `Update ${task.task_id ?? ""}`}
                  </span>
                </div>

                {/* Source Reference Chips (FE-13) */}
                {task.source_refs && task.source_refs.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 font-medium mr-0.5">
                      Sources:
                    </span>
                    {task.source_refs.map((ref) => {
                      const isHighlighted = isChipHighlighted(ref);
                      return (
                        <button
                          key={ref}
                          type="button"
                          onClick={() => onSourceRefClick?.(task.source_refs)}
                          title={`Highlight sources: ${task.source_refs.join(", ")}`}
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            isHighlighted
                              ? "bg-amber-300 text-amber-950 border-amber-400 ring-1 ring-amber-400"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                          }`}
                        >
                          {formatSourceChip(ref)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Editable Description (FE-12) */}
              <div>
                <label
                  htmlFor={`m-desc-${task.client_id}`}
                  className="sr-only"
                >
                  Task Description
                </label>
                {readOnly ? (
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {task.description}
                  </p>
                ) : (
                  <textarea
                    id={`m-desc-${task.client_id}`}
                    rows={2}
                    value={task.description}
                    onChange={(e) =>
                      handleDescriptionChange(task, e.target.value)
                    }
                    placeholder="Task description (required)..."
                    className={`w-full text-sm font-medium p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError
                        ? "border-red-400 ring-1 ring-red-400"
                        : "border-gray-300"
                    }`}
                  />
                )}
                {hasError && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    ⚠️ {hasError}
                  </p>
                )}
              </div>

              {/* Condition Note (if present) */}
              {task.condition && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-1.5">
                  <span className="font-bold select-none">Condition:</span>
                  <span className="leading-relaxed">{task.condition}</span>
                </div>
              )}

              {/* Fields: Owner & Deadline (FE-12) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Owner field */}
                <div>
                  <span className="block text-xs font-semibold text-gray-600 mb-1">
                    Owner
                  </span>
                  {readOnly ? (
                    <span className="text-xs font-medium text-gray-800">
                      {task.owner || "Not stated"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={task.owner ?? ""}
                      onChange={(e) => handleOwnerChange(task, e.target.value)}
                      placeholder="e.g. Student"
                      className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Deadline field */}
                <div>
                  <span className="block text-xs font-semibold text-gray-600 mb-1">
                    Deadline (YYYY-MM-DD)
                  </span>
                  {readOnly ? (
                    <span className="text-xs font-medium text-gray-800">
                      {task.deadline_date || "Not stated"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={task.deadline_date ?? ""}
                      onChange={(e) =>
                        handleDeadlineChange(task, e.target.value)
                      }
                      placeholder="e.g. 2026-11-15"
                      className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Inline Amber Warnings (FE-11) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {isMissingDeadline && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    <span aria-hidden="true">⚠️</span> No deadline stated
                  </span>
                )}
                {isMissingOwner && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    <span aria-hidden="true">⚠️</span> Who is responsible?
                  </span>
                )}
                {taskIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                  >
                    <span aria-hidden="true">ℹ️</span> {issue.message}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Absent Information Section (FE-11) */}
      {proposal.absent_information && proposal.absent_information.length > 0 && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm select-none" aria-hidden="true">
              ℹ️
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Absent Information
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            The notice was checked for common administrative details and the following items were not found:
          </p>
          <ul className="space-y-1.5 pt-1">
            {proposal.absent_information.map((item, index) => (
              <li
                key={index}
                className="text-xs p-2 rounded bg-white border border-slate-200 text-slate-800"
              >
                <span className="font-semibold text-slate-900">
                  {item.topic}:
                </span>{" "}
                {item.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
