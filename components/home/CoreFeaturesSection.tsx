export default function CoreFeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#F8FAFC] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF3FF] text-[#1765F5] border border-blue-200/60">
              Core Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight mt-3">
            Built for Administrative Rigor
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Isolates concrete duties, validates source references, and eliminates guesswork.
          </p>
        </div>

        {/* 5 Cards Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 01: Paragraph-Level Source Citations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] text-[#1765F5] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">01</span>
                <h3 className="text-sm font-bold text-[#10264A] mt-0.5 leading-snug">
                  Paragraph-Level<br />Source Citations
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Every extracted checklist task links back to its exact paragraph identifier (P2, P3). Administrators can verify source text immediately without searching original circulars.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[10px] space-y-1">
              <div className="font-semibold text-slate-800">Task: Submit completed renewal form</div>
              <div className="font-mono text-[#1765F5]">Source: P2, P3</div>
              <p className="text-slate-500 italic pt-0.5 border-t border-slate-200/60 leading-tight">
                &quot;Both documents must be submitted to Room 12 of the Registrar&apos;s Office by 15 November 2026.&quot; (P3)
              </p>
            </div>
          </div>

          {/* Card 02: Deadlines & Conditional Rules */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#159B62] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">02</span>
                <h3 className="text-sm font-bold text-[#10264A] mt-0.5 leading-snug">
                  Deadlines &<br />Conditional Rules
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Extracts strict dates alongside conditional exemptions—such as waivers for final-year students or extended borrowing periods for postgraduates.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[10px] space-y-1">
              <div className="font-semibold text-slate-800">Deadline: 15 Nov 2026</div>
              <div className="text-emerald-700 font-medium">Condition: Final-year exempt</div>
            </div>
          </div>

          {/* Card 03: Omission & Uncertainty Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">03</span>
                <h3 className="text-sm font-bold text-[#10264A] mt-0.5 leading-snug">
                  Omission &<br />Uncertainty Alerts
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Never invents unstated policies. Flags ambiguous owners for human clarification and itemizes missing fee amounts or operating hours in an Absent Information panel.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[10px] space-y-1">
              <div className="font-medium text-purple-800">Clarification: Ambiguous owner flagged for review</div>
            </div>
          </div>

          {/* Card 04: Human Review & Approval Gate */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">04</span>
                <h3 className="text-sm font-bold text-[#10264A] mt-0.5 leading-snug">
                  Human Review &<br />Approval Gate
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Edit descriptions, adjust assignees, and approve final tasks before anything is saved to the system.
              </p>
            </div>

            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[10px] text-slate-500">
              Admin confirmation required prior to checklist persistence
            </div>
          </div>

          {/* Card 05: Saved Notices & History */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400">05</span>
                <h3 className="text-sm font-bold text-[#10264A] mt-0.5 leading-snug">
                  Saved Notices &<br />History
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Reopen saved notices anytime from the sidebar to inspect original paragraphs and check progress against approved deadlines.
              </p>
            </div>

            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[10px] text-slate-500">
              Instant retrieval with full original context preserved
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
