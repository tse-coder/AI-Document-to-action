// Owner: Member 2 (Frontend Engineer)
// Clean, context-aware Chat Input (no mode selector):
// - When selectedDocId is null: Paste Notice Mode (paste directive, insert sample)
// - When selectedDocId is active: Conversational Edit Mode (ask questions, request edits)

"use client";

import React, { useRef, useState } from "react";

interface ChatInputProps {
  onSendMessage: (text: string, title?: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  selectedDocId?: string | null;
}

const SAMPLE_NOTICE_N1 = `The Registrar's Office will renew student ID cards for the 2026/27 academic year.

Each student must submit two documents: a completed renewal form and one recent passport photo.

Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.

Final-year students are exempt from the passport photo requirement and submit only the form.

The renewal form must be signed by the department head before submission.`;

export default function ChatInput({
  onSendMessage,
  loading = false,
  disabled = false,
  selectedDocId = null,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPasteMode = !selectedDocId;
  const charCount = text.length;
  const isValidLength = charCount >= 3 && charCount <= 6000;
  const canSend = !loading && !disabled && isValidLength;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSend) return;

    onSendMessage(text.trim(), title.trim() || undefined);
    setText("");
    setTitle("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (!isPasteMode || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleInsertSample = () => {
    setText(SAMPLE_NOTICE_N1);
    setTitle("Student ID Card Renewal Notice");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Notice Title input (only shown when pasting a new notice and text has been entered) */}
        {isPasteMode && text.trim().length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Notice Title:
            </span>
            <input
              type="text"
              placeholder="e.g. Student ID Card Renewal Notice (optional)"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || disabled}
              className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>
        )}

        {/* Text Input Container */}
        <div className="relative rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-2xs transition-all">
          <textarea
            ref={textareaRef}
            rows={isPasteMode ? 4 : 2}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (textareaRef.current && !isPasteMode) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${Math.min(
                  textareaRef.current.scrollHeight,
                  140
                )}px`;
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isPasteMode
                ? "Paste an administrative notice or directive here to extract tasks, deadlines, and owners..."
                : "Ask a question or request changes to the checklist..."
            }
            disabled={loading || disabled}
            maxLength={6000}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Action Row below textarea */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {isPasteMode && (
                <button
                  type="button"
                  onClick={handleInsertSample}
                  disabled={loading || disabled}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  <span>Insert Sample Notice</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Character counter */}
              <span
                className={`text-[11px] tabular-nums ${
                  charCount > 5500
                    ? "text-red-600 font-semibold"
                    : charCount < 3 && charCount > 0
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              >
                {charCount > 0 ? `${charCount} / 6000` : ""}
              </span>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1765F5] hover:bg-blue-600 text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-xs"
                aria-label={isPasteMode ? "Analyze Notice" : "Send message"}
              >
                {loading ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
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
                ) : (
                  <>
                    <span>{isPasteMode ? "Analyze Notice" : "Send"}</span>
                    <span className="text-xs">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          {isPasteMode ? (
            <span>Paste text and click Analyze Notice or press <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Ctrl+Enter</kbd></span>
          ) : (
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
          )}
        </p>
      </form>
    </div>
  );
}
