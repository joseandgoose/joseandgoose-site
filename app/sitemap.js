import { posts } from "@/app/lib/posts";

// Canonical domain is apex (joseandgoose.com); www 301s to apex via next.config.ts.
// Keep this in sync with the sitemap URL in app/robots.js.
const BASE_URL = "https://joseandgoose.com";

const STATIC_PATHS = ["", "/about", "/work-and-projects", "/writing", "/contact"];

export default function sitemap() {
  const now = new Date();

  const staticPages = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
  }));

  const postPages = posts.map((post) => {
    const parsed = new Date(post.date);
    return {
      url: `${BASE_URL}/writing/${post.slug}`,
      lastModified: isNaN(parsed.getTime()) ? now : parsed,
    };
  });

  return [...staticPages, ...postPages];
}
