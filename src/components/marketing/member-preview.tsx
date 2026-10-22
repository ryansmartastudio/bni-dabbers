import Link from "next/link";
import type { Member } from "@/db/schema";
import { PublicMemberCard } from "@/components/directory/public-member-card";

type MemberPreviewProps = {
  members: Member[];
  memberCount: number;
};

export function MemberPreview({ members, memberCount }: MemberPreviewProps) {
  if (members.length === 0) return null;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
              Meet the chapter
            </h2>
            <p className="mt-3 text-base text-muted">
              {memberCount} active members across trades and professions — browse the
              full directory to find the right introduction.
            </p>
          </div>
          <Link
            href="/directory"
            className="inline-flex items-center justify-center rounded-md bg-bni px-5 py-3 text-sm font-semibold text-white transition hover:bg-bni-dark"
          >
            Browse all members
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {members.map((member) => (
            <PublicMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
