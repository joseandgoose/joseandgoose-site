"use client";

import { useState, useEffect } from "react";
import Hero from "./Hero";
import { posts } from "./lib/posts";
import topPosts from "./lib/top-posts.json";

// Top writing posts by GA4 traffic. app/lib/top-posts.json is regenerated at deploy
// time by scripts/refresh-top-posts.ts (reads ~/ga-diagnostics/ga.db on Alienware).
// Falls back to the newest posts if the snapshot's slugs don't resolve.
const RESOLVED = topPosts.slugs
  .map((s) => posts.find((p) => p.slug === s))
  .filter((p): p is (typeof posts)[number] => Boolean(p));
const TOP_POSTS = RESOLVED.length >= 3 ? RESOLVED.slice(0, 3) : posts.slice(0, 3);

// Greeting variants
const greetings = {
  weekday: {
    morning: [
      "The sun's barely up, the matcha's made, and Goose already thinks I'm moving too slow.",
      "It's early, and the first task of the day is convincing Goose that breakfast is coming.",
      "Morning's here, and I'm running on matcha and a plan that's mostly held together with tape.",
      "I went for a run at dawn, and Goose supervised the whole thing from bed.",
      "It's early, and I'm biking over to the coffee shop for a flat white before the day really starts.",
    ],
    midday: [
      "It's the middle of the day, and Goose has been campaigning for a treat. So far he's winning.",
      "It's around lunchtime. The markets are busy, but to Goose, his lunch is the bigger news.",
      "It's midday, and I just biked over to the co-work spot to actually get some things done.",
      "The afternoon's picking up, the ideas are flowing, and Goose is keeping watch for free.",
      "By midday I'd watered the plants and fed Goose, and decided to call all of it progress.",
    ],
    afternoon: [
      "It's late afternoon, and dinner patrol has started — with Goose firmly in charge.",
      "The afternoon's winding down. It's a walk first and dinner after, though Goose would flip the order.",
      "It's late in the day, and I'm biking out for groceries before Goose's dinner clock runs out.",
      "It's nearly dinnertime, and Goose knows the routine better than I do, so dinner it is.",
      "Golden hour's here, and as far as Goose is concerned, dinner is the biggest event of the day.",
    ],
    evening: [
      "It's evening. Goose has been fed, I'm reading, and he's keeping an eye on me from the couch.",
      "The sun's down, and I'm building things after dinner while Goose dozes off beside me.",
      "It's late enough that I might pick up the guitar, but mostly I'm winding down for the night.",
      "It's later in the evening now. The ideas are flowing, Goose is snoring, and the house is quiet.",
      "It's getting late and I'm still going, though Goose gave up hours ago and had the right idea.",
    ],
    night: [
      "It's the middle of the night, and Goose has been asleep for hours already.",
      "It's the small hours now. Goose went to sleep at nine, which turned out to be the smart move.",
      "It's well past midnight, so getting some sleep is finally on the table.",
      "It's quiet in the middle of the night, Goose is snoring, and going to sleep sounds pretty good.",
      "It's very late. Goose worked out sleep a long time ago, and I'm still catching up.",
    ],
  },
  weekend: {
    morning: [
      "It's a slow weekend morning with no agenda, and I'm still deciding what to do with it. Probably the beach.",
      "It's the weekend. The choice was a trail run or the coast, and Goose voted for both.",
      "It's an open morning with no plans, just possibilities, and Goose is fully on board.",
      "A lazy morning of matcha and a slow bike ride to wherever the day takes me.",
      "It's early on the weekend, so it's the farmers market first, then the beach — Goose's priorities, not mine.",
    ],
    midday: [
      "It's midday, the beach miles are done, and Goose is sandy, happy, and one treat heavier.",
      "It's halfway through the day. The choice is a bookshop or the dog park, and I still can't decide.",
      "It's around midday, and I'm biking around the city with no particular place to be.",
      "It's the middle of the day. Coast or trail, it doesn't much matter, since Goose gets a treat either way.",
      "It's midday and I'm out exploring, with Goose leading the way whether I like it or not.",
    ],
    afternoon: [
      "It's late afternoon and we're back from the beach, so Goose is sandy, hungry, and unbothered.",
      "After a long day out, it's dinner and then the couch, and Goose is more than ready.",
      "The afternoon's winding down. The trails are done, and next is dinner and a long stretch on the couch.",
      "Golden hour's glowing, the beach is behind us, and Goose is loudly asking for his dinner.",
      "It's late afternoon, and the adventures paused for dinner because Goose insisted.",
    ],
    evening: [
      "It's evening. Everyone made it home, one of us is covered in sand, and it wasn't me.",
      "The day's over, my book is open, and Goose is already asleep for the night.",
      "It's a quiet evening after a full day out, and Goose has been asleep since seven.",
      "Tonight it's a book and a snoring Goose, and tomorrow it's back to the beach.",
      "It's evening, the adventures are done for now, and Goose is resting up for the next round.",
    ],
    night: [
      "It's late, there's nothing planned for tomorrow, but sleep still sounds right — and Goose agrees.",
      "It's deep into the night. The beach wore Goose out, and it probably should have worn me out too.",
      "It's getting late, and tomorrow's plans will need a well-rested crew.",
      "It's late on a weekend night, and a real recharge means actually resting — something Goose has mastered.",
      "It's early Sunday, sleeping in is the plan, and Goose is already well ahead of me.",
    ],
  },
};

