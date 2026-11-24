import type { Metadata } from "next";
import { ToolkitView } from "@/components/crm/toolkit-view";
import { getChapterMessageFacts } from "@/lib/crm/message-facts";
import { getProjectionInputs } from "@/lib/crm/projections";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invite toolkit",
  robots: { index: false, follow: false },
};

/**
 * The toolkit, away from any one visitor.
 *
 * The same words are on every visitor page, but a member who wants to invite
 * somebody who is not in the pipeline at all had nowhere to get them. Open to
 * any member: these are the chapter's own messages, not anybody's data.
 */
export default async function CrmToolkitPage() {
  const { member } = await requireChapterMember();
  const [facts, projections] = await Promise.all([
    getChapterMessageFacts(member.chapterId),
    getProjectionInputs(member.chapterId),
  ]);

  return (
    <ToolkitView
      meName={`${member.firstName} ${member.lastName}`.trim()}
      facts={facts}
      projections={projections}
    />
  );
}
