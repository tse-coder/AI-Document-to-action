// Owner: Member 2 (Frontend Engineer)
// Reusable error banner with friendly messages and retry attempts (FE-05, FE-18)

"use client";

interface ErrorBannerProps {
  message: string;
  attempt?: number;
  maxAttempts?: number;
  severity?: "error" | "warning";
  onRetry?: () => void;
}

export default function ErrorBanner({
  message,
  attempt,
  maxAttempts = 3,
  severity = "error",
  onRetry,
}: ErrorBannerProps) {
  const isWarning = severity === "warning";
  const containerClasses = isWarning
    ? "bg-amber-50 border-amber-300 text-amber-950"
    : "bg-red-50 border-red-300 text-red-950";

  const buttonClasses = isWarning
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  // Sanitize message: never display stack traces or raw unhandled errors (FE-18)
  const sanitizeMessage = (msg: string) => {
    if (!msg) return "An unexpected error occurred. Please try again.";
    if (msg.includes("at ") || msg.includes("Error:") || msg.includes("stack:")) {
      const firstLine = msg.split("\n")[0].replace(/^Error:\s*/i, "").trim();
      return firstLine.length > 0
        ? firstLine
        : "An unexpected error occurred. Please try again.";
    }
    return msg;
  };

  const friendlyMessage = sanitizeMessage(message);
  const isLimitReached = attempt !== undefined && attempt >= maxAttempts;

  return (
    <div
      role="alert"
      className={`p-4 border rounded-lg ${containerClasses} my-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg select-none leading-none mt-0.5" aria-hidden="true">
          {isWarning ? "⚠️" : "🚫"}
        </span>
        <div className="space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-red-900/80">
            {isWarning ? "Warning" : "Error"}
          </p>
          <p className="text-sm font-semibold leading-snug">{friendlyMessage}</p>
          {attempt !== undefined && (
            <p className="text-xs text-gray-600 font-medium pt-0.5">
              {isLimitReached
                ? `Maximum ${maxAttempts} retry attempts reached.`
                : `Attempt ${attempt} of ${maxAttempts}`}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isLimitReached}
          className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm transition-all duration-150 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-red-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${buttonClasses}`}
        >
          {isLimitReached ? "Limit Reached" : "Retry"}
        </button>
      )}
    </div>
  );
}
