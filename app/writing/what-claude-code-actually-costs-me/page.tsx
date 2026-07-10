import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "What Claude Code Actually Costs Me — Jose and Goose",
  description:
    "I built a weekly audit of every automated job that calls Claude on my home server — tracking real dollars vs. subscription load and catching new jobs that sneak in. The punchline: real spend is under $2 a month.",
};

export default function WhatClaudeCodeActuallyCostsMe() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>July 9, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>
      <PostTags slug="what-claude-code-actually-costs-me" />

      <h1 className="post-title">What Claude Code Actually Costs Me</h1>
      <p className="post-subtitle">
        Anthropic announced it was moving Agent SDK and headless <code>claude -p</code>{" "}
        usage onto a $100-a-month API-credit cap — and I realized I had no idea how much
        of my flat-rate subscription was already being spent by background agents I&rsquo;d
        set running and forgotten about. So I built a weekly audit that inventories every
        AI-calling job, splits real dollars from subscription load, and flags new ones that
        sneak in. Real spend, it turns out: under $2 a month.
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              A weekly self-audit of every automated job that calls Claude — a
              canonical inventory, a real-dollars-vs-subscription-load cost estimate,
              and a drift alert when a new or changed AI job appears — emailed to me
              every Sunday morning
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>
              Beginner-to-intermediate (a few small Python scripts, a JSON registry,
              a scheduled task, and one email + phone-push digest — no new
              infrastructure)
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~3 hours in one afternoon — inventory, cost math, drift detector, and the weekly digest</span>
          </div>
        </div>
        <TLDRBadge slug="what-claude-code-actually-costs-me" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>My always-on home server</strong>{" "}
            — the same headless Linux box that runs all my scheduled jobs <em>(already set up)</em>
          </li>
          <li>
            <strong>A JSON registry</strong>{" "}
            — one hand-maintained file listing every job that calls Claude: which model, which billing bucket, roughly how many calls and tokens per week <em>(free)</em>
          </li>
          <li>
            <strong>Python 3</strong>{" "}
            — three small scripts: a drift scanner, a cost estimator, and a weekly digest <em>(free)</em>
          </li>
          <li>
            <strong>A scheduled task</strong>{" "}
            — runs the whole thing once a week without me thinking about it <em>(free)</em>
          </li>
          <li>
            <strong>Email + phone push</strong>{" "}
            — the same alert plumbing my other projects already use, so the digest lands in my inbox and on my phone <em>(free tier)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: I Had No Idea What I Was Spending</h2>
        <p>
          The trigger was an announcement. Anthropic said it was moving programmatic
          usage — the Agent SDK and headless <code>claude -p</code> calls — onto a
          metered $100-a-month API-credit cap. My first reaction wasn&rsquo;t about the
          $100. It was the uncomfortable realization that I had no idea how much of my
          subscription those background agents were already burning through, because
          I&rsquo;d never once looked.
        </p>
        <p>
          Over the past few months I&rsquo;ve built a small zoo of automated jobs, and
          a lot of them call Claude. A morning market briefing that asks Claude to
          explain why markets moved. A soccer-club bot that grades its own decisions.
          A classifier that reads news posts and decides which ones matter. A weekend
          fitness recap. Each one, on its own, felt trivial. But they add up, they run
          on their own schedules, and I&rsquo;d stopped counting.
        </p>

        <p>
          The honest truth is I couldn&rsquo;t have told you how many jobs called
          Claude, which models they used, or what the whole thing cost me per month. As
          a product manager, that&rsquo;s exactly the kind of &ldquo;we&rsquo;ll figure
          out the unit economics later&rdquo; blind spot I&rsquo;d flag in a review. So
          I turned it on myself: build the dashboard, get the number, stop guessing.
        </p>

        {/* ── The Twist ── */}
        <h2>The Twist That Reframed the Whole Project</h2>
        <p>
          Here&rsquo;s the twist. That $100-a-month cap I mentioned up top? Mid-build, I
          learned Anthropic had <strong>paused it before it ever went live</strong>. No
          metered cap, no credit pool — at least not yet. Which meant the exact question
          I&rsquo;d set out to answer (&ldquo;how much of my $100 have I used?&rdquo;) no
          longer had an answer, because the number didn&rsquo;t exist.
        </p>

        <p>
          That sounds like it kills the project. It actually clarified it. Because once
          the credit was off the table, the real cost picture came into focus, and it
          turns out there are two completely different kinds of &ldquo;cost&rdquo;
          hiding in the word &ldquo;cost.&rdquo;
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Two buckets, one word</span>
          <p>
            Not every Claude call costs money the same way. Some run against my
            flat-rate subscription — the same monthly plan I use for interactive Claude
            Code — so they don&rsquo;t add a cent unless I blow through the plan&rsquo;s
            limits. Others use a raw pay-as-you-go API key, billed by the token. Only
            the second bucket is real dollars. Lumping them together would have told me
            a scary, wrong number.
          </p>
        </div>

        {/* ── Two Buckets ── */}
        <h2>Subscription Load vs. Real Dollars</h2>

        <figure className="post-visual">
          <div style={{ overflowX: "auto" }}>
            <svg viewBox="0 0 720 300" role="img" aria-label="Every automated job that calls Claude splits into two billing buckets: a metered pay-as-you-go API key costing about two dollars a month, and the flat-rate Max subscription that carries most of the usage but is not billed per call." style={{ width: "100%", maxWidth: 720, height: "auto", display: "block", margin: "0 auto", fontFamily: "var(--sans)" }}>
              <defs>
                <marker id="cost-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#31583f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              <rect x="20" y="116" width="176" height="68" rx="10" fill="#264635" />
              <text x="108" y="145" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">My automated jobs</text>
              <text x="108" y="165" textAnchor="middle" fill="#cddbd2" fontSize="12">cron + agents calling Claude</text>
              <line x1="196" y1="140" x2="248" y2="80" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cost-arrow)" />
              <text x="214" y="98" textAnchor="middle" fill="#7a8a80" fontSize="11">a few Haiku jobs</text>
              <rect x="252" y="46" width="186" height="64" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="345" y="72" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="600">Metered API key</text>
              <text x="345" y="92" textAnchor="middle" fill="#5b6b62" fontSize="12">pay-as-you-go, by the token</text>
              <line x1="438" y1="78" x2="492" y2="78" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cost-arrow)" />
              <rect x="496" y="46" width="200" height="64" rx="10" fill="#F3D104" stroke="#264635" strokeWidth="1.8" />
              <text x="596" y="72" textAnchor="middle" fill="#264635" fontSize="15" fontWeight="700">~$2 / month</text>
              <text x="596" y="92" textAnchor="middle" fill="#4a3d05" fontSize="12">real dollars</text>
              <line x1="196" y1="160" x2="248" y2="222" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cost-arrow)" />
              <text x="214" y="214" textAnchor="middle" fill="#7a8a80" fontSize="11">most jobs</text>
              <rect x="252" y="192" width="186" height="64" rx="10" fill="#edf1ee" stroke="#264635" strokeWidth="1.8" />
              <text x="345" y="218" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="600">Max subscription</text>
              <text x="345" y="238" textAnchor="middle" fill="#5b6b62" fontSize="12">flat monthly rate</text>
              <line x1="438" y1="224" x2="492" y2="224" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cost-arrow)" />
              <rect x="496" y="192" width="200" height="64" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" strokeDasharray="5 4" />
              <text x="596" y="218" textAnchor="middle" fill="#264635" fontSize="14" fontWeight="600">~$14 / month of use</text>
              <text x="596" y="238" textAnchor="middle" fill="#5b6b62" fontSize="12">not billed per call</text>
            </svg>
          </div>
          <figcaption className="post-visual-caption">
            Every job that calls Claude lands in one of two buckets. Only the metered API-key lane costs <strong>real dollars</strong> — about $2 a month. The rest rides the flat-rate subscription: real usage, but not billed per call.
          </figcaption>
        </figure>
        <p>
          This distinction is the entire point of the audit, so it&rsquo;s worth being
          precise about it:
        </p>

        <ul>
          <li>
            <strong>Subscription jobs</strong> — these call Claude the same way I do
            when I&rsquo;m typing in the terminal. They count against my monthly
            plan&rsquo;s usage limits, not against a bill. As long as I stay under the
            plan&rsquo;s ceiling, running these jobs is effectively free. The cost here
            isn&rsquo;t money — it&rsquo;s <em>headroom</em>: how much of my plan&rsquo;s
            capacity the automation eats before I&rsquo;d notice it interactively.
          </li>
          <li>
            <strong>API-key jobs</strong> — these use a separate pay-as-you-go key,
            billed per token. This is real money, and it&rsquo;s the number I actually
            care about. In my setup, every one of these runs on{" "}
            <strong>Haiku</strong> — Claude&rsquo;s smallest, cheapest, fastest model —
            because they&rsquo;re all doing narrow, high-volume work (classify this,
            summarize that) where a bigger model would be overkill.
          </li>
        </ul>

        <p>
          For the subscription jobs, I still wanted a way to rank them — which ones eat
          the most of my plan? So the tool computes a &ldquo;shadow dollars&rdquo;
          figure: what each subscription job <em>would</em> cost if it were billed at
          that model&rsquo;s API rate. It&rsquo;s not a real charge. It&rsquo;s just a
          common yardstick so I can see which automation is the heavy one, purely for
          load-ranking.
        </p>

        {/* ── How It Works ── */}
        <h2>How the Audit Works</h2>
        <p>
          Three small Python scripts, one hand-maintained inventory file, and a weekly
          schedule. No database, no web framework, no new servers. The whole thing is
          maybe a few hundred lines.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: the three scripts</h4>
        <ul>
          <li>
            <strong>The registry</strong> — a JSON file with one entry per Claude-calling
            job: an ID, the model it uses, which billing bucket it&rsquo;s in
            (subscription or API key), and rough estimates of calls-per-week and average
            input/output tokens. This is the single source of truth. To tune a cost
            estimate, I just edit the numbers here.
          </li>
          <li>
            <strong>The cost estimator</strong> — reads the registry, multiplies each
            job&rsquo;s calls and tokens by that model&rsquo;s published per-million-token
            price, and sums it up into two totals: real pay-as-you-go dollars (the
            API-key jobs) and shadow dollars (the subscription jobs, for ranking only).
          </li>
          <li>
            <strong>The drift detector</strong> — this is the part I&rsquo;ve come to
            value most. It scans my scheduled jobs and project folders for anything that
            looks like a Claude call, then compares what it finds against the registry.
            If a project is calling Claude but isn&rsquo;t in the registry, it&rsquo;s
            flagged as NEW. If a registered project has stopped calling Claude, it&rsquo;s
            GONE. And if a job quietly switched to a more expensive model, that&rsquo;s
            MODEL drift.
          </li>
        </ul>

        <p>
          A weekly digest script stitches all three together — runs the drift scan,
          runs the cost estimate, writes a log, and sends me a formatted email plus a
          push to my phone. Once a week, Sunday morning, I get one message that answers
          &ldquo;did anything change, and what am I spending?&rdquo; and then I forget
          about it again.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Estimates, honestly labeled</span>
          <p>
            The dollar figures are estimates, not metered from actual token counts —
            they&rsquo;re driven by my calls-per-week and average-token guesses in the
            registry. I decided that was the right first version: a rough number I trust
            the shape of beats a precise number I&rsquo;d never get around to
            instrumenting. If a job ever looked expensive, that&rsquo;d be the signal to
            go measure it for real. So far none has.
          </p>
        </div>

        {/* ── Why Project-Level ── */}
        <h2>A Detail That Mattered: Scan by Project, Not by File</h2>
        <p>
          My first instinct for the drift detector was to key everything on the exact
          file that makes the Claude call. That produced a mess of false alarms.
          Real projects don&rsquo;t call Claude from one obvious place — they route the
          call through wrappers and imports, so the actual API call lives a couple of
          files deep from where the job kicks off. File-level tracking kept screaming
          &ldquo;this file disappeared, a new file appeared!&rdquo; every time I
          refactored, when nothing had actually changed.
        </p>

        <p>
          The fix was to track drift at the <em>project</em> level: does this project
          call Claude, yes or no, and with which model? That collapsed all the noise
          and left only the alerts I actually care about — a whole new project starts
          using AI, or an existing one changes model. Same lesson I keep relearning:
          alert on the thing you&rsquo;d act on, not on every raw event, or you&rsquo;ll
          train yourself to ignore the alerts.
        </p>

        {/* ── The Number ── */}
        <h2>The Number</h2>
        <p>
          Here&rsquo;s what the audit actually reports. Across a handful of small Haiku
          jobs running on the pay-as-you-go key, my real spend is about{" "}
          <strong>$1.86 a month</strong>. Not a typo. Under two dollars.
        </p>

        <p>
          Meanwhile, the subscription jobs — the heavier, more frequent ones running
          against my flat-rate plan — carry a shadow cost of roughly{" "}
          <strong>$14 a month</strong> if you imagine billing them by the token. But I
          don&rsquo;t pay that. It&rsquo;s absorbed by the monthly subscription I was
          already paying for anyway. The single biggest &ldquo;cost&rdquo; in my whole
          automation stack is a job that, in reality, costs me nothing incremental at
          all.
        </p>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Weekly digest — the bottom line</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim"># Real pay-as-you-go (Haiku API-key jobs):</span></div>
              <div><span className="post-terminal-success">~$1.86 / month</span></div>
              <br />
              <div><span className="post-terminal-dim"># Subscription load (shadow $, NOT billed):</span></div>
              <div><span className="post-terminal-success">~$14 / month — absorbed by the flat-rate plan</span></div>
              <br />
              <div><span className="post-terminal-dim"># Drift check:</span></div>
              <div><span className="post-terminal-success">none — registry matches live jobs ✓</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            The whole point in one screen: a tiny real bill, a bigger load number that
            costs nothing extra, and a clean drift check.
          </p>
        </div>

        <p>
          Why so cheap? Because the expensive-per-token work all runs on the flat-rate
          subscription, and everything on the metered key is Haiku doing small,
          well-scoped tasks. Cheap model plus narrow job plus predictable volume equals
          a bill that rounds to a rounding error. The lesson isn&rsquo;t &ldquo;AI is
          free.&rdquo; It&rsquo;s &ldquo;match the model to the job and know which meter
          you&rsquo;re on.&rdquo;
        </p>

        {/* ── The Surprise ── */}
        <h2>The Best Part Was the Drift Check</h2>
        <p>
          I built this expecting the cost number to be the payoff. It wasn&rsquo;t. The
          payoff was that on its very first run, the drift scanner caught{" "}
          <strong>two jobs my own manual inventory had missed</strong>. I&rsquo;d sat
          down, listed every Claude job I could think of by hand, and still forgot two
          of them. One was a scheduled job quietly calling Claude that I&rsquo;d simply
          overlooked. The other turned out to be an on-demand tool with no schedule at
          all, which I then correctly marked as excluded.
        </p>

        <p>
          That&rsquo;s the whole argument for the tool in one anecdote. Left to my own
          memory, I was already wrong about my own systems after a few months. A cheap
          automated check that says &ldquo;actually, you also have these&rdquo; is worth
          far more than the cost estimate it ships alongside. Going forward, the value
          isn&rsquo;t the number — it&rsquo;s the weekly &ldquo;nothing changed&rdquo;
          (or the occasional &ldquo;hey, this is new&rdquo;).
        </p>

        {/* ── How It Grew ── */}
        <h2>How It Grew: From &ldquo;Track My Credit&rdquo; to &ldquo;Track My Drift&rdquo;</h2>
        <p>
          The shape of this project changed completely between the idea and the finish,
          and that&rsquo;s the interesting part:
        </p>

        <ul>
          <li>
            <strong>The original pitch</strong> — a meter for a $100/month free credit,
            so I&rsquo;d know when I was getting close to the ceiling.
          </li>
          <li>
            <strong>The reframe</strong> — the credit got paused before launch, the
            ceiling vanished, and I had to ask what problem was actually left. The
            answer: I still didn&rsquo;t know what I was really spending, and I still
            couldn&rsquo;t reliably list my own AI jobs.
          </li>
          <li>
            <strong>The finished thing</strong> — a two-part audit. Cost: real dollars
            (tiny) separated from subscription load (absorbed). Drift: an automated
            weekly check that my inventory still matches reality. The second part turned
            out to be the durable one.
          </li>
        </ul>

        <p>
          It&rsquo;s a small, real example of a thing product work does to you: the
          feature you set out to build gets invalidated, and if you&rsquo;re paying
          attention, the underlying need points you at a better one.
        </p>

        {/* ── Lessons ── */}
        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>The cost math</strong> — once the registry existed, the estimator
            was almost trivial: calls times tokens times the published per-token rate,
            summed into two buckets. An afternoon, not a project.
          </li>
          <li>
            <strong>The weekly digest</strong> — I already had email and phone-push
            plumbing from earlier projects. Reusing proven alert code meant the delivery
            layer was basically free; I just pointed it at a new report.
          </li>
          <li>
            <strong>Deciding to ship estimates</strong> — I gave myself permission to
            ship rough token guesses instead of building full measurement first. That
            single call is why this got finished in an afternoon instead of never.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Getting the drift scan to stop crying wolf</strong> — file-level
            tracking generated constant false NEW/GONE alerts because projects call
            Claude through layers of wrappers. Moving to project-level tracking was the
            fix, but figuring out <em>why</em> the noise happened took some staring at
            the false positives.
          </li>
          <li>
            <strong>Separating the two billing buckets cleanly</strong> — the temptation
            was to report one big scary total. Keeping real dollars and subscription
            shadow strictly separate — and labeling the shadow number as
            &ldquo;not billed&rdquo; every single time — took discipline, because a
            single blended number would have been simpler to print and completely
            misleading.
          </li>
          <li>
            <strong>Being honest that these are estimates</strong> — it would&rsquo;ve
            been easy to dress up guessed token counts as precise measurements. I made
            the tool say &ldquo;estimate&rdquo; out loud everywhere, so future-me
            doesn&rsquo;t mistake a rough figure for a metered one.
          </li>
        </ul>

        <p>
          The satisfying thing isn&rsquo;t that the number came back small — though it
          did, and that was a relief. It&rsquo;s that I no longer have a blind spot
          where a dozen automated jobs used to quietly call an AI on my behalf. Once a
          week I get a note that says everything&rsquo;s where I left it and I&rsquo;m
          spending less than a coffee. If you&rsquo;re running your own automation
          against any paid AI, I&rsquo;d recommend auditing it the same way — you might
          be pleasantly surprised, and you&rsquo;ll almost certainly find something you
          forgot you built.
        </p>
        <RelatedPosts slug="what-claude-code-actually-costs-me" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
