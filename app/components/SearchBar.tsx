"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type SearchEntry = {
  type: "page" | "post" | "feature";
  title: string;
  url: string;
  description: string;
  date?: string;
};

interface Props {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#F3D104", color: "#0a0a0f", padding: "0 1px", borderRadius: "2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const TYPE_LABEL: Record<string, string> = {
  post: "Writing",
  feature: "Feature",
  page: "Page",
};

export default function SearchBar({ open: openProp, onOpen, onClose }: Props) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp !== undefined ? openProp : openInternal;

  // Portal needs document to exist (no SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Measure actual header height so overlay sits flush below it
  const [overlayTop, setOverlayTop] = useState(73);
  useEffect(() => {
    if (!open) return;
    const header = document.querySelector("header");
    if (header) setOverlayTop(header.getBoundingClientRect().height);
  }, [open]);

  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(-1);
  const [vectorLoading, setVectorLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vectorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Load index once on first open
  useEffect(() => {
    if (open && index === null) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then((data: SearchEntry[]) => setIndex(data));
    }
  }, [open, index]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced search: keyword first, vector fallback if 0 results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (vectorRef.current) clearTimeout(vectorRef.current);
    setVectorLoading(false);

    debounceRef.current = setTimeout(() => {
      if (!query.trim() || !index) {
        setResults([]);
        setActive(-1);
        return;
      }
      const q = query.toLowerCase();
      const matches = index
        .filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q)
        )
        .slice(0, 6);

      if (matches.length > 0) {
        setResults(matches);
        setActive(-1);
        return;
      }

      // No keyword matches — try vector search after a short extra delay
      setResults([]);
      setActive(-1);
      setVectorLoading(true);
      vectorRef.current = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
          .then((r) => r.json())
          .then((data) => {
            const vectorResults: SearchEntry[] = (data.results || []).map(
              (r: { content_type: string; title: string; url: string; description: string }) => ({
                type: r.content_type as SearchEntry["type"],
                title: r.title,
                url: r.url,
                description: r.description,
              })
            );
            setResults(vectorResults);
            setActive(-1);
          })
          .catch(() => setResults([]))
          .finally(() => setVectorLoading(false));
      }, 100);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (vectorRef.current) clearTimeout(vectorRef.current);
    };
  }, [query, index]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleOpen() {
    if (onOpen) onOpen();
    else setOpenInternal(true);
  }

  function close() {
    if (onClose) onClose();
    else setOpenInternal(false);
    setQuery("");
    setResults([]);
    setActive(-1);
  }

  function navigate(url: string) {
    router.push(url);
    close();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const target = active >= 0 ? results[active] : results[0];
      if (target) navigate(target.url);
    }
  }

  const overlay = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        top: overlayTop,
        background: "rgba(28, 28, 28, 0.35)",
        zIndex: 9999,
      }}
    >
      {/* Align panel to nav's right edge */}
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "0 48px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          ref={panelRef}
          style={{
            background: "var(--white)",
            border: "1px solid var(--rule)",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            width: "480px",
            padding: "16px 20px 20px",
          }}
        >
          {/* Input row */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--stone)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: "12px", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, posts, features…"
              style={{
                width: "100%",
                padding: "10px 36px 10px 38px",
                fontFamily: "var(--sans)",
                fontSize: "0.875rem",
                border: "1px solid var(--rule)",
                borderRadius: "6px",
                outline: "none",
                color: "var(--ink)",
                background: "var(--cream)",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={close}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--stone)",
                fontFamily: "var(--sans)",
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                padding: "2px 4px",
              }}
            >
              ESC
            </button>
          </div>

          {/* Results list */}
          {results.length > 0 && (
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
              {results.map((r, i) => (
                <li
                  key={r.url}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => navigate(r.url)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: active === i ? "var(--forest-pale)" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--forest)",
                        background: "var(--forest-pale)",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        flexShrink: 0,
                      }}
                    >
                      {TYPE_LABEL[r.type]}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: "0.84rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      <Highlight text={r.title} query={query} />
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: "0.74rem",
                      color: "var(--stone)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Highlight text={r.description} query={query} />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Loading / no results */}
          {query.trim() && results.length === 0 && index !== null && (
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                color: "var(--stone)",
                padding: "12px 12px 2px",
                margin: 0,
              }}
            >
              {vectorLoading
                ? "Searching..."
                : <>No results for &ldquo;{query}&rdquo;</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Search icon button */}
      <button
        onClick={handleOpen}
        aria-label="Search site"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 2px",
          color: "var(--ink)",
          display: "flex",
          alignItems: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--forest)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* Overlay rendered via portal so it's never clipped by display:none parents */}
      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}
