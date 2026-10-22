# Off-page SEO playbook — BNI Dabbers

On-site SEO (pages, sitemap, structured data) is only half the battle. These steps drive local map pack visibility, backlinks, and qualified guest visits.

## 1. Google Business Profile (highest impact)

1. Create or claim a **Google Business Profile** for the chapter meeting location: Wychwood Park Hotel & Golf Club, Weston, Crewe CW2 5GP.
2. Category: **Business networking company** (or closest match).
3. Add website: `https://www.bnidabbers.co.uk`
4. Add weekly hours aligned with guest arrival (from chapter Settings).
5. Upload venue and chapter photos from Settings assets.
6. Post monthly updates (guest visit CTA, TYFCB milestone, charity news).
7. Ask recent **guests** (not only members) for Google reviews mentioning networking and referrals.

## 2. Member backlink campaign

Each member should link to their public profile:

1. Open `/directory/{slug}` while signed in as admin or view any public profile.
2. Copy the **Member badge** HTML snippet.
3. Paste into the member’s website footer or about page.

Template outreach (email to members):

> Hi {name}, please add this one-line link to your website — it helps Google connect your business to BNI Dabbers and sends visitors to your profile: {snippet}

## 3. Event listings

List the weekly breakfast meeting on:

- **Eventbrite** — title: “BNI Dabbers guest visit — business networking Cheshire East”
- **Meetup** — same cadence as `{meetingDay}` mornings

Link to `https://www.bnidabbers.co.uk/visit` in each listing.

## 4. Local citations

Ensure NAP consistency (chapter name, venue, website):

- BNI regional / Cheshire East chapter listing
- South Cheshire Chamber (or equivalent)
- Yell, FreeIndex, Thomson Local (basic listings)

## 5. Monthly GSC query loop

Every month in [Google Search Console](https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.bnidabbers.co.uk%2F):

1. Open **Performance → Search results**.
2. Filter **Queries** with impressions > 20 and average position > 8.
3. For each query, add a FAQ or paragraph to the closest page (`/networking-groups/{town}`, `/trades/{slug}`, or a guide at `/{slug}`).
4. Request indexing via **URL Inspection** for updated URLs only.

## 6. TYFCB sync operations

- Vercel cron: `GET /api/cron/tyfcb` daily (requires `CRON_SECRET` in project env).
- Manual refresh: **Settings → Chapter TYFCB → Refresh now from BNI**.
- After deploy, verify homepage shows the current figure with verified month.
