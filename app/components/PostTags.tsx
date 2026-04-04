"use client";

import Link from "next/link";
import { posts } from "@/app/lib/posts";

export default function PostTags({ slug }: { slug: string }) {
  const post = posts.find((p) => p.slug === slug);
  if (!post || post.tags.length === 0) return null;

  return (
    <div className="post-tags">
      {post.tags.map((tag) => (
        <span key={tag} className="post-tag-pill">
          {tag}
        </span>
      ))}
    </div>
  );
}
