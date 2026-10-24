// Owner: Member 2 (Frontend Engineer)
// Main Chat Interface — Clean, sharp, distraction-free conversational workspace

"use client";

import React, { useEffect, useRef } from "react";
import ChatMessageItem, { type ChatMessage } from "./ChatMessageItem";
import ChatInput from "./ChatInput";
import DocumentDrawer from "./DocumentDrawer";
import type { Paragraph } from "@/lib/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, title?: string) => void;
  onAnswerQuestion?: (questionId: string, answer: string, notStated: boolean) => void;
  onNewNotice?: () => void;
  documentTitle?: string;
  selectedDocId?: string | null;
  paragraphs?: Paragraph[];
  highlightedRefs?: string[];
  onParagraphClick?: (paragraphId: string) => void;
  loading?: boolean;
  submittingAnswer?: boolean;
}

const SAMPLE_NOTICE_N1 = `The Registrar's Office will renew student ID cards for the 2026/27 academic year.

Each student must submit two documents: a completed renewal form and one recent passport photo.

Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.

Final-year students are exempt from the passport photo requirement and submit only the form.

The renewal form must be signed by the department head before submission.`;

const SAMPLE_NOTICE_N2 = `The Engineering Lab lends equipment to registered students for coursework projects.

A student who wants to borrow equipment must present a valid student ID card and a signed borrowing form.

Equipment must be returned within 7 days of the borrowing date.

Students who return equipment late must pay a late fee of 20 birr per day.

Postgraduate students may borrow equipment for up to 14 days instead of 7 days.

Damaged equipment must be reported to the lab technician on the day of return.`;

export default function ChatInterface({
  messages,
  onSendMessage,
  onAnswerQuestion,
  onNewNotice,
  documentTitle = "",
  selectedDocId = null,
  paragraphs = [],
  highlightedRefs = [],
  onParagraphClick,
  loading = false,
  submittingAnswer = false,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on message change or loading state
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top Document Drawer */}
      <DocumentDrawer
        title={documentTitle}
        docId={selectedDocId}
        paragraphs={paragraphs}
        highlightedRefs={highlightedRefs}
        onParagraphClick={onParagraphClick}
        onNewNotice={onNewNotice}
      />

      {/* Message Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Turn notices into actionable checklists
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Paste an administrative directive or policy notice below. The agent extracts tasks, owners, and deadlines with paragraph citations.
              </p>
            </div>

            <div className="w-full pt-1 grid grid-cols-1 gap-2 text-left">
              <button
                type="button"
                onClick={() =>
                  onSendMessage(SAMPLE_NOTICE_N1, "Student ID Card Renewal Notice")
                }
                className="p-3 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors flex items-center justify-between group"
              >
                <div className="text-left">
                  <span className="font-semibold text-slate-800 block">
                    Student ID Renewal Notice (Demo N1)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Deadlines, photo requirement &amp; final-year student exemption
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-sm">→</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSendMessage(SAMPLE_NOTICE_N2, "Lab Equipment Borrowing Procedure")
                }
                className="p-3 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors flex items-center justify-between group"
              >
                <div className="text-left">
                  <span className="font-semibold text-slate-800 block">
                    Lab Equipment Borrowing Procedure (Demo N2)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Tests interactive clarification for unstated owner/deadline
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-sm">→</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onAnswerQuestion={onAnswerQuestion}
              isSubmittingAnswer={submittingAnswer}
              onCitationClick={onParagraphClick}
              onViewDocument={
                paragraphs.length > 0 ? () => {} : undefined
              }
            />
          ))
        )}

        {/* Quiet, Minimalist Processing State */}
        {loading && (
          <div className="my-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs text-slate-700 flex items-center gap-2.5 max-w-sm">
            <svg className="w-4 h-4 animate-spin text-slate-600 flex-shrink-0" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="font-medium text-slate-700">
              Analyzing notice and updating checklist...
            </span>
          </div>
        )}
      </div>

      {/* Bottom Message Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        loading={loading}
        disabled={submittingAnswer}
        selectedDocId={selectedDocId}
      />
    </div>
  );
}
