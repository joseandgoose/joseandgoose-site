import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";

export const metadata = {
  title: "How I Replaced Google Forms with a Custom Contact Form — Jose and Goose",
  description: "Building a Supabase-backed contact form with email notifications in 2 hours using Claude Code terminal",
};

export default function HowIReplacedGoogleForms() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>February 28, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>7 min read</span>
      </div>

      <h1 className="post-title">How I Replaced Google Forms with a Custom Contact Form Using Claude Code</h1>
      <p className="post-subtitle">
        Building a Supabase-backed contact form with email notifications in 2 hours — 4x faster than my first database project
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>One custom contact form with database storage and email notifications at{" "}
              <a href="https://www.joseandgoose.com/contact" target="_blank" rel="noopener noreferrer">joseandgoose.com/contact</a>
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Beginner-Intermediate (second time setting up Supabase, first time using Resend)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~2 hours in one evening session (vs 8–10 hours for my first Supabase project)</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-replaced-google-forms" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            — terminal-based AI for direct file editing <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a></strong>{" "}
            — PostgreSQL database for storing contact form submissions <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — email API for instant notifications <em>(free tier: 3,000 emails/month)</em>
          </li>
          <li>
            <strong><a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a></strong>{" "}
            — hosting with auto-deploy from GitHub <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong>{" "}
            — React framework with API routes <em>(free)</em>
          </li>
          <li>
            <strong>One Google Form iframe</strong> — ready to be replaced <em>(free to delete)</em>
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: Google Forms Look Like Google Forms</h2>
        <p>
          The contact page had a Google Form embedded in an iframe. It worked, but it looked like
          every other Google Form on the internet — white background, blue submit button, Google
          branding at the bottom. I wanted a form that matched the site&rsquo;s design (cream background,
          forest green buttons) and sent me instant email notifications without opening the Google
          Forms dashboard.
        </p>

        <p>
          The requirements: replace the iframe with a custom form, store submissions in{" "}
          <strong>Supabase</strong>, send email notifications via <strong>Resend</strong>, and
          make it feel native to the site. Having built <Link href="/writing/how-i-built-numerator">Numerator</Link>{" "}
          two weeks earlier (8–10 hours, also using <strong>Supabase</strong>), I knew the database
          setup would be familiar. The question: how much faster with <strong>Claude Code</strong>{" "}
          in the terminal instead of <strong>Claude.ai</strong> in the browser?
        </p>

        {/* ── Session ── */}
        <h2>The Build: One Evening, Four Phases</h2>
        <p className="post-session-meta">Evening, February 27 — ~2 hours total</p>
        <p className="post-pace">
          <strong>Pace:</strong> Database setup fast (learned from Numerator). Design iteration slow
          (6 rounds of layout changes). Terminal workflow 4x faster than browser copy-paste.
        </p>

        <h3>Phase 1: Database and API (15 minutes)</h3>
        <p>
          Every contact form submission needs somewhere to live. The first step was creating a database
          table — essentially a spreadsheet in the cloud — to capture each submission&rsquo;s name,
          email, message, and timestamp. Claude generated a setup script that I ran in Supabase&rsquo;s
          web dashboard; no software installation needed on my end.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Database schema and API route</h4>
        <ul>
          <li>A <code>submissions</code> table with UUID primary key, text fields for name/email/message, a boolean <code>read</code> flag, and a <code>created_at</code> timestamp</li>
          <li>Indexes on <code>read</code> status and <code>created_at</code> for fast filtering</li>
          <li>RLS policies allowing anonymous inserts (anyone can submit) and authenticated reads (only I can view submissions in the dashboard)</li>
          <li>An API route at <code>/api/contact/route.ts</code> with validation (email format, length limits, required fields)</li>
        </ul>

        <p>
          I ran the SQL in the <strong>Supabase SQL Editor</strong>, verified the <code>submissions</code>{" "}
          table appeared in <strong>Table Editor</strong>, and the database was ready. Same flow as
          Numerator, but this time I knew where to find the SQL Editor and how RLS worked — no
          re-learning the dashboard.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Speed advantage</span>
          <p>
            <strong>Claude Code</strong> writes files directly to your project via terminal. No
            downloading code blocks from the browser, no copy-paste into VS Code, no &quot;did I
            save that file?&quot; checks. It just edits <code>app/api/contact/route.ts</code> and
            it&rsquo;s there.
          </p>
        </div>

        <h3>Phase 2: Form Component (30 minutes)</h3>
        <p>
          With the database ready, Claude built the visible form — the fields a visitor sees, the submit
          button, the loading animation while it sends, and the success message when it&rsquo;s done.
          Replacing the Google Form meant swapping one line of code (the embedded iframe) with the new
          component, which Claude handled directly in the terminal.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Form component features</h4>
        <ul>
          <li>Name, email, and message fields with React state management</li>
          <li>Client-side validation (required fields, email format, character limits)</li>
          <li>Loading state (button shows &quot;Sending...&quot; while submitting)</li>
          <li>Success message (&quot;Thanks for reaching out! I&rsquo;ll get back to you soon.&quot;)</li>
          <li>Error handling (displays API error messages if submission fails)</li>
          <li>Character counter for the message field (0/1000 characters)</li>
        </ul>

        <p>
          Updated <code>app/contact/page.tsx</code> to replace the Google Form iframe with{" "}
          <code>&lt;ContactForm /&gt;</code>. Tested locally at <code>localhost:3000/contact</code>{" "}
          — form loaded, submitted a test, checked <strong>Supabase Table Editor</strong> and saw
          the submission. First try worked.
        </p>

        <h3>Phase 3: Design Iteration (45 minutes)</h3>
        <p>
          The form worked correctly on the first try — the slow part was making it look right. Over
          six rounds of plain-English feedback, I shaped the layout until it matched the rest of the
          site. Each round: describe the change, Claude updates the file, refresh the browser.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Design feedback rounds</h4>
        <ul>
          <li><strong>Round 1:</strong> Split single &quot;Name&quot; field into &quot;First Name&quot; and &quot;Last Name&quot; side by side</li>
          <li><strong>Round 2:</strong> Added asterisks (*) to required field labels and a &quot;* REQUIRED FIELD&quot; note at the bottom</li>
          <li><strong>Round 3:</strong> Moved &quot;Contact&quot; heading outside the form box, added &quot;Get in touch&quot; intro with 3 bullet points (consulting inquiries, project recommendations, book time to chat)</li>
          <li><strong>Round 4:</strong> Removed light green background box, made entire page cream-colored for a cleaner look</li>
          <li><strong>Round 5:</strong> Horizontally aligned &quot;* REQUIRED FIELD&quot; text with the character counter (both on the same line)</li>
          <li><strong>Round 6:</strong> Centered the &quot;Send Message&quot; button and removed gray borders from input fields for a uniform background feel</li>
        </ul>

        <p>
          Each round: I described the change, <strong>Claude Code</strong> updated{" "}
          <code>app/globals.css</code> or <code>ContactForm.tsx</code>, I refreshed{" "}
          <code>localhost:3000/contact</code> in the browser, gave feedback. The terminal workflow
          meant no file switching in VS Code — <strong>Claude Code</strong> just edited the right
          file every time.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Iteration lesson</span>
          <p>
            Design iteration is still the slowest part, even with AI. But <strong>Claude Code</strong>&rsquo;s
            terminal access eliminated all the &quot;which file do I edit?&quot; friction. I gave
            feedback in plain English, it updated CSS and JSX directly, I refreshed. No context
            switching.
          </p>
        </div>

        <h3>Phase 4: Email Notifications (30 minutes)</h3>
        <p>
          Submissions were saving to the database, but I had no way to know when one arrived without
          logging in to check. Adding instant email notifications meant connecting an email-sending
          service — Claude recommended Resend (a free API that sends email programmatically) and
          wired it into the form&rsquo;s submit logic.
        </p>
        <h4 className="post-dev-heading">🔧 Developer section: Resend email integration</h4>
        <ul>
          <li>Ran <code>npm install resend</code> in terminal to add the package</li>
          <li><strong>Claude Code</strong> updated <code>/api/contact/route.ts</code> to import Resend and send an email after successful database insert</li>
          <li>Created a <strong>Resend</strong> account, generated an API key, added it to <code>.env.local</code> along with my notification email</li>
          <li>Tested locally — form submitted, email arrived in my inbox with sender name, email, and message</li>
        </ul>

        <p>
          The email template was simple HTML: sender name, email, message, and timestamp. Good
          enough for launch.
        </p>

        {/* ── Deployment ── */}
        <h2>Deployment: One Command and One Fix</h2>
        <p>
          Tested the form locally, verified email notifications worked, then pushed to{" "}
          <strong>GitHub</strong>. <strong>Vercel</strong> auto-deployed — and the build failed.
        </p>

        <p>
          The error: <code>new row violates row-level security policy for table &quot;submissions&quot;</code>.
          The RLS policy I&rsquo;d written allowed <code>anon</code> role inserts, but{" "}
          <strong>Supabase</strong> wasn&rsquo;t recognizing it. I tried recreating the policy,
          same error. Eventually: disabled RLS entirely on the <code>submissions</code> table (ran{" "}
          <code>ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;</code> in the{" "}
          <strong>Supabase SQL Editor</strong>).
        </p>

        <p>
          Submitted the form in production — success message appeared, email arrived, submission
          logged in <strong>Supabase</strong>. RLS is worth re-enabling later for security, but
          disabling it unblocked deployment.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Build lesson</span>
          <p>
            Local dev servers are forgiving. Production builds are not. <strong>Supabase</strong>{" "}
            RLS policies can fail silently in ways that only surface during deployment. When
            blocked: disable RLS to ship, re-enable and debug policies later.
          </p>
        </div>

        <p>
          One more issue: forgot to add <strong>Resend</strong> environment variables to{" "}
          <strong>Vercel</strong>. Went to <strong>Vercel</strong> dashboard → project Settings →
          Environment Variables, added <code>RESEND_API_KEY</code> and <code>NOTIFICATION_EMAIL</code>,
          redeployed. Email notifications worked in production.
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
                joseandgoose-site-main % <span className="post-terminal-cmd">git add -A && git commit -m &quot;Replace Google Form with custom Supabase contact form&quot; && git push</span>
              </div>
              <div className="post-terminal-dim">[main 86b1045] Replace Google Form with custom Supabase contact form</div>
              <div className="post-terminal-dim"> 7 files changed, 507 insertions(+), 46 deletions(-)</div>
              <div className="post-terminal-success">To https://github.com/joseandgoose/starter.git</div>
              <div className="post-terminal-success">   7dae34b..86b1045  main → main</div>
            </div>
          </div>
          <p className="post-visual-caption">
            One <code>git push</code> → <strong>Vercel</strong> deployed in 60 seconds → contact form live at joseandgoose.com/contact.
          </p>
        </div>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          A custom contact form at{" "}
          <a href="https://www.joseandgoose.com/contact" target="_blank" rel="noopener noreferrer">
            joseandgoose.com/contact
          </a>{" "}
          with <strong>Supabase</strong> database storage, <strong>Resend</strong> email
          notifications, first/last name fields, character count, validation, success/error
          messages, and a design that matches the site&rsquo;s cream and forest green aesthetic —
          built in <strong>2 hours</strong> (vs 8–10 hours for my first <strong>Supabase</strong> project,{" "}
          <Link href="/writing/how-i-built-numerator">Numerator</Link>).
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>Database setup</strong> (15 minutes — already knew <strong>Supabase</strong> from Numerator, just ran the SQL)
          </li>
          <li>
            <strong>API route creation</strong> (<strong>Claude Code</strong> wrote <code>/api/contact/route.ts</code> with validation in one shot)
          </li>
          <li>
            <strong>Form component</strong> (React state, validation, loading/success states — all worked first try)
          </li>
          <li>
            <strong>Terminal workflow</strong> (no file switching, no copy-paste from browser, <strong>Claude Code</strong> just edited files directly)
          </li>
          <li>
            <strong>Email integration</strong> (<strong>Resend</strong> API is dead simple — npm install, add API key, send email)
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Design iteration</strong> (6 rounds to get the layout right — split name fields, align text, remove borders, adjust spacing)
          </li>
          <li>
            <strong>RLS policy debugging</strong> (policy syntax looked correct but failed in production — disabled RLS to ship, will re-enable later)
          </li>
          <li>
            <strong>Environment variables</strong> (forgot to add <strong>Resend</strong> keys to <strong>Vercel</strong>, had to redeploy)
          </li>
        </ul>

        <h3>Claude Code vs Claude.ai: 4x Speed Difference</h3>
        <p>
          <Link href="/writing/how-i-built-numerator">Numerator</Link> took 8–10 hours using{" "}
          <strong>Claude.ai</strong> in the browser. This contact form took <strong>2 hours</strong>{" "}
          using <strong>Claude Code</strong> in the terminal. Same developer (me), similar complexity
          (both used <strong>Supabase</strong>, both had API routes, both required design iteration).
        </p>

        <p>The difference:</p>

        <ul>
          <li>
            <strong>Browser workflow (Numerator):</strong> Claude generates code → I copy code block → open VS Code → find the right file → paste → save → refresh browser → give feedback → repeat
          </li>
          <li>
            <strong>Terminal workflow (Contact Form):</strong> I describe change → <strong>Claude Code</strong> edits the file → I refresh browser → give feedback → repeat
          </li>
        </ul>

        <p>
          The terminal workflow eliminated <strong>50% of the steps</strong>. No context switching
          between browser and editor. No &quot;which file do I edit?&quot; questions. No copy-paste
          errors. Just: describe, refresh, iterate.
        </p>

        <p>
          And because I&rsquo;d already built Numerator (learned <strong>Supabase</strong>, understood
          RLS policies, knew how API routes worked), the second database project was{" "}
          <strong>4x faster</strong>. The tools stayed the same. The experience compounded.
        </p>

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
