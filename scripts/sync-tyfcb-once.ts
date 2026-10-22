import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { chapterSettings } from "../src/db/schema";
import { getChapterSettings } from "../src/lib/settings";
import {
  DEFAULT_TYFCB_SOURCE_URL,
  fetchTyfcbFromBni,
  isTyfcbSanityOk,
} from "../src/lib/tyfcb";

async function main() {
  const settings = await getChapterSettings();
  const sourceUrl = settings.tyfcbSourceUrl ?? DEFAULT_TYFCB_SOURCE_URL;
  const fetched = await fetchTyfcbFromBni(sourceUrl);
  const previous = settings.tyfcbAmount ? Number(settings.tyfcbAmount) : null;

  if (!isTyfcbSanityOk(previous, fetched.amount)) {
    console.error(JSON.stringify({ success: false, error: "sanity-check-failed" }));
    process.exit(1);
  }

  const now = new Date();
  const changed = previous !== fetched.amount;

  await db
    .update(chapterSettings)
    .set({
      tyfcbAmount: String(fetched.amount),
      tyfcbCurrency: fetched.currency,
      tyfcbCheckedAt: now,
      ...(changed ? { tyfcbUpdatedAt: now } : {}),
      tyfcbSourceUrl: sourceUrl,
      updatedAt: now,
    })
    .where(eq(chapterSettings.id, settings.id));

  console.log(
    JSON.stringify({ success: true, changed, amount: fetched.amount, currency: fetched.currency }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
