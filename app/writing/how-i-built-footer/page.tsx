import Link from "next/link";

export const metadata = {
  title: "How I Built a Universal Footer Using Claude Code — Jose and Goose",
  description: "Designing and deploying a production-ready footer component in under 30 minutes with terminal-based AI",
};

export default function HowIBuiltFooter() {
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
          <span>February 27, 2026</span>
          <span className="post-meta-dot">·</span>
          <span>5 min read</span>
        </div>

        {/* Title */}
        <h1 className="post-title">How I Built a Universal Footer Using Claude Code</h1>
        <p className="post-subtitle">
          Designing and deploying a production-ready footer component in under 30 minutes with terminal-based AI
        </p>

        {/* ── BODY ── */}
        <div className="post-body">
          <div className="post-recipe-meta">
            <div className="post-recipe-row">
              <span className="post-recipe-label">Yield</span>
              <span>One responsive footer deployed across all pages at joseandgoose.com</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Difficulty</span>
              <span>Beginner-friendly (pure design iteration, no debugging required)</span>
            </div>
            <div className="post-recipe-row">
              <span className="post-recipe-label">Total Cook Time</span>
              <span>~25–30 minutes in a single session</span>
            </div>
          </div>

          {/* ── INGREDIENTS ── */}
          <h2>Ingredients</h2>
          <ul>
            <li>
              <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
              — terminal-based AI that edits files directly in your project <em>($200/yr)</em>
            </li>
            <li>
              <strong><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a></strong>{" "}
              — hosting platform with automatic deployments <em>(free)</em>
            </li>
            <li>
              <strong><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></strong>{" "}
              — code repository, Vercel deploys from it <em>(free)</em>
            </li>
            <li>
              <strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong>{" "}
              — the React framework running the site <em>(free)</em>
            </li>
            <li>
              <strong>Terminal</strong> — where Claude Code runs and makes all the changes <em>(free)</em>
            </li>
            <li>
              <strong>Screenshots</strong> — inspiration from premium automotive and minimalist restaurant sites <em>(free)</em>
            </li>
          </ul>

          {/* ── THE PROBLEM ── */}
          <h2>The Problem: The Site Had No Footer</h2>
          <p>
            When I launched joseandgoose.com, I focused on the pages that mattered most —
            homepage, about, work, writing, contact. The footer was an afterthought. It didn&rsquo;t
            exist. Every page just ended at the bottom of its content: no navigation, no social
            links, no way to scroll back to the top or get in touch without hitting the browser&rsquo;s
            back button.
          </p>

          <p>
            Footers aren&rsquo;t glamorous, but they do real work. They give visitors somewhere to
            go when they reach the bottom of a page, surface social links without cluttering the nav,
            and make a site feel complete rather than abandoned. A site without a footer feels like
            a book that ends mid-sentence.
          </p>

          <p>
            This was also a chance to test something: how fast could{" "}
            <strong>Claude Code</strong> handle pure design iteration — no database, no API routes,
            just component design and CSS — compared to the heavier builds that came before it?
          </p>

          {/* ── THE DIFFERENCE ── */}
          <h2>Why Claude Code vs Claude.ai</h2>
          <p>
            I&rsquo;d built the entire site using <strong>Claude.ai</strong> in the browser — copy code,
            paste into <strong>VS Code</strong>, save, run <code>git push</code> in <strong>Terminal</strong>,
            repeat. That workflow worked, but it had friction:
          </p>

          <ul>
            <li>Every change required manual file switching between <strong>Claude.ai</strong> and <strong>VS Code</strong></li>
            <li>Claude couldn&rsquo;t see the full project structure, so it guessed file paths</li>
            <li>Design iteration meant downloading new versions and replacing entire files</li>
            <li>No way to automatically commit and push changes</li>
          </ul>

          <p>
            <strong>Claude Code</strong> runs directly in <strong>Terminal</strong> with full read/write
            access to your project. It can see your file tree, read your existing code, edit files in place,
            run commands, and commit changes to <strong>Git</strong> — all from one conversation.
          </p>

          <div className="post-tip">
            <span className="post-tip-label">Speed comparison</span>
            <p>
              Building the homepage with <strong>Claude.ai</strong> took ~3 hours (Session 1 in the first
              post). Building this footer with <strong>Claude Code</strong> took 25 minutes. Same designer,
              same site, same level of polish — 7x faster.
            </p>
          </div>

          {/* ── SESSION ── */}
          <h2>The Build: One 25-Minute Session</h2>
          <p className="post-session-meta">Evening, February 27 — ~25 minutes</p>
          <p className="post-pace">
            <strong>Pace:</strong> Relentless iteration. No file-switching friction, just pure design refinement.
          </p>

          <h3>Sharing the Vision</h3>
          <p>
            I started by dropping two screenshots into <strong>Claude Code</strong> — one from a premium
            automotive brand with a centered scroll-up button, one from a minimalist restaurant site with
            vertically stacked social icons. I described what I wanted:
          </p>

          <ul>
            <li>Dark green background (matching the site&rsquo;s existing <code>--forest</code> color variable)</li>
            <li>Scroll-up button at the top center</li>
            <li>Social icons (LinkedIn + Instagram) stacked vertically</li>
            <li>Right-aligned navigation menu without column headers</li>
            <li>Contact button in place of a newsletter signup</li>
            <li>Keep existing branding: &ldquo;Jose and Goose&rdquo;, copyright, &ldquo;Made with intention&rdquo;</li>
          </ul>

          <p>
            Claude read the existing CSS file to extract the exact colors already in use, then generated
            the full footer component and styles in one response — writing directly into the project
            files rather than producing code blocks to copy and paste manually.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Footer component generation</h4>

          <h3>First Iteration</h3>
          <p>
            The initial footer had all the elements, but the layout felt off. I sent feedback in plain language:
          </p>

          <ul>
            <li>&ldquo;Remove the lines between footer sections — I want one solid color&rdquo;</li>
            <li>&ldquo;Move the nav menu under &lsquo;Jose and Goose&rsquo; on the left&rdquo;</li>
            <li>&ldquo;Stack the Contact button above the social icons&rdquo;</li>
          </ul>

          <p>
            <strong>Claude Code</strong> updated both files instantly. Refresh the browser at{" "}
            <code>localhost:3000</code> — changes were live. No file hunting in <strong>VS Code</strong>.
            No copy-paste. Just conversational iteration.
          </p>

          <div className="post-tip">
            <span className="post-tip-label">Terminal advantage</span>
            <p>
              Because <strong>Claude Code</strong> runs in <strong>Terminal</strong>, it can read your
              existing CSS variables, match your color scheme, and update multiple files in parallel.
              In the browser version, I&rsquo;d have to manually tell it the hex code and track which
              files need updates.
            </p>
          </div>

          <h3>Design Refinement (5 Rounds)</h3>
          <p>
            Over the next 15 minutes, we iterated five more times. Each round was a screenshot of the
            live site in my browser + notes on what to adjust:
          </p>

          <ul>
            <li><strong>Round 2:</strong> &ldquo;Remove &lsquo;Jose and Goose&rsquo; header above the nav, move social icons to a horizontal row next to Contact, reduce all padding — I want it minimal and compact&rdquo;</li>
            <li><strong>Round 3:</strong> &ldquo;The nav menu, scroll-up button, and CTAs should all be on the same horizontal line, top-aligned&rdquo;</li>
            <li><strong>Round 4:</strong> &ldquo;Put scroll-up in the center, nav on the left, CTAs on the right — all aligned horizontally&rdquo;</li>
            <li><strong>Round 5:</strong> &ldquo;Remove the nav menu (duplicates the header), keep just scroll-up centered and CTAs on the right&rdquo;</li>
            <li><strong>Round 6:</strong> &ldquo;The copyright dot isn&rsquo;t aligned with the scroll-up arrow — use CSS Grid to center it perfectly for symmetry&rdquo;</li>
          </ul>

          <p>
            Every round: <strong>Claude Code</strong> edited the files → I refreshed <code>localhost:3000</code>{" "}
            → took a screenshot → sent feedback. No stopping to save in <strong>VS Code</strong>. No switching
            windows. No manual git commits between iterations.
          </p>

          <div className="post-visual">
            <div className="post-terminal">
              <div className="post-terminal-bar">
                <span className="post-terminal-dot post-terminal-dot--red"></span>
                <span className="post-terminal-dot post-terminal-dot--yellow"></span>
                <span className="post-terminal-dot post-terminal-dot--green"></span>
                <span className="post-terminal-bar-title">Claude Code — Terminal</span>
              </div>
              <div className="post-terminal-body">
                <div><span className="post-terminal-blue">Claude:</span> I&apos;ve updated the footer to use CSS Grid</div>
                <div className="post-terminal-dim">with three columns so the dot is perfectly centered.</div>
                <br />
                <div><span className="post-terminal-green">Files modified:</span></div>
                <div className="post-terminal-dim">  • app/Footer.tsx</div>
                <div className="post-terminal-dim">  • app/globals.css</div>
                <br />
                <div><span className="post-terminal-blue">Claude:</span> Refresh localhost:3000 to see the changes.</div>
              </div>
            </div>
            <p className="post-visual-caption">
              <strong>Claude Code</strong> edited files directly and told me exactly what changed — no file-switching required.
            </p>
          </div>

          <h3>Deployment</h3>
          <p>
            When the design was right, one instruction — &ldquo;push it to the live site&rdquo; — kicked
            off the full deployment. Claude handled every git step automatically: staging the changed
            files, writing the commit message, and pushing to GitHub, which triggered Vercel to deploy.
          </p>
          <h4 className="post-dev-heading">🔧 Developer section: Git deployment workflow</h4>
          <ul>
            <li>Ran <code>git status</code> and <code>git diff</code> to see all modified files</li>
            <li>Staged the changes with <code>git add</code></li>
            <li>Wrote a descriptive commit message following the repo&rsquo;s existing style</li>
            <li>Pushed to <strong>GitHub</strong> with <code>git push</code></li>
            <li><strong>Vercel</strong> detected the push and auto-deployed in ~60 seconds</li>
          </ul>

          <p>
            Footer live at <strong>joseandgoose.com</strong>. Total time from first prompt to production:
            25 minutes.
          </p>

          <div className="post-visual">
            <div className="post-terminal">
              <div className="post-terminal-bar">
                <span className="post-terminal-dot post-terminal-dot--red"></span>
                <span className="post-terminal-dot post-terminal-dot--yellow"></span>
                <span className="post-terminal-dot post-terminal-dot--green"></span>
                <span className="post-terminal-bar-title">Terminal — git push</span>
              </div>
              <div className="post-terminal-body">
                <div>
                  <span className="post-terminal-prompt">user@MacBook-Air</span>{" "}
                  joseandgoose-site-main % <span className="post-terminal-cmd">git push</span>
                </div>
                <div className="post-terminal-dim">To https://github.com/joseandgoose/starter.git</div>
                <div className="post-terminal-success">   dd73c2a..6ce6ed9  main → main</div>
                <br />
                <div><span className="post-terminal-blue">Claude:</span> Pushed to production! Vercel is now deploying</div>
                <div className="post-terminal-dim">your new footer to joseandgoose.com.</div>
              </div>
            </div>
            <p className="post-visual-caption">
              <strong>Claude Code</strong> ran the full git workflow in <strong>Terminal</strong> — no manual commands needed.
            </p>
          </div>

          {/* ── FINAL OUTPUT ── */}
          <h2>Final Output</h2>
          <p>
            A production-ready universal footer component deployed across all pages at{" "}
            <strong>joseandgoose.com</strong> with dark green branding, centered scroll-up button,
            social media links (LinkedIn + Instagram), contact CTA, perfectly aligned copyright line
            with CSS Grid symmetry, full mobile responsiveness, and automatic git deployment — built
            in 25 minutes by someone working entirely in <strong>Terminal</strong> with no file-switching,
            guided by <strong>Claude Code</strong>.
          </p>

          <h3>What went fast</h3>
          <ul>
            <li>
              <strong>Design iteration</strong> (6 rounds of feedback in 15 minutes — no copy-paste friction,
              just screenshot → feedback → refresh)
            </li>
            <li>
              <strong>File coordination</strong> (<strong>Claude Code</strong> updated <code>Footer.tsx</code>,{" "}
              <code>globals.css</code>, <code>layout.tsx</code>, and removed old footers from 7 page files
              in parallel)
            </li>
            <li>
              <strong>Git deployment</strong> (one command: &ldquo;push it to the live site&rdquo; — <strong>Claude Code</strong>{" "}
              handled staging, commit message, and push)
            </li>
            <li>
              <strong>Color matching</strong> (<strong>Claude Code</strong> read <code>globals.css</code> to
              extract the exact <code>--forest</code> variable instead of guessing)
            </li>
          </ul>

          <h3>What was different from browser Claude</h3>
          <ul>
            <li>
              <strong>No manual file editing</strong> (browser workflow: download from Claude → open VS Code →
              paste → save → repeat; terminal workflow: Claude edits directly)
            </li>
            <li>
              <strong>No path guessing</strong> (<strong>Claude Code</strong> sees your full file tree, so it
              knows exactly where to create <code>app/Footer.tsx</code>)
            </li>
            <li>
              <strong>No git commands</strong> (browser workflow: manually run <code>git add</code>,{" "}
              <code>git commit</code>, <code>git push</code> in <strong>Terminal</strong>; terminal workflow:
              say &ldquo;push it&rdquo; and Claude does it)
            </li>
            <li>
              <strong>Faster feedback loops</strong> (6 design iterations in 15 minutes vs the 3-hour homepage
              build — same quality, 12x faster iteration)
            </li>
          </ul>

          <p>
            The biggest lesson? The same AI that built the entire site in the browser can work 7x faster when
            it runs in your terminal with direct file access. The design thinking is identical. The iteration
            speed is not. And the copyright dot is finally, perfectly, symmetrically aligned with the scroll-up
            arrow.
          </p>
        </div>

        {/* Back link bottom */}
        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </article>
    </>
  );
}
