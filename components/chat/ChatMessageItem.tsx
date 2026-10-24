// Owner: Member 2 (Frontend Engineer)
// Chat message item rendering user, agent, and system bubbles with structured actions

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
  isSubmittingAnswer?: boolean;
}

export default function ChatMessageItem({
  message,
  onAnswerQuestion,
  onViewDocument,
  isSubmittingAnswer = false,
}: ChatMessageItemProps) {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  // State for custom text input in clarification
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 my-4 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
          isUser
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-indigo-700 text-white shadow-sm"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        )}
      </div>

      {/* Message Bubble Content */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
            : "bg-gray-50 text-gray-900 border border-gray-200 rounded-tl-none shadow-sm"
        }`}
      >
        {/* Header label for agent */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-200/60">
            <span className="text-xs font-bold text-indigo-900 tracking-tight">
              Action Agent
            </span>
            <span className="text-[10px] text-gray-500 tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Notice Submission Card Preview */}
        {message.type === "notice_submission" && message.metadata && (
          <div className="mb-2 p-2.5 rounded-lg bg-blue-700/60 border border-blue-400/30 text-xs text-blue-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white truncate">
                📄 {message.metadata.docTitle || "Notice submitted"}
              </span>
              {message.metadata.paragraphCount && (
                <span className="text-[10px] bg-blue-800/80 px-2 py-0.5 rounded text-blue-100">
                  {message.metadata.paragraphCount} paragraphs
                </span>
              )}
            </div>
          </div>
        )}

        {/* Body Text */}
        <div className="whitespace-pre-wrap break-words">{message.text}</div>

        {/* Tool Actions Accordion */}
        {message.toolSummary && message.toolSummary.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-gray-200/70 space-y-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Tool Activity
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.toolSummary.map((t, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                    t.ok
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {t.tool}: {t.summary}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clarification Questions Cards */}
        {message.questions && message.questions.length > 0 && onAnswerQuestion && (
          <div className="mt-3 pt-2.5 border-t border-amber-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <svg className="w-3.5 h-3.5 fill-current text-amber-600" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Clarification needed to proceed:</span>
            </div>

            {message.questions.map((q) => (
              <div
                key={q.question_id}
                className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5"
              >
                <p className="text-xs font-medium text-amber-950 leading-relaxed">
                  {q.text}
                </p>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {q.field === "owner" && (
                    <>
                      <button
                        type="button"
                        disabled={isSubmittingAnswer}
                        onClick={() => onAnswerQuestion(q.question_id, "Student", false)}
                        className="px-2.5 py-1 text-xs font-medium bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingAnswer}
                        onClick={() => onAnswerQuestion(q.question_id, "Department Head", false)}
                        className="px-2.5 py-1 text-xs font-medium bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        Department Head
                      </button>
                    </>
                  )}

                  {q.allow_not_stated && (
                    <button
                      type="button"
                      disabled={isSubmittingAnswer}
                      onClick={() => onAnswerQuestion(q.question_id, "", true)}
                      className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 rounded-md hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Not stated in notice
                    </button>
                  )}
                </div>

                {/* Custom text answer input */}
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder={
                      q.field === "owner"
                        ? "Or type custom owner..."
                        : "YYYY-MM-DD deadline..."
                    }
                    value={customAnswers[q.question_id] || ""}
                    onChange={(e) =>
                      setCustomAnswers((prev) => ({
                        ...prev,
                        [q.question_id]: e.target.value,
                      }))
                    }
                    disabled={isSubmittingAnswer}
                    className="flex-1 px-2.5 py-1 text-xs bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        onAnswerQuestion(q.question_id, ans, false);
                      }
                    }}
                    className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button to inspect document */}
        {onViewDocument && (
          <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex justify-end">
            <button
              type="button"
              onClick={onViewDocument}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus:underline"
            >
              <span>View source paragraphs</span>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
