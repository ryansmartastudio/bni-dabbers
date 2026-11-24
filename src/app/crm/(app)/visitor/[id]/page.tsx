import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisitorDetail } from "@/components/crm/visitor-detail";
import { getChapterMessageFacts } from "@/lib/crm/message-facts";
import { findPossibleDuplicates, getVisitor, listTimeline } from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visitor",
  robots: { index: false, follow: false },
};

type VisitorPageProps = PageProps<"/crm/visitor/[id]">;

export default async function VisitorPage({ params }: VisitorPageProps) {
  const { id } = await params;
  const { member } = await requireChapterMember();

  // Scoped by the member's chapter, so a visitor id from another chapter is
  // a 404 rather than a read.
  const visitor = await getVisitor(member.chapterId, id);
  if (!visitor) notFound();

  const timeline = await listTimeline(member.chapterId, id);

  // The templates name the venue, the timings and the number of members, and
  // one of them claims nobody in the room does what this visitor does. The
  // facts carry both, so the words a member copies are true at the moment
  // they copy them.
  const facts = await getChapterMessageFacts(member.chapterId);

  // Three people were suggested twice at the November workshop alone. Records
  // are deliberately never merged, so the warning is how two members avoid
  // inviting the same person twice.
  const duplicates = await findPossibleDuplicates(member.chapterId, {
    name: visitor.name,
    company: visitor.company,
    phone: visitor.phone,
    email: visitor.email,
    excludeId: visitor.id,
  });

  return (
    <VisitorDetail
      visitor={{
        id: visitor.id,
        name: visitor.name,
        company: visitor.company,
        phone: visitor.phone,
        email: visitor.email,
        website: visitor.website,
        category: visitor.category,
        stage: visitor.stage,
        ownerMemberId: visitor.ownerMemberId,
        ownerClaimedAt: visitor.ownerClaimedAt?.toISOString() ?? null,
        invitedAt: visitor.invitedAt?.toISOString() ?? null,
        visitBookedFor: visitor.visitBookedFor ?? null,
        createdAt: visitor.createdAt.toISOString(),
      }}
      timeline={timeline}
      duplicates={duplicates}
      meId={member.id}
      meName={`${member.firstName} ${member.lastName}`.trim()}
      facts={facts}
    />
  );
}
