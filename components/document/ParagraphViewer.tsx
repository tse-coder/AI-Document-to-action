// Owner: Member 2 (Frontend Engineer)
// Displays numbered paragraphs (P1, P2...) with auto-scroll and highlight support (FE-09)

"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Paragraph } from "@/lib/types";

interface Props {
  paragraphs: Paragraph[];
  highlightedIds?: string[];
  highlightedRefs?: string[]; // alias for compatibility
  onParagraphClick?: (paragraphId: string) => void;
}

export default function ParagraphViewer({
  paragraphs,
  highlightedIds,
  highlightedRefs,
  onParagraphClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeHighlights = useMemo(
    () => highlightedIds ?? highlightedRefs ?? [],
    [highlightedIds, highlightedRefs]
  );

  // Smoothly scroll the first highlighted paragraph into view
  useEffect(() => {
    if (activeHighlights.length > 0 && typeof window !== "undefined") {
      const firstId = activeHighlights[0];
      const normalized = firstId.replace(/^[A-Za-z0-9]+-/, "");
      const target =
        containerRef.current?.querySelector(`[data-para-id="${firstId}"]`) ||
        document.getElementById(firstId) ||
        containerRef.current?.querySelector(`[data-para-id$="-${normalized}"]`) ||
        containerRef.current?.querySelector(`[data-para-id="${normalized}"]`);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeHighlights]);

  return (
    <div
      ref={containerRef}
      className="space-y-3"
      role="feed"
      aria-label="Document paragraphs"
    >
      {paragraphs.map((p) => {
        const isHighlighted = activeHighlights.some((ref) => {
          if (ref === p.paragraph_id) return true;
          const refNorm = ref.replace(/^[A-Za-z0-9]+-/, "");
          const pNorm = p.paragraph_id.replace(/^[A-Za-z0-9]+-/, "");
          return refNorm === pNorm;
        });

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
            className={`flex items-start gap-3 p-3.5 rounded-md transition-all duration-200 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              isHighlighted
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400 shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 select-none transition-colors ${
                isHighlighted
                  ? "bg-amber-200 text-amber-900 border border-amber-300"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              P{p.position}
            </span>
            <p className="text-sm leading-relaxed text-gray-800 select-text">
              {p.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
