"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import WelcomeModal from "./components/WelcomeModal";
import TreePopup from "./components/TreePopup";
import RequestModal from "./components/RequestModal";
import ListTreeModal from "./components/ListTreeModal";

// Load FruitMap client-only (Leaflet requires window)
const FruitMap = dynamic(() => import("./components/FruitMap"), { ssr: false });

interface FruitListing {
  id: string; lat: number; lng: number; address: string;
  fruit_type: string; owner_name: string; venmo_handle?: string;
  rules?: string; status: "active" | "blocklisted"; exchange_count: number;
}

interface FruitRequest {
  id: string; lat: number; lng: number; address: string;
  fruit_type?: string; bid_amount?: number; request_count: number;
  status: "open" | "fulfilled" | "blocked";
}

interface Stats {
  total_trees: number;
  total_exchanges: number;
  top_trees: { fruit_type: string; count: number }[];
  top_requested: { address: string; fruit_type?: string; request_count: number }[];
}

export default function FruitExchangePage() {
  const [listings, setListings] = useState<FruitListing[]>([]);
  const [requests, setRequests] = useState<FruitRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedListing, setSelectedListing] = useState<FruitListing | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FruitRequest | null>(null);
  const [activeModal, setActiveModal] = useState<"request" | "list" | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [verifiedToast, setVerifiedToast] = useState(false);
  const [errorToast, setErrorToast] = useState("");
  const [mapClickLatlng, setMapClickLatlng] = useState<{ lat: number; lng: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/fruit-exchange/listings").then((r) => r.json()),
      fetch("/api/fruit-exchange/stats").then((r) => r.json()),
    ]).then(([mapData, statsData]) => {
      setListings(mapData.listings ?? []);
      setRequests(mapData.requests ?? []);
      setStats(statsData);
    }).catch(console.error);

    // Welcome modal
    if (!localStorage.getItem("fe_visited")) {
      setShowWelcome(true);
    }

    // URL param handling
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      setVerifiedToast(true);
      toastTimerRef.current = setTimeout(() => setVerifiedToast(false), 5000);
      // Clean up URL
      window.history.replaceState({}, "", "/fruit-exchange");
      // Reload listings
      fetch("/api/fruit-exchange/listings").then((r) => r.json()).then((d) => {
        setListings(d.listings ?? []);
        setRequests(d.requests ?? []);
      });
    }
    if (params.get("error")) {
      const messages: Record<string, string> = {
        invalid_token: "Verification link is invalid.",
        token_used: "This verification link has already been used.",
        token_expired: "Verification link has expired. Please list your tree again.",
        server_error: "Something went wrong. Please try again.",
      };
      setErrorToast(messages[params.get("error")!] ?? "Something went wrong.");
      toastTimerRef.current = setTimeout(() => setErrorToast(""), 6000);
      window.history.replaceState({}, "", "/fruit-exchange");
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function handleCloseWelcome() {
    localStorage.setItem("fe_visited", "1");
    setShowWelcome(false);
  }

  const handleListingClick = useCallback((listing: FruitListing) => {
    setSelectedListing(listing);
    setSelectedRequest(null);
    setActiveModal(null);
  }, []);

  const handleRequestClick = useCallback((req: FruitRequest) => {
    setSelectedRequest(req);
    setSelectedListing(null);
  }, []);

  const handleMapClick = useCallback((latlng: { lat: number; lng: number }) => {
    setMapClickLatlng(latlng);
    setSelectedListing(null);
    setSelectedRequest(null);
  }, []);

  function handleExchangeRecorded(id: string) {
    setListings((prev) =>
      prev.map((l) => l.id === id ? { ...l, exchange_count: l.exchange_count + 1 } : l)
    );
  }

  function handleRequestSubmitted() {
    setActiveModal(null);
    fetch("/api/fruit-exchange/listings").then((r) => r.json()).then((d) => {
      setRequests(d.requests ?? []);
    });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 72px)", overflow: "hidden" }}>
      {/* Full-screen map */}
      <FruitMap
        listings={listings}
        requests={requests}
        onListingClick={handleListingClick}
        onRequestClick={handleRequestClick}
        onMapClick={handleMapClick}
      />

      {/* FAB Buttons */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 12, zIndex: 1000,
      }}>
        <button
          className="hm-btn hm-btn-gold"
          style={{ fontSize: 9, padding: "12px 18px", whiteSpace: "nowrap" }}
          onClick={() => {
            setActiveModal("list");
            setSelectedListing(null);
            setSelectedRequest(null);
          }}
        >
          🌳 List My Tree
        </button>
        <button
          className="hm-btn"
          style={{ fontSize: 9, padding: "12px 18px", whiteSpace: "nowrap" }}
          onClick={() => {
            setActiveModal("request");
            setSelectedListing(null);
            setSelectedRequest(null);
          }}
        >
          ⭕ Request Here
        </button>
      </div>

      {/* Info button */}
      <button
        className="hm-btn hm-btn-gold"
        style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, padding: "8px 12px", fontSize: 10 }}
        onClick={() => setShowWelcome(true)}
        title="About Fruit Exchange"
      >
        ?
      </button>

      {/* Verified toast */}
      {verifiedToast && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 3000, fontFamily: "var(--font-pixel)", fontSize: 8,
          background: "var(--hm-green)", color: "white",
          border: "3px solid var(--hm-shadow)",
          boxShadow: "4px 4px 0 var(--hm-shadow)",
          padding: "12px 24px", borderRadius: 4,
          whiteSpace: "nowrap",
        }}>
          ✅ Your tree is now on the map!
        </div>
      )}

      {/* Error toast */}
      {errorToast && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 3000, fontFamily: "var(--font-pixel)", fontSize: 8,
          background: "var(--hm-red)", color: "white",
          border: "3px solid var(--hm-shadow)",
          boxShadow: "4px 4px 0 var(--hm-shadow)",
          padding: "12px 24px", borderRadius: 4,
          maxWidth: 320, textAlign: "center", lineHeight: 1.8,
        }}>
          ❌ {errorToast}
        </div>
      )}

      {/* Selected request info bubble */}
      {selectedRequest && !activeModal && (
        <div style={{
          position: "absolute", top: 80, right: 16, zIndex: 1500,
          width: 280, maxWidth: "calc(100vw - 32px)",
        }}>
          <div className="hm-dialog" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="hm-title" style={{ fontSize: 10 }}>⭕ Community Request</span>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  fontFamily: "var(--font-pixel)", fontSize: 8, background: "none",
                  border: "2px solid var(--hm-border)", borderRadius: 2, cursor: "pointer",
                  color: "var(--hm-shadow)", padding: "2px 6px",
                }}
              >✕</button>
            </div>
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-shadow)", lineHeight: 2 }}>
              📍 {selectedRequest.address}
            </p>
            {selectedRequest.fruit_type && (
              <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-border)", lineHeight: 2 }}>
                Wants: {selectedRequest.fruit_type.replace("_", " ")}
              </p>
            )}
            <p style={{ fontFamily: "var(--font-pixel)", fontSize: 8.5, color: "var(--hm-green)", lineHeight: 2 }}>
              {selectedRequest.request_count} neighbor{selectedRequest.request_count !== 1 ? "s" : ""} requesting
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showWelcome && <WelcomeModal stats={stats} onClose={handleCloseWelcome} />}

      {selectedListing && !activeModal && (
        <TreePopup
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onExchangeRecorded={handleExchangeRecorded}
        />
      )}

      {activeModal === "request" && (
        <RequestModal
          latlng={mapClickLatlng ?? { lat: 34.0195, lng: -118.4912 }}
          onClose={() => setActiveModal(null)}
          onSubmitted={handleRequestSubmitted}
        />
      )}

      {activeModal === "list" && (
        <ListTreeModal
          latlng={mapClickLatlng ?? { lat: 34.0195, lng: -118.4912 }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
