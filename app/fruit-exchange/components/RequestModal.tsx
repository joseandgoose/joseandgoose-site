"use client";

import { useState } from "react";

const FRUIT_TYPES = ["apple", "lemon", "lime", "orange", "grapefruit", "fig", "avocado", "persimmon", "stone_fruit", "other"];

export default function RequestModal({
  latlng,
  onClose,
  onSubmitted,
}: {
  latlng: { lat: number; lng: number; address?: string };
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [fruitType, setFruitType] = useState("");
  const [note, setNote] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [address, setAddress] = useState(latlng.address ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError("Please enter an address"); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/fruit-exchange/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: latlng.lat, lng: latlng.lng, address: address.trim(),
        fruit_type: fruitType || undefined,
        bid_amount: bidAmount ? parseFloat(bidAmount) : undefined,
        note: note || undefined,
      }),
    });

    setSubmitting(false);
    if (res.status === 403) {
      setError("This address has been blocklisted and cannot receive requests.");
      return;
    }
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    setTimeout(onSubmitted, 1500);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(61,32,9,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div className="hm-dialog" style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="hm-title" style={{ fontSize: 12 }}>⭕ Request a Tree</h2>
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-pixel)", fontSize: 10, background: "none",
              border: "2px solid var(--hm-border)", borderRadius: 2, cursor: "pointer",
              color: "var(--hm-shadow)", padding: "4px 8px",
            }}
          >✕</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8, color: "var(--hm-green)", lineHeight: 2 }}>
              Request submitted! If a neighbor has this tree, they may see your request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Address *</label>
              <input
                className="hm-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or intersection..."
                required
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Fruit type</label>
              <select className="hm-select" value={fruitType} onChange={(e) => setFruitType(e.target.value)}>
                <option value="">Any fruit</option>
                {FRUIT_TYPES.map((f) => (
                  <option key={f} value={f}>{f.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>What you offer</label>
              <input
                className="hm-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. homemade jam, labor help..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Suggested tip ($)</label>
              <input
                className="hm-input"
                type="number"
                min="0"
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="5.00"
              />
            </div>

            {error && (
              <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-red)", marginBottom: 12, lineHeight: 2 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="hm-btn" disabled={submitting} style={{ flex: 2 }}>
                {submitting ? "Submitting..." : "Submit Request ⭕"}
              </button>
              <button type="button" className="hm-btn hm-btn-red" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
