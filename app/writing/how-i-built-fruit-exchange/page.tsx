import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";

export const metadata = {
  title: "How I Built Fruit Exchange, a Neighborhood Fruit Tree Map — Jose and Goose",
  description: "Building a community fruit tree marketplace with Leaflet maps, email verification, and Harvest Moon styling — all from a plain-English prompt",
};

export default function HowIBuiltFruitExchange() {
  return (
    <article className="post">
      <div className="post-back">
        <Link href="/writing">← All Writing</Link>
      </div>

      <div className="post-meta">
        <span>March 12, 2026</span>
        <span className="post-meta-dot">·</span>
        <span>8 min read</span>
      </div>

      <h1 className="post-title">How I Built Fruit Exchange, a Neighborhood Fruit Tree Map</h1>
      <p className="post-subtitle">
        A map-based community tool where neighbors list backyard fruit trees and others can find them — styled like a 90s farming game, verified with email, and built across three sessions with Claude Code
      </p>

      <div className="post-body">

        {/* ── Recipe Card ── */}
        <div className="post-recipe-meta">
          <div className="post-recipe-row">
            <span className="post-recipe-label">Yield</span>
            <span>A live community fruit tree map at joseandgoose.com/fruit-exchange — neighbors list trees, visitors find free fruit, all on an interactive map</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Difficulty</span>
            <span>Intermediate (Leaflet map integration, Supabase with 4 tables, email verification flow, custom pixel-art CSS)</span>
          </div>
          <div className="post-recipe-row">
            <span className="post-recipe-label">Total Cook Time</span>
            <span>~6 hours across 3 sessions, refined over the following 10 days with user feedback</span>
          </div>
        </div>
        <TLDRBadge slug="how-i-built-fruit-exchange" />

        {/* ── Ingredients ── */}
        <h2>Ingredients</h2>
        <ul>
          <li>
            <strong><a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a> + OpenStreetMap</strong>{" "}
            — interactive map with no API key required <em>(free)</em>
          </li>
          <li>
            <strong><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a></strong>{" "}
            — database for listings, requests, exchanges, and email tokens <em>(free tier)</em>
          </li>
          <li>
            <strong><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a></strong>{" "}
            — sends one-time email verification links to tree owners <em>(free tier)</em>
          </li>
          <li>
            <strong>Claude Code</strong>{" "}
            — terminal AI that wrote every component, route, and CSS class <em>($20/mo)</em>
          </li>
          <li>
            <strong>Press Start 2P</strong>{" "}
            — pixel font from Google Fonts for the Harvest Moon aesthetic <em>(free)</em>
          </li>
        </ul>

        {/* ── Format Note ── */}
        <h2>A Note on Format</h2>
        <p>
          Earlier posts on this site followed the build session-by-session — &ldquo;Session 1,
          evening, 3 hours&rdquo; — because those projects were built in a weekend or two. The
          next few posts cover longer arcs: weeks of incremental work, features that grew over
          time, projects that are still evolving. So the format shifts from build diary to
          retrospective. Same recipe card, same ingredients, same lessons — just a wider lens.
        </p>

        {/* ── The Idea ── */}
        <h2>The Idea: Fruit Trees Are Everywhere and Nobody Knows</h2>
        <p>
          In Los Angeles, there are fruit trees in every other front yard. Lemon trees dropping
          hundreds of lemons. Fig trees with more fruit than a family can eat. Avocado trees
          that produce year-round. Most of that fruit falls on the ground and rots because the
          owner doesn&rsquo;t need it and the neighbors don&rsquo;t know it&rsquo;s available.
        </p>

        <p>
          I wanted a simple tool: a map where you can see which houses near you have fruit trees,
          what&rsquo;s growing, and how to connect with the owner. Not a full marketplace. Not an
          app with logins and profiles. Just a map, a listing form, and a way to say &ldquo;hey,
          can I grab some lemons?&rdquo;
        </p>

        <p>
          The twist: I wanted it to feel like a game. Specifically, like Harvest Moon on the SNES —
          pixel fonts, parchment-colored dialog boxes, chunky buttons. If you&rsquo;re going to build
          a fruit tree finder, it should feel like walking into a village market, not filling out a
          government form.
        </p>

        {/* ── Harvest Moon Styling ── */}
        <h2>Making It Feel Like a Village Market</h2>
        <p>
          The design decision came before any code. I told Claude: &ldquo;style this like Harvest Moon
          SNES dialog boxes — pixel font, parchment backgrounds, chunky borders.&rdquo; That one
          prompt shaped the entire visual language.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Harvest Moon CSS</h4>
        <ul>
          <li><code>.hm-dialog</code> — parchment-colored dialog box with a pixel-style border</li>
          <li><code>.hm-title</code> — headers in Press Start 2P pixel font</li>
          <li><code>.hm-btn</code>, <code>.hm-btn-red</code>, <code>.hm-btn-gold</code> — chunky buttons with hover states</li>
          <li><code>.hm-input</code>, <code>.hm-select</code> — styled form inputs that match the pixel aesthetic</li>
          <li>All classes live in <code>globals.css</code> under a dedicated Harvest Moon section</li>
        </ul>

        <p>
          The font alone does most of the work. Press Start 2P is a free Google Font that looks
          exactly like 90s game UI text. Pair it with warm background colors and thick borders and
          you&rsquo;re immediately in a different world than a typical web form.
        </p>

        <div className="post-tip">
          <span className="post-tip-label">Design constraint as feature</span>
          <p>
            Pixel fonts are hard to read below ~9px. That constraint forced every label and
            description to be short and direct. The UI ended up cleaner because the font
            wouldn&rsquo;t let me be verbose.
          </p>
        </div>

        {/* ── The Map ── */}
        <h2>Building the Map</h2>
        <p>
          Google Maps charges per load. Mapbox needs an API key. Leaflet with OpenStreetMap tiles
          is completely free, no key required, and looks great. The trade-off is that Leaflet is a
          client-side library — it only works inside the browser. Next.js, by default, tries to
          render pages on the server first before sending them to the browser (called server-side
          rendering, or SSR). Leaflet crashes during that server step because there&rsquo;s no
          browser to render into.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Leaflet + Next.js</h4>
        <ul>
          <li>
            <code>FruitMap.tsx</code> is loaded with a &ldquo;dynamic import&rdquo; that tells Next.js: skip this component during server rendering, only load it in the browser
          </li>
          <li>
            Leaflet tries to access <code>window</code> (a browser-only object) on import, which crashes during server rendering. The dynamic import is the standard fix.
          </li>
          <li>
            React&rsquo;s strict mode runs certain code twice during development (on purpose, to catch bugs). That double-run triggers Leaflet&rsquo;s &ldquo;Map container is already initialized&rdquo; error because it tries to create the map twice. Fixed with a guard that checks if the map already exists before creating another one.
          </li>
          <li>Map centers on Los Angeles by default, with fruit tree markers loaded from Supabase on mount</li>
        </ul>

        <p>
          Each fruit type gets its own marker color on the map. Clicking a marker opens a popup
          with the tree details, the owner&rsquo;s Venmo link (if they added one), and an option
          to record an exchange. The map is the entire interface — there&rsquo;s no separate list
          view or search page.
        </p>

        {/* ── The Trust Problem ── */}
        <h2>The Trust Problem: Who Can List a Tree?</h2>
        <p>
          Anyone can look at the map. But listing a tree means putting an address on a public
          page. That needs to be a real person with a real email who actually lives there — not
          someone listing a stranger&rsquo;s house as a prank.
        </p>

        <p>
          The solution: email verification for owners only. When you submit a listing, Resend
          sends a one-time verification link to your email. Click it, and the listing goes live.
          Don&rsquo;t click it, and the listing never appears on the map. The token expires after
          24 hours.
        </p>

        <h4 className="post-dev-heading">&#x1f527; Developer section: Verification flow</h4>
        <ul>
          <li>Owner submits listing → row created in <code>fruit_listings</code> with <code>verified: false</code></li>
          <li>Simultaneously, a token row is created in <code>email_verifications</code> (UUID token, 24hr expiry)</li>
          <li>Resend sends an email with a link to <code>/api/fruit-exchange/verify?token=...</code></li>
          <li>Clicking the link hits the verify API route, which checks the token, marks the listing as verified, and redirects back to the map</li>
          <li>Unverified listings never appear in the map query — the <code>GET /api/fruit-exchange/listings</code> route filters on <code>verified: true</code></li>
        </ul>

        <p>
          Requesters, on the other hand, are fully anonymous. If you see an address that doesn&rsquo;t
          have a tree listed but you know one&rsquo;s there, you can submit a request — no email, no
          account. The request shows up as a different marker style so the community can see where
          demand exists.
        </p>

        {/* ── The Database ── */}
        <h2>Four Tables, Four Purposes</h2>
        <p>
          The data model is intentionally flat. Four Supabase tables, each independent — no
          complex relationships between them. Each table handles one concern:
        </p>

        <ul>
          <li><strong>fruit_listings</strong> — verified owner tree listings (address, fruit type, Venmo link, notes)</li>
          <li><strong>fruit_requests</strong> — anonymous community requests (&ldquo;I think there&rsquo;s a fig tree at this address&rdquo;)</li>
          <li><strong>fruit_exchanges</strong> — successful pickup records with optional ratings (social proof)</li>
          <li><strong>email_verifications</strong> — one-time tokens with 24-hour expiry for owner verification</li>
        </ul>

        <p>
          Ten fruit types are supported: apple, lemon, lime, orange, grapefruit, fig, avocado,
          persimmon, stone fruit, and &ldquo;other&rdquo; with a free-text field. The list came from
          walking Goose around the neighborhood and writing down what I saw.
        </p>

        {/* ── The Components ── */}
        <h2>Six Components, One Page</h2>
        <p>
          The entire feature lives on a single page at <code>/fruit-exchange</code>. No routing,
          no sub-pages. Everything is a modal or popup layered on top of the map:
        </p>

        <ul>
          <li><strong>FruitMap</strong> — the Leaflet map with tree markers and popups</li>
          <li><strong>WelcomeModal</strong> — first-visit explainer (&ldquo;Pick Responsibly &rarr;&rdquo;)</li>
          <li><strong>TreePopup</strong> — detail view when you click a tree marker</li>
          <li><strong>ListTreeModal</strong> — 3-step form for owners to add a tree</li>
          <li><strong>RequestModal</strong> — simple form for anonymous tree requests</li>
        </ul>

        <p>
          Five API routes handle the backend: listings (GET all / POST new), requests,
          verification, exchange recording, and a stats endpoint that returns counts
          for the welcome screen.
        </p>

        {/* ── Final Output ── */}
        <h2>Final Output</h2>

        <p>
          Fruit Exchange went live on March 1 and has been running since. The map loads,
          listings appear, verification emails send, and the Harvest Moon styling gets
          comments every time someone sees it for the first time.
        </p>

        <h3>What went fast</h3>
        <ul>
          <li>
            <strong>The Harvest Moon CSS</strong> — one prompt to Claude describing the aesthetic,
            and the full set of <code>.hm-*</code> classes came back ready to use. The pixel font
            and parchment colors made every component feel cohesive without a design system.
          </li>
          <li>
            <strong>Supabase table setup</strong> — four tables, each under 10 columns. No complex
            relations. The schema took 15 minutes because I kept it flat on purpose.
          </li>
          <li>
            <strong>The verification flow</strong> — Resend was already set up from earlier projects.
            The token-and-verify pattern is simple enough that Claude generated it correctly on the
            first pass.
          </li>
        </ul>

        <h3>What needed patience</h3>
        <ul>
          <li>
            <strong>Leaflet + React strict mode</strong> — the &ldquo;Map container is already initialized&rdquo;
            error only appears in development because React strict mode double-fires effects. The fix
            (a <code>_leaflet_id</code> guard) isn&rsquo;t obvious if you haven&rsquo;t seen it before.
            This one bug ate 45 minutes.
          </li>
          <li>
            <strong>Font sizing at small scales</strong> — Press Start 2P becomes unreadable below ~9px.
            Initial designs had 7px labels that looked great on a MacBook screen but were impossible to
            read on a phone. Bumped the minimum to 8.5px after the first round of feedback.
          </li>
          <li>
            <strong>Welcome modal copy</strong> — the original CTA said &ldquo;Enter Village &rarr;&rdquo;
            which was fun but confusing. Changed to &ldquo;Pick Responsibly &rarr;&rdquo; after feedback
            that it wasn&rsquo;t clear what the button did. Small copy change, big clarity improvement.
          </li>
        </ul>

        <p>
          The thing I like most about Fruit Exchange is that it&rsquo;s not a tool for me. The server
          articles, the Garmin recaps, the alert system — those are all infrastructure I built for
          myself. This is the first feature on the site that exists entirely for other people. Whether
          anyone uses it at scale doesn&rsquo;t matter yet. The fact that it works and it&rsquo;s live
          means the idea is testable, and that&rsquo;s the point.
        </p>

        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
