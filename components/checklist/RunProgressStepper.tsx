// Owner: Member 2 (Frontend Engineer)
// Live Run Process Stepper showing real-time agent execution stages, tool activity, and turn counters

"use client";

import React, { useEffect, useState } from "react";
import type { Run, ToolLogEntry } from "@/lib/types";

interface RunProgressStepperProps {
  run: Run | null;
  analyzing: boolean;
  toolLog?: ToolLogEntry[];
}

export default function RunProgressStepper({
  run,
  analyzing,
  toolLog = [],
}: RunProgressStepperProps) {
  // Simulated step progression for smooth UX while backend processes
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (!analyzing && !run) {
      setActiveStep(1);
      return;
    }

    const timer1 = setTimeout(() => setActiveStep(2), 600);
    const timer2 = setTimeout(() => setActiveStep(3), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [analyzing, run]);

  const logs = run?.tool_log && run.tool_log.length > 0 ? run.tool_log : toolLog;

  const steps = [
    {
      id: 1,
      title: "Notice Ingestion & Parsing",
      desc: "Split text into indexed paragraphs and assign unique IDs",
      status: activeStep > 1 ? "completed" : "active",
    },
    {
      id: 2,
      title: "Tool Execution & Search",
      desc: "Run search_document to query requirements and read_checklist for existing tasks",
      status: activeStep > 2 ? "completed" : activeStep === 2 ? "active" : "pending",
    },
    {
      id: 3,
      title: "AI Requirement Synthesis",
      desc: "Gemini models tasks, deadlines, ownership, and absent information",
      status: activeStep > 3 ? "completed" : activeStep === 3 ? "active" : "pending",
    },
    {
      id: 4,
      title: "Citation & Safety Verification",
      desc: "Validate paragraph source references and enforce the safety gate",
      status: run?.status === "awaiting_approval" || run?.status === "needs_clarification" ? "completed" : "pending",
    },
  ];

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
      {/* Header with live badge */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            Agent Execution Process
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
          Pass 1 • Running
        </span>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((s) => {
          const isDone = s.status === "completed";
          const isActive = s.status === "active";

          return (
            <div key={s.id} className="flex items-start gap-3">
              {/* Step indicator circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{s.id}</span>
                )}
              </div>

              {/* Step description */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-semibold ${
                      isActive
                        ? "text-indigo-900 font-bold"
                        : isDone
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {s.title}
                  </h4>
                  {isActive && (
                    <span className="text-[10px] text-indigo-600 font-medium animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Tool Activity Feed */}
      {logs.length > 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
            <span>Executed Tools</span>
            <span className="font-mono text-gray-500">{logs.length} calls</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.seq}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.ok ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-mono font-semibold text-gray-800 truncate">
                    {log.tool}
                  </span>
                  <span className="text-gray-400 text-[11px] truncate">
                    — {log.result_summary}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-500 flex-shrink-0 ml-2">
                  {log.duration_ms}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
