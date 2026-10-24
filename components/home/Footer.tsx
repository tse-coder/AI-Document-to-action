import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0B1728] text-slate-400 text-xs border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-white group">
              <div className="w-7 h-7 rounded-lg bg-[#1765F5] flex items-center justify-center text-white">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                Doc2Action
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm font-normal">
              Transforming administrative circulars and institutional notices into actionable, source-cited task checklists with full paragraph traceability.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-bold text-slate-300 text-[11px] tracking-wider uppercase mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Start New Analysis
                </Link>
              </li>
              <li>
                <Link href="/saved-notices" className="hover:text-white transition-colors">
                  Saved Notices (N1 &amp; N2)
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-white transition-colors">
                  Interactive Demonstration
                </Link>
              </li>
            </ul>
          </div>

          {/* How It Works links */}
          <div>
            <h4 className="font-bold text-slate-300 text-[11px] tracking-wider uppercase mb-4">
              Architecture &amp; Flow
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-white transition-colors">
                  Methodology &amp; Architecture
                </Link>
              </li>
              <li>
                <Link href="/methodology#indexing" className="hover:text-white transition-colors">
                  Paragraph Indexing (P1–P5)
                </Link>
              </li>
              <li>
                <Link href="/methodology#extraction" className="hover:text-white transition-colors">
                  Task Extraction Pipeline
                </Link>
              </li>
              <li>
                <Link href="/methodology#omissions" className="hover:text-white transition-colors">
                  Omission &amp; Absence Handling
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Team */}
          <div>
            <h4 className="font-bold text-slate-300 text-[11px] tracking-wider uppercase mb-4">
              Team 10 — Project
            </h4>
            <p className="text-slate-400 leading-relaxed text-xs mb-3 font-normal">
              Powered by Next.js &amp; Gemini 2.5 Flash
            </p>
            <Link
              href="/team"
              className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Meet the Team &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-4">
          <p>© 2026 Doc2Action. Built for academic &amp; administrative productivity.</p>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="hover:text-white transition-colors">
              Core Features
            </Link>
            <Link href="/#problem" className="hover:text-white transition-colors">
              The Problem
            </Link>
            <Link href="/app" className="hover:text-white transition-colors">
              Workspace
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
