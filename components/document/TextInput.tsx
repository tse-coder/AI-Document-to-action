// Owner: Member 2 (Frontend Engineer)
// Text area for pasting notice text + optional title + Analyze button (FE-08)

"use client";

import { useState } from "react";
import { SparklesIcon, AlertCircleIcon } from "@/components/icons";

interface Props {
  initialTitle?: string;
  initialText?: string;
  loading?: boolean;
  onAnalyze?: (data: { title: string; text: string }) => void;
}

const MIN_LENGTH = 20;
const MAX_LENGTH = 6000;
const MAX_TITLE_LENGTH = 80;

export default function TextInput({
  initialTitle = "",
  initialText = "",
  loading = false,
  onAnalyze,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [validationError, setValidationError] = useState<string | null>(null);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_LENGTH;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError("Please paste a notice before analyzing.");
      return;
    }

    if (trimmed.length < MIN_LENGTH) {
      setValidationError(
        `Notice is too short. Please provide at least ${MIN_LENGTH} characters.`
      );
      return;
    }

    if (charCount > MAX_LENGTH) {
      setValidationError(
        `Notice exceeds the maximum length of ${MAX_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    setValidationError(null);
    onAnalyze?.({
      title: title.trim(),
      text: trimmed,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Paste Your Notice</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Paste an administrative announcement, policy memo, or procedural notice to turn it into an actionable checklist, or select a saved notice from the sidebar.
        </p>
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900">
        <SparklesIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Get started:</strong> Paste raw notice text below and click <em>Analyze Notice</em>, or select an existing document from the sidebar to inspect its source paragraphs and saved checklist.
        </span>
      </div>

      {/* Optional Title Field */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="notice-title"
            className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
          >
            Title <span className="text-gray-400 font-normal lowercase">(optional)</span>
          </label>
          <span className="text-xs text-gray-400">
            {title.length}/{MAX_TITLE_LENGTH}
          </span>
        </div>
        <input
          id="notice-title"
          type="text"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          disabled={loading}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Student ID Card Renewal Notice"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
        />
      </div>

      {/* Notice Text Area */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="notice-text"
            className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
          >
            Notice Text <span className="text-red-500">*</span>
          </label>
          <span
            className={`text-xs font-mono font-medium ${
              isOverLimit
                ? "text-red-600 font-bold"
                : charCount >= MIN_LENGTH
                ? "text-gray-500"
                : "text-amber-600"
            }`}
          >
            {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()} chars
          </span>
        </div>
        <textarea
          id="notice-text"
          rows={10}
          value={text}
          disabled={loading}
          onChange={(e) => {
            setText(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Paste your notice here... (e.g. The Registrar's Office will renew student ID cards for the 2026/27 academic year...)"
          className={`w-full p-3 text-sm border rounded-md shadow-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors ${
            validationError
              ? "border-red-400 ring-1 ring-red-400"
              : "border-gray-300"
          }`}
        />
        {validationError && (
          <p
            id="notice-validation-error"
            role="alert"
            className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
          >
            <AlertCircleIcon className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
            <span>{validationError}</span>
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Paragraphs will be automatically split and numbered for traceability.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center min-h-[40px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-md shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-white" />
              <span>Analyze Notice</span>
            </div>
          )}
        </button>
      </div>
    </form>
  );
}
