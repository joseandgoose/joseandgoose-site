import Link from "next/link";
import TLDRBadge from "@/app/components/TLDRBadge";

export const metadata = {
  title: "Gemini Grades the Website Build Difficulty — Jose and Goose",
  description: "I asked Google's AI to independently evaluate how hard it actually was to build joseandgoose.com from scratch with no coding experience",
};

export default function GeminiGrades() {
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
          <span>4 min read</span>
        </div>

        {/* Title */}
        <h1 className="post-title">Gemini Grades the Website Build Difficulty</h1>
        <p className="post-subtitle">I asked Google&rsquo;s AI to evaluate how hard it actually was to build joseandgoose.com from scratch</p>
        <TLDRBadge slug="gemini-grades" />

        {/* ── BODY ── */}
        <div className="post-body">

          <p>
            After writing about how I built this site, I had a nagging question: was I underselling
            the difficulty, or overselling it? When you&rsquo;ve done something yourself, it&rsquo;s
            hard to gauge how hard it actually was. I kept describing the build as
            &ldquo;beginner-friendly&rdquo; — but that&rsquo;s self-assessment from someone who just
            did it and wants others to try.
          </p>

          <p>
            So I asked a different AI to evaluate it. Not Claude, which built the site and would have
            obvious bias. <strong>Gemini</strong> — Google&rsquo;s AI — to read the full build
            writeup and grade the difficulty independently. The question: would an outside perspective
            confirm &ldquo;this is beginner-friendly,&rdquo; or flag steps I&rsquo;d glossed over as
            harder than I admitted?
          </p>

          <p>Gemini&rsquo;s take was that the process is beginner-friendly and designed for someone with no prior coding experience. A non-developer, completed the site in about 6–7 hours spread across three sessions.</p>

          <p>However, &ldquo;easy&rdquo; is relative. While the AI (<strong>Claude</strong>) handles the actual coding, you still have to navigate several technical tools. Here is Gemini's breakdown of the difficulty based on the steps provided:</p>

          {/* ── EASY ── */}
          <h2>1. The &ldquo;Easy&rdquo; Parts (High Success Rate)</h2>

          <ul>
            <li><strong>Design &amp; Content:</strong> Using <strong>Claude</strong> to generate the layout and pages is very fast. You describe what you want, and it gives you the code.</li>
            <li><strong>Deployment:</strong> Using <strong>Vercel</strong> and <strong>GitHub</strong> is streamlined. Once set up, your site goes live almost instantly when you &ldquo;push&rdquo; changes.</li>
            <li><strong>Backend Basics:</strong> Using <strong>Google Forms</strong> for a contact page and <strong>Google Analytics</strong> for tracking is straightforward and requires almost no coding.</li>
          </ul>

          {/* ── MODERATE ── */}
          <h2>2. The &ldquo;Moderate&rdquo; Parts (Where You Might Get Stuck)</h2>

          <ul>
            <li><strong>Environment Setup:</strong> You have to install <strong>Node.js</strong>, use the <strong>Terminal</strong> (command line), and work in <strong>VS Code</strong>. The author notes they hit errors like &ldquo;command not found&rdquo; immediately. You don&rsquo;t need to know why these happen, but you need the patience to ask the AI how to fix them.</li>
            <li><strong>Mobile Responsiveness:</strong> The site looked great on desktop right away, but the author had to do 4–5 rounds of fixes to make it look right on a phone. This requires a bit of &ldquo;back-and-forth&rdquo; with the AI to tweak CSS styling.</li>
          </ul>

          {/* ── TRICKY ── */}
          <h2>3. The &ldquo;Tricky&rdquo; Parts (Technical Hurdles)</h2>

          <ul>
            <li><strong>DNS &amp; Domains:</strong> Connecting a custom domain involves managing three different platforms (<strong>Squarespace</strong>, <strong>Cloudflare</strong>, and <strong>Vercel</strong>). The author ran into a &ldquo;site down&rdquo; error because of conflicting settings between <strong>Cloudflare</strong> and <strong>Vercel</strong>.</li>
          </ul>

          <div className="post-tip">
            <span className="post-tip-label">Tip from the article</span>
            <p>If you use both <strong>Cloudflare</strong> and <strong>Vercel</strong>, set Cloudflare to &ldquo;DNS only&rdquo; to avoid breaking the site.</p>
          </div>

          {/* ── SUMMARY ── */}
          <h2>Summary of Requirements</h2>

          <p>To follow these steps successfully, you don&rsquo;t need to be a coder, but you do need:</p>

          <ul>
            <li><strong>A &ldquo;Tech-Adjacent&rdquo; Mindset:</strong> You should be comfortable downloading software (<strong>VS Code</strong>, <strong>Node.js</strong>) and copy-pasting commands into a terminal.</li>
            <li><strong>An AI Subscription:</strong> The author used the paid version of <strong>Claude</strong> ($20/mo or $200/yr) for the best results.</li>
            <li><strong>Patience for Troubleshooting:</strong> Most of the &ldquo;work&rdquo; isn&rsquo;t writing code; it&rsquo;s fixing small errors that pop up during the setup and domain-linking phases.</li>
          </ul>

          {/* ── VERDICT ── */}
          <h2>Verdict</h2>

          <p>If you are comfortable following a tutorial and aren&rsquo;t afraid of a terminal window, it is highly achievable. If you find installing new software or managing domain settings intimidating, you may still find it a bit frustrating.</p>

        </div>

        {/* Back link bottom */}
        <div className="post-back post-back--bottom">
          <Link href="/writing">← Back to all writing</Link>
        </div>
      </article>
    </>
  );
}
