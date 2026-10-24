// Owner: Member 2 (Frontend Engineer)
// Collapsible read-only list of tool calls and results for demo observability (FE-22)
// Source of truth: docs/api-spec.md Section 3 (Tool log entry schema)

"use client";

import { useState } from "react";
import type { ToolLogEntry } from "@/lib/types";

interface Props {
  toolLog?: ToolLogEntry[];
}

export default function ToolLog({ toolLog }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Hidden if no log exists (FE-22 acceptance criterion)
  if (!toolLog || toolLog.length === 0) {
    return null;
  }

  const phaseColors: Record<string, string> = {
    loop: "bg-sky-100 text-sky-800 border-sky-200",
    finalize: "bg-purple-100 text-purple-800 border-purple-200",
    gate: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Collapsible Header Toggle (collapsed by default) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="tool-log-content"
        className="w-full min-h-[40px] px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-left flex items-center justify-between text-xs font-semibold text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm select-none" aria-hidden="true">
            🛠️
          </span>
          <span className="font-bold text-gray-900">Agent Tool Activity</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[11px] font-mono">
            {toolLog.length} {toolLog.length === 1 ? "call" : "calls"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-[11px] font-normal">
            {isOpen ? "Hide" : "Show"}
          </span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div id="tool-log-content" className="p-3 space-y-2.5 bg-gray-50/50">
          <p className="text-[11px] text-gray-500 italic pb-1 border-b border-gray-200">
            Read-only execution audit log of model tool invocations and system gates:
          </p>
          <ol className="space-y-2 list-none m-0 p-0" aria-label="Tool call sequence">
            {toolLog.map((entry) => {
              const phaseBadge =
                phaseColors[entry.phase] || "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <li
                  key={entry.seq}
                  className="p-2.5 bg-white border border-gray-200 rounded-md shadow-2xs space-y-1.5 text-xs"
                >
                  {/* Top Bar: Sequence, Tool, Phase, Duration */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-gray-400">
                        #{entry.seq}
                      </span>
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {entry.tool}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${phaseBadge}`}
                      >
                        {entry.phase}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                          entry.ok
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {entry.ok ? "✓ ok" : "✗ error"}
                      </span>
                      <span className="text-gray-500 font-mono text-[10px]">
                        {entry.duration_ms}ms
                      </span>
                    </div>
                  </div>

                  {/* Result Summary */}
                  <div className="text-[11px] text-gray-700 leading-snug pl-1 border-l-2 border-gray-300">
                    <span className="font-semibold text-gray-500 mr-1">Result:</span>
                    <span className="font-mono text-gray-800">
                      {entry.result_summary || "Completed"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
