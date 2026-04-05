-- ══════════════════════════════════════════════════
-- Ask Goose — Chat Grading Schema
-- Run this in Supabase SQL Editor after the base RAG schema
-- ══════════════════════════════════════════════════

-- Add graded flag to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS graded BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS chat_sessions_graded_idx ON chat_sessions (graded, created_at);

-- Grades table — one row per graded batch of sessions
CREATE TABLE chat_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_ids UUID[]    NOT NULL,            -- which sessions were graded in this batch
  batch_size  INTEGER   NOT NULL,            -- number of sessions in this batch
  report      TEXT      NOT NULL,            -- full text report from the LLM
  scores      JSONB     NOT NULL DEFAULT '{}', -- structured scores per session
  avg_score   FLOAT,                         -- overall average score for the batch
  graded_by   TEXT      DEFAULT 'qwen3:14b', -- which model graded
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS: read-only public (grades are written by service role from the grading script)
ALTER TABLE chat_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on chat_grades"
  ON chat_grades FOR SELECT
  USING (true);
