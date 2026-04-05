import { posts } from "@/app/lib/posts";
import WritingFilter from "./WritingFilter";

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
