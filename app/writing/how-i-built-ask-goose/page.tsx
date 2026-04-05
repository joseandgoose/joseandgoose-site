import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built Ask Goose, a RAG Chatbot for My Personal Site — Jose and Goose",
  description: "A streaming AI chatbot grounded in 300+ content chunks, powered by Claude Haiku, Supabase pgvector, and a floating widget that follows you across the site",
};

export default function HowIBuiltAskGoose() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>April 4, 2026</span>
        <span className="post-meta-dot">&middot;</span>
        <span>8 min read</span>
      </div>
      <PostTags slug="how-i-built-ask-goose" />

      <h1 className="post-title">How I Built Ask Goose, a RAG Chatbot for My Personal Site</h1>
      <p className="post-subtitle">
        A streaming AI chatbot grounded in real content &mdash; 291 embedded chunks, keyword-boosted retrieval, page-aware context, and a floating widget that knows where you are on the site
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              A conversational AI assistant at{" "}
              <a href="https://www.joseandgoose.com/ask-goose" target="_blank" rel="noopener noreferrer">
                joseandgoose.com/ask-goose
              </a>{" "}
              and a floating widget on every page &mdash; try it in the bottom right corner
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Advanced (RAG pipeline, streaming API, pgvector chunking, Supabase schema design, session management)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~6 hours in a single session &mdash; from schema design to live deployment with QA grading</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-ask-goose" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            &mdash; terminal-based AI for direct file editing <em>($200/yr)</em>
          </li>
          <li>
            <strong>Claude Haiku API</strong>{" "}
            &mdash; the LLM behind Goose&rsquo;s responses, streaming via Server-Sent Events <em>(~$0.01/conversation)</em>
          </li>
          <li>
            <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a></strong>{" "}
            with <strong>pgvector</strong> &mdash; vector storage, chat sessions, message history <em>(free tier)</em>
          </li>
          <li>
            <strong><a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">Hugging Face</a></strong>{" "}
            Inference API &mdash; query embedding at runtime via all-MiniLM-L6-v2 <em>(free tier)</em>
          </li>
          <li>
            <strong>@xenova/transformers</strong>{" "}
            &mdash; local embedding model for build-time chunk vectorization <em>(free)</em>
          </li>
          <li>
            <strong>Ollama + qwen2.5</strong>{" "}
            &mdash; local LLM on the Alienware server for automated QA grading <em>(free)</em>
          </li>
        </ul>

        {/* ── What It Is ── */}
        <h2>What Ask Goose Is and Why It&rsquo;s the Capstone</h2>
        <p>
          Ask Goose is a chatbot that answers questions about me, my work, my projects, and
          the technical content on this site. It doesn&rsquo;t make things up &mdash; every
          answer is grounded in actual content I&rsquo;ve written, structured data I&rsquo;ve
          curated, and metadata I&rsquo;ve generated across 19 posts and 6 projects.
        </p>
        <p>
          Under the hood, it uses a technique called <strong>RAG</strong> &mdash; which stands
          for <strong>Retrieval-Augmented Generation</strong>. Here&rsquo;s the plain-English
          version: instead of asking an AI to answer your question purely from memory (where
          it might confidently make something up), the system first <em>searches</em> through
          everything I&rsquo;ve actually written to find the most relevant pieces, then hands
          those pieces to the AI and says &ldquo;answer based on this.&rdquo; Think of it like
          the difference between asking someone a question from memory versus handing them the
          right page of a book and saying &ldquo;the answer is in here somewhere.&rdquo;
        </p>
        <p>
          This makes Ask Goose fundamentally different from the{" "}
          <Link href="/writing/how-i-built-search">search bar</Link> that already existed on
          the site. Search gives you a list of links and says &ldquo;one of these probably
          has what you need.&rdquo; Ask Goose reads the content for you and gives you the
          answer directly &mdash; with links to the sources so you can verify or go deeper.
          The AI doesn&rsquo;t replace the search &mdash; it builds on top of the same
          vector infrastructure to have an actual conversation about what&rsquo;s here.
        </p>
        <p>
          If you&rsquo;ve been following this series, Ask Goose is the point where everything
          converges. The{" "}
          <Link href="/writing/how-i-built-search">search bar</Link> gave me a content index.{" "}
          <Link href="/writing/how-i-upgraded-search-to-vectors">Semantic search</Link>{" "}
          gave me vector embeddings and pgvector infrastructure.{" "}
          <Link href="/writing/how-i-built-tldr">TL;DR by Goose</Link> proved that Claude
          could summarize my content well. The{" "}
          <Link href="/writing/how-i-built-content-pipeline">content pipeline</Link>{" "}
          automated tags, related posts, and reading times. Ask Goose takes all of
          that &mdash; the embeddings, the summaries, the structured data &mdash; and makes
          it conversational. It&rsquo;s the feature that every earlier feature was quietly building toward.
        </p>

        {/* ── Architecture ── */}
        <h2>Architecture: How the Pieces Fit</h2>
        <p>
          The system has three layers: a <strong>content chunking pipeline</strong> that runs
          at build time, a <strong>retrieval + generation API</strong> that runs at query time,
          and a <strong>frontend</strong> that handles streaming display and session persistence.
        </p>
        <p>
          At build time, a script reads every writing post, splits it by H2 headings into
          individual sections, and generates a 384-dimensional embedding for each chunk. It does
          the same for structured data files &mdash; resume roles, project descriptions, and
          prompt library entries. The result: <strong>291 chunks</strong> stored in a{" "}
          <code>rag_chunks</code> table in Supabase with vector indexes for fast similarity search.
        </p>
        <p>
          At query time, the user&rsquo;s question hits <code>/api/chat</code>. The API embeds
          the question via Hugging Face, runs a vector similarity search against the chunks,
          applies keyword-based forced retrieval for known topics (career, tech stack, projects),
          injects the current page path for context awareness, and streams the top chunks
          into Claude Haiku with a system prompt that tells Goose to be concise, cite sources,
          and redirect to <Link href="/contact">/contact</Link> when it doesn&rsquo;t know.
        </p>

        {/* ── Architecture Diagram ── */}
        <div className="post-visual" style={{ padding: "24px 0" }}>
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "620px",
            margin: "0 auto",
            aspectRatio: "620 / 520",
          }}>
            <svg viewBox="0 0 620 520" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>

              {/* ── Title ── */}
              <text x="310" y="22" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="13" fontWeight="700">How Ask Goose answers a question</text>

              {/* ── BUILD TIME (left column) ── */}
              <text x="130" y="52" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9" fontWeight="600" letterSpacing="1.5">BUILD TIME (once)</text>

              {/* Source boxes */}
              <rect x="30" y="66" width="200" height="32" rx="6" fill="var(--forest-pale)" stroke="var(--forest)" strokeWidth="1" />
              <text x="130" y="87" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="11" fontWeight="600">19 Writing Posts (TSX)</text>

              <rect x="30" y="106" width="200" height="32" rx="6" fill="var(--forest-pale)" stroke="var(--forest)" strokeWidth="1" />
              <text x="130" y="127" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="11" fontWeight="600">Resume + Projects + Prompts</text>

              {/* Arrow down */}
              <line x1="130" y1="138" x2="130" y2="160" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="124,156 130,166 136,156" fill="var(--stone)" />

              {/* Chunking box */}
              <rect x="40" y="170" width="180" height="40" rx="8" fill="var(--white)" stroke="var(--rule)" strokeWidth="1.5" />
              <text x="130" y="186" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="10" fontWeight="600">Split by H2 sections</text>
              <text x="130" y="200" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">+ embed with MiniLM (384-dim)</text>

              {/* Arrow down */}
              <line x1="130" y1="210" x2="130" y2="232" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="124,228 130,238 136,228" fill="var(--stone)" />

              {/* Supabase box */}
              <rect x="30" y="242" width="200" height="44" rx="8" fill="#264635" stroke="#264635" strokeWidth="1.5" />
              <text x="130" y="260" textAnchor="middle" fill="white" fontFamily="var(--sans)" fontSize="11" fontWeight="700">Supabase pgvector</text>
              <text x="130" y="276" textAnchor="middle" fill="#a8d4b8" fontFamily="var(--sans)" fontSize="10">304 chunks + embeddings</text>

              {/* ── QUERY TIME (right column) ── */}
              <text x="440" y="52" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9" fontWeight="600" letterSpacing="1.5">QUERY TIME (each question)</text>

              {/* User question */}
              <rect x="340" y="66" width="200" height="36" rx="18" fill="var(--forest)" stroke="var(--forest)" strokeWidth="1.5" />
              <text x="440" y="89" textAnchor="middle" fill="white" fontFamily="var(--sans)" fontSize="11" fontWeight="600">&quot;What tech powers this site?&quot;</text>

              {/* Arrow down */}
              <line x1="440" y1="102" x2="440" y2="120" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,116 440,126 446,116" fill="var(--stone)" />

              {/* Embed query */}
              <rect x="355" y="130" width="170" height="32" rx="6" fill="var(--white)" stroke="var(--rule)" strokeWidth="1.5" />
              <text x="440" y="148" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="10" fontWeight="500">Embed via Hugging Face</text>

              {/* Arrow down */}
              <line x1="440" y1="162" x2="440" y2="180" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,176 440,186 446,176" fill="var(--stone)" />

              {/* Vector search */}
              <rect x="340" y="190" width="200" height="46" rx="8" fill="var(--white)" stroke="var(--rule)" strokeWidth="1.5" />
              <text x="440" y="208" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="10" fontWeight="600">Vector similarity search</text>
              <text x="440" y="224" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">+ keyword boost + page context</text>

              {/* Arrow from Supabase to Vector search */}
              <line x1="230" y1="264" x2="336" y2="213" stroke="var(--forest)" strokeWidth="1.5" strokeDasharray="5 3" />
              <polygon points="332,208 340,212 334,218" fill="var(--forest)" />

              {/* Arrow down */}
              <line x1="440" y1="236" x2="440" y2="254" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,250 440,260 446,250" fill="var(--stone)" />

              {/* Top chunks */}
              <rect x="355" y="264" width="170" height="32" rx="6" fill="var(--forest-pale)" stroke="var(--forest)" strokeWidth="1" />
              <text x="440" y="284" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="10" fontWeight="600">Top 8&ndash;12 relevant chunks</text>

              {/* Arrow down */}
              <line x1="440" y1="296" x2="440" y2="314" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,310 440,320 446,310" fill="var(--stone)" />

              {/* Claude box */}
              <rect x="325" y="324" width="230" height="50" rx="8" fill="#264635" stroke="#264635" strokeWidth="1.5" />
              <text x="440" y="344" textAnchor="middle" fill="white" fontFamily="var(--sans)" fontSize="11" fontWeight="700">Claude Haiku</text>
              <text x="440" y="362" textAnchor="middle" fill="#a8d4b8" fontFamily="var(--sans)" fontSize="10">system prompt + chunks + question</text>

              {/* Arrow down */}
              <line x1="440" y1="374" x2="440" y2="392" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,388 440,398 446,388" fill="var(--stone)" />

              {/* Streamed response */}
              <rect x="325" y="402" width="230" height="50" rx="8" fill="var(--white)" stroke="var(--forest)" strokeWidth="1.5" />
              <text x="440" y="422" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="10" fontWeight="600">Streamed response + sources</text>
              <text x="440" y="438" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">via Server-Sent Events</text>

              {/* Arrow down */}
              <line x1="440" y1="452" x2="440" y2="470" stroke="var(--stone)" strokeWidth="1.5" />
              <polygon points="434,466 440,476 446,466" fill="var(--stone)" />

              {/* Chat bubble */}
              <rect x="340" y="480" width="200" height="32" rx="16" fill="var(--forest-pale)" stroke="var(--forest)" strokeWidth="1" />
              <text x="440" y="501" textAnchor="middle" fill="var(--forest)" fontFamily="var(--sans)" fontSize="11" fontWeight="600">Goose answers in the widget</text>

              {/* ── Legend ── */}
              <rect x="30" y="320" width="200" height="80" rx="8" fill="var(--cream)" stroke="var(--rule)" strokeWidth="1" />
              <text x="130" y="340" textAnchor="middle" fill="var(--ink)" fontFamily="var(--sans)" fontSize="10" fontWeight="700">The key idea</text>
              <text x="130" y="356" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">The AI never answers from memory.</text>
              <text x="130" y="370" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">It reads the relevant content first,</text>
              <text x="130" y="384" textAnchor="middle" fill="var(--stone)" fontFamily="var(--sans)" fontSize="9">then answers based on what it found.</text>
            </svg>
          </div>
          <p className="post-visual-caption">
            Build time (left): content is split into chunks and embedded as vectors. Query time (right): each question triggers a similarity search, feeds the best chunks to Claude, and streams the answer back.
          </p>
        </div>

        <h4 className="post-dev-heading">&#128295; Developer section: Data flow</h4>
        <ul>
          <li>
            <strong>Build time:</strong> Post TSX &rarr; split by H2 &rarr; embed with
            Xenova/MiniLM &rarr; upsert to <code>rag_chunks</code> (291 rows)
          </li>
          <li>
            <strong>Query time:</strong> User question &rarr; HF embed &rarr;{" "}
            <code>match_rag_chunks</code> RPC (pgvector cosine similarity) &rarr;
            keyword boost &rarr; page-aware injection &rarr; Claude Haiku stream &rarr; SSE to browser
          </li>
          <li>
            <strong>Storage:</strong> <code>chat_sessions</code> + <code>chat_messages</code>{" "}
            tables track every conversation for QA grading
          </li>
        </ul>

        {/* ── Why These Tools ── */}
        <h2>Why Hugging Face and qwen2.5</h2>
        <p>
          Two tool choices worth explaining, because they&rsquo;re not the obvious ones.
        </p>
        <p>
          <strong>Hugging Face for embeddings</strong> &mdash; when a user types a question,
          it needs to be converted into a vector (that list of 384 numbers) so the database
          can compare it to the stored content. The natural instinct is to run that conversion
          locally on the server, but Vercel&rsquo;s serverless functions have strict time and
          memory limits &mdash; loading a machine learning model on every request wasn&rsquo;t
          reliable. Hugging Face offers a free hosted version of the exact same model I use at
          build time (all-MiniLM-L6-v2), so the API sends the text to Hugging Face, gets the
          vector back, and passes it to Supabase. Same model on both sides means the vectors
          are comparable. Zero cost, no cold-start issues.
        </p>
        <p>
          <strong>qwen2.5 for QA grading</strong> &mdash; I wanted a way to automatically
          grade Goose&rsquo;s answers without paying for API calls on every evaluation. The
          solution: run a local LLM on the{" "}
          <Link href="/writing/how-i-setup-headless-linux">Alienware server</Link> that
          evaluates batches of 10 conversations and emails me a report. The constraint was
          hardware &mdash; the Alienware has 6GB of RAM and a 1.4GHz dual-core CPU from 2011.
          Most local models need 8&ndash;16GB minimum. Qwen 2.5 at 1.5 billion parameters
          fits in under 1GB of RAM, follows structured instructions well enough to return
          valid JSON grades, and runs acceptably on limited hardware. It&rsquo;s not the
          smartest model available, but it&rsquo;s the smartest model that actually fits.
        </p>

        {/* ── Vector Foundation ── */}
        <h2>How the Vector Store Made This Significantly Easier</h2>
        <p>
          When I built{" "}
          <Link href="/writing/how-i-upgraded-search-to-vectors">semantic search</Link>,
          I wrote at the end that vector embeddings were &ldquo;half of a pattern called RAG&rdquo;
          and that Ask Goose would be &ldquo;a matter of wiring the retrieval results into a
          Claude API call.&rdquo; That turned out to be exactly right &mdash; and exactly
          incomplete.
        </p>
        <p>
          The retrieval function, the pgvector index, the embedding model, and the Supabase
          RPC pattern were all reusable. I didn&rsquo;t rebuild any of that. But the original
          <code>content_embeddings</code> table embedded metadata only &mdash; title, description,
          and TLDR summary, roughly 50 words per item. That&rsquo;s fine for ranking search
          results but too thin for RAG. When someone asks &ldquo;how did Jose set up port
          knocking?&rdquo; the chatbot needs the actual post content, not a one-line
          description of it.
        </p>
        <p>
          So I built a parallel table &mdash; <code>rag_chunks</code> &mdash; that stores
          dense, retrievable text chunks split by H2 section boundaries. The original search
          table stays untouched, and Ask Goose gets its own purpose-built retrieval layer.
          Same embedding model, same Supabase infrastructure, different granularity.
        </p>

        {/* ── System Prompt ── */}
        <h2>System Prompt Design Decisions</h2>
        <p>
          The system prompt went through several iterations during testing. Three decisions
          shaped the final version:
        </p>
        <p>
          <strong>Brevity as default.</strong> Early responses ran 3&ndash;4 paragraphs for
          simple questions. The fix was explicit: &ldquo;One paragraph is ideal. Never exceed
          two short paragraphs. For broad questions, give a tight summary and ask the user
          what they&rsquo;d like to dig into.&rdquo; This turned Goose from an essay writer
          into a conversationalist.
        </p>
        <p>
          <strong>Honest fallback.</strong> When Goose doesn&rsquo;t have enough context,
          early versions would hedge vaguely &mdash; &ldquo;Jose probably has thoughts on
          that.&rdquo; Now the prompt says to be direct and point to{" "}
          <Link href="/contact">/contact</Link>: &ldquo;I don&rsquo;t have the details on
          that, but Jose would &mdash; you can reach him at /contact.&rdquo;
        </p>
        <p>
          <strong>Current question focus.</strong> Chat history was causing prior topics to
          bleed into unrelated answers. A user who asked a joke question and then asked about
          projects would get a response that started with &ldquo;I appreciate the question,
          but I&rsquo;m not here to play matchmaker&rdquo; before answering about projects.
          The fix was two-fold: trim history to just the last exchange (not the last six
          messages), and add an explicit instruction to always prioritize the current question.
        </p>

        {/* ── Failure Modes ── */}
        <h2>Three Failure Modes and How I Handled Each</h2>

        <p>
          <strong>1. Resume chunks were invisible to retrieval.</strong>{" "}
          The career data was in the database, but queries like &ldquo;tell me about
          Jose&rsquo;s work experience&rdquo; returned zero results. The vector similarity
          scores for resume chunks were below 0.12 &mdash; essentially noise. MiniLM-L6-v2
          can&rsquo;t bridge the gap between a conversational question and a formal role
          description. The fix: keyword-based forced retrieval. When the query contains words
          like &ldquo;career,&rdquo; &ldquo;Goldman,&rdquo; or &ldquo;experience,&rdquo;
          the system force-includes resume chunks regardless of vector score. I also rewrote
          the resume data in conversational language (&ldquo;Jose worked at DoorDash from
          2020 to 2023&hellip;&rdquo;) instead of formal bullet points.
        </p>

        <p>
          <strong>2. &ldquo;What is this page for?&rdquo; returned generic answers.</strong>{" "}
          The widget sends the current page path to the API, but retrieval wasn&rsquo;t
          using it. Asking &ldquo;how long did this take to build?&rdquo; while reading
          a specific post returned &ldquo;I don&rsquo;t have that information.&rdquo;
          The answer was literally on the page &mdash; in the recipe card. The fix:
          when <code>currentPage</code> is a writing post URL, force-include all chunks
          from that post in the retrieval results. Now the chatbot always has the page
          you&rsquo;re reading in its context.
        </p>

        <p>
          <strong>3. Conversations reset on page navigation.</strong>{" "}
          The floating widget re-mounted on every navigation, wiping React state.
          Users would ask three questions, click to another page, and find a blank
          chat with the counter reset. The fix: persist messages, session ID, question
          count, and open/closed state to <code>sessionStorage</code>. The widget restores
          its full state on mount and saves on every change. Conversations survive
          navigation but clear when the tab closes &mdash; the right boundary for a
          casual chat widget.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Pattern worth noting</span>
          <p>
            All three failures shared a theme: the retrieval layer was the bottleneck,
            not the generation layer. Claude Haiku answered well when given the right context.
            The hard part was making sure the right context showed up. If I were advising
            someone building their first RAG system: spend 80% of your time on retrieval
            quality, 20% on prompt tuning.
          </p>
        </div>

        {/* ── What I'd Do Differently ── */}
        <h2>What I&rsquo;d Design Differently from Scratch</h2>
        <p>
          <strong>Upgrade the embedding model.</strong> MiniLM-L6-v2 has a 256-token context
          window. Anything beyond ~200 words gets silently truncated before the model sees
          it, which limits chunk size and forces aggressive splitting. A model like{" "}
          <code>text-embedding-3-small</code> (8,191-token window, 1,536 dimensions) would
          let me embed longer sections and get better similarity scores on conversational
          queries. I kept MiniLM because it was already wired into the site search &mdash;
          but for a purpose-built RAG system, I&rsquo;d start with a larger model.
        </p>
        <p>
          <strong>Build the chunking pipeline first.</strong> I designed the schema, then the
          data files, then the chunking script, then the API, then the frontend. If I did it
          again, I&rsquo;d build the chunking pipeline and immediately test retrieval quality
          in isolation before writing a single line of API or UI code. Two of my three bugs
          were retrieval problems that would have surfaced earlier with a simple test script.
        </p>
        <p>
          <strong>Rate limiting from day one.</strong> The 10-question limit is client-side
          only &mdash; anyone with <code>curl</code> can hit <code>/api/chat</code> directly.
          For a personal site this is fine, but the architecture choice should be deliberate.
          If I were building this for a client, I&rsquo;d add server-side rate limiting
          per session and per IP from the start, not bolt it on later.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Goose&rsquo;s take</span>
          <p>
            If you&rsquo;re still reading, you should just go try it. Hit the chat icon in the
            bottom right corner and ask me anything. I have opinions about sticks, strong
            feelings about DoorDash&rsquo;s grocery strategy, and I know exactly how long
            it took Jose to build every feature on this site.
          </p>
        </div>

      <RelatedPosts slug="how-i-built-ask-goose" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
