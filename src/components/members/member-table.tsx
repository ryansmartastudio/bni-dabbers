import Link from "next/link";
import type { Member } from "@/db/schema";
import { formatChapterRoles, getMemberDisplayName, hasChapterRoles } from "@/lib/members";
import { LinkedInQr } from "@/components/qr/linkedin-qr";
import { MemberWebsiteLink } from "@/components/members/member-website-link";

type MemberTableProps = {
  members: Member[];
  isAdmin?: boolean;
};

export function MemberTable({ members, isAdmin = false }: MemberTableProps) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">BNI Seat</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Website</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">LinkedIn</th>
            {isAdmin ? <th className="px-4 py-3">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">
                {getMemberDisplayName(member)}
              </td>
              <td className="px-4 py-3">{member.company}</td>
              <td className="px-4 py-3">{member.bniSeat}</td>
              <td className="px-4 py-3">
                {hasChapterRoles(member.chapterRoles)
                  ? formatChapterRoles(member.chapterRoles)
                  : "—"}
              </td>
              <td className="px-4 py-3">{member.email}</td>
              <td className="px-4 py-3 whitespace-nowrap">{member.phone}</td>
              <td className="px-4 py-3">
                {member.websiteUrl ? (
                  <MemberWebsiteLink url={member.websiteUrl} />
                ) : (
                  "—"
                )}
              </td>
              <td className="max-w-xs px-4 py-3 text-muted">
                {member.notes ?? "—"}
              </td>
              <td className="px-4 py-3">
                {member.linkedinUrl ? (
                  <LinkedInQr url={member.linkedinUrl} size={56} />
                ) : (
                  "—"
                )}
              </td>
              {isAdmin ? (
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${member.id}/edit`}
                    className="font-medium text-bni hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
