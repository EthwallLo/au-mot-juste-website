create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_url text,
  cover_image_source text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- statement-breakpoint
alter table public.articles drop constraint if exists articles_status_check;

-- statement-breakpoint
alter table public.articles add constraint articles_status_check
  check (status in ('draft', 'scheduled', 'published'));

-- statement-breakpoint
alter table public.articles drop constraint if exists articles_scheduled_date_check;

-- statement-breakpoint
alter table public.articles add constraint articles_scheduled_date_check
  check (status <> 'scheduled' or published_at is not null);

-- statement-breakpoint
create index if not exists articles_status_published_at_idx
  on public.articles (status, published_at desc);

-- statement-breakpoint
create or replace function public.set_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- statement-breakpoint
drop trigger if exists articles_set_updated_at on public.articles;

-- statement-breakpoint
create trigger articles_set_updated_at
before update on public.articles
for each row
execute function public.set_articles_updated_at();
