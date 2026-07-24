import type { Metadata } from "next";

// Password-gated convenience page — keep it out of search indexes.
export const metadata: Metadata = {
  title: "Parking · Sidewalk Watch",
  description: "Live parking availability on the block.",
  robots: { index: false, follow: false },
};

export default function ParkingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
