import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";

// ── Load .env.local (tsx doesn't auto-load it) ──
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

type Chunk = {
  content_type: string;
  source_id: string;
  chunk_index: number;
  title: string;
  section: string | null;
  chunk_text: string;
  url: string | null;
  metadata: Record<string, unknown>;
};

// ── JSX Text Extraction ──────────────────────────

function stripJsx(raw: string): string {
  return raw
    .replace(/import[^\n]+\n/g, "")
    .replace(/export\s+(default\s+)?function[^{]+\{/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a post TSX file into sections by <h2> tags */
function splitByH2(raw: string): { heading: string | null; text: string }[] {
  // Split on h2 opening tags, keeping the tag content
  const parts = raw.split(/(?=<h2[\s>])/);
  const sections: { heading: string | null; text: string }[] = [];

  for (const part of parts) {
    const h2Match = part.match(/<h2[^>]*>([^<]+)<\/h2>/);
    const heading = h2Match ? h2Match[1].replace(/&amp;/g, "&").trim() : null;
    const text = stripJsx(part);
    if (text.length > 20) {
      sections.push({ heading, text });
    }
  }

  return sections;
}

/** Split text into ~200 word chunks at paragraph boundaries */
function splitLongText(text: string, maxWords: number = 180): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (wordCount + words > maxWords && current.length > 0) {
      chunks.push(current.join(" "));
      current = [];
      wordCount = 0;
    }
    current.push(sentence);
    wordCount += words;
  }
  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

// ── Chunk Generators ─────────────────────────────

function generatePostChunks(): Chunk[] {
  const postsTs = fs.readFileSync(path.join(process.cwd(), "app", "lib", "posts.ts"), "utf-8");
  const tldrs: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "app", "lib", "tldr.json"), "utf-8")
  );
  const tagsData: Record<string, { tags: string[] }> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "app", "lib", "tags.json"), "utf-8")
  );

  // Extract slugs, titles, subtitles from posts.ts
  const slugMatches = [...postsTs.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  const titleMatches = [...postsTs.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
  const subtitleMatches = [...postsTs.matchAll(/subtitle:\s*"([^"]+)"/g)].map((m) => m[1]);

  const chunks: Chunk[] = [];

  for (let i = 0; i < slugMatches.length; i++) {
    const slug = slugMatches[i];
    const title = titleMatches[i] || slug;
    const subtitle = subtitleMatches[i] || "";
    const tldr = tldrs[slug] || "";
    const tags = tagsData[slug]?.tags || [];

    const postPath = path.join(process.cwd(), "app", "writing", slug, "page.tsx");
    if (!fs.existsSync(postPath)) continue;

    const raw = fs.readFileSync(postPath, "utf-8");

    // Chunk 0: Summary (title + subtitle + TLDR)
    const summaryText = `${title}. ${subtitle}. ${tldr}`;
    chunks.push({
      content_type: "post",
      source_id: slug,
      chunk_index: 0,
      title,
      section: "Summary",
      chunk_text: summaryText,
      url: `/writing/${slug}`,
      metadata: { tags },
    });

    // Chunks 1+: Split by H2 sections
    const sections = splitByH2(raw);
    let chunkIdx = 1;

    for (const section of sections) {
      // Skip if this is the pre-h2 content (recipe card area) — already covered by summary
      if (!section.heading && chunkIdx === 1) {
        // Still include it if it has substantial content
        if (section.text.split(/\s+/).length < 30) continue;
      }

      const subChunks = splitLongText(section.text);
      for (const text of subChunks) {
        // Prefix each chunk with post title for context grounding
        const grounded = section.heading
          ? `${title} — ${section.heading}: ${text}`
          : `${title}: ${text}`;

        chunks.push({
          content_type: "post",
          source_id: slug,
          chunk_index: chunkIdx++,
          title,
          section: section.heading,
          chunk_text: grounded,
          url: `/writing/${slug}`,
          metadata: { tags },
        });
      }
    }
  }

  return chunks;
}

function generateResumeChunks(): Chunk[] {
  const resume = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "resume.json"), "utf-8")
  );
  const chunks: Chunk[] = [];

  // Overview chunk
  chunks.push({
    content_type: "resume",
    source_id: "resume",
    chunk_index: 0,
    title: "Jose Delgado — Career Overview",
    section: "Overview",
    chunk_text: resume.overview.headline,
    url: "/about",
    metadata: {},
  });

  // Role chunks
  for (let i = 0; i < resume.roles.length; i++) {
    const role = resume.roles[i];
    chunks.push({
      content_type: "resume",
      source_id: "resume",
      chunk_index: i + 1,
      title: `${role.title} at ${role.company}`,
      section: role.company,
      chunk_text: `${role.title} at ${role.company} (${role.dates}). ${role.description}`,
      url: "/work-and-projects",
      metadata: { company: role.company, dates: role.dates, domain: role.domain },
    });
  }

  // Skills chunk
  const skillsIdx = resume.roles.length + 1;
  const eduText = resume.education
    .map((e: { institution: string; degree: string; year: string }) => `${e.degree}, ${e.institution} (${e.year})`)
    .join(". ");
  chunks.push({
    content_type: "resume",
    source_id: "resume",
    chunk_index: skillsIdx,
    title: "Jose Delgado — Skills & Education",
    section: "Skills & Education",
    chunk_text: `Skills: ${resume.overview.skills.join(", ")}. Education: ${eduText}.`,
    url: "/about",
    metadata: { skills: resume.overview.skills },
  });

  return chunks;
}

