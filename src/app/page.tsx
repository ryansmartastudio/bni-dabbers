import { getActiveMembers } from "@/lib/members";
import { getChapterSettings } from "@/lib/settings";
import { MemberCard } from "@/components/members/member-card";
import { DatabaseSetupError } from "@/components/setup/database-error";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let members;
  let settings;

  try {
    [members, settings] = await Promise.all([
      getActiveMembers(),
      getChapterSettings(),
    ]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect to the database.";

    if (message.includes("DATABASE_URL") || message.includes("connection string")) {
      return <DatabaseSetupError message={message} />;
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-10 rounded-2xl border border-border bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-bni">
          Cheshire East
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          {settings.chapterName}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted">
          Member directory for visitors and guests. Scan a LinkedIn QR code to
          connect with our chapter members.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <span>
            {settings.meetingDay}s · {settings.meetingStart}–{settings.meetingEnd}
          </span>
          <span>
            {settings.venueName}, {settings.venueAddress}
          </span>
        </div>
      </section>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Members</h2>
          <p className="text-sm text-muted">{members.length} active members</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
            No active members yet. Sign in as an admin to add the roster.
          </p>
        ) : (
          members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))
        )}
      </div>
    </div>
  );
}
