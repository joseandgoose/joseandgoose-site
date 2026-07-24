"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The 2D twin bundle (public/parking/twin-bundle.js) attaches renderTwin;
// the 3D scene module (public/twin3d/scene.js) attaches Twin3D.
declare global {
  interface Window {
    renderTwin?: (el: HTMLElement, geo: unknown, pstates: unknown) => void;
    Twin3D?: { show: () => Promise<void>; hide: () => void };
    __parkingShimmed?: boolean;
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

function jsonResponse(body: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

/**
 * The 3D scene is vendored byte-identical from the dashboard, so it still calls
 * /api/geometry, /api/parking and /api/live. Rather than fork it (and invite
 * drift), intercept those three: geometry + occupancy come from what this page
 * already holds, and /api/live returns nothing — the public page deliberately
 * doesn't publish live vehicle/pedestrian tracks, only parking occupancy.
 * Our own gated poll is distinguished by its x-parking-pw header and passes through.
 */
function installFetchShim(getGeo: () => unknown, getData: () => ParkingData | null) {
  if (typeof window === "undefined" || window.__parkingShimmed) return;
  window.__parkingShimmed = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const isOurGatedCall = "x-parking-pw" in headers;
    if (!isOurGatedCall) {
      if (url.includes("/api/geometry")) return jsonResponse(getGeo() ?? {});
      if (url.includes("/api/live")) return jsonResponse({ tracks: [], ts: new Date().toISOString() });
      if (url.includes("/api/parking")) return jsonResponse(getData() ?? { spots: [] });
    }
    return orig(input, init);
  };
}

function loadScriptOnce(src: string, asModule: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(src)));
      return;
    }
    const s = document.createElement("script");
    if (asModule) s.type = "module";
    s.src = src;
    s.dataset.src = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

// Read through a function so TypeScript can't narrow the global away — the 3D
// module assigns window.Twin3D asynchronously, long after any earlier check.
const getTwin3D = (): Window["Twin3D"] => (typeof window === "undefined" ? undefined : window.Twin3D);

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
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [loading3d, setLoading3d] = useState(false);
  const [failed3d, setFailed3d] = useState(false);

  const geoRef = useRef<unknown>(null);
  const dataRef = useRef<ParkingData | null>(null);
  const twinRef = useRef<HTMLDivElement>(null);
  const pwRef = useRef<string | null>(null);

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
      dataRef.current = json;
      setData(json);
      setError(null);
    } catch {
      setError("Couldn’t reach the watcher — retrying.");
    }
  }, []);

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
        await loadScriptOnce("/parking/twin-bundle.js", false);
      } catch {
        if (!cancelled) setError("Couldn’t load the street view.");
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (cancelled) return;
      installFetchShim(() => geoRef.current, () => dataRef.current);
      await poll();
      timer = setInterval(poll, POLL_MS);
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [authed, poll]);

  // repaint the 2D twin whenever occupancy changes
  useEffect(() => {
    if (view !== "2d") return;
    if (!data?.spots || !geoRef.current || !twinRef.current || !window.renderTwin) return;
    window.renderTwin(twinRef.current, geoRef.current, data.spots);
  }, [data, view]);

  // lazy-load the 3D scene the first time it's asked for (~15 MB, so never up front)
  const activate3D = useCallback(async () => {
    setView("3d");
    const already = getTwin3D();
    if (already) {
      void already.show();
      return;
    }
    setLoading3d(true);
    setFailed3d(false);
    try {
      if (!document.querySelector('script[type="importmap"]')) {
        const im = document.createElement("script");
        im.type = "importmap";
        im.textContent = JSON.stringify({
          imports: { three: "/vendor/three.module.min.js", "three/addons/": "/vendor/addons/" },
        });
        document.head.appendChild(im);
      }
      await loadScriptOnce("/twin3d/scene.js", true);
      // the module attaches window.Twin3D on evaluation; give it a beat
      let scene = getTwin3D();
      for (let i = 0; i < 100 && !scene; i++) {
        await new Promise((r) => setTimeout(r, 50));
        scene = getTwin3D();
      }
      if (!scene) throw new Error("Twin3D never appeared");
      await scene.show();
    } catch {
      setFailed3d(true);
    } finally {
      setLoading3d(false);
    }
  }, []);

  const activate2D = useCallback(() => {
    setView("2d");
    getTwin3D()?.hide();
  }, []);

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
          <div style={styles.headRight}>
            <div style={styles.toggle}>
              <button
                onClick={activate2D}
                style={view === "2d" ? styles.toggleOn : styles.toggleOff}
              >
                2D
              </button>
              <button
                onClick={activate3D}
                style={view === "3d" ? styles.toggleOn : styles.toggleOff}
              >
                3D
              </button>
            </div>
            <span style={{ ...styles.dot, background: stale ? "#c98a1a" : "#1baf7a" }} />
          </div>
        </div>

        {/* 2D twin */}
        <div ref={twinRef} style={{ ...styles.twin, display: view === "2d" ? "block" : "none" }}>
          {loading && <div style={styles.twinLoading}>loading street…</div>}
        </div>

        {/* 3D scene — ids match what scene.js expects */}
        <div id="street3d" style={{ ...styles.twin3d, display: view === "3d" ? "block" : "none" }}>
          <canvas id="c3d" style={styles.canvas} />
          <div id="c3dlabels" style={styles.overlay} />
          <div id="c3dnote" style={styles.note} />
          {loading3d && <div style={styles.twinLoading}>loading 3D street… (one-time ~15 MB)</div>}
          {failed3d && <div style={styles.twinLoading}>3D didn’t load — the 2D view still works.</div>}
        </div>

        {error && <p style={styles.err}>{error}</p>}
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
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 },
  big: { fontSize: 34, fontWeight: 700, lineHeight: 1.05 },
  bigUnit: { fontSize: 17, fontWeight: 500, color: "#9aa2ad" },
  sub: { fontSize: 13, color: "#9aa2ad", marginTop: 3 },
  headRight: { display: "flex", alignItems: "center", gap: 12 },
  toggle: { display: "flex", border: "1px solid #303640", borderRadius: 999, overflow: "hidden" },
  toggleOn: { padding: "5px 13px", background: "#2a78d6", color: "#fff", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  toggleOff: { padding: "5px 13px", background: "transparent", color: "#9aa2ad", border: "none", fontFamily: "inherit", fontSize: 13, cursor: "pointer" },
  dot: { width: 12, height: 12, borderRadius: "50%", flex: "0 0 auto" },

  twin: { position: "relative", width: "100%", borderRadius: 10, overflow: "hidden", background: "#1a1a19", minHeight: 120 },
  twin3d: { position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden", background: "#1a1a19" },
  canvas: { width: "100%", height: "100%", display: "block" },
  overlay: { position: "absolute", inset: 0, pointerEvents: "none" },
  note: { position: "absolute", left: 8, bottom: 6, fontSize: 11, color: "rgba(255,255,255,.7)" },
  twinLoading: { position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, color: "#9aa2ad" },
  err: { color: "#e6795f", fontSize: 13, margin: "10px 2px 0" },
};
