"use client";

interface Stats {
  total_trees: number;
  total_exchanges: number;
  top_trees: { fruit_type: string; count: number }[];
  top_requested: { address: string; fruit_type?: string; request_count: number }[];
}

const FRUIT_EMOJIS: Record<string, string> = {
  apple: "🍎", lemon: "🍋", lime: "🟢", orange: "🍊", grapefruit: "🩷",
  fig: "🫐", avocado: "🥑", persimmon: "🟠", stone_fruit: "🍑", other: "❓",
};

export default function WelcomeModal({ stats, onClose }: { stats: Stats | null; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(61,32,9,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div className="hm-dialog" style={{ maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌳</div>
          <h1 className="hm-title" style={{ fontSize: 16 }}>Fruit Exchange</h1>
          <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-border)", marginTop: 8, lineHeight: 2 }}>
            A community fruit tree marketplace
          </p>
        </div>

        <div style={{ marginBottom: 20, borderTop: "2px solid var(--hm-border)", paddingTop: 16 }}>
          <p className="hm-label" style={{ marginBottom: 12 }}>How it works</p>
          <ul style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", lineHeight: 2.4, listStyle: "none", paddingLeft: 0 }}>
            <li>🌳 <strong>Owners</strong> list trees in their front yard</li>
            <li>🛒 <strong>Pickers</strong> find trees on the map</li>
            <li>💸 Venmo the owner a thank-you donation</li>
            <li>⭕ <strong>Request</strong> a tree at any address</li>
            <li>✉️ Owners verify via email (keeps it real)</li>
          </ul>
        </div>

        {stats && (
          <div style={{
            background: "rgba(139,105,20,0.1)", border: "2px solid var(--hm-border)",
            borderRadius: 2, padding: "12px 16px", marginBottom: 20,
            display: "flex", gap: 24, justifyContent: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: 20, color: "var(--hm-green)" }}>{stats.total_trees}</div>
              <div className="hm-label" style={{ fontSize: 8.5 }}>Trees listed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: 20, color: "var(--hm-green)" }}>{stats.total_exchanges}</div>
              <div className="hm-label" style={{ fontSize: 8.5 }}>Exchanges made</div>
            </div>
          </div>
        )}

        {stats && stats.top_trees.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p className="hm-label" style={{ marginBottom: 10 }}>Top trees in the village</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stats.top_trees.map((t) => (
                <span key={t.fruit_type} style={{
                  fontFamily: "var(--font-pixel)", fontSize: 8.5,
                  background: "var(--hm-gold)", color: "var(--hm-shadow)",
                  border: "2px solid var(--hm-border)", borderRadius: 2, padding: "4px 8px",
                }}>
                  {FRUIT_EMOJIS[t.fruit_type] ?? "❓"} {t.fruit_type} ×{t.count}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button className="hm-btn hm-btn-gold" onClick={onClose} style={{ fontSize: 10, padding: "12px 28px" }}>
            Pick Responsibly →
          </button>
        </div>
      </div>
    </div>
  );
}
