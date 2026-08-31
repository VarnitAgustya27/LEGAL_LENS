-- =============================================
-- Legal Lens — Inspections Table
-- Run this in Supabase SQL Editor (one time)
-- =============================================

create table if not exists public.inspections (
  id                bigserial primary key,
  case_number       text not null unique,
  product_name      text not null,
  category          text not null default 'Packaged Food',
  manufacturer      text,
  location          text,
  status            text not null default 'REVIEW'
                    check (status in ('COMPLIANT','NON_COMPLIANT','REVIEW')),
  score             numeric(5,2) default 0,
  inspector_name    text,
  inspector_badge   text,
  inspector_email   text,
  declarations      jsonb default '[]'::jsonb,
  violations        jsonb default '[]'::jsonb,
  images            jsonb default '[]'::jsonb,
  ocr_detections    jsonb default '[]'::jsonb,
  notes             text,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────
create index if not exists idx_inspections_status      on public.inspections (status);
create index if not exists idx_inspections_category    on public.inspections (category);
create index if not exists idx_inspections_created_at  on public.inspections (created_at desc);
create index if not exists idx_inspections_case_number on public.inspections (case_number);

-- ── Row Level Security ───────────────────────────────────
alter table public.inspections enable row level security;

create policy "inspections_select"
  on public.inspections for select using (true);

create policy "inspections_insert"
  on public.inspections for insert with check (true);

create policy "inspections_update"
  on public.inspections for update using (true);

-- ── auto updated_at trigger ───────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_inspections_update on public.inspections;
create trigger on_inspections_update
  before update on public.inspections
  for each row execute procedure public.handle_updated_at();

