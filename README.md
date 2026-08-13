# BNI Dabbers — Chapter Directory & Meeting Sheets

A fast, mobile-friendly web app for managing the BNI Dabbers member roster, public directory, and weekly meeting sheet exports.

## Features

- Public member directory with LinkedIn QR codes
- Signed-in member roster with contact details
- Admin CRUD for members (Clerk role: `admin` in `publicMetadata`)
- Member self-service profile editing via email invite (Resend + Clerk)
- Chapter settings, charity block and editable QR links
- Exports: directory PDF, Excel roster, A4 meeting sheet booklet

## Stack

- Next.js 15+ (App Router), TypeScript, Tailwind CSS v4
- Clerk authentication
- Neon Postgres + Drizzle ORM
- Resend for member profile invite emails
- Vercel Blob for headshots
- `@react-pdf/renderer` for PDFs, ExcelJS for `.xlsx`

## Setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. In Clerk Dashboard → Sessions → Customize session token, add:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
   Set `NEXT_PUBLIC_APP_URL` to your live site (e.g. `https://www.bnidabbers.co.uk`) so member invite links redirect correctly after sign-in.
   Only set `NEXT_PUBLIC_CLERK_PROXY_URL` if you enable Frontend API proxying in Clerk Dashboard → Domains. Leave it unset when using Clerk's standard DNS/CNAME setup.
3. Set your first admin in Clerk: Users → Metadata → `publicMetadata`: `{ "role": "admin" }`. Additional admins can be invited from Settings → Admins (copy the invite link and send it manually).
4. Verify `bnidabbers.co.uk` in Resend and add `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `RESEND_REPLY_TO` to `.env.local` and Vercel. Member profile invites are sent from the edit member screen → Profile access tab. The email uses the chapter logo from Settings.
5. Push the database schema:
   ```bash
   npm run db:push
   npm run db:seed
   ```
6. Run locally:
   ```bash
   npm run dev
   ```

## Deploy (Vercel)

1. Import the repo to Vercel
2. Add Neon integration (sets `DATABASE_URL`)
3. Add Clerk env vars, `BLOB_READ_WRITE_TOKEN`, Resend keys, and set `NEXT_PUBLIC_APP_URL=https://www.bnidabbers.co.uk`
4. Run `npm run db:push` against production, then `npm run db:seed`

## Meeting sheet structure

1. Cover — chapter name, website, venue, meeting time
2. Leadership & charity — roles from member records, Genie's Wish block, 3 QR codes, bank details
3. This week — presentation, education, training & events
4. Member boxes — auto-flowing pages (4 boxes per page)
5. Guest & visitor pages — blank boxes (count configurable in settings)
