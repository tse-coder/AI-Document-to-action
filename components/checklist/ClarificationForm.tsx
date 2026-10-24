// Owner: Member 2 (Frontend Engineer)
// Renders clarification questions and collects answers (FE-15)
// Source of truth: docs/api-spec.md Section 4.6 (POST /api/runs/:runId/answer)

"use client";

import { useId, useState } from "react";
import type { AnswerInput, Question } from "@/lib/types";

interface Props {
  questions: Question[];
  submitting?: boolean;
  error?: string | null;
  onSubmit: (answers: AnswerInput[]) => void;
  onSourceRefClick?: (refs: string[]) => void;
  initialAnswers?: Record<string, { answer: string; not_stated: boolean }>;
}

export default function ClarificationForm({
  questions,
  submitting = false,
  error = null,
  onSubmit,
  onSourceRefClick,
  initialAnswers = {},
}: Props) {
  const formId = useId();

  // Answers keyed by question_id: { answer: string, not_stated: boolean }
  const [formState, setFormState] = useState<
    Record<string, { answer: string; not_stated: boolean }>
  >(() => {
    const state: Record<string, { answer: string; not_stated: boolean }> = {};
    for (const q of questions) {
      if (initialAnswers[q.question_id]) {
        state[q.question_id] = initialAnswers[q.question_id];
      } else {
        state[q.question_id] = { answer: "", not_stated: false };
      }
    }
    return state;
  });

  const handleTextChange = (questionId: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      [questionId]: {
        answer: val,
        not_stated: false, // typing text clears not_stated
      },
    }));
  };

  const handleToggleNotStated = (questionId: string) => {
    setFormState((prev) => {
      const current = prev[questionId] || { answer: "", not_stated: false };
      const nextNotStated = !current.not_stated;
      return {
        ...prev,
        [questionId]: {
          answer: nextNotStated ? "" : current.answer,
          not_stated: nextNotStated,
        },
      };
    });
  };

  const formatSourceChip = (ref: string) => {
    const match = ref.match(/P\d+$/i);
    return match ? match[0] : ref;
  };

  // Validation: every question must be answered or marked not_stated
  const isQuestionAnswered = (q: Question) => {
    const entry = formState[q.question_id];
    if (!entry) return false;
    if (entry.not_stated) return true;
    const trimmed = entry.answer.trim();
    if (trimmed.length === 0) return false;
    if (q.field === "owner") {
      return trimmed.length >= 1 && trimmed.length <= 200;
    }
    if (q.field === "deadline") {
      return /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    }
    return true;
  };

  const allAnswered =
    questions.length > 0 && questions.every((q) => isQuestionAnswered(q));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    const payload: AnswerInput[] = questions.map((q) => {
      const entry = formState[q.question_id] || {
        answer: "",
        not_stated: false,
      };
      return {
        question_id: q.question_id,
        answer: entry.not_stated ? "" : entry.answer.trim(),
        not_stated: entry.not_stated,
      };
    });

    onSubmit(payload);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-4 text-gray-900 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-base select-none" aria-hidden="true">
            ❓
          </span>
          <div>
            <h3 className="text-sm font-bold text-amber-950">
              Clarification Needed
            </h3>
            <p className="text-xs text-amber-800">
              The agent needs clarification on {questions.length} question
              {questions.length === 1 ? "" : "s"} before finalizing the draft.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
          {questions.length} open
        </span>
      </div>

      {/* Submission Error Banner if any */}
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-start gap-2"
        >
          <span className="text-base leading-none select-none">⚠️</span>
          <div className="space-y-0.5">
            <p className="font-semibold text-red-900">Submission Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const entry = formState[q.question_id] || {
            answer: "",
            not_stated: false,
          };
          const inputId = `clarification-input-${q.question_id}`;
          const isOwner = q.field === "owner";
          const isDeadline = q.field === "deadline";

          return (
            <div
              key={q.question_id}
              className="p-3.5 bg-white border border-amber-200/80 rounded-md shadow-sm space-y-2.5 transition-shadow hover:shadow-md"
            >
              {/* Question Meta: Badges & Sources */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    {q.question_id || `Q${idx + 1}`}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                    {q.field}
                  </span>
                </div>

                {q.source_refs && q.source_refs.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-400 font-medium">Sources:</span>
                    {q.source_refs.map((ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => onSourceRefClick?.(q.source_refs)}
                        title={`View cited source ${ref}`}
                        className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {formatSourceChip(ref)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Text */}
              <label
                htmlFor={inputId}
                className="block text-xs font-medium text-gray-900 leading-relaxed cursor-pointer"
              >
                {q.text}
              </label>

              {/* Input Area */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    id={inputId}
                    type="text"
                    disabled={submitting || entry.not_stated}
                    value={entry.answer}
                    onChange={(e) =>
                      handleTextChange(q.question_id, e.target.value)
                    }
                    placeholder={
                      entry.not_stated
                        ? "Marked as not stated in notice"
                        : isOwner
                        ? "e.g. Student, Registrar, Department Head"
                        : isDeadline
                        ? "YYYY-MM-DD (e.g. 2026-11-15)"
                        : "Type your answer..."
                    }
                    className={`w-full text-xs p-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      entry.not_stated
                        ? "bg-gray-100 text-gray-500 border-gray-300 italic"
                        : "bg-white text-gray-900 border-gray-300"
                    }`}
                  />
                  {entry.not_stated && (
                    <span className="absolute right-2.5 top-2 text-xs text-amber-700 font-medium">
                      ✓ Not stated
                    </span>
                  )}
                </div>

                {/* Not Stated in notice button */}
                {q.allow_not_stated && (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleToggleNotStated(q.question_id)}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        entry.not_stated
                          ? "bg-amber-200 text-amber-950 border-amber-300 font-bold"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {entry.not_stated
                        ? "✓ Marked: Not stated in notice"
                        : "Not stated in notice"}
                    </button>
                    <span className="text-[11px] text-gray-400">
                      {isDeadline
                        ? "Format: YYYY-MM-DD"
                        : "1–200 characters"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200">
        <p className="text-xs text-amber-800">
          {allAnswered
            ? "All questions answered. Ready to update."
            : "Please answer or mark all questions above."}
        </p>

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-md shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Agent is updating…</span>
            </>
          ) : (
            <span>Submit Answers</span>
          )}
        </button>
      </div>
    </form>
  );
}
