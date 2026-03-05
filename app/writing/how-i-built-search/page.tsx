import Link from "next/link";

export const metadata = {
  title: "How I Built a Self-Updating Search Bar — Jose and Goose",
  description: "From architecture decision to React portal — why a simple search bar required a codebase refactor, a build script, and fixing a CSS rule I didn't know existed",
};

export default function HowIBuiltSearch() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 3, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>8 min read</span>
      </div>

      <h1 className="post-title">How I Built a Self-Updating Search Bar Using Claude Code</h1>
      <p className="post-subtitle">
        From architecture decision to React portal — why a simple search bar required a codebase
        refactor, a build script, and fixing a CSS rule I didn&rsquo;t know existed
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>
              A site-wide search bar with dropdown previews, keyboard navigation, and a
              self-regenerating index at{" "}
              <a href="https://www.joseandgoose.com" target="_blank" rel="noopener noreferrer">
                joseandgoose.com
              </a>{" "}
              — click the magnifying glass in the nav
            </span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (first time thinking about build-time automation and React portals)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~3 hours across 4 feedback sessions in one evening</span>
          </div>
        </div>

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">Claude Code</a></strong>{" "}
            — terminal-based AI for direct file editing <em>($200/yr)</em>
          </li>
          <li>
            <strong><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a></strong>{" "}
            — the React framework running the site <em>(free)</em>
          </li>
          <li>
            <strong>tsx</strong>{" "}
            — a TypeScript runner that executes scripts without a separate compilation step <em>(free)</em>
          </li>
          <li>
            <strong>14 pages worth of content</strong>{" "}
            — the site&rsquo;s pages, writing posts, and features that needed to be searchable
          </li>
        </ul>

        {/* ── The Problem ── */}
        <h2>The Problem: The Site Was Getting Too Big to Navigate by Eye</h2>
        <p>
          When the site launched, there were four pages. By March, there were fourteen — seven
          writing posts, two interactive features, five static pages. Someone looking for the post
          about Garmin automations had to scroll through the Writing index and scan titles. Someone
          looking for Fruit Exchange had to know it existed to find it.
        </p>

        <p>
          The site needed search. The question wasn&rsquo;t really &quot;should we add search&quot; —
          it was &quot;how do we build it in a way that doesn&rsquo;t fall apart as the site keeps growing?&quot;
          That&rsquo;s where the real design work started.
        </p>

        {/* ── Session 1 ── */}
        <h2>Session 1: The Architecture Decision</h2>
        <p className="post-session-meta">Evening, March 3 — ~30 minutes of planning, then build</p>
        <p className="post-pace">
          <strong>Pace:</strong> Slow start (making the right structural decision up front), fast execution after.
        </p>

        <p>
          Before writing any code, Claude and I worked through how the search index should be structured.
          A search index is essentially a master list of everything on the site that search can look
          through — every page title, every post subtitle, every feature description — stored in a single
          file.
        </p>

        <p>
          The first instinct was the simplest option: a hand-maintained JSON file. Create it once,
          update it when you add content. But I knew this would break down fast. The Writing section
          alone was growing every week. Forget to update the file after adding a post and the post
          simply wouldn&rsquo;t appear in search results — silently, with no warning.
        </p>

        <p>
          The better option was a <strong>build script</strong> — a small program that runs automatically
          every time the site gets built for production, reading the actual list of posts and writing
          the search index file on the fly. The tradeoff: it required a code refactor first.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Architecture tip</span>
          <p>
            If you&rsquo;re building something that you&rsquo;ll maintain for years, the ten-minute
            upfront investment in automation pays for itself the first time you forget to do the
            manual version. The static file was simpler to describe. The build script was simpler
            to live with.
          </p>
        </div>

        <h3>The Refactor: One Source of Truth</h3>
        <p>
          The problem: the list of Writing posts was defined inside the Writing page file itself —
          the code that displayed the posts and the list of posts were in the same place. That
          works fine for a single page, but a build script in a separate file couldn&rsquo;t read it.
        </p>

        <p>
          The fix was a refactor — moving the posts list into its own file (<code>app/lib/posts.ts</code>)
          that both the Writing page and the build script could import independently. Think of it
          like moving a recipe from inside a cooking show script into a recipe card that any show
          can reference. The Writing page still works exactly the same; now the build script can
          also see the same list.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Refactor and build script</h4>
        <ul>
          <li>
            Created <code>app/lib/posts.ts</code> with a typed <code>Post</code> array — moved
            all 7 post objects (slug, title, subtitle, date, readTime) out of{" "}
            <code>app/writing/page.tsx</code>
          </li>
          <li>
            Updated <code>app/writing/page.tsx</code> to <code>import {"{"} posts {"}"} from &quot;@/app/lib/posts&quot;</code> — one-line change, zero visual difference
          </li>
          <li>
            Created <code>scripts/generate-search-index.ts</code> — imports posts from the shared
            file, combines them with 7 hardcoded static page entries (Home, About, Work, Writing,
            Contact, Numerator, Fruit Exchange), writes the result to{" "}
            <code>public/search-index.json</code>
          </li>
          <li>
            Installed <code>tsx</code> as a dev dependency — a TypeScript script runner that lets
            Node execute <code>.ts</code> files directly without a separate compile step
          </li>
          <li>
            Added <code>&quot;prebuild&quot;: &quot;tsx scripts/generate-search-index.ts&quot;</code> to{" "}
            <code>package.json</code> — this runs automatically before every production build, so
            the index is always current
          </li>
          <li>
            Added <code>&quot;generate:search&quot;</code> as a standalone script for manual runs — ran
            it once to create the initial <code>search-index.json</code>
          </li>
        </ul>

        <div className="post-visual">
          <div className="post-terminal">
            <div className="post-terminal-bar">
              <span className="post-terminal-dot post-terminal-dot--red"></span>
              <span className="post-terminal-dot post-terminal-dot--yellow"></span>
              <span className="post-terminal-dot post-terminal-dot--green"></span>
              <span className="post-terminal-bar-title">Terminal — generating the index</span>
            </div>
            <div className="post-terminal-body">
              <div>
                <span className="post-terminal-prompt">user@MacBook-Air</span>{" "}
                joseandgoose-site-main % <span className="post-terminal-cmd">npm run generate:search</span>
              </div>
              <div className="post-terminal-dim">&gt; tsx scripts/generate-search-index.ts</div>
              <div className="post-terminal-success">✓ search-index.json written (14 entries)</div>
            </div>
          </div>
          <p className="post-visual-caption">
            One command generates a fresh index. Every production build runs this automatically — no manual updates needed.
          </p>
        </div>

        <p>
          From now on, adding a new post means one thing: add it to <code>app/lib/posts.ts</code>.
          The Writing page picks it up. The search index picks it up. Nothing else to remember.
        </p>

        {/* ── Session 2 ── */}
        <h2>Session 2: Building the Search Component</h2>
        <p className="post-session-meta">Same evening — ~1 hour</p>
        <p className="post-pace">
          <strong>Pace:</strong> Fast. The index structure was already decided; this was pure UI execution.
        </p>

        <p>
          With the index in place, Claude built the search component — the visible piece that visitors
          interact with. The design: a magnifying glass icon in the navigation bar. Click it, and a
          panel drops down with a search input. Start typing and results appear instantly, filtered
          from the index, with the matching word highlighted in yellow.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: SearchBar component</h4>
        <ul>
          <li>
            <strong>Lazy loading:</strong> the search index JSON is fetched from the server only once,
            on first open — not on page load. Cached in component state for the rest of the session.
          </li>
          <li>
            <strong>Debounced input:</strong> a 200ms delay before filtering results, so the search
            doesn&rsquo;t recalculate on every single keystroke while you&rsquo;re still typing
          </li>
          <li>
            <strong>Keyboard navigation:</strong> arrow keys move the active result up and down;
            Enter navigates to the selected page; Escape closes the panel
          </li>
          <li>
            <strong>Text highlighting:</strong> the matching portion of each result title and
            description is wrapped in a{" "}
            <code style={{ background: "#F3D104", color: "#0a0a0f", padding: "1px 5px", borderRadius: 3, fontWeight: 700, fontSize: 12 }}>
              {"<mark>"}
            </code>{" "}
            tag styled in the site&rsquo;s signature yellow
          </li>
          <li>
            <strong>Type badge:</strong> each result shows a small label — Page, Writing, or Feature — so
            you know what kind of content you&rsquo;re looking at before clicking
          </li>
          <li>
            <strong>Click-outside to close:</strong> a <code>mousedown</code> listener on the document
            closes the panel when you click anywhere outside it
          </li>
          <li>
            <strong>Controlled state:</strong> the open/close state is lifted into the Nav component
            so the mobile menu can also trigger the same search overlay without duplicating logic
          </li>
        </ul>

        <p>
          The panel drops down right-aligned under the nav, positioned to line up with the right edge
          of the navigation bar — same max-width and padding as the nav itself, using{" "}
          <code>justify-content: flex-end</code> to push it to that edge.
        </p>

        {/* ── Session 3 ── */}
        <h2>Session 3: The Mobile Bug</h2>
        <p className="post-session-meta">Later that evening — ~30 minutes of debugging</p>
        <p className="post-pace">
          <strong>Pace:</strong> Confusing at first, then a clean fix once the root cause was found.
        </p>

        <p>
          The search worked perfectly on desktop. On mobile, the panel opened — but you
          couldn&rsquo;t type anything into the input. The letters just wouldn&rsquo;t appear.
        </p>

        <p>
          This took a moment to diagnose. The SearchBar component lived inside the site&rsquo;s
          navigation bar — specifically inside the list of nav links. On mobile, those nav links
          are hidden with a CSS rule: <code>display: none</code>. The search icon, being inside
          that hidden list, was also hidden — that was expected. But the search{" "}
          <em>overlay panel</em> was hidden too, even though it used <code>position: fixed</code>{" "}
          which normally takes an element out of the page flow entirely.
        </p>

        <p>
          It turns out <code>display: none</code> is absolute. When a parent element is set to
          display none, every single one of its children is hidden — no exceptions, regardless of
          whether the child is fixed, absolute, or anything else. The overlay panel existed in the
          DOM (React had rendered it), but the browser was refusing to paint it because its great-grandparent
          was invisible.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">CSS lesson</span>
          <p>
            <code>position: fixed</code> breaks free from the normal document layout — but not
            from <code>display: none</code>. A fixed element inside a hidden parent is still hidden.
            If you need an overlay that&rsquo;s always visible regardless of where it lives in your
            component tree, it needs to render outside that tree entirely.
          </p>
        </div>

        <p>
          The fix was a <strong>React Portal</strong>. A portal is a way of rendering a component
          at a completely different location in the page&rsquo;s HTML structure — in this case,
          directly on the <code>{"<body>"}</code> tag, outside the navigation entirely. The component
          still <em>belongs</em> to the nav (React tracks it as part of the same tree for state
          and events), but it <em>renders</em> in a location where no parent can hide it.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Portal implementation</h4>
        <ul>
          <li>
            Imported <code>createPortal</code> from <code>react-dom</code> — this is built into
            React, no new package needed
          </li>
          <li>
            Added a <code>mounted</code> state flag that only becomes <code>true</code> after the
            component loads in the browser — portals require <code>document.body</code> to exist,
            which isn&rsquo;t available during server-side rendering
          </li>
          <li>
            Wrapped the overlay JSX in <code>createPortal(overlay, document.body)</code> — the
            overlay now renders as a direct child of <code>{"<body>"}</code> in the HTML output,
            completely outside the nav&rsquo;s <code>display: none</code> reach
          </li>
          <li>
            Updated the overlay&rsquo;s <code>top</code> position from a hardcoded{" "}
            <code>73px</code> to a dynamic measurement — on open, the component measures the
            actual header height with <code>getBoundingClientRect()</code> so the overlay always
            sits flush below the nav regardless of future layout changes
          </li>
        </ul>

        {/* ── Session 4 ── */}
        <h2>Session 4: Nav Redesign</h2>
        <p className="post-session-meta">Same evening — ~45 minutes of iteration</p>
        <p className="post-pace">
          <strong>Pace:</strong> Fast visual iteration once the layout direction was decided.
        </p>

        <p>
          Adding search also revealed a crowding problem. The navigation bar had been accumulating
          items over time — About, Work, Writing, Fruit Exchange, Contact, a search icon, and a
          yellow Play Numerator button. A new green Fruit Exchange button was added the same session.
          Seven items plus two distinct CTA buttons in a single row was too much.
        </p>

        <p>
          The solution: split the nav into two rows. The first row keeps the text links and search icon.
          The second row holds only the CTA buttons, right-aligned, with room to add more features
          in the future without crowding the primary navigation.
        </p>

        <h4 className="post-dev-heading">🔧 Developer section: Two-row nav layout</h4>
        <ul>
          <li>
            Added a new <code>.nav-cta-row</code> div below the existing <code>.nav-wrap</code> inside
            the <code>{"<header>"}</code> — same <code>max-width</code> and horizontal padding as the
            nav, <code>justify-content: flex-end</code> to right-align the buttons
          </li>
          <li>
            Moved both CTA buttons (Play Numerator and Fruit Exchange) out of the nav links list
            and into the new row, with a tight <code>10px</code> gap between them
          </li>
          <li>
            Changed <code>.nav-wrap</code> from a fixed <code>height: 72px</code> to explicit
            padding (<code>20px 48px 10px</code>) — this reduces the empty space between the first
            row and the second row by half, so the buttons feel connected to the nav rather than
            floating below it
          </li>
          <li>
            Added <code>display: none</code> at the 960px mobile breakpoint for <code>.nav-cta-row</code> —
            on mobile, both CTA buttons live in the hamburger dropdown instead
          </li>
          <li>
            Fruit Exchange was also given a green button style matching{" "}
            <code style={{ background: "#264635", color: "#ffffff", padding: "1px 5px", borderRadius: 3, fontWeight: 700, fontSize: 12 }}>
              #264635
            </code>{" "}
            — same treatment as Numerator&rsquo;s yellow, signaling it as an interactive feature
          </li>
        </ul>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          A site-wide search bar at{" "}
          <a href="https://www.joseandgoose.com" target="_blank" rel="noopener noreferrer">
            joseandgoose.com
          </a>{" "}
          — click the magnifying glass in the nav — with a self-regenerating 14-entry search index
          (7 posts, 5 static pages, 2 features), debounced input, keyboard navigation, yellow
          text highlighting, type badges, mobile support via React portal, and a redesigned
          two-row navigation that has room to grow. Adding a new post now requires one step:
          add it to <code>app/lib/posts.ts</code>.
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>The build script</strong> — once the refactor was done, the generator was
            ~50 lines and ran first try. The terminal printed &ldquo;✓ search-index.json written
            (14 entries)&rdquo; immediately.
          </li>
          <li>
            <strong>The SearchBar component</strong> — keyboard navigation, debounce, highlighting,
            and click-outside all built in one shot. Zero rework on the logic.
          </li>
          <li>
            <strong>The portal fix</strong> — once the root cause was clear (
            <code>display: none</code> hiding fixed children), the fix was three lines. Clean,
            no side effects.
          </li>
          <li>
            <strong>The two-row nav layout</strong> — a straightforward CSS restructure. Moving
            elements into a new container and adjusting padding took under 15 minutes.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Diagnosing the mobile bug</strong> — the symptom (can&rsquo;t type) didn&rsquo;t
            point obviously to the cause (<code>display: none</code> on a grandparent element). It
            took a few minutes of reading the CSS before the connection clicked.
          </li>
          <li>
            <strong>Nav spacing</strong> — multiple rounds of feedback to get the vertical gap
            between the two nav rows to feel tight but not cramped. The final fix was switching
            from a fixed pixel height to explicit top/bottom padding, which let me control each
            side independently.
          </li>
          <li>
            <strong>Mobile Fruit Exchange button CSS</strong> — the generic mobile menu link
            selector was more specific than the button class, requiring a higher-specificity
            selector to override the color. A small thing that was invisible until tested on mobile.
          </li>
        </ul>

        <h3>The decision that made everything else easier</h3>
        <p>
          The five minutes spent deciding <em>not</em> to use a static JSON file changed the
          entire build. It added a refactor (moving the posts array) and a script (the generator),
          but it removed the permanent maintenance cost of keeping a file in sync by hand. Every
          session after that — the search component, the portal fix, the nav redesign — was cleaner
          because the data architecture was right from the start.
        </p>

        <p>
          When you&rsquo;re building on a site you plan to keep adding to, the question isn&rsquo;t
          just &ldquo;what works now?&rdquo; — it&rsquo;s &ldquo;what will I still trust in six
          months?&rdquo; The build script is what I&rsquo;ll still trust.
        </p>

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
