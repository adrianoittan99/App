-- Aurora database schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / CREATE OR REPLACE).

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-up user, extends auth.users with app-specific
-- fields collected during onboarding.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  current_age integer,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- accounts: checking / savings / credit / investment balances
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit', 'investment', 'loan')),
  balance numeric not null default 0,
  -- Debt-only fields, all optional — set from the Balances page, not required
  -- at onboarding. apr is a fraction (0.2299 = 22.99%), due_day is 1-31.
  apr numeric,
  minimum_payment numeric,
  due_day integer check (due_day is null or (due_day between 1 and 31)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Widen the type constraint and add the debt columns for projects that ran
-- this file before 'loan' / apr / minimum_payment / due_day existed. Both
-- blocks are no-ops on a fresh database.
alter table public.accounts drop constraint if exists accounts_type_check;
alter table public.accounts add constraint accounts_type_check check (type in ('checking', 'savings', 'credit', 'investment', 'loan'));
alter table public.accounts add column if not exists apr numeric;
alter table public.accounts add column if not exists minimum_payment numeric;
alter table public.accounts add column if not exists due_day integer check (due_day is null or (due_day between 1 and 31));

-- ---------------------------------------------------------------------------
-- transactions: every income/expense entry
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  date date not null,
  merchant text not null,
  category text not null,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- envelopes: one monthly budget limit per category, per user
-- ---------------------------------------------------------------------------
create table if not exists public.envelopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

-- ---------------------------------------------------------------------------
-- goals: savings goals with a target and running saved amount
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '◎',
  color text not null default '#8b5cf6',
  target numeric not null,
  saved numeric not null default 0,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- canceled_subscriptions: merchant keys the user marked "canceled" in the
-- Subscription X-ray (the underlying transactions are left untouched).
-- ---------------------------------------------------------------------------
create table if not exists public.canceled_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant_key text not null,
  canceled_at timestamptz not null default now(),
  unique (user_id, merchant_key)
);

-- ---------------------------------------------------------------------------
-- recurring_transactions: predictable monthly transactions (rent, payroll,
-- subscriptions) defined once. Aurora never logs these on its own — it
-- surfaces them as "due" and the user confirms, so the ledger stays 100%
-- something the user actually approved.
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  merchant text not null,
  category text not null,
  amount numeric not null,
  account_id uuid references public.accounts (id) on delete set null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is locked to "only your own rows,"
-- enforced by the database itself (not just app code).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.envelopes enable row level security;
alter table public.goals enable row level security;
alter table public.canceled_subscriptions enable row level security;
alter table public.recurring_transactions enable row level security;

drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "accounts_owner" on public.accounts;
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_owner" on public.transactions;
create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "envelopes_owner" on public.envelopes;
create policy "envelopes_owner" on public.envelopes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_owner" on public.goals;
create policy "goals_owner" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "canceled_subscriptions_owner" on public.canceled_subscriptions;
create policy "canceled_subscriptions_owner" on public.canceled_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recurring_transactions_owner" on public.recurring_transactions;
create policy "recurring_transactions_owner" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row the moment someone signs up, so the app never
-- has to handle "user exists in auth but has no profile" as a state.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants: RLS policies above decide which ROWS a query can touch, but
-- Postgres still requires a baseline table-level grant before it evaluates
-- RLS at all. The Supabase dashboard adds this automatically when you
-- create a table through the Table Editor with "Automatically expose new
-- tables" on; since these tables were created via SQL (and that setting is
-- best left off for security), grant it explicitly here instead.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update, delete
  on public.profiles, public.accounts, public.transactions, public.envelopes, public.goals, public.canceled_subscriptions,
     public.recurring_transactions
  to authenticated;
