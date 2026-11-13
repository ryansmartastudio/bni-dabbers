import { PortalApp } from "@/components/workshop/portal/portal-app";
import { formatNextMeetingDate } from "@/lib/meeting-date";
import { getLiveSession, sessionConstants } from "@/lib/workshop/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visitor list",
};

export default async function WorkshopPortalPage({
  searchParams,
}: PageProps<"/workshop/portal">) {
  const query = await searchParams;
  const session = await getLiveSession();
  // The templates name a date, so they read as a real invitation rather than
  // a form letter.
  const meetingLabel = formatNextMeetingDate("Thursday") ?? "the next Thursday";

  // `?s=` picks a past run. Nothing is read from it before the password is
  // checked: it only selects which session the server-side actions work on,
  // and an unknown id falls back to the newest run with names in it.
  const requested = typeof query.s === "string" ? query.s : null;

  return (
    <PortalApp
      constants={sessionConstants(session)}
      meetingLabel={meetingLabel}
      requestedSessionId={requested}
    />
  );
}
