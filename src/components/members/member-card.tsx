import Image from "next/image";
import Link from "next/link";
import type { Member } from "@/db/schema";
import { getMemberDisplayName, formatChapterRoles, hasChapterRoles } from "@/lib/members";
import { LinkedInQr } from "@/components/qr/linkedin-qr";
import { MemberWebsiteLink } from "@/components/members/member-website-link";

type MemberCardProps = {
  member: Member;
  showContact?: boolean;
  showEdit?: boolean;
};

export function MemberCard({ member, showContact = false, showEdit = false }: MemberCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
          {member.headshotUrl ? (
            <Image
              src={member.headshotUrl}
              alt={getMemberDisplayName(member)}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {getMemberDisplayName(member)}
          </h3>
          <p className="truncate text-sm text-muted">{member.company}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-bni">
            {member.bniSeat}
          </p>
          {hasChapterRoles(member.chapterRoles) ? (
            <p className="text-xs text-muted">
              {formatChapterRoles(member.chapterRoles)}
            </p>
          ) : null}
          {member.websiteUrl ? (
            <MemberWebsiteLink
              url={member.websiteUrl}
              className="mt-1 block truncate text-xs text-bni hover:underline"
            />
          ) : null}
        </div>
        {member.linkedinUrl ? (
          <LinkedInQr url={member.linkedinUrl} size={72} />
        ) : null}
      </div>
      {showContact ? (
        <div className="border-t border-border bg-surface-muted px-4 py-3 text-sm">
          <p>{member.email}</p>
          <p>{member.phone}</p>
          {member.websiteUrl ? (
            <MemberWebsiteLink url={member.websiteUrl} className="mt-1 block" />
          ) : null}
          {member.notes ? (
            <p className="mt-2 text-xs text-muted">{member.notes}</p>
          ) : null}
          {showEdit ? (
            <Link
              href={`/members/${member.id}/edit`}
              className="mt-3 inline-block text-sm font-medium text-bni hover:underline"
            >
              Edit member
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
