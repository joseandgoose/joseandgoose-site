import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "Grading the grader: qwen 1.5b vs 7b — Jose and Goose",
  description:
    "I swapped the local AI that grades my chatbot for a bigger one and compared the two across 55 real conversations. Here's what the smaller model missed — and where Claude Haiku and Sonnet would sit on the same ladder.",
};

// ── Chart data ─────────────────────────────────────────────────────────
const meansData = [
  { name: "Accuracy", old: 4.62, new: 3.89 },
  { name: "Helpful", old: 4.75, new: 4.23 },
  { name: "Tone", old: 4.09, new: 4.44 },
  { name: "Brevity", old: 3.42, new: 3.35 },
  { name: "Fallback", old: 2.2, new: 3.89 },
  { name: "Overall", old: 4.04, new: 3.94 },
];

const accuracyDist = [
  { score: 1, old: 0, new: 0 },
  { score: 2, old: 3, new: 1 },
  { score: 3, old: 5, new: 12 },
  { score: 4, old: 2, new: 34 },
  { score: 5, old: 45, new: 8 },
];

const fallbackDist = [
  { score: 1, old: 15, new: 1 },
  { score: 2, old: 30, new: 5 },
  { score: 3, old: 2, new: 5 },
  { score: 4, old: 0, new: 32 },
  { score: 5, old: 8, new: 12 },
];

const OLD_COLOR = "#B8AE94";
const NEW_COLOR = "#264635";

// ── Charts ────────────────────────────────────────────────────────────

