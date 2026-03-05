"use client";

import { useState } from "react";

interface FruitListing {
  id: string; lat: number; lng: number; address: string;
  fruit_type: string; owner_name: string; venmo_handle?: string;
  rules?: string; status: "active" | "blocklisted"; exchange_count: number;
}

const FRUIT_EMOJIS: Record<string, string> = {
  apple: "🍎", lemon: "🍋", lime: "🟢", orange: "🍊", grapefruit: "🩷",
  fig: "🫐", avocado: "🥑", persimmon: "🟠", stone_fruit: "🍑", other: "❓",
};

export default function TreePopup({
  listing,
  onClose,
  onExchangeRecorded,
}: {
  listing: FruitListing;
  onClose: () => void;
  onExchangeRecorded: (id: string) => void;
}) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleExchange() {
    setSubmitting(true);
    const res = await fetch("/api/fruit-exchange/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listing.id, rating, note }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      onExchangeRecorded(listing.id);
    }
  }

  return (
    <div style={{
      position: "fixed", top: 80, right: 16, zIndex: 1500,
      width: 300, maxWidth: "calc(100vw - 32px)",
    }}>
      <div className="hm-dialog" style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 28 }}>{FRUIT_EMOJIS[listing.fruit_type] ?? "🌳"}</span>
            <div className="hm-title" style={{ fontSize: 12, marginTop: 4 }}>
              {listing.fruit_type.replace("_", " ")}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-pixel)", fontSize: 10, background: "none",
              border: "2px solid var(--hm-border)", borderRadius: 2, cursor: "pointer",
              color: "var(--hm-shadow)", padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ borderTop: "2px solid var(--hm-border)", paddingTop: 12, marginBottom: 12 }}>
          <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", marginBottom: 6, lineHeight: 2 }}>
            <strong>Owner:</strong> {listing.owner_name}
          </p>
          <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-border)", marginBottom: 6, lineHeight: 2 }}>
            📍 {listing.address}
          </p>
          {listing.exchange_count > 0 && (
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-green)", marginBottom: 6 }}>
              {"⭐".repeat(Math.min(listing.exchange_count, 5))} {listing.exchange_count} exchange{listing.exchange_count !== 1 ? "s" : ""}
            </p>
          )}
          {listing.rules && (
            <div style={{
              background: "rgba(139,105,20,0.1)", border: "1px solid var(--hm-border)",
              borderRadius: 2, padding: "8px 10px", marginBottom: 8,
            }}>
              <p className="hm-label" style={{ marginBottom: 4, fontSize: 8.5 }}>Rules</p>
              <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", lineHeight: 2 }}>
                {listing.rules}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {listing.venmo_handle && (
            <a
              href={`https://venmo.com/${listing.venmo_handle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center",
                fontFamily: "var(--font-pixel)", fontSize: 8,
                background: "#008CFF", color: "white",
                border: "2px solid var(--hm-shadow)",
                boxShadow: "3px 3px 0 var(--hm-shadow)",
                padding: "10px 16px", borderRadius: 2, textDecoration: "none",
              }}
            >
              💸 Tip on Venmo @{listing.venmo_handle.replace("@", "")}
            </a>
          )}

          {done ? (
            <div style={{ textAlign: "center", fontFamily: "var(--font-pixel)", fontSize: 8, color: "var(--hm-green)", padding: 8 }}>
              ✓ Exchange recorded! Thanks!
            </div>
          ) : showRatingForm ? (
            <div>
              <p className="hm-label" style={{ marginBottom: 8 }}>Rate your experience</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    style={{
                      fontSize: 18, background: "none", border: "none",
                      cursor: "pointer", opacity: s <= rating ? 1 : 0.3,
                    }}
                  >⭐</button>
                ))}
              </div>
              <textarea
                className="hm-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Leave a note (optional)..."
                rows={2}
                style={{ resize: "none", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="hm-btn" onClick={handleExchange} disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Saving..." : "Submit ✓"}
                </button>
                <button className="hm-btn hm-btn-red" onClick={() => setShowRatingForm(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="hm-btn" onClick={() => setShowRatingForm(true)}>
              Record an Exchange ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
