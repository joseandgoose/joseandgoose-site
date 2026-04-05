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
  "What has Jose built on this site?",
  "Tell me about Jose's career background",
  "What tech stack does this site use?",
  "What prompts does Jose use with AI?",
];

/** Turn inline /paths and **bold** into clickable links and <strong> tags */
function renderContent(text: string) {
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

export default function AskGooseChat() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = questionCount >= MAX_QUESTIONS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="ask-goose-container">
      {/* Messages area */}
      <div className="ask-goose-messages">
        {messages.length === 0 && (
          <div className="ask-goose-empty">
            <div className="ask-goose-empty-icon">🐾</div>
            <p className="ask-goose-empty-title">Ask Goose anything</p>
            <p className="ask-goose-empty-desc">
              I know about Jose&apos;s career, projects, writing, and the tech behind this site.
            </p>
            <div className="ask-goose-suggestions">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="ask-goose-suggestion"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`ask-goose-bubble-row ask-goose-bubble-row-${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="ask-goose-avatar">🐾</div>
            )}
            <div className={`ask-goose-bubble ask-goose-bubble-${msg.role}`}>
              <div className="ask-goose-bubble-content">
                {msg.content ? renderContent(msg.content) : (isStreaming && i === messages.length - 1 ? (
                  <span className="ask-goose-typing">Thinking...</span>
                ) : null)}
              </div>
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && msg.content && (
                <div className="ask-goose-sources">
                  <span className="ask-goose-sources-label">Sources:</span>
                  {msg.sources.map((s, j) => (
                    <a key={j} href={s.url} className="ask-goose-source-link">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Limit reached message */}
        {isLimitReached && (
          <div className="ask-goose-bubble-row ask-goose-bubble-row-assistant">
            <div className="ask-goose-avatar">🐾</div>
            <div className="ask-goose-bubble ask-goose-bubble-assistant">
              <div className="ask-goose-bubble-content">
                That&apos;s {MAX_QUESTIONS} questions — I need a water break! If you&apos;d like to
                keep the conversation going,{" "}
                <a href="/contact" className="ask-goose-contact-link">reach out to Jose directly</a>.
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="ask-goose-input-area">
        <div className="ask-goose-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="ask-goose-input"
            placeholder={isLimitReached ? "Session limit reached" : "Ask me anything about Jose or this site..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || isLimitReached}
            maxLength={MAX_CHARS}
          />
          {input.length > 0 && (
            <span className={`ask-goose-char-count${input.length > MAX_CHARS - 50 ? " ask-goose-char-warn" : ""}`}>
              {MAX_CHARS - input.length}
            </span>
          )}
        </div>
        <button
          className="ask-goose-send"
          onClick={() => handleSend()}
          disabled={isStreaming || !input.trim() || isLimitReached}
        >
          {isStreaming ? "..." : "Ask"}
        </button>
      </div>
      {messages.length > 0 && !isLimitReached && (
        <div className="ask-goose-question-count">
          {MAX_QUESTIONS - questionCount} question{MAX_QUESTIONS - questionCount !== 1 ? "s" : ""} remaining
        </div>
      )}
    </div>
  );
}
