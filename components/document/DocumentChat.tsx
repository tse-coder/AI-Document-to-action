// Owner: Member 2 (Frontend Engineer)
// Center panel interactive AI Chat with document assistant (FE Chat Feature)
// Allows asking questions, querying requirements, and clicking citations

"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage, type ChatMessage } from "@/lib/api-client";

interface Props {
  docId: string;
  docTitle?: string;
  onCitationClick?: (paragraphId: string) => void;
}

const SUGGESTIONS = [
  "What are the mandatory deadlines?",
  "Who is responsible for submitting?",
  "Are there any fees or special conditions?",
  "Summarize key action items",
];

export default function DocumentChat({
  docId,
  docTitle,
  onCitationClick,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `Hello! I'm your AI Document Assistant. Ask me any question about "${docTitle || "this notice"}" — including deadlines, required documents, who is responsible, exceptions, or fees.`,
      cited_paragraphs: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage(docId, query, messages);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        cited_paragraphs: res.cited_paragraphs,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not get an answer from the assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const formatSourceChip = (ref: string) => {
    const match = ref.match(/P\d+$/i);
    return match ? match[0] : ref;
  };

  return (
    <div className="flex flex-col h-[520px] sm:h-[580px] bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      {/* Chat Subtitle Header */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-bold text-gray-800">
            Notice Assistant Active
          </span>
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            · Powered by Gemini with cited sources
          </span>
        </div>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
          {docId}
        </span>
      </div>

      {/* Message List */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3.5"
        role="log"
        aria-live="polite"
        aria-label="Conversation with document assistant"
      >
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-gray-400 font-medium">
                <span>{isUser ? "You" : "Document Assistant"}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-gray-900 border border-gray-200 rounded-tl-none"
                }`}
              >
                {m.content}

                {/* Interactive Cited Sources Chips */}
                {m.cited_paragraphs && m.cited_paragraphs.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">
                      Cited Sources:
                    </span>
                    {m.cited_paragraphs.map((pId) => (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => onCitationClick?.(pId)}
                        title={`View paragraph ${pId} in document`}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {formatSourceChip(pId)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="italic">Assistant is reading the document and thinking…</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-3 py-2 bg-white/70 border-t border-gray-200 overflow-x-auto">
        <div className="flex items-center gap-1.5 w-max">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Try:
          </span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => void handleSend(suggestion)}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
      >
        <label htmlFor="chat-input-field" className="sr-only">
          Ask question about notice
        </label>
        <input
          id="chat-input-field"
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this notice (e.g. Is there a fee?)..."
          className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 min-h-[40px]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          <span>Send</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
