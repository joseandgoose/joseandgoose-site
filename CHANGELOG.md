# Changelog

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
