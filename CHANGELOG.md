# Changelog

## v1.4.0 — 2026-04-23

### Added
- New writing post: `/writing/grading-the-grader` — "Grading the grader: qwen 1.5b vs 7b" (8 min read). Compares the old (qwen2.5:1.5b) vs new (qwen2.5:7b-instruct-q4_K_M) chatbot graders across 55 real Ask Goose sessions, with three hand-rolled inline SVG charts (per-metric means, accuracy distribution, fallback distribution). Includes hypothetical positioning for Claude Haiku 4.5 and Sonnet 4.6 on the same capability ladder. Tags: AI Tools, Product Thinking, Automation.
- TL;DR by Goose, topic tags, related-posts index, and 15 RAG chunks upserted to Supabase `rag_chunks` so Ask Goose can retrieve and cite the post.

### Notes (Alienware-side work captured here for reference)
- `sync-goose-sheets.py` rewritten to track multiple graders side-by-side. Keyed by `chat_grades.graded_by`, writes model-specific column blocks (qwen-1.5b + qwen-7b, six metrics each) into the Google Sheet. New backfill pass populates grade cells on existing rows when later graded. `MODELS` list at top makes adding Haiku/Sonnet a one-line change.
- New "Grader Comparison" tab on the Google Sheet — per-metric summary, score distributions, 7 findings, and hypothetical Claude Haiku/Sonnet positioning.

## v1.3.4 — 2026-04-21

### Changed
- Ask Goose grading: upgraded model from `qwen2.5:1.5b` to `qwen2.5:7b-instruct-q4_K_M` for more reliable rubric scoring (~Haiku-tier reasoning on short chat sessions)
- Grading cron: changed from `0 3 * * *` daily batch-of-5 to `*/15 * * * *` one-session-per-fire with lockfile, `--once` flag, and thermal-gate skip. Natural ~7-on / 7-off cadence respects Alienware thermal headroom
- Backfill: new `fetch_next_ungraded_by_current_model()` auto-selects oldest session not yet graded by the current model. Old 1.5B grades preserved as separate `graded_by` rows
- Timeouts raised to 1200s main / 900s retry for slower 7B inference

### Infrastructure notes
- Script on Alienware: `/home/jd/ai-jobs/grade-ask-goose.py` (backup at `.bak-2026-04-21`)
- Grading time ~7-8 min/session at CPUQuota=250%

## v1.3.3 — 2026-04-05

### Fixed
- iOS Safari mobile: input auto-zoom (font-size 14→16px), horizontal scroll (overflow-wrap on bubble content), pinch-zoom (touch-action: manipulation on panel), rubber-band scroll bleed (overscroll-behavior: contain)

### Added
- Google Sheet grading pipeline — chatbot interactions synced daily from Supabase with LLM scores from chat_grades, Jose columns for manual grading
- sync-goose-sheets.py on Alienware (cron 5:30 AM) — reads chat_messages + chat_grades, appends full untruncated responses to Google Sheet via service account

## v1.3.2 — 2026-04-05

### Fixed
- Chat widget overflowed mobile viewport — header pushed off-screen, excess white space around suggestions
- Mobile keyboard pushed chat panel up instead of resizing to fit available space

### Changed
- Replaced starter prompt "What AI prompts does Jose use?" with "How did Jose build this site?" (better RAG coverage)

## v1.3.1 — 2026-04-05

### Fixed
- Ask Goose broken in production — ANTHROPIC_API_KEY missing from Vercel env vars
- Chat widget spinner hung indefinitely on API errors — now surfaces error message to user

### Added
- Fail-fast env validation in /api/chat — missing keys break the build instead of failing silently per-request

## v1.3.0 — 2026-04-04

### Added
- Ask Goose RAG chatbot — Claude Haiku streaming responses grounded in 300+ embedded content chunks
- Supabase schema: rag_chunks (pgvector), chat_sessions, chat_messages, chat_grades tables
- RAG embedding pipeline (scripts/generate-rag-chunks.ts) — chunks posts by H2 sections, resume roles, projects, prompt library
- Structured data files: data/resume.json, data/projects.json, data/prompts.json
- /api/chat streaming endpoint with keyword-boosted retrieval and page-aware context injection
- /ask-goose full-page chat UI with chat bubbles, character counter, 10-question limit, source citations
- Floating chat widget on every page (AskGooseWidget) — persists conversation across navigation via sessionStorage
- Inline link rendering for /paths and **bold** in chat responses
- Chat QA grading script (scripts/grade-ask-goose.py) — Ollama qwen2.5:1.5b on Alienware, cron at 8pm daily
- Supabase grades schema (chat_grades table, graded flag on chat_sessions)
- New writing post: "How I Built Ask Goose, a RAG Chatbot for My Personal Site"
- Ask Goose, Market Daily, TrophyManager Bot added to Projects tab
- Ask Goose added to search index

### Changed
- System prompt tuned for brevity (1 paragraph ideal) with /contact fallback for unknown answers
- Chat history trimmed to last 1 exchange to prevent cross-topic bleed
- Yellow SVG paw icon in widget header for visibility on dark green

### Security
- Removed hardcoded email from garmin-daily-recap public repo (pushed to GitHub)

## v1.2.0 — 2026-04-04

### Added
- AI tag generation script (scripts/generate-tags.ts) — Claude Haiku classifies posts into 11-tag taxonomy
- Related posts script (scripts/generate-related.ts) — cosine similarity on Supabase vector embeddings
- PostTags component — tag pills displayed on individual post pages
- RelatedPosts component — 2 related post cards at bottom of each post page
- Static data files: app/lib/tags.json, app/lib/related.json
- New writing post: "How I Built an AI Content Pipeline for Every Writing Post"

### Changed
- posts.ts tags replaced with AI-generated taxonomy (AI Tools, Backend, Frontend, Automation, Product Thinking, Game Dev, Data, DevOps, Security, API Design, Linux)
- Reading times verified and updated via word count (230 wpm)
- WritingFilter derives ALL_TAGS dynamically from posts array (was hardcoded 5 tags)
- All 19 post pages updated with PostTags and RelatedPosts imports

## v1.1.0 — 2026-04-04

### Added
- Semantic vector search using pgvector in Supabase with cosine similarity
- content_embeddings table (384-dim vectors via all-MiniLM-L6-v2)
- scripts/generate-embeddings.ts for local embedding generation
- /api/search route using Hugging Face Inference API for query embedding
- Vector fallback in SearchBar when keyword search returns 0 results
- New writing post: "How I Upgraded Search to Semantic Vector Embeddings"
- SVG visualization of vector embedding clusters in new post
- HF_TOKEN added to Vercel environment variables

### Changed
- CLAUDE.md updated with embedding generation step in content pipeline
- Search index now includes 25 entries (18 posts)

## v1.0.0 — 2026-03-31

### Added
- 5 new writing posts: Fruit Exchange, Market Daily, TrophyManager Bot, Cron Ops, API Server
- Retrospective format note introducing a secondary writing style for longer-arc projects
- Goose references and plain-language glossing across all new articles
- TL;DR entries and search index updates for all new posts

### Security
- Scrubbed all server-specific details from articles (IPs, ports, subnets, usernames, file paths, service names)
- Genericized TrophyManager AJAX endpoints to avoid ToS exposure
