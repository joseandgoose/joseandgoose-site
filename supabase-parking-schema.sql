-- Sidewalk Watch — live parking state for the public /parking page.
-- One row (id = 1) holding the latest occupancy payload pushed from the Studio.
-- Run once in the Supabase SQL editor.

create table if not exists parking_state (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint parking_state_singleton check (id = 1)
);

-- Reads and writes both go through server-side Next.js route handlers (which
-- enforce the push key / passphrase), using the anon role — same pattern as the
-- site's other tables. Allow that role to operate on this single table.
alter table parking_state enable row level security;

drop policy if exists parking_state_rw on parking_state;
create policy parking_state_rw on parking_state
  for all to anon
  using (true)
  with check (true);
