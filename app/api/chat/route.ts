// Owner: Member 4 (Backend Engineer) & Member 2 (Frontend Engineer)
// POST /api/chat — Chat with notice assistant with paragraph citations

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { errorResponse, parseJson, ApiRequestError } from "../../../lib/api-response";
import { requireApiAuth } from "../../../lib/require-api-auth";
import { getDocumentWithParagraphs, readChecklist } from "../../../lib/db/queries";

interface ChatChecklistTask {
  task_id?: string;
  client_id?: string;
  description?: string;
  owner?: string | null;
  deadline_date?: string | null;
  deadline_text?: string | null;
  condition?: string | null;
  source_refs?: string[];
}

export async function POST(request: NextRequest) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const raw = await parseJson(request);
    const body = raw as {
      doc_id?: string;
      message?: string;
      history?: { role: "user" | "assistant"; content: string }[];
      checklist_tasks?: ChatChecklistTask[];
    };

    if (!body.doc_id || typeof body.doc_id !== "string") {
      throw new ApiRequestError("INVALID_REQUEST", "doc_id is required.", 400);
    }
    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      throw new ApiRequestError("INVALID_REQUEST", "message is required.", 400);
    }

    const docResult = await getDocumentWithParagraphs(body.doc_id.trim());
    if (!docResult) {
      throw new ApiRequestError("DOCUMENT_NOT_FOUND", "Document not found.", 404);
    }

    // Retrieve current checklist tasks from body or database
    let checklistContext = "No checklist tasks currently recorded for this notice.";
    let tasks: ChatChecklistTask[] | undefined = body.checklist_tasks;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      const dbChecklist = await readChecklist(body.doc_id.trim());
      if (dbChecklist.tasks && dbChecklist.tasks.length > 0) {
        tasks = dbChecklist.tasks;
      }
    }

    if (tasks && tasks.length > 0) {
      checklistContext = tasks
        .map((t: ChatChecklistTask, idx: number) => {
          const id = t.task_id || t.client_id || `Task-${idx + 1}`;
          const lines = [`• [${id}] ${t.description || ""}`];
          lines.push(`  Owner: ${t.owner || "[Unassigned / Not stated]"}`);
          lines.push(`  Deadline: ${t.deadline_date || t.deadline_text || "[No deadline specified]"}`);
          if (t.condition) lines.push(`  Condition/Exemption: ${t.condition}`);
          if (t.source_refs && t.source_refs.length > 0) lines.push(`  Sources: ${t.source_refs.join(", ")}`);
          return lines.join("\n");
        })
        .join("\n\n");
    }

    const paragraphsText = docResult.paragraphs
      .map((p) => `[${p.paragraph_id}] (Paragraph ${p.position}): ${p.text}`)
      .join("\n\n");

    const systemPrompt = `You are the AI Document Assistant for Project 10. The user is reading the administrative notice titled "${docResult.doc.title}".

Here are the numbered paragraphs of the notice:
${paragraphsText}

Here is the current Checklist for this notice:
${checklistContext}

Guidelines:
1. Answer the user's questions clearly, accurately, and concisely based strictly on the text and the current checklist.
2. ALWAYS cite the source paragraphs in square brackets, for example [${docResult.paragraphs[0]?.paragraph_id || "P1"}] or [P2], whenever referencing requirements, deadlines, fees, owners, or exceptions.
3. If the user asks about the checklist, its tasks, any issues, missing items, deadlines, owners, or conditions, evaluate the current Checklist above against the document paragraphs and provide a clear, helpful critique.
4. If the notice does not contain the information, state clearly that it is not mentioned in the notice.
5. Keep responses well-structured and helpful for turning administrative text into action items.`;

    const history = Array.isArray(body.history) ? body.history : [];
    const conversation = [
      ...history.slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: String(h.content),
      })),
      { role: "user" as const, content: body.message.trim() },
    ];

    let answer = "";
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && apiKey !== "your-gemini-api-key-here") {
      try {
        const response = await generateText({
          model: google(process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"),
          system: systemPrompt,
          messages: conversation,
        });
        answer = response.text;
      } catch {
        // Fall back to rule-based paragraph search if model call encounters quota/network issues
        answer = generateFallbackAnswer(docResult.paragraphs, body.message, docResult.doc.title);
      }
    } else {
      answer = generateFallbackAnswer(docResult.paragraphs, body.message, docResult.doc.title);
    }

    // Extract cited paragraph IDs from answer
    const rawMatches = answer.match(/\[([A-Za-z0-9_-]+P\d+|P\d+)\]/g) || [];
    const citedParas = Array.from(
      new Set(rawMatches.map((m) => m.replace(/[\[\]]/g, "")))
    );

    return NextResponse.json({
      ok: true,
      data: {
        answer,
        cited_paragraphs: citedParas,
      },
    });
  } catch (error) {
    return errorResponse(error, "Could not process chat message.");
  }
}

function generateFallbackAnswer(
  paragraphs: { paragraph_id: string; position: number; text: string }[],
  userMessage: string,
  title: string
): string {
  const lower = userMessage.toLowerCase();
  const searchTerms = lower
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["what", "when", "where", "who", "which", "how", "does", "this", "that"].includes(w));

  const matching = paragraphs.filter((p) =>
    searchTerms.some((term) => p.text.toLowerCase().includes(term))
  );

  if (matching.length > 0) {
    const citations = matching.map((m) => `[${m.paragraph_id}]`).join(", ");
    return `Based on notice "${title}", relevant details were found in ${citations}:\n\n` +
      matching.map((m) => `• [${m.paragraph_id}] ${m.text}`).join("\n\n");
  }

  const firstPara = paragraphs[0];
  const ref = firstPara ? `[${firstPara.paragraph_id}]` : "";
  return `Regarding "${title}": The notice mentions ${ref} "${firstPara?.text.slice(0, 120)}...". If you need specific deadline or requirement information, ask about deadlines, owners, or procedures!`;
}
