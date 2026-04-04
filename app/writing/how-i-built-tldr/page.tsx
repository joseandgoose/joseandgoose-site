import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Added TL;DR by Goose AI Summaries — Jose and Goose",
  description: "Using Claude Haiku to generate static summaries at publish time — and why the architecture decision matters more than the feature itself",
};

export default function HowIBuiltTLDR() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 5, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>5 min read</span>
      </div>
      <PostTags slug="how-i-built-tldr" />

      <h1 className="post-title">How I Added &ldquo;TL;DR by Goose&rdquo; AI Summaries to Every Post</h1>
      <p className="post-subtitle">
        Using Claude Haiku to generate static summaries at publish time — and why the architecture decision matters more than the feature itself
      </p>

      <div className="post-body">
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>AI-generated TL;DR summaries on all 8 Writing posts, with a clickable Goose badge UI</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>2 / 5 — the script is simple; the architectural thinking is the real work</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~3 hours in one session</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-tldr" />

        {/* ── INGREDIENTS ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            — terminal-based AI for building the badge component and scripts <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://www.anthropic.com/api" target="_blank" rel="noopener noreferrer">Claude API — Haiku model</a></strong>{" "}
            — for generating the summaries <em>(own API key, pay-per-use)</em>
          </li>
          <li>
            <strong>@anthropic-ai/sdk</strong> — the official Anthropic npm package <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong>{" "}
            — the framework running the site <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a></strong>{" "}
            — hosting and deployment <em>(free)</em>
          </li>
        </ul>

        {/* ── THE PROBLEM ── */}
        <h2>What I Was Trying to Solve</h2>
        <p>
          Every post on this site is a long-form build log. Useful if you&rsquo;re going to read it,
          but there&rsquo;s no way to quickly gauge whether it&rsquo;s worth your time. I wanted a
          one-paragraph summary on each post — written by AI, not me — that a reader could expand
          before committing.
        </p>
        <p>
          The obvious implementation: call the Claude API on every page load and generate a summary
          in real time. I didn&rsquo;t do that. Here&rsquo;s why.
        </p>

        {/* ── ARCHITECTURE ── */}
        <h2>The Architecture Decision</h2>
        <p>
          Summaries don&rsquo;t need to be fresh. A post written in February doesn&rsquo;t need a
          new summary generated every time someone visits in March. Calling the API on every page
          load would mean: latency on every read, API costs that scale with traffic, and a broken
          experience if the API is down.
        </p>
        <p>
          Instead: generate once at publish time, save to a static JSON file, bundle it with the
          build. The reader gets an instant static string. Zero runtime API calls. Zero cost at scale.
        </p>
        <p>
          This is a build-vs-runtime decision — and it&rsquo;s the kind of product thinking that&rsquo;s
          worth making explicit, because the &ldquo;obvious&rdquo; implementation and the right
          implementation aren&rsquo;t always the same.
        </p>

        {/* ── THE BUILD ── */}
        <h2>The Build</h2>
        <p className="post-session-meta">Evening, March 5 — ~3 hours</p>

        <p>The system has three parts: a generation script, a static data file, and a badge component.</p>

        <h3>The Generation Script</h3>
        <p>
          <code>scripts/generate-tldr.ts</code> reads a post&rsquo;s TSX file, strips the JSX tags
          to extract readable prose, sends it to Claude Haiku with a tight prompt, and writes the
          result to <code>app/lib/tldr.json</code>. Running{" "}
          <code>npx tsx scripts/generate-tldr.ts --all</code> batched all 8 posts in about 30 seconds.
        </p>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal</span>
            </div>
            <div className="post-terminal-body">
              <div>
                <span className="post-terminal-prompt">user@MacBook-Air</span>{" "}
                joseandgoose-site-main % <span className="post-terminal-cmd">npx tsx scripts/generate-tldr.ts --all</span>
              </div>
              <div className="post-terminal-dim">Generating TL;DRs for 8 posts...</div>
              <br />
              <div><span className="post-terminal-success">✓</span> how-i-built-search</div>
              <div><span className="post-terminal-success">✓</span> how-i-automated-garmin-recaps</div>
              <div><span className="post-terminal-success">✓</span> how-i-replaced-google-forms</div>
              <div><span className="post-terminal-success">✓</span> how-i-built-greetings</div>
              <div><span className="post-terminal-success">✓</span> how-i-built-footer</div>
              <div><span className="post-terminal-success">✓</span> how-i-built-numerator</div>
              <div><span className="post-terminal-success">✓</span> gemini-grades</div>
              <div><span className="post-terminal-success">✓</span> how-i-built-this</div>
              <br />
              <div className="post-terminal-dim">Done.</div>
            </div>
          </div>
          <p className="post-visual-caption">
            8 summaries generated in ~30 seconds. Results saved to <code>app/lib/tldr.json</code>.
          </p>
        </div>

        <h4 className="post-dev-heading">🔧 Developer section: generation script</h4>
        <ul>
          <li>Script lives at <code>scripts/generate-tldr.ts</code> and runs with <code>npx tsx</code> — no global install needed</li>
          <li>JSX stripping uses a regex to remove all HTML/JSX tags and collapse whitespace, leaving only readable prose for the Haiku prompt</li>
          <li>The <code>--all</code> flag reads slugs directly from <code>app/lib/posts.ts</code> so the script stays in sync with the post list — no separate config to maintain</li>
          <li>Each result is written to <code>app/lib/tldr.json</code> keyed by slug; existing entries are preserved unless explicitly overwritten</li>
          <li>Haiku is called with <code>max_tokens: 200</code> and a single <code>user</code> message — no system prompt, no conversation history</li>
        </ul>

        <h3>The Badge Component</h3>
        <p>
          <code>TLDRBadge.tsx</code> reads from the JSON file and renders a collapsed pill —
          Goose&rsquo;s photo, the label &ldquo;TL;DR by Goose&rdquo;, a chevron — that expands
          on click to show the summary. No API calls. No loading state. Just a static string pulled
          from a bundled JSON file.
        </p>
        <p>
          Going forward, the workflow is: write post → run the script for that slug → deploy.
          One extra command per publish.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: TLDRBadge component</h4>
        <ul>
          <li><code>TLDRBadge.tsx</code> is a <code>&quot;use client&quot;</code> component — required because it uses <code>useState</code> for the expand/collapse toggle</li>
          <li>The JSON file is imported statically: <code>import tldr from &quot;@/app/lib/tldr.json&quot;</code> — Next.js bundles it at build time, so no runtime fetch</li>
          <li>The Goose avatar is rendered with <code>next/image</code> at 39×39px with <code>border-radius: 50%</code> applied via CSS</li>
          <li>If no summary exists for the slug, the component returns <code>null</code> — silent no-op, no broken UI</li>
          <li>The chevron rotates via a conditional CSS class (<code>tldr-chevron-open</code>) rather than inline styles, keeping animation in CSS</li>
        </ul>

        {/* ── FAILURE & FALLBACK ── */}
        <h2>Failure &amp; Fallback</h2>

        <h3>The env var that wasn&rsquo;t there</h3>
        <p>
          The first run produced nothing. The script ran, printed no errors, and{" "}
          <code>tldr.json</code> stayed empty.
        </p>
        <p>
          The issue: <code>tsx</code> doesn&rsquo;t auto-load <code>.env.local</code>. The{" "}
          <code>ANTHROPIC_API_KEY</code> was set locally but the script couldn&rsquo;t see it,
          so the Anthropic client initialized without a key and failed silently. The fix was
          adding a few lines to the script to manually read and parse <code>.env.local</code>{" "}
          before initializing the client.
        </p>
        <p>
          This is the kind of failure that&rsquo;s easy to miss: no crash, no error message,
          just a quiet no-op. If I hadn&rsquo;t checked <code>tldr.json</code> after the run,
          I might have deployed empty summaries and not noticed until a reader clicked the badge.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: env var loading</h4>
        <ul>
          <li><code>tsx</code> is a TypeScript script runner — it does not replicate Next.js&rsquo;s environment loading behavior, so <code>.env.local</code> is invisible to it by default</li>
          <li>Fix: read the file with <code>fs.readFileSync</code>, split on newlines, parse each <code>KEY=value</code> pair, and assign to <code>process.env</code> before the Anthropic client is initialized</li>
          <li>The Anthropic SDK fails silently when no API key is present — it initializes but returns empty responses rather than throwing, which is why the script appeared to succeed</li>
          <li>Alternative fix: prefix the command with <code>ANTHROPIC_API_KEY=... npx tsx ...</code> inline — but the manual parse approach keeps the script self-contained</li>
        </ul>

        <h3>Haiku doesn&rsquo;t count sentences</h3>
        <p>
          The prompt said &ldquo;write a TL;DR in 2–3 sentences.&rdquo; Several summaries came
          back as 4–6 sentences, reading more like dense paragraphs than quick previews. The
          content quality was good, so I kept them rather than re-running with a tighter prompt.
        </p>
        <p>
          That&rsquo;s a tradeoff worth flagging: Haiku treats length instructions as guidance,
          not hard constraints. If you need strict length control, you either post-process the
          output or add more explicit constraints and re-run. For now, the summaries work. But
          that&rsquo;s a known rough edge, not a solved problem.
        </p>

        {/* ── FINAL OUTPUT ── */}
        <h2>Final Output</h2>
        <p>
          A clickable &ldquo;TL;DR by Goose&rdquo; badge on all 8 Writing posts, powered by
          Claude Haiku, with zero runtime API calls and instant load time. The Anthropic API key
          stays local. The summaries ship as static JSON. Readers get a one-click preview before
          committing to a full read.
        </p>
        <p>
          The bigger win: the generation script is now part of the publishing workflow. Every
          future post gets a Haiku-generated summary in 30 seconds, as part of the same session
          that writes and deploys the post.
        </p>
      </div>
      <RelatedPosts slug="how-i-built-tldr" />

      <div className="post-back post-back--bottom">
        <Link href="/writing">← Back to all writing</Link>
      </div>
    </article>
  );
}
