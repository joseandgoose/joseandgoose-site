import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built a Cron-Powered Operations Layer on a Home Linux Server — Jose and Goose",
  description: "From 3 cron jobs to 100+ lines of scheduled automation — how a headless Linux server grew into a personal operations platform running market data, game bots, monitoring, security, and batch tasks",
};

export default function HowIBuiltCronOps() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 25, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>9 min read</span>
      </div>
      <PostTags slug="how-i-built-cron-ops" />

      <h1 className="post-title">How I Built a Cron-Powered Operations Layer on a Home Linux Server</h1>
      <p className="post-subtitle">
        What started as three cron jobs grew into 100+ lines of scheduled automation — market briefings, game bots, security audits, batch task queues, health checks, and weekly reports, all orchestrated by a single crontab on a headless Alienware
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A personal operations platform that runs 24/7 — dozens of automated tasks from every-minute job queues to monthly reboots, all managed through one crontab file</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (cron syntax, bash scripting, environment management, job dependency ordering, failure handling)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~10 hours across 25+ days — each job is 15–30 minutes, but the layer grew incrementally as new projects came online</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-cron-ops" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>cron</strong>{" "}
            — Linux&rsquo;s built-in task scheduler. You give it a time pattern and a command, and it runs that command on repeat forever. Installed on every Linux system by default <em>(free)</em>
          </li>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the always-on Alienware from the earlier posts <em>(already set up)</em>
          </li>
          <li>
            <strong>bash + Python 3</strong>{" "}
            — the two languages every job is written in <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email delivery for alerts and reports <em>(free tier)</em>
          </li>
          <li>
            <strong><a href="https://healthchecks.io" target="_blank" rel="noopener noreferrer">healthchecks.io</a></strong>{" "}
            — external dead-man&rsquo;s switch that alerts when jobs stop running <em>(free tier)</em>
          </li>
        </ul>

        {/* ── How It Started ── */}
        <h2>How It Started: Three Jobs</h2>
        <p>
          When I first set up the Alienware as a headless server, the crontab had three entries:
          a Garmin recap at 7am, a site uptime check every 5 minutes, and a healthchecks.io
          heartbeat every 30 minutes. Three lines. That was the whole system.
        </p>

        <p>
          Then I added the market briefing. Then the alert system. Then the TrophyManager bot.
          Then a batch task queue. Then security audits. Each project added its own cron jobs, and
          the crontab grew from 3 lines to over 100. At some point it stopped being a list of
          scheduled tasks and became something else — an operations layer.
        </p>

        <p>
          This post isn&rsquo;t about any one project. It&rsquo;s about the layer underneath all
          of them: how cron jobs interact, how they fail, how you organize 100+ lines of scheduled
          automation without losing track of what&rsquo;s running when.
        </p>

        {/* ── The Full Stack ── */}
        <h2>The Full Stack: What Runs and When</h2>
        <p>
          Every job falls into one of six categories. Grouping them this way is the difference
          between a crontab you can read and one you can&rsquo;t:
        </p>

        <h3>Every minute</h3>
        <ul>
          <li><strong>batch task queue worker</strong> — processes text files dropped into an inbox folder. The most frequent job on the system: <code>* * * * *</code></li>
        </ul>

        <h3>Every few minutes</h3>
        <ul>
          <li><strong>Site uptime monitor</strong> (every 5 min) — curls joseandgoose.com, alerts on non-200</li>
          <li><strong>Resource sampler</strong> (every 10 min) — logs CPU, memory, and swap to a daily CSV</li>
          <li><strong>healthchecks.io heartbeat</strong> (every 30 min) — external dead-man&rsquo;s switch</li>
          <li><strong>TM market scanner</strong> (every 10 min) — browses transfer market for undervalued players</li>
          <li><strong>TM bid sniper</strong> (every 2 min) — checks and places bids on flagged targets</li>
          <li><strong>0DTE options monitor</strong> (every 5 min, 9:30&ndash;11:30 ET weekdays) — logs SPX options data</li>
        </ul>

        <h3>Daily</h3>
        <ul>
          <li><strong>Garmin recap</strong> (7am) — fetches health data, generates AI summary</li>
          <li><strong>Garmin failure check</strong> (8am) — alerts if the 7am recap didn&rsquo;t produce output</li>
          <li><strong>Market briefing</strong> (8am weekdays) — AI-generated market email to subscribers</li>
          <li><strong>TM sponsor check</strong> (6am) — renews sponsor deals when they expire</li>
          <li><strong>TM market list</strong> (9am) — evaluates squad for sell candidates</li>
          <li><strong>Fail2ban report</strong> (7pm) — daily delta of new SSH bans</li>
          <li><strong>0DTE EOD backfill</strong> (4:15pm weekdays) — realized vol and close prices</li>
        </ul>

        <h3>Match days (TrophyManager)</h3>
        <ul>
          <li><strong>TM lineup</strong> (2pm, Tue/Thu/Sat for league, Wed/Sun for cups) — sets starting XI before the 3pm deadline</li>
          <li><strong>TM training</strong> (8am Tuesdays) — assigns all players to training groups</li>
        </ul>

        <h3>Weekly (Sundays)</h3>
        <ul>
          <li><strong>Log archiver</strong> (1am) — rotates logs to weekly archives</li>
          <li><strong>Security updates</strong> (2am) — apt upgrades and journal vacuum</li>
          <li><strong>Claude changelog</strong> (7am) — AI writes a plain-English weekly server summary</li>
          <li><strong>Supabase health + GitHub activity</strong> (8am) — database ping and code activity report</li>
          <li><strong>Weekly status report</strong> (9am) — everything in one Sunday email</li>
          <li><strong>TM squad audit</strong> (10am) — full roster review</li>
          <li><strong>TM self-grader</strong> (11am) — Claude reviews the week&rsquo;s bot decisions</li>
          <li><strong>Lynis security audit</strong> (Saturday 11pm) — system hardening scan</li>
        </ul>

        <h3>Monthly</h3>
        <ul>
          <li><strong>apt autoremove</strong> (1st at 2am) — cleans up unused packages</li>
          <li><strong>Scheduled reboot</strong> (1st at 4am) — clean restart, picks up kernel updates</li>
          <li><strong>Disk snapshot</strong> (Mondays 8am) — tracks disk usage over time</li>
        </ul>

        {/* ── The Hard Parts ── */}
        <h2>What Makes Cron Hard at Scale</h2>

        <h3>1. The environment problem</h3>
        <p>
          Cron jobs don&rsquo;t run in your normal terminal environment. They get a stripped-down
          version with almost nothing in <code>PATH</code> (the list of directories where Linux
          looks for programs). A script that works perfectly when you type
          <code>python3 myscript.py</code> in a terminal will fail silently in cron because
          cron doesn&rsquo;t know where <code>python3</code> lives.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: PATH fix</h4>
        <ul>
          <li>Option 1: set <code>PATH</code> at the top of the crontab: <code>PATH=/usr/local/bin:/usr/bin:/bin:/home/[user]/.local/bin</code></li>
          <li>Option 2: use absolute paths in every command: <code>/usr/bin/python3 /home/[user]/scripts/market-daily.py</code></li>
          <li>I use option 1 (global PATH header) for simplicity, with absolute paths as a fallback in wrapper scripts</li>
          <li>Environment variables like API keys are sourced from <code>.env</code> files inside each wrapper script, not from the crontab</li>
        </ul>

        <h3>2. The dependency chain</h3>
        <p>
          Some jobs depend on other jobs. The Sunday 9am weekly report reads output from the
          7am changelog and the 8am health check. If the 7am job runs slow, the 9am job reads
          an empty file. The fix: each downstream job checks for its inputs and substitutes a
          &ldquo;data unavailable&rdquo; fallback if any input is missing. The report always
          sends, even when upstream jobs fail.
        </p>

        <h3>3. Silent failures</h3>
        <p>
          Cron doesn&rsquo;t tell you when a job fails. The job runs, crashes, and cron moves on.
          Unless you&rsquo;ve built in logging and alerting, you won&rsquo;t know until you notice
          a missing output. Every job on this server logs to its own file, and critical jobs
          (Garmin, market briefing) have a secondary failure-check job that runs an hour later
          to verify the output exists.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The dead-man&rsquo;s switch pattern</span>
          <p>
            Instead of the job alerting on failure (which it can&rsquo;t do if it crashed), a
            second job checks for the <em>absence of success</em>. If the expected output file
            doesn&rsquo;t exist, the checker sends an alert. This catches silent crashes, auth
            errors, network timeouts — anything that prevents the job from completing without
            producing an error message.
          </p>
        </div>

        <h3>4. Resource collisions</h3>
        <p>
          Multiple scripts share the same Schwab API token for market data. The market briefing,
          the options monitor, and the trading bot all need to refresh and use the same OAuth token.
          Without coordination, one script refreshes the token while another is mid-request, and
          the second script&rsquo;s token is now invalid.
        </p>

        <p>
          The solution is a shared token manager with file locking. One Python module handles all
          token reads and writes, using a lock file to prevent concurrent refreshes. Every script
          that needs market data imports the same module instead of managing tokens independently.
        </p>

        {/* ── Organization ── */}
        <h2>Organizing 100+ Lines</h2>
        <p>
          The crontab is organized by category with comment headers. Every entry follows the same
          format: schedule, wrapper script path, redirect stdout/stderr to a log file. No inline
          logic in the crontab itself — all logic lives in the scripts.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Crontab conventions</h4>
        <ul>
          <li>Comment headers group jobs by project: <code># === MONITORING ===</code>, <code># === TROPHYMANAGER ===</code>, <code># === MARKET ===</code></li>
          <li>Every job redirects output: <code>&gt;&gt; /path/to/log 2&gt;&amp;1</code></li>
          <li>Wrapper scripts — small shell scripts (<code>.sh</code> files) that handle the setup (loading API keys, setting the working directory) before calling the actual Python or bash script. Think of them as a pre-flight checklist that runs before each job.</li>
          <li>The crontab itself has no <code>cd</code> commands, no pipes, no conditionals — just schedule + script + log</li>
          <li>Self-gating jobs: the 0DTE monitor runs <code>*/5 9-11 * * 1-5</code> but checks the clock internally and exits early if it&rsquo;s before 9:30 or after 11:30 ET</li>
        </ul>

        <p>
          The wrapper script pattern is the key organizational choice. Without it, the crontab would
          be full of long one-liners with <code>source .env &amp;&amp; cd /path &amp;&amp; python3 script.py</code>.
          With wrappers, each crontab line is short and readable, and the setup logic lives where it
          can be tested independently.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          The crontab is the nervous system of the server. Every project on the Alienware — monitoring,
          market data, game bots, batch tasks, security — ultimately expresses itself as one or more cron
          entries. Adding a new capability means writing a script and adding a line. Removing one
          means commenting it out.
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Adding individual jobs</strong> — once the conventions are established (wrapper
            script, log file, comment header), a new cron job is 5 minutes of work. The pattern
            is completely repeatable.
          </li>
          <li>
            <strong>cron itself</strong> — no daemon to configure, no YAML to write, no service to
            deploy. <code>crontab -e</code>, add a line, save. It&rsquo;s been the same interface for
            decades because it doesn&rsquo;t need to change.
          </li>
          <li>
            <strong>Log file debugging</strong> — every job writes to its own log. When something
            breaks, the answer is almost always in the log file. No centralized logging system
            needed at this scale.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Cron environment surprises</strong> — even after setting PATH in the header, some
            jobs still failed because they depended on environment variables (API keys, database URLs)
            that only exist in interactive shells. Moving all env loading into wrapper scripts solved
            this permanently, but the first few failures were confusing.
          </li>
          <li>
            <strong>Timezone awareness</strong> — the server runs in Pacific time. Market-related
            jobs need to fire based on Eastern time. Cron doesn&rsquo;t support per-job timezones.
            The solution: schedule jobs in broad windows and let the scripts self-gate based on
            the actual ET clock.
          </li>
          <li>
            <strong>The Sunday chain</strong> — 5 jobs run between 7am and 11am every Sunday, each
            depending on outputs from earlier jobs. Getting the timing right so the weekly report
            has all its inputs required staggering the schedule and adding fallbacks for every
            missing input. This took three Sundays of iteration to get reliable.
          </li>
          <li>
            <strong>Token refresh races</strong> — two scripts trying to refresh the same OAuth
            token at the same time. The shared token manager with file locking was the fix, but
            I didn&rsquo;t add it until after a week of intermittent &ldquo;invalid token&rdquo;
            errors that only happened when the market briefing and options monitor ran within
            seconds of each other.
          </li>
        </ul>

        <p>
          I didn&rsquo;t set out to build an operations platform. I set out to automate a Garmin
          email so I could read it while walking Goose. Then a market briefing. Then a game bot. Each one added a few lines to the crontab,
          and eventually the crontab itself became the most important file on the server. It&rsquo;s
          the single source of truth for everything the machine does, and reading it top to bottom
          is the fastest way to understand what this server is for.
        </p>
      <RelatedPosts slug="how-i-built-cron-ops" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
