// Owner: Member 2 (Frontend Engineer)
// Reusable error banner (FE-05)

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
    ? "bg-amber-50 border-amber-200 text-amber-900"
    : "bg-red-50 border-red-200 text-red-900";

  const buttonClasses = isWarning
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  return (
    <div
      role="alert"
      className={`p-4 border rounded-md ${containerClasses} my-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-base select-none" aria-hidden="true">
          {isWarning ? "⚠️" : "🚫"}
        </span>
        <div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          {attempt !== undefined && (
            <p className="text-xs mt-1 text-gray-500">
              Attempt {attempt} of {maxAttempts}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClasses}`}
        >
          Retry
        </button>
      )}
    </div>
  );
}
