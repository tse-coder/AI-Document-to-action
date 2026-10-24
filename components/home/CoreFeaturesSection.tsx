import Image from "next/image";

export default function CoreFeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#F8FAFF] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider text-[#1765F5] bg-[#EBF3FF] border border-blue-200/60 uppercase">
              Core Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight">
            Built for <span className="text-[#1765F5]">Administrative</span> Rigor
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5">
            Isolates concrete duties, validates source references, and eliminates guesswork.
          </p>
        </div>

        {/* 5 Cards Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4">
          {/* Card 01: Paragraph-Level Source Citations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-[#1765F5]">01</span>
              </div>
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Paragraph-Level<br />Source Citations
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Each task links to its exact paragraph (P2, P3).
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-3 bg-[#F0F6FF] border border-blue-100/80 rounded-xl text-[11px] space-y-1.5">
              <div className="text-[11px] font-medium text-slate-800">
                Task: Submit completed renewal form
              </div>
              <div>
                <span className="inline-block bg-white text-[#1765F5] border border-blue-200 rounded-full px-2 py-0.5 font-semibold text-[10px]">
                  Source: P2, P3
                </span>
              </div>
              <p className="text-slate-500 italic text-[10px] leading-relaxed pt-1">
                &ldquo;Both documents must be submitted to Room 12 of the Registrar&apos;s Office by 15 November 2026.&rdquo; (P3)
              </p>
            </div>
          </div>

          {/* Card 02: Deadlines & Conditional Rules */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-[#1765F5]">02</span>
              </div>
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Deadlines &<br />Conditional Rules
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Extracts strict dates and conditional exemptions.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-3 bg-[#F0F6FF] border border-blue-100/80 rounded-xl text-[11px] space-y-2.5">
              <div>
                <div className="text-[10px] text-slate-500">Deadline</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">15 Nov 2026</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Condition</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">Final-year exempt</div>
              </div>
            </div>
          </div>

          {/* Card 03: Omission & Uncertainty Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-[#1765F5]">03</span>
              </div>
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Omission &<br />Uncertainty Alerts
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Flags missing details and asks for human review.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-3 bg-[#FFF5F5] border border-red-100/90 rounded-xl text-[11px] space-y-1">
              <div className="text-xs font-bold text-rose-900">
                Clarification required
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                Ambiguous owner flagged for review
              </div>
            </div>
          </div>

          {/* Card 04: Human Review & Approval Gate */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-[#1765F5]">04</span>
              </div>
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Human Review &<br />Approval Gate
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Edit, assign, and approve before saving.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-3 bg-[#F0F6FF] border border-blue-100/80 rounded-xl text-[11px] space-y-1">
              <div className="text-xs font-bold text-[#1765F5]">
                Admin confirmation
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                required prior to checklist persistence
              </div>
            </div>
          </div>

          {/* Card 05: Saved Notices & History */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="space-y-2.5">
              <div>
                <span className="text-xs font-bold text-[#1765F5]">05</span>
              </div>
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Saved Notices &<br />History
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reopen anytime to view original content and progress.
              </p>
            </div>

            {/* Mini preview box */}
            <div className="p-3 bg-[#F0F6FF] border border-blue-100/80 rounded-xl text-[11px] flex items-center min-h-[58px]">
              <div className="text-[11px] font-medium text-[#1765F5] leading-snug">
                Instant retrieval with full original context preserved
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Visual Mockup */}
        <div className="mt-12 sm:mt-16 w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
          <Image
            src="/images/core-features-visual.png"
            alt="From notice to actionable checklist verified workflow"
            width={1024}
            height={274}
            className="w-full h-auto object-cover block"
            priority
          />
        </div>
      </div>
    </section>
  );
}
