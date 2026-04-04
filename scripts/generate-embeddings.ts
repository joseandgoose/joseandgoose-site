import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

// Load .env.local manually (same pattern as generate-tldr.ts)
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

type SearchEntry = {
  type: string;
  title: string;
  url: string;
  description: string;
};

async function main() {
  console.log("Loading embedding model (first run downloads ~30MB)...");
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  // Load content sources
  const searchIndex: SearchEntry[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "search-index.json"), "utf-8")
  );
  const tldrs: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "app", "lib", "tldr.json"), "utf-8")
  );

  console.log(`Embedding ${searchIndex.length} content items...\n`);

  for (const entry of searchIndex) {
    const slug = entry.url.replace(/^\//, "") || "home";
    const postSlug = slug.replace("writing/", "");
    const tldr = entry.type === "post" ? tldrs[postSlug] : undefined;

    // Combine title + description + TLDR for richer embedding
    const textToEmbed = [entry.title, entry.description, tldr]
      .filter(Boolean)
      .join(" -- ");

    // Generate embedding (returns { data: Float32Array })
    const output = await embedder(textToEmbed, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data as Float32Array);

    const { error } = await supabase.from("content_embeddings").upsert(
      {
        content_type: entry.type,
        slug,
        title: entry.title,
        url: entry.url,
        description: entry.description,
        embedding: JSON.stringify(embedding),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_type,slug" }
    );

    if (error) {
      console.error(`  x ${slug}: ${error.message}`);
    } else {
      console.log(`  + ${entry.type}: ${entry.title}`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
