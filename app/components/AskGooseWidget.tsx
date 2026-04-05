"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

type Source = {
  source_id: string;
  title: string;
  url: string;
  similarity: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const MAX_CHARS = 500;
const MAX_QUESTIONS = 10;

const SUGGESTED_QUESTIONS = [
  "What has Jose built?",
  "Jose's career background",
  "What tech powers this site?",
  "What AI prompts does Jose use?",
];

/** Turn inline /paths and **bold** into clickable links and <strong> tags */
function renderContent(text: string) {
  // Split on inline path references like /contact, /writing/slug, /numerator etc.
  // and **bold** markdown
  const parts = text.split(/(\*\*[^*]+\*\*|(?<!\w)\/[a-z][a-z0-9\-\/]*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("/") && /^\/[a-z][a-z0-9\-\/]*$/.test(part)) {
      return (
        <a key={i} href={part} className="goose-inline-link">
          {part}
        </a>
      );
    }
    return part;
  });
}

const STORAGE_KEY = "ask-goose-widget";

function saveState(data: { messages: Message[]; sessionId: string | null; questionCount: number; open: boolean }) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or unavailable */ }
}

function loadState(): { messages: Message[]; sessionId: string | null; questionCount: number; open: boolean } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AskGooseWidget() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = questionCount >= MAX_QUESTIONS;
  const isAskGoosePage = pathname === "/ask-goose";

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setMessages(saved.messages);
      setSessionId(saved.sessionId);
      setQuestionCount(saved.questionCount);
      setOpen(saved.open);
    }
    setHydrated(true);
  }, []);

  // Persist state to sessionStorage on changes
  useEffect(() => {
    if (!hydrated) return;
    saveState({ messages, sessionId, questionCount, open });
  }, [messages, sessionId, questionCount, open, hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSend(text?: string) {
    const question = text || input.trim();
    if (!question || isStreaming || isLimitReached) return;

    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, sessionId, currentPage: pathname }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let sources: Source[] = [];

      setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "error") {
            throw new Error(data.error || "Something went wrong");
          } else if (data.type === "meta") {
            setSessionId(data.sessionId);
            sources = data.sources || [];
          } else if (data.type === "text") {
            assistantContent += data.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantContent,
                sources,
              };
              return updated;
            });
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantContent,
          sources,
        };
        return updated;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, something went wrong. Try again in a moment.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Don't render until sessionStorage state is restored, or on the /ask-goose page
  if (!hydrated || isAskGoosePage) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          className="goose-widget-trigger"
          onClick={() => setOpen(true)}
          aria-label="Open Ask Goose chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="goose-widget-panel">
          {/* Header */}
          <div className="goose-widget-header">
            <div className="goose-widget-header-info">
              <svg className="goose-widget-header-icon" width="20" height="20" viewBox="0 0 24 24" fill="#F3D104"><path d="M12 18.5c-2.5 0-4.5-1.3-4.5-3 0-1 .7-2.2 2-3.2.8-.6 1.6-1 2.5-1s1.7.4 2.5 1c1.3 1 2 2.2 2 3.2 0 1.7-2 3-4.5 3zM5.5 11c-1.1 0-2-.9-2-2.2S4.4 6.5 5.5 6.5s2 1 2 2.3S6.6 11 5.5 11zm4-3c-1.1 0-2-.7-2-1.8S8.4 4.5 9.5 4.5s2 .7 2 1.7S10.6 8 9.5 8zm5 0c-1.1 0-2-.7-2-1.8s.9-1.7 2-1.7 2 .7 2 1.7S15.6 8 14.5 8zm4 3c-1.1 0-2-.9-2-2.2s.9-2.3 2-2.3 2 1 2 2.3S19.6 11 18.5 11z"/></svg>
              <span className="goose-widget-header-title">Ask Goose</span>
            </div>
            <button
              className="goose-widget-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="goose-widget-messages">
            {messages.length === 0 && (
              <div className="goose-widget-empty">
                <p className="goose-widget-empty-title">Ask Goose</p>
                <p className="goose-widget-empty-desc">
                  Ask anything about Jose, his work, or this site.
                </p>
                <div className="goose-widget-suggestions">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className="goose-widget-suggestion"
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`goose-widget-bubble-row goose-widget-bubble-row-${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="goose-widget-avatar">🐾</div>
                )}
                <div className={`goose-widget-bubble goose-widget-bubble-${msg.role}`}>
                  <div className="goose-widget-bubble-content">
                    {msg.content ? renderContent(msg.content) : (isStreaming && i === messages.length - 1 ? (
                      <span className="goose-widget-typing">Thinking...</span>
                    ) : null)}
                  </div>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && msg.content && (
                    <div className="goose-widget-sources">
                      {msg.sources.slice(0, 3).map((s, j) => (
                        <a key={j} href={s.url} className="goose-widget-source-link">
                          {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLimitReached && (
              <div className="goose-widget-bubble-row goose-widget-bubble-row-assistant">
                <div className="goose-widget-avatar">🐾</div>
                <div className="goose-widget-bubble goose-widget-bubble-assistant">
                  <div className="goose-widget-bubble-content">
                    That&apos;s {MAX_QUESTIONS} questions — I need a water break!{" "}
                    <a href="/contact" className="goose-widget-contact-link">Reach out to Jose directly</a>.
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="goose-widget-input-area">
            <div className="goose-widget-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="goose-widget-input"
                placeholder={isLimitReached ? "Session limit reached" : "Ask anything..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || isLimitReached}
                maxLength={MAX_CHARS}
              />
              {input.length > 0 && (
                <span className={`goose-widget-char-count${input.length > MAX_CHARS - 50 ? " goose-widget-char-warn" : ""}`}>
                  {MAX_CHARS - input.length}
                </span>
              )}
            </div>
            <button
              className="goose-widget-send"
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim() || isLimitReached}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {messages.length > 0 && !isLimitReached && (
            <div className="goose-widget-question-count">
              {MAX_QUESTIONS - questionCount} remaining
            </div>
          )}
        </div>
      )}
    </>
  );
}
