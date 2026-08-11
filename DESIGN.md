# Design system — BNI Dabbers public directory

<!-- impeccable:design-schema 1 -->

## World

**Professional roster ledger.** Warm paper surfaces, BNI red as committed accent, editorial serif display paired with a clear sans UI. Public directory and member profiles share this world; admin tools retain the existing functional UI.

## Palette

| Token | Value | Use |
|-------|-------|-----|
| `--color-bni-red` | `#cf1f2e` | Primary actions, trade seats, rules |
| `--color-bni-red-dark` | `#a81925` | Hover on primary |
| `--color-surface` | `#faf7f2` | Page background |
| `--color-surface-elevated` | `#ffffff` | Cards, panels |
| `--color-surface-muted` | `#f0ebe3` | Secondary panels, QR footers |
| `--color-text-primary` | `#171412` | Body text |
| `--color-text-secondary` | `#5c5752` | Supporting copy |
| `--color-border` | `#ddd4c8` | Borders |
| `--color-ink-muted` | `#8a8278` | Labels, metadata |

## Typography

- **UI:** Figtree (Google Font) with `system-ui` fallback — all text, headings included.
- Headings use weight and tracking only; no serif display face.

Scale: hero up to ~4.75rem bold; section headings 2–3rem semibold; body 1rem with relaxed leading on long copy.

## Components

- **Directory hero:** Full-width ledger panel with BNI red top rule, three fact cards (when / where / chapter), venue image or fallback gradient panel, primary “Browse members” CTA.
- **Public member card:** White elevated card, headshot, name (serif), company, seat in tracked caps, optional profile teaser, LinkedIn QR footer.
- **Member profile:** Two-column header (identity + contact aside), published story/services/referral blocks, related members strip.
- **Admin member form:** Tabbed (`Details` | `Public profile`); profile tab supports AI draft, manual edit, publish toggle.

## Motion

Respect `prefers-reduced-motion`. Public cards use subtle hover lift and image scale only.

## Routes

| Route | Mode | Notes |
|-------|------|-------|
| `/` | Persuade | Directory home with hero + filterable grid |
| `/directory/[slug]` | Persuade | Public member profile |
| `/members/*` | Operate | Unchanged admin roster UI |

## Direction contract

Seed `c02884ca` · Form: Professional roster ledger (candidate 5). Recorded in `src/app/layout.tsx` body comment.
