import { PortalApp } from "@/components/workshop/portal/portal-app";
import { formatNextMeetingDate } from "@/lib/meeting-date";
import { getLiveSession, sessionConstants } from "@/lib/workshop/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visitor list",
};

export default async function WorkshopPortalPage() {
  const session = await getLiveSession();
  // The templates name a date, so they read as a real invitation rather than
  // a form letter.
  const meetingLabel = formatNextMeetingDate("Thursday") ?? "the next Thursday";

  return (
    <PortalApp constants={sessionConstants(session)} meetingLabel={meetingLabel} />
  );
}
