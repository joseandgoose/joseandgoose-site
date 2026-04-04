import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Upgraded Search to Semantic Vector Embeddings — Jose and Goose",
  description: "From keyword matching to meaning-based search using pgvector, Supabase, and Hugging Face — and why it's the foundation for Ask Goose",
};

export default function HowIUpgradedSearchToVectors() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>April 4, 2026</span>
        <span className="post-meta-dot">&middot;</span>
        <span>4 min read</span>
      </div>
      <PostTags slug="how-i-upgraded-search-to-vectors" />

      <h1 className="post-title">How I Upgraded Search to Semantic Vector Embeddings</h1>
      <p className="post-subtitle">
        From keyword matching to meaning-based search using pgvector, Supabase, and Hugging Face &mdash; and why it&rsquo;s the foundation for Ask Goose
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              Semantic search on{" "}
              <a href="https://www.joseandgoose.com" target="_blank" rel="noopener noreferrer">
                joseandgoose.com
              </a>{" "}
              &mdash; type &ldquo;game theory&rdquo; or &ldquo;firewall&rdquo; into the search bar
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (first time working with vector embeddings and pgvector)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours in a single morning session</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-upgraded-search-to-vectors" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            &mdash; terminal-based AI for direct file editing <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a></strong>{" "}
            with <strong>pgvector</strong> extension &mdash; Postgres database with vector similarity search <em>(free tier)</em>
          </li>
          <li>
            <strong><a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">Hugging Face</a></strong>{" "}
            Inference API &mdash; hosted embedding model for converting text to vectors <em>(free tier)</em>
          </li>
          <li>
            <strong>@xenova/transformers</strong>{" "}
            &mdash; local embedding model for generating content vectors at build time <em>(free)</em>
          </li>
        </ul>

        {/* ── What Changed ── */}
        <h2>What Changed and Why It Matters</h2>
        <p>
          The site already had{" "}
          <Link href="/writing/how-i-built-search">a self-updating search bar</Link> &mdash; a
          build script generates a JSON index of every page, post, and feature, and the search bar
          filters that list client-side as you type. It was fast and reliable, but it could only
          find things when your words matched the text. Searching &ldquo;firewall&rdquo;
          returned nothing because no title or description contained the word
          &ldquo;firewall,&rdquo; even though{" "}
          <Link href="/writing/how-i-secured-linux-server">an entire post</Link> existed about
          configuring one.
        </p>

        <p>
          The upgrade: every piece of content on the site now has a <strong>vector embedding</strong> &mdash;
          a list of 384 numbers that represent the meaning of that content. When you search, your
          query gets converted to the same kind of vector, and the database finds whichever
          content is closest in meaning. The word &ldquo;firewall&rdquo; doesn&rsquo;t need to
          appear anywhere &mdash; the model understands that firewalls relate to server security.
        </p>

        {/* ── Vector Embedding Visualization ── */}
        <div className="post-visual" style={{ padding: "24px 0" }}>
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "520px",
            margin: "0 auto",
            aspectRatio: "520 / 400",
          }}>
            <svg viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
              {/* Axes */}
              <line x1="60" y1="350" x2="500" y2="350" stroke="var(--rule)" strokeWidth="1" />
              <line x1="60" y1="350" x2="60" y2="30" stroke="var(--rule)" strokeWidth="1" />

              {/* Axis labels */}
              <text x="280" y="390" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="11">dimension 1</text>
              <text x="20" y="190" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="11" transform="rotate(-90, 20, 190)">dimension 2</text>

              {/* Cluster: Security (top-left area) */}
              <circle cx="145" cy="105" r="60" fill="var(--forest)" opacity="0.06" stroke="var(--forest)" strokeWidth="1" strokeDasharray="4 3" />
              <text x="145" y="48" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="10" fontWeight="600" opacity="0.6">SECURITY</text>

              {/* Cluster: Games (right area) */}
              <circle cx="390" cy="160" r="55" fill="#F3D104" opacity="0.1" stroke="#D4B200" strokeWidth="1" strokeDasharray="4 3" />
              <text x="390" y="108" textAnchor="middle" fill="#9E8600" fontFamily="var(--sans)" fontSize="10" fontWeight="600" opacity="0.8">GAMES</text>

              {/* Cluster: Automation (bottom-center) */}
              <circle cx="270" cy="270" r="65" fill="var(--forest)" opacity="0.04" stroke="var(--forest)" strokeWidth="1" strokeDasharray="4 3" />
              <text x="270" y="210" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="10" fontWeight="600" opacity="0.6">AUTOMATION</text>

              {/* Content dots */}
              {/* Security cluster */}
              <circle cx="120" cy="100" r="5" fill="var(--forest)" />
              <text x="120" y="88" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">Secured Linux</text>
              <circle cx="170" cy="120" r="5" fill="var(--forest)" />
              <text x="170" y="138" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">API Server</text>

              {/* Games cluster */}
              <circle cx="375" cy="150" r="5" fill="#D4B200" />
              <text x="375" y="140" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">Numerator</text>
              <circle cx="410" cy="175" r="5" fill="#D4B200" />
              <text x="410" y="193" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">TrophyManager</text>

              {/* Automation cluster */}
              <circle cx="240" cy="260" r="5" fill="var(--forest)" />
              <text x="240" y="252" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">Garmin Recaps</text>
              <circle cx="290" cy="285" r="5" fill="var(--forest)" />
              <text x="290" y="303" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">Market Briefing</text>
              <circle cx="260" cy="310" r="5" fill="var(--forest)" />
              <text x="260" y="328" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="9">Cron Ops</text>

              {/* Query: "firewall" — arrow pointing to security cluster */}
              <circle cx="105" cy="155" r="7" fill="none" stroke="#c0392b" strokeWidth="2" />
              <text x="105" y="175" textAnchor="middle" fill="#c0392b" fontFamily="var(--sans)" fontSize="10" fontWeight="600">&quot;firewall&quot;</text>

              {/* Dashed line from query to nearest content */}
              <line x1="110" y1="150" x2="118" y2="106" stroke="#c0392b" strokeWidth="1.5" strokeDasharray="4 3" />

              {/* Query: "game theory" */}
              <circle cx="420" cy="130" r="7" fill="none" stroke="#c0392b" strokeWidth="2" />
              <text x="455" y="126" textAnchor="middle" fill="#c0392b" fontFamily="var(--sans)" fontSize="10" fontWeight="600">&quot;game</text>
              <text x="455" y="138" textAnchor="middle" fill="#c0392b" fontFamily="var(--sans)" fontSize="10" fontWeight="600">theory&quot;</text>

              {/* Dashed line from query to nearest content */}
              <line x1="414" y1="135" x2="380" y2="148" stroke="#c0392b" strokeWidth="1.5" strokeDasharray="4 3" />

              {/* Legend — top of chart */}
              <circle cx="160" cy="18" r="4" fill="var(--forest)" />
              <text x="170" y="22" fill="var(--stone)" fontFamily="var(--sans)" fontSize="10">Content</text>
              <circle cx="240" cy="18" r="5" fill="none" stroke="#c0392b" strokeWidth="1.5" />
              <text x="250" y="22" fill="var(--stone)" fontFamily="var(--sans)" fontSize="10">Search query</text>
              <line x1="340" y1="18" x2="360" y2="18" stroke="#c0392b" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="367" y="22" fill="var(--stone)" fontFamily="var(--sans)" fontSize="10">Nearest match</text>
            </svg>
          </div>
          <p className="post-visual-caption">
            Each piece of content becomes a point in 384-dimensional space. Similar content clusters together.
            A search query lands near the content it&rsquo;s about &mdash; even without matching any keywords.
          </p>
        </div>

        <div className="post-tip">
          <span className="post-tip-label">How it works in practice</span>
          <p>
            Keyword search still runs first, instantly, client-side &mdash; same as before. Vector
            search only fires as a fallback when keyword matching returns zero results. You get
            the speed of the old system for obvious queries and the intelligence of the new system
            for everything else.
          </p>
        </div>

        {/* ── pgvector Setup ── */}
        <h2>The pgvector Setup in Supabase</h2>
        <p>
          Supabase runs on Postgres, and Postgres has an extension called <strong>pgvector</strong>{" "}
          that adds a native vector column type and distance operators. Enabling it was one line
          of SQL: <code>create extension if not exists vector</code>. After that, I created a{" "}
          <code>content_embeddings</code> table with a <code>vector(384)</code> column &mdash;
          each row stores one piece of content alongside its embedding.
        </p>

        <h4 className="post-dev-heading">&#128295; Developer section: Schema and search function</h4>
        <ul>
          <li>
            <code>content_embeddings</code> table with columns: <code>content_type</code>,{" "}
            <code>slug</code>, <code>title</code>, <code>url</code>, <code>description</code>,{" "}
            <code>embedding vector(384)</code>, and a <code>unique(content_type, slug)</code>{" "}
            constraint for upserts
          </li>
          <li>
            HNSW index on the embedding column with <code>vector_cosine_ops</code> &mdash;
            this is the data structure that makes similarity lookups fast instead of scanning
            every row
          </li>
          <li>
            A <code>search_content</code> RPC function that takes a query vector, computes{" "}
            <code>1 - (embedding {"<=>"} query_embedding)</code> as similarity, filters by a
            0.2 threshold, and returns the top 6 matches ranked by closeness
          </li>
          <li>
            Row-level security allows public reads &mdash; embeddings aren&rsquo;t sensitive data
          </li>
        </ul>

        <p>
          Content embeddings are generated locally using <code>@xenova/transformers</code> with
          the <code>all-MiniLM-L6-v2</code> model &mdash; a build script reads the search index
          and TL;DR summaries, generates vectors for all 24 items, and upserts them to Supabase.
          At query time, the Vercel API route sends your search text to Hugging Face&rsquo;s
          hosted version of the same model, gets a vector back, and passes it to the Supabase
          RPC function. Same model on both sides means the vectors are comparable.
        </p>

        {/* ── Side-by-Side ── */}
        <h2>Keyword vs. Semantic: Side-by-Side</h2>

        <div className="post-visual">
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--sans)", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--rule)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Query</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Keyword Search</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Semantic Search</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                <td style={{ padding: "8px 12px" }}>&ldquo;firewall&rdquo;</td>
                <td style={{ padding: "8px 12px", color: "var(--stone)" }}>No results</td>
                <td style={{ padding: "8px 12px" }}>How I Secured the Home Linux Server</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                <td style={{ padding: "8px 12px" }}>&ldquo;health data&rdquo;</td>
                <td style={{ padding: "8px 12px", color: "var(--stone)" }}>No results</td>
                <td style={{ padding: "8px 12px" }}>How I Automated Daily Garmin Recaps</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                <td style={{ padding: "8px 12px" }}>&ldquo;game theory&rdquo;</td>
                <td style={{ padding: "8px 12px", color: "var(--stone)" }}>No results</td>
                <td style={{ padding: "8px 12px" }}>Numerator + How I Built Numerator</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                <td style={{ padding: "8px 12px" }}>&ldquo;email automation&rdquo;</td>
                <td style={{ padding: "8px 12px", color: "var(--stone)" }}>No results</td>
                <td style={{ padding: "8px 12px" }}>How I Built a Market Briefing</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px" }}>&ldquo;Numerator&rdquo;</td>
                <td style={{ padding: "8px 12px" }}>Numerator (instant)</td>
                <td style={{ padding: "8px 12px", color: "var(--stone)" }}>Not needed &mdash; keyword handles it</td>
              </tr>
            </tbody>
          </table>
          <p className="post-visual-caption">
            Keyword search is still the first pass for exact matches. Semantic search catches everything keyword misses.
          </p>
        </div>

        {/* ── Where It Got It Wrong ── */}
        <h2>Where Semantic Search Got It Wrong</h2>
        <p>
          Searching &ldquo;theory&rdquo; by itself returned nothing. That felt wrong &mdash;
          there&rsquo;s a post about building Numerator, which is based on a game theory puzzle.
          But &ldquo;theory&rdquo; alone is genuinely ambiguous. Game theory, music theory, color
          theory &mdash; the model can&rsquo;t know which you mean, so every piece of content
          scores below the similarity threshold. Adding one word of context &mdash;
          &ldquo;game theory&rdquo; &mdash; immediately surfaced Numerator as the top result.
        </p>

        <p>
          This is a feature, not a bug, but it&rsquo;s worth naming: semantic search rewards
          specificity. Vague queries get vague results. The system is honest about what it
          doesn&rsquo;t know rather than guessing &mdash; a property I&rsquo;d rather keep than
          tune away.
        </p>

        {/* ── Ask Goose ── */}
        <h2>Why This Enables A Future Feature: Ask Goose</h2>
        <p>
          Vector search is half of a pattern called <strong>RAG</strong> &mdash; retrieval-augmented
          generation. The idea: instead of asking an AI to answer a question from memory (where
          it might hallucinate), you first retrieve the most relevant content from your own data,
          then pass that content to the AI as context. The AI answers based on what you actually
          wrote, not what it imagines you wrote.
        </p>

        <p>
          With embeddings in Supabase and a similarity search function already working, the
          retrieval half is done. Ask Goose &mdash; a conversational search feature where
          visitors can ask Goose questions about the site and get answers grounded in real
          content &mdash; becomes a matter of wiring the retrieval results into a{" "}
          <Link href="/writing/how-i-built-tldr">Claude API call</Link>.
          The vector infrastructure built today is the foundation that makes it possible.
          Instead of building search and then rebuilding for AI, I built the AI-ready version first.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Pattern worth noting</span>
          <p>
            Building the retrieval layer before the generation layer forces you to get the data
            quality right first. If the embeddings return irrelevant results, no amount of prompt
            engineering will fix the answers. By validating search quality now, Ask Goose
            inherits a tested foundation instead of debugging two problems at once.
          </p>
        </div>
      <RelatedPosts slug="how-i-upgraded-search-to-vectors" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
