-- Credit top-ups: one-off purchases of extra credits.
-- Run once in the Supabase SQL editor. Until it has run, the app works as
-- before and simply shows no top-up balance.

create table if not exists credit_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  credits integer not null check (credits > 0),
  -- What the account was already over its plan by when this was bought;
  -- that amount is not charged to the top-up.
  baseline_overflow integer not null default 0,
  pack text,
  amount_cents integer,
  stripe_session_id text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists credit_topups_user_idx on credit_topups (user_id, expires_at);

-- What each plan period drew from top-ups (spend beyond the plan's own credits).
create table if not exists credit_topup_draws (
  user_id uuid not null references users(id) on delete cascade,
  period_start timestamptz not null,
  drawn integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

alter table credit_topups enable row level security;
alter table credit_topup_draws enable row level security;
-- No policies: only the server (service role) reads or writes these.
