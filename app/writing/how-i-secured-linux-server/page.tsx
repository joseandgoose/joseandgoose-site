import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Secured the Home Linux Server — Jose and Goose",
  description: "Hardening a home Linux server with UFW firewall, Fail2ban, SSH key-only auth, port knocking for remote access, and SSH login alerts — layered security without locking yourself out",
};

export default function HowISecuredLinuxServer() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 7, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>9 min read</span>
      </div>
      <PostTags slug="how-i-secured-linux-server" />

      <h1 className="post-title">How I Secured the Home Linux Server</h1>
      <p className="post-subtitle">
        Layered security for an always-on home machine — UFW firewall, Fail2ban brute-force protection, SSH key-only auth, port knocking for remote access, and instant login alerts
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A hardened home Linux server with layered defenses — resistant to brute-force attacks, accessible remotely without exposing SSH publicly</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (firewall rules, SSH config, knockd daemon, systemd services)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours: firewall + Fail2ban (~45 min) + SSH hardening (~30 min) + port knocking (~45 min)</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-secured-linux-server" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>A running Linux server</strong>{" "}
            — mine is the old laptop from the previous post <em>(already set up)</em>
          </li>
          <li>
            <strong>UFW</strong>{" "}
            — Uncomplicated Firewall, pre-installed on Ubuntu/Mint <em>(free)</em>
          </li>
          <li>
            <strong>Fail2ban</strong>{" "}
            — automatically bans IPs after repeated failed SSH attempts <em>(free)</em>
          </li>
          <li>
            <strong>knockd</strong>{" "}
            — port knocking daemon for hidden SSH access from outside your network <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email API for SSH login alerts <em>(free tier)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI for writing configs and scripts <em>($200/yr)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: SSH Is a Target</h2>
        <p>
          The moment you connect a machine to the internet with SSH running, bots start knocking.
          Not metaphorically — literally. Automated scripts scan entire IP ranges looking for open
          port 22, try common username/password combinations, and move on. It&rsquo;s background noise
          on the internet, and it starts within hours of going online.
        </p>

        <p>
          Most home setups are &quot;secure enough&quot; because they&rsquo;re behind a router that doesn&rsquo;t
          forward SSH. But I wanted to SSH in from outside my home network — from my phone at a coffee
          shop, from a laptop while traveling. That meant opening a path in from the public internet,
          which meant I needed to be intentional about security.
        </p>

        <p>
          The approach: layered defense. No single lock — multiple locks, where even breaking one
          doesn&rsquo;t hand you the keys. And alerts so I know immediately if anything unusual happens.
        </p>

        {/* ── Layer 1 ── */}
        <h2>Layer 1: UFW Firewall — Default Deny</h2>
        <p className="post-session-meta">~15 minutes</p>
        <p>
          UFW (Uncomplicated Firewall) is a front-end for iptables that makes firewall rules readable.
          The strategy: deny everything by default, then explicitly allow only what I need.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: UFW setup</h4>
        <ul>
          <li><code>sudo ufw default deny incoming</code> — block all inbound connections by default</li>
          <li><code>sudo ufw default allow outgoing</code> — allow all outbound (the server can initiate connections)</li>
          <li><code>sudo ufw allow ssh</code> — allow SSH (port 22) so I don&rsquo;t lock myself out</li>
          <li><code>sudo ufw enable</code> — activate the firewall</li>
          <li><code>sudo ufw status verbose</code> — verify the rules look right before closing the terminal</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">Critical order of operations</span>
          <p>
            Always allow SSH <em>before</em> enabling the firewall. If you enable UFW with default deny
            and no SSH rule, you&rsquo;ll lock yourself out of the machine immediately — and need a monitor
            and keyboard to fix it. The order matters: allow → enable, not enable → allow.
          </p>
        </div>

        <p>
          I also restricted my personal API server to LAN-only access — no reason for
          that port to be reachable from the public internet:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: LAN-only port rule</h4>
        <ul>
          <li><code>sudo ufw allow from 192.168.x.0/24 to any port [your-port]</code></li>
          <li>This allows the port only from devices on your home network (your LAN subnet)</li>
          <li>Any connection attempt from outside that subnet is silently dropped</li>
        </ul>

        {/* ── Layer 2 ── */}
        <h2>Layer 2: Fail2ban — Auto-Ban Brute Force Attempts</h2>
        <p className="post-session-meta">~20 minutes</p>
        <p>
          Fail2ban watches authentication logs and temporarily bans IP addresses that fail login
          attempts repeatedly. Even with key-only SSH (more on that below), it&rsquo;s a useful
          layer — it stops bots from hammering the port and cluttering logs.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Fail2ban setup</h4>
        <ul>
          <li><code>sudo apt install fail2ban -y</code></li>
          <li>
            Create <code>/etc/fail2ban/jail.local</code> with:
            <ul>
              <li><code>maxretry</code> — number of failures before a ban (keep it low)</li>
              <li><code>bantime</code> — how long to ban (go higher than the default 10 minutes — hours or days)</li>
              <li><code>findtime</code> — the window in which failures are counted</li>
            </ul>
          </li>
          <li><code>sudo systemctl enable fail2ban && sudo systemctl start fail2ban</code></li>
          <li>Check status: <code>sudo fail2ban-client status sshd</code></li>
        </ul>

        <p>
          I also set up a nightly cron that emails me a count of new bans since the previous day.
          It&rsquo;s useful to see the number trending — a sudden spike could mean something targeted,
          while a steady background rate is just normal internet noise.
        </p>

        {/* ── Layer 3 ── */}
        <h2>Layer 3: SSH Hardening — Keys Only, No Passwords</h2>
        <p className="post-session-meta">~15 minutes</p>
        <p>
          Password-based SSH is inherently weaker than key-based auth. A password can be guessed.
          An SSH private key cannot (practically). Once I confirmed my key-based login was working,
          I disabled password authentication entirely:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Disable SSH password auth</h4>
        <ul>
          <li>Edit <code>/etc/ssh/sshd_config</code></li>
          <li>Set <code>PasswordAuthentication no</code></li>
          <li>Set <code>ChallengeResponseAuthentication no</code></li>
          <li>Set <code>PubkeyAuthentication yes</code></li>
          <li>Restart SSH: <code>sudo systemctl restart ssh</code></li>
          <li>
            <strong>Test from a second terminal window first</strong> — open a new SSH session and confirm
            it connects with your key before closing the current one
          </li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">Test before you commit</span>
          <p>
            Always keep your current SSH session open while testing the new config. If something&rsquo;s
            wrong and you can&rsquo;t connect with a key, you still have the existing session to fix it.
            Closing the only session before verifying is how people get locked out.
          </p>
        </div>

        {/* ── Layer 4 ── */}
        <h2>Layer 4: Port Knocking — Hidden SSH from the Internet</h2>
        <p className="post-session-meta">~45 minutes</p>
        <p>
          Port knocking is a technique where SSH port 22 is closed by default — completely hidden
          from the outside world. To open it, you send a specific sequence of connection attempts to
          a set of ports (the &quot;knock sequence&quot;) in order. If the sequence matches, the firewall
          temporarily opens SSH for your IP. Anything that doesn&rsquo;t know the sequence sees nothing.
        </p>

        <p>
          This solves the remote access problem without exposing port 22 to public scanners. Bot
          scripts see a machine with no open ports. Only someone who knows the knock sequence can
          even attempt to connect.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: knockd setup</h4>
        <ul>
          <li><code>sudo apt install knockd -y</code></li>
          <li>
            Configure <code>/etc/knockd.conf</code>:
            <ul>
              <li>Open sequence: <code>[PORT1] → [PORT2] → [PORT3]</code> (pick random high ports — don&rsquo;t use anyone else&rsquo;s sequence)</li>
              <li>Close sequence: reverse order of the open sequence</li>
              <li>
                On open: <code>ufw allow from %IP% to any port 22</code>
              </li>
              <li>
                On close: <code>ufw delete allow from %IP% to any port 22</code>
              </li>
              <li>Timeout: 5 seconds — all knocks must arrive within 5 seconds of each other</li>
            </ul>
          </li>
          <li>
            Set the network interface in <code>/etc/default/knockd</code>:
            <code>KNOCKD_OPTS="-i [your-interface]"</code> — run <code>ip a</code> to find your interface name (e.g. <code>eth0</code>, <code>wlan0</code>)
          </li>
          <li><code>sudo systemctl enable knockd && sudo systemctl start knockd</code></li>
          <li>Remove the blanket SSH rule from UFW: <code>sudo ufw delete allow ssh</code></li>
        </ul>

        <p>
          Now SSH is invisible from outside the network. To connect remotely, I first run a knock
          script on my Mac, then SSH normally:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Mac knock script</h4>
        <ul>
          <li>Uses <code>nc</code> (netcat) to hit each port in sequence with a 0.3-second delay between knocks</li>
          <li><code>nc -z -w1 [server-public-ip] [PORT1]</code></li>
          <li><code>nc -z -w1 [server-public-ip] [PORT2]</code></li>
          <li><code>nc -z -w1 [server-public-ip] [PORT3]</code></li>
          <li>Wait 1 second, then <code>ssh homeserver</code> connects normally</li>
          <li>From the LAN (home network), no knock needed — SSH works directly</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">Router setup for remote access</span>
          <p>
            For port knocking to work remotely, your router needs to forward your three knock ports
            and port 22 to the server&rsquo;s LAN IP. In Google Wifi: Settings →
            Network & general → Advanced networking → Port management. Add forwarding rules for each
            port pointing to the server&rsquo;s reserved LAN IP.
          </p>
        </div>

        {/* ── Layer 5 ── */}
        <h2>Layer 5: SSH Login Alerts</h2>
        <p className="post-session-meta">~20 minutes</p>
        <p>
          Even with all the above, I wanted to know immediately if someone successfully SSH&rsquo;d into
          the server — especially from outside my home network. OpenSSH has a built-in hook that
          runs a script automatically on every successful login. I wired that to a Resend alert.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: SSH login alert</h4>
        <ul>
          <li>
            The login hook script:
            <ul>
              <li>Gets the connecting IP from the SSH environment</li>
              <li>Checks if it&rsquo;s a LAN IP (your home subnet) — if so, skip the alert</li>
              <li>If it&rsquo;s from outside the LAN, sends an email via Resend API immediately</li>
            </ul>
          </li>
          <li>The email includes: connecting IP, timestamp, and a note to SSH in and investigate</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">Why skip LAN logins?</span>
          <p>
            LAN SSH connections (from my Mac at home) are routine. Alerting on every one of those
            would bury real alerts in noise. The check is simple: if the connecting IP matches your
            home subnet, it&rsquo;s local — skip the email. Anything else gets alerted.
          </p>
        </div>

        {/* ── Final Output ── */}
        <h2>Final Security Stack</h2>

        <p>Five layers, each independent — breaking one doesn&rsquo;t break the others:</p>

        <ul>
          <li>
            <strong>UFW</strong> — default deny all inbound; internal services LAN-only; SSH handled by knockd rules
          </li>
          <li>
            <strong>Fail2ban</strong> — 3 strikes → 24-hour ban; nightly email with ban count
          </li>
          <li>
            <strong>SSH key-only auth</strong> — password authentication disabled entirely
          </li>
          <li>
            <strong>Port knocking</strong> — SSH invisible to public scanners; knock sequence required to open it
          </li>
          <li>
            <strong>Login alerts</strong> — instant email on any non-LAN SSH login
          </li>
        </ul>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal — Remote Access from Anywhere</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim"># From a coffee shop, on phone hotspot:</span></div>
              <div><span className="post-terminal-dim">$ bash ~/knock.sh</span></div>
              <div><span className="post-terminal-success">Knocking [PORT1]... [PORT2]... [PORT3]</span></div>
              <div><span className="post-terminal-success">SSH port opened.</span></div>
              <br />
              <div><span className="post-terminal-dim">$ ssh homeserver</span></div>
              <div><span className="post-terminal-success">Welcome to Linux Mint 22.1</span></div>
              <div><span className="post-terminal-success">user@homeserver:~$</span></div>
              <br />
              <div><span className="post-terminal-dim"># Meanwhile, email arrives:</span></div>
              <div><span className="post-terminal-success">📬 SSH login from [external IP] at 14:22:07</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            Knock, connect, get alerted. SSH access from anywhere — with a full audit trail.
          </p>
        </div>

        <h3>What went fast</h3>
        <ul>
          <li><strong>UFW setup</strong> — five commands, 10 minutes, done</li>
          <li><strong>Fail2ban</strong> — apt install + one config file; sensible defaults</li>
          <li><strong>Disabling password auth</strong> — three lines in sshd_config, restart, done</li>
          <li><strong>SSH login alerts</strong> — Claude wrote the IP-checking + Resend email script in one pass</li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>knockd interface name</strong> — the config needs the exact network interface name
