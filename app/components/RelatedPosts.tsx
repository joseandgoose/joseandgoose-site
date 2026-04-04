"use client";

import Link from "next/link";
import related from "@/app/lib/related.json";
import { posts } from "@/app/lib/posts";

type RelatedEntry = { slug: string; title: string };

export default function RelatedPosts({ slug }: { slug: string }) {
  const entries = (related as Record<string, RelatedEntry[]>)[slug];
  if (!entries || entries.length === 0) return null;

  return (
    <div className="related-posts">
      <h3 className="related-posts-heading">Related Posts</h3>
      <div className="related-posts-list">
        {entries.map((entry) => {
          const post = posts.find((p) => p.slug === entry.slug);
          return (
            <Link
              href={`/writing/${entry.slug}`}
              key={entry.slug}
              className="related-post-card"
            >
              <span className="related-post-title">{entry.title}</span>
              {post && (
                <span className="related-post-meta">{post.readTime}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
