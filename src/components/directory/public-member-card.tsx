import Image from "next/image";
import Link from "next/link";
import type { Member } from "@/db/schema";
import {
  formatChapterRoles,
  getMemberDisplayName,
  getMemberProfilePath,
  hasChapterRoles,
} from "@/lib/members";
import { ChevronIcon } from "@/components/ui/chevron-icon";
import { LinkedInQr } from "@/components/qr/linkedin-qr";

type PublicMemberCardProps = {
  member: Member;
};

export function PublicMemberCard({ member }: PublicMemberCardProps) {
  const profilePath = getMemberProfilePath(member);
  const hasPublishedProfile =
    member.profilePublished &&
    Boolean(member.profileHeadline || member.profileSummary);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_40px_-34px_rgba(23,20,18,0.55)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-bni-red)_35%,var(--color-border))]">
      <Link href={profilePath} className="flex flex-1 flex-col p-5">
        <div className="flex gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted ring-1 ring-border">
            {member.headshotUrl ? (
              <Image
                src={member.headshotUrl}
                alt={getMemberDisplayName(member)}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No photo
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
              {getMemberDisplayName(member)}
            </h3>
            <p className="mt-1 truncate text-sm text-muted">{member.company}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-bni">
              {member.bniSeat}
            </p>
            {hasChapterRoles(member.chapterRoles) ? (
              <p className="mt-1 text-xs text-muted">
                {formatChapterRoles(member.chapterRoles)}
              </p>
            ) : null}
          </div>
        </div>

        {hasPublishedProfile ? (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
            {member.profileHeadline ?? member.profileSummary}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            View profile for contact details and company information.
          </p>
        )}

        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bni">
          Open profile
          <ChevronIcon />
        </span>
      </Link>

      {member.linkedinUrl ? (
        <div className="flex items-center justify-between border-t border-border bg-surface-muted/50 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
            LinkedIn
          </p>
          <LinkedInQr url={member.linkedinUrl} size={64} />
        </div>
      ) : null}
    </article>
  );
}
