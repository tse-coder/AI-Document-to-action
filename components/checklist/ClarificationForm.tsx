// Owner: Member 2 (Frontend Engineer)
// Renders clarification questions and collects answers

"use client";

import type { Question } from "@/lib/types";

interface Props {
  questions: Question[];
  onSubmit: (answers: { question_id: string; answer: string; not_stated: boolean }[]) => void;
}

export default function ClarificationForm({ questions, onSubmit }: Props) {
  // TODO:
  // - For each question: show text, source refs, input field
  // - "Not stated" button (only if allow_not_stated is true)
  // - "Submit Answers" button → calls onSubmit with all answers
  // - Validate: owner answers are 1-200 chars, deadline answers are YYYY-MM-DD

  return (
    <div className="p-4 bg-amber-50 rounded border border-amber-200">
      <h3 className="font-semibold mb-2">Clarification Needed</h3>
      {questions.map((q) => (
        <div key={q.question_id} className="mb-3">
          <p className="text-sm">{q.text}</p>
          <input type="text" className="mt-1 border rounded px-2 py-1 text-sm w-full" />
        </div>
      ))}
      <button className="mt-2 px-4 py-2 bg-amber-600 text-white rounded text-sm">
        Submit Answers
      </button>
    </div>
  );
}
