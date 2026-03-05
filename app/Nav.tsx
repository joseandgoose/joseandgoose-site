"use client";

import { useState } from "react";
import SearchBar from "@/app/components/SearchBar";

const ctaBase = {
  padding: '6px 10px',
  borderRadius: '5px',
  fontWeight: 700,
  fontSize: '8px',
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap' as const,
  lineHeight: 1,
  textDecoration: 'none',
};

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header>
      <div className="nav-wrap">
        <a href="/" className="site-name">Jose and Goose</a>

        {/* Desktop nav */}
        <ul className="nav-links">
          <li><a href="/about">About</a></li>
          <li><a href="/work-and-projects">Work</a></li>
          <li><a href="/writing">Writing</a></li>
          <li><a href="/contact">Contact</a></li>
          <li style={{ display: "flex", alignItems: "center" }}>
            <SearchBar
              open={searchOpen}
              onOpen={() => setSearchOpen(true)}
              onClose={() => setSearchOpen(false)}
            />
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* CTA row — desktop only, right-aligned second row */}
      <div className="nav-cta-row">
        <a href="/numerator" style={{ ...ctaBase, background: '#F3D104', color: '#0a0a0f' }}>
          Play Numerator
        </a>
        <a href="/fruit-exchange" style={{ ...ctaBase, background: '#264635', color: '#ffffff' }}>
          Fruit Exchange
        </a>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="mobile-menu">
          <ul>
            <li><a href="/about" onClick={() => setMenuOpen(false)}>About</a></li>
            <li><a href="/work-and-projects" onClick={() => setMenuOpen(false)}>Work</a></li>
            <li><a href="/writing" onClick={() => setMenuOpen(false)}>Writing</a></li>
            <li><a href="/contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
            <li>
              <a
                href="/numerator"
                className="mobile-play-btn"
                onClick={() => setMenuOpen(false)}
              >
                Play Numerator
              </a>
            </li>
            <li>
              <a
                href="/fruit-exchange"
                className="mobile-fruit-btn"
                onClick={() => setMenuOpen(false)}
              >
                Fruit Exchange
              </a>
            </li>
            <li>
              <button
                className="mobile-search-btn"
                onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px", flexShrink: 0 }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search
              </button>
            </li>
          </ul>
        </nav>
      )}

    </header>
  );
}
