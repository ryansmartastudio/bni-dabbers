const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function getNextMeetingDate(meetingDay: string, from = new Date()) {
  const target = DAY_INDEX[meetingDay.toLowerCase()];
  if (target === undefined) return null;

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(cursor);
    candidate.setDate(cursor.getDate() + offset);
    if (candidate.getDay() === target) {
      return candidate;
    }
  }

  return null;
}

export function formatNextMeetingDate(meetingDay: string, from = new Date()) {
  const date = getNextMeetingDate(meetingDay, from);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * "26th" — the ending Harry's templates ask for.
 *
 * The teens are the whole reason this is a function rather than a lookup on
 * the last digit: the 11th, 12th and 13th all take "th" even though 1, 2 and
 * 3 take "st", "nd" and "rd" everywhere else.
 */
export function ordinalSuffix(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

/**
 * The date as it appears in an invite message: "Thursday 26th November".
 *
 * Deliberately separate from formatNextMeetingDate, which the marketing site
 * uses and which carries the year. Harry's rule is no year in a message --
 * naming next year in an invitation to next Thursday reads like a form
 * letter -- but the public pages are read by people who do need it.
 */
export function formatMeetingDateForMessage(
  meetingDay: string,
  from = new Date(),
): string | null {
  const date = getNextMeetingDate(meetingDay, from);
  if (!date) return null;
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(date);
  const day = date.getDate();
  return `${weekday} ${day}${ordinalSuffix(day)} ${month}`;
}
