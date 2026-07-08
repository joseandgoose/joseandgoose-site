"use client";

import { useEffect, useRef } from "react";

type Key = "about" | "work" | "writing" | "contact" | "extra";

// Photo per section + the focal point to preserve (matches the tiles' object-position: center 40%).
// Default/idle loading image is About (Jose, red sweatshirt); each tab drives its own image on hover.
// "extra" (clapperboard) is an idle-only 5th slide — it rotates in but is not tied to a tab.
const PHOTOS: Record<Key, { src: string; focal: string }> = {
  about: { src: "/hero.jpeg", focal: "center 32%" },       // Jose, red sweatshirt — default + About
  work: { src: "/title1.jpg", focal: "center 45%" },       // Goose at sunset (red harness)
  writing: { src: "/about-goose.jpg", focal: "center 40%" }, // Goose on the bench
  contact: { src: "/title3.jpg", focal: "center 40%" },    // Goose on the walk (palms)
  extra: { src: "/title2.jpg", focal: "center 40%" },      // clapperboard — idle rotation only
};

const ORDER: Key[] = ["about", "work", "writing", "contact", "extra"];

const HREF_TO_KEY: Record<string, Key> = {
  "/about": "about",
  "/work-and-projects": "work",
  "/writing": "writing",
  "/contact": "contact",
};

// Route photos through Next's image optimizer (resize + WebP) so the large originals
// don't cause a decode flash on swap. q must be 75 — Vercel/Next 16 rejects other
// quality values (400 INVALID_IMAGE_OPTIMIZE_REQUEST) unless images.qualities is configured.
const opt = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;

