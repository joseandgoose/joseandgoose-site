-- Contact form submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for filtering by read status
CREATE INDEX IF NOT EXISTS idx_submissions_read ON submissions(read);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (anyone can submit the form)
CREATE POLICY "Allow anonymous inserts" ON submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Only authenticated users can read submissions
-- (You'll need to be logged in to Supabase dashboard to view submissions)
CREATE POLICY "Authenticated users can read" ON submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update read status
CREATE POLICY "Authenticated users can update" ON submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