(e.g. <code>eth0</code> or <code>wlan0</code> — use <code>ip a</code> to find yours).
            Wrong interface name means knockd listens on the wrong adapter and nothing works.
          </li>
          <li>
            <strong>UFW rule ordering with knockd</strong> — after removing the blanket <code>allow ssh</code>,
            I had to confirm knockd was adding/removing rules correctly with <code>sudo ufw status</code> after each knock.
            First test: rule appeared as expected after the open sequence, disappeared after close.
          </li>
          <li>
            <strong>Router port forwarding</strong> — Google Wifi&rsquo;s port forwarding UI is buried. And you
            need to forward the knock ports <em>and</em> port 22 — knocking opens the firewall but the
            router still needs to let the traffic through to the server.
          </li>
          <li>
            <strong>Testing without locking yourself out</strong> — every change to SSH config needs to be tested
            from a second open session. Learned to keep a &quot;safety session&quot; open until I confirmed
            the new setup worked.
          </li>
        </ul>

        <p>
          The entire stack took about two hours. What it gets me: a machine that&rsquo;s been running
          for weeks, publicly accessible from anywhere via SSH, that has had zero successful
          unauthorized access attempts — and I&rsquo;d know immediately if that changed.
        </p>
      <RelatedPosts slug="how-i-secured-linux-server" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
