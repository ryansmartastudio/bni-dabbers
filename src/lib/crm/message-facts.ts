import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { formatMeetingDateForMessage } from "@/lib/meeting-date";
import { getChapterSettings } from "@/lib/settings";
import { formatTyfcbHeadline, isTyfcbDisplayEnabled } from "@/lib/tyfcb";
import {
  OUTREACH_GROUP_NAME,
  seatKey,
  type ChapterMessageFacts,
} from "@/lib/workshop/toolkit";

/**
 * The chapter facts every invite template needs, in one read.
 *
 * Harry's document writes the venue, the timings, the member count and the
 * referral total into the prose. Resolving them here instead means a change
 * of venue or a new TYFCB sync updates six templates at once, and nobody has
 * to remember which ones mentioned the number.
 *
 * All of it is already public on the marketing site, which is why the
 * password-only workshop portal can be handed the same object.
 */
export async function getChapterMessageFacts(
  chapterId: string,
  now = new Date(),
): Promise<ChapterMessageFacts> {
  const [settings, seats] = await Promise.all([
    getChapterSettings(),
    activeSeats(chapterId),
  ]);

  return {
    groupName: OUTREACH_GROUP_NAME,
    venue: settings.venueName,
    meetingDay: settings.meetingDay,
    meetingStart: settings.meetingStart,
    meetingEnd: settings.meetingEnd,
    meetingDate:
      formatMeetingDateForMessage(settings.meetingDay, now) ??
      `the next ${settings.meetingDay}`,
    // "One per trade" counts seats, and one member holds one seat, so the
    // member count and the seat list come out of the same read.
    memberCount: seats.length,
    // Harry's draft hardcoded "over £6 million". The figure the chapter
    // actually publishes is synced monthly from BNI Connect, and a member
    // quoting a number in writing has to be able to stand behind it, so the
    // exact synced figure goes in and the claim moves with the sync. Turning
    // the TYFCB display off empties this, which drops the one template that
    // leans on it rather than sending a sentence with a gap in it.
    referralTotal: isTyfcbDisplayEnabled(settings)
      ? formatTyfcbHeadline(settings)
      : "",
    filledSeats: seats.map((seat) => seatKey(seat)).filter(Boolean),
  };
}

async function activeSeats(chapterId: string): Promise<string[]> {
  const rows = await db
    .select({ seat: members.bniSeat })
    .from(members)
    .where(and(eq(members.chapterId, chapterId), eq(members.status, "active")));
  return rows.map((row) => row.seat);
}
