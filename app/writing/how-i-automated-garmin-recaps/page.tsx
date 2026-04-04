import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Automated Daily Garmin Recaps to My Inbox — Jose and Goose",
  description: "Building a Mac automation that fetches Garmin health data, generates AI recaps with Claude CLI, and emails them every morning",
};

export default function HowIAutomatedGarminRecaps() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>February 28, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>9 min read</span>
      </div>
      <PostTags slug="how-i-automated-garmin-recaps" />

      <h1 className="post-title">How I Automated Daily Garmin Recaps to My Inbox</h1>
      <p className="post-subtitle">
        Building a Mac automation that fetches Garmin health data at 7am, generates AI recaps with Claude CLI, and emails them — built across two sessions with Claude.ai and Claude Code
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>Daily health recaps emailed to your inbox every morning with zero manual work</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (Python API integration, launchd scheduling, Claude CLI automation)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours initial build (Feb 26) + 45 minutes debugging & email setup (Feb 28)</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-automated-garmin-recaps" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude.ai</a></strong>{" "}
            — browser-based AI for prototyping scripts and configs <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            — terminal CLI for automated recap generation <em>($200/yr, same account)</em>
          </li>
          <li>
            <strong><a href="https://pypi.org/project/garminconnect/" target="_blank" rel="noopener noreferrer">garminconnect</a></strong>{" "}
            — Python library for Garmin Connect API <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email API for delivery notifications <em>(free tier: 3,000 emails/month)</em>
          </li>
          <li>
            <strong>macOS launchd</strong> — built-in scheduler for automated runs <em>(free)</em>
          </li>
          <li>
            <strong>A Garmin watch</strong> — collecting sleep, body battery, stress, VO2 max data <em>(you already have one)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: Garmin Data Sits Unused</h2>
        <p>
          I wear a Garmin watch 24/7. It tracks sleep stages, body battery, resting heart rate, stress,
          VO2 max, training status, steps, and yesterday&rsquo;s activity. All this data syncs to the Garmin
          Connect app, where it sits in a dashboard I rarely open. The data is there — I just don&rsquo;t
          look at it consistently.
        </p>

        <p>
          What I wanted: a <strong>daily health recap delivered to my inbox every morning</strong> with the
          metrics that matter, formatted with context and recommendations. No opening apps. No checking dashboards.
          Just: wake up, check email, see if I should prioritize recovery or push harder today.
        </p>

        <p>
          The tools existed (Garmin API, Claude for formatting), but no off-the-shelf solution combined them
          into an automated morning email. So I built it.
        </p>

        {/* ── Session 1 ── */}
        <h2>Session 1: The Initial Build with Claude.ai</h2>
        <p className="post-session-meta">Evening, February 26 — ~2 hours</p>
        <p className="post-pace">
          <strong>Pace:</strong> Deliberate. Lots of debugging around launchd, Claude CLI tool permissions,
          and getting the Garmin API working. Claude.ai handled the code generation; I handled the Mac system integration.
        </p>

        <h3>Phase 1: Fetch Garmin Data with Python</h3>
        <p>
          The first piece was a small program (a Python script) that logs into Garmin Connect and
          downloads the day&rsquo;s health data as a structured file. Claude wrote the script from a
          plain-English description. Running it for the first time took 3 seconds and successfully
          pulled all nine metrics.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Python fetch script</h4>
        <ul>
          <li><code>garmin_fetch.py</code> — uses the <code>garminconnect</code> library to authenticate and pull metrics</li>
          <li>Auto-installs the library if missing (no manual pip install needed)</li>
          <li>Fetches 9 metrics: sleep, body battery, resting heart rate, stress, VO2 max, training status, steps, calories, intensity minutes</li>
          <li>Saves everything to <code>garmin_raw_data.json</code> for Claude to parse later</li>
        </ul>

        <p>
          First run: worked immediately. Garmin credentials loaded from a local config file,
          API authenticated, all metrics fetched. Took 3 seconds.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Security tip</span>
          <p>
            Your Garmin credentials live in a local config file in plaintext. Keep it that way — local only.
            Two rules before touching git:
          </p>
          <ol>
            <li>
              Store the credentials file <strong>outside any project folder</strong> that could become a git repo.
              A dedicated directory in your home folder (not inside a project) means there&rsquo;s no risk of
              accidental commits, even without a <code>.gitignore</code>.
            </li>
            <li>
              If the credentials file is anywhere near a git project, add it to <code>.gitignore</code> immediately
              and run <code>git status</code> before every commit to confirm it&rsquo;s not showing up as a tracked file.
            </li>
          </ol>
          <p>
            Credentials in a public repo — even briefly — should be treated as compromised. Change the password
            immediately if that ever happens.
          </p>
        </div>

        <h3>Phase 2: Generate the Recap with Claude CLI</h3>
        <p>
          The raw health data needed to become something readable — a formatted summary with a daily
          focus recommendation and context for each metric. Claude generated a shell script (a sequence
          of automated commands) that feeds the data directly to the Claude CLI and saves the result
          as a formatted text file.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Recap generation requirements</h4>
        <ul>
          <li>Read the JSON data</li>
          <li>Determine a daily focus mode (Recovery / Improving Fitness / Maintenance) based on body battery and sleep</li>
          <li>Write a markdown recap with sections for each metric</li>
          <li>Skip sections with missing data (don&rsquo;t show &quot;Sleep: N/A&quot;)</li>
          <li>Lead with the highest-value recommendation</li>
        </ul>

        <p>
          <strong>Claude.ai</strong> generated a shell script (<code>run_recap.sh</code>) — a file
          that runs a sequence of steps automatically, like a recipe the computer follows:
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Shell script steps</h4>
        <ul>
          <li>Runs <code>garmin_fetch.py</code> to get fresh data</li>
          <li>Embeds the entire JSON into a Claude CLI prompt (no file reading, no browser tools)</li>
          <li>Calls <code>claude -p &quot;...&quot; --allowedTools &quot;Write&quot;</code> to generate and save the recap</li>
          <li>Shows a macOS popup with a button to open the recap in Terminal</li>
          <li>The <code>--allowedTools &quot;Write&quot;</code> flag pre-approves file writes so the script runs unattended at 7am without prompting for permission</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">Claude CLI tip</span>
          <p>
            Embedding data directly in the prompt (<code>RAW_DATA=$(cat file.json)</code> then passing it
            in the prompt text) prevents Claude from trying to use browser tools or file readers. All context
            is in the prompt — Claude just formats and writes.
          </p>
        </div>

        <h3>Phase 3: Schedule with launchd</h3>
        <p>
          With the scripts working manually, the last step was making them run automatically every morning.
          macOS has a built-in scheduler called launchd — similar to a calendar alarm for programs — that
          can trigger a script at any time, every day, without any manual action required.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: launchd scheduling configuration</h4>
        <ul>
          <li>Schedules <code>run_recap.sh</code> to run at 7:00am daily</li>
          <li>Sets environment variables (PATH, HOME) so Python and Claude CLI are found</li>
          <li>Logs stdout and stderr to <code>logs/launchd-out.log</code> and <code>logs/launchd-err.log</code></li>
        </ul>

        <p>
          Installed the job with:
        </p>

        <p>
          <code>launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.jose.garmin-recap.plist</code>
        </p>

        <p>
          (Not <code>launchctl load</code> — that&rsquo;s deprecated on modern macOS. Learned that the hard way
          after the first attempt failed silently.)
        </p>

        <h3>Bugs Fixed During Session 1</h3>
        <ul>
          <li><strong>zsh heredoc substitution error</strong> — <code>$(cat &lt;&lt;&apos;EOF&apos; ... EOF)</code> doesn&rsquo;t work in zsh. Fixed by writing the prompt to a temp file with <code>mktemp</code> first.</li>
          <li><strong>Claude CLI browser automation</strong> — Claude tried to open Garmin Connect in Chrome instead of reading the embedded JSON. Fixed by adding explicit &quot;DO NOT use browser tools&quot; in the prompt.</li>
          <li><strong>Activity showing 7am zeros</strong> — <code>user_summary</code> was fetching TODAY&rsquo;s data at 7am (nearly empty). Fixed by switching to YESTERDAY for completed activity.</li>
          <li><strong>Write permission blocking automation</strong> — Claude CLI prompted for write approval. Fixed with <code>--allowedTools &quot;Write&quot;</code>.</li>
        </ul>

        <p>
          By the end of Session 1, the system worked: 7am trigger → fetch data → generate recap → show popup.
          Tested it manually, verified the next morning it ran automatically. Success.
        </p>

        {/* ── Session 2 ── */}
        <h2>Session 2: Debugging & Email Integration with Claude Code</h2>
        <p className="post-session-meta">Morning, February 28 — ~45 minutes</p>
        <p className="post-pace">
          <strong>Pace:</strong> Fast debugging, then adding email automation using existing Resend setup from the contact form.
        </p>

        <h3>The 401 Unauthorized Error</h3>
        <p>
          Woke up on February 28, expected a recap email — didn&rsquo;t get one. Checked the logs:
        </p>

        <p>
          <code>requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: https://connectapi.garmin.com/oauth-service/oauth/preauthorized</code>
        </p>

        <p>
          The Garmin session had expired overnight. The <code>garminconnect</code> library uses token-based
          auth that occasionally needs re-authentication. Running the fetch script manually (in <strong>Claude Code</strong>)
          fixed it:
        </p>

        <p>
          <code>python3 garmin_fetch.py</code> → re-authenticated, tokens refreshed, data fetched successfully.
        </p>

        <p>
          Tomorrow at 7am, it should work again. But I still wanted the recap delivered to my inbox, not just
          saved to a file.
        </p>

        <h3>Adding Email Notifications via Resend</h3>
        <p>
          Saving the recap to a file was useful, but delivering it to my inbox meant I&rsquo;d actually
          see it. I already had an email-sending account set up from the contact form build, so this was
          a matter of reusing the same credentials rather than setting up anything new. Claude added the
          email step to the existing automation script.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Email delivery script</h4>
        <ul>
          <li>Reads the generated recap markdown file</li>
          <li>Converts markdown to basic HTML (headings, bold, lists)</li>
          <li>Sends email via Resend API with subject &quot;🏃 Your Garmin Health Recap — [DATE]&quot;</li>
          <li>Pulls <code>RESEND_API_KEY</code> from the existing <code>.env.local</code> file in the website project</li>
          <li>Auto-installs the <code>resend</code> npm package if missing</li>
        </ul>

        <p>
          Updated <code>run_recap.sh</code> to call <code>node send-email.js</code> after saving the recap.
          Tested it:
        </p>

        <p>
          ✅ Email arrived in my inbox in under 2 seconds with today&rsquo;s health recap.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Reuse what you have</span>
          <p>
            <strong>Resend</strong> was already integrated for the contact form. No new account, no new API key,
            no new environment variables. Just reuse the existing setup. If you&rsquo;ve built one email-sending
            feature, the second one is 5 minutes of work.
          </p>
        </div>

        <h3>Auto-Wake with pmset</h3>
        <p>
          One problem remained: if the Mac was asleep at 7am, the job wouldn&rsquo;t run until I woke it (could
          be hours later). Solution: schedule the Mac to wake at 6:59am every morning.
        </p>

        <p>
          After debugging the <code>pmset</code> syntax (the man page examples helped), the working command:
        </p>

        <p>
          <code>sudo pmset repeat wakeorpoweron MTWRFSU 06:59:00</code>
        </p>

        <p>
          Verified with <code>pmset -g sched</code>:
        </p>

        <p>
          <code>Repeating power events: wakepoweron at 6:59AM every day</code>
        </p>

        <p>
          Now the Mac wakes at 6:59am, the recap runs at 7:00am, and the email arrives in my inbox — even if
          I left it asleep overnight.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          A fully automated daily health recap system that:
        </p>

        <ul>
          <li><strong>6:59am</strong> — Mac wakes (if asleep)</li>
          <li><strong>7:00am</strong> — <code>garmin_fetch.py</code> logs into Garmin API and fetches 9 health metrics</li>
          <li><strong>7:01am</strong> — <code>claude</code> CLI reads the JSON, determines focus mode (Recovery/Fitness/Maintenance), and writes a markdown recap</li>
          <li><strong>7:01am</strong> — <code>send-email.js</code> emails the recap to <code>my email inbox</code> via Resend</li>
          <li><strong>7:01am</strong> — macOS popup appears with &quot;Open in Terminal&quot; button</li>
        </ul>

        <p>
          Built in <strong>~2 hours initial setup</strong> (Claude.ai for Python + shell scripts + launchd) + <strong>45 minutes debugging & email</strong> (Claude Code terminal for fixes and Resend integration).
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Garmin API integration</strong> (garminconnect library handled auth, Claude.ai wrote the fetch script in one shot)
          </li>
          <li>
            <strong>Claude CLI automation</strong> (embedding JSON in prompt worked first try after fixing browser tool issue)
          </li>
          <li>
            <strong>Email integration</strong> (Resend already set up from contact form — just reused the API key)
          </li>
          <li>
            <strong>Terminal workflow with Claude Code</strong> (debugging the 401 error, adding email script, testing — all in one session)
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>launchd configuration</strong> (deprecated commands, environment variable issues, silent failures — took 3 attempts to get it loaded correctly)
          </li>
          <li>
            <strong>zsh heredoc syntax</strong> (bash and zsh handle heredocs differently — had to switch to temp files)
          </li>
          <li>
            <strong>Claude CLI tool permissions</strong> (browser tools triggered by default, Write tool needed pre-approval for automation)
          </li>
          <li>
            <strong>pmset repeat syntax</strong> (tried 3 different formats before finding <code>wakeorpoweron</code> instead of <code>wake</code>)
          </li>
          <li>
            <strong>Garmin session expiration</strong> (401 errors after tokens expire — needs occasional manual re-auth)
          </li>
        </ul>

        <h3>Claude.ai vs Claude Code: The Right Tool for the Job</h3>
        <p>
          This project used <strong>both</strong> Claude interfaces, matching Anthropic&rsquo;s recommended use cases:
        </p>

        <ul>
          <li>
            <strong>Claude.ai (browser)</strong> for Session 1 — exploratory prototyping when you want to see the full code, review it carefully, and decide what to run. Generated complete Python scripts, shell scripts, and launchd configs that I could read through before executing. Perfect for &quot;here&rsquo;s the problem, show me solutions.&quot;
          </li>
          <li>
            <strong>Claude Code (terminal)</strong> for Session 2 — direct file editing and rapid debugging when you already know the structure. Fixed the 401 error, added email integration, tested commands — all without leaving the terminal. Perfect for &quot;fix this specific issue in these files.&quot;
          </li>
        </ul>

        <p>
          From Anthropic&rsquo;s docs: &quot;Use Claude.ai when you want to explore and understand. Use Claude Code when you want to build and iterate.&quot; This project proved it — the browser for initial architecture, the terminal for production debugging.
        </p>

        <p>
          Both are the same Claude model (Opus 4.6), same account, same $200/yr subscription. The interface changes the workflow, not the intelligence. Choose based on whether you need exploration or execution.
        </p>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal — Morning Automation</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim">[7:00:01] Fetching data from Garmin...</span></div>
              <div><span className="post-terminal-success">  ✓ user_summary</span></div>
              <div><span className="post-terminal-success">  ✓ sleep</span></div>
              <div><span className="post-terminal-success">  ✓ body_battery</span></div>
              <div><span className="post-terminal-success">  ✓ stress</span></div>
              <div><span className="post-terminal-success">  ✓ vo2max</span></div>
              <br />
              <div><span className="post-terminal-dim">[7:00:04] Generating recap with Claude...</span></div>
              <div><span className="post-terminal-success">Recap saved to ~/.garmin-recap/recaps/garmin-recap-2026-02-28.md</span></div>
              <br />
              <div><span className="post-terminal-dim">[7:00:05] Sending email...</span></div>
              <div><span className="post-terminal-success">✅ Email sent to my email inbox</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            Every morning at 7am: fetch → generate → email. All automated, zero manual work.
          </p>
        </div>

        <p>
          The biggest lesson? Garmin data is only useful if you see it. An automated daily email beats a
          dashboard you never open. And when the automation breaks (401 errors, expired tokens), having{" "}
          <strong>Claude Code</strong> in the terminal means you can debug and fix it in minutes instead of
          hours.
        </p>

        <p>
          Now every morning starts with a health recap in my inbox. Body battery at 60? Prioritize recovery.
          Sleep score 85+? Push the workout. VO2 max trending down? Add interval training. The data was always
          there. Now it&rsquo;s impossible to ignore.
        </p>
      <RelatedPosts slug="how-i-automated-garmin-recaps" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
