// Owner: Member 2 (Frontend Engineer)
// Collapsible / Sheet Document Inspector displaying source paragraphs with citation highlight synchronization

"use client";

import React, { useState } from "react";
import ParagraphViewer from "@/components/document/ParagraphViewer";
import type { Paragraph } from "@/lib/types";

interface DocumentDrawerProps {
  title: string;
  docId: string | null;
  paragraphs: Paragraph[];
  highlightedRefs: string[];
  onParagraphClick?: (paragraphId: string) => void;
  onNewNotice?: () => void;
}

export default function DocumentDrawer({
  title,
  docId,
  paragraphs,
  highlightedRefs,
  onParagraphClick,
  onNewNotice,
}: DocumentDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasParagraphs = paragraphs && paragraphs.length > 0;

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Sticky Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-slate-500">
            {docId ? "Notice" : "Draft"}:
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
            {title || "Untitled Notice"}
          </span>
          {hasParagraphs && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
              {paragraphs.length} paragraphs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasParagraphs && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isOpen ? "Hide source text" : "View source text"}</span>
            </button>
          )}

          {onNewNotice && (
            <button
              type="button"
              onClick={onNewNotice}
              className="text-xs px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            >
              New
            </button>
          )}
        </div>
      </div>

      {/* Expandable Paragraph Viewer Body */}
      {isOpen && hasParagraphs && (
        <div className="max-h-72 overflow-y-auto p-4 bg-gray-50/50 border-b border-gray-200 shadow-inner">
          <ParagraphViewer
            paragraphs={paragraphs}
            highlightedRefs={highlightedRefs}
            onParagraphClick={onParagraphClick}
          />
        </div>
      )}
    </div>
  );
}
