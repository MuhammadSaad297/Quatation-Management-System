-- Migration: run in Supabase SQL Editor if tables already exist

alter table quotations add column if not exists prepared_by text;
alter table quotations add column if not exists prepared_contact_no text;

alter table company_settings add column if not exists company_name_arabic text;
alter table company_settings add column if not exists document_title text default 'CONTRACT';
alter table company_settings add column if not exists footer_text text;

-- Update existing company settings with ALEAYILA defaults
update company_settings set
  company_name = 'ALEAYILA FURNITURE L.L.C',
  company_name_arabic = 'مفروشات العائلة ذ. م. م',
  address_line1 = 'Near Chalna Mall, Opp. Unisat Liquor, Jerf Industrial 1, Ajman. UAE.',
  phone = '552711322',
  email = 'alayila2024@gmail.com',
  logo_url = '/Logo_transparent.png',
  document_title = 'CONTRACT',
  footer_text = 'Thank you for your business • alayila2024@gmail.com',
  terms_and_conditions = '1. Commencement of work: Start working after receiving 30% deposit.
2. Completion of work: According to site conditions.
3. Payment terms: 30% advance — 30% balance last patmet 40% before dispatching materials.
4. For any queries, please do not hesitate to contact us.'
where company_name = 'Your Company Name' or company_name is null;
