import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#1765F5] via-[#1258E2] to-[#0B46BD] text-white p-8 sm:p-12 lg:p-14 shadow-xl overflow-hidden">
          {/* Subtle ghost document illustration on the right */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-44 h-60 bg-white rounded-2xl shadow-2xl rotate-6" />
            <div className="absolute right-20 top-1/2 -translate-y-1/2 w-44 h-60 bg-white rounded-2xl shadow-xl -rotate-6" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading, Subtitle, Buttons */}
            <div className="lg:col-span-8 space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight text-balance">
                Turn Dense Notices into Actionable Checklists Today
              </h2>
              <p className="text-base sm:text-lg text-blue-100 max-w-xl leading-relaxed text-pretty font-normal">
                Upload or paste any administrative directive, extract verified requirements with exact paragraph citations, and approve your auditable checklist in seconds.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/app"
                  className="px-6 py-3.5 bg-white text-[#1765F5] hover:bg-blue-50 font-semibold text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2 group"
                >
                  <span>Start New Analysis</span>
                  <span className="text-base transition-transform group-hover:translate-x-0.5">→</span>
                </Link>

                <Link
                  href="/app?doc=N1"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-xl border border-white/30 backdrop-blur-sm transition-colors inline-flex items-center"
                >
                  Explore Sample Notice
                </Link>
              </div>
            </div>

            {/* Right Column: 4 Key Value Checkmarks */}
            <div className="lg:col-span-4 space-y-3.5 lg:border-l lg:border-white/20 lg:pl-8">
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Zero setup or configuration required</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Deterministic paragraph indexing (P1, P2…)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Guaranteed paragraph source citations</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Mandatory human sign-off before save</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
