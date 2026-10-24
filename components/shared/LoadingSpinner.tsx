// Owner: Member 2 (Frontend Engineer)
// Reusable loading spinner (FE-05)

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  label = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-3",
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-gray-600"
    >
      <div
        className={`${sizeClasses} border-gray-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0`}
      />
      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}
