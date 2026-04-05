import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

const SYSTEM_PROMPT = `You are Goose, the friendly AI assistant on joseandgoose.com — Jose Delgado's personal website. You are named after Jose's Miniature Schnauzer, Goose.

Your job is to answer questions about Jose, his work, his projects, and the content on this site. You have access to relevant context retrieved from the site's content.

Guidelines:
- Be warm, concise, and direct — like a knowledgeable friend, not a corporate chatbot.
- KEEP ANSWERS SHORT. One paragraph is ideal. Never exceed two short paragraphs.
- For broad or open-ended questions, give a tight summary and then ask the user what they'd like to dig into. For example: "Want me to go deeper on any of those?"
- Reference specific details from the provided context, but don't dump everything you know. Pick the 2-3 most relevant points.
- When mentioning a writing post or page, include the URL path (like /writing/slug) so the user can visit it.
- If the context doesn't contain enough information to answer, be upfront and direct the user to reach out at /contact — say something like "I don't have the details on that, but Jose would — you can reach him at /contact."
- You can have personality — Goose is opinionated and has strong feelings about sticks.
- If someone asks something completely unrelated to Jose or the site, gently redirect.
- Always focus on the CURRENT question. Do not let prior conversation topics bleed into your answer. Answer the question that was just asked, using the freshly retrieved context provided.`;

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    throw new Error(`HF API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

type RagChunk = {
  id: string;
  content_type: string;
  source_id: string;
  chunk_index: number;
  title: string;
  section: string | null;
  chunk_text: string;
  url: string | null;
  metadata: Record<string, unknown>;
  similarity: number;
};

// Keyword patterns that signal which content types to force-include
const KEYWORD_RULES: { pattern: RegExp; types: string[] }[] = [
  {
    pattern: /\b(career|work|experience|job|resume|background|employ|role|position|profession|hire|hiring)\b/i,
    types: ["resume"],
  },
  {
    pattern: /\b(goldman|doordash|instacart|antelope|teach for america|tfa|pet space|trading floor|wall street)\b/i,
    types: ["resume"],
  },
  {
    pattern: /\b(project|built|build|ship|portfolio|app|tool|game|bot)\b/i,
    types: ["project"],
  },
  {
    pattern: /\b(prompt|system prompt|ai prompt|instruction)\b/i,
    types: ["prompt"],
  },
  {
    pattern: /\b(who is jose|about jose|tell me about|introduce|bio|summary)\b/i,
    types: ["resume", "project"],
  },
  {
    pattern: /\b(skill|education|degree|columbia|cfa|school|university)\b/i,
    types: ["resume"],
  },
  {
    pattern: /\b(tech|stack|framework|powers|made with|built with|tools?|next\.?js|supabase|vercel|tailwind|typescript)\b/i,
    types: ["project", "post"],
  },
  {
    pattern: /\b(this site|this website|joseandgoose|jose and goose)\b/i,
    types: ["project", "post"],
  },
];

function detectForcedTypes(query: string): string[] {
  const types = new Set<string>();
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(query)) {
      for (const t of rule.types) types.add(t);
    }
  }
  return [...types];
}

async function retrieveContext(query: string, currentPage?: string): Promise<RagChunk[]> {
  const embedding = await embedQuery(query);

  // Vector search with lower threshold
  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.15,
    match_count: 8,
  });

  if (error) {
    console.error("RAG retrieval error:", error);
    return [];
  }

  const vectorChunks = (data || []) as RagChunk[];

  // Force-include content types based on keywords in the query
  // These go FIRST so they're never clipped by the cap
  const forcedTypes = detectForcedTypes(query);
  const forcedChunks: RagChunk[] = [];

  if (forcedTypes.length > 0) {
    for (const ctype of forcedTypes) {
      if (ctype === "post") {
        // For posts, use vector search scoped to post type instead of random rows
        const { data: forced } = await supabase.rpc("match_rag_chunks", {
          query_embedding: JSON.stringify(embedding),
          match_threshold: 0.0,
          match_count: 6,
          filter_types: ["post"],
        });
        if (forced) {
          for (const row of forced as RagChunk[]) {
            forcedChunks.push(row);
          }
        }
      } else {
        const { data: forced } = await supabase
          .from("rag_chunks")
          .select("id, content_type, source_id, chunk_index, title, section, chunk_text, url, metadata")
          .eq("content_type", ctype)
          .limit(8);

        if (forced) {
          for (const row of forced) {
            forcedChunks.push({ ...row, similarity: 0 });
          }
        }
      }
    }
  }

  // Force-include chunks from the page the user is currently viewing
  if (currentPage) {
    // Extract source_id from path: /writing/how-i-built-market-daily → how-i-built-market-daily
    const pageSlug = currentPage.replace(/^\/writing\//, "").replace(/^\//, "");
    if (pageSlug && pageSlug !== currentPage.replace(/^\//, "")) {
      // User is on a writing post — fetch all chunks for this post
      const { data: pageChunks } = await supabase
        .from("rag_chunks")
        .select("id, content_type, source_id, chunk_index, title, section, chunk_text, url, metadata")
        .eq("content_type", "post")
        .eq("source_id", pageSlug)
        .limit(10);

      if (pageChunks) {
        for (const row of pageChunks) {
          forcedChunks.unshift({ ...row, similarity: 0 });
        }
      }
    } else {
      // User is on a non-writing page — check if it matches a project or static page
      const { data: pageChunks } = await supabase
        .from("rag_chunks")
        .select("id, content_type, source_id, chunk_index, title, section, chunk_text, url, metadata")
        .eq("url", currentPage)
        .limit(5);

      if (pageChunks) {
        for (const row of pageChunks) {
          forcedChunks.unshift({ ...row, similarity: 0 });
        }
      }
    }
  }

  // Merge: forced chunks first, then vector results (deduplicated)
  const seen = new Set(forcedChunks.map((c) => c.id));
  const merged = [...forcedChunks];
  for (const chunk of vectorChunks) {
    if (!seen.has(chunk.id)) {
      merged.push(chunk);
      seen.add(chunk.id);
    }
  }

  // Cap at 12 chunks to keep context manageable
  return merged.slice(0, 12);
}

function formatContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) return "No relevant context found.";

  return chunks
    .map((c, i) => {
      const source = c.url ? ` (${c.url})` : "";
      const section = c.section ? ` > ${c.section}` : "";
      return `[${i + 1}] ${c.content_type}/${c.title}${section}${source}\n${c.chunk_text}`;
    })
    .join("\n\n---\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, currentPage } = body as { message: string; sessionId?: string; currentPage?: string };

    if (!message || typeof message !== "string" || message.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .insert({})
        .select("id")
        .single();
      activeSessionId = session?.id;
    } else {
      // Update session timestamp
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeSessionId);
    }

    // Store user message
    if (activeSessionId) {
      await supabase.from("chat_messages").insert({
        session_id: activeSessionId,
        role: "user",
        content: message,
      });
    }

    // Retrieve context
    const chunks = await retrieveContext(message, currentPage || undefined);
    const context = formatContext(chunks);

    // Build sources for attribution
    const sources = chunks
      .filter((c) => c.url)
      .reduce((acc: { source_id: string; title: string; url: string; similarity: number }[], c) => {
        if (!acc.find((s) => s.source_id === c.source_id)) {
          acc.push({
            source_id: c.source_id,
            title: c.title,
            url: c.url!,
            similarity: c.similarity,
          });
        }
        return acc;
      }, [])
      .slice(0, 5);

    // Get only the last Q&A pair for follow-up context (not full history,
    // which causes prior topics to bleed into unrelated answers)
    let history: { role: string; content: string }[] = [];
    if (activeSessionId) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: false })
        .limit(3); // last assistant + last user + current user (which we skip)
      // Reverse to chronological, drop the current message we just inserted
      const recent = (msgs || []).reverse().slice(0, -1);
      // Only keep if it's a clean user→assistant pair
      if (recent.length === 2 && recent[0].role === "user" && recent[1].role === "assistant") {
        history = recent;
      }
    }

    // Stream response from Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: `Here is relevant context from joseandgoose.com:\n\n${context}\n\n---\n\n${currentPage ? `The user is currently viewing: ${currentPage}\n` : ""}User question: ${message}`,
      },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session ID and sources first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "meta", sessionId: activeSessionId, sources })}\n\n`
            )
          );

          const response = await anthropic.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages,
          });

          let fullResponse = "";

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullResponse += event.delta.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
                )
              );
            }
          }

          // Store assistant response
          if (activeSessionId) {
            await supabase.from("chat_messages").insert({
              session_id: activeSessionId,
              role: "assistant",
              content: fullResponse,
              sources,
            });
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Something went wrong" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
