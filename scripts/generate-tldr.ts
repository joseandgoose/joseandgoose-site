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

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: tsx scripts/generate-tldr.ts <slug>");
  console.error("       tsx scripts/generate-tldr.ts --all");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateForSlug(postSlug: string) {
  const postPath = path.join(
    process.cwd(),
    "app",
    "writing",
    postSlug,
    "page.tsx"
  );

  if (!fs.existsSync(postPath)) {
    console.error(`No post found at ${postPath}`);
    return;
  }

  const raw = fs.readFileSync(postPath, "utf-8");

  // Strip JSX/TSX to extract readable prose
  const text = raw
    .replace(/import[^\n]+\n/g, "")
    .replace(/export\s+(default\s+)?function[^{]+\{/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  console.log(`Generating TL;DR for: ${postSlug}...`);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Write a TL;DR summary in 2–3 sentences for this blog post. Audience: PMs and tech-adjacent readers. Tone: direct, no fluff. Focus on what was built and what was learned. Do not start with "TL;DR" — just write the sentences.\n\n${text}`,
      },
    ],
  });

  const summary = (message.content[0] as { text: string }).text.trim();

  // Save to tldr.json
  const tldrPath = path.join(process.cwd(), "app", "lib", "tldr.json");
  const existing = JSON.parse(fs.readFileSync(tldrPath, "utf-8"));
  existing[postSlug] = summary;
  fs.writeFileSync(tldrPath, JSON.stringify(existing, null, 2));

  console.log(`✓ ${postSlug}`);
  console.log(`  "${summary}"\n`);
}

async function main() {
  if (slug === "--all") {
    // Read all slugs from posts.ts
    const postsRaw = fs.readFileSync(
      path.join(process.cwd(), "app", "lib", "posts.ts"),
      "utf-8"
    );
    const slugs = [...postsRaw.matchAll(/slug:\s*"([^"]+)"/g)].map(
      (m) => m[1]
    );
    console.log(`Generating TL;DRs for ${slugs.length} posts...\n`);
    for (const s of slugs) {
      await generateForSlug(s);
    }
    console.log("Done.");
  } else {
    await generateForSlug(slug);
  }
}

main().catch(console.error);
