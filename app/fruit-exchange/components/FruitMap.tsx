"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

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

const FRUIT_CONFIG: Record<string, { emoji: string; color: string }> = {
  apple:       { emoji: "🍎", color: "#E63946" },
  lemon:       { emoji: "🍋", color: "#FFD60A" },
  lime:        { emoji: "🟢", color: "#70E000" },
  orange:      { emoji: "🍊", color: "#FF6B35" },
  grapefruit:  { emoji: "🩷", color: "#FF758F" },
  fig:         { emoji: "🫐", color: "#7B2D8B" },
  avocado:     { emoji: "🥑", color: "#386641" },
  persimmon:   { emoji: "🟠", color: "#E97C1F" },
  stone_fruit: { emoji: "🍑", color: "#FFAD87" },
  other:       { emoji: "❓", color: "#9A9A9A" },
};

function makeListingIcon(fruitType: string, isBlocklisted: boolean) {
  const cfg = FRUIT_CONFIG[fruitType] ?? FRUIT_CONFIG.other;
  const color = isBlocklisted ? "#C23B22" : cfg.color;
  const emoji = isBlocklisted ? "✕" : cfg.emoji;
  return `
    <div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid #3D2009;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:2px 2px 0 #3D2009;
      cursor:pointer;
    ">${emoji}</div>
  `;
}

function makeRequestIcon(count: number) {
  return `
    <div style="
      width:36px;height:36px;border-radius:50%;
      background:#888;border:3px dashed #555;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:bold;color:white;
      box-shadow:2px 2px 0 #333;cursor:pointer;
    ">${count}</div>
  `;
}

export default function FruitMap({
  listings,
  requests,
  onListingClick,
  onRequestClick,
  onMapClick,
}: {
  listings: FruitListing[];
  requests: FruitRequest[];
  onListingClick: (listing: FruitListing) => void;
  onRequestClick: (req: FruitRequest) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Initialize map once
  useEffect(() => {
    const div = mapDivRef.current;
    if (!div) return;
    // Guard against React strict-mode double-invoke: Leaflet sets _leaflet_id on init
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((div as any)._leaflet_id) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapDivRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapDivRef.current as any)._leaflet_id) return;

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, {
        center: [34.0195, -118.4912], // Los Angeles default
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;

      // Attempt GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
          () => {} // silently fail
        );
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const listing of listings) {
        const icon = L.divIcon({
          html: makeListingIcon(listing.fruit_type, listing.status === "blocklisted"),
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([listing.lat, listing.lng], { icon })
          .addTo(map)
          .on("click", (e) => {
            e.originalEvent?.stopPropagation();
            onListingClick(listing);
          });
        markersRef.current.push(marker);
      }

      for (const req of requests) {
        if (req.status !== "open") continue;
        const icon = L.divIcon({
          html: makeRequestIcon(req.request_count),
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([req.lat, req.lng], { icon })
          .addTo(map)
          .on("click", (e) => {
            e.originalEvent?.stopPropagation();
            onRequestClick(req);
          });
        markersRef.current.push(marker);
      }
    });
  }, [listings, requests, onListingClick, onRequestClick]);

  return (
    <>
      {/* Leaflet CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
