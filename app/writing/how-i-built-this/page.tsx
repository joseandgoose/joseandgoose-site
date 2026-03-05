import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";

export const metadata = {
  title: "How I Built JoseAndGoose.com Using Claude — Jose and Goose",
  description: "A non-developer builds a custom personal website from scratch using Claude AI in three sessions across two days",
};

export default function HowIBuiltThis() {
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
          <span>February 17, 2026</span>
          <span className="post-meta-dot">·</span>
          <span>6 min read</span>
        </div>

        {/* Title */}
        <h1 className="post-title">How I Built JoseAndGoose.com Using Claude</h1>
        <p className="post-subtitle">A non-developer builds a website from scratch with AI in three sessions</p>

        {/* ── BODY ── */}
        <div className="post-body">

          <div className="post-recipe-meta">
            <div className="post-recipe-row">
              <span className="post-recipe-label">Yield</span>
              <span>One fully deployed personal website</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Difficulty</span>
              <span>Beginner-friendly (no prior coding experience required)</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Total Cook Time</span>
              <span>~6–7 hours across 3 sessions over 2 days</span>
            </div>
          </div>
          <TLDRBadge slug="how-i-built-this" />

          {/* ── INGREDIENTS ── */}
          <h2>Ingredients</h2>
            <ul>
              <li><strong><a href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude.ai</a></strong> — your AI sous chef and pair programmer <em>($200/yr)</em></li>
              <li><strong><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a></strong> — hosting platform and auto-deploy pipeline <em>(free)</em></li>
              <li><strong><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></strong> — code repository, Vercel creates this for you <em>(free)</em></li>
              <li><strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong> — the React framework running the site <em>(free)</em></li>
              <li><strong><a href="https://code.visualstudio.com" target="_blank" rel="noopener noreferrer">VS Code</a></strong> — code editor for making changes locally <em>(free)</em></li>
              <li><strong><a href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Node.js / npm</a></strong> — runs your dev server and manages packages <em>(free)</em></li>
              <li><strong>Terminal</strong> — where you type commands to navigate, install, and deploy <em>(free)</em></li>
              <li><strong><a href="https://www.squarespace.com" target="_blank" rel="noopener noreferrer">Squarespace</a></strong> — domain registrar, where joseandgoose.com was purchased <em>($54 for 3 years)</em></li>
              <li><strong><a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare</a></strong> — DNS management and security layer <em>(free)</em></li>
              <li><strong><a href="https://docs.google.com/forms" target="_blank" rel="noopener noreferrer">Google Forms</a> + <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer">Google Sheets</a></strong> — contact form backend and submission alerts <em>(free)</em></li>
              <li><strong><a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">Google Analytics</a></strong> — visitor tracking and traffic sources <em>(free)</em></li>
              <li><strong><a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer">Vercel Analytics</a></strong> — lightweight complementary analytics <em>(free)</em></li>
            </ul>
          {/* ── THE PROBLEM ── */}
          <h2>What I Was Trying to Solve</h2>
          <p>
            I wanted a personal website that felt like mine — not a Squarespace template that any
            freelancer or small business could spin up in an afternoon. The tools that make
            website-building &ldquo;easy&rdquo; do so by giving you boxes to fill in: here&rsquo;s
            your header, here&rsquo;s your bio, here&rsquo;s your contact form. The output is
            functional but generic. I wanted custom typography, a specific color palette, a layout
            I&rsquo;d designed myself, and writing that lived alongside it in a way that felt
            intentional.
          </p>

          <p>
            The problem: I don&rsquo;t know how to code. And hiring someone to build a custom site
            runs $5,000–$20,000 for anything that doesn&rsquo;t look like a template.
          </p>

          <p>
            What changed: AI can now write code. Not just snippets — full working websites, with
            mobile responsiveness, deployment configuration, and bug fixes. The question wasn&rsquo;t
            &ldquo;can I build a custom site?&rdquo; anymore. It was: how long does it actually take
            someone with zero coding experience to build one with AI?
          </p>

          {/* ── SESSION 1 ── */}
          <h2>Session 1: From Zero to a Styled Homepage</h2>
          <p className="post-session-meta">Evening, Day 1 — ~3 hours</p>
          <p className="post-pace"><strong>Pace:</strong> Moderate. Some friction getting the local environment running, but satisfying progress.</p>

          <p>
            Before any design work could start, the computer needed the right tools in place: a code
            editor to make changes, a command-line window called Terminal to run instructions, and a
            local preview so I could see the site before pushing it live. The first hour was entirely
            setup — installing software, connecting accounts, and getting a blank starter site running
            in the browser.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Environment setup</h4>
          <ul>
            <li>Clicked &ldquo;Create&rdquo; on <strong>Vercel</strong> to deploy a blank Next.js starter — live URL in minutes, auto-connected to a new <strong>GitHub</strong> repo</li>
            <li>Cloned the repo to my Desktop using <strong>Terminal</strong>, opened the project in <strong>VS Code</strong></li>
            <li>Ran <code>npm run dev</code> in <strong>Terminal</strong> and got &ldquo;next: command not found&rdquo; — fixed by running <code>npm install</code> in <strong>Terminal</strong> first (installs all <strong>Node.js/npm</strong> dependencies)</li>
            <li>Hit a lock file error on restart — solved by closing and reopening <strong>Terminal</strong></li>
            <li>Got the local dev server running at <code>localhost:3000</code> in the <strong>browser</strong> showing the default Next.js template</li>
          </ul>

          <p>
            With the environment ready, I described the look I wanted to <strong>Claude</strong> and
            shared reference screenshots from sites I admired. Claude generated complete code files for
            the layout, typography, and color palette — I moved them into the project folder and the
            design appeared in my browser.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Design generation with Claude</h4>
          <ul>
            <li>Described the look I wanted (Getty nav, n/naka typography, Apple tiles) in <strong>Claude.ai</strong> — it produced full <code>page.tsx</code>, <code>globals.css</code>, and <code>layout.tsx</code> files</li>
            <li>Downloaded the three files from <strong>Claude.ai</strong> and copied them into the <code>app/</code> folder using <strong>Terminal</strong></li>
            <li>First paste in <strong>VS Code</strong> landed empty — re-copied via <strong>Terminal</strong> <code>cat</code> command and the site rendered at <code>localhost:3000</code></li>
          </ul>

          {/* Terminal visual placeholder */}
          <div className="post-visual">
            <div className="post-terminal">
              <div className="post-terminal-bar">
                <span className="post-terminal-dot post-terminal-dot--red"></span>
                <span className="post-terminal-dot post-terminal-dot--yellow"></span>
                <span className="post-terminal-dot post-terminal-dot--green"></span>
                <span className="post-terminal-bar-title">Terminal — zsh</span>
              </div>
              <div className="post-terminal-body">
                <div><span className="post-terminal-prompt">user@MacBook-Air</span> joseandgoose-site-main % <span className="post-terminal-cmd">npm run dev</span></div>
                <div className="post-terminal-dim">&gt; nextjs@0.1.0 dev</div>
                <div className="post-terminal-dim">&gt; next dev</div>
                <div className="post-terminal-error">sh: next: command not found</div>
                <br />
                <div><span className="post-terminal-prompt">user@MacBook-Air</span> joseandgoose-site-main % <span className="post-terminal-cmd">npm install</span></div>
                <div className="post-terminal-dim">added 237 packages in 42s</div>
                <br />
                <div><span className="post-terminal-prompt">user@MacBook-Air</span> joseandgoose-site-main % <span className="post-terminal-cmd">npm run dev</span></div>
                <div><span className="post-terminal-blue">▲ Next.js 16.1.6</span> <span className="post-terminal-dim">(Turbopack)</span></div>
                <div>- Local:{'         '}<span className="post-terminal-green">http://localhost:3000</span></div>
                <div className="post-terminal-success">✓ Ready in 992ms</div>
              </div>
            </div>
            <p className="post-visual-caption">The classic first error — forgetting to run <code>npm install</code> before starting the dev server. Fixed in one command.</p>
          </div>

          <div className="post-tip">
            <span className="post-tip-label">AI tip</span>
            <p>Don&rsquo;t panic when <strong>Terminal</strong> gives you an error. Close it, reopen it, and try again. Half the issues in this phase were solved by restarting.</p>
          </div>

          {/* ── SESSION 2 ── */}
          <h2>Session 2: Building Out the Pages</h2>
          <p className="post-session-meta">Day 2 — ~2–3 hours</p>
          <p className="post-pace"><strong>Pace:</strong> Fast. This was the most productive stretch.</p>

          <p>
            Day 2 was about making the site feel real — replacing placeholder images with actual photos
            and building the About, Work, and Contact pages. For each page, I described what I wanted
            to Claude in plain English and received a complete, styled page back. Each one deployed live
            in about 30 seconds.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Building inner pages and adding photos</h4>
          <ul>
            <li>Dragged 5 photos (hero + 4 tiles) into the <code>/public</code> folder using <strong>Finder</strong>, deleted the default SVGs that came with the <strong>Next.js</strong> starter</li>
            <li>Asked <strong>Claude.ai</strong> to generate the About page (<code>app/about/page.tsx</code>) — bios for me and Goose, styled to match the homepage</li>
            <li>Asked <strong>Claude.ai</strong> for a Work page (<code>app/work/page.tsx</code>) — press articles grouped by company (Pet Space, DoorDash, Instacart, Goldman Sachs, Teach for America)</li>
            <li>Built a Contact page (<code>app/contact/page.tsx</code>) by creating a form in <strong>Google Forms</strong>, copying the embed <code>&lt;iframe&gt;</code>, and having <strong>Claude.ai</strong> wrap it in a styled layout</li>
            <li>Set up email alerts for new submissions directly in <strong>Google Forms</strong> — no code needed</li>
            <li>Deployed each page with <code>git add . &amp;&amp; git commit &amp;&amp; git push</code> in <strong>Terminal</strong> — auto-deployed via <strong>GitHub → Vercel</strong> in ~30 seconds</li>
          </ul>

          <p>
            Pointing joseandgoose.com at the new site required updating settings across three services
            so they all agreed on where to send visitors. Then came the first look on an actual phone —
            the desktop layout hadn&rsquo;t translated, so several rounds of adjustments followed until
            both versions matched.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Custom domain and mobile QA</h4>
          <ul>
            <li>In the <strong>Vercel</strong> dashboard, added <code>joseandgoose.com</code> under Settings → Domains</li>
            <li>In <strong>Squarespace</strong> DNS settings, added an A record pointing to Vercel&rsquo;s IP (<code>76.76.21.21</code>) — waited ~10 minutes for DNS propagation</li>
            <li>Tested on my phone and the mobile layout was broken — hero text cut off, image clipped, tiles in a 2-column grid that didn&rsquo;t fit</li>
            <li>Took 4–5 rounds of CSS fixes in <strong>VS Code</strong>: flipped image/text order in the hero, adjusted padding, made the jump bar horizontally scrollable, switched the press grid to single-column</li>
            <li>Each fix: save in <strong>VS Code</strong> → push via <strong>Terminal</strong> → live on <strong>Vercel</strong> in ~30 seconds → check on phone</li>
          </ul>

          {/* Mobile QA visual */}
          <div className="post-visual">
            <div className="post-mobile-comparison">
              <div className="post-mobile-phone">
                <div className="post-mobile-label post-mobile-label--bad">✗ Before QA</div>
                <div className="post-mobile-screen">
                  <div className="post-mobile-hero-broken">
                    <div className="post-mobile-hero-broken-text">
                      <span className="post-mobile-eyebrow">Design &amp; Product</span>
                      <span className="post-mobile-hero-title">Celebrating the <em>fleeting beauty</em> of things ma...</span>
                    </div>
                    <div className="post-mobile-hero-broken-img">[clipped]</div>
                  </div>
                  <div className="post-mobile-tiles-broken">
                    <div className="post-mobile-tile-sm">Work</div>
                    <div className="post-mobile-tile-sm">Writing</div>
                    <div className="post-mobile-tile-sm">About</div>
                    <div className="post-mobile-tile-sm">Contact</div>
                  </div>
                </div>
              </div>
              <div className="post-mobile-phone">
                <div className="post-mobile-label post-mobile-label--good">✓ After 5 Rounds</div>
                <div className="post-mobile-screen">
                  <div className="post-mobile-hero-fixed-img">[hero image — full width]</div>
                  <div className="post-mobile-hero-fixed-text">
                    <span className="post-mobile-eyebrow">Design &amp; Product</span>
                    <span className="post-mobile-hero-title">Celebrating the <em>fleeting beauty</em> of things made well.</span>
                  </div>
                  <div className="post-mobile-tiles-fixed">
                    <div className="post-mobile-tile-lg">Work</div>
                    <div className="post-mobile-tile-lg">Writing</div>
                    <div className="post-mobile-tile-lg">About</div>
                    <div className="post-mobile-tile-lg">Contact</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="post-visual-caption">Mobile QA took 4–5 rounds of CSS fixes in <strong>VS Code</strong> — flipping image order, switching to single-column grid, fixing margins. Each push via <strong>Terminal → GitHub → Vercel</strong> deployed in ~30 seconds.</p>
          </div>

          <div className="post-tip">
            <span className="post-tip-label">AI tip</span>
            <p>Budget extra time for mobile QA. Desktop looked great on the first pass in the <strong>browser</strong>. Mobile needed 4–5 rounds of CSS changes in <strong>VS Code</strong>, each deployed through <strong>Terminal → GitHub → Vercel</strong> and checked on my actual phone.</p>
          </div>

          {/* ── SESSION 3 ── */}
          <h2>Session 3: Analytics and Security</h2>
          <p className="post-session-meta">Day 2 — ~45 minutes</p>
          <p className="post-pace"><strong>Pace:</strong> Quick. Mostly configuration across dashboards, not code.</p>

          <p>
            With the site live, the last session added two layers: visitor analytics to see who&rsquo;s
            reading what, and Cloudflare to act as a security filter between visitors and the site.
            Analytics was a single package install; Cloudflare was mostly configuration across dashboards.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Analytics setup</h4>
          <ul>
            <li>Ran <code>npm install @next/third-parties</code> in <strong>Terminal</strong> to add the Google Analytics package to the <strong>Next.js</strong> project</li>
            <li>In <strong>VS Code</strong>, added a <code>&lt;GoogleAnalytics&gt;</code> component to <code>app/layout.tsx</code> with my measurement ID hardcoded</li>
            <li>Pushed the change via <strong>Terminal → GitHub → Vercel</strong> to deploy</li>
            <li>Verified tracking was working in the <strong>Google Analytics</strong> dashboard → Reports → Realtime — saw myself as an active user within 30 seconds</li>
            <li>Enabled <strong>Vercel Analytics</strong> from the Vercel project dashboard (Settings → Analytics toggle) as a complementary layer</li>
          </ul>

          <p>
            Cloudflare acts as an intermediary between visitors and the site — filtering traffic and
            enforcing HTTPS. The setup was routine until one misconfigured setting pointed the domain
            at the wrong server, taking the site offline on mobile until a single IP address was corrected.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Cloudflare DNS configuration</h4>
          <ul>
            <li>Created a free account on <strong>Cloudflare</strong>, added <code>joseandgoose.com</code>, selected the free plan</li>
            <li><strong>Cloudflare</strong> scanned existing DNS records and provided two nameservers</li>
            <li>In <strong>Squarespace</strong> domain settings, switched nameservers from Squarespace&rsquo;s defaults to <strong>Cloudflare&rsquo;s</strong> custom nameservers</li>
            <li>Site went down on mobile with <code>ERR_QUIC_PROTOCOL_ERROR</code> — the A record in <strong>Cloudflare</strong> still pointed to <strong>Squarespace&rsquo;s</strong> old IP (<code>216.198.79.1</code>) instead of <strong>Vercel&rsquo;s</strong> (<code>76.76.21.21</code>), and the proxy was set to &ldquo;Proxied&rdquo; (orange cloud) which conflicted with <strong>Vercel&rsquo;s</strong> CDN</li>
            <li>Fix in <strong>Cloudflare</strong> DNS dashboard: updated the A record IP to <code>76.76.21.21</code> and switched both records to &ldquo;DNS only&rdquo; (grey cloud)</li>
          </ul>

          {/* Cloudflare error visual */}
          <div className="post-visual">
            <div className="post-dns-diagram">
              <div className="post-dns-title">Cloudflare DNS — The Fix</div>
              <div className="post-dns-row">
                <span className="post-dns-badge post-dns-badge--bad">BEFORE</span>
                <span className="post-dns-type">A</span>
                <span>joseandgoose.com →</span>
                <code className="post-dns-ip--bad">216.198.79.1</code>
                <span className="post-dns-proxy post-dns-proxy--orange">Proxied ☁</span>
                <span className="post-dns-status--bad">✗</span>
              </div>
              <div className="post-dns-row">
                <span className="post-dns-badge post-dns-badge--good">AFTER</span>
                <span className="post-dns-type">A</span>
                <span>joseandgoose.com →</span>
                <code className="post-dns-ip--good">76.76.21.21</code>
                <span className="post-dns-proxy post-dns-proxy--grey">DNS only ☁</span>
                <span className="post-dns-status--good">✓</span>
              </div>
              <p className="post-dns-explain"><strong>Root cause:</strong> Cloudflare&rsquo;s CDN proxy conflicted with Vercel&rsquo;s CDN. Two CDNs fighting over the same traffic caused <code>ERR_QUIC_PROTOCOL_ERROR</code> on mobile. <strong>Fix:</strong> Updated IP to Vercel&rsquo;s and switched to DNS-only mode.</p>
            </div>
            <p className="post-visual-caption">The Squarespace IP was still in <strong>Cloudflare DNS</strong> after the migration. Changed to Vercel&rsquo;s IP and toggled proxy off — site worked immediately on mobile.</p>
          </div>

          <div className="post-tip">
            <span className="post-tip-label">AI tip</span>
            <p>If you&rsquo;re using both <strong>Cloudflare</strong> and <strong>Vercel</strong>, set your DNS records to &ldquo;DNS only&rdquo; in the <strong>Cloudflare</strong> dashboard. Two CDNs fighting each other will break your site on mobile.</p>
          </div>

          {/* ── FINAL OUTPUT ── */}
          <h2>Final Output</h2>
          <p>A fully deployed personal website at joseandgoose.com with a custom domain, responsive design across desktop and mobile, four content pages, a working contact form with email alerts, visitor analytics, and a security layer — built in about 6–7 hours by someone with no prior web development experience, guided entirely by Claude.</p>

          <h3>What went fast</h3>
          <ul>
            <li><strong>Vercel</strong> deployment (one click to go live)</li>
            <li>Building inner pages with <strong>Claude.ai</strong> (About, Work, Contact — generated in minutes)</li>
            <li>Adding <strong>Google Analytics</strong> (one <code>npm install</code> in <strong>Terminal</strong> + one component in <strong>VS Code</strong>)</li>
          </ul>

          <h3>What needed patience</h3>
          <ul>
            <li>Local environment setup in <strong>Terminal</strong> (npm install, lock files, missing commands)</li>
            <li>Mobile CSS QA in <strong>VS Code</strong> (4–5 rounds of fixes per page)</li>
            <li>DNS configuration across <strong>Squarespace → Cloudflare → Vercel</strong> (three dashboards, one IP conflict)</li>
          </ul>

          <p>The biggest lesson? Shipping a website isn&rsquo;t one skill — it&rsquo;s a dozen small ones strung together. Claude handled the code. I handled the decisions. And Goose supervised from the couch.</p>
        </div>

        {/* Back link bottom */}
        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </article>
    </>
  );
}
