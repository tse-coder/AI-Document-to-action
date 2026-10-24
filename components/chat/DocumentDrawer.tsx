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
    <div className="border-b border-gray-200 bg-white">
      {/* Sticky Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {docId ? "Active Document" : "Draft Document"}:
          </span>
          <span className="text-xs font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">
            {title || "Untitled Notice"}
          </span>
          {hasParagraphs && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/70 text-gray-700">
              {paragraphs.length} paragraphs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasParagraphs && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isOpen ? "Hide text" : "Inspect text"}</span>
            </button>
          )}

          {onNewNotice && (
            <button
              type="button"
              onClick={onNewNotice}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
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
