import Link from "next/link";
import { posts } from "@/app/lib/posts";

export default function Writing() {
  return (
    <>

      {/* ── PAGE TITLE BLOCK ── */}
      <div className="page-header">
        <h1>Writing</h1>
        <p className="tagline">Ideas at the intersection of product, strategy, and building things</p>
      </div>

      {/* ── POST LIST ── */}
      <section className="writing-list">
        {posts.map((post) => (
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
