import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getAllMembers } from "@/lib/members";
import { BulkInviteMembers } from "@/components/members/bulk-invite-members";
import { MemberCard } from "@/components/members/member-card";
import { MemberTable } from "@/components/members/member-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { role } = await requireAuth();
  const members = await getAllMembers();
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Member roster</h1>
          <p className="text-sm text-muted">
            Full contact details for signed-in chapter members.
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <BulkInviteMembers members={members} />
            <Link href="/members/new">
              <Button>Add member</Button>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 md:hidden">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} showContact showEdit={isAdmin} />
        ))}
      </div>

      <MemberTable members={members} isAdmin={isAdmin} />
    </div>
  );
}
