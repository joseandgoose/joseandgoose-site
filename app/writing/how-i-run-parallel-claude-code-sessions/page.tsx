import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Run Multiple Claude Code Sessions in Parallel — Jose and Goose",
  description: "Running several Claude Code sessions at once with git worktrees and a small shell tool called cmux — one agent per branch, no file conflicts, on both my Mac and my home Linux server, all on one Max subscription",
};

export default function HowIRunParallelClaudeCodeSessions() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>June 26, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>
      <PostTags slug="how-i-run-parallel-claude-code-sessions" />

      <h1 className="post-title">How I Run Multiple Claude Code Sessions in Parallel</h1>
      <p className="post-subtitle">
        Running several Claude Code agents at the same time without them stepping on each other — using git worktrees and a small shell tool called cmux, one agent per branch, on both my Mac and my always-on home Linux server, all on a single Max subscription
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>Several Claude Code sessions running at once in the same repo — each on its own branch, in its own working copy, with zero file conflicts — plus one-word commands to create, resume, merge, and tear them down</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Beginner-to-intermediate (git worktrees, a shell function, terminal tabs — no code to write, mostly setup and workflow)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~1 hour to install and wire up on both machines, plus a week of using it to figure out when it actually helps and when it just gets in the way</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-run-parallel-claude-code-sessions" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Claude Code</strong>{" "}
            — the terminal AI I use for everything on this site and my server projects <em>(Max subscription)</em>
          </li>
          <li>
            <strong>Git worktrees</strong>{" "}
            — a built-in git feature that lets one repo have several working copies at once, each on its own branch <em>(free, already in git)</em>
          </li>
          <li>
            <strong><a href="https://github.com/craigsc/cmux" target="_blank" rel="noopener noreferrer">cmux</a></strong>{" "}
            — a small open-source shell tool that manages the whole worktree lifecycle with one-word commands <em>(free)</em>
          </li>
          <li>
            <strong>A terminal with tabs or splits</strong>{" "}
            — iTerm2 on my Mac, plain terminal tabs on the Linux box — so I can watch several sessions side by side <em>(free)</em>
          </li>
          <li>
            <strong>My always-on home Linux server</strong>{" "}
            — the same headless machine from the earlier posts, so long-running agents keep going after I close my laptop <em>(already set up)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: One Agent at a Time Is Slow</h2>
        <p>
          Claude Code runs in a terminal. You open it in a folder, you talk to it, it edits files.
          That&rsquo;s the whole thing, and it&rsquo;s great — until you notice that most of the time
          <em> you&rsquo;re</em> the bottleneck, not the AI. The agent goes off to write a feature, and
          you sit there watching it work. You can&rsquo;t start the next thing, because if you open a
          second Claude Code session in the same folder, both agents edit the same files and you get a
          tangle: one overwrites the other&rsquo;s work, tests fail for reasons that have nothing to do
          with the code, and you can&rsquo;t tell which session broke what.
        </p>

        <p>
          I kept hitting this. I&rsquo;d have a small bug fix, a new blog post, and a refactor all
          queued up — three independent jobs, no reason they couldn&rsquo;t happen at the same time —
          and I&rsquo;d do them one after another because running them together was a mess.
        </p>

        <p>
          The fix turned out to be a git feature I&rsquo;d never used, plus a tiny tool that makes it
          painless.
        </p>

        {/* ── The Idea ── */}
        <h2>The Idea: One Working Copy Per Agent</h2>

        <figure className="post-visual">
          <div style={{ overflowX: "auto" }}>
            <svg viewBox="0 0 720 320" role="img" aria-label="One git repository fans out into three git worktrees, each on its own branch with its own Claude agent running in parallel; cmux merges each finished branch back into the main repo." style={{ width: "100%", maxWidth: 720, height: "auto", display: "block", margin: "0 auto", fontFamily: "var(--sans)" }}>
              <defs>
                <marker id="cmux-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#31583f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              <rect x="18" y="132" width="140" height="60" rx="10" fill="#264635" />
              <text x="88" y="158" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">one git repo</text>
              <text x="88" y="177" textAnchor="middle" fill="#cddbd2" fontSize="11.5">main branch</text>
              <text x="196" y="120" textAnchor="middle" fill="#7a8a80" fontSize="11">cmux new</text>
              <line x1="158" y1="150" x2="286" y2="66" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <rect x="288" y="34" width="204" height="60" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="390" y="60" textAnchor="middle" fill="#264635" fontSize="13" fontWeight="600">worktree · fix-footer</text>
              <text x="390" y="79" textAnchor="middle" fill="#5b6b62" fontSize="11.5">Claude agent</text>
              <line x1="158" y1="162" x2="286" y2="162" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <rect x="288" y="132" width="204" height="60" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="390" y="158" textAnchor="middle" fill="#264635" fontSize="13" fontWeight="600">worktree · new-post</text>
              <text x="390" y="177" textAnchor="middle" fill="#5b6b62" fontSize="11.5">Claude agent</text>
              <line x1="158" y1="174" x2="286" y2="258" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <rect x="288" y="230" width="204" height="60" rx="10" fill="#f9f8f6" stroke="#264635" strokeWidth="1.8" />
              <text x="390" y="256" textAnchor="middle" fill="#264635" fontSize="13" fontWeight="600">worktree · refactor-search</text>
              <text x="390" y="275" textAnchor="middle" fill="#5b6b62" fontSize="11.5">Claude agent</text>
              <line x1="492" y1="64" x2="560" y2="150" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <line x1="492" y1="162" x2="560" y2="162" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <line x1="492" y1="260" x2="560" y2="174" stroke="#31583f" strokeWidth="1.8" markerEnd="url(#cmux-arrow)" />
              <rect x="562" y="132" width="140" height="60" rx="10" fill="#F3D104" stroke="#264635" strokeWidth="1.8" />
              <text x="632" y="158" textAnchor="middle" fill="#264635" fontSize="13.5" fontWeight="700">cmux merge</text>
              <text x="632" y="177" textAnchor="middle" fill="#4a3d05" fontSize="11.5">back into main</text>
            </svg>
          </div>
          <figcaption className="post-visual-caption">
            cmux gives each Claude agent its own <strong>git worktree</strong> — a separate working copy on its own branch — so several run at once without touching each other&rsquo;s files. When one finishes, <strong>cmux merge</strong> folds its branch back into the main repo.
          </figcaption>
        </figure>
        <p>
          The reason two agents collide is that they share one set of files. So don&rsquo;t share the
          files. Give each agent its own copy.
        </p>

        <p>
          That&rsquo;s exactly what a{" "}
          <strong>git worktree</strong> is — a second working copy of the same repo, checked out on its
          own branch, in its own folder, but still connected to the same underlying project history. You
          can have five of them. Each one is isolated: edits in one don&rsquo;t touch the others. When a
          branch is done, you merge it back into the main copy like any normal branch.
        </p>

        <p>
          So the mental model becomes: one worktree per agent, one branch per task. Agent A works in
          <code>.worktrees/fix-footer</code> on a branch called <code>fix-footer</code>. Agent B works in
          <code>.worktrees/new-post</code> on <code>new-post</code>. They never see each other&rsquo;s
          files. When each finishes, I merge its branch and delete the worktree.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Worktrees are not copies you have to sync</span>
          <p>
            The thing that made this click for me: a worktree isn&rsquo;t a duplicate folder you have to
            keep in sync by hand. It&rsquo;s the same repo, viewed on a different branch, in a different
            place on disk. Git handles the plumbing. You just get an isolated sandbox per task, for free,
            already built into a tool I use every day.
          </p>
        </div>

        {/* ── cmux ── */}
        <h2>The Tool: cmux (tmux for Claude Code)</h2>
        <p>
          Worktrees are powerful but fiddly. The raw git commands are long, you have to invent a folder
          layout, remember which branch lives where, and manually launch Claude in each one. I didn&rsquo;t
          want to type <code>git worktree add ../whatever -b whatever</code> ten times a day.
        </p>

        <p>
          So I set up{" "}
          <a href="https://github.com/craigsc/cmux" target="_blank" rel="noopener noreferrer">cmux</a>{" "}
          — a small open-source shell tool (its tagline is &ldquo;tmux for Claude Code&rdquo;) that wraps
          the whole worktree lifecycle in one-word commands. It&rsquo;s not a program you install into a
          folder — it&rsquo;s a shell function you load in your terminal config. On my Mac that&rsquo;s a
          line in <code>~/.zshrc</code>; on the Linux server it&rsquo;s a line in <code>~/.bashrc</code>.
          Because it&rsquo;s just a function, <code>which cmux</code> shows nothing — you check it with
          <code>type cmux</code> instead. That surprised me the first time.
        </p>

        <p>
          cmux was{" "}
          <a href="https://www.reddit.com/r/ClaudeCode/comments/1r43cdr/introducing_cmux_tmux_for_claude_code/" target="_blank" rel="noopener noreferrer">introduced on r/ClaudeCode</a>, and that thread is a good window into how other people are wiring it into their Claude Code workflow — worth a skim to see the range of setups before you commit to one.
        </p>

        <p>
          The important part for cost: cmux makes <em>zero</em> AI calls of its own. Every session it
          launches is a normal Claude Code session running on my Max subscription. There&rsquo;s no
          separate API key, no per-token billing stacked on top — running four agents at once costs the
          same subscription as running one.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: the commands I actually use</h4>
        <ul>
          <li><code>cmux new &lt;branch&gt;</code> — creates a new worktree and branch, runs a setup hook, and launches Claude Code inside it. This is 90% of my usage.</li>
          <li><code>cmux start &lt;branch&gt;</code> — reopens an existing worktree and resumes the conversation with <code>claude --continue</code>, so the agent still remembers where it was</li>
          <li><code>cmux ls</code> — lists all the worktrees so I can see what&rsquo;s in flight</li>
          <li><code>cmux cd [branch]</code> — jumps into a worktree folder (or back to the repo root with no argument)</li>
          <li><code>cmux merge [branch]</code> — merges a finished worktree&rsquo;s branch back into the main checkout (with an optional <code>--squash</code> to collapse it into one commit)</li>
          <li><code>cmux rm [branch]</code> — removes the worktree and deletes its branch when I&rsquo;m done (<code>--all</code> nukes every worktree, but makes you type a confirmation phrase first)</li>
        </ul>

        <p>
          A typical morning looks like: <code>cmux new fix-footer</code> in one terminal tab,
          <code>cmux new new-post</code> in a second, <code>cmux new refactor-search</code> in a third.
          Three Claude Code agents, three isolated working copies, all going at once. I glance between
          tabs, answer whichever one has a question, and let the others run.
        </p>

        {/* ── The name is a little misleading ── */}
        <h2>What the Name Gets Wrong (and Why It Still Works)</h2>
        <p>
          The name &ldquo;tmux for Claude Code&rdquo; had me expecting it to split my screen for me. It
          doesn&rsquo;t. Under the hood, <code>cmux new</code> just creates the worktree and then runs
          <code>claude</code> in the terminal you&rsquo;re already in — one session, front and center. The
          &ldquo;parallel&rdquo; part is on me: I open the sessions in separate terminal tabs (or iTerm2
          splits on the Mac). cmux manages the <em>worktrees</em>; my terminal manages the <em>windows</em>.
        </p>

        <p>
          Once I understood that split, it stopped being confusing. cmux&rsquo;s job is to make sure each
          agent has a clean, isolated place to work and a one-word way to get in and out. Arranging the
          panes is a terminal problem, and my terminal already solves it.
        </p>

        {/* ── The setup hook ── */}
        <h2>The Setup Hook: Making a Fresh Worktree Actually Runnable</h2>
        <p>
          Here&rsquo;s the catch nobody warns you about. A brand-new worktree is a clean checkout — which
          means it&rsquo;s missing all the stuff that isn&rsquo;t committed to git. My <code>.env.local</code>
          file with API keys? Gitignored, so it&rsquo;s not there. My <code>node_modules</code> folder with
          all the installed packages? Not there either. So the agent starts up, tries to run the site, and
          immediately fails because it has no secrets and no dependencies.
        </p>

        <p>
          cmux solves this with a <strong>setup hook</strong> — a little script at <code>.cmux/setup</code>
          that runs automatically every time a new worktree is created, from inside that new worktree. Mine
          does two things: symlinks the gitignored secrets from the main copy, and installs dependencies.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: what my setup hook does</h4>
        <ul>
          <li>Finds the main repo root from inside the worktree (<code>git rev-parse --git-common-dir</code>, then take its parent)</li>
          <li>Symlinks <code>.env.local</code> from the main copy — a symlink is a pointer to the real file, so the worktree shares the same secrets without ever copying them into a new place</li>
          <li>Runs the package install so <code>node_modules</code> exists and the site can actually build</li>
          <li>Commit <code>.cmux/setup</code> to the repo — then every future worktree gets it automatically, on both machines</li>
        </ul>

        <p>
          There&rsquo;s even a <code>cmux init</code> command that asks Claude to <em>generate</em> that
          setup script by reading your repo and guessing what it needs — which secrets to symlink, which
          package manager to use. It shows you the script, lets you edit or regenerate it, and only saves
          when you accept. I tweaked what it produced, but it got the shape right on the first try.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The symlink detail matters</span>
          <p>
            Symlinking secrets instead of copying them means there&rsquo;s still exactly one real
            <code>.env.local</code> on disk, in the main repo. Rotate a key once and every worktree sees
            the new value. If cmux had copied the file into each worktree, I&rsquo;d have five stale copies
            of my credentials scattered around — more places to leak from, more places to forget to update.
          </p>
        </div>

        {/* ── Both machines ── */}
        <h2>The Same Tool on Both Machines</h2>
        <p>
          I run cmux in two places. On my Mac, it&rsquo;s for the interactive stuff — building this site,
          poking at a feature, three tabs open while I bounce between them. On my always-on home Linux
          server, it&rsquo;s for work that needs to keep running after I close my laptop: a long refactor
          on one of my bots, or an agent grinding through a big migration overnight.
        </p>

        <p>
          The setup is identical on both — same shell function, same commands, same <code>.cmux/setup</code>
          hook committed to each repo — which is the whole point. I don&rsquo;t have to remember a different
          workflow depending on which machine I&rsquo;m on. The only real difference is that on the server I
          start the session inside a persistent terminal (so it survives me disconnecting), and check back
          on it later with <code>cmux start &lt;branch&gt;</code> to pick the conversation back up right where
          it left off.
        </p>

        {/* ── When it helps / when it doesn't ── */}
        <h2>When Parallel Actually Helps (and When It Doesn&rsquo;t)</h2>
        <p>
          The honest lesson from a week of using this: parallel isn&rsquo;t always better. Running three
          agents at once only helps when the three tasks are genuinely independent. If task B depends on
          task A finishing first, parallelizing them just means A finishes, and then I have to merge A into
          B&rsquo;s branch before B&rsquo;s work even makes sense — which is more coordination, not less.
        </p>

        <p>
          Where it shines: unrelated jobs in the same repo. A CSS fix, a new writing post, and a data
          script — three lanes, no overlap, all done by the time I&rsquo;ve finished my coffee. Or trying
          two approaches to the same problem in two worktrees and keeping whichever one comes out cleaner.
          Where it hurts: anything where I need to hold the whole thing in my head. Watching three agents at
          once splits my attention, and a subtle mistake in one is easier to miss when I&rsquo;m context-
          switching between tabs. For focused, careful work, I still just run one <code>claude</code> in one
          folder like normal.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The merge is where you pay attention</span>
          <p>
            Three isolated agents can&rsquo;t conflict <em>while they work</em> — but their branches can
            conflict <em>when they merge</em>, if two of them happened to touch the same file. cmux won&rsquo;t
            let me merge a worktree with uncommitted changes, which forced me into a good habit: get each
            branch committed and clean before merging, and merge them back one at a time so I can read what
            each one actually changed instead of trusting a big combined blob.
          </p>
        </div>

        {/* ── Final Output ── */}
        <h2>The Workflow, Start to Finish</h2>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal — Three Agents, One Repo</span>
            </div>
            <div className="post-terminal-body">
              <div><span className="post-terminal-dim"># Tab 1 — kick off a bug fix</span></div>
              <div><span className="post-terminal-dim">$ cmux new fix-footer</span></div>
              <div><span className="post-terminal-success">Worktree ready: .worktrees/fix-footer</span></div>
              <div><span className="post-terminal-success">Running .cmux/setup... symlinked .env.local, installed deps</span></div>
              <br />
              <div><span className="post-terminal-dim"># Tab 2 — draft a new post at the same time</span></div>
              <div><span className="post-terminal-dim">$ cmux new new-post</span></div>
              <br />
              <div><span className="post-terminal-dim"># Later — check what&rsquo;s in flight</span></div>
              <div><span className="post-terminal-dim">$ cmux ls</span></div>
              <div><span className="post-terminal-success">.worktrees/fix-footer   [fix-footer]</span></div>
              <div><span className="post-terminal-success">.worktrees/new-post     [new-post]</span></div>
              <br />
              <div><span className="post-terminal-dim"># fix-footer is done — merge it and clean up</span></div>
              <div><span className="post-terminal-dim">$ cmux merge fix-footer</span></div>
              <div><span className="post-terminal-success">Merged &lsquo;fix-footer&rsquo; into &lsquo;main&rsquo;.</span></div>
              <div><span className="post-terminal-dim">$ cmux rm fix-footer</span></div>
              <div><span className="post-terminal-success">Removed worktree and branch: fix-footer</span></div>
            </div>
          </div>
          <p className="post-visual-caption">
            Create, work, merge, remove — the whole lifecycle in four one-word commands.
          </p>
        </div>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Install and setup</strong> — it&rsquo;s a shell function, so &ldquo;installing&rdquo; is
            one <code>source</code> line in my shell config. Same line on the Mac and the server. Done in
            minutes on each.
          </li>
          <li>
            <strong>The setup hook</strong> — <code>cmux init</code> asked Claude to read my repo and write
            the <code>.cmux/setup</code> script for me. It figured out which secret to symlink and which
            package manager to use, and I only had to tweak it.
          </li>
          <li>
            <strong>Resuming work</strong> — <code>cmux start</code> reopens a worktree and continues the
            same conversation. I can walk away from a half-finished session and pick it up hours later with
            the agent&rsquo;s memory intact.
          </li>
          <li>
            <strong>No extra cost</strong> — every session runs on the Max subscription I already pay for.
            Parallelism was free.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>The clean-checkout gotcha</strong> — my first fresh worktree failed instantly because it
            had no secrets and no installed packages. Nothing is broken; a new worktree just doesn&rsquo;t
            inherit gitignored files. The setup hook is the fix, but I had to hit the wall before I
            understood why it exists.
          </li>
          <li>
            <strong>The name expectation</strong> — &ldquo;tmux for Claude Code&rdquo; made me think it would
            arrange my windows. It manages worktrees, not panes. Once I stopped waiting for it to split my
            screen and just opened my own tabs, it made sense.
          </li>
          <li>
            <strong>Knowing when NOT to parallelize</strong> — the real skill isn&rsquo;t running four agents,
            it&rsquo;s recognizing that three of your four tasks actually depend on each other and should just
            be one focused session. I over-parallelized at first and spent more time coordinating merges than
            I saved.
          </li>
          <li>
            <strong>Merge discipline</strong> — isolated agents can&rsquo;t collide while working, but their
            branches can when they land. I learned to commit each worktree clean and merge them back one at a
            time, reading each change, instead of trusting a big combined merge.
          </li>
        </ul>

        <p>
          The best part isn&rsquo;t the speed, though the speed is real. It&rsquo;s that a whole category of
          annoyance just disappeared — the &ldquo;I can&rsquo;t start that until this one finishes&rdquo;
          feeling. Now independent work happens independently. Three lanes, three agents, one subscription,
          and a clean merge at the end. I create a worktree, hand a task to an agent, and go start the next
          one.
        </p>
      <RelatedPosts slug="how-i-run-parallel-claude-code-sessions" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
