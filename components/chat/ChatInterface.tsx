// Owner: Member 2 (Frontend Engineer)
// Main Chat Interface — Conversational Document-to-Action Agent workspace

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

  // Auto-scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top Sticky Document Inspector */}
      <DocumentDrawer
        title={documentTitle}
        docId={selectedDocId}
        paragraphs={paragraphs}
        highlightedRefs={highlightedRefs}
        onParagraphClick={onParagraphClick}
        onNewNotice={onNewNotice}
      />

      {/* Message Feed Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-sm">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">
                AI Document to Action Agent
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste an administrative notice or announcement below. The agent will parse requirements, ask clarifications, and create a verified checklist with paragraph citations.
              </p>
            </div>

            <div className="w-full pt-2 grid grid-cols-1 gap-2 text-left">
              <button
                type="button"
                onClick={() =>
                  onSendMessage(
                    "The Registrar's Office will renew student ID cards for the 2026/27 academic year.\n\nEach student must submit two documents: a completed renewal form and one recent passport photo.\n\nBoth documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.\n\nFinal-year students are exempt from the passport photo requirement and submit only the form.\n\nThe renewal form must be signed by the department head before submission.",
                    "Student ID Card Renewal Notice"
                  )
                }
                className="p-3 text-xs bg-gray-50 hover:bg-indigo-50/60 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all flex items-start gap-2.5 group"
              >
                <span className="text-indigo-600 font-bold group-hover:scale-105 transition-transform">
                  📄
                </span>
                <div>
                  <span className="font-semibold text-gray-800 block">
                    Try Demo Notice N1
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Student ID Renewal with deadline and exempt condition
                  </span>
                </div>
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
              onViewDocument={
                paragraphs.length > 0 ? () => {} : undefined
              }
            />
          ))
        )}

        {/* Live Run Process Indicator */}
        {loading && (
          <div className="my-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-sm space-y-3 max-w-lg">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" viewBox="0 0 24 24">
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
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Agent Run In Progress
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                Live Trace
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <svg className="w-3.5 h-3.5 fill-current text-emerald-600 flex-shrink-0" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">1. Document paragraphs indexed and cited</span>
              </div>

              <div className="flex items-center gap-2 text-indigo-900 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping flex-shrink-0" />
                <span>2. Searching document requirements &amp; cross-referencing checklist</span>
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <span>3. Formulating actionable tasks with Gemini AI</span>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <span>4. Citation verification &amp; approval gate</span>
              </div>
            </div>

            <p className="text-[11px] text-indigo-700/80 pt-1 border-t border-indigo-100/80 leading-relaxed">
              Extracting deadlines, determining ownership, checking exemptions, and linking each requirement to source paragraphs...
            </p>
          </div>
        )}
      </div>

      {/* Bottom Message Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        loading={loading}
        disabled={submittingAnswer}
      />
    </div>
  );
}
