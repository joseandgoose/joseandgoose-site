import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Turned an Old Laptop Into a Headless Linux Server — Jose and Goose",
  description: "Repurposing an old gaming laptop into an always-on home Linux server running Linux Mint, SSH, and a suite of automated jobs — no monitor required",
};

export default function HowISetupHeadlessLinux() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 6, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>8 min read</span>
      </div>
      <PostTags slug="how-i-setup-headless-linux" />

      <h1 className="post-title">How I Turned an Old Laptop Into a Headless Linux Server</h1>
      <p className="post-subtitle">
        Repurposing a 2011 gaming laptop into an always-on home server running Linux Mint — closed lid, no monitor, SSH access from anywhere
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>An always-on home Linux server you can SSH into from any device, running automated jobs 24/7 without a monitor</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Beginner–Intermediate (OS install, SSH config, systemd basics — no prior Linux required)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~3 hours: OS install and config (~2 hrs) + SSH remote access setup (~1 hr)</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-setup-headless-linux" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>An old laptop you&rsquo;re not using</strong>{" "}
            — mine was an old gaming laptop from 2011 (4GB RAM, 128GB SSD) <em>(free, already owned)</em>
          </li>
          <li>
            <strong><a href="https://linuxmint.com/download.php" target="_blank" rel="noopener noreferrer">Linux Mint 22.1</a></strong>{" "}
            — beginner-friendly Linux distro with great hardware support <em>(free)</em>
          </li>
          <li>
            <strong>A USB drive (8GB+)</strong>{" "}
            — to flash the installer <em>(free, already owned)</em>
          </li>
          <li>
            <strong><a href="https://etcher.balena.io" target="_blank" rel="noopener noreferrer">balenaEtcher</a></strong>{" "}
            — tool for writing the Linux ISO to the USB drive <em>(free)</em>
          </li>
          <li>
            <strong>Your home router</strong>{" "}
            — to assign the server a static local IP address <em>(already own)</em>
          </li>
          <li>
            <strong>A Mac or PC to SSH from</strong>{" "}
            — any modern machine with a terminal <em>(already own)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: Automation Needs a Home</h2>
        <p>
          After building a few automated systems on my Mac — Garmin health recaps, website monitoring,
          AI batch jobs — I ran into the same wall: my Mac has to be awake for any of it to work.
          Sleep mode, lid close, a reboot for an update — any of it kills the cron jobs. I was waking
          up to missed recap emails more often than I wanted.
        </p>

        <p>
          What I wanted was a machine that just&hellip; runs. Always on. Always connected. Something I
          could SSH into from anywhere, offload all my scheduled jobs to, and forget about. A home server.
        </p>

        <p>
          I had an old gaming laptop from 2011 sitting in a closet. Small form factor, barely bigger
          than a MacBook Air, and it still works fine. The GPU is ancient, but for running Python
          scripts and shell jobs overnight, it&rsquo;s overkill. The hardware was free. The OS was free.
          The whole project cost me an afternoon.
        </p>

        {/* ── Session 1 ── */}
        <h2>Session 1: Installing Linux Mint and Going Headless</h2>
        <p className="post-session-meta">Afternoon — ~2 hours</p>
        <p className="post-pace">
          <strong>Pace:</strong> Methodical. OS installs have a lot of waiting. The configuration work
          was quick once the system was up.
        </p>

        <h3>Why Linux Mint?</h3>
        <p>
          I didn&rsquo;t want to fight the operating system — I wanted to use it. Linux Mint is the
          most beginner-friendly Linux distribution available. It looks like a normal desktop, has a
          real package manager, and its hardware compatibility is excellent even for older machines.
          Ubuntu would have worked too, but Mint has slightly less friction out of the box.
        </p>

        <p>
          For a headless server (no monitor, no desktop), a lot of guides recommend Ubuntu Server.
          I chose the full Mint desktop install anyway — I wanted the option to plug in a monitor
          and navigate normally if something went wrong. Once configured, the desktop just sits unused
          in the background. No real downside.
        </p>

        <h3>Phase 1: Flash the Installer</h3>
        <p>
          Downloaded the Linux Mint 22.1 ISO (~2.7GB), opened balenaEtcher, selected the ISO, selected
          the USB drive, clicked Flash. About 8 minutes. Plug the USB into the laptop, boot to the
          BIOS (F2 on mine), set the boot order to USB first, save and exit.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Boot order change</h4>
        <ul>
          <li>Restart the laptop and immediately hold <code>F2</code> to enter BIOS setup</li>
          <li>Find the Boot tab, drag USB to the top of the boot priority list</li>
          <li>Save changes (F10) and exit — the laptop boots from the USB into the Mint live environment</li>
        </ul>

        <p>
          From there, the Mint installer is a guided wizard. Chose &quot;Erase disk and install Linux Mint,&quot;
          set a username and password, let it install. Took about 20 minutes. Rebooted, removed the USB,
          and was looking at a Linux Mint desktop.
        </p>

        <h3>Phase 2: Keep It Running with the Lid Closed</h3>
        <p>
          By default, closing a laptop lid suspends the machine. That defeats the purpose of a home server.
          One config file change fixes it:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Lid close behavior</h4>
        <ul>
          <li>
            Edit <code>/etc/systemd/logind.conf</code> — find the line <code>#HandleLidSwitch=suspend</code>
          </li>
          <li>
            Uncomment it and change it to <code>HandleLidSwitch=ignore</code>
          </li>
          <li>
            Also set <code>HandleLidSwitchExternalPower=ignore</code> for when plugged in
          </li>
          <li>
            Restart the service: <code>sudo systemctl restart systemd-logind</code>
          </li>
        </ul>

        <p>
          Closed the lid. The machine kept running. That&rsquo;s the whole trick for &quot;headless&quot; — it&rsquo;s
          not a special mode, it&rsquo;s just telling the OS to ignore the lid sensor.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Power tip</span>
          <p>
            Also disable auto-suspend in Power Settings (System Settings → Power Management → set suspend
            to &quot;Never&quot;). The logind.conf handles the lid, but the desktop power manager has its own
            idle sleep timer that can override it.
          </p>
        </div>

        <h3>Phase 3: Install SSH Server</h3>
        <p>
          SSH (Secure Shell) is what lets me connect to the server from my Mac — I type a command in
          Terminal, it opens a session on the laptop as if I were sitting in front of it. Linux Mint
          doesn&rsquo;t come with an SSH server running by default, but installing it takes 30 seconds:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: SSH server setup</h4>
        <ul>
          <li><code>sudo apt update && sudo apt install openssh-server -y</code></li>
          <li>SSH starts automatically and enables itself on boot</li>
          <li>
            Verify it&rsquo;s running: <code>sudo systemctl status ssh</code> → should show <code>active (running)</code>
          </li>
          <li>Find the LAN IP: <code>hostname -I</code> → note the 192.168.x.x address</li>
        </ul>

        <p>
          First SSH test from my Mac: <code>ssh username@[your-lan-ip]</code> — use the IP from <code>hostname -I</code>.
          It prompted for the password I set during install. Typed it. Got a shell prompt on the laptop. Done.
        </p>

        <h3>Phase 4: Static IP via the Router</h3>
        <p>
          Dynamic IPs change. If the router assigns a new IP to the laptop overnight, my SSH config
          breaks. The fix: tell the router to always give the laptop the same IP. This is called a
          DHCP reservation (or &quot;static IP&quot;) and every home router supports it.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: DHCP reservation (Google Wifi / Nest)</h4>
        <ul>
          <li>Open the Google Home app → Wifi → Devices</li>
          <li>Find the laptop (it shows up by hostname)</li>
          <li>Tap the device → Reserved IP → assign your chosen static IP</li>
          <li>Restart the laptop to pick up the reserved IP</li>
          <li>Verify: <code>hostname -I</code> should show the exact IP you reserved</li>
        </ul>

        <p>
          Now the IP never changes. Every SSH connection I make from my Mac goes to the same address,
          every time.
        </p>

        {/* ── Session 2 ── */}
        <h2>Session 2: SSH Config and Remote Access from Anywhere</h2>
        <p className="post-session-meta">Evening — ~1 hour</p>
        <p className="post-pace">
          <strong>Pace:</strong> Fast. SSH config is mostly just editing one file and copying a key.
        </p>

        <h3>SSH Key Authentication</h3>
        <p>
          Typing a password every time I SSH in gets old fast. SSH keys replace passwords with a
          cryptographic key pair — a private key that stays on my Mac, and a public key that lives
          on the server. Once set up, I connect with no password prompt at all.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: SSH key setup</h4>
        <ul>
          <li>Generate a key on the Mac (if you don&rsquo;t have one already): <code>ssh-keygen -t ed25519</code></li>
          <li>Copy the public key to the server: <code>ssh-copy-id username@[your-lan-ip]</code></li>
          <li>Test: <code>ssh username@[your-lan-ip]</code> — should log in without a password prompt</li>
        </ul>

        <h3>SSH Alias in ~/.ssh/config</h3>
        <p>
          Typing the full IP every time is fine but not ergonomic. A few-line config entry cuts it down to a single alias:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: ~/.ssh/config entry</h4>
        <ul>
          <li>Open <code>~/.ssh/config</code> on your Mac (create it if it doesn&rsquo;t exist)</li>
          <li>
            Add:
            <br /><code>Host homeserver</code>
            <br /><code>&nbsp;&nbsp;HostName [your-lan-ip]</code>
            <br /><code>&nbsp;&nbsp;User yourusername</code>
            <br /><code>&nbsp;&nbsp;IdentityFile ~/.ssh/id_ed25519</code>
          </li>
          <li>Now: <code>ssh homeserver</code> — one word, connects instantly</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">On the local network</span>
          <p>
            The SSH alias works instantly when you&rsquo;re on the same WiFi. From outside your home network
            (a coffee shop, traveling), you&rsquo;ll need either a VPN or port forwarding on your router.
            I handled this with port knocking — covered in the next post.
          </p>
        </div>

        <h3>Setting the Hostname</h3>
        <p>
          The default hostname after install was something generic. I changed it to something short
          and recognizable — easy to remember at a glance in terminal prompts:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Change hostname</h4>
        <ul>
          <li><code>sudo hostnamectl set-hostname your-hostname</code></li>
          <li>Edit <code>/etc/hosts</code> — replace the old hostname with your new one on the <code>127.0.1.1</code> line</li>
          <li>Reboot to apply everywhere</li>
        </ul>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>
        <p>
          A fully operational home Linux server that:
        </p>
        <ul>
          <li><strong>Runs 24/7</strong> — lid closed, never sleeps, always on the network</li>
          <li><strong>Has a fixed LAN IP</strong> — DHCP reserved, never changes</li>
          <li><strong>Accepts SSH connections</strong> — passwordless, key-based, one command from my Mac</li>
          <li><strong>Ready for automation</strong> — cron, systemd services, Python scripts, whatever I put on it</li>
        </ul>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal — Mac → Home Server</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim">$ ssh homeserver</span></div>
              <div><span className="post-terminal-success">Welcome to Linux Mint 22.1</span></div>
              <br />
              <div><span className="post-terminal-dim">user@homeserver:~$ uptime</span></div>
              <div><span className="post-terminal-success"> 07:14:23 up 12 days,  4:02,  1 user,  load average: 0.08, 0.06, 0.05</span></div>
              <br />
              <div><span className="post-terminal-dim">user@homeserver:~$ hostname -I</span></div>
              <div><span className="post-terminal-success">192.168.x.x</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            One command from the Mac. The server responds instantly — lid closed, in another room.
          </p>
        </div>

        <h3>What went fast</h3>
        <ul>
          <li><strong>Linux Mint install</strong> — genuinely beginner-friendly, wizard-based, no command line needed for the base install</li>
          <li><strong>SSH server</strong> — one apt install command, starts automatically, just works</li>
          <li><strong>DHCP reservation</strong> — 2 minutes in the Google Home app, no router config files to edit</li>
          <li><strong>SSH key setup</strong> — <code>ssh-keygen</code> + <code>ssh-copy-id</code>, two commands</li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Lid close behavior</strong> — <code>logind.conf</code> is the right fix, but the desktop power manager
            has a separate idle sleep setting that overrides it. Had to disable both before closing the lid confidently.
          </li>
          <li>
            <strong>BIOS boot order</strong> — every laptop is different. Mine uses F2 for BIOS; other machines use
            F12, Del, or Esc. If the USB doesn&rsquo;t boot, you&rsquo;re searching for the right key.
          </li>
          <li>
            <strong>First SSH connection</strong> — host key verification prompt looks alarming the first time
            (&quot;authenticity of host can&rsquo;t be established&quot;). It&rsquo;s normal. Type yes and move on.
          </li>
        </ul>

        <p>
          The hardware cost $0 (it was collecting dust). The OS cost $0. The total investment was an afternoon
          and a USB drive I already owned. The return is a machine that runs every script, job, and service
          I throw at it — indefinitely, without asking.
        </p>

        <p>
          Once it was running, the obvious next question was: how do I make it secure? Especially for
          SSH access from outside the home network. That&rsquo;s the next post.
        </p>
      <RelatedPosts slug="how-i-setup-headless-linux" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
