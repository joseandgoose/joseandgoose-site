import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually since tsx doesn't auto-load it
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function main() {
  console.log("Fetching post embeddings from Supabase...\n");

  const { data, error } = await supabase
    .from("content_embeddings")
    .select("slug, title, embedding")
    .eq("content_type", "post");

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error("No post embeddings found in content_embeddings table.");
    process.exit(1);
  }

  console.log(`Found ${data.length} post embeddings.\n`);

  // Parse embeddings (stored as JSON string)
  const posts = data.map((row) => ({
    slug: row.slug.replace("writing/", ""),
    title: row.title,
    embedding: typeof row.embedding === "string"
      ? JSON.parse(row.embedding)
      : row.embedding,
  }));

  // Load posts.ts for readTime lookup
  const postsRaw = fs.readFileSync(
    path.join(process.cwd(), "app", "lib", "posts.ts"),
    "utf-8"
  );

  const related: Record<string, { slug: string; title: string }[]> = {};

  for (const post of posts) {
    const similarities = posts
      .filter((other) => other.slug !== post.slug)
      .map((other) => ({
        slug: other.slug,
        title: other.title,
        score: cosineSimilarity(post.embedding, other.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    related[post.slug] = similarities.map((s) => ({
      slug: s.slug,
      title: s.title,
    }));

    console.log(`${post.slug}:`);
    for (const s of similarities) {
      console.log(`  → ${s.title} (${s.score.toFixed(3)})`);
    }
    console.log();
  }

  const outputPath = path.join(process.cwd(), "app", "lib", "related.json");
  fs.writeFileSync(outputPath, JSON.stringify(related, null, 2));
  console.log(`\nWritten to ${outputPath}`);
}

main().catch(console.error);
