-- ============================================================================
-- Migration: Create 10xCards Database Schema
-- ============================================================================
-- Purpose: Initialize the complete database schema for the 10xCards flashcard
--          application including users, flashcards, generations, and error logs.
--
-- Affected Tables: flashcards, generations, generation_error_logs
--
-- Special Considerations:
--   - Users table is managed by Supabase Auth (auth.users)
--   - All tables have Row-Level Security (RLS) enabled
--   - Flashcards have an automatic updated_at trigger
--   - Foreign key relationships enforce data integrity
--   - Indexes optimize queries on user_id and generation_id columns
-- ============================================================================

-- ============================================================================
-- Table: flashcards
-- ============================================================================
-- Description: Stores flashcards created by users, either manually or via AI
--              generation. Each card has a front and back, and tracks its source.
-- ============================================================================

create table public.flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- Add comment explaining the source field values
comment on column public.flashcards.source is 
  'Tracks the origin of the flashcard: ai-full (unedited AI), ai-edited (modified AI), manual (user created)';

-- Enable Row-Level Security on flashcards table
alter table public.flashcards enable row level security;

-- Index on user_id for efficient user-specific queries
create index idx_flashcards_user_id on public.flashcards(user_id);

-- Index on generation_id for efficient lookup of cards by generation batch
create index idx_flashcards_generation_id on public.flashcards(generation_id);

-- ============================================================================
-- Table: generations
-- ============================================================================
-- Description: Tracks AI generation sessions including model used, counts of
--              cards generated/accepted, source text metadata, and timing.
-- ============================================================================

create table public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer null,
  accepted_edited_count integer null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add comments explaining key fields
comment on column public.generations.model is 
  'The AI model identifier used for this generation session';

comment on column public.generations.source_text_hash is 
  'Hash of the source text to detect duplicate generation attempts';

comment on column public.generations.source_text_length is 
  'Character count of source text; must be between 1000 and 10000 characters';

comment on column public.generations.generation_duration is 
  'Time taken to generate flashcards in milliseconds';

-- Enable Row-Level Security on generations table
alter table public.generations enable row level security;

-- Index on user_id for efficient user-specific queries
create index idx_generations_user_id on public.generations(user_id);

-- ============================================================================
-- Table: generation_error_logs
-- ============================================================================
-- Description: Logs errors that occur during AI generation attempts for
--              debugging and monitoring purposes.
-- ============================================================================

create table public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- Add comments explaining key fields
comment on column public.generation_error_logs.error_code is 
  'Application-specific error code for categorizing failures';

comment on column public.generation_error_logs.error_message is 
  'Detailed error message for debugging purposes';

-- Enable Row-Level Security on generation_error_logs table
alter table public.generation_error_logs enable row level security;

-- Index on user_id for efficient user-specific queries
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);

-- ============================================================================
-- Foreign Key Constraint: flashcards.generation_id -> generations.id
-- ============================================================================
-- Description: Links flashcards to their generation session. Uses SET NULL
--              on delete to preserve flashcards even if generation record is deleted.
-- ============================================================================

alter table public.flashcards
  add constraint fk_flashcards_generation_id
  foreign key (generation_id)
  references public.generations(id)
  on delete set null;

-- ============================================================================
-- Trigger Function: update_updated_at_column
-- ============================================================================
-- Description: Automatically sets the updated_at column to the current
--              timestamp whenever a row is modified.
-- ============================================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- Trigger: set_updated_at on flashcards
-- ============================================================================
-- Description: Ensures the updated_at column is automatically updated on
--              every modification to a flashcard record.
-- ============================================================================

create trigger set_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- Description: Implements user isolation - each user can only access their
--              own data across all tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for: flashcards
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own flashcards
create policy "Users can select their own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own flashcards
create policy "Users can insert their own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own flashcards
create policy "Users can update their own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own flashcards
create policy "Users can delete their own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Block anonymous users from accessing flashcards (select)
create policy "Anonymous users cannot select flashcards"
  on public.flashcards
  for select
  to anon
  using (false);

-- Policy: Block anonymous users from inserting flashcards
create policy "Anonymous users cannot insert flashcards"
  on public.flashcards
  for insert
  to anon
  with check (false);

-- Policy: Block anonymous users from updating flashcards
create policy "Anonymous users cannot update flashcards"
  on public.flashcards
  for update
  to anon
  using (false);

-- Policy: Block anonymous users from deleting flashcards
create policy "Anonymous users cannot delete flashcards"
  on public.flashcards
  for delete
  to anon
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies for: generations
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own generations
create policy "Users can select their own generations"
  on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own generations
create policy "Users can insert their own generations"
  on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own generations
create policy "Users can update their own generations"
  on public.generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own generations
create policy "Users can delete their own generations"
  on public.generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Block anonymous users from accessing generations (select)
create policy "Anonymous users cannot select generations"
  on public.generations
  for select
  to anon
  using (false);

-- Policy: Block anonymous users from inserting generations
create policy "Anonymous users cannot insert generations"
  on public.generations
  for insert
  to anon
  with check (false);

-- Policy: Block anonymous users from updating generations
create policy "Anonymous users cannot update generations"
  on public.generations
  for update
  to anon
  using (false);

-- Policy: Block anonymous users from deleting generations
create policy "Anonymous users cannot delete generations"
  on public.generations
  for delete
  to anon
  using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies for: generation_error_logs
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own error logs
create policy "Users can select their own error logs"
  on public.generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own error logs
create policy "Users can insert their own error logs"
  on public.generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own error logs
create policy "Users can update their own error logs"
  on public.generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own error logs
create policy "Users can delete their own error logs"
  on public.generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Block anonymous users from accessing error logs (select)
create policy "Anonymous users cannot select error logs"
  on public.generation_error_logs
  for select
  to anon
  using (false);

-- Policy: Block anonymous users from inserting error logs
create policy "Anonymous users cannot insert error logs"
  on public.generation_error_logs
  for insert
  to anon
  with check (false);

-- Policy: Block anonymous users from updating error logs
create policy "Anonymous users cannot update error logs"
  on public.generation_error_logs
  for update
  to anon
  using (false);

-- Policy: Block anonymous users from deleting error logs
create policy "Anonymous users cannot delete error logs"
  on public.generation_error_logs
  for delete
  to anon
  using (false);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   - Created 3 tables: flashcards, generations, generation_error_logs
--   - Enabled RLS on all tables
--   - Created 4 indexes for performance optimization
--   - Implemented granular RLS policies (8 policies per table, 24 total)
--   - Added trigger for automatic updated_at timestamp
--   - Established foreign key relationships with proper cascade behavior
-- ============================================================================
