import type { Metadata } from "next";
import { posts } from "@/app/lib/posts";
import WritingFilter from "./WritingFilter";

export const metadata: Metadata = {
  title: "Writing — how I build things with AI — Jose and Goose",
  description:
    "Step-by-step build logs: RAG chatbots, vector search, content pipelines, and homelab automations — a non-developer building with AI.",
};

export default function Writing() {
  return (
    <>
      <div className="page-header">
        <h1>Writing</h1>
        <p className="tagline">Field notes on building with AI</p>
      </div>

      <WritingFilter posts={posts} />
    </>
  );
}
