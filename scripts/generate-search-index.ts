import { writeFileSync } from "fs";
import { join } from "path";
import { posts } from "../app/lib/posts";

type SearchEntry = {
  type: "page" | "post" | "feature";
  title: string;
  url: string;
  description: string;
  date?: string;
};

const staticEntries: SearchEntry[] = [
  {
    type: "page",
    title: "Home",
    url: "/",
    description: "Jose and Goose — personal site of Jose Delgado and his Miniature Schnauzer.",
  },
  {
    type: "page",
    title: "About",
    url: "/about",
    description: "Jose — product manager at Pet Space. Goose — Miniature Schnauzer from Texas, Brooklyn, and LA.",
  },
  {
    type: "page",
    title: "Work",
    url: "/work",
    description: "Career history: Pet Space, DoorDash, Instacart, Goldman Sachs, Teach for America.",
  },
  {
    type: "page",
    title: "Writing",
    url: "/writing",
    description: "Ideas at the intersection of product, strategy, and building things.",
  },
  {
    type: "page",
    title: "Contact",
    url: "/contact",
    description: "Get in touch — consulting, project recommendations, or book time to chat.",
  },
  {
    type: "feature",
    title: "Numerator",
    url: "/numerator",
    description: "A number guessing game. How fast can you find the secret number?",
  },
  {
    type: "feature",
    title: "Fruit Exchange",
    url: "/fruit-exchange",
    description: "Community map for sharing fruit from backyard trees in your neighborhood.",
  },
];

const postEntries: SearchEntry[] = posts.map((p) => ({
  type: "post",
  title: p.title,
  url: `/writing/${p.slug}`,
  description: p.subtitle,
  date: p.date,
}));

const index = [...staticEntries, ...postEntries];

const outputPath = join(process.cwd(), "public", "search-index.json");
writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`✓ search-index.json written (${index.length} entries)`);