function generateProjectChunks(): Chunk[] {
  const projects = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "projects.json"), "utf-8")
  );

  return projects.map(
    (p: { id: string; name: string; category: string; tech_stack: string[]; status: string; url: string; description: string }, i: number) => ({
      content_type: "project",
      source_id: p.id,
      chunk_index: 0,
      title: p.name,
      section: p.category,
      chunk_text: `${p.name} (${p.category}). Tech stack: ${p.tech_stack.join(", ")}. ${p.description}`,
      url: p.url,
      metadata: { tech_stack: p.tech_stack, status: p.status, category: p.category },
    })
  );
}

function generatePromptChunks(): Chunk[] {
  const prompts = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "prompts.json"), "utf-8")
  );

  return prompts.map(
    (p: { id: string; name: string; category: string; model: string; use_case: string; prompt: string }) => ({
      content_type: "prompt",
      source_id: p.id,
      chunk_index: 0,
      title: p.name,
      section: p.category,
      chunk_text: `${p.name}. ${p.use_case} Prompt: ${p.prompt}`,
      url: null,
      metadata: { category: p.category, model: p.model },
    })
  );
}

// ── Main ─────────────────────────────────────────

async function main() {
  console.log("Loading embedding model (first run downloads ~30MB)...");
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  // Generate all chunks
  const postChunks = generatePostChunks();
  const resumeChunks = generateResumeChunks();
  const projectChunks = generateProjectChunks();
  const promptChunks = generatePromptChunks();

  const allChunks = [...postChunks, ...resumeChunks, ...projectChunks, ...promptChunks];

  console.log(`\nChunk counts:`);
  console.log(`  Posts:    ${postChunks.length}`);
  console.log(`  Resume:   ${resumeChunks.length}`);
  console.log(`  Projects: ${projectChunks.length}`);
  console.log(`  Prompts:  ${promptChunks.length}`);
  console.log(`  Total:    ${allChunks.length}\n`);

  // Clear existing rows to avoid stale data
  const { error: deleteError } = await supabase
    .from("rag_chunks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (deleteError) {
    console.error("Failed to clear existing chunks:", deleteError.message);
    return;
  }
  console.log("Cleared existing rag_chunks.\n");

  let success = 0;
  let failed = 0;

  for (const chunk of allChunks) {
    // Truncate to ~200 words for MiniLM's 256-token window
    const textToEmbed = chunk.chunk_text.split(/\s+/).slice(0, 200).join(" ");

    const output = await embedder(textToEmbed, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data as Float32Array);

    const { error } = await supabase.from("rag_chunks").upsert(
      {
        content_type: chunk.content_type,
        source_id: chunk.source_id,
        chunk_index: chunk.chunk_index,
        title: chunk.title,
        section: chunk.section,
        chunk_text: chunk.chunk_text,
        url: chunk.url,
        metadata: chunk.metadata,
        embedding: JSON.stringify(embedding),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_type,source_id,chunk_index" }
    );

    if (error) {
      console.error(`  x ${chunk.content_type}/${chunk.source_id}#${chunk.chunk_index}: ${error.message}`);
      failed++;
    } else {
      console.log(`  + ${chunk.content_type}/${chunk.source_id}#${chunk.chunk_index}: ${chunk.title}`);
      success++;
    }
  }

  console.log(`\nDone. ${success} embedded, ${failed} failed.`);
}

main().catch(console.error);
