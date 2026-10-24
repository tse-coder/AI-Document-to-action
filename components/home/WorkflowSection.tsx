import Link from "next/link";

export default function WorkflowSection() {
  const steps = [
    {
      number: "01",
      title: "Input Notice",
      description:
        "Paste any raw administrative text. The system deterministically indexes it into numbered paragraphs (P1, P2…) for provenance.",
      icon: (
        <svg
          className="w-5 h-5 text-[#1765F5]"
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
      ),
    },
    {
      number: "02",
      title: "Extract Requirements",
      description:
        "AI scans each paragraph to isolate concrete duties, submission deadlines, designated owners, and conditional rules.",
      icon: (
        <svg
          className="w-5 h-5 text-[#1765F5]"
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
      ),
    },
    {
      number: "03",
      title: "Verify & Clarify",
      description:
        "Inspect exact source citations directly and resolve guided clarification prompts for ambiguous clauses before saving.",
      icon: (
        <svg
          className="w-5 h-5 text-[#1765F5]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Approve & Persist",
      description:
        "Edit task descriptions inline and approve to store a verified, auditable checklist in institutional memory.",
      icon: (
        <svg
          className="w-5 h-5 text-[#1765F5]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#FAFCFF] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 sm:mb-16">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#10264A] tracking-tight text-balance">
              How Doc2Action Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed text-pretty">
              A transparent, four-step pipeline transforming dense administrative directives into defensible, verified checklists.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1765F5] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs sm:text-[13px] transition-colors shadow-xs"
            >
              <span>Try workspace with demo notices</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* 4 Steps Row with Connecting Arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative flex flex-col space-y-3.5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-colors"
            >
              {/* Icon Circle & Step Number */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center">
                  {step.icon}
                </div>

                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {step.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 pt-1">
                <h3 className="text-base font-bold text-[#10264A] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
