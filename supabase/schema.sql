-- Quotation Management System - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Quotations table
create table if not exists quotations (
  id uuid primary key default uuid_generate_v4(),
  quotation_no integer not null unique,
  quotation_date date not null default current_date,
  valid_until date,
  customer_name text not null,
  attention text,
  company_name text,
  contact_no text,
  email text,
  project_name text,
  phone text,
  prepared_by text,
  prepared_contact_no text,
  grand_total numeric(12, 2) not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

-- Quotation items table
create table if not exists quotation_items (
  id uuid primary key default uuid_generate_v4(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  sr_no integer not null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0
);

create index if not exists idx_quotation_items_quotation_id on quotation_items(quotation_id);
create index if not exists idx_quotations_quotation_no on quotations(quotation_no desc);
create index if not exists idx_quotations_created_at on quotations(created_at desc);

-- Company settings (configurable logo & company info for PDF)
create table if not exists company_settings (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null default 'ALEAYILA FURNITURE L.L.C',
  company_name_arabic text default 'مفروشات العائلة ذ. م. م',
  address_line1 text default 'Near Chalna Mall, Opp. Unisat Liquor, Jerf Industrial 1, Ajman. UAE.',
  address_line2 text default '',
  phone text default '552711322',
  email text default 'alayila2024@gmail.com',
  website text default '',
  logo_url text default '/Logo_transparent.png',
  logo_base64 text,
  document_title text default 'CONTRACT',
  footer_text text default 'Thank you for your business • alayila2024@gmail.com',
  terms_and_conditions text default '1. Commencement of work: Start working after receiving 30% deposit.
2. Completion of work: According to site conditions.
3. Payment terms: 30% advance — 30% balance last patmet 40% before dispatching materials.
4. For any queries, please do not hesitate to contact us.',
  updated_at timestamptz not null default now()
);

-- Insert default company settings row
insert into company_settings (company_name)
select 'ALEAYILA FURNITURE L.L.C'
where not exists (select 1 from company_settings limit 1);

-- Row Level Security (enable for production; adjust policies as needed)
alter table quotations enable row level security;
alter table quotation_items enable row level security;
alter table company_settings enable row level security;

-- Allow anonymous access for development (replace with auth policies in production)
create policy "Allow all on quotations" on quotations for all using (true) with check (true);
create policy "Allow all on quotation_items" on quotation_items for all using (true) with check (true);
create policy "Allow all on company_settings" on company_settings for all using (true) with check (true);

-- Function to get next quotation number
create or replace function get_next_quotation_no()
returns integer
language plpgsql
as $$
declare
  next_no integer;
begin
  select coalesce(max(quotation_no), 43300) + 1 into next_no from quotations;
  return next_no;
end;
$$;
