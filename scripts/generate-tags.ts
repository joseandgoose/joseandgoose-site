import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// Load .env.local manually since tsx doesn't auto-load it
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const TAXONOMY = [
  "AI Tools",
  "Backend",
  "Frontend",
  "Automation",
  "Product Thinking",
  "Game Dev",
  "Data",
  "DevOps",
  "Security",
  "API Design",
  "Linux",
];

const arg = process.argv[2];

if (!arg) {
  console.error("Usage: tsx scripts/generate-tags.ts <slug>");
  console.error("       tsx scripts/generate-tags.ts --all");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripJsx(raw: string): string {
  return raw
    .replace(/import[^\n]+\n/g, "")
    .replace(/export\s+(default\s+)?function[^{]+\{/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function readingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.round(wordCount / 230));
  return `${minutes} min read`;
}

async function generateForSlug(postSlug: string) {
  const postPath = path.join(process.cwd(), "app", "writing", postSlug, "page.tsx");

  if (!fs.existsSync(postPath)) {
    console.error(`No post found at ${postPath}`);
    return;
  }

  const raw = fs.readFileSync(postPath, "utf-8");
  const text = stripJsx(raw);
  const words = countWords(text);
  const rt = readingTime(words);
  const promptText = text.slice(0, 4000);

  // Read post metadata for title/subtitle
  const postsRaw = fs.readFileSync(
    path.join(process.cwd(), "app", "lib", "posts.ts"),
    "utf-8"
  );
  const slugPattern = new RegExp(
    `slug:\\s*"${postSlug}"[\\s\\S]*?title:\\s*"([^"]+)"[\\s\\S]*?subtitle:\\s*"([^"]+)"`,
  );
  const meta = postsRaw.match(slugPattern);
  const title = meta?.[1] ?? "";
  const subtitle = meta?.[2] ?? "";

  console.log(`Generating tags for: ${postSlug} (${words} words, ${rt})...`);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Pick 3–5 tags for this blog post from ONLY this list: ${TAXONOMY.join(", ")}.

Title: ${title}
Subtitle: ${subtitle}
Content: ${promptText}

Return ONLY a JSON array of strings, e.g. ["AI Tools", "Backend", "Linux"]. No explanation.`,
      },
    ],
  });

  const responseText = (message.content[0] as { text: string }).text.trim();
  let tags: string[];
  try {
    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    tags = JSON.parse(cleaned);
    // Validate all tags are in taxonomy
    tags = tags.filter((t) => TAXONOMY.includes(t));
    if (tags.length === 0) throw new Error("No valid tags");
  } catch {
    console.error(`  x ${postSlug}: could not parse tags: ${responseText}`);
    return;
  }

  // Save to tags.json
  const tagsPath = path.join(process.cwd(), "app", "lib", "tags.json");
  const existing = fs.existsSync(tagsPath)
    ? JSON.parse(fs.readFileSync(tagsPath, "utf-8"))
    : {};
  existing[postSlug] = { tags, readingTime: rt, wordCount: words };
  fs.writeFileSync(tagsPath, JSON.stringify(existing, null, 2));

  console.log(`  ✓ tags: [${tags.join(", ")}]`);
  console.log(`  ✓ reading time: ${rt} (${words} words)\n`);
}

async function main() {
  if (arg === "--all") {
    const postsRaw = fs.readFileSync(
      path.join(process.cwd(), "app", "lib", "posts.ts"),
      "utf-8"
    );
    const slugs = [...postsRaw.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
    console.log(`Generating tags for ${slugs.length} posts...\n`);
    for (const s of slugs) {
      await generateForSlug(s);
    }
    console.log("Done.");
  } else {
    await generateForSlug(arg);
  }
}

main().catch(console.error);
