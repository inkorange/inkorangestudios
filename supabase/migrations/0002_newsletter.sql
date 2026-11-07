-- inkOrange Studios: newsletter double opt-in, send requests and delivery tracking.
--
-- This Supabase project is SHARED with other apps. This file creates and
-- touches only studio_* tables.
--
-- Applied BY HAND (SQL editor or MCP apply_migration), never `supabase db push`.
-- Re-running is safe: every statement is idempotent.
--
-- Each new table: RLS on with NO policies, anon/authenticated revoked,
-- service_role granted. Only server code (service-role key) reads or writes them.

-- Existing signups: add confirmation state. Rows that predate this migration
-- default to 'pending' and must confirm before receiving issues.
alter table public.studio_newsletter_signups
  add column if not exists status text not null default 'pending',
  add column if not exists confirm_token_hash text,
  add column if not exists confirm_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'studio_newsletter_signups_status_check'
      and conrelid = 'public.studio_newsletter_signups'::regclass
  ) then
    alter table public.studio_newsletter_signups
      add constraint studio_newsletter_signups_status_check
      check (status in ('pending', 'confirmed', 'unsubscribed'));
  end if;
end $$;

create unique index if not exists studio_newsletter_signups_confirm_token_idx
  on public.studio_newsletter_signups (confirm_token_hash)
  where confirm_token_hash is not null;

create table if not exists public.studio_newsletter_requests (
  request_id text primary key,
  issue_id text not null,
  kind text not null,
  handled_at timestamptz not null default now()
);
alter table public.studio_newsletter_requests enable row level security;
revoke all on table public.studio_newsletter_requests from anon, authenticated;
grant all on table public.studio_newsletter_requests to service_role;

create table if not exists public.studio_newsletter_sends (
  issue_id text primary key,
  request_id text not null,
  status text not null check (status in ('sending', 'sent', 'failed')),
  subject text,
  html text,
  text_body text,
  recipient_count int,
  failed_count int not null default 0,
  uncertain_count int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.studio_newsletter_sends enable row level security;
revoke all on table public.studio_newsletter_sends from anon, authenticated;
grant all on table public.studio_newsletter_sends to service_role;

create table if not exists public.studio_newsletter_send_batches (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.studio_newsletter_sends (issue_id),
  seq int not null,
  recipients text[] not null,
  status text not null default 'pending' check (status in ('pending', 'in_flight', 'sent', 'uncertain')),
  failed_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique (issue_id, seq)
);
alter table public.studio_newsletter_send_batches enable row level security;
revoke all on table public.studio_newsletter_send_batches from anon, authenticated;
grant all on table public.studio_newsletter_send_batches to service_role;
