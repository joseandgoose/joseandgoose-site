import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Built a Personal API Server to Control Everything Remotely — Jose and Goose",
  description: "Building an Express API on a headless Linux server with API key auth, systemd, and port knocking — a remote control for running jobs, checking health, and pulling reports from anywhere",
};

export default function HowIBuiltAPIServer() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 30, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>8 min read</span>
      </div>
      <PostTags slug="how-i-built-api-server" />

      <h1 className="post-title">How I Built a Personal API Server to Control Everything Remotely</h1>
      <p className="post-subtitle">
        An Express API on the Alienware that lets me trigger jobs, check system health, and pull reports — secured with API key auth, systemd, and the same port knocking that protects SSH
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A personal API running on a non-standard port — remote control for the server&rsquo;s jobs and system reports, accessible from any device on the home network or via port knocking from outside</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (Express.js, systemd service, API key auth, UFW firewall rules, port knocking)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~4 hours across 3 sessions, with security hardening added over the following week</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-api-server" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Node.js + Express</strong>{" "}
            — a lightweight web server framework. Express handles incoming HTTP requests and routes them to the right function <em>(free)</em>
          </li>
          <li>
            <strong>systemd</strong>{" "}
            — Linux&rsquo;s built-in service manager. It starts programs on boot and automatically restarts them if they crash — like a supervisor that never sleeps <em>(built-in)</em>
          </li>
          <li>
            <strong>UFW</strong>{" "}
            — firewall rules to restrict the API port to LAN-only traffic <em>(built-in)</em>
          </li>
          <li>
            <strong>Port knocking (knockd)</strong>{" "}
            — hides the port from external scanners until a secret knock sequence is sent <em>(already set up)</em>
          </li>
          <li>
            <strong>Headless Linux server</strong>{" "}
            — the always-on Alienware <em>(already set up)</em>
          </li>
        </ul>

        {/* ── Context ── */}
        <h2>Where This Fits</h2>
        <p>
          This is the fourth post in the Alienware server series. The first three covered the
          foundation: <a href="/writing/how-i-setup-headless-linux">turning the laptop into a headless server</a>,{" "}
          <a href="/writing/how-i-secured-linux-server">locking it down with layered security</a>, and{" "}
          <a href="/writing/how-i-built-server-alerts">building a full alert system</a> so I&rsquo;d
          know when something breaks. Those posts were about making the server <em>exist</em>,
          making it <em>safe</em>, and making it <em>observable</em>.
        </p>

        <p>
          This one is about making it <em>controllable</em> — without opening a terminal every time.
        </p>

        {/* ── The Problem ── */}
        <h2>The Problem: SSH for Everything</h2>
        <p>
          SSH is great for full terminal access. But most of the time I don&rsquo;t need a terminal.
          I need to trigger a specific job, check if the server is healthy, or pull a quick report.
          Opening a terminal, connecting via SSH, remembering the right command, and running it is
          overkill for &ldquo;run the market briefing in test mode.&rdquo;
        </p>

        <p>
          What I wanted was an API — something I could hit from a phone, a script, or a shortcut.
          One HTTP request to run a job. One GET to check health. No terminal required.
        </p>

        {/* ── The Endpoints ── */}
        <h2>What the API Does</h2>
        <p>
          Six endpoints, each handling one concern:
        </p>

        <ul>
          <li>
            <strong><code>GET /health</code></strong> — the only unauthenticated endpoint. Returns
            server uptime, memory usage, and disk space. Used by external monitoring to confirm
            the API process is alive.
          </li>
          <li>
            <strong><code>POST /run/:job</code></strong> — triggers a named job (e.g., <code>/run/market-daily-test</code>,
            <code>/run/garmin-recap</code>). Each job maps to a script on disk. The API spawns the script
            as a child process and returns immediately with a job ID.
          </li>
          <li>
            <strong><code>POST /tasks/submit</code></strong> — submits a batch task to the processing queue.
            Writes a file to the inbox folder that the every-minute cron worker picks up and processes.
          </li>
          <li>
            <strong><code>GET /tasks/status</code></strong> — lists recent batch task results (completed,
            pending, failed) with their output.
          </li>
          <li>
            <strong><code>GET /reports/disk</code></strong> — returns the latest disk usage snapshot.
          </li>
          <li>
            <strong><code>GET /reports/resources</code></strong> — returns the most recent resource
            samples (CPU, memory, swap) from the CSV logs.
          </li>
        </ul>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Express setup</h4>
        <ul>
          <li>Single <code>index.js</code> file — Express app with middleware for API key validation</li>
          <li>API key stored in a protected file in the home directory (chmod 600, owned by the service user)</li>
          <li>Every request (except <code>/health</code>) must include <code>x-api-key</code> header matching the stored key</li>
          <li>Job runner uses <code>child_process.spawn()</code> with detached mode so the API doesn&rsquo;t wait for long-running scripts</li>
          <li>Response format is JSON for all endpoints</li>
        </ul>

        {/* ── Security ── */}
        <h2>Security: Three Layers Deep</h2>
        <p>
          An API running on a home server is a target if it&rsquo;s exposed. The security model
          uses three independent layers, each of which would need to be bypassed separately:
        </p>

        <h3>Layer 1: Firewall (UFW)</h3>
        <p>
          The API port is only open to the local network subnet. Any request from
          outside the home network is dropped at the firewall level before it reaches Express. This
          means the API is invisible to the public internet by default.
        </p>

        <h3>Layer 2: API Key Auth</h3>
        <p>
          Even on the local network, every request must include the correct API key in the
          <code>x-api-key</code> header. The key is a long random string stored in a file readable
          only by the service user. No key, no access — even from a device on the same WiFi.
        </p>

        <h3>Layer 3: Port Knocking (External Access)</h3>
        <p>
          When I&rsquo;m outside the home network and need API access, port knocking opens the door
          temporarily. A specific sequence of packets sent to three ports in the right order tells
          the firewall to open a non-standard port for my IP. A reverse sequence closes it. The knock script
          runs from my laptop or phone before any API request.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Defense in depth</span>
          <p>
            Any one of these layers would be reasonable security on its own. All three together
            means an attacker would need to be on my LAN, know the API key, <em>and</em> know the
            port knock sequence. That&rsquo;s not impossible, but it&rsquo;s not worth anyone&rsquo;s
            time for a personal API on a home server.
          </p>
        </div>

        {/* ── systemd ── */}
        <h2>Keeping It Running: systemd</h2>
        <p>
          The API needs to survive reboots, crashes, and the monthly scheduled restart. That means
          running it as a systemd service, not a background process started with <code>nohup</code>
          or <code>screen</code>.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: systemd service</h4>
        <ul>
          <li>Service file at <code>/etc/systemd/system/my-api.service</code></li>
          <li><code>Restart=always</code> — if the process crashes, systemd restarts it immediately</li>
          <li><code>RestartSec=5</code> — 5 second delay between restarts to avoid crash loops</li>
          <li><code>WantedBy=multi-user.target</code> — starts automatically on boot</li>
          <li>Logs go to Linux&rsquo;s built-in log system (journald) — one command to watch them stream in real-time</li>
          <li>Managed with standard commands: <code>sudo systemctl start|stop|restart|status my-api</code></li>
        </ul>

        <p>
          systemd is the right tool here because it handles the two hard problems: starting on boot
          and restarting on crash. A manually started process with <code>node index.js &amp;</code>
          dies on reboot and stays dead on crash. The systemd service file is 12 lines and solves
          both problems permanently.
        </p>

        {/* ── How I Use It ── */}
        <h2>How I Actually Use It</h2>
        <p>
          The most common use case: testing the market briefing. Instead of SSH-ing into the server,
          navigating to the right directory, sourcing the env file, and running the script with the
          test flag, I send one curl:
        </p>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal</span>
            </div>
            <div className="post-terminal-body">
              <div>$ curl -X POST http://[server-ip]:[port]/run/market-daily-test \</div>
              <div>&nbsp;&nbsp;-H &quot;x-api-key: $API_KEY&quot;</div>
              <div><br/></div>
              <div><span className="post-terminal-success">&#123;&quot;status&quot;:&quot;started&quot;,&quot;job&quot;:&quot;market-daily-test&quot;&#125;</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            One line to trigger a job. The API spawns the script and returns immediately.
          </p>
        </div>

        <p>
          The health endpoint is even simpler — a GET request with no auth that returns server vitals.
          I have a phone shortcut that hits <code>/health</code> and shows uptime, memory, and disk
          in a notification. One tap to check the server without opening a terminal.
        </p>

        <p>
          The task endpoint lets me queue batch jobs from anywhere. Drop a request via POST, the
          every-minute cron worker picks it up, processes it, and the result appears in
          <code>/tasks/status</code> when it&rsquo;s done. An asynchronous processing queue built
          with nothing but a file system and cron.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          The API has been running as a systemd service since late March. It survives reboots,
          restarts on crashes, and responds to health checks within milliseconds. The entire
          codebase is one JavaScript file and one systemd service file.
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Express setup</strong> — a Node.js HTTP server with 6 routes is about as
            simple as backend code gets. The first working version with health check and job
            runner took 45 minutes.
          </li>
          <li>
            <strong>systemd service</strong> — 12-line config file, copy to <code>/etc/systemd/system/</code>,
            run <code>systemctl enable</code>. The API has auto-started on every boot since day one.
          </li>
          <li>
            <strong>UFW rule</strong> — one command to allow the API port from the LAN subnet only.
            Network security in one line.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Running jobs in the background</strong> — the first version of the job runner
            launched scripts and waited for them to finish before responding. Long-running jobs
            (like the market briefing) would time out the HTTP request. The fix was launching
            scripts as detached background processes — the API says &ldquo;started&rdquo; and
            returns immediately while the script keeps running on its own.
          </li>
          <li>
            <strong>API key file permissions</strong> — the key file needs to be readable by the
            systemd service user but not by other users on the system. Getting the ownership and
            chmod right (600, owned by the service user) required understanding how systemd runs
            processes under a specific user context.
          </li>
          <li>
            <strong>Port knocking for the API port</strong> — the existing knockd config only
            opened the SSH port. Extending it to also open a non-standard port required adding a second
            rule set. Testing it meant locking myself out twice before getting the sequence and
            timeout values right.
          </li>
        </ul>

        <p>
          The API is the simplest project on the Alienware. Six endpoints, one file, no database.
          But it changed how I interact with everything else. Instead of SSH for every small task,
          I send an HTTP request from the couch while Goose takes up the other half of it. The
          server went from something I log into to something I talk to.
        </p>
      <RelatedPosts slug="how-i-built-api-server" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
