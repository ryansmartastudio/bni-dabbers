import type { Metadata } from "next";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { listPipeline } from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visitor pipeline",
  robots: { index: false, follow: false },
};

export default async function CrmPage() {
  // The chapter comes from the member, so the query below cannot be widened
  // by anything in the URL.
  const { member } = await requireChapterMember();
  const visitors = await listPipeline(member.chapterId);

  return (
    <PipelineBoard
      visitors={visitors}
      meId={member.id}
      meName={`${member.firstName} ${member.lastName}`.trim()}
    />
  );
}
