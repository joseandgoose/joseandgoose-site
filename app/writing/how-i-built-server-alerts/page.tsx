import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built a Full Status Alert System — Jose and Goose",
  description: "Building a suite of automated status emails for website uptime, Supabase health, API monitoring, Fail2ban reports, and a weekly recap — all running on a headless home server",
};

export default function HowIBuiltServerAlerts() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 8, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>10 min read</span>
      </div>
      <PostTags slug="how-i-built-server-alerts" />

      <h1 className="post-title">How I Built a Full Status Alert System</h1>
      <p className="post-subtitle">
        Website uptime, Supabase health, API monitoring, Garmin failure alerts, Fail2ban reports, personal changelog, and a weekly summary email — all automated from a headless home server
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A full observability stack for a personal server — every meaningful system sends an alert or weekly report automatically, with zero manual checking</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (bash scripting, cron scheduling, Resend API, Claude CLI integration)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~4 hours spread across several sessions — each alert is 20–45 minutes individually</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-server-alerts" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the old laptop from the previous two posts, running 24/7 <em>(already set up)</em>
          </li>
          <li>
            <strong>cron</strong>{" "}
            — Linux task scheduler, built-in <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email API for all alert delivery <em>(free tier: 3,000 emails/month)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI for writing every script <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://healthchecks.io" target="_blank" rel="noopener noreferrer">healthchecks.io</a></strong>{" "}
            — dead-man&rsquo;s switch that alerts when a scheduled job stops running <em>(free tier)</em>
          </li>
          <li>
            <strong>Supabase project</strong>{" "}
            — for the Numerator game database health check <em>(already set up)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: A Server You Can&rsquo;t See</h2>
        <p>
          A headless server is quiet by design. That&rsquo;s the point — it runs in the background,
          lid closed, in another room. But quiet also means invisible. If joseandgoose.com goes down
          at 2am, I won&rsquo;t know until someone tells me. If Supabase has an outage and my contact
          form stops saving submissions, I&rsquo;ll find out when I check the database manually (which
          I never do). If the Garmin recap cron job silently fails, I get no email and no clue.
        </p>

        <p>
          The solution isn&rsquo;t to check things manually — that defeats the purpose of automation.
          The solution is to make the system tell you when something is wrong. Every important job
          should either succeed quietly or fail loudly. Here&rsquo;s the full stack:
        </p>

        <ul>
          <li><a href="#alert-1"><strong>Alert 1: Website Uptime Monitor</strong></a> — checks joseandgoose.com every 5 minutes</li>
          <li><a href="#alert-2"><strong>Alert 2: Garmin Recap Failure Check</strong></a> — dead-man&rsquo;s switch if the 7am recap doesn&rsquo;t run</li>
          <li><a href="#alert-3"><strong>Alert 3: Nightly Fail2ban Ban Report</strong></a> — daily delta of new SSH attack IPs blocked</li>
          <li><a href="#alert-4"><strong>Alert 4: Supabase Health + GitHub Activity</strong></a> — Sunday database ping and weekly code activity</li>
          <li><a href="#alert-5"><strong>Alert 5: Personal Server Changelog</strong></a> — Claude writes a plain-English weekly standup</li>
          <li><a href="#alert-6"><strong>Alert 6: Weekly Status Report Email</strong></a> — everything in one Sunday morning digest</li>
          <li><a href="#meta-alert"><strong>The Meta-Alert: healthchecks.io</strong></a> — alerts if the server itself goes offline</li>
        </ul>

        {/* ── Uptime Monitor ── */}
        <h2 id="alert-1">Alert 1: Website Uptime Monitor</h2>
        <p className="post-session-meta">Every 5 minutes</p>
        <p>
          The most basic question: is joseandgoose.com responding? A curl request every 5 minutes,
          checked against an expected HTTP status code. If it returns anything other than 200, send an alert.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Uptime monitor script</h4>
        <ul>
          <li>
            <code>curl -s -o /dev/null -w &quot;%&#123;http_code&#125;&quot; https://joseandgoose.com</code> — gets the HTTP status code silently
          </li>
          <li>If status ≠ 200: sends a Resend email with the status code, timestamp, and a note to check Vercel logs</li>
          <li>If status = 200: logs the timestamp quietly to <code>~/.system-reports/uptime.log</code> with no email</li>
          <li>Cron: <code>*/5 * * * *</code> — runs every 5 minutes, 288 checks per day</li>
          <li>Also logs to a daily CSV so I can spot patterns (slow responses during peak hours, etc.)</li>
        </ul>

        <p>
          In the first month of running: two downtime events. One was a Vercel deployment that briefly
          returned a 503 during a cold start. One was my own fault — a broken build that I caught
          within 5 minutes because the alert email beat me to it.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Don&rsquo;t over-alert</span>
          <p>
            Add a cooldown: only alert once per hour per incident. If the site is still down an hour
            later, send another. One alert per incident is actionable; a flood of them is just noise.
          </p>
        </div>

        {/* ── Garmin failure check ── */}
        <h2 id="alert-2">Alert 2: Garmin Recap Failure Check</h2>
        <p className="post-session-meta">Every morning at 8am</p>
        <p>
          The Garmin recap runs at 7am. By 8am, a recap file should exist for today. If it doesn&rsquo;t,
          something broke overnight — and I should know before I&rsquo;ve been waiting all day for a
          recap email that&rsquo;s never coming.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Garmin failure check script</h4>
        <ul>
          <li>Runs at 8:00am daily: <code>0 8 * * *</code></li>
          <li>Checks if <code>~/.garmin-recap/recaps/garmin-recap-YYYY-MM-DD.md</code> exists for today</li>
          <li>If it exists: silent pass, no email</li>
          <li>If it&rsquo;s missing: sends an alert email with the last 20 lines of the recap log</li>
          <li>Alert subject: &quot;⚠️ Garmin Recap Failed — [DATE]&quot;</li>
        </ul>

        <p>
          This is a dead-man&rsquo;s switch pattern: instead of the job alerting on success, a <em>second</em>{" "}
          job alerts on <em>missing success</em>. It catches silent failures — crashes, auth errors,
          network timeouts — that don&rsquo;t generate their own error output.
        </p>

        {/* ── Fail2ban ── */}
        <h2 id="alert-3">Alert 3: Nightly Fail2ban Ban Report</h2>
        <p className="post-session-meta">Every evening at 7pm</p>
        <p>
          Fail2ban bans IPs automatically, but I wanted a daily snapshot: how many new IPs got banned
          today? Is that number trending up (could indicate a targeted scan) or holding steady
          (normal background noise)?
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Fail2ban report script</h4>
        <ul>
          <li><code>sudo fail2ban-client status sshd</code> — outputs total banned count</li>
          <li>Script reads the current total, compares to yesterday&rsquo;s saved count</li>
          <li>Calculates: new bans = current total − previous total</li>
          <li>Saves today&rsquo;s count to <code>~/.system-reports/fail2ban-lastcount.txt</code> for tomorrow</li>
          <li>Sends an email: &quot;🛡️ Fail2ban Daily Report — X new bans today (Y total)&quot;</li>
          <li>Cron: <code>0 19 * * *</code></li>
        </ul>

        <p>
          The delta matters more than the total. A large cumulative count after weeks of running is expected.
          An unusual spike in a single day is worth investigating.
        </p>

        {/* ── Supabase + GitHub ── */}
        <h2 id="alert-4">Alert 4: Supabase Health + GitHub Activity (Sunday)</h2>
        <p className="post-session-meta">Every Sunday at 8am</p>
        <p>
          Two separate checks that share a Sunday timeslot because they&rsquo;re both weekly sanity checks
          rather than urgent alerts:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Supabase health check</h4>
        <ul>
          <li>Runs a simple query against the Supabase REST API: count rows in the <code>contacts</code> table</li>
          <li>If the API returns a valid response: logs the count, no email</li>
          <li>If it errors (503, timeout, auth failure): sends an alert with the error body</li>
          <li>Also checks the <code>numerator_rounds</code> table — confirms the game database is live</li>
          <li>Uses the Supabase service role key from <code>.env.local</code></li>
        </ul>

        <h4 className="post-dev-heading">🔧 Developer section: GitHub activity report</h4>
        <ul>
          <li>Calls the GitHub API: <code>GET /users/joseandgoose/events</code></li>
          <li>Filters for the past 7 days of events: pushes, PRs, issues, stars</li>
          <li>Formats into a short summary and includes in the Sunday report email</li>
          <li>Uses a personal access token from the env file (read-only, public repo scope)</li>
        </ul>

        {/* ── Weekly report ── */}
        <h2 id="alert-5">Alert 5: Personal Server Changelog (Sunday)</h2>
        <p className="post-session-meta">Sunday 7am — Claude-generated</p>
        <p>
          Every Sunday morning, Claude writes a short narrative of what the server did that week.
          It&rsquo;s not a metrics dump — it&rsquo;s a 3–5 sentence changelog in plain English, like a
          standup from the server to me.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Claude-generated changelog</h4>
        <ul>
          <li>Script collects stats: Garmin recaps generated this week, new Fail2ban bans, AI jobs completed, uptime log entries, disk usage, site downtime events</li>
          <li>Passes stats to <code>claude -p &quot;...&quot;</code> with a prompt asking for a casual, 3–5 sentence changelog</li>
          <li>Claude output is saved to a temp file and folded into the Sunday weekly report</li>
          <li>Cron: <code>0 7 * * 0</code> — 7am Sunday, runs before the 9am weekly report email so it&rsquo;s ready</li>
        </ul>

        <p>
          A recent example output from Claude:
        </p>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Weekly Changelog — Home Server</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-success">Solid week. All 7 Garmin recaps generated on schedule — no missed mornings.</span></div>
              <div><span className="post-terminal-success">Fail2ban blocked 23 new IPs, all automated bots, nothing unusual.</span></div>
              <div><span className="post-terminal-success">Site was up 100% — 2,016 uptime checks passed, zero alerts sent.</span></div>
              <div><span className="post-terminal-success">3 AI batch jobs processed from the inbox queue.</span></div>
              <div><span className="post-terminal-success">Disk at 34% used, 87GB free. No action needed.</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            Claude writes the server&rsquo;s weekly standup. No log-diving required.
          </p>
        </div>

        {/* ── Weekly Report ── */}
        <h2 id="alert-6">Alert 6: Weekly Status Report Email</h2>
        <p className="post-session-meta">Sunday 9am — the full picture</p>
        <p>
          All the pieces come together in one Sunday email: changelog, Supabase health, GitHub activity,
          Fail2ban weekly total, disk space, and a resource summary. It&rsquo;s the one email that tells me
          everything about the past week without opening a terminal.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Weekly report assembly</h4>
        <ul>
          <li>Runs at 9am Sunday — after all the 7am and 8am jobs have completed</li>
          <li>Reads the Claude changelog from the temp file generated at 7am</li>
          <li>Reads the Supabase and GitHub outputs from the 8am jobs</li>
          <li>Pulls resource stats: <code>df -h</code> for disk, last CSV entry from <code>resources-YYYY-MM-DD.csv</code></li>
          <li>Assembles into an HTML email via Resend API</li>
          <li>Subject: &quot;🖥️ Server Weekly — [WEEK OF DATE]&quot;</li>
        </ul>

        {/* ── Healthchecks ── */}
        <h2 id="meta-alert">The Meta-Alert: healthchecks.io</h2>
        <p>
          There&rsquo;s one failure mode none of the above covers: what if the server itself goes down?
          If the machine crashes, no cron runs, no emails send, and I notice nothing until I happen to
          SSH in. The solution is a dead-man&rsquo;s switch hosted externally.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: healthchecks.io heartbeat</h4>
        <ul>
          <li>Free account at healthchecks.io creates a unique URL — the &quot;check&quot;</li>
          <li>If the URL isn&rsquo;t pinged within a set interval, healthchecks.io sends a failure alert</li>
          <li>
            Added to cron: every 30 minutes, <code>curl -s https://hc-ping.com/[uuid]</code> sends a heartbeat
          </li>
          <li>If the server goes offline for 30+ minutes, I get an email from healthchecks.io</li>
          <li>Cron: <code>*/30 * * * *</code></li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">The monitoring gap</span>
          <p>
            Everything else I built monitors <em>from</em> the server. healthchecks.io monitors
            <em>the</em> server — from outside. It&rsquo;s the only alert that can fire when the
            machine itself is unreachable. Without it, a power outage or crash is invisible until
            you notice the silence.
          </p>
        </div>

        {/* ── Full schedule ── */}
        <h2>The Full Cron Schedule</h2>
        <p>Everything running on a single crontab:</p>

        <h4 className="post-dev-heading">🔧 Developer section: Complete cron schedule</h4>
        <ul>
          <li><code>* * * * *</code> — AI job queue worker (processes inbox/*.txt files)</li>
          <li><code>*/5 * * * *</code> — site uptime monitor (joseandgoose.com)</li>
          <li><code>*/10 * * * *</code> — resource sampler (CPU, memory → CSV)</li>
          <li><code>*/30 * * * *</code> — healthchecks.io heartbeat</li>
          <li><code>0 7 * * *</code> — Garmin recap generation</li>
          <li><code>0 8 * * *</code> — Garmin failure check (alerts if no recap file)</li>
          <li><code>0 8 * * 1-5</code> — daily market briefing email</li>
          <li><code>0 19 * * *</code> — Fail2ban nightly ban report</li>
          <li><code>0 7 * * 0</code> — Claude personal changelog generation</li>
          <li><code>0 8 * * 0</code> — Supabase health + GitHub activity</li>
          <li><code>0 9 * * 0</code> — weekly status report email</li>
          <li><code>0 23 * * 6</code> — Lynis security audit (Saturday night)</li>
          <li><code>0 8 * * 1</code> — disk snapshot</li>
          <li><code>0 1 * * 0</code> — log archiver (weekly)</li>
          <li><code>0 2 * * 0</code> — security apt upgrades + journal vacuum</li>
          <li><code>0 2 1 * *</code> — apt autoremove/autoclean (monthly)</li>
          <li><code>0 4 1 * *</code> — scheduled monthly reboot</li>
        </ul>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          The server now manages itself. I never log in to check if things are running. I get
          emails when something is wrong, and I get a weekly report that tells me everything is fine.
          The no-email state is the good state.
        </p>

        <ul>
          <li><strong>Site downtime</strong> → email within 5 minutes</li>
          <li><strong>Garmin recap failure</strong> → email by 8am</li>
          <li><strong>Claude API credits exhausted</strong> → email immediately on failure</li>
          <li><strong>SSH login from outside LAN</strong> → email within 3 seconds</li>
          <li><strong>Server offline</strong> → healthchecks.io alert within 30 minutes</li>
          <li><strong>Everything working fine</strong> → one Sunday morning summary email</li>
        </ul>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Each individual script</strong> — Claude Code wrote every bash script from a plain-English
            description. Uptime monitor: 15 minutes. Fail2ban report: 20 minutes. Each one is simple; the value
            comes from having all of them running together.
          </li>
          <li>
            <strong>Resend API reuse</strong> — same API key, same sender, same pattern for every email. Once
            the first alert email worked, every subsequent one took 5 minutes to wire up.
          </li>
          <li>
            <strong>Cron scheduling</strong> — <code>crontab -e</code>, paste a line, save. Linux cron is
            reliable and dead-simple for time-based jobs.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Alert fatigue tuning</strong> — initial versions sent too many emails. Had to add cooldowns,
            state files (to remember last-alerted time), and delta calculations (ban count delta, not
            total). Getting the signal-to-noise ratio right took iteration.
          </li>
          <li>
            <strong>Cron environment</strong> — cron jobs run in a minimal shell environment without your
            normal PATH. Scripts that work fine in a terminal can silently fail in cron because <code>python3</code>,{" "}
            <code>node</code>, or <code>claude</code> can&rsquo;t be found. Fix: explicitly set <code>PATH</code> at
            the top of every cron command or in the crontab header.
          </li>
          <li>
            <strong>Sunday job ordering</strong> — the weekly report at 9am depends on outputs from
            the 7am and 8am jobs. If any upstream job is slow, the 9am job reads an empty file. Added
            fallback messages (&quot;data unavailable&quot;) for each section so the report always sends
            even if one input is missing.
          </li>
          <li>
            <strong>healthchecks.io setup</strong> — the concept clicked immediately; finding the right
            &quot;grace period&quot; setting (how long to wait before alerting) took some tuning. Too short
            (5 minutes) and a brief network hiccup triggers a false alarm. 35 minutes works well for
            a 30-minute heartbeat interval.
          </li>
        </ul>

        <p>
          The hardest part of a home server isn&rsquo;t setting it up — it&rsquo;s knowing what&rsquo;s happening
          on it without babysitting it. This alert stack is the answer. Every meaningful event surfaces
          as an email. Everything else is silence, which is good news.
        </p>
      <RelatedPosts slug="how-i-built-server-alerts" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
