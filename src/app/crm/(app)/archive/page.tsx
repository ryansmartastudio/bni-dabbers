import type { Metadata } from "next";
import { ArchiveView } from "@/components/crm/archive-view";
import { listPipeline } from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  robots: { index: false, follow: false },
};

/**
 * Everyone who has been taken off the board.
 *
 * Open to any member, because restoring is. Permanent deletion lives on the
 * visitor's own page behind an admin check, which is a deliberate extra step
 * rather than an oversight: nothing here deletes in bulk.
 */
export default async function CrmArchivePage() {
  const { member } = await requireChapterMember();
  const visitors = await listPipeline(member.chapterId, { archived: true });

  return <ArchiveView visitors={visitors} />;
}
