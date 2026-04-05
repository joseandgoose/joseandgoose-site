-- ══════════════════════════════════════════════════
-- Ask Goose — RAG Chunks + Chat Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- Requires pgvector extension (already enabled)
-- ══════════════════════════════════════════════════

-- ── RAG CHUNKS TABLE ──────────────────────────────
-- Stores chunked content with vector embeddings for RAG retrieval.
-- Parallel to content_embeddings (site search stays untouched).

CREATE TABLE rag_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT    NOT NULL,            -- 'post', 'resume', 'project', 'prompt'
  source_id     TEXT    NOT NULL,            -- post slug, 'resume', project key, prompt key
  chunk_index   INTEGER NOT NULL DEFAULT 0,
  title         TEXT    NOT NULL,            -- display title
  section       TEXT,                        -- H2 heading or role name (nullable)
  chunk_text    TEXT    NOT NULL,            -- actual text fed to Claude as context
  url           TEXT,                        -- link back to source page
  metadata      JSONB   DEFAULT '{}',       -- flexible: tags, dates, tech_stack, etc.
  embedding     VECTOR(384) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(content_type, source_id, chunk_index)
);

-- Vector similarity index (ivfflat for ~200 rows; switch to hnsw if >10k)
CREATE INDEX rag_chunks_embedding_idx
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 20);

-- Filter index for content type scoping
CREATE INDEX rag_chunks_type_idx ON rag_chunks (content_type);


-- ── RAG SEARCH FUNCTION ───────────────────────────

CREATE OR REPLACE FUNCTION match_rag_chunks(
  query_embedding  VECTOR(384),
  match_threshold  FLOAT    DEFAULT 0.3,
  match_count      INT      DEFAULT 8,
  filter_types     TEXT[]   DEFAULT NULL
)
RETURNS TABLE (
  id            UUID,
  content_type  TEXT,
  source_id     TEXT,
  chunk_index   INTEGER,
  title         TEXT,
  section       TEXT,
  chunk_text    TEXT,
  url           TEXT,
  metadata      JSONB,
  similarity    FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.content_type,
    rc.source_id,
    rc.chunk_index,
    rc.title,
    rc.section,
    rc.chunk_text,
    rc.url,
    rc.metadata,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM rag_chunks rc
  WHERE
    (filter_types IS NULL OR rc.content_type = ANY(filter_types))
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ── CHAT SESSIONS ─────────────────────────────────

CREATE TABLE chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  sources     JSONB DEFAULT '[]',  -- [{source_id, title, url, similarity}]
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX chat_messages_session_idx ON chat_messages (session_id, created_at);


-- ── RLS POLICIES ──────────────────────────────────
-- rag_chunks: read-only for anon (populated by build script with service role key)

ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on rag_chunks"
  ON rag_chunks FOR SELECT
  USING (true);

-- chat_sessions / chat_messages: anon can insert + read (no auth required for chat)

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on chat_sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on chat_sessions"
  ON chat_sessions FOR SELECT
  USING (true);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on chat_messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on chat_messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Allow public update on chat_sessions"
  ON chat_sessions FOR UPDATE
  USING (true);
