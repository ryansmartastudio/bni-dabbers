import { PortalApp } from "@/components/workshop/portal/portal-app";
import { getDefaultChapterId } from "@/lib/chapters";
import { getChapterMessageFacts } from "@/lib/crm/message-facts";
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
  // The templates name the date, the venue, the timings and the size of the
  // room, so they read as a real invitation rather than a form letter. Every
  // one of those facts is already public on the marketing site, so none of it
  // widens what the shared password gets you.
  const facts = await getChapterMessageFacts(await getDefaultChapterId());

  // `?s=` picks a past run. Nothing is read from it before the password is
  // checked: it only selects which session the server-side actions work on,
  // and an unknown id falls back to the newest run with names in it.
  const requested = typeof query.s === "string" ? query.s : null;

  return (
    <PortalApp
      constants={sessionConstants(session)}
      facts={facts}
      requestedSessionId={requested}
    />
  );
}
