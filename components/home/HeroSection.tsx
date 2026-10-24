"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden bg-white pt-10 pb-16 lg:pt-16 lg:pb-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-14">
          {/* Left Column: Headline, Copy, 4 Features, CTA (~54% width) */}
          <div className="w-full lg:w-[54%] space-y-8">
            {/* Headline and Supporting Text */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.45rem] font-extrabold tracking-tight text-[#10264A] leading-[1.12] text-balance">
                Turn Dense Notices into<br />
                <span className="text-[#1765F5]">Actionable Checklists</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl text-pretty font-normal">
                Extract verified tasks, critical deadlines, designated owners, and source citations from administrative notices — ready for rapid review and team execution.
              </p>
            </div>

            {/* 4 Feature Highlights in a Horizontal Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 pt-1">
              {/* Feature 1: AI-Powered Analysis */}
              <div className="flex flex-col items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center text-[#1765F5]">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                  AI-Powered<br />Analysis
                </span>
              </div>

              {/* Feature 2: Source Cited Tasks */}
              <div className="flex flex-col items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center text-[#1765F5]">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                  Source-Cited<br />Tasks
                </span>
              </div>

              {/* Feature 3: Editable & Reviewable */}
              <div className="flex flex-col items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center text-[#1765F5]">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                  Editable &amp;<br />Reviewable
                </span>
              </div>

              {/* Feature 4: Save & Reopen Later */}
              <div className="flex flex-col items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center text-[#1765F5]">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                  Save &amp; Reopen<br />Later
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1765F5] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs shadow-blue-500/25 hover:shadow-sm transition-all duration-150 group"
              >
                <span>Start New Analysis</span>
                <span className="text-base transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
              <Link
                href="/saved-notices"
                className="inline-flex items-center gap-1.5 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200/80 font-medium text-sm rounded-xl transition-colors"
              >
                <span>Explore Demo Notices</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Reference-Matched Composition with Workspace Backdrop */}
          <div className="w-full lg:w-[46%] relative flex items-center justify-center py-6">
            {/* Background Image of Workspace Desk & Laptop */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-35 -z-10 pointer-events-none">
              <Image
                src="/images/academic-workspace.jpg"
                alt="Workspace desk with laptop"
                fill
                className="object-cover object-right-bottom"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>

            {/* Soft, Subtle Pastel Blue Radial Glow Backdrop */}
            <div
              className="absolute inset-0 m-auto w-[460px] h-[460px] sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-sky-100/70 via-blue-50/50 to-transparent rounded-full blur-2xl -z-10 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative w-full max-w-[480px]">
              {/* Back Panel: Original Notice */}
              <div className="relative w-[85%] sm:w-[82%] bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 p-4 sm:p-5 space-y-3 z-10">
                {/* Window Chrome Header */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-slate-300" />
                    <span className="w-2 h-2 rounded-full border border-slate-300" />
                  </div>
                </div>

                {/* Document Title Header */}
                <div className="pt-0.5">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                    Student ID Card Renewal Notice
                  </h3>
                  <div className="mt-2 h-px bg-slate-100" />
                </div>

                {/* Paragraphs P1, P2 (Highlighted), P3, P4, P5 */}
                <div className="space-y-2.5 pt-1 pb-4 text-xs">
                  {/* P1 */}
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      P1
                    </span>
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="h-1.5 bg-slate-200 rounded w-full" />
                      <div className="h-1.5 bg-slate-200 rounded w-4/5" />
                    </div>
                  </div>

                  {/* P2 (Active Selection Highlight Box) */}
                  <div className="relative -mx-1.5 px-2 py-1.5 rounded-lg bg-blue-100/70 border border-blue-200/70 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[9px] font-bold text-[#1765F5] bg-blue-200/80 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                        P2
                      </span>
                      <div className="flex-1 space-y-1 pt-1">
                        <div className="h-1.5 bg-blue-300/80 rounded w-full" />
                        <div className="h-1.5 bg-blue-300/80 rounded w-3/4" />
                      </div>
                    </div>
                  </div>

                  {/* P3 */}
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      P3
                    </span>
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="h-1.5 bg-slate-200 rounded w-11/12" />
                      <div className="h-1.5 bg-slate-200 rounded w-2/3" />
                    </div>
                  </div>

                  {/* P4 */}
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      P4
                    </span>
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="h-1.5 bg-slate-200 rounded w-5/6" />
                      <div className="h-1.5 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>

                  {/* P5 */}
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      P5
                    </span>
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="h-1.5 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Front Panel: Actionable Checklist */}
              <div className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:-right-4 w-[88%] sm:w-[86%] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/40 p-4 sm:p-5 space-y-3.5 z-20">
                {/* Window Chrome Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full border border-slate-300" />
                    <span className="w-2.5 h-2.5 border border-slate-300 rounded-xs" />
                  </div>
                </div>

                {/* Card Title */}
                <div className="pt-0.5 flex items-center justify-between">
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                    Actionable Checklist
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    Draft Verified
                  </span>
                </div>

                {/* Table Header Row: Task, Deadline, Source */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-100">
                  <div className="col-span-7 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-100 text-[#1765F5] flex items-center justify-center text-[7px] font-bold">
                      ✓
                    </span>
                    <span>Task</span>
                  </div>
                  <div className="col-span-3">Deadline</div>
                  <div className="col-span-2 text-right">Source</div>
                </div>

                {/* Checklist Task Rows */}
                <div className="space-y-2 text-xs">
                  {/* Task 1 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7 flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-md bg-[#1765F5] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-2xs">
                        ✓
                      </div>
                      <span className="text-[11.5px] font-semibold text-slate-800 truncate">
                        Submit completed renewal form
                      </span>
                    </div>
                    <div className="col-span-3 text-[10.5px] text-slate-500 font-medium whitespace-nowrap">
                      12 Nov 2026
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-[9px] font-semibold text-[#1765F5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                        P2, P3
                      </span>
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7 flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-md bg-[#1765F5] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 shadow-2xs">
                        ✓
                      </div>
                      <span className="text-[11.5px] font-semibold text-slate-800 truncate">
                        Submit passport size photo
                      </span>
                    </div>
                    <div className="col-span-3 text-[10.5px] text-slate-500 font-medium whitespace-nowrap">
                      12 Nov 2026
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-[9px] font-semibold text-[#1765F5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                        P3, P4
                      </span>
                    </div>
                  </div>

                  {/* Task 3 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7 flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white flex-shrink-0" />
                      <span className="text-[11.5px] font-semibold text-slate-800 truncate">
                        Obtain department signature
                      </span>
                    </div>
                    <div className="col-span-3 text-[10.5px] text-slate-400 font-medium">
                      —
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        P5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Verification Confirmation */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10.5px]">
                  <span className="text-slate-500 font-medium">
                    3 verified tasks • 1 approval pending
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#1765F5] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