export default function Hero({ greeting }: { greeting?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<string | undefined>(greeting);

  useEffect(() => {
    greetingRef.current = greeting;
    if (titleRef.current && eyebrowRef.current?.textContent === "About" && greeting) {
      titleRef.current.textContent = greeting;
    }
  }, [greeting]);

  useEffect(() => {
    const stage = stageRef.current;
    const base = baseRef.current;
    if (!stage || !base) return;

    const SECTIONS: Record<Key, { eyebrow: string; title: string; cta: string; href: string }> = {
      about: { eyebrow: "About", title: greetingRef.current || "Jose is the human", cta: "Our story", href: "/about" },
      work: { eyebrow: "Work", title: "Product & strategy", cta: "Explore work", href: "/work-and-projects" },
      writing: { eyebrow: "Writing", title: "Projects & research", cta: "Read essays", href: "/writing" },
      contact: { eyebrow: "Contact", title: "Get in touch", cta: "Say hello", href: "/contact" },
      extra: { eyebrow: "Jose & Goose", title: "Good to see you.", cta: "Our story", href: "/about" },
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current: Key = "about";
    let genToken = 0;
    let inFlight: { inc: HTMLDivElement; timer: number; key: Key; url: string; focal: string } | null = null;
    let autoTimer: number | undefined;

    Object.values(PHOTOS).forEach((p) => { const i = new Image(); i.src = opt(p.src); i.decode?.().catch(() => {}); });

    function wipe(p: number) {
      const k = p * 2;
      let pts: string;
      if (k <= 1) {
        pts = `0% 100%, ${(k * 100).toFixed(2)}% 100%, 0% ${(100 - k * 100).toFixed(2)}%`;
      } else {
        const rx = ((k - 1) * 100).toFixed(2);
        pts = `0% 0%, ${rx}% 0%, 100% ${(100 - (k - 1) * 100).toFixed(2)}%, 100% 100%, 0% 100%`;
      }
      return `polygon(${pts})`;
    }

    function updateCaption(key: Key) {
      const s = SECTIONS[key];
      const left = leftRef.current;
      if (!left) return;
      left.classList.add("pt-swap");
      window.setTimeout(() => {
        if (eyebrowRef.current) eyebrowRef.current.textContent = s.eyebrow;
        // About + the clapperboard slide show the time-of-day greeting
        const usesGreeting = key === "about" || key === "extra";
        if (titleRef.current) titleRef.current.textContent = usesGreeting ? (greetingRef.current || s.title) : s.title;
        if (ctaRef.current) { ctaRef.current.textContent = s.cta; ctaRef.current.setAttribute("href", s.href); }
        left.classList.remove("pt-swap");
      }, 160);
    }

    // Snap an image straight onto the base layer (no animation).
    function commit(key: Key, url: string, focal: string, inc: HTMLDivElement | null) {
      base!.style.backgroundImage = `url(${url})`;
      base!.style.backgroundPosition = focal;
      if (inc && inc.parentNode) inc.parentNode.removeChild(inc);
      current = key;
    }

    // Interrupt a transition already in progress: finalize its target immediately (no rewind).
    function abortInFlight() {
      if (!inFlight) return;
      window.clearTimeout(inFlight.timer);
      commit(inFlight.key, inFlight.url, inFlight.focal, inFlight.inc);
      inFlight = null;
    }

    async function go(key: Key, force = false) {
      if (!force && key === current && !inFlight) return;
      abortInFlight();                        // every request interrupts — hovers always respond
      const myGen = ++genToken;
      updateCaption(key);

      const url = opt(PHOTOS[key].src);
      const focal = PHOTOS[key].focal;
      try { const im = new Image(); im.src = url; await im.decode(); } catch { /* proceed on error */ }
      if (myGen !== genToken) return;         // a newer request superseded us during decode

      const inc = document.createElement("div");
      inc.className = "pt-photo pt-incoming";
      inc.style.backgroundImage = `url(${url})`;
      inc.style.backgroundPosition = focal;
      stage!.appendChild(inc);

      const D = mq.matches ? 360 : 820;
      if (mq.matches) {
        inc.style.opacity = "0";
        inc.style.transition = "opacity 360ms ease";
        requestAnimationFrame(() => { inc.style.opacity = "1"; });
      } else {
        inc.style.clipPath = wipe(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inc.style.transition = `clip-path ${D}ms cubic-bezier(.45,.05,.25,1)`;
            inc.style.clipPath = wipe(1);
          });
        });
      }
      const timer = window.setTimeout(() => {
        commit(key, url, focal, inc);
        if (inFlight && inFlight.inc === inc) inFlight = null;
      }, D + 60);
      inFlight = { inc, timer, key, url, focal };
    }

    const AUTO_INTERVAL = 5200;
    // delay = ms until the NEXT auto-advance; steady interval after that.
    function scheduleAuto(delay: number = AUTO_INTERVAL) {
      window.clearTimeout(autoTimer);
      autoTimer = window.setTimeout(() => {
        if (!inFlight) { const idx = ORDER.indexOf(current); go(ORDER[(idx + 1) % ORDER.length]); }
        scheduleAuto();
      }, delay);
    }

    // Drive the hero from both the top nav AND the "Jump to" tabs.
    const navAnchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("header .nav-links a[href], .jump-inner a[href]"));
    const cleanups: Array<() => void> = [];
    navAnchors.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const key = HREF_TO_KEY[href];
      if (!key) return;
      const onEnter = () => { window.clearTimeout(autoTimer); go(key); };
      // hold the hovered card for 5s before the gallery resumes
      const onLeave = () => { scheduleAuto(5000); };
      a.addEventListener("mouseenter", onEnter);
      a.addEventListener("focus", onEnter);
      a.addEventListener("mouseleave", onLeave);
      cleanups.push(() => { a.removeEventListener("mouseenter", onEnter); a.removeEventListener("focus", onEnter); a.removeEventListener("mouseleave", onLeave); });
    });

    scheduleAuto(10000); // hold the default card for 10s after load

    return () => {
      window.clearTimeout(autoTimer);
      cleanups.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="pt-hero" aria-label="Featured">
      {/* LEFT — solid forest panel, always-legible caption */}
      <div className="pt-left">
        <div className="pt-capwrap" ref={leftRef}>
          <p className="hero-eyebrow" ref={eyebrowRef}>About</p>
          <h1 className="hero-title" ref={titleRef}>{greeting || "Jose is the human"}</h1>
          <a className="hero-cta" ref={ctaRef} href="/about">Our story</a>
        </div>
      </div>

      {/* RIGHT — photo stage that cycles with a diagonal wipe (inset from the right edge) */}
      <div className="pt-stage">
        <div className="pt-frame" ref={stageRef}>
          <div
            className="pt-photo pt-base"
            ref={baseRef}
            style={{ backgroundImage: `url(${opt(PHOTOS.about.src)})`, backgroundPosition: PHOTOS.about.focal }}
          />
        </div>
      </div>

      <style>{`
        .pt-hero{display:grid;grid-template-columns:45% 55%;height:clamp(460px,62vh,600px);overflow:hidden}
        .pt-left{background:var(--forest);padding:32px clamp(32px,5vw,64px);display:flex;flex-direction:column;justify-content:center;color:#fff;overflow:hidden}
        .pt-capwrap{display:flex;flex-direction:column;transition:opacity .34s ease,transform .34s ease}
        .pt-capwrap.pt-swap{opacity:0;transform:translateY(8px)}
        .pt-left .hero-title{margin-bottom:24px}
        .pt-left .hero-cta{width:fit-content}
        .pt-stage{position:relative;overflow:hidden}
        .pt-frame{position:absolute;top:0;bottom:0;left:0;width:90%;overflow:hidden;background:#152a20}
        .pt-photo{position:absolute;inset:0;background-size:cover;background-position:center 40%;will-change:clip-path,opacity,transform}
        .pt-base{z-index:1;animation:pt-drift 18s ease-in-out infinite alternate}
        .pt-incoming{z-index:2}
        @keyframes pt-drift{from{transform:scale(1.005)}to{transform:scale(1.06)}}
        @media (prefers-reduced-motion:reduce){.pt-base{animation:none}}
        @media (max-width:768px){
          .pt-hero{grid-template-columns:1fr;height:auto}
          .pt-left{padding:40px 28px;order:1}
          .pt-stage{order:2;height:300px}
          .pt-frame{width:100%}
        }
      `}</style>
    </section>
  );
}
