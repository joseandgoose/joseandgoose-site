"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The twin bundle (public/parking/twin-bundle.js) attaches this to window.
declare global {
  interface Window {
    renderTwin?: (el: HTMLElement, geo: unknown, pstates: unknown) => void;
  }
}

interface Spot {
  occupied: number;
  side: string;
}
interface ParkingData {
  spots: Spot[];
  open: number;
  total: number;
  ts?: string;
  stalled?: boolean;
  stored_at?: string;
  pending?: boolean;
}

const PW_KEY = "parking_pw";
const POLL_MS = 20000;

function loadBundleOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.renderTwin) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-twin]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("twin bundle failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "/parking/twin-bundle.js";
    s.dataset.twin = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("twin bundle failed"));
    document.head.appendChild(s);
  });
}

function agoLabel(iso?: string): { text: string; stale: boolean } {
  if (!iso) return { text: "—", stale: true };
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const stale = secs > 90;
  if (secs < 60) return { text: `${secs}s ago`, stale };
  const m = Math.round(secs / 60);
  if (m < 60) return { text: `${m} min ago`, stale };
  return { text: `${Math.round(m / 60)} hr ago`, stale };
}

export default function ParkingPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<ParkingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const geoRef = useRef<unknown>(null);
  const twinRef = useRef<HTMLDivElement>(null);
  const pwRef = useRef<string | null>(null);

  // restore a saved passphrase
  useEffect(() => {
    const saved = localStorage.getItem(PW_KEY);
    if (saved) {
      setPw(saved);
      pwRef.current = saved;
      setAuthed(true);
    }
  }, []);

  const poll = useCallback(async () => {
    const key = pwRef.current;
    if (!key) return;
    try {
      const res = await fetch("/api/parking", { headers: { "x-parking-pw": key } });
      if (res.status === 401) {
        localStorage.removeItem(PW_KEY);
        setAuthed(false);
        setPw(null);
        pwRef.current = null;
        setError("That passphrase didn’t work.");
        return;
      }
      if (!res.ok) throw new Error(`server ${res.status}`);
      const json = (await res.json()) as ParkingData;
      setData(json);
      setError(null);
    } catch {
      setError("Couldn’t reach the watcher — retrying.");
    }
  }, []);

  // once authed: load geometry + bundle, then poll on an interval
  useEffect(() => {
    if (!authed) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!geoRef.current) {
          geoRef.current = await (await fetch("/parking/geometry.json")).json();
        }
        await loadBundleOnce();
      } catch {
        if (!cancelled) setError("Couldn’t load the street view.");
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (cancelled) return;
      await poll();
      timer = setInterval(poll, POLL_MS);
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [authed, poll]);

  // (re)paint the twin whenever occupancy changes
  useEffect(() => {
    if (!data || !data.spots || !geoRef.current || !twinRef.current || !window.renderTwin) return;
    window.renderTwin(twinRef.current, geoRef.current, data.spots);
  }, [data]);

  function submitPw(e: React.FormEvent) {
    e.preventDefault();
    const val = pwInput.trim();
    if (!val) return;
    localStorage.setItem(PW_KEY, val);
    setPw(val);
    pwRef.current = val;
    setError(null);
    setAuthed(true);
  }

  const ago = agoLabel(data?.stored_at);
  const stale = ago.stale || data?.stalled;

  // ---- passphrase gate ----
  if (!authed || !pw) {
    return (
      <main style={styles.gateWrap}>
        <form onSubmit={submitPw} style={styles.gateCard}>
          <div style={styles.gateEmoji}>🅿️</div>
          <h1 style={styles.gateTitle}>Sidewalk Watch — parking</h1>
          <p style={styles.gateSub}>Enter the passphrase to see live parking on the block.</p>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            placeholder="passphrase"
            autoFocus
            style={styles.gateInput}
          />
          <button type="submit" style={styles.gateBtn}>Show me</button>
          {error && <p style={styles.gateErr}>{error}</p>}
        </form>
      </main>
    );
  }

  // ---- live view ----
  const open = data?.open ?? 0;
  const total = data?.total ?? 0;
  const pending = data?.pending;

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.big}>
              {pending ? "…" : open}
              <span style={styles.bigUnit}>{pending ? "" : ` of ${total} open`}</span>
            </div>
            <div style={styles.sub}>
              {pending
                ? "waiting for the first reading…"
                : stale
                  ? `last reading ${ago.text} · may be stale`
                  : `updated ${ago.text}`}
            </div>
          </div>
          <span style={{ ...styles.dot, background: stale ? "#c98a1a" : "#1baf7a" }} />
        </div>
        <div ref={twinRef} style={styles.twin}>
          {loading && <div style={styles.twinLoading}>loading street…</div>}
        </div>
        {error && <p style={styles.err}>{error}</p>}
        <p style={styles.foot}>
          Cartoon street twin from a camera on the block — no video or plates leave the house.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  gateWrap: { minHeight: "100dvh", display: "grid", placeItems: "center", padding: 20, background: "#0f1115" },
  gateCard: { width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12, textAlign: "center", background: "#181b21", border: "1px solid #262b33", borderRadius: 16, padding: 28, color: "#e7e9ee" },
  gateEmoji: { fontSize: 40 },
  gateTitle: { fontSize: 19, fontWeight: 600, margin: 0 },
  gateSub: { fontSize: 13.5, color: "#9aa2ad", margin: 0 },
  gateInput: { padding: "11px 14px", borderRadius: 10, border: "1px solid #303640", background: "#0f1115", color: "#e7e9ee", fontSize: 15, outline: "none" },
  gateBtn: { padding: "11px 14px", borderRadius: 10, border: "none", background: "#2a78d6", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  gateErr: { color: "#e6795f", fontSize: 13, margin: 0 },

  wrap: { minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16, background: "#0f1115" },
  card: { width: "100%", maxWidth: 760, background: "#181b21", border: "1px solid #262b33", borderRadius: 16, padding: 18, color: "#e7e9ee" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  big: { fontSize: 34, fontWeight: 700, lineHeight: 1.05 },
  bigUnit: { fontSize: 17, fontWeight: 500, color: "#9aa2ad" },
  sub: { fontSize: 13, color: "#9aa2ad", marginTop: 3 },
  dot: { width: 12, height: 12, borderRadius: "50%", flex: "0 0 auto" },
  twin: { position: "relative", width: "100%", borderRadius: 10, overflow: "hidden", background: "#1a1a19", minHeight: 120 },
  twinLoading: { position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, color: "#9aa2ad" },
  err: { color: "#e6795f", fontSize: 13, margin: "10px 2px 0" },
  foot: { fontSize: 11.5, color: "#6b727d", margin: "12px 2px 0", textAlign: "center" },
};
