/**
 * Refresh the homepage "Popular posts" list from real GA4 traffic.
 *
 * Reads ~/ga-diagnostics/ga.db on Alienware over SSH, ranks /writing/* pages by
 * total views, keeps the top 3 that still exist in app/lib/posts.ts, and writes
 * app/lib/top-posts.json (which the homepage imports).
 *
 * Run locally before deploying — `npm run deploy` does this automatically.
 * If Alienware is unreachable (e.g. a Vercel cloud build), it logs a warning and
 * keeps the existing snapshot so the build never fails.
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import { posts } from "../app/lib/posts";

const ROOT = process.cwd();
const PY = join(ROOT, "scripts", "_ga_top.py");
const OUT = join(ROOT, "app", "lib", "top-posts.json");
const validSlugs = new Set(posts.map((p) => p.slug));

try {
  const raw = execSync(
    `ssh -o ConnectTimeout=15 alienware 'cd ~/ga-diagnostics && python3' < "${PY}"`,
    { encoding: "utf8" }
  );
  const rows = JSON.parse(raw.trim()) as [string, number][];
  const ranked = rows
    .map(([p]) => p.replace(/^\/writing\//, "").replace(/\/$/, ""))
    .filter((s) => validSlugs.has(s));
  const slugs = [...new Set(ranked)].slice(0, 3);
  if (slugs.length < 3) throw new Error(`resolved only ${slugs.length} valid post slugs`);

  const data = { generated: new Date().toISOString().slice(0, 10), slugs };
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ top-posts.json refreshed from GA4: ${slugs.join(", ")}`);
} catch (err) {
  console.warn(
    `⚠ top-posts refresh skipped — keeping existing snapshot (${(err as Error).message})`
  );
  process.exitCode = 0; // never break the deploy on a transient GA/SSH failure
}
