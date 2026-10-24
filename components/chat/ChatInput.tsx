// Owner: Member 2 (Frontend Engineer)
// Interactive Chat Input with auto-resizing, character counter, and sample template insertion

"use client";

import React, { useRef, useState } from "react";

interface ChatInputProps {
  onSendMessage: (text: string, title?: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const SAMPLE_NOTICE = `The Registrar's Office will renew student ID cards for the 2026/27 academic year.

Each student must submit two documents: a completed renewal form and one recent passport photo.

Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.

Final-year students are exempt from the passport photo requirement and submit only the form.

The renewal form must be signed by the department head before submission.`;

export default function ChatInput({
  onSendMessage,
  loading = false,
  disabled = false,
  placeholder = "Paste a notice or ask the agent to create a checklist...",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isPastingNotice, setIsPastingNotice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const isNotice = isPastingNotice || text.includes("\n\n") || charCount > 100;
  const isValidLength = charCount >= 3 && charCount <= 6000;
  const canSend = !loading && !disabled && isValidLength;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSend) return;

    onSendMessage(text.trim(), title.trim() || undefined);
    setText("");
    setTitle("");
    setIsPastingNotice(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // If it's a short chat message or cmd/ctrl pressed, send on enter
      if (e.metaKey || e.ctrlKey || (!isNotice && text.trim().length > 0)) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handlePasteSample = () => {
    setText(SAMPLE_NOTICE);
    setTitle("Student ID Card Renewal Notice");
    setIsPastingNotice(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Optional Title input if pasting a new document */}
        {(isPastingNotice || text.length > 150) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              Notice Title:
            </span>
            <input
              type="text"
              placeholder="e.g. Student ID Card Renewal Notice"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading || disabled}
              className="flex-1 px-3 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative rounded-xl border border-gray-300 bg-gray-50/50 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={isNotice ? 5 : 2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading || disabled}
            maxLength={6000}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          {/* Action Bar below textarea */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteSample}
                disabled={loading || disabled}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 2H9a3 3 0 01-3-2z" />
                </svg>
                <span>Sample Notice</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPastingNotice(!isPastingNotice)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  isPastingNotice
                    ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                    : "text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {isPastingNotice ? "Notice mode" : "Paste notice"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Character counter */}
              <span
                className={`text-xs tabular-nums ${
                  charCount > 5500
                    ? "text-red-600 font-semibold"
                    : charCount < 3 && charCount > 0
                    ? "text-amber-600"
                    : "text-gray-400"
                }`}
              >
                {charCount} / 6000
              </span>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
                aria-label="Send message"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
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
                  <svg className="w-4 h-4 fill-current rotate-90" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-gray-600 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-gray-100 border text-gray-600 font-mono text-[10px]">Shift+Enter</kbd> for newline
        </p>
      </form>
    </div>
  );
}
