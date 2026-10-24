import Image from "next/image";

export default function TrustSection() {
  const pillars = [
    {
      title: "Grounded in Source Text",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Transparent Uncertainty",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Resilient Error Recovery",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      title: "Observability & Tool Logs",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <section id="traceability" className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight leading-tight">
                Designed for Accuracy &<br />Traceability
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                In university administration and departmental operations, accountability matters. We design AI workflows that augment human judgment with clear verification.
              </p>
            </div>

            {/* 4 Trust Badges in 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center flex-shrink-0">
                    {pillar.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {pillar.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Campus Photo with Overlaid Badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <Image
                src="/images/university-campus-building.jpg"
                alt="University administration campus building"
                width={1200}
                height={675}
                className="w-full h-auto object-cover"
                priority={false}
              />

              {/* Overlaid Badge from Reference: "Reviewable and verifiable before every save" */}
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-lg px-4 py-2.5 flex items-center gap-3 max-w-[280px]">
                <div className="w-7 h-7 rounded-lg bg-[#EBF3FF] text-[#1765F5] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  Reviewable and verifiable before every save
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
