# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Visitors and guests** browsing the public directory before or after a Thursday meeting, deciding whether to connect with a member or visit the chapter.
- **Chapter members** (signed in) viewing full contact details on the roster and exporting meeting materials.
- **Admins** maintaining the roster, chapter settings, charity block, and member public profiles.

## Product Purpose

BNI Dabbers is the digital home for the Cheshire East Dabbers chapter: a public member directory with LinkedIn QR codes, signed-in roster management, and weekly meeting sheet exports (PDF booklet, Excel roster, directory PDF).

Success means visitors can find a member by trade, trust their business enough to refer or connect, and know when and where to attend; admins can keep roster and exports accurate with minimal friction.

## Positioning

Chapter-specific, admin-controlled directory tied to real meeting logistics (venue, times, charity, leadership roles) and export-ready meeting sheets — not a generic business directory.

## Operating Context

- Weekly Thursday breakfast meetings, 06:45–08:30, at Wychwood Park Hotel & Golf Club, Weston, Crewe CW2 5GP.
- Members hold BNI seats (trade categories); some hold chapter roles (President, committees, etc.).
- Charity partner: Genie's Wish, with configurable QR links and bank details on meeting sheets.
- Admins authenticate via Clerk (`publicMetadata.role: admin`); members sign in for roster and exports.

## Capabilities and Constraints

- Public directory: active members only, headshots, BNI seat, company, website, LinkedIn QR.
- Signed-in roster: full contact details; admin CRUD.
- Exports must remain compatible with existing PDF/Excel pipelines.
- Headshots and logos stored on Vercel Blob (public).
- New: per-member public profile pages with AI-assisted company copy, admin-reviewed before publish.
- AI generation grounds on fetched website content only; no invented claims.

## Brand Commitments

- Chapter name: **BNI Dabbers** (Cheshire East).
- BNI brand red: `#cf1f2e` (primary accent).
- Professional, trustworthy tone suitable for B2B networking; UK English.

## Evidence on Hand

- Live member roster in Postgres (names, companies, seats, contact, headshots, websites).
- Chapter settings: venue, meeting times, charity copy, core values, logos.
- No stock photography library; use member headshots and chapter/venue assets from settings.

## Product Principles

1. **Truth over polish** — directory and profiles reflect verified member data; AI copy is draft until admin publishes.
2. **Meeting-first** — surface when, where, and how to visit the chapter prominently on public pages.
3. **Referral-ready** — help visitors understand what each member does and who to refer.
4. **Admin efficiency** — one form, tabbed editing; generate profile copy from website in one action.
5. **Exports unchanged** — public frontend work must not break booklet, directory PDF, or Excel exports.

## Accessibility & Inclusion

- Public pages must be readable, keyboard-navigable, and responsive (mobile-friendly directory for guests at meetings).
- Respect `prefers-reduced-motion` for any added animation.
