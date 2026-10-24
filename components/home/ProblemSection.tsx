import Image from "next/image";
import Link from "next/link";

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: The Problem Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF3FF] text-[#1765F5] border border-blue-200/60">
                The Problem
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight leading-tight">
                From Dense Circulars to<br />Clear Execution
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Administrative notices bury deadlines and conditions inside lengthy text. Important obligations get overlooked, and ambiguous rules create delays.
              </p>
            </div>

            {/* Two Features */}
            <div className="space-y-4 pt-2">
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] flex items-center justify-center text-[#1765F5] flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Explicit Omission Detection
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Surfaces unstated owners, missing fee amounts, and omitted deadlines before saving.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EBF3FF] flex items-center justify-center text-[#1765F5] flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Deterministic Citations
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Binds every task to its exact source paragraph (P1, P2…) for defensible auditing.
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Workspace CTA Button */}
            <div className="pt-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EBF3FF] text-[#1765F5] hover:bg-blue-100 font-semibold text-xs transition-colors"
              >
                <span>Launch workspace with demo notices</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Editorial Photo with Overlaid Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <Image
                src="/images/professional-reviewing-documents.jpg"
                alt="University administrative staff member reviewing official documents"
                width={1200}
                height={675}
                className="w-full h-auto object-cover"
                priority={false}
              />

              {/* Overlaid Badge from Reference: "Long notices. Clear actions." */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl p-4 sm:p-5 space-y-3 max-w-[220px]">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#1765F5] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 leading-tight">
                    Long notices.<br />Clear actions.
                  </h5>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="text-[#159B62] font-bold">✓</span>
                    <span>Extracted tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="text-[#159B62] font-bold">✓</span>
                    <span>Tracked deadlines</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="text-[#159B62] font-bold">✓</span>
                    <span>Cited sources</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="text-[#159B62] font-bold">✓</span>
                    <span>Ready for review</span>
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
