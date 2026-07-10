import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built Self-Hosted Push Alerts to My Phone — Jose and Goose",
  description:
    "Replacing buried email alerts with instant phone push notifications using self-hosted ntfy, kept private to my own devices over Tailscale with token auth — no third-party push service",
};

export default function HowIBuiltSelfHostedPushAlerts() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>May 8, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>
      <PostTags slug="how-i-built-self-hosted-push-alerts" />

      <h1 className="post-title">How I Built Self-Hosted Push Alerts to My Phone</h1>
      <p className="post-subtitle">
        My home server needed to buzz my phone the instant something breaks — not send an
        email I&rsquo;d see three hours later. So I self-hosted ntfy, locked it to my own devices over
        a personal VPN, and now my scripts push straight to my pocket with no third-party service in the middle
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              A private push-notification channel my home server can publish to — instant phone
              alerts for power loss and anything else worth interrupting me for, delivered without
              any third-party push provider
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (self-hosting a service, VPN networking, firewall rules, token auth, shell scripting)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours: install + config (~30 min) + VPN and firewall lockdown (~30 min) + auth (~20 min) + migrating the first alert and debugging a boot crash (~40 min)</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-self-hosted-push-alerts" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the always-on home machine from the earlier posts, running the alert scripts <em>(already set up)</em>
          </li>
          <li>
            <strong><a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer">ntfy</a></strong>{" "}
            — an open-source app that turns a plain web request into a phone push notification, self-hosted so nothing leaves my network <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://tailscale.com" target="_blank" rel="noopener noreferrer">Tailscale</a></strong>{" "}
            — a personal VPN (virtual private network — a private, encrypted network only my logged-in devices can join) <em>(free tier)</em>
          </li>
          <li>
            <strong>ntfy Android app</strong>{" "}
            — the phone client that holds an open connection and rings the second an alert arrives <em>(free)</em>
          </li>
          <li>
            <strong>UFW</strong>{" "}
            — the server firewall, used to make the notification service invisible to the public internet <em>(free)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI for writing the config, the publish scripts, and untangling the boot bug <em>($200/yr)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: Alerts That Arrive Too Late</h2>
        <p>
          My home server runs a pile of unattended jobs — market emails, finance scrapers, bots. When
          one of them breaks, or when the machine loses AC power and starts draining its battery, I want
          to know <em>now</em>. My original setup emailed me. And email is fine for a daily digest, but it&rsquo;s
          a terrible way to learn your server is 90 seconds from shutting down. The alert lands in a folder,
          I see it during my next inbox check, and by then the thing I could have prevented already happened.
        </p>

        <p>
          I wanted a real interruption — the kind of buzz you get from a text message. The obvious answer is a
          push-notification service, but the popular ones route your messages through someone else&rsquo;s cloud.
          I didn&rsquo;t love the idea of my &ldquo;the server is dying&rdquo; alerts passing through a third
          party&rsquo;s servers, tied to an account they could rate-limit or shut off. So the goal became:
          instant push, but self-hosted and private to my own devices.
        </p>

        {/* ── What ntfy Is ── */}
        <h2>What ntfy Actually Does</h2>
        <p>
          <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer">ntfy</a> (pronounced &ldquo;notify&rdquo;) is
          gloriously simple. It&rsquo;s a small server that listens for web requests and forwards them to
          subscribed phones as push notifications. A script sends a message to a named <em>topic</em> (a channel —
          think of it like a private chat room name), and every device subscribed to that topic gets a push. That&rsquo;s the whole model.
        </p>

        <p>
          The magic is that publishing is just a single web request. Any script that can make an HTTP call — which
          is every script — can send me a notification with one line. No SDK to install, no app to build, no
          account to register. And because I&rsquo;m running the server myself, I control who can publish, who can
          subscribe, and where it lives on the network.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Why &ldquo;instant&rdquo; is instant</span>
          <p>
            The phone app doesn&rsquo;t poll for new messages every few minutes. It holds a WebSocket open — a
            persistent two-way connection that stays live in the background — so the moment my server publishes,
            the notification is already on my screen. In practice it beats the buzz of an incoming text.
          </p>
        </div>

        {/* ── How the Pieces Fit ── */}
        <h2>How the Pieces Fit Together</h2>

        <figure className="post-visual">
          <div style={{ overflowX: "auto" }}>
            <svg viewBox="0 0 760 210" role="img" aria-label="A script on the home server posts an alert to a self-hosted ntfy server, which pushes it over a Tailscale private VPN to the phone, arriving instantly; a firewall keeps the server off the public internet." style={{ width: "100%", maxWidth: 760, height: "auto", display: "block", margin: "0 auto", fontFamily: "var(--sans)" }}>
              <defs>
                <marker id="ntfy-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#31583f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              <rect x="16" y="70" width="156" height="64" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="94" y="96" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="600">a script</text>
              <text x="94" y="116" textAnchor="middle" fill="#5b6b62" fontSize="11.5">detects an event</text>
              <text x="193" y="90" textAnchor="middle" fill="#7a8a80" fontSize="10.5">POST</text>
              <line x1="172" y1="102" x2="212" y2="102" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#ntfy-arrow)" />
              <rect x="214" y="70" width="156" height="64" rx="10" fill="#264635" />
              <text x="292" y="96" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="600">ntfy server</text>
              <text x="292" y="116" textAnchor="middle" fill="#cddbd2" fontSize="11.5">self-hosted</text>
              <line x1="370" y1="102" x2="410" y2="102" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#ntfy-arrow)" />
              <rect x="412" y="70" width="164" height="64" rx="10" fill="#F3D104" stroke="#264635" strokeWidth="1.8" />
              <text x="494" y="96" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="700">Tailscale VPN</text>
              <text x="494" y="116" textAnchor="middle" fill="#4a3d05" fontSize="11.5">private to my devices</text>
              <line x1="576" y1="102" x2="616" y2="102" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#ntfy-arrow)" />
              <rect x="618" y="70" width="126" height="64" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="681" y="96" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="600">my phone</text>
              <text x="681" y="116" textAnchor="middle" fill="#5b6b62" fontSize="11.5">instant push</text>
              <text x="292" y="162" textAnchor="middle" fill="#7a8a80" fontSize="11">firewall — never exposed to the public internet</text>
            </svg>
          </div>
          <figcaption className="post-visual-caption">
            A script POSTs an alert to the self-hosted <strong>ntfy</strong> server; my phone holds an open connection and rings instantly. <strong>Tailscale</strong> keeps the whole path private to my own devices — the firewall makes it invisible to the public internet.
          </figcaption>
        </figure>
        <p>
          The full path an alert travels is short: a scheduled script on the server detects something, makes one
          web request to the ntfy server (also running on that same machine), the ntfy server pushes it across my
          private VPN to my phone, and the phone app rings. Four hops, all of them either on my own hardware or
          inside my own encrypted network.
        </p>

        <ul>
          <li><strong>Source</strong> — a cron job (a task Linux runs automatically on a schedule) notices a problem</li>
          <li><strong>Server</strong> — self-hosted ntfy receives the message</li>
          <li><strong>Network</strong> — Tailscale carries it privately, never over the public internet</li>
          <li><strong>Client</strong> — the ntfy app on my phone shows the push instantly</li>
        </ul>

        {/* ── The Server ── */}
        <h2>Running the Server</h2>
        <p className="post-session-meta">~30 minutes</p>
        <p>
          I installed ntfy (version 2.14.0 at the time) and set it up as a systemd service — a background program
          that Linux keeps running and restarts automatically if it dies or the machine reboots. All of its behavior
          lives in one config file, which keeps the whole thing auditable: I can read exactly what it&rsquo;s doing in
          a single place.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: server setup</h4>
        <ul>
          <li>Install ntfy and enable it as a systemd service so it survives reboots</li>
          <li>All settings live in one YAML config file under <code>/etc/ntfy/</code></li>
          <li>It listens on a single local port — but that port is <em>not</em> open to the internet (the firewall handles that, below)</li>
          <li>Point the app on my phone at the server&rsquo;s private VPN address and subscribe to my topics</li>
        </ul>

        {/* ── Privacy ── */}
        <h2>Keeping It Private: VPN + Firewall</h2>
        <p className="post-session-meta">~30 minutes</p>
        <p>
          This is the part I cared about most. A push server that&rsquo;s reachable from the public internet is a
          server that strangers can find, probe, and try to spam. I didn&rsquo;t want mine to have a public front door
          at all. Two layers make sure it doesn&rsquo;t.
        </p>

        <p>
          The first is <strong>Tailscale</strong>, a personal VPN. It stitches my own devices — the server, my laptop,
          my phone — into one small private network that only shows up for devices I&rsquo;ve personally logged into.
          The server is reachable at a private address inside that network and nowhere else. There is no public URL, no
          public IP, nothing for a scanner to stumble onto.
        </p>

        <p>
          The second is the <strong>firewall</strong>. As a belt-and-suspenders backup, I told UFW (the server&rsquo;s
          firewall) to only accept connections to the ntfy port that come from inside the VPN&rsquo;s private address
          range. Even if something were misconfigured, a connection from the open internet gets silently dropped before
          it reaches the app.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The privacy model in one sentence</span>
          <p>
            The VPN keeps the server reachable only from devices I&rsquo;ve personally logged in — it&rsquo;s never
            exposed to the public internet — and the firewall enforces that at a second layer even if I fat-finger a
            config. To reach my alert channel, you&rsquo;d first have to be on my private network.
          </p>
        </div>

        {/* ── Auth ── */}
        <h2>Auth: Deny Everything by Default</h2>
        <p className="post-session-meta">~20 minutes</p>
        <p>
          Being private on the network is one lock. Requiring credentials is a second, independent one. ntfy&rsquo;s
          access control starts from <em>deny all</em> — by default nobody can publish or subscribe to anything. From
          there I granted exactly one user access to exactly the topics I use, and nothing else. Even a device that
          somehow reached the server without permission would get turned away.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: access control</h4>
        <ul>
          <li>Default access set to deny — no anonymous publish, no anonymous subscribe</li>
          <li>Create a single user with a password, and grant it read/write on my topics only</li>
          <li>That user gets an access token — a long random string that acts as a stand-in password for scripts</li>
          <li>Store the token in a permissions-locked file the scripts read at runtime, never pasted inline</li>
          <li>New topic later? Explicitly grant that one topic to that one user — everything stays deny-by-default</li>
        </ul>

        {/* ── Publishing ── */}
        <h2>Publishing From a Script</h2>
        <p>
          Here&rsquo;s the payoff for all that setup: sending myself an alert is one command. A script reads the token
          from its locked file, then makes a single web request to a topic. Headers control the title, how urgent the
          notification is, and which little icon shows up on the lock screen.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: the publish call</h4>
        <ul>
          <li>Read the token from a permissions-locked file into a variable</li>
          <li>Send a web request carrying an <code>Authorization: Bearer &lt;token&gt;</code> header (proves the script is allowed to publish)</li>
          <li><code>Title</code> header — the bold headline of the notification</li>
          <li><code>Priority</code> header — set to urgent for power loss so it breaks through Do Not Disturb</li>
          <li><code>Tags</code> header — emoji names that render as icons (a rotating light, a power plug)</li>
          <li>The message body is the notification text — battery percentage, timestamp, whatever context I need</li>
        </ul>

        <p>
          The first real job I wired up was the AC power alert. A tiny script runs every minute, checks whether the
          laptop-turned-server is still on wall power, and if it isn&rsquo;t, fires an urgent push with the current
          battery level. A lockfile (a marker file that says &ldquo;already alerted&rdquo;) makes sure I get exactly
          one buzz per outage instead of one every minute until the battery dies. When power comes back, the marker
          clears and it&rsquo;s armed again.
        </p>

        {/* ── Migration Pattern ── */}
        <h2>Migrating Off Email, Safely</h2>
        <p>
          I didn&rsquo;t want to rip out the old email alerts and discover a week later that pushes were silently
          failing. So every migration follows the same careful pattern: add the push <em>alongside</em> the existing
          email, run both for about a week, confirm the phone reliably rings on real triggers, and only then remove
          the email fallback. Belt and suspenders until I trust the new belt.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Never trust a new alert channel on day one</span>
          <p>
            An alerting system that fails silently is worse than no alerting system — it gives you false confidence.
            Running the old and new channels in parallel for a week means the first few real alerts prove the pipe
            works before I rely on it alone. If the push never showed up, the email would still catch it.
          </p>
        </div>

        {/* ── How It Grew ── */}
        <h2>How It Grew: Starting Small on Purpose</h2>
        <p>
          The first version (v0.1) did exactly one thing: install the server, lock it to the VPN with token auth, get
          the phone app subscribed, and migrate a single alert — AC power loss — with email kept as a fallback. That
          was deliberate. I&rsquo;ve learned the hard way that a self-hosted service you can&rsquo;t fully reason about
          is a liability, not a feature.
        </p>

        <p>
          The design leaves obvious room to grow. Topics are organized so a whole family of future alerts has a home
          without touching the security model: one channel for critical power events, one for testing, and a reserved
          namespace for everything I&rsquo;ll add later. Migrating the next alert — a failed scraper, a bot that went
          quiet — is now a five-line change, because the hard part (a private, authenticated pipe to my pocket) is
          already built.
        </p>

        {/* ── The Bug ── */}
        <h2>The Bug That Cost Me an Evening</h2>
        <p>
          The setup worked perfectly — until the server rebooted, and then ntfy refused to start. It took a while to
          see why. I had originally told the server to bind directly to its VPN address (to listen for connections
          there specifically). But when the machine boots, the VPN takes a few seconds to come up, and ntfy started
          <em>first</em> — trying to grab an address that didn&rsquo;t exist yet. So it crashed on every boot, which is
          the worst possible time for your alerting system to be down.
        </p>

        <p>
          The fix was a small mental shift. Instead of binding to the VPN address (which isn&rsquo;t ready at boot), I
          told ntfy to listen on <em>all</em> the machine&rsquo;s network interfaces — which is always available
          immediately — and let the firewall be the thing that restricts access to the VPN only. Same end result
          (reachable solely over the private network), but nothing depends on boot timing anymore. The service comes
          up cleanly every time, and the firewall does the gatekeeping.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Phone — Lock Screen, 2:14 AM</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim"># Server yanks off wall power. Cron fires within 60s:</span></div>
              <br />
              <div><span className="post-terminal-success">🚨 AC Power Lost</span></div>
              <div><span className="post-terminal-success">Battery: 41% — ~1-2 min before shutdown.</span></div>
              <div><span className="post-terminal-dim">now · urgent · breaks through Do Not Disturb</span></div>
              <br />
              <div><span className="post-terminal-dim"># I&apos;m awake, plugging it back in, before the shutdown.</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            One web request from a shell script, delivered to my pocket over a private network, in the time it takes to buzz.
          </p>
        </div>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Publishing from scripts</strong> — one web request with an auth header. Every existing script that
            could send an email could send a push with a near-identical one-liner.
          </li>
          <li>
            <strong>The phone client</strong> — install the app, point it at the server&rsquo;s private address,
            subscribe to a topic. Instant delivery worked on the first try.
          </li>
          <li>
            <strong>Deny-by-default auth</strong> — starting from &ldquo;nobody can do anything&rdquo; and granting one
            user one set of topics is a small config and a clean security story.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>The boot-order crash</strong> — binding to the VPN address raced against the VPN coming up at boot.
            Switching to &ldquo;listen everywhere, restrict with the firewall&rdquo; fixed it, but finding the timing
            dependency took real debugging.
          </li>
          <li>
            <strong>Getting the privacy model right</strong> — it&rsquo;s tempting to just expose a port and move on. Doing
            it properly meant two independent layers (VPN membership <em>and</em> a firewall rule) so a single mistake
            can&rsquo;t open the door.
          </li>
          <li>
            <strong>Trusting the new channel</strong> — resisting the urge to delete the email fallback immediately. Running
            both for a week is boring and correct; a silent alerting failure is the exact thing you&rsquo;re trying to avoid.
          </li>
        </ul>

        <p>
          The best part isn&rsquo;t the tech — it&rsquo;s that I stopped thinking about it. My server can now reach into
          my pocket the instant something matters, over a channel I own end to end, with no cloud account in the middle
          that could throttle it or go down. It buzzes, I look, I fix it. That&rsquo;s the whole point.
        </p>
      <RelatedPosts slug="how-i-built-self-hosted-push-alerts" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
