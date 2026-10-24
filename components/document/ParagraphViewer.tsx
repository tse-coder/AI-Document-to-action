// Owner: Member 2 (Frontend Engineer)
// Displays numbered paragraphs (P1, P2...) with highlight support

"use client";

import type { Paragraph } from "@/lib/types";

interface Props {
  paragraphs: Paragraph[];
  highlightedRefs?: string[]; // paragraph_ids to highlight
}

export default function ParagraphViewer({ paragraphs, highlightedRefs = [] }: Props) {
  // TODO:
  // - Render each paragraph with its ID badge (P1, P2...)
  // - Highlight paragraphs whose IDs are in highlightedRefs
  // - Clicking a paragraph ID copies it

  return (
    <div className="p-4 space-y-3">
      {paragraphs.map((p) => (
        <div
          key={p.paragraph_id}
          className={`flex gap-3 ${
            highlightedRefs.includes(p.paragraph_id) ? "bg-yellow-50 border-l-4 border-yellow-400 pl-2" : ""
          }`}
        >
          <span className="text-xs font-mono text-gray-400 mt-1 shrink-0">
            {p.paragraph_id}
          </span>
          <p className="text-sm">{p.text}</p>
        </div>
      ))}
    </div>
  );
}