function MeansChart() {
  const W = 640,
    H = 360,
    L = 70,
    R = 30,
    T = 44,
    B = 92;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const groupW = plotW / meansData.length;
  const barW = 28;
  const max = 5;

  const y = (v: number) => T + plotH - (v / max) * plotH;

  return (
    <figure
      style={{
        margin: "56px 0",
        padding: "28px",
        background: "var(--forest-pale)",
        borderRadius: "8px",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", fontFamily: "var(--sans)" }}
        role="img"
        aria-label="Average score per metric for each grader across 55 conversations"
      >
        <text x={W / 2} y={22} textAnchor="middle" fontSize="14" fontWeight="600" fill="#264635">
          Average score per metric (55 conversations, 1&ndash;5 scale)
        </text>

        {[0, 1, 2, 3, 4, 5].map((n) => (
          <g key={n}>
            <line x1={L} y1={y(n)} x2={W - R} y2={y(n)} stroke="#d5dcd7" strokeWidth="1" />
            <text x={L - 8} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#667">
              {n}
            </text>
          </g>
        ))}

        {meansData.map((d, i) => {
          const gx = L + i * groupW + groupW / 2;
          return (
            <g key={d.name}>
              <rect x={gx - barW - 2} y={y(d.old)} width={barW} height={y(0) - y(d.old)} fill={OLD_COLOR} />
              <rect x={gx + 2} y={y(d.new)} width={barW} height={y(0) - y(d.new)} fill={NEW_COLOR} />
              <text x={gx - barW / 2 - 2} y={y(d.old) - 6} textAnchor="middle" fontSize="10" fill="#555">
                {d.old.toFixed(2)}
              </text>
              <text x={gx + barW / 2 + 2} y={y(d.new) - 6} textAnchor="middle" fontSize="10" fill="#264635" fontWeight="600">
                {d.new.toFixed(2)}
              </text>
              <text x={gx} y={H - B + 24} textAnchor="middle" fontSize="12" fill="#333">
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Legend — centered below axis labels */}
        <g transform={`translate(${W / 2 - 170}, ${H - 28})`}>
          <rect x={0} y={0} width={14} height={14} fill={OLD_COLOR} />
          <text x={20} y={11} fontSize="12" fill="#333">
            qwen-1.5b (old)
          </text>
          <rect x={180} y={0} width={14} height={14} fill={NEW_COLOR} />
          <text x={200} y={11} fontSize="12" fill="#333">
            qwen-7b (new)
          </text>
        </g>
      </svg>
      <figcaption style={{ fontSize: "0.9rem", color: "#444", marginTop: "16px", fontFamily: "var(--sans)", lineHeight: 1.6 }}>
        The old grader rated almost everything a 4 or 5. It wasn&rsquo;t really using the scale. The new grader spread scores out. Look at Fallback: the two graders land on opposite ends of the scale for the same conversations.
      </figcaption>
    </figure>
  );
}

function DistributionChart({
  title,
  data,
  caption,
}: {
  title: string;
  data: typeof accuracyDist;
  caption: string;
}) {
  const W = 640,
    H = 360,
    L = 70,
    R = 30,
    T = 44,
    B = 92;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const groupW = plotW / data.length;
  const barW = 30;
  const max = 55;

  const y = (v: number) => T + plotH - (v / max) * plotH;
  const ticks = [0, 10, 20, 30, 40, 50];

  return (
    <figure
      style={{
        margin: "56px 0",
        padding: "28px",
        background: "var(--forest-pale)",
        borderRadius: "8px",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", fontFamily: "var(--sans)" }}
        role="img"
        aria-label={title}
      >
        <text x={W / 2} y={22} textAnchor="middle" fontSize="14" fontWeight="600" fill="#264635">
          {title}
        </text>

        {ticks.map((n) => (
          <g key={n}>
            <line x1={L} y1={y(n)} x2={W - R} y2={y(n)} stroke="#d5dcd7" strokeWidth="1" />
            <text x={L - 8} y={y(n) + 4} textAnchor="end" fontSize="11" fill="#667">
              {n}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const gx = L + i * groupW + groupW / 2;
          return (
            <g key={d.score}>
              <rect x={gx - barW - 2} y={y(d.old)} width={barW} height={y(0) - y(d.old)} fill={OLD_COLOR} />
              <rect x={gx + 2} y={y(d.new)} width={barW} height={y(0) - y(d.new)} fill={NEW_COLOR} />
              {d.old > 0 && (
                <text x={gx - barW / 2 - 2} y={y(d.old) - 5} textAnchor="middle" fontSize="10" fill="#555">
                  {d.old}
                </text>
              )}
              {d.new > 0 && (
                <text x={gx + barW / 2 + 2} y={y(d.new) - 5} textAnchor="middle" fontSize="10" fill="#264635" fontWeight="600">
                  {d.new}
                </text>
              )}
              <text x={gx} y={H - B + 24} textAnchor="middle" fontSize="12" fill="#333">
                Score {d.score}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${W / 2 - 170}, ${H - 28})`}>
          <rect x={0} y={0} width={14} height={14} fill={OLD_COLOR} />
          <text x={20} y={11} fontSize="12" fill="#333">
            qwen-1.5b (old)
          </text>
          <rect x={180} y={0} width={14} height={14} fill={NEW_COLOR} />
          <text x={200} y={11} fontSize="12" fill="#333">
            qwen-7b (new)
          </text>
        </g>
      </svg>
      <figcaption style={{ fontSize: "0.9rem", color: "#444", marginTop: "16px", fontFamily: "var(--sans)", lineHeight: 1.6 }}>
        {caption}
      </figcaption>
    </figure>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function GradingTheGrader() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>April 23, 2026</span>
        <span className="post-meta-dot">&middot;</span>
        <span>6 min read</span>
      </div>
      <PostTags slug="grading-the-grader" />

      <h1 className="post-title">Grading the grader: qwen 1.5b vs 7b</h1>
      <p className="post-subtitle">
        I swapped the local AI that grades my chatbot for a bigger one and compared the two across 55 real conversations. Here&rsquo;s what a smaller model misses, and where Claude Haiku and Sonnet would sit on the same ladder.
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              Two graders running side-by-side on every new{" "}
              <Link href="/writing/how-i-built-ask-goose">Ask Goose</Link>{" "}
              conversation, with both scores flowing into a private Google Sheet daily for head-to-head comparison
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (local LLM swap via Ollama, Python cron job, Supabase schema with a <code>graded_by</code> column, Google Sheets service account, rubric design)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours. One-line model swap, 45 minutes of auto-backfill across 55 historical sessions, ~90 minutes updating the sheet sync to track both graders</span>
          </div>
        </div>
        <TLDRBadge slug="grading-the-grader" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://ollama.com" target="_blank" rel="noopener noreferrer">Ollama</a></strong>{" "}
            &mdash; runs local LLMs on my home server <em>(free, open source)</em>
          </li>
          <li>
            <strong>qwen2.5:1.5b</strong>{" "}
            &mdash; the old grader, about 1.5 billion parameters, fits in a couple gigs of memory <em>(free)</em>
          </li>
          <li>
            <strong>qwen2.5:7b-instruct-q4_K_M</strong>{" "}
            &mdash; the new grader, about 7 billion parameters, 4-bit quantized, ~5 GB resident <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a></strong>{" "}
            &mdash; stores chat sessions, messages, and grades across three tables <em>(free tier)</em>
          </li>
          <li>
            <strong>Python + Ollama REST API</strong>{" "}
            &mdash; the grading script that pulls ungraded conversations every 15 minutes <em>(free)</em>
          </li>
          <li>
            <strong>cron</strong>{" "}
            &mdash; schedules the grader every 15 min and the Google Sheet sync at 5:30 am daily <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://docs.gspread.org" target="_blank" rel="noopener noreferrer">gspread</a> + Google Sheets API</strong>{" "}
            &mdash; pushes both graders&rsquo; scores into a Google Sheet with model-named columns <em>(free)</em>
          </li>
          <li>
            <strong>Alienware home server with 16 GB RAM</strong>{" "}
            &mdash; the hardware that made the 7B upgrade possible <em>(already had it)</em>
          </li>
        </ul>

        <h2>Why I needed a grader</h2>

        <p>
          <Link href="/writing/how-i-built-ask-goose">Ask Goose</Link> is the chatbot on this site. It answers visitor questions about my projects, writing, and background. It&rsquo;s been live for a few weeks and has handled 55 conversations so far. Not a huge number, but enough that I wasn&rsquo;t going to read them all myself, so I needed something to grade them for me.
        </p>

        <p>
          The first grader didn&rsquo;t really work. The second one does. Comparing them taught me something about how AI models behave as they get bigger, and it&rsquo;s the kind of thing that&rsquo;s easy to miss if you only look at the final score.
        </p>

        <h2>How grading works</h2>

        <p>
          Every time someone chats with Goose, the conversation lands in a database. A small AI on my home server pulls new ones every 15 minutes and scores each one on five things:
        </p>

        <ul>
          <li><strong>Accuracy</strong> &mdash; did it actually answer the question?</li>
          <li><strong>Helpful</strong> &mdash; was the answer useful?</li>
          <li><strong>Tone</strong> &mdash; did it sound like Goose?</li>
          <li><strong>Brevity</strong> &mdash; did it get to the point?</li>
          <li><strong>Fallback</strong> &mdash; if it didn&rsquo;t know, did it point the person to /contact?</li>
        </ul>

        <p>
          Scores flow into a Google Sheet so I can scroll through and spot problems. The grader itself runs on a free open-source model instead of Claude. It&rsquo;s cheaper, it&rsquo;s private, and it runs on hardware I already own. I started with <strong>qwen2.5:1.5b</strong>, the smallest model in the list above.
        </p>

        <h2>Why the first grader wasn&rsquo;t working</h2>

        <p>
          After a few weeks of data, the scores looked suspicious. <strong>82% of conversations got a perfect Accuracy score.</strong> Helpful was almost as high, at 80%.
        </p>

        <p>
          Nothing&rsquo;s that good. A grader that hands out 5s to almost everything isn&rsquo;t really reading the answers. It&rsquo;s just nodding along.
        </p>

        <p>
          Fallback was worse. The rubric asked: &ldquo;if Goose didn&rsquo;t know, did it redirect?&rdquo; Most conversations scored a 1 or a 2, but Goose actually redirects correctly most of the time. The grader had read the question backwards. It was scoring &ldquo;did fallback happen?&rdquo; instead of &ldquo;was fallback used appropriately?&rdquo; A right answer with no need to redirect was getting punished as if the bot had refused to help.
        </p>

        <p>
          A grader that can&rsquo;t use the full scale and reads its own rubric backwards isn&rsquo;t measuring anything. It&rsquo;s guessing.
        </p>

        <h2>Swapping in a bigger model</h2>

        <p>
          I switched the grader to <strong>qwen2.5:7b</strong>. Same model family, but roughly four and a half times the size. My grader was already built to re-score any conversation the current model hadn&rsquo;t seen, so flipping the name in the config auto-triggered a backfill. Forty-five minutes later, all 55 existing conversations had a second score from the bigger model, stored next to the old one. Same questions, same rubric, different brain.
        </p>

        <h2>What changed</h2>

        <p>Here are the average scores across all 55 conversations.</p>

        <MeansChart />

        <p>
          The headline number is Accuracy: the average dropped from 4.62 to 3.89. That&rsquo;s not the new model being mean. That&rsquo;s the old model giving almost everything a 5.
        </p>

        <p>Fallback tells the clearest story.</p>

        <DistributionChart
          title="Fallback scores — same conversations, opposite ends of the scale"
          data={fallbackDist}
          caption="The old grader gave 45 out of 55 conversations a 1 or 2. The new grader gave 44 of them a 4 or 5. Same conversations, same rubric — they just disagree about what the question even means. This is what it looks like when a smaller model misreads the instructions."
        />

        <p>The smaller model crowded almost every conversation into the bottom of the scale. The bigger model did the opposite. They&rsquo;re not disagreeing about the answers. They&rsquo;re disagreeing about the question.</p>

        <p>Accuracy shows the same problem in a different shape.</p>

        <DistributionChart
          title="Accuracy scores — the old grader only knew how to say &lsquo;5&rsquo;"
          data={accuracyDist}
          caption="45 out of 55 conversations got a perfect score from the old grader. The new one only gave a 5 to eight. That's not the new grader being tough — it's the old one not knowing how to tell 'close enough' from 'nailed it.'"
        />

        <h2>Why smaller models fail at this</h2>

        <p>
          Four things went wrong with the small grader, and they&rsquo;re common patterns you&rsquo;ll see in any small AI.
        </p>

        <p>
          <strong>Small models like to say yes.</strong> They&rsquo;re trained to be friendly and agreeable. Ask one to score something 1 to 5 and it defaults to &ldquo;probably a 5.&rdquo; That&rsquo;s what made 82% of Accuracy scores perfect.
        </p>

        <p>
          <strong>They skip the &ldquo;if&rdquo; in questions.</strong> &ldquo;If it didn&rsquo;t know, did it redirect?&rdquo; is two ideas stitched together. Small models drop the &ldquo;if&rdquo; and answer the easier half. That&rsquo;s why Fallback got flipped.
        </p>

        <p>
          <strong>They only read the start of a long conversation.</strong> One of the test sessions had four user questions. The small grader summarized only the first. Everything after got quietly ignored.
        </p>

        <p>
          <strong>They hedge when they&rsquo;re unsure.</strong> The old grader averaged 183 characters of commentary per conversation. The new one averaged 84. Wordy wasn&rsquo;t smarter, just less sure.
        </p>

        <p>
          The net effect: the small model was making thumbs-up-or-down judgments wearing the costume of a 1-to-5 score. The bigger model actually uses the scale.
        </p>

        <h2>Where Claude would sit</h2>

        <p>
          Models stack roughly like this, each step about 3 to 5 times smarter than the last: <strong>1.5B &rarr; 7B &rarr; Claude Haiku &rarr; Claude Sonnet &rarr; Claude Opus.</strong>
        </p>

        <p>
          If I swapped the local model for a Claude API call:
        </p>

        <p>
          <strong>Claude Haiku 4.5</strong> would handle the &ldquo;if&rdquo; easily and probably drop Accuracy a bit further. Not from being tough, but from catching small factual slips that the 7B misses. It might notice &ldquo;Goose said Jose studied X, but the site says Y&rdquo; where the 7B waves that by. Cost: about half a cent per conversation. Re-grading all 55 conversations costs less than 30 cents.
        </p>

        <p>
          <strong>Claude Sonnet 4.6</strong> is near the ceiling for this task. It would effectively be the answer key, the tiebreaker when the cheaper graders disagree. Cost: about three cents per conversation, so about $1.50 for a full re-grade. 10&times; more than Haiku, still trivial for this volume.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The plan</span>
          <p>
            Keep the free 7B as the always-on grader. Add a Claude Haiku score next to it for pennies per month, an independent second opinion. Run Sonnet once as a tiebreaker pass to calibrate. The sheet is already built to show each grader in its own column, so the whole ladder stays visible.
          </p>
        </div>

        <h2>Three lessons from this</h2>

        <p>
          <strong>Your grader has to be as smart as what it&rsquo;s grading.</strong> Goose runs on Claude Haiku. A small open-source model can&rsquo;t really judge Haiku&rsquo;s work. It can only check if the answer looks like an answer.
        </p>

        <p>
          <strong>Flat scores mean the grader isn&rsquo;t grading.</strong> If 80% of your scores are the same number, the grader is rubber-stamping. Real measurement has shape to it.
        </p>

        <p>
          <strong>Keep the old scores when you upgrade.</strong> You can&rsquo;t see progress without a reference. Every future grader (Haiku, Sonnet, whatever comes next) gets its own column right next to the ones before it. The gap between them is the actual story.
        </p>

      </div>

      <RelatedPosts slug="grading-the-grader" />
      <div className="post-back post-back--bottom">
        <Link href="/writing">← Back to all writing</Link>
      </div>
    </article>
  );
}
