"use client";

import { useState } from "react";
import Image from "next/image";
import tldr from "@/app/lib/tldr.json";

export default function TLDRBadge({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const summary = (tldr as Record<string, string>)[slug];
  if (!summary) return null;

  return (
    <div className="tldr-wrap">
      <button
        className="tldr-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Image
          src="/about-goose.jpg"
          alt="Goose"
          width={39}
          height={39}
          className="tldr-avatar"
        />
        <span className="tldr-label">TL;DR by Goose</span>
        <span className={`tldr-chevron ${open ? "tldr-chevron-open" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="tldr-body">
          <p className="tldr-text">{summary}</p>
        </div>
      )}
    </div>
  );
}
