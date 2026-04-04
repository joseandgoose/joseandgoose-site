import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built 50+ Dynamic Greetings Using Claude Code — Jose and Goose",
  description: "Replacing static homepage text with 50 time-aware greeting variants using Claude Code — and learning why iteration beats perfection",
};

export default function HowIBuiltGreetings() {
  return (
    <>
      {/* ── ARTICLE ── */}
      <article className="post">
        {/* Back link */}
        <div className="post-back">
          <Link href="/writing">← All Writing</Link>
        </div>

        {/* Meta */}
        <div className="post-meta">
          <span>February 27, 2026</span>
          <span className="post-meta-dot">·</span>
          <span>6 min read</span>
        </div>
      <PostTags slug="how-i-built-greetings" />

        {/* Title */}
        <h1 className="post-title">How I Built 50+ Dynamic Greetings Using Claude Code</h1>
        <p className="post-subtitle">
          Replacing 8 static words with time-aware messages — and learning why iteration beats perfection
        </p>

        {/* ── BODY ── */}
        <div className="post-body">
          <div className="post-recipe-meta">
            <div className="post-recipe-row">
              <span className="post-recipe-label">Yield</span>
              <span>50+ greeting variants that change by time of day and day of week</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Difficulty</span>
              <span>Beginner code, advanced copywriting (iteration required)</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Total Cook Time</span>
              <span>~45 minutes of coding, ~90 minutes of copy iteration</span>
            </div>
          </div>
          <TLDRBadge slug="how-i-built-greetings" />

          {/* ── INGREDIENTS ── */}
          <h2>Ingredients</h2>
          <ul>
            <li>
              <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
              — terminal-based AI for direct file editing and iteration <em>($200/yr)</em>
            </li>
            <li>
              <strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong>{" "}
              — React framework with client-side hooks <em>(free)</em>
            </li>
            <li>
              <strong>8 static words</strong> — &ldquo;finance background, product focus / using AI to build&rdquo; <em>(free to replace)</em>
            </li>
            <li>
              <strong>Patience for copy iteration</strong> — first drafts are never the keepers <em>(priceless)</em>
            </li>
          </ul>

          {/* ── THE PROBLEM ── */}
          <h2>The Problem: Static Text Is Boring</h2>
          <p>
            The homepage hero had 8 words that never changed: &ldquo;finance background, product focus /
            using AI to build.&rdquo; Accurate, but lifeless. Every visitor saw the exact same text whether
            they landed at 7am on a Tuesday or midnight on Saturday. No personality. No context. No Goose.
          </p>

          <p>
            The idea: replace those 8 words with time-aware greetings that acknowledge what&rsquo;s actually
            happening — morning coffee, midday work, afternoon dog walks, evening wind-down, late-night building.
            Weekday greetings could reference markets and meetings. Weekend greetings could be about beach trips
            and trail runs. Make the site feel alive.
          </p>

          {/* ── SESSION ── */}
          <h2>The Build: 45 Minutes of Code, 90 Minutes of Copy</h2>
          <p className="post-session-meta">Evening, February 27 — ~2 hours 15 minutes total</p>
          <p className="post-pace">
            <strong>Pace:</strong> Code was fast. Copy took 6 rounds of iteration. Worth every minute.
          </p>

          <h3>Round 1: The Overenthusiastic First Draft</h3>
          <p>
            I gave <strong>Claude Code</strong> the brief: create 5 time-based greetings (morning, midday,
            afternoon, evening, night) with weekday and weekend variants. Mention markets on weekdays, adventures
            on weekends. Reference Goose, daily activities, keep it warm and slightly playful.
          </p>

          <p>
            <strong>Claude Code</strong> generated 50 greetings in one response. They were... enthusiastic:
          </p>

          <ul>
            <li>&ldquo;Good morning! Markets are opening at 9:30 — coffee&rsquo;s brewing, ideas are flowing, and Goose is eyeing his breakfast bowl while Jose&rsquo;s thinking about the first build of the day.&rdquo;</li>
            <li>&ldquo;Evening. Markets closed for the day. Time for dinner (myperfectpet fresh food for Goose), maybe some guitar or drums, and then building whatever sparked curiosity today.&rdquo;</li>
            <li>&ldquo;Late night. Markets won&rsquo;t open for hours. Goose is asleep, dreaming of Bocce&rsquo;s treats. You should probably be sleeping too, but if you&rsquo;re still building things... same.&rdquo;</li>
          </ul>

          <p>
            Problem: The original text was <strong>8 words</strong>. These were <strong>25-35 words</strong>.
            Way too verbose. Trying to say everything in every greeting.
          </p>

          <div className="post-tip">
            <span className="post-tip-label">Iteration lesson #1</span>
            <p>
              First drafts overcompensate. You give AI context about your life (markets, hobbies, dog treats),
              and it tries to pack all of it into every sentence. Trim ruthlessly.
            </p>
          </div>

          <h3>Round 2: Cutting the Cruise Control</h3>
          <p>Feedback to <strong>Claude Code</strong>: &ldquo;These are way too long. The original was 8 words. Keep it to 8-12 words max. One idea per greeting.&rdquo;</p>

          <p>New batch:</p>

          <ul>
            <li>&ldquo;Morning. Markets warming up. Coffee brewing. Goose eyeing breakfast.&rdquo;</li>
            <li>&ldquo;Evening. Markets closed. Dinner first. Building second.&rdquo;</li>
            <li>&ldquo;Late night. Markets dark. Goose asleep. Maybe you should be too.&rdquo;</li>
          </ul>

          <p>
            Better! But now they felt choppy. Too staccato. And <em>every single greeting</em> mentioned
            markets. That&rsquo;s not the vibe — I&rsquo;m not a day trader checking the S&amp;P every hour.
          </p>

          <h3>Round 3: The Market Problem</h3>
          <p>
            Feedback: &ldquo;Market mentions are overwhelming. Only mention markets 20% of the time on weekdays,
            and never on weekends. Also, you can&rsquo;t reference exact market times (9:30am) because visitors
            are in different timezones. Make it vague.&rdquo;
          </p>

          <p>
            <strong>Claude Code</strong> updated the logic: out of 5 weekday variants per time bucket, only 1
            mentions markets. Weekend variants dropped all market references and shifted to beach trips, hiking,
            city exploring, farmers markets.
          </p>

          <p>This felt more human. Not everything is about the NYSE.</p>

          <div className="post-tip">
            <span className="post-tip-label">Iteration lesson #2</span>
            <p>
              When you give AI a theme (&ldquo;acknowledge markets&rdquo;), it defaults to mentioning it constantly.
              You have to explicitly set limits: 20% of the time, vague references only, weekdays only.
            </p>
          </div>

          <h3>Round 4: Fixing the Wordiness (Again)</h3>
          <p>
            Even at 8-12 words, some greetings were trying to do too much. Example: &ldquo;Morning. Iced matcha
            ready, run done, building mode, Goose supervising.&rdquo; Four activities in one sentence.
          </p>

          <p>Feedback: &ldquo;You&rsquo;re still trying to mention all my hobbies. Pick one. Keep it natural.&rdquo;</p>

          <p>Revised:</p>

          <ul>
            <li>&ldquo;Morning run done. Building mode. The schnauzer&rsquo;s supervising.&rdquo;</li>
            <li>&ldquo;Afternoon. Walk time. Goose knows the schedule better than anyone.&rdquo;</li>
            <li>&ldquo;Evening. Dog fed. Reading time. Goose judges from the couch.&rdquo;</li>
          </ul>

          <p>Now they breathed. One activity, one vibe, one moment.</p>

          <h3>Round 5: Time Window Adjustments</h3>
          <p>
            The initial time buckets felt off. Night started at 10pm, which meant evening greetings (6-10pm)
            were talking about dinner at 9:45pm. Dinner happens around 6-7pm, not late evening.
          </p>

          <p>Feedback: &ldquo;Shift all time windows up 2 hours. Night should start at midnight.&rdquo;</p>

          <p>
            <strong>Claude Code</strong> adjusted the logic and moved dinner-related greetings from evening
            to afternoon (4-8pm). Evening (8pm-midnight) became post-dinner wind-down — reading, music, late-night
            building.
          </p>

          <p>Better daily rhythm. The greetings now matched real life.</p>

          <h3>Round 6: The Final Polish</h3>
          <p>Last round of tweaks:</p>

          <ul>
            <li>&ldquo;Coffee&rdquo; → &ldquo;Iced matcha&rdquo; or &ldquo;Flat white&rdquo; (actual preferences)</li>
            <li>&ldquo;myperfectpetfood&rdquo; → &ldquo;myperfectpet fresh food&rdquo; (correct brand name)</li>
            <li>Night greetings got cheekier: &ldquo;Late. Goose is asleep. You should be too.&rdquo;</li>
            <li>Removed workaholic vibes — added reading, guitar, drums, plant watering</li>
          </ul>

          <p>
            After 6 rounds of iteration, we had <strong>50 greetings</strong> (5 time periods × weekday/weekend × 5 variants)
            that felt personal, natural, and appropriately concise.
          </p>

          <div className="post-visual">
            <div className="post-terminal">
              <div className="post-terminal-bar">
                <span className="post-terminal-dot post-terminal-dot--red"></span>
                <span className="post-terminal-dot post-terminal-dot--yellow"></span>
                <span className="post-terminal-dot post-terminal-dot--green"></span>
                <span className="post-terminal-bar-title">Claude Code — Iteration</span>
              </div>
              <div className="post-terminal-body">
                <div><span className="post-terminal-blue">You:</span> These are still too wordy. 8-12 words max.</div>
                <br />
                <div><span className="post-terminal-green">Claude:</span> Updated all 50 greetings to be more concise.</div>
                <div className="post-terminal-dim">Files modified: app/page.tsx</div>
                <br />
                <div><span className="post-terminal-blue">You:</span> Market mentions only 20% of the time on weekdays.</div>
                <br />
                <div><span className="post-terminal-green">Claude:</span> Reduced market references to 1 out of 5 per bucket.</div>
                <div className="post-terminal-dim">Weekends now focus on beach/hiking/city exploring.</div>
              </div>
            </div>
            <p className="post-visual-caption">
              6 rounds of iteration in <strong>Claude Code</strong> — edit, refresh browser, give feedback, repeat.
            </p>
          </div>

          <div className="post-tip">
            <span className="post-tip-label">Iteration lesson #3</span>
            <p>
              Good copy doesn&rsquo;t happen in one shot. The first draft gives you material to react to.
              The second draft fixes the obvious problems. Rounds 3-6 are where personality emerges.
            </p>
          </div>

          {/* ── THE CODE ── */}
          <h2>The Code: Simpler Than the Copy</h2>
          <p>
            Once the copy was right, the actual code change was small — about 110 lines of JavaScript
            that detects the visitor&rsquo;s local time, checks if it&rsquo;s a weekend, picks the right
            bucket of greetings, and returns a random one. The hard part was never the code; it was
            getting 50 greetings to feel natural.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Greeting logic implementation</h4>
          <ul>
            <li>Add <code>&ldquo;use client&rdquo;</code> at the top (client-side React hooks needed)</li>
            <li>Create a <code>greetings</code> object with all 50 variants organized by weekday/weekend and time of day</li>
            <li>Write a <code>getGreeting()</code> function that detects the visitor&rsquo;s local time, checks if it&rsquo;s a weekend, picks the right time bucket, and returns a random greeting</li>
            <li>Use <code>useState</code> and <code>useEffect</code> to set the greeting on page load</li>
            <li>Replace the static hero text with the dynamic greeting</li>
          </ul>

          <p>
            Total lines of code: ~110. Total time to write the code: ~15 minutes. The hard part wasn&rsquo;t
            the JavaScript — it was getting 50 greetings to feel natural, personal, and not annoying.
          </p>

          {/* ── DEPLOYMENT ── */}
          <h2>Deployment: One Command (And One Fix)</h2>
          <p>
            Tested locally at <code>localhost:3000</code> by refreshing at different times of day (and manually
            changing my system clock to test all time buckets). When everything felt right, one command to{" "}
            <strong>Claude Code</strong>: &ldquo;Push it live.&rdquo;
          </p>

          <p>
            <strong>Claude Code</strong> ran <code>git add</code>, <code>git commit</code>, and <code>git push</code>.
            <strong>Vercel</strong> detected the push and started building. Then: email notification with subject
            line &ldquo;Failed production deployment.&rdquo;
          </p>

          <p>
            The error: TypeScript couldn&rsquo;t verify that <code>timeOfDay</code> was one of the valid greeting
            keys. The <code>npm run dev</code> local server doesn&rsquo;t run strict TypeScript checks, so the issue
            only surfaced during Vercel&rsquo;s production build.
          </p>

          <div className="post-tip">
            <span className="post-tip-label">Build lesson</span>
            <p>
              Local dev servers are forgiving. Production builds are not. Even terminal-based AI doesn&rsquo;t
              catch everything first try — <code>npm run build</code> locally before pushing saves the
              round-trip to Vercel.
            </p>
          </div>

          <p>
            Fix: one line. Added a TypeScript union type to <code>timeOfDay</code>:
          </p>

          <p>
            <code>let timeOfDay: &ldquo;morning&rdquo; | &ldquo;midday&rdquo; | &ldquo;afternoon&rdquo; | &ldquo;evening&rdquo; | &ldquo;night&rdquo;;</code>
          </p>

          <p>
            Ran <code>npm run build</code> locally. Build passed. Pushed again. <strong>Vercel</strong> deployed
            in 60 seconds. Done.
          </p>

          {/* ── FINAL OUTPUT ── */}
          <h2>Final Output</h2>
          <p>
            A homepage at <strong>joseandgoose.com</strong> that greets every visitor with a different message
            based on their local time and day of week. 50+ greeting variants covering weekdays and weekends,
            morning matcha and midnight sleep nudges, market references and beach trips, dog dinner and guitar
            practice — built in 2 hours 15 minutes, iterated 6 times, deployed with one command.
          </p>

          <h3>What went fast</h3>
          <ul>
            <li>
              <strong>Code implementation</strong> (15 minutes — React hooks, time detection, random selection)
            </li>
            <li>
              <strong>First draft generation</strong> (<strong>Claude Code</strong> wrote all 50 greetings in one response)
            </li>
            <li>
              <strong>Iteration cycles</strong> (screenshot → feedback → refresh loop was instant with <strong>Claude Code</strong>)
            </li>
            <li>
              <strong>Deployment</strong> (one command, <strong>Vercel</strong> auto-deployed in 60 seconds)
            </li>
          </ul>

          <h3>What needed patience</h3>
          <ul>
            <li>
              <strong>Copy refinement</strong> (6 rounds to go from 25-word sentences to 8-12 word greetings)
            </li>
            <li>
              <strong>Balancing themes</strong> (markets vs hobbies vs dog content — had to set explicit ratios)
            </li>
            <li>
              <strong>Time window tuning</strong> (dinner at 9pm felt wrong, shifted everything up 2 hours)
            </li>
            <li>
              <strong>Tone calibration</strong> (playful but not cutesy, personal but not oversharing, cheeky but not annoying)
            </li>
          </ul>

          <p>
            The biggest lesson? Writing 50 variants of &ldquo;good morning&rdquo; teaches you more about your
            own voice than writing one perfect sentence. Iteration isn&rsquo;t a bug in the process — it <em>is</em> the
            process. The greetings that landed weren&rsquo;t the ones <strong>Claude Code</strong> generated first.
            They were the ones that survived 6 rounds of &ldquo;shorter, less markets, more Goose.&rdquo;
          </p>

          <p>
            And now the homepage says something different to everyone. A visitor at 7am on Tuesday sees matcha
            and morning runs. A visitor at midnight on Saturday gets a gentle sleep nudge. The schnauzer supervises
            in all 50 variants. That&rsquo;s the goal.
          </p>
        </div>

        {/* Back link bottom */}
      <RelatedPosts slug="how-i-built-greetings" />
        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </article>
    </>
  );
}
