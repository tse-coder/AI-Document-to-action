import Image from "next/image";

export default function CoreFeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#F8FAFF] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex justify-center mb-3.5">
            <span className="inline-flex items-center px-3 py-1 rounded-sm text-[11px] font-bold tracking-wider text-[#1765F5] bg-blue-50 border border-blue-200/60 uppercase">
              Core Capabilities
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight text-balance">
            Built for <span className="text-[#1765F5]">Administrative</span> Rigor
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed text-pretty font-normal">
            Isolates concrete obligations, validates source references, and eliminates operational guesswork.
          </p>
        </div>

        {/* 5 Cards Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4">
          {/* Card 01: Source Citations */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Source Citations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                Anchors every generated task to exact source paragraphs.
              </p>
            </div>

            {/* Standardized mini preview box */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-sm min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-[#1765F5] border border-blue-200/80 rounded-[2px] px-2 py-0.5 font-mono font-semibold text-[10px]">
                  Source: P2, P3
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate pt-1">
                Submit renewal form
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Binds to Room 12 clause
              </div>
            </div>
          </div>

          {/* Card 02: Conditional Deadlines */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Conditional Deadlines
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                Captures critical submission dates and conditional policy exemptions.
              </p>
            </div>

            {/* Standardized mini preview box */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-sm min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-[#1765F5] border border-blue-200/80 rounded-[2px] px-2 py-0.5 font-mono font-semibold text-[10px]">
                  Due: 15 Nov 2026
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate pt-1">
                Final-Year Exempt
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Rule branch captured
              </div>
            </div>
          </div>

          {/* Card 03: Omission Alerts */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Omission Alerts
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                Surfaces missing owners and unstated requirements for review.
              </p>
            </div>

            {/* Standardized mini preview box */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-sm min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-[#1765F5] border border-blue-200/80 rounded-[2px] px-2 py-0.5 font-mono font-semibold text-[10px]">
                  Status: Clarify
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate pt-1">
                Unstated Signatory
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Prompts user before save
              </div>
            </div>
          </div>

          {/* Card 04: Approval Gate */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Approval Gate
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                Enforces manual operator verification before saving any checklist.
              </p>
            </div>

            {/* Standardized mini preview box */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-sm min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-[#1765F5] border border-blue-200/80 rounded-[2px] px-2 py-0.5 font-mono font-semibold text-[10px]">
                  Gate: Verification
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate pt-1">
                Operator Sign-Off
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Prevents unverified save
              </div>
            </div>
          </div>

          {/* Card 05: Saved History */}
          <div className="bg-white rounded-sm border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10264A] leading-snug">
                Saved History
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                Preserves complete original documents with ongoing audit trails.
              </p>
            </div>

            {/* Standardized mini preview box */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-sm min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="inline-block bg-blue-50 text-[#1765F5] border border-blue-200/80 rounded-[2px] px-2 py-0.5 font-mono font-semibold text-[10px]">
                  State: Persistent
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate pt-1">
                Full Notice Memory
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Preserves original context
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Visual Mockup */}
        <div className="mt-12 sm:mt-16 w-full rounded-sm overflow-hidden border border-slate-200/80 shadow-sm bg-white">
          <Image
            src="/images/core-features-workflow.png"
            alt="From notice to actionable checklist verified workflow"
            width={1024}
            height={342}
            className="w-full h-auto object-cover block"
            priority
          />
        </div>
      </div>
    </section>
  );
}
