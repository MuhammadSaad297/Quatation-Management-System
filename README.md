# Quotation Management System

A production-ready quotation management application built with **Angular 20**, **PrimeNG**, **SCSS**, and **Supabase**.

## Features

- Dashboard with search, pagination, edit, delete, duplicate, and PDF actions
- Full quotation form with reactive validation
- Dynamic line items with auto-calculated totals
- Sequential quotation numbering (43301, 43302, …)
- Configurable company logo and settings (used in PDF header)
- Professional PDF generation with **pdfmake** (preview, print, download)
- Responsive UI for desktop, tablet, and mobile

## Tech Stack

- Angular 20 (Standalone Components)
- PrimeNG 20 + PrimeFlex
- Bootstrap Icons
- Supabase (PostgreSQL)
- pdfmake

## Getting Started

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

### 2. Configure Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
};
```

### 3. Install & Run

```bash
cd quotation-management
npm install --legacy-peer-deps
npm start
```

Open [http://localhost:4200](http://localhost:4200)

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
src/app/
├── core/layout/           # App shell & navigation
├── features/quotation/
│   ├── quotation-list/    # Dashboard
│   ├── quotation-form/    # Create / Edit form
│   └── quotation-pdf/     # PDF service & preview
└── shared/
    ├── models/            # TypeScript interfaces
    └── services/          # Supabase & business logic
```

## PDF Layout

PDFs are generated with **pdfmake** for precise control over:

- Header with configurable logo and company details
- Quotation number, date, and validity
- Customer / project information block
- Items table with SR, description, qty, unit price, total
- Grand total
- Terms & conditions (per quotation or company default)
- Professional footer

Upload your logo via **Company Settings** on the quotation form. PDFs automatically use the latest logo.

## Database Tables

| Table | Purpose |
|-------|---------|
| `quotations` | Main quotation records |
| `quotation_items` | Line items (FK → quotations) |
| `company_settings` | Logo, company info, default terms |

## Customizing the PDF Design

If you have a specific quotation template to match, edit:

`src/app/features/quotation/quotation-pdf/quotation-pdf.service.ts`

Adjust colors, spacing, fonts, and table layout in the `buildDocument()` method.

## License

Private / Internal Use
