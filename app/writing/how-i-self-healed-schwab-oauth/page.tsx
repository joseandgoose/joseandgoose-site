import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Self-Healed Schwab's 7-Day OAuth Expiry — Jose and Goose",
  description:
    "Schwab's market-data API tokens hard-expire every 7 days. Instead of babysitting a renewal, I built automation that refreshes the token before it dies and only emails me when it can't — a pipeline that fixes itself.",
};

export default function HowISelfHealedSchwabOAuth() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>May 22, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>
      <PostTags slug="how-i-self-healed-schwab-oauth" />

      <h1 className="post-title">How I Self-Healed Schwab&rsquo;s 7-Day OAuth Expiry</h1>
      <p className="post-subtitle">
        Schwab&rsquo;s market-data API hands you a token that hard-expires every 7 days — by design, not by
        bug. Instead of setting a reminder to renew it by hand, I built a pipeline that renews itself
        before it dies and only emails me when it genuinely can&rsquo;t.
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              A market-data pipeline that survives Schwab&rsquo;s 7-day token expiry without human
              babysitting — it renews the token a couple of days early, degrades gracefully if it
              can&rsquo;t, and emails me only when a real person is actually needed
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>
              Intermediate (OAuth token refresh, a scheduled freshness check, unattended browser
              login, fail-safe email alerting)
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>
              A few sessions of iteration — the first version reminded me to renew by hand; the final
              version renews itself and only speaks up on failure
            </span>
          </div>
        </div>
        <TLDRBadge slug="how-i-self-healed-schwab-oauth" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Schwab Market Data API</strong>{" "}
            — real-time index and options data, tied to an API-only brokerage account{" "}
            <em>(free with the account)</em>
          </li>
          <li>
            <strong>OAuth tokens</strong>{" "}
            — temporary passwords the API issues that expire and must be refreshed{" "}
            <em>(the whole reason this post exists)</em>
          </li>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the always-on Alienware from the earlier posts, running the daily check{" "}
            <em>(already set up)</em>
          </li>
          <li>
            <strong>A cron job</strong>{" "}
            — a scheduled task Linux runs automatically once a day <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email API, used <em>only</em> to alert me when the self-heal fails <em>(free tier)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI for writing the refresh logic and the fail-safe alerting <em>($200/yr)</em>
          </li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">The account itself is boring on purpose</span>
          <p>
            Worth saying up front: the brokerage account behind this API holds <strong>under a
            dollar</strong>. It exists purely to unlock the free market-data feed — no meaningful
            balance, no trading through it. That framing mattered when I decided how much automation
            to trust with the login: there&rsquo;s effectively nothing to steal, and the design still
            errs on the side of caution anyway.
          </p>
        </div>

        {/* ── The Problem ── */}
        <h2>The Problem: A Token That Dies Every Week</h2>
        <p>
          Several of my little projects lean on the Schwab Market Data API — the morning market email,
          an options monitor, a trading-thesis watchdog. They all read from the same live feed. To
          talk to that feed, you authenticate once and get back an <strong>OAuth token</strong> — a
          temporary password the API accepts instead of making you log in every single call.
        </p>

        <p>
          There are actually two tokens in play, and the distinction is the whole story:
        </p>

        <ul>
          <li>
            <strong>A short-lived access token</strong> — the one every API call actually uses. It
            expires in about half an hour. That&rsquo;s fine: the code quietly swaps it for a fresh
            one whenever it&rsquo;s about to go stale, and I never notice.
          </li>
          <li>
            <strong>A longer-lived refresh token</strong> — the credential used to <em>mint</em> new
            access tokens. This is the one Schwab expires <strong>every 7 days, hard</strong>.
          </li>
        </ul>

        <p>
          Here&rsquo;s the sharp edge. On most OAuth systems, a refresh token lets you renew
          indefinitely — you use it to get a new access token, and often a fresh refresh token comes
          back with it, resetting the clock. Schwab doesn&rsquo;t work that way. After 7 days the
          refresh token is simply dead, and no amount of refreshing revives it. The only way to get a
          new one is a <em>real login</em> — an actual human-style trip through Schwab&rsquo;s sign-in
          and consent screens.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">This is a constraint, not a bug</span>
          <p>
            I want to be precise, because it&rsquo;s easy to read this as &ldquo;Schwab&rsquo;s API is
            broken.&rdquo; It isn&rsquo;t. A 7-day hard expiry on the refresh token is a deliberate
            platform security choice — it caps how long a leaked token stays useful. My job wasn&rsquo;t
            to fight the policy. It was to live inside it without a weekly chore.
          </p>
        </div>

        <p>
          The naive failure mode: I set everything up, it works beautifully for a week, and then on
          day 8 every downstream project silently starts getting rejected. No crash, no obvious signal
          — just stale-or-missing market data leaking into the morning email until I happened to
          notice something looked off. A pipeline that dies quietly is worse than one that dies loudly.
        </p>

        {/* ── V1 ── */}
        <h2>Version 1: A Reminder to Do It Myself</h2>
        <p>
          The first version was honest about its limits. A daily check looked at how old the refresh
          token was, and once it crossed a threshold, it emailed me: &ldquo;Schwab token is aging, go
          re-authenticate.&rdquo; Then I&rsquo;d sit down, walk through the login by hand, and the
          clock reset.
        </p>

        <p>
          It worked. It also quietly annoyed me every few days. A reminder that only ever tells you to
          go do a manual chore isn&rsquo;t automation — it&rsquo;s a nag with a cron schedule. Worse,
          it depended on <em>me</em> being reachable. Travel, a busy morning, a missed email, and the
          token would lapse before I got to it. The reliability of the whole data pipeline was pinned
          to my inbox habits, which is not a load-bearing thing to depend on.
        </p>

        <p>
          So the goal changed. Not &ldquo;remind me to renew.&rdquo; <strong>Renew it for me, and only
          bother me if you actually can&rsquo;t.</strong>
        </p>

        {/* ── The Core Idea ── */}
        <h2>The Core Idea: Renew Early, Alert on Failure</h2>
        <p>
          The whole design collapses to two decisions made once a day by a scheduled check:
        </p>

        <ul>
          <li>
            <strong>Is the token getting old?</strong> Not expired — <em>old</em>. The check triggers a
            renewal at around <strong>day 5 of 7</strong>, deliberately early. That two-day buffer is
            the safety margin: if the automated renewal hits a snag on day 5, there&rsquo;s still time
            to try again the next day, or for me to step in, before anything actually breaks on day 7.
          </li>
          <li>
            <strong>Did the renewal work?</strong> If yes, the check goes back to sleep and says
            nothing. Silence is success. If the renewal genuinely fails, <em>that&rsquo;s</em> the only
            time an email goes out — and it comes with enough context to fix it fast.
          </li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">&ldquo;No news is good news&rdquo; is a feature</span>
          <p>
            The most valuable property of this system is that a healthy week is completely silent. I
            used to get a renewal nag every few days. Now the token quietly rotates in the background
            and the <em>only</em> email I ever get about Schwab OAuth is one that actually requires my
            hands. An alert I can trust to mean &ldquo;act now&rdquo; is worth ten alerts I learn to
            ignore.
          </p>
        </div>

        <h4 className="post-dev-heading">🔧 Developer section: the daily decision</h4>
        <ul>
          <li>A cron job runs the freshness check once every morning</li>
          <li>It reads a small marker recording when the token was last successfully renewed</li>
          <li>If the token is younger than the renewal threshold, it exits immediately — nothing to do</li>
          <li>If it&rsquo;s at or past the threshold, it kicks off the automated renewal</li>
          <li>It then re-checks the marker: a fresh marker means success and it exits quietly</li>
          <li>Only a failed renewal reaches the email step</li>
        </ul>

        {/* ── The hard part ── */}
        <h2>The Hard Part: Renewing Without a Human — and the Spectrum of Ways to Do It</h2>
        <p>
          Here&rsquo;s the tension: getting a new refresh token requires a <em>real login</em>, the
          kind a person does in a browser — but the whole goal is to <em>not</em> need a person.
          Squaring that means the server drives the login itself, in a headless (no-screen) browser,
          then catches the fresh token at the end. I&rsquo;m staying deliberately high-level on the
          mechanics — this touches a real brokerage login, and a step-by-step would be the wrong thing
          to publish.
        </p>

        <p>
          It helps to split the problem in two. Refreshing the short-lived <strong>access token</strong>{" "}
          (trading a refresh token for a new one every half hour) is standard, endorsed OAuth, spelled
          out in{" "}
          <a href="https://developer.schwab.com/user-guides/get-started/authenticate-with-oauth" target="_blank" rel="noopener noreferrer">Schwab&rsquo;s OAuth guide</a>. The friction is entirely the{" "}
          <strong>7-day hard expiry</strong> on the refresh token: once it dies, the only way back is a
          full login-and-consent flow. That day-7 re-login is what people solve differently, along a
          security spectrum:
        </p>

        <ul>
          <li>
            <strong>Manual paste — most secure, least convenient.</strong> A tool like{" "}
            <a href="https://schwab-py.readthedocs.io/en/latest/auth.html" target="_blank" rel="noopener noreferrer">schwab-py</a>{" "}
            prints a URL, you sign in by hand, and it catches the result. A human does the login every week.
          </li>
          <li>
            <strong>Semi-automated helper.</strong> A small local web app walks you through the OAuth flow
            and captures the token — e.g.{" "}
            <a href="https://github.com/timjaeger/Schwab-API-OAuth-Manager" target="_blank" rel="noopener noreferrer">Schwab-API-OAuth-Manager</a>{" "}
            or{" "}
            <a href="https://gist.github.com/hn4002/403e4015c144dfb12f6eeca126c44a5d" target="_blank" rel="noopener noreferrer">this community gist</a>.
          </li>
          <li>
            <strong>Fully automated headless login — most convenient, most exposure.</strong> A headless
            browser plus a local redirect server does the sign-in unattended, with public examples like{" "}
            <a href="https://github.com/digitalml/schwab-api-auth-automation" target="_blank" rel="noopener noreferrer">schwab-api-auth-automation</a>. This is the end I built toward — and the more of the login you
            automate, the more places your password and tokens can leak if you&rsquo;re careless.
          </li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">The one rule that doesn&rsquo;t move</span>
          <p>
            Wherever you land, the API client secret, the refresh token, and — above all — your brokerage
            password stay <strong>out of hardcoded literals, out of committed git history</strong>, and out
            of anywhere prone to leaking. Load them at runtime from a locked-down file; never paste them
            inline where they can end up in a repo, a log, or a screenshot.
          </p>
        </div>

        <p>
          The honest gray area: automating the token <em>refresh</em> is fine and endorsed. Automating the{" "}
          <em>login</em> to mint a fresh refresh token every 7 days scripts a flow meant for a human. It&rsquo;s
          widely done, but it leans on that sign-in staying scriptable — if Schwab ever added bot-detection
          or step-up MFA to the authorize screen, the automated approaches would break overnight while the
          manual-paste one kept working. A pragmatic solution living at the mercy of Schwab&rsquo;s login
          hardening, and that&rsquo;s worth naming plainly.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: safety rails on the auto-login</h4>
        <p>
          The lesson I&rsquo;d underline: <strong>never hammer a login</strong>. On an earlier project I let
          automation retry a login it was confused about, and the retries got the account soft-locked. So
          this renewal makes exactly one clean attempt and stops the moment anything looks off:
        </p>
        <ul>
          <li><strong>Exactly one login submit</strong> — it never loops or re-tries the credential</li>
          <li><strong>Bounded, not open-ended</strong> — the consent walk is capped at a small fixed number of steps so it can never spin</li>
          <li><strong>Unexpected page → stop</strong> — anything that isn&rsquo;t the exact expected flow ends the run immediately</li>
          <li><strong>A screenshot on failure</strong> — so I can see <em>why</em> at a glance</li>
          <li><strong>Time-boxed</strong> — if it hangs, it&rsquo;s killed rather than left to sit</li>
        </ul>

        <p>
          I&rsquo;m staying at the philosophy level on purpose — I won&rsquo;t walk through exactly how mine
          drives the login. But if you&rsquo;re building something similar and want to compare notes,{" "}
          <Link href="/contact">reach out</Link>.
        </p>

        {/* ── Graceful degradation ── */}
        <h2>The Backstop: Degrade, Don&rsquo;t Crash</h2>
        <p>
          Self-healing is the happy path. But I wanted the downstream projects to survive even a
          <em>window</em> where the token is dead — say the renewal fails on day 5 and I don&rsquo;t
          fix it until day 7. So every consumer of the Schwab feed has a fallback: if the live token
          isn&rsquo;t working, it quietly falls back to free public data sources for prices instead of
          throwing an error and killing the whole job.
        </p>

        <p>
          This is the same principle as the market email from an earlier post: when a data source is
          down, the email still sends — with a note in the affected section instead of a crash. A
          missing options chain shouldn&rsquo;t take down the entire morning briefing. The token
          renewal makes the good data <em>show up</em>; the fallbacks make sure a bad day is a
          degraded email, not a dead one.
        </p>

        {/* ── Failure alert design ── */}
        <h2>Designing the One Email That Matters</h2>
        <p>
          Since a failure email is now a rare, real event, I put care into making it actionable. When
          the self-heal can&rsquo;t recover, the email tells me how old the token is, roughly why the
          automated attempt failed (a login challenge, a changed page, the browser being down), and the
          exact command to run to fix it by hand. It&rsquo;s not &ldquo;something went wrong&rdquo; —
          it&rsquo;s &ldquo;here&rsquo;s the state, here&rsquo;s the button.&rdquo;
        </p>

        <p>
          One more subtlety: I didn&rsquo;t want a stuck token to email me every single day. So the
          alert de-duplicates — once it&rsquo;s warned me, it stays quiet for 24 hours before it&rsquo;s
          allowed to warn again. A real problem gets one clear ping, not a daily pile-up that I&rsquo;d
          start tuning out.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: what the failure email carries</h4>
        <ul>
          <li>The token&rsquo;s current age, and the reminder that 7 days is the hard wall</li>
          <li>A best-guess reason the automated recovery didn&rsquo;t work</li>
          <li>A pointer to the failure screenshot</li>
          <li>The one command to re-authenticate manually</li>
          <li>A 24-hour cooldown so a persistent failure pings once, not endlessly</li>
        </ul>

        {/* ── How it grew ── */}
        <h2>How It Grew: From Nag to Self-Heal</h2>
        <p>
          The evolution is really a story about moving the human further and further out of the loop:
        </p>

        <ul>
          <li>
            <strong>Stage 1 — Manual</strong>: I renewed the token entirely by hand whenever I
            remembered. Fragile and forgettable.
          </li>
          <li>
            <strong>Stage 2 — Reminder</strong>: a daily check emailed me when the token was aging.
            Better, but it was a chore-generator that depended on me being reachable.
          </li>
          <li>
            <strong>Stage 3 — Self-heal</strong>: the same daily check now performs the renewal itself
            and only emails on failure. The manual path still exists as a fallback for the rare day the
            automation can&rsquo;t recover.
          </li>
        </ul>

        <p>
          I kept the manual path deliberately. Self-healing systems shouldn&rsquo;t delete their own
          escape hatch — when the automation gives up (correctly, per the safety rails), I want a
          fast, well-worn way to fix it myself. The failure email is basically a shortcut straight to
          that path.
        </p>

        {/* ── Lessons ── */}
        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>The daily freshness check</strong> — reading a marker file, comparing an age
            against a threshold, and deciding whether to act is a handful of lines. The logic is
            simple; the value is in it running every day forever.
          </li>
          <li>
            <strong>The short-lived access token refresh</strong> — swapping the 30-minute token for
            a fresh one is the <em>easy</em> half of OAuth and it just worked. The 7-day refresh token
            was where all the real difficulty lived.
          </li>
          <li>
            <strong>The failure email</strong> — reusing the same Resend setup that powers every other
            alert on the server. Same pattern, new trigger. Wiring it up took minutes.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Accepting that renewal needs a real login</strong> — I spent time trying to renew
            the refresh token the &ldquo;normal&rdquo; OAuth way before fully accepting Schwab&rsquo;s
            7-day wall is absolute. Once I stopped fighting it and built <em>around</em> it, the design
            got simpler.
          </li>
          <li>
            <strong>Making the auto-login safe rather than clever</strong> — the instinct is to add
            retries and make it robust to every hiccup. The scar tissue from a past lockout pushed me
            the other way: one attempt, hard stop on anything unexpected, hand it to a human. Building
            restraint took more thought than building capability.
          </li>
          <li>
            <strong>Getting the early-renewal timing right</strong> — renew too late and there&rsquo;s
            no buffer to recover; renew too eagerly and you&rsquo;re driving a login more often than
            needed. Renewing around day 5 of 7 leaves a two-day cushion without being twitchy.
          </li>
          <li>
            <strong>Alert discipline</strong> — the whole system is only useful if a Schwab email means
            &ldquo;act now.&rdquo; That meant being ruthless about staying silent on success and
            de-duplicating on failure, so I never train myself to ignore it.
          </li>
        </ul>

        <p>
          The best part of this one isn&rsquo;t visible, which is exactly the point. There&rsquo;s no
          new feature to look at, no page to open. There&rsquo;s just a token that used to die every
          week and now quietly renews itself before it does — and a morning email that keeps arriving
          with real market data behind it, whether or not I remembered a thing.
        </p>
      <RelatedPosts slug="how-i-self-healed-schwab-oauth" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
