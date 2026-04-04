"use client";

import Link from "next/link";
import { useState } from "react";
import type { Post } from "@/app/lib/posts";

export default function WritingFilter({ posts }: { posts: Post[] }) {
  const ALL_TAGS = [
    "All",
    ...Array.from(new Set(posts.flatMap((p) => p.tags))).sort(),
  ];
  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? posts : posts.filter((p) => p.tags.includes(active));

  return (
    <>
      <div className="writing-filters">
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            className={`writing-filter-pill${active === tag ? " writing-filter-pill--active" : ""}`}
            onClick={() => setActive(tag)}
          >
            {tag}
          </button>
        ))}
        <p className="writing-count">
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        </p>
      </div>

      <section className="writing-list">
        {filtered.map((post) => (
          <Link href={`/writing/${post.slug}`} key={post.slug} className="writing-card">
            <div className="writing-card-meta">
              <span className="writing-card-date">{post.date}</span>
              <span className="writing-card-dot">·</span>
              <span className="writing-card-read">{post.readTime}</span>
            </div>
            <h2 className="writing-card-title">{post.title}</h2>
            <p className="writing-card-subtitle">{post.subtitle}</p>
            <span className="writing-card-link">Read post →</span>
          </Link>
        ))}
      </section>
    </>
  );
}
