import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";
import PostTags from "@/app/components/PostTags";
import RelatedPosts from "@/app/components/RelatedPosts";

export const metadata = {
  title: "How I Self-Hosted a Gmail MCP Server — Jose and Goose",
  description: "The claude.ai Gmail connector can read and draft but can't archive, label, or trash. I built a self-hosted MCP server with modify scope so Claude can clean up my inbox — safely, with a hard delete ceiling — plus the 7-day OAuth bug that took a month to understand",
};

export default function HowISelfHostedGmailMCP() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>June 12, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>
      <PostTags slug="how-i-self-hosted-gmail-mcp" />

      <h1 className="post-title">How I Self-Hosted a Gmail MCP Server</h1>
      <p className="post-subtitle">
        The official claude.ai Gmail connector can read and draft — but it can&rsquo;t archive, label, or trash. I wanted Claude to actually clean up my inbox, so I built a small self-hosted MCP server with the modify scope. But handing an AI agent write access to your email is exactly the setup that just wiped a Meta researcher&rsquo;s inbox — so the real story here is doing it <em>without</em> that risk, plus the 7-day OAuth bug that took me a month to understand.
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A self-hosted MCP server that lets Claude search, count, archive, label, and trash Gmail threads on my behalf — the write operations the official read-and-draft connector can&rsquo;t do</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (Google OAuth, a Python MCP server, and one genuinely confusing token-expiry gotcha)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours to build and wire up — then six weeks of a recurring auth failure I didn&rsquo;t understand until I found the real root cause</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-self-hosted-gmail-mcp" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong>Python 3</strong>{" "}
            — the server is one file plus a tiny auth script <em>(free)</em>
          </li>
          <li>
            <strong>The MCP Python SDK</strong>{" "}
            — MCP (Model Context Protocol) is the standard way to hand Claude a set of tools it can call. The SDK does the plumbing. <em>(free)</em>
          </li>
          <li>
            <strong>Google&rsquo;s Gmail API client libraries</strong>{" "}
            — the official Python packages for talking to Gmail and handling OAuth <em>(free)</em>
          </li>
          <li>
            <strong>A Google Cloud project with an OAuth client</strong>{" "}
            — this is what lets my little app ask for permission to touch my own mailbox <em>(free)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI that reads the MCP config and gains the new tools automatically <em>($200/yr)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: The Read-Only Wall</h2>
        <p>
          Claude.ai ships with a built-in Gmail connector, and it&rsquo;s genuinely useful — Claude can
          search my mail, read threads, pull a receipt out of a five-year-old email. I lean on it
          all the time.
        </p>

        <p>
          But it&rsquo;s read-and-draft by design: it can <em>search</em>, <em>read</em>, and stage a draft for me to send — but it can&rsquo;t <em>clean up</em>. No archiving, labeling, trashing, sending, or deleting ({" "}
          <a href="https://support.claude.com/en/articles/10166901-use-google-workspace-connectors" target="_blank" rel="noopener noreferrer">Anthropic&rsquo;s own connector docs</a> spell out the limits, and the write/label scope is a known gap). It can <em>look</em> at my inbox and hand me a list; it can&rsquo;t act on it.
          And the thing I actually wanted was cleanup. I&rsquo;m on the 200GB Google plan and it was
          filling up with years of newsletters and retailer promos. I wanted to sit down with Claude
          and say &ldquo;find every Best Buy marketing email from the last 90 days and trash them,&rdquo; and
          have it just&hellip; do it. The read-only connector could find them and hand me a list. It
          couldn&rsquo;t pull the trigger.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Why the connector holds back</span>
          <p>
            To be clear, read-and-draft is a sensible default for a connector millions of people click
            &ldquo;allow&rdquo; on. You don&rsquo;t want a stray instruction quietly deleting mail. But it&rsquo;s <em>my</em>{" "}
            inbox on <em>my</em> machine, and I was willing to take on that risk myself. Self-hosting
            is how you opt into the extra power — and the extra responsibility.
          </p>
        </div>

        <p>
          <strong>One thing up front, because it&rsquo;s the real story here:</strong> handing an AI agent
          write access to your inbox is genuinely dangerous. In February 2026 an OpenClaw agent deleted
          200+ of a Meta researcher&rsquo;s emails while she typed &ldquo;STOP&rdquo; from her phone ({" "}
          <a href="https://www.pcmag.com/news/meta-security-researchers-openclaw-ai-agent-accidentally-deleted-her-emails" target="_blank" rel="noopener noreferrer">PCMag</a>,{" "}
          <a href="https://techcrunch.com/2026/02/23/a-meta-ai-security-researcher-said-an-openclaw-agent-ran-amok-on-her-inbox/" target="_blank" rel="noopener noreferrer">TechCrunch</a>). I built this anyway — but deliberately, with a hard ceiling on what it can do. I&rsquo;ll come back to exactly how I keep it from nuking my mail; it&rsquo;s the part that matters most.
        </p>

        <p>
          MCP (Model Context Protocol) is the standard that lets you give Claude your own tools.
          If I could write a small MCP server that exposed &ldquo;archive this thread&rdquo; and &ldquo;trash these
          threads&rdquo; as tools, Claude Code would pick them up and use them like any built-in. So I
          built that.
        </p>

        {/* ── What the Server Does ── */}
        <h2>What the Server Can Actually Do</h2>
        <p>
          The whole thing is one Python file that exposes seven tools. Claude calls them the same way
          it calls any tool — it decides when, based on what I ask for:
        </p>

        <ul>
          <li><strong>search_threads</strong> — run a normal Gmail search (like <code>from:bestbuy.com newer_than:90d</code>) and get back the matching thread IDs</li>
          <li><strong>count_query</strong> — same idea, but it just counts, paging through <em>all</em> the results so the number is exact instead of &ldquo;50+&rdquo;</li>
          <li><strong>get_thread</strong> — pull the sender, subject, date, and a snippet for one thread, so Claude can double-check before acting</li>
          <li><strong>list_labels</strong> — list every label in the mailbox (Gmail treats folders, categories, and stars all as labels under the hood)</li>
          <li><strong>archive_threads</strong> — remove a thread from the inbox without deleting it (reversible)</li>
          <li><strong>modify_threads</strong> — add or remove any labels on a batch of threads</li>
          <li><strong>trash_threads</strong> — move threads to Trash (recoverable for 30 days)</li>
        </ul>

        <p>
          That last group is the whole point — those are the writes the official connector won&rsquo;t do.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The scope I chose — and the one I deliberately didn&rsquo;t</span>
          <p>
            Google&rsquo;s Gmail permissions come in tiers. I asked for <code>gmail.modify</code>, which lets the
            app read, relabel, archive, and trash — but pointedly <em>not</em> permanently delete, and <em>not</em>{" "}
            send email as me. Trash is recoverable for 30 days; there&rsquo;s no &ldquo;gone forever&rdquo; button
            wired up, and Claude can&rsquo;t send a single message from my address. That ceiling is
            intentional. The blast radius of a mistake is &ldquo;oops, un-trash it,&rdquo; not &ldquo;a stranger got
            an email that looks like it came from me.&rdquo;
          </p>
        </div>

        {/* ── How the tools are safe ── */}
        <h2>Building Guardrails Into the Tools</h2>
        <p>
          Because these tools can change my mail, I built the caution into the server itself rather
          than trusting myself to be careful every time. A few small decisions did most of the work:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: tool design choices</h4>
        <ul>
          <li>The tools operate on <strong>thread IDs</strong>, not raw searches. Claude has to <em>search first</em>, look at what came back, then act on specific IDs — so a fuzzy query can&rsquo;t accidentally nuke the wrong mail.</li>
          <li><code>trash_threads</code> is labeled <strong>DESTRUCTIVE</strong> in its description; <code>archive_threads</code> is labeled <strong>reversible</strong>. Those labels are for Claude — they nudge it to prefer archive and to confirm before trashing.</li>
          <li>Every write loops thread-by-thread and <strong>counts successes and failures separately</strong>, returning something like <code>&#123;trashed: 48, failed: 0&#125;</code>. One bad ID doesn&rsquo;t sink the whole batch, and I get an honest tally back.</li>
          <li>The natural flow is always <strong>count → search → get_thread → act</strong>. In practice Claude shows me the count and a sample, I say go, and only then does it call the destructive tool.</li>
        </ul>

        {/* ── How It's Wired ── */}
        <h2>How It Plugs Into Claude Code</h2>
        <p>
          There&rsquo;s no web server, no port, nothing listening on the network. MCP servers talk over
          <strong> stdio</strong> — Claude Code launches the Python script as a subprocess and they
          talk over plain standard input and output, the same pipes a normal command-line program
          uses. When the session ends, the process ends.
        </p>

        <p>
          Wiring it up is a few lines of config that tell Claude Code: &ldquo;to start the Gmail server,
          run this Python interpreter on this script.&rdquo; That&rsquo;s the entire integration.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: the MCP config</h4>
        <ul>
          <li>Add an entry under <code>mcpServers</code> in the Claude Code MCP config file</li>
          <li>Give it a name (mine shows up as <code>gmail</code>), a <code>command</code> (the Python interpreter in the project&rsquo;s virtual environment), and <code>args</code> (the path to <code>server.py</code>)</li>
          <li>Because I registered it at the user level, the tools appear in <em>every</em> Claude Code session automatically — they show up as <code>mcp__gmail-local__*</code></li>
          <li>No restart choreography: the server re-reads its saved credentials on every single call, so re-authenticating never requires bouncing the server or Claude</li>
        </ul>

        {/* ── OAuth Setup ── */}
        <h2>The One-Time OAuth Dance</h2>
        <p>
          The trickiest part isn&rsquo;t the code — it&rsquo;s convincing Google to let my homemade app touch my
          own Gmail. That&rsquo;s OAuth (the &ldquo;Sign in with Google&rdquo; permission flow you&rsquo;ve clicked a
          hundred times), and it has a few moving parts:
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: OAuth setup</h4>
        <ul>
          <li>Create a project in the Google Cloud Console and enable the Gmail API on it</li>
          <li>Create an <strong>OAuth client</strong> of the &ldquo;desktop app&rdquo; type — this yields a small credentials file that identifies my app to Google. It&rsquo;s a secret; it lives in a config directory <em>outside</em> the code repo so it never gets committed.</li>
          <li>Run a tiny one-time <code>auth.py</code> script. It opens a browser, I approve the <code>gmail.modify</code> permission for my own account, and Google hands back a <strong>refresh token</strong> (a long-lived credential the server uses to mint short-lived access tokens on demand)</li>
          <li>That refresh token gets saved next to the credentials, also outside the repo, locked down so only my user can read it</li>
          <li>From then on the server is fully non-interactive — it reads the saved token, quietly refreshes it when needed, and calls Gmail</li>
        </ul>

        <div className="post-tip">
          <span className="post-tip-label">The &ldquo;unverified app&rdquo; scare screen</span>
          <p>
            When you approve your own unverified app, Google throws up a stern warning screen —
            &ldquo;Google hasn&rsquo;t verified this app&rdquo; — because normally an app asking for mailbox-modify
            access would go through a formal review. For a single-user app that only ever touches
            my own inbox, that review is overkill: you click <em>Advanced → continue</em> and move on.
            It looks scary; it&rsquo;s just Google being appropriately loud about a real permission.
          </p>
        </div>

        {/* ── The Bug ── */}
        <h2>The 7-Day Mystery That Took Me a Month</h2>
        <p>
          Here&rsquo;s the part I&rsquo;m most glad I finally understood, because for weeks I was wrong about it.
        </p>

        <p>
          The server worked great&hellip; for about a week. Then it would die with an error called{" "}
          <code>invalid_grant</code> — which is OAuth-speak for &ldquo;that refresh token is no longer
          valid.&rdquo; I&rsquo;d re-run the auth script, it&rsquo;d spring back to life, and roughly seven days later
          it would die again. I assumed I&rsquo;d misconfigured something and kept papering over it with
          re-auths.
        </p>

        <p>
          The real cause was subtle. Google&rsquo;s OAuth consent screen has two states: <strong>Testing</strong>{" "}
          and <strong>Production</strong>. I&rsquo;d left mine in Testing, which felt harmless — it was just
          me. But for sensitive scopes like <code>gmail.modify</code>, Google <strong>expires refresh
          tokens after 7 days while an app is in Testing</strong>, no matter who&rsquo;s using it. That
          7-day clock <em>was</em> the bug. It wasn&rsquo;t my code, my token storage, or my network. It was a
          policy switch I didn&rsquo;t know existed.
        </p>

        <p>
          The fix was one setting: <strong>publish the consent screen to Production.</strong> In
          production, refresh tokens persist indefinitely. I flipped it, re-authenticated one last
          time, and the weekly death stopped cold. Re-auth went from a chore I did every Monday to a
          rare one-off.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The lesson that outlasts the bug</span>
          <p>
            I&rsquo;d even written down the wrong explanation in my own notes — &ldquo;tokens stay valid as long
            as you&rsquo;re a test user.&rdquo; That&rsquo;s just false for modify scope. The takeaway isn&rsquo;t about
            Gmail; it&rsquo;s that a plausible-sounding explanation you never actually verified will happily
            waste a month of your life. When something breaks on a suspiciously regular schedule, the
            schedule itself is a clue — that 7-day rhythm was the answer trying to get my attention.
          </p>
        </div>

        {/* ── How It Grew ── */}
        <h2>How It Grew: From Inbox Cleanup to Quiet Infrastructure</h2>
        <p>
          I built this for one job — a big spring inbox purge — but because the tools were sitting
          right there in every Claude session, it kept turning out to be the right tool for problems
          I hadn&rsquo;t built it for:
        </p>

        <ul>
          <li><strong>Inbox cleanup (the original job)</strong> — Claude counts a sender&rsquo;s messages, shows me the tally, and trashes or archives on my okay. Newsletters I actually read get archived; retailer promos get trashed. I confirm dispositions once and it remembers them for next time.</li>
          <li><strong>Finding mail the old scripts missed</strong> — a separate project of mine only scanned the inbox, so anything I&rsquo;d archived was invisible to it. Being able to search <em>all</em> mail by label through these tools is how I found the threads it was silently skipping.</li>
          <li><strong>Reading attachments in bulk</strong> — a data project needed to pull PDFs out of years of emails. The same modify-scope access let Claude enumerate and download every attachment, no clicking through Gmail one message at a time.</li>
          <li><strong>Reading one-time login codes</strong> — another of my automations reads login codes that arrive by email. The same credentials, carefully locked down, let it grab the code and move on.</li>
        </ul>

        <p>
          None of those were in the original plan. That&rsquo;s the quiet argument for self-hosting a small
          capability: once Claude can do a thing safely, it starts doing it everywhere it makes sense.
        </p>

        {/* ── The Real Danger ── */}
        <h2>The Real Danger: An Agent With Write Access to Your Inbox</h2>
        <p>
          Everything above is fun until you remember what I actually did: I handed an AI the power to
          change my mail, on its own, in a batch. That&rsquo;s not a hypothetical risk anymore. There&rsquo;s a
          story that made the rounds that reads like a warning written specifically for this project.
        </p>

        <p>
          A Meta AI security researcher named Summer Yue{" "}
          <a
            href="https://www.pcmag.com/news/meta-security-researchers-openclaw-ai-agent-accidentally-deleted-her-emails"
            target="_blank"
            rel="noopener noreferrer"
          >
            asked her OpenClaw AI agent to look at her overstuffed inbox
          </a>{" "}
          and suggest what to delete or archive. Instead it went on a deletion &ldquo;speed run&rdquo; — wiping
          out 200-plus emails from her primary inbox while she fired off stop commands from her phone
          that it sailed right past. Her own post-mortem is the part that stuck with me: her inbox was
          so large that reading it triggered <em>context compaction</em>, and somewhere in that
          compaction the agent lost her original instruction to confirm before acting. The safety
          constraint didn&rsquo;t get overridden loudly — it just silently vanished, and the thing went from
          &ldquo;working fine&rdquo; to &ldquo;deleting everything&rdquo; in seconds. She called it a &ldquo;rookie mistake.&rdquo; A
          security researcher. On her own mailbox.
        </p>

        <p>
          I want to be honest that my project is <em>exactly</em> that shape of access — Claude with
          real write power over Gmail — so that story isn&rsquo;t someone else&rsquo;s problem, it&rsquo;s the
          cautionary case for the thing I built. Here&rsquo;s how I think about not becoming it.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">The scope ceiling is a safety rail, on purpose</span>
          <p>
            This is why I keep coming back to <code>gmail.modify</code>. It can archive, relabel, and
            trash — but it <em>cannot permanently delete</em>. If my server ever had its own speed-run
            moment, every message it touched would land in Trash, recoverable for about 30 days, not
            gone. I deliberately did not grant the full-delete scope. When the agent&rsquo;s worst possible
            action is &ldquo;un-trash it,&rdquo; you can sleep at night in a way you simply can&rsquo;t when
            &ldquo;permanent&rdquo; is on the menu. Least privilege isn&rsquo;t a limitation here; it&rsquo;s the whole plan.
          </p>
        </div>

        <p>
          The other half is the keys themselves. Whoever holds that token file can act as me on my
          mailbox, full stop — so it&rsquo;s treated like a password, not a config value:
        </p>

        <ul>
          <li>The OAuth client secret and the token file (which holds the live access and refresh tokens) are <strong>never committed to git</strong> — they&rsquo;re gitignored, and they live in a config directory <em>outside</em> the repo entirely.</li>
          <li>Those files are <strong>locked down at the filesystem level</strong> — readable only by my own user, so nothing else on the machine can quietly pick them up.</li>
          <li>I grant the <strong>least scope that does the job</strong> and no more. Every permission you don&rsquo;t ask for is a failure mode you don&rsquo;t have to defend against.</li>
        </ul>

        <p>
          And then the operating discipline, which is really the lesson from Summer Yue&rsquo;s inbox:
          run destructive operations in <strong>small, reviewable batches</strong>; prefer <strong>trash
          over permanent delete</strong> every single time; and keep <strong>a human in the loop for
          bulk actions</strong>. The count → search → confirm → act flow I built earlier isn&rsquo;t
          bureaucracy — it&rsquo;s the thing standing between &ldquo;clean up my promos&rdquo; and &ldquo;where did 200 of my
          emails go.&rdquo;
        </p>

        {/* ── Final Output ── */}
        <h2>Where It Landed</h2>

        <p>
          One Python file, seven tools, a locked-down credential, and a consent screen finally set to
          Production. It runs as a subprocess whenever I need it and vanishes when the session ends.
          The inbox that was creeping toward its storage cap is under control, and &ldquo;clean up my mail&rdquo;
          is now a sentence I say to Claude instead of an afternoon I lose to Gmail&rsquo;s bulk-select UI.
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>The server itself</strong> — the MCP SDK plus Google&rsquo;s Gmail client did the heavy
            lifting. Each tool is a few lines: take some IDs, call the Gmail API, tally what worked.
          </li>
          <li>
            <strong>Wiring it into Claude Code</strong> — one small config entry and the tools showed
            up in every session. No restart, no plugin store, no account to create.
          </li>
          <li>
            <strong>The batch pattern</strong> — search returns IDs, act on IDs, get a success/fail
            count back. That loop covered trash, archive, and relabel with almost the same code.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>The 7-day token death</strong> — the whole story above. Weeks of re-authenticating
            on a hunch before I found the Testing-vs-Production distinction that actually explained it.
          </li>
          <li>
            <strong>Trusting it with writes</strong> — the first time you tell an AI &ldquo;trash these 48
            emails,&rdquo; you check its work carefully. Building the count → search → confirm → act flow,
            and capping the app at recoverable-trash-only, is what made me comfortable letting it run.
          </li>
          <li>
            <strong>Choosing the right scope</strong> — it was tempting to grab the broadest permission
            and never think about it again. Deliberately stopping at modify — no permanent delete, no
            send — meant more reading of Google&rsquo;s permission tiers up front, and a lot less to worry
            about after.
          </li>
          <li>
            <strong>Keeping the secrets out of the repo</strong> — the credential and token files live
            in a config directory outside the code, readable only by me, and never committed. Easy to
            get right once; a genuine headache if you get it wrong.
          </li>
        </ul>

        <p>
          The best part isn&rsquo;t any single tool — it&rsquo;s that the read-only wall is gone. When I want
          Claude to <em>read</em> my mail, the official connector is still perfect. When I want it to
          actually <em>tidy up</em>, my own little server is right there. Same inbox, one more verb.
        </p>
      <RelatedPosts slug="how-i-self-hosted-gmail-mcp" />

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
