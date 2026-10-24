// Owner: Member 2 (Frontend Engineer)
// Text area for pasting notice text + optional title + Analyze button

"use client";

export default function TextInput() {
  // TODO:
  // - Text area (20-6000 chars) with char counter
  // - Optional title input (1-80 chars)
  // - "Analyze" button → calls createRun()
  // - Loading state while agent is running
  // - Preserve input on error

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Paste Your Notice</h2>
      <textarea
        className="w-full h-48 border rounded p-3 text-sm"
        placeholder="Paste your notice here..."
      />
      <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
        Analyze
      </button>
    </div>
  );
}
