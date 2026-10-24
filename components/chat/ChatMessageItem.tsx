// Owner: Member 2 (Frontend Engineer)
// Clean, sharp chat message item (Claude-style interactive cards, no AI slop, no pulsating neon dots)

"use client";

import React, { useState } from "react";
import type { Question } from "@/lib/types";

export type ChatMessage = {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "notice_submission" | "clarification" | "proposal" | "error";
  toolSummary?: { tool: string; summary: string; ok: boolean }[];
  questions?: Question[];
  metadata?: {
    docTitle?: string;
    paragraphCount?: number;
    taskCount?: number;
  };
};

interface ChatMessageItemProps {
  message: ChatMessage;
  onAnswerQuestion?: (questionId: string, answer: string, notStated: boolean) => void;
  onViewDocument?: () => void;
  onCitationClick?: (paragraphId: string) => void;
  isSubmittingAnswer?: boolean;
}

const COMMON_OWNER_SUGGESTIONS = [
  "Student",
  "Lab Technician",
  "Department Head",
  "Staff Member",
];

export default function ChatMessageItem({
  message,
  onAnswerQuestion,
  onCitationClick,
  isSubmittingAnswer = false,
}: ChatMessageItemProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  // Track answers answered locally within this card
  const [answeredMap, setAnsweredMap] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-full border border-slate-200">
          {message.text}
        </span>
      </div>
    );
  }

  const handleSelectOption = (questionId: string, answer: string, notStated: boolean) => {
    if (isSubmittingAnswer || answeredMap[questionId]) return;
    setAnsweredMap((prev) => ({
      ...prev,
      [questionId]: notStated ? "Not stated in notice" : answer,
    }));
    onAnswerQuestion?.(questionId, notStated ? "" : answer, notStated);
  };

  return (
    <div
      className={`flex items-start gap-3 my-3.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Crisp minimal avatar */}
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
          isUser
            ? "bg-slate-900 text-white"
            : "bg-[#1765F5] text-white shadow-2xs"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <span className="text-[11px] font-medium">You</span>
        ) : (
          <span className="text-[11px] font-bold">AI</span>
        )}
      </div>

      {/* Message Bubble Content */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-slate-900 text-white rounded-tr-xs shadow-xs"
            : "bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs shadow-2xs"
        }`}
      >
        {/* Header label for agent */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 tracking-tight">
              Assistant
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Notice Submission Card Header */}
        {message.type === "notice_submission" && message.metadata && (
          <div className="mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 truncate">
                {message.metadata.docTitle || "Notice submitted"}
              </span>
              {message.metadata.paragraphCount && (
                <span className="text-[10px] font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">
                  {message.metadata.paragraphCount} paragraphs
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body Text with styled paragraph citations */}
        <div className="whitespace-pre-wrap break-words text-slate-800">
          {message.text}
        </div>

        {/* Tool Activity (Minimal, unobtrusive monospace chips) */}
        {message.toolSummary && message.toolSummary.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            {message.toolSummary.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
              >
                <span>{t.tool}</span>
              </span>
            ))}
          </div>
        )}

        {/* Claude-Style Interactive Clarification Cards */}
        {message.questions && message.questions.length > 0 && onAnswerQuestion && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Clarification needed to finalize checklist:</span>
            </div>

            {message.questions.map((q) => {
              const answeredValue = answeredMap[q.question_id];
              return (
                <div
                  key={q.question_id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      {q.text}
                    </p>
                    {q.source_refs && q.source_refs.length > 0 && (
                      <div className="flex flex-wrap gap-1 flex-shrink-0">
                        {q.source_refs.map((ref) => (
                          <button
                            key={ref}
                            type="button"
                            onClick={() => onCitationClick?.(ref)}
                            className="text-[10px] font-mono bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                            title={`Inspect paragraph ${ref}`}
                          >
                            {ref}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {answeredValue ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                      <span>✓ Recorded: {answeredValue}</span>
                    </div>
                  ) : (
                    <>
                      {/* Clickable Quick Option Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {q.field === "owner" &&
                          COMMON_OWNER_SUGGESTIONS.map((role) => (
                            <button
                              key={role}
                              type="button"
                              disabled={isSubmittingAnswer}
                              onClick={() => handleSelectOption(q.question_id, role, false)}
                              className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                              {role}
                            </button>
                          ))}

                        {q.allow_not_stated && (
                          <button
                            type="button"
                            disabled={isSubmittingAnswer}
                            onClick={() => handleSelectOption(q.question_id, "", true)}
                            className="px-2.5 py-1 text-xs font-medium bg-white text-slate-500 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                          >
                            Not stated in notice
                          </button>
                        )}
                      </div>

                      {/* Custom text/date answer input */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type={q.field === "deadline" ? "date" : "text"}
                          placeholder={
                            q.field === "owner"
                              ? "Or type custom responsible person..."
                              : "Select date..."
                          }
                          value={customAnswers[q.question_id] || ""}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [q.question_id]: e.target.value,
                            }))
                          }
                          disabled={isSubmittingAnswer}
                          className="flex-1 px-2.5 py-1 text-xs bg-white text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          disabled={
                            isSubmittingAnswer ||
                            !(customAnswers[q.question_id] || "").trim()
                          }
                          onClick={() => {
                            const ans = (customAnswers[q.question_id] || "").trim();
                            if (ans) {
                              handleSelectOption(q.question_id, ans, false);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-[#1765F5] hover:bg-blue-600 text-white rounded-md disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                        >
                          Submit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Proposal Summary Card */}
        {message.type === "proposal" && message.metadata?.taskCount && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Checklist ready ({message.metadata.taskCount} tasks)
            </span>
            <span className="text-[11px] font-semibold text-blue-600">
              Review in panel →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
