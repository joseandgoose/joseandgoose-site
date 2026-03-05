"use client";

import { useState } from "react";

export default function Work() {
  const [active, setActive] = useState<"work" | "projects">("work");

  return (
    <>

      {/* ── PAGE TITLE TOGGLE ── */}
      <div className="page-header">
        <div className="work-toggle">
          <button
            className={`work-toggle-btn${active === "work" ? " work-toggle-active" : ""}`}
            onClick={() => setActive("work")}
          >
            Work
          </button>
          <span className="work-toggle-sep">/</span>
          <button
            className={`work-toggle-btn${active === "projects" ? " work-toggle-active" : ""}`}
            onClick={() => setActive("projects")}
          >
            Projects
          </button>
        </div>
        <p className="tagline">
          {active === "work"
            ? "Coverage, press, and references across my career"
            : "Code I've built and shipped, with AI throughout"}
        </p>
      </div>

      {/* ── JUMP BAR ── */}
      <nav className="jump-bar">
        <div className="jump-inner">
          <span className="jump-label">Jump to</span>
          {active === "work" ? (
            <>
              <a href="#pet-space">Pet Space</a>
              <a href="#doordash">DoorDash</a>
              <a href="#instacart">Instacart</a>
              <a href="#goldman">Goldman Sachs</a>
              <a href="#tfa">Teach for America</a>
            </>
          ) : (
            <>
              <a href="#garmin">Garmin Recap</a>
              <a href="#numerator">Numerator</a>
              <a href="#fruit-exchange">Fruit Exchange</a>
              <a href="#site">This Site</a>
            </>
          )}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="press-main">

        {active === "work" ? (
          <>

            {/* PET SPACE */}
            <section className="press-group" id="pet-space">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Current Work</p>
                <h2 className="press-group-title">Pet Space</h2>
                <p className="press-group-desc">
                  Building DTC products and brands in the pet wellness space.
                </p>
              </div>
              <div className="press-list">
                <a href="https://alpineinvestors.com/update/antelope-acquires-bocces-bakery/" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">Alpine Investors</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2023</span>
                  </div>
                  <h3 className="press-title">Antelope Acquires Bocce's Bakery</h3>
                  <p className="press-desc">Antelope expands its pet wellness portfolio with the acquisition of Bocce's Bakery, a leading natural pet treat brand.</p>
                  <span className="press-link">Read article →</span>
                </a>
                <a href="https://www.prnewswire.com/news-releases/antelope-announces-exciting-acquisition-of-my-perfect-pet-to-further-expand-suite-of-pet-wellness-offerings-302001404.html" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">PR Newswire</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2024</span>
                  </div>
                  <h3 className="press-title">Antelope Acquires My Perfect Pet</h3>
                  <p className="press-desc">Antelope announces the acquisition of My Perfect Pet, further expanding its suite of pet wellness offerings.</p>
                  <span className="press-link">Read article →</span>
                </a>
                <a href="https://www.aol.com/pet-parents-rushing-costco-hands-191000001.html" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">AOL / HuffPost</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2024</span>
                  </div>
                  <h3 className="press-title">Pet Parents Are Rushing to Costco to Get Their Hands On This</h3>
                  <p className="press-desc">Coverage of pet food products gaining traction with mainstream consumers through retail channels.</p>
                  <span className="press-link">Read article →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* DOORDASH */}
            <section className="press-group" id="doordash">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Strategy & Operations</p>
                <h2 className="press-group-title">DoorDash</h2>
                <p className="press-group-desc">
                  Led strategy and operations initiatives across delivery and grocery expansion.
                </p>
              </div>
              <div className="press-list">
                <a href="https://www.theverge.com/2020/8/20/21376552/doordash-grocery-delivery-amazon-instacart-compete-launch-california-midwest" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">The Verge</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">Aug 2020</span>
                  </div>
                  <h3 className="press-title">DoorDash Launches Grocery Delivery to Compete with Instacart and Amazon</h3>
                  <p className="press-desc">DoorDash expands into grocery delivery, launching across California and the Midwest in a direct challenge to Instacart and Amazon Fresh.</p>
                  <span className="press-link">Read article →</span>
                </a>
                <a href="https://www.reddit.com/r/doordash_drivers/comments/wi4j3o/priority_for_shop_and_deliver_orders_should_i_opt/" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">Reddit — r/doordash_drivers</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2022</span>
                  </div>
                  <h3 className="press-title">Priority for Shop & Deliver Orders</h3>
                  <p className="press-desc">Community discussion around the Shop & Deliver product feature and driver prioritization — a product area I worked on directly.</p>
                  <span className="press-link">Read thread →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* INSTACART */}
            <section className="press-group" id="instacart">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Strategy & Operations</p>
                <h2 className="press-group-title">Instacart</h2>
                <p className="press-group-desc">
                  Los Angeles market team lead during Instacart's rapid scale-up during the pandemic.
                </p>
              </div>
              <div className="press-list">
                <a href="https://www.bloomberg.com/news/features/2020-05-06/instacart-was-overwhelmed-by-coronavirus-overnight" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">Bloomberg</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">May 2020</span>
                  </div>
                  <h3 className="press-title">Instacart Was Overwhelmed by Coronavirus Overnight</h3>
                  <p className="press-desc">An inside look at how Instacart scrambled to handle a massive surge in demand as the pandemic transformed grocery shopping overnight.</p>
                  <span className="press-link">Read article →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* GOLDMAN SACHS */}
            <section className="press-group" id="goldman">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Capital Markets</p>
                <h2 className="press-group-title">Goldman Sachs</h2>
                <p className="press-group-desc">
                  Worked on the trading floor on capital markets transactions across Latin America.
                </p>
              </div>
              <div className="press-list">
                <a href="https://www.reuters.com/article/world/americas/colombian-banking-group-grupo-aval-raises-126-billion-at-ipo-idUSKCN0HI1W7/" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">Reuters</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2014</span>
                  </div>
                  <h3 className="press-title">Colombian Banking Group Grupo Aval Raises $1.26 Billion at IPO</h3>
                  <p className="press-desc">Goldman Sachs co-underwrote the IPO of Grupo Aval, Colombia's largest banking group, in one of the largest Latin American capital markets transactions of the year.</p>
                  <span className="press-link">Read article →</span>
                </a>
                <a href="https://www.prnewswire.com/news-releases/banco-macro-sa-announces-primary-follow-on-offering-300464802.html" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">PR Newswire</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2017</span>
                  </div>
                  <h3 className="press-title">Banco Macro S.A. Announces Primary Follow-On Offering</h3>
                  <p className="press-desc">Goldman Sachs acted as underwriter on Banco Macro's follow-on equity offering, one of Argentina's largest banking transactions.</p>
                  <span className="press-link">Read article →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* TEACH FOR AMERICA */}
            <section className="press-group" id="tfa">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Education</p>
                <h2 className="press-group-title">Teach for America</h2>
                <p className="press-group-desc">
                  Taught 6th grade as part of Teach for America's mission to expand educational opportunity.
                </p>
              </div>
              <div className="press-list">
                <a href="https://www.flickr.com/photos/95768996@N02/14064610231/in/photostream/" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">Flickr</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2014</span>
                  </div>
                  <h3 className="press-title">Selected Speaker at the 2014 TFA Gala</h3>
                  <p className="press-desc">Honored to speak at the 2014 Teach for America Gala, celebrating the work of educators and advocates committed to expanding educational opportunity.</p>
                  <span className="press-link">View photo →</span>
                </a>
              </div>
            </section>

          </>
        ) : (
          <>

            {/* GARMIN DAILY RECAP */}
            <section className="press-group" id="garmin">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Local Automation</p>
                <h2 className="press-group-title">Garmin Daily Recap</h2>
                <p className="press-group-desc">Python · Claude CLI · launchd · Resend</p>
              </div>
              <div className="press-list">
                <a href="https://github.com/joseandgoose/garmin-daily-recap" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">GitHub</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">Garmin Daily Recap Automation</h3>
                  <p className="press-desc">Fetches sleep, heart rate, stress, and activity data from Garmin Connect every morning and pipes it into Claude to generate a plain-English health recap — delivered by email by 7am. Runs unattended via launchd.</p>
                  <span className="press-link">View on GitHub →</span>
                </a>
                <a href="/writing/how-i-automated-garmin-recaps" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">joseandgoose.com</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">How I Automated My Garmin Recaps</h3>
                  <p className="press-desc">Build case study covering the two-session process, the launchd challenge, and what I'd do differently.</p>
                  <span className="press-link">Read case study →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* NUMERATOR */}
            <section className="press-group" id="numerator">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Web Game</p>
                <h2 className="press-group-title">Numerator</h2>
                <p className="press-group-desc">Next.js · Supabase · TypeScript</p>
              </div>
              <div className="press-list">
                <a href="https://github.com/joseandgoose/numerator" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">GitHub</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">Numerator — Multiplayer Number Guessing Game</h3>
                  <p className="press-desc">Players guess a number between 1 and 100 with real-time player count and shareable score cards. Built with Next.js and Supabase in a single AI-assisted session.</p>
                  <span className="press-link">View on GitHub →</span>
                </a>
                <a href="/numerator" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">joseandgoose.com</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">Play Numerator</h3>
                  <p className="press-desc">Live at joseandgoose.com/numerator — try the game.</p>
                  <span className="press-link">Play it →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* FRUIT EXCHANGE */}
            <section className="press-group" id="fruit-exchange">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Community Feature</p>
                <h2 className="press-group-title">Fruit Exchange</h2>
                <p className="press-group-desc">Next.js · Supabase · Leaflet · Resend</p>
              </div>
              <div className="press-list">
                <a href="https://github.com/joseandgoose/joseandgoose-site" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">GitHub</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">Fruit Exchange — Community Fruit Tree Map</h3>
                  <p className="press-desc">A map for neighbors to share what their backyard trees produce. List what you're growing, request what you're looking for, connect locally. Map rendering, modal flows, and email verification built in one session.</p>
                  <span className="press-link">View on GitHub →</span>
                </a>
                <a href="/fruit-exchange" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">joseandgoose.com</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">See Fruit Exchange Live</h3>
                  <p className="press-desc">Live at joseandgoose.com/fruit-exchange — explore the map.</p>
                  <span className="press-link">See it live →</span>
                </a>
              </div>
            </section>

            <div className="press-divider" />

            {/* THIS SITE */}
            <section className="press-group" id="site">
              <div className="press-group-header">
                <p className="press-group-eyebrow">Personal Site</p>
                <h2 className="press-group-title">joseandgoose.com</h2>
                <p className="press-group-desc">Next.js · TypeScript · Tailwind · Supabase · Vercel</p>
              </div>
              <div className="press-list">
                <a href="https://github.com/joseandgoose/joseandgoose-site" target="_blank" rel="noopener noreferrer" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">GitHub</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">joseandgoose-site — Full Source</h3>
                  <p className="press-desc">The site you're on. Started as a blank Next.js template — search, contact form, games, maps, and this projects view all added week by week with Claude Sonnet.</p>
                  <span className="press-link">View on GitHub →</span>
                </a>
                <a href="/writing" className="press-item">
                  <div className="press-item-meta">
                    <span className="press-source">joseandgoose.com</span>
                    <span className="press-dot">·</span>
                    <span className="press-date">2026</span>
                  </div>
                  <h3 className="press-title">Build With Me — All Case Studies</h3>
                  <p className="press-desc">Every feature on this site has a published case study: what problem it solved, what AI tools were used, and what I'd do differently.</p>
                  <span className="press-link">Read all case studies →</span>
                </a>
              </div>
            </section>

          </>
        )}

      </main>
    </>
  );
}