function getGreeting() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;

  // Determine time of day
  let timeOfDay: "morning" | "midday" | "afternoon" | "evening" | "night";
  if (hour >= 7 && hour < 12) timeOfDay = "morning";      // 7am-noon
  else if (hour >= 12 && hour < 16) timeOfDay = "midday"; // noon-4pm
  else if (hour >= 16 && hour < 20) timeOfDay = "afternoon"; // 4pm-8pm
  else if (hour >= 20 && hour < 24) timeOfDay = "evening"; // 8pm-midnight
  else timeOfDay = "night"; // midnight-7am

  // Get appropriate greeting array
  const greetingSet = isWeekend ? greetings.weekend : greetings.weekday;
  const greetingOptions = greetingSet[timeOfDay];

  // Pick a random greeting
  const randomIndex = Math.floor(Math.random() * greetingOptions.length);
  return greetingOptions[randomIndex];
}

export default function Home() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <>
      {/* ── JUMP-TO TABS ── */}
      <nav className="jump-bar">
        <div className="jump-inner">
          <span className="jump-label">Jump to</span>
          <a href="/about">Who We Are</a>
          <a href="/work-and-projects">Our Work</a>
          <a href="/writing">Writing</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      {/* ── PAW-TRAIL HERO ── */}
      <Hero greeting={greeting} />

      {/* ── MOST-READ POSTS (traffic-driven, funnels visitors into top content) ── */}
      <section className="home-popular" id="about" aria-label="Most read posts">
        <div className="home-popular-head">
          <p className="home-popular-eyebrow">Most read</p>
          <h2 className="home-popular-title">Popular posts</h2>
        </div>
        <div className="writing-list">
          {TOP_POSTS.map((post) => (
            <a href={`/writing/${post.slug}`} key={post.slug} className="writing-card">
              <div className="writing-card-meta">
                <span className="writing-card-date">{post.date}</span>
                <span className="writing-card-dot">·</span>
                <span className="writing-card-read">{post.readTime}</span>
              </div>
              <h3 className="writing-card-title">{post.title}</h3>
              <p className="writing-card-subtitle">{post.subtitle}</p>
              <span className="writing-card-link">Read post →</span>
            </a>
          ))}
        </div>
        <div className="home-popular-all">
          <a href="/writing" className="writing-card-link">See all writing →</a>
        </div>
      </section>
    </>
  );
}
