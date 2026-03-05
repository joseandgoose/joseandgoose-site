"use client";

import { useState } from "react";

const FRUIT_TYPES = ["apple", "lemon", "lime", "orange", "grapefruit", "fig", "avocado", "persimmon", "stone_fruit", "other"];

export default function ListTreeModal({
  latlng,
  onClose,
}: {
  latlng: { lat: number; lng: number };
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [venmo, setVenmo] = useState("");
  const [address, setAddress] = useState("");
  const [fruitType, setFruitType] = useState("");
  const [rules, setRules] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/fruit-exchange/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: latlng.lat, lng: latlng.lng, address: address.trim(),
        fruit_type: fruitType, owner_name: name.trim(), owner_email: email.trim(),
        venmo_handle: venmo.trim() || undefined, rules: rules.trim() || undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(61,32,9,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div className="hm-dialog" style={{ maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="hm-title" style={{ fontSize: 12 }}>🌳 List My Tree</h2>
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-pixel)", fontSize: 10, background: "none",
              border: "2px solid var(--hm-border)", borderRadius: 2, cursor: "pointer",
              color: "var(--hm-shadow)", padding: "4px 8px",
            }}
          >✕</button>
        </div>

        {/* Step indicator */}
        {!done && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 6, borderRadius: 2,
                background: s <= step ? "var(--hm-green)" : "var(--hm-border)",
                opacity: s <= step ? 1 : 0.3,
              }} />
            ))}
          </div>
        )}

        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
            <p className="hm-title" style={{ fontSize: 10, marginBottom: 12 }}>Check your email!</p>
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", lineHeight: 2.5 }}>
              We sent a verification link to <strong>{email}</strong>.<br />
              Click it to add your tree to the map.
            </p>
            <button className="hm-btn hm-btn-gold" onClick={onClose} style={{ marginTop: 24 }}>
              Close ✕
            </button>
          </div>
        ) : step === 1 ? (
          <>
            <p className="hm-label" style={{ marginBottom: 16 }}>Step 1 — Your info</p>
            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Your name *</label>
              <input className="hm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name is fine" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Email *</label>
              <input className="hm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Venmo handle</label>
              <input className="hm-input" value={venmo} onChange={(e) => setVenmo(e.target.value)} placeholder="@yourhandle (optional)" />
            </div>
            <button
              className="hm-btn hm-btn-gold"
              style={{ width: "100%" }}
              disabled={!name.trim() || !email.trim()}
              onClick={() => setStep(2)}
            >
              Next →
            </button>
          </>
        ) : step === 2 ? (
          <>
            <p className="hm-label" style={{ marginBottom: 16 }}>Step 2 — Tree info</p>
            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Address *</label>
              <input className="hm-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Fruit type *</label>
              <select className="hm-select" value={fruitType} onChange={(e) => setFruitType(e.target.value)}>
                <option value="">Select a fruit...</option>
                {FRUIT_TYPES.map((f) => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="hm-label" style={{ display: "block", marginBottom: 6 }}>Picking rules</label>
              <textarea
                className="hm-input"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="e.g. Please ring doorbell, take only ripe ones..."
                rows={3}
                style={{ resize: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hm-btn hm-btn-red" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
              <button
                className="hm-btn hm-btn-gold"
                disabled={!address.trim() || !fruitType}
                onClick={() => setStep(3)}
                style={{ flex: 2 }}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="hm-label" style={{ marginBottom: 16 }}>Step 3 — Confirm</p>
            <div style={{
              background: "rgba(139,105,20,0.1)", border: "2px solid var(--hm-border)",
              borderRadius: 2, padding: 16, marginBottom: 20,
              fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", lineHeight: 2.5,
            }}>
              <p>🌳 <strong>{fruitType.replace("_", " ")}</strong> tree</p>
              <p>📍 {address}</p>
              <p>👤 {name} ({email})</p>
              {venmo && <p>💸 Venmo: {venmo}</p>}
              {rules && <p>📋 Rules: {rules}</p>}
            </div>
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-border)", marginBottom: 16, lineHeight: 2 }}>
              We&apos;ll send a verification link to <strong>{email}</strong>. Your tree appears on the map after you click it.
            </p>

            {error && (
              <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-red)", marginBottom: 12, lineHeight: 2 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="hm-btn hm-btn-red" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
              <button className="hm-btn" onClick={handleSubmit} disabled={submitting} style={{ flex: 2 }}>
                {submitting ? "Sending..." : "Send Verification ✉️"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
