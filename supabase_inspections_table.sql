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

-- ── Seed demo records ─────────────────────────────────────
insert into public.inspections
  (case_number, product_name, category, manufacturer, location, status, score, inspector_name, inspector_badge, is_demo)
values
  ('LM/2026/000482','Pintola High Protein Oats Chocolate 400g','Packaged Food','Das Superfoods Pvt. Ltd.','Sabarkantha, Gujarat','NON_COMPLIANT',42.0,'R. Bhaskaran','LMD-DL-0412',true),
  ('LM/2026/000481','Silkessence Herbal Shampoo 340ml','Cosmetics','Silkessence Care Ltd.','Lajpat Nagar, Delhi','REVIEW',61.0,'A. Mehta','LMD-DL-0418',true),
  ('LM/2026/000479','Suvarna Refined Sunflower Oil 1L','Packaged Food','Suvarna Agro Industries','Connaught Place, Delhi','COMPLIANT',95.0,'S. Iyer','LMD-REV-008',true),
  ('LM/2026/000477','Zesto Orange Drink 500ml','Beverages','Zesto Beverages Pvt. Ltd.','Rohini, Delhi','COMPLIANT',92.0,'R. Bhaskaran','LMD-DL-0412',true),
  ('LM/2026/000474','Glow & Co. Vitamin C Cream 50g','Cosmetics','Glow & Co. Cosmetics (Imported)','Nehru Place, Delhi','NON_COMPLIANT',38.0,'A. Mehta','LMD-DL-0418',true),
  ('LM/2026/000470','Crispo Potato Wafers 90g','Packaged Food','Crispo Snacks Ltd.','Dwarka, Delhi','NON_COMPLIANT',35.0,'S. Iyer','LMD-REV-008',true),
  ('LM/2026/000468','HomeShine Dish Wash Gel 500ml','Household Chemicals','HomeShine Chemicals Pvt. Ltd.','Pitampura, Delhi','COMPLIANT',91.0,'R. Bhaskaran','LMD-DL-0412',true)
on conflict (case_number) do nothing;
