import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";

export const metadata = {
  title: "How I Automated My Soccer Club with a Bot — Jose and Goose",
  description: "Building a Python bot on a headless Linux server to manage a TrophyManager.com soccer club — scouting, bidding, lineup setting, training, and self-grading, all automated",
};

export default function HowIAutomatedTrophyManager() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 21, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>10 min read</span>
      </div>

      <h1 className="post-title">How I Automated My Soccer Club with a Bot</h1>
      <p className="post-subtitle">
        A Python bot on a headless Linux server that manages a TrophyManager.com soccer club — scouting the transfer market, placing bids, setting lineups, assigning training, listing players for sale, and grading its own decisions every Sunday
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A fully automated club manager that runs 9 cron jobs, makes dozens of decisions per day, and writes itself a weekly report card — all without opening a browser</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Advanced (Playwright browser automation, AJAX reverse-engineering, SQLite, valuation modeling, cron orchestration)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~15 hours across 10 sessions over 10 days — from first login script to v0.6.0 with self-grading AI</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-automated-trophymanager" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the always-on Alienware running all 9 cron jobs <em>(already set up)</em>
          </li>
          <li>
            <strong>Python 3.12</strong>{" "}
            — main language for all bot logic <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://playwright.dev" target="_blank" rel="noopener noreferrer">Playwright</a></strong>{" "}
            — a tool that controls a real web browser invisibly (no window, no screen — &ldquo;headless&rdquo;), used for login and market scanning <em>(free)</em>
          </li>
          <li>
            <strong>SQLite</strong>{" "}
            — a lightweight database that lives in a single file on disk (no server needed) — stores squad data, market observations, and decision logs <em>(free)</em>
          </li>
          <li>
            <strong>Claude CLI</strong>{" "}
            — powers the weekly self-grading module <em>(included in subscription)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email alerts for bids, sales, and depth analysis <em>(free tier)</em>
          </li>
        </ul>

        {/* ── What is TrophyManager ── */}
        <h2>What Is TrophyManager?</h2>
        <p>
          <a href="https://trophymanager.com" target="_blank" rel="noopener noreferrer">TrophyManager</a> is
          a browser-based soccer management sim. You run a club — setting lineups, buying and selling
          players on a live transfer market, assigning training, managing finances. Matches happen on a
          fixed schedule (Tuesdays, Thursdays, Saturdays for league; Wednesdays and Sundays for cups).
          The transfer market runs 24/7.
        </p>

        <p>
          The game rewards consistency. Checking the transfer market twice a day, setting lineups before
          every deadline, rotating training groups — it&rsquo;s a lot of small, repetitive decisions.
          The kind of thing a bot was made for.
        </p>

        <p>
          I manage a club in a mid-tier division. Sixty players on the roster, most of them youth
          prospects aged 17&ndash;19. The strategy is simple: develop cheap young players, sell them
          at peak value, and reinvest in the next batch. It&rsquo;s a volume game, and it&rsquo;s
          exactly the kind of thing you don&rsquo;t want to do manually 60 players at a time.
        </p>

        {/* ── The Login Problem ── */}
        <h2>The First Wall: Login</h2>
        <p>
          Most web automation starts with a simple POST request to a login endpoint. TrophyManager
          doesn&rsquo;t work that way. The login form submits via JavaScript that sets session
          cookies client-side. If you POST directly with Python&rsquo;s requests library, you get
          a valid response but no session cookies — and every subsequent request fails silently.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Playwright login</h4>
        <ul>
          <li>Playwright launches a headless Chromium browser, navigates to the login page</li>
          <li>Types username and password into the form fields, then presses Enter via keyboard (not button click — the form&rsquo;s JS submit handler only fires on keyboard Enter)</li>
          <li>Waits for the dashboard to load, then extracts the session cookies that the game&rsquo;s JS sets on login</li>
          <li>Cookies are saved to a local cache file and loaded into a <code>requests.Session</code> for all subsequent API calls</li>
          <li>Session is cached and reused across cron runs until it expires, then Playwright re-authenticates</li>
        </ul>

        <p>
          This was the hardest single problem in the project. Every other module — bidding, lineup,
          training — is just HTTP requests with the right cookies. Getting those cookies required
          reverse-engineering the login flow in browser DevTools and realizing that only a real
          browser submission works.
        </p>

        {/* ── Reverse Engineering ── */}
        <h2>Mapping the Game&rsquo;s AJAX Endpoints</h2>
        <p>
          TrophyManager has no public API. Everything happens through internal AJAX endpoints —
          hidden URLs that the game&rsquo;s JavaScript calls behind the scenes to fetch and save
          data. I opened the browser&rsquo;s DevTools (the built-in developer panel that shows
          every network request a page makes), clicked through every feature in the game, and
          logged every request. The result was a map of POST endpoints that
          the bot uses for everything:
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Key endpoint categories</h4>
        <ul>
          <li><strong>Tactics</strong> — get the full squad list, save a lineup with formation</li>
          <li><strong>Training</strong> — assign players to training groups</li>
          <li><strong>Transfer market</strong> — check bid status, place bids, list players for sale</li>
          <li><strong>Player data</strong> — detailed stats including hidden attributes like &ldquo;routine&rdquo;</li>
          <li><strong>Sponsors</strong> — sign the best available deal</li>
          <li><strong>Scouting</strong> — dispatch scouts and retrieve reports</li>
        </ul>

        <p>
          One gotcha: skill values of 19 and 20 are returned as HTML <code>&lt;img&gt;</code> star
          tags instead of numbers. The parser has to read the <code>alt</code> attribute to get the
          numeric value. This is the kind of thing that only shows up when your bot tries to sort
          players by skill and everything above 18 comes back as <code>NaN</code>.
        </p>

        {/* ── The Modules ── */}
        <h2>Nine Modules, Nine Cron Jobs</h2>
        <p>
          Each bot responsibility is a separate module with its own cron schedule:
        </p>

        <ul>
          <li><strong>market_scan</strong> (every 10 min) — browses the transfer market for undervalued players, scores them against a valuation model</li>
          <li><strong>market_bid</strong> (every 2 min) — checks active bids, places new bids on flagged opportunities</li>
          <li><strong>market_list</strong> (daily 9am) — evaluates the squad for sell candidates, lists them with calculated minimum prices</li>
          <li><strong>lineup</strong> (match days, 2pm) — sets the optimal starting XI before the 3pm deadline</li>
          <li><strong>training</strong> (Tuesdays 8am) — assigns all players to the correct training groups</li>
          <li><strong>sponsor</strong> (daily 6am) — checks if the sponsor deal needs renewing, signs the best one</li>
          <li><strong>squad_audit</strong> (Sundays 10am) — full roster review: age distribution, position depth, financial summary</li>
          <li><strong>scout_deploy</strong> — dispatches scouts to evaluate prospective purchases</li>
          <li><strong>grader</strong> (Sundays 11am) — Claude reviews the week&rsquo;s decisions and writes a self-assessment</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">The 2-minute bid sniper</span>
          <p>
            Transfer bids in TrophyManager have a countdown. Running the bid module every 2 minutes
            means the bot can outbid competitors in the final minutes of an auction. It&rsquo;s
            the most aggressive cron interval on the server — 720 runs per day — but each run
            is a single lightweight HTTP request.
          </p>
        </div>

        {/* ── Valuation Model ── */}
        <h2>The Valuation Model</h2>
        <p>
          The bot doesn&rsquo;t just buy cheap players. It estimates what a player is worth based
          on age, skill index, and a hidden stat called &ldquo;routine&rdquo; — a composite training
          discipline score that ranges from 1 to 60+. Higher routine means the player develops
          faster and is worth more long-term.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Valuation logic</h4>
        <ul>
          <li>Base value uses market rate per ASI (aggregate skill index) — calibrated from 16,000+ market observations</li>
          <li>Routine multiplier: &lt;10 = &times;0.9, 10&ndash;19 = &times;1.0, 20&ndash;29 = &times;1.1, 30&ndash;39 = &times;1.2, 40+ = &times;1.3</li>
          <li>Age-adjusted routine floor: younger players get more leeway (a 17-year-old with routine 8 is fine; a 26-year-old with routine 8 is a pass)</li>
          <li>Sell-side scarcity premium: high-routine players (&gt;40) are rare on the market, so listings get a 15% premium</li>
          <li>Starting XI gate: if a sell candidate is in the starting lineup, the bot emails a depth analysis table before listing — showing top 4 backups at the position with color-coded viability ratings</li>
        </ul>

        <p>
          The valuation model was rewritten twice. The first version used a flat rate per ASI point.
          The second added routine awareness after competitive analysis showed that the top clubs in
          the division were winning through squad quality (average routine 42.9) rather than tactical
          variety — they all used the same mentality every match. The gap was player development, not
          strategy.
        </p>

        {/* ── Self-Grading ── */}
        <h2>The Bot Grades Itself</h2>
        <p>
          Every Sunday at 11am, the grader module runs. It pulls the week&rsquo;s decisions from
          the SQLite database — bids placed, players sold, lineup choices, training assignments —
          and passes them to Claude CLI with a prompt asking for an honest assessment.
        </p>

        <p>
          Claude looks at outcomes: did the bid win? Was the sale price reasonable? Did the lineup
          choice result in a win? The grader has per-module &ldquo;grace days&rdquo; because some
          outcomes take time to materialize — a scout dispatch takes 10 days to return results, so
          the grader doesn&rsquo;t judge scouting decisions until they&rsquo;ve had time to play out.
        </p>

        <p>
          Decisions are logged to a local file with timestamps, module names, and
          Claude&rsquo;s assessment. Over time, this creates a decision history that
          I can review to see if the bot is getting better or repeating mistakes.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          The bot went from first commit to v0.6.0 in 10 days and 10 sessions. It now runs 9
          cron jobs, makes dozens of automated decisions per day, and emails me when something
          needs human judgment (like selling a starter without a backup).
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Individual modules</strong> — once the login and session management worked,
            each module was a straightforward loop: fetch data, apply logic, take action. Training
            assignment took 30 minutes. Sponsor renewal took 20. The pattern repeats.
          </li>
          <li>
            <strong>SQLite for everything</strong> — no external database, no connection strings,
            no network latency. The entire bot state lives in one file on disk. Queries are instant
            and backups are just file copies.
          </li>
          <li>
            <strong>Cron scheduling</strong> — same pattern as every other Alienware project. One
            line per module in the crontab. The simplicity of cron makes it easy to add, test, and
            adjust schedules.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>The Playwright login</strong> — three hours of trial and error. POST requests,
            form submissions, cookie injection — nothing worked until I watched the actual JS
            execution in DevTools and realized the session cookies are set by client-side code that
            only fires on a real browser form submission via keyboard Enter.
          </li>
          <li>
            <strong>Star-rating HTML parsing</strong> — skills 19 and 20 return as <code>&lt;img&gt;</code>
            tags with star icons instead of numeric values. The bot sorted every 19+ player as
            <code>NaN</code> until I added parsing for the <code>alt</code> attribute. A silent
            data bug that only shows up at the top of the skill range.
          </li>
          <li>
            <strong>Valuation calibration</strong> — the first flat-rate model overpaid for old
            players and underbid on young ones. The routine-aware rewrite required logging 16,000+
            market observations to understand what players actually sell for, then building age curves
            and scarcity premiums on top of that data.
          </li>
          <li>
            <strong>Endpoint discovery</strong> — TrophyManager has no API documentation. Every endpoint
            was found by clicking through the game in DevTools and watching network requests. Some
            features aren&rsquo;t where you&rsquo;d expect — scouting doesn&rsquo;t have its own
            endpoint; it piggybacks on a general player info endpoint with a special parameter.
            The obvious URL for scouting returns a 404.
          </li>
          <li>
            <strong>Phantom automation</strong> — this was the biggest lesson of the project. Claude
            would write a module, I&rsquo;d add the cron job, and I&rsquo;d assume it was running.
            But for the first two weeks, most of the &ldquo;automated&rdquo; actions never actually
            fired. Endpoints were mapped wrong. Parsers assumed response shapes that didn&rsquo;t
            match reality. The scouting module called an endpoint that returned a 404. The bid
            module used field names from the wrong AJAX response. The lineup module sent a payload
            format the game silently rejected. Everything <em>looked</em> right in the code. Claude
            was confident. The cron jobs ran on schedule. But the actual game state never changed.
            I&rsquo;d log in manually and find that no bids had been placed, no lineups had been
            set, and no scouts had been dispatched — for days. The fix wasn&rsquo;t more code; it
            was logging every raw API response, diffing expected vs. actual payloads, and verifying
            in-game that each action actually took effect. This is the gap between &ldquo;the script
            runs without errors&rdquo; and &ldquo;the script does what you think it does.&rdquo;
          </li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">AI overconfidence is real</span>
          <p>
            Claude wrote every module with high confidence — correct syntax, clean structure,
            reasonable logic. But confidence isn&rsquo;t correctness. When the AI is guessing at
            undocumented API contracts, it produces code that looks professional and does nothing.
            The only defense is verifying outcomes in the real system, not just checking that the
            code runs.
          </p>
        </div>

        <p>
          This is the most fun project on the server. Not because it&rsquo;s the most useful — the
          market briefing and alert system have more real-world value. But there&rsquo;s something
          satisfying about taking Goose for a walk, coming back, and finding an email that says
          the bot bought three youth prospects overnight. Then checking in on Sunday to read
          Claude&rsquo;s honest assessment of whether those purchases were smart.
        </p>

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
