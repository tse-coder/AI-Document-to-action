import Image from "next/image";

export default function TrustSection() {
  const pillars = [
    {
      title: "Source Grounded",
      description: "Binds tasks to exact numbered paragraphs.",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Omission Flags",
      description: "Surfaces unstated owners and missing dates.",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Resilient Execution",
      description: "Retains document state across network retries.",
      icon: (
        <svg className="w-4 h-4 text-[#1765F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      title: "Tool Observability",
      description: "Provides inspection logs for every model step.",
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight leading-tight text-balance">
                Designed for Accuracy &amp;<br />Full Traceability
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl text-pretty font-normal">
                In academic institutions and organizational governance, tasks carry real consequences. We engineer verification directly into the model&apos;s extraction loop.
              </p>
            </div>

            {/* 4 Trust Badges in 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1765F5] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {pillar.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 3D Checklist Illustration */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-[460/403] flex items-center justify-center">
              <Image
                src="/images/accuracy-checklist-3d-transparent.png"
                alt="Verified 3D checklist with completion checkmarks and pen"
                fill
                className="object-contain drop-shadow-xl"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
