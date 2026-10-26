create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  nonce uuid not null default gen_random_uuid(),
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmation_expires_at timestamptz not null default (now() + interval '24 hours'),
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'active' or confirmed_at is not null)
);

-- statement-breakpoint
create table if not exists public.newsletter_publications (
  article_id uuid primary key references public.articles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  run_id text,
  started_at timestamptz,
  completed_at timestamptz
);

-- statement-breakpoint
create table if not exists public.newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'article')),
  nonce uuid not null,
  subject text not null,
  html text not null,
  text text not null,
  action_url text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'cancelled', 'uncertain')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error_code text,
  provider_message_id text
);

-- statement-breakpoint
create index if not exists newsletter_deliveries_pending_idx
  on public.newsletter_deliveries (status, available_at);

-- statement-breakpoint
create table if not exists public.newsletter_rate_limits (
  bucket text primary key,
  count integer not null default 1,
  expires_at timestamptz not null
);
