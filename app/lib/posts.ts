export type Post = {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
};

export const posts: Post[] = [
  {
    slug: "how-i-built-search",
    title: "How I Built a Self-Updating Search Bar Using Claude Code",
    subtitle: "From architecture decision to React portal — why a simple search bar required a codebase refactor, a build script, and fixing a CSS rule I didn't know existed",
    date: "March 3, 2026",
    readTime: "8 min read",
  },
  {
    slug: "how-i-automated-garmin-recaps",
    title: "How I Automated Daily Garmin Recaps to My Inbox",
    subtitle: "Building a Mac automation that fetches Garmin health data at 7am, generates AI recaps with Claude CLI, and emails them — built across two sessions",
    date: "February 28, 2026",
    readTime: "9 min read",
  },
  {
    slug: "how-i-replaced-google-forms",
    title: "How I Replaced Google Forms with a Custom Contact Form Using Claude Code",
    subtitle: "Building a Supabase-backed contact form with email notifications in 2 hours — 4x faster than my first database project",
    date: "February 28, 2026",
    readTime: "7 min read",
  },
  {
    slug: "how-i-built-greetings",
    title: "How I Built 50+ Dynamic Greetings Using Claude Code",
    subtitle: "Replacing 8 static words with time-aware messages — and learning why iteration beats perfection",
    date: "February 27, 2026",
    readTime: "6 min read",
  },
  {
    slug: "how-i-built-footer",
    title: "How I Built a Universal Footer Using Claude Code",
    subtitle: "Designing and deploying a production-ready footer component in under 30 minutes with terminal-based AI",
    date: "February 27, 2026",
    readTime: "5 min read",
  },
  {
    slug: "how-i-built-numerator",
    title: "How I Built Numerator Using Claude",
    subtitle: "A non-developer builds a full-stack web game from concept to deployment in four sessions",
    date: "February 19, 2026",
    readTime: "8 min read",
  },
  {
    slug: "gemini-grades",
    title: "Gemini Grades the Website Build Difficulty",
    subtitle: "Google\u2019s AI evaluates how hard it actually was to build joseandgoose.com from scratch",
    date: "February 17, 2026",
    readTime: "4 min read",
  },
  {
    slug: "how-i-built-this",
    title: "How I Built JoseAndGoose.com Using Claude",
    subtitle: "A non-developer builds a website from scratch with AI in three sessions",
    date: "February 17, 2026",
    readTime: "6 min read",
  },
];
