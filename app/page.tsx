"use client";

import { useState, useEffect } from "react";
import Hero from "./Hero";
import { posts } from "./lib/posts";

// Top 3 writing posts by traffic (GA4, Mar 27–Jul 7 2026): views 145 / 75 / 48.
// Surfaced on the homepage to funnel visitors into the highest-converting content.
const TOP_SLUGS = ["how-i-built-ask-goose", "how-i-built-this", "how-i-upgraded-search-to-vectors"];
const TOP_POSTS = TOP_SLUGS
  .map((s) => posts.find((p) => p.slug === s))
  .filter((p): p is (typeof posts)[number] => Boolean(p));

// Greeting variants
const greetings = {
  weekday: {
    morning: [
      "Morning. Iced matcha's ready, Goose is eyeing his breakfast bowl.",
      "Early. Markets somewhere, ideas everywhere. The schnauzer's still asleep.",
      "Good morning. Flat white ready. Goose eyeing his breakfast bowl.",
      "Morning run done. Building mode. The schnauzer's supervising.",
      "Hey. Coffee's for tourists. Matcha's ready. Goose wants myperfectpet fresh food.",
    ],
    midday: [
      "Midday. Building things. Goose is campaigning for Bocce's treats.",
      "Lunch hour. Markets moving. The schnauzer's lunch matters more.",
      "Afternoon. Quick plant check. Someone just got a treat.",
      "Hey. Between meetings and making. Goose votes more treats.",
      "Midday check-in. Ideas flowing. The schnauzer's on patrol.",
    ],
    afternoon: [
      "Afternoon. Goose is on dinner patrol. Myperfectpet fresh food time.",
      "Late afternoon. Dinner first. Walk after. Goose supervises.",
      "Hey. Plants need water. Dog needs dinner. Both happening.",
      "Afternoon. Walk time, then dinner. Schnauzer knows the schedule.",
      "Dinner hour. The schnauzer's most important meeting of the day.",
    ],
    evening: [
      "Evening. Dog fed. Reading time. Goose judges from the couch.",
      "Late night. Maybe drums. Maybe guitar. Definitely winding down.",
      "Hey. Post-dinner build mode. The schnauzer's already half asleep.",
      "Evening. Ideas flowing. Goose is out. World's quiet.",
      "Night reading. The schnauzer gave up hours ago.",
    ],
    night: [
      "Late. Goose is asleep. You should be too.",
      "Night owl? The schnauzer gave up at 9. Consider it.",
      "Very late. Maybe sleep? Just a thought.",
      "Hey night crew. World's quiet. Goose is snoring. Join him?",
      "Early hours. The schnauzer knows something you don't: sleep.",
    ],
  },
  weekend: {
    morning: [
      "Morning. Beach day. Goose is already packed.",
      "Early weekend. Trail run or coast? Goose votes both.",
      "Good morning. No plans, just possibilities. The schnauzer approves.",
      "Weekend mode. Matcha, dog walk, see what happens.",
      "Hey. Farmers market, then beach. Goose has priorities.",
    ],
    midday: [
      "Afternoon. Beach miles logged. Goose is happy.",
      "Midday. Bookshop, dog park, or both. Deciding.",
      "Hey. Wandering the city. Goose's itinerary is full.",
      "Lunch hour. Coast or trail. Bocce's treats either way.",
      "Afternoon exploring. The schnauzer's leading this tour.",
    ],
    afternoon: [
      "Afternoon. Back from the beach. Goose is sandy and hungry.",
      "Late afternoon. Long day out. Dinner time. Schnauzer's ready.",
      "Hey. Trails conquered. Dinner, then couch domination.",
      "Golden hour. Beach done. Myperfectpet fresh food time.",
      "Afternoon. Adventures paused for dinner. Goose insists.",
    ],
    evening: [
      "Evening. Beach tired. Book ready. Goose already asleep.",
      "Good evening. Day's done. Reading mode. The schnauzer's out cold.",
      "Hey. Post-adventure wind down. Goose has been asleep since 7.",
      "Late night. Tomorrow's plan: more beach. Tonight's plan: book.",
      "Night. Adventures done. The dog's recharging for round two.",
    ],
    night: [
      "Late. No plans tomorrow. Still, sleep. Goose agrees.",
      "Night. Beach wore the schnauzer out. Should've worn you out too.",
      "Very late. Tomorrow's adventure requires sleep. The dog knows.",
      "Hey. Weekend recharge includes actual rest. Goose is proof.",
      "Early Sunday. Sleep is the plan. The schnauzer's way ahead.",
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
