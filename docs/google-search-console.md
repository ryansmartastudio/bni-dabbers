# Google Search Console — BNI Dabbers

Production canonical site: **https://www.bnidabbers.co.uk**

## Setup status (completed)

| Step | Status |
|------|--------|
| GSC property `https://www.bnidabbers.co.uk/` | Added |
| Ownership (HTML meta tag) | Verified — you are a verified owner |
| `GOOGLE_SITE_VERIFICATION` on Vercel Production + Preview | Set |
| `NEXT_PUBLIC_APP_URL=https://www.bnidabbers.co.uk` | Set (Production, Preview, Development) |
| Sitemap `/sitemap.xml` submitted | **Success** — 80 URLs discovered (16 Sep 2026) |
| Apex `https://bnidabbers.co.uk` | 308 redirect to www |
| Priority crawl requests (URL Inspection) | Home already indexed; indexing requested for `/networking-groups`, `/networking-groups/nantwich`, `/networking-groups/cheshire-east`, `/networking-groups/crewe`, `/visit` (remaining sitemap URLs crawl via `/sitemap.xml`) |

### Quick links

- [GSC Overview](https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.bnidabbers.co.uk%2F)
- [Sitemaps](https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fwww.bnidabbers.co.uk%2F)
- [Pages (indexing)](https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fwww.bnidabbers.co.uk%2F)
- [Settings](https://search.google.com/search-console/settings?resource_id=https%3A%2F%2Fwww.bnidabbers.co.uk%2F)
- Live sitemap: https://www.bnidabbers.co.uk/sitemap.xml
- Live robots: https://www.bnidabbers.co.uk/robots.txt

## What the app emits

- **Sitemap** — HTML marketing pages, member profiles, and `/md/*.md` mirrors (updates when CMS/settings/members change).
- **Verification meta** — from `GOOGLE_SITE_VERIFICATION` in root layout metadata.
- **Search generative AI** — GSC may show *Inherit from: bnidabbers.co.uk* if a domain property exists on the same Google account.

## If you redeploy or change domain

1. Keep `NEXT_PUBLIC_APP_URL` aligned with the canonical host (www).
2. Do **not** remove `GOOGLE_SITE_VERIFICATION` unless you re-verify another way.
3. After large launches, open **URL Inspection** for new landing pages and use **Request indexing** (Google queues a live test; duplicate requests do not boost priority).

## Optional: domain property (`bnidabbers.co.uk`)

A **URL prefix** property (www) is enough for this site because apex redirects to www and the sitemap uses www URLs. To add a **Domain** property for all subdomains/protocols:

1. GSC → Add property → **Domain** → `bnidabbers.co.uk`
2. Add the TXT record at your DNS host (same place as Vercel DNS).
3. Verify in GSC.

## AI discovery (separate from GSC)

- https://www.bnidabbers.co.uk/llms.txt
- https://www.bnidabbers.co.uk/llms-full.txt
- Markdown mirrors under `/md/…`

These help AI assistants cite the chapter; GSC does not index `llms.txt` for web search, but the HTML landing pages in the sitemap do.

## Rotate verification token

If Google issues a new HTML tag:

```bash
vercel env add GOOGLE_SITE_VERIFICATION production --force
# paste content= value only
vercel deploy --prod
```

Then click **Verify** in GSC → Settings → Ownership verification.
