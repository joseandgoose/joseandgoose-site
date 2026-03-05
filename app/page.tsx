"use client";

import { useState, useEffect } from "react";

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

      {/* ── PAGE TITLE BLOCK ── */}
      <div className="page-header" id="about">
        <h1>Jose is the human</h1>
        <p className="tagline">And Goose is the schnauz</p>
      </div>

      {/* ── JUMP BAR ── */}
      <nav className="jump-bar">
        <div className="jump-inner">
          <span className="jump-label">Jump to</span>
          <a href="/about">Who We Are</a>
          <a href="/work-and-projects">Our Work</a>
          <a href="/writing">Writing</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="hero">

        {/* LEFT: green text panel */}
        <div className="hero-text">
          <p className="hero-eyebrow">Product &amp; Strategy</p>
          <h2 className="hero-title">
            {greeting || "Building things with intention."}
          </h2>
          <a href="/work-and-projects" className="hero-cta">Explore Our Work</a>
        </div>

        {/* RIGHT: image panel — replace placeholder with your photo */}
        <div className="hero-img">
          <img src="/hero.jpeg" alt="Jose and Goose" />
        </div>
      </section>

      {/* ── FOUR TILES ── */}
      <section className="tiles" id="work">
        <div className="tiles-grid">

          {/* Tile 1 — swap vis-dark with your image */}
          <article className="tile">
            <div className="tile-visual"><img src="/title1.jpg" alt="Product Design" /></div>
            <p className="tile-category">Experience</p>
            <h3 className="tile-name">Education, Finance, Strategy, and Product</h3>
            <p className="tile-desc">Range of experiences and learning.</p>
            <div className="tile-actions">
              <a href="/work-and-projects" className="btn btn-outline">Experience</a>
            </div>
          </article>

          {/* Tile 2 */}
          <article className="tile">
            <div className="tile-visual"><img src="/title2.jpg" alt="Writing" /></div>
            <p className="tile-category">Writing</p>
            <h3 className="tile-name">Projects and Research</h3>
            <p className="tile-desc">See what we're working on!</p>
            <div className="tile-actions">
              <a href="/writing" className="btn btn-fill">Read Essays</a>
              {/* <a href="#" className="btn btn-outline">Subscribe</a> */}
            </div>
          </article>

          {/* Tile 3 */}
          <article className="tile">
            <div className="tile-visual"><img src="/title3.jpg" alt="Talks" /></div>
            <p className="tile-category">Get in touch</p>
            <h3 className="tile-name">Contact</h3>
            <p className="tile-desc">What questions do you have?</p>
            <div className="tile-actions">
              <a href="/contact" className="btn btn-outline">Contact</a>
            </div>
          </article>

          {/* Tile 4 */}
          <article className="tile">
            <div className="tile-visual"><img src="/title4.jpg" alt="About" /></div>
            <p className="tile-category">About</p>
            <h3 className="tile-name">Who We Are</h3>
            <p className="tile-desc">Where we started.</p>
            <div className="tile-actions">
              <a href="/about" className="btn btn-fill">Our Story</a>
            </div>
          </article>

        </div>
      </section>
    </>
  );
}