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
