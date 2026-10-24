// Owner: Member 2 (Frontend Engineer)
// Main page — 3-panel responsive layout shell (FE-02)

"use client";

import { useState } from "react";
import SavedNoticesList from "@/components/sidebar/SavedNoticesList";
import TextInput from "@/components/document/TextInput";

type ActiveTab = "notices" | "document" | "checklist";

export default function Home() {
  // Mobile active tab state for switching panels on small screens
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900">
      {/* Mobile Tab Bar (visible on < md screens) */}
      <nav
        aria-label="Mobile panel switcher"
        className="md:hidden flex border-b bg-gray-100 flex-shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notices"}
          onClick={() => setActiveTab("notices")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            activeTab === "notices"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Notices
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "document"}
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            activeTab === "document"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Document
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "checklist"}
          onClick={() => setActiveTab("checklist")}
          className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
            activeTab === "checklist"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Checklist
        </button>
      </nav>

      {/* 3-Panel Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Saved Notices */}
        <aside
          aria-label="Saved Notices Sidebar"
          className={`w-full md:w-64 lg:w-72 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto ${
            activeTab === "notices" ? "block" : "hidden md:block"
          }`}
        >
          <SavedNoticesList />
        </aside>

        {/* Center Panel — Document Input / Viewing */}
        <main
          aria-label="Notice Input and Document Viewer"
          className={`flex-1 flex flex-col bg-white overflow-y-auto ${
            activeTab === "document" ? "flex" : "hidden md:flex"
          }`}
        >
          <TextInput />
        </main>

        {/* Right Panel — Draft checklist / Approval / Saved */}
        <aside
          aria-label="Checklist and Approval Panel"
          className={`w-full md:w-80 lg:w-96 bg-gray-50 border-l border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${
            activeTab === "checklist" ? "block" : "hidden md:block"
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
              Idle
            </span>
          </div>
          <div className="p-4 rounded-md border border-dashed border-gray-300 bg-white text-center">
            <p className="text-sm text-gray-500">
              Paste an administrative notice in the center panel and click{" "}
              <span className="font-medium text-gray-700">&quot;Analyze&quot;</span>{" "}
              to generate a structured checklist.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
