// Owner: Member 2 (Frontend Engineer)
// Displays numbered paragraphs (P1, P2...) with highlight support (FE-09, used by FE-07)

"use client";

import type { Paragraph } from "@/lib/types";

interface Props {
  paragraphs: Paragraph[];
  highlightedRefs?: string[]; // paragraph_ids to highlight
  onParagraphClick?: (paragraphId: string) => void;
}

export default function ParagraphViewer({
  paragraphs,
  highlightedRefs = [],
  onParagraphClick,
}: Props) {
  return (
    <div className="space-y-3" role="feed" aria-label="Document paragraphs">
      {paragraphs.map((p) => {
        const isHighlighted = highlightedRefs.includes(p.paragraph_id);

        return (
          <div
            key={p.paragraph_id}
            id={p.paragraph_id}
            data-para-id={p.paragraph_id}
            tabIndex={0}
            onClick={() => onParagraphClick?.(p.paragraph_id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onParagraphClick?.(p.paragraph_id);
              }
            }}
            className={`flex items-start gap-3 p-3 rounded-md transition-colors border ${
              isHighlighted
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
                : "bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            <span
              className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 select-none ${
                isHighlighted
                  ? "bg-amber-200 text-amber-900"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              P{p.position}
            </span>
            <p className="text-sm leading-relaxed text-gray-800">{p.text}</p>
          </div>
        );
      })}
    </div>
  );
}
