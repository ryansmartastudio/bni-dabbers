import type { Metadata } from "next";
import { MemberAccessView } from "@/components/crm/member-access-view";
import { listWelcomeRecipients } from "@/lib/crm/welcome";
import { requireChapterAdmin } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Member access",
  robots: { index: false, follow: false },
};

/**
 * Doubled guard, as with the reports: the proxy checks the role on both
 * hosts and so does this. The page can email the whole chapter, which is the
 * one thing in the CRM that reaches people outside it.
 */
export default async function CrmMembersPage() {
  const { member } = await requireChapterAdmin();
  const recipients = await listWelcomeRecipients(member.chapterId);

  return <MemberAccessView recipients={recipients} />;
}
