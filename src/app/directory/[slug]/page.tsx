import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberProfileView } from "@/components/directory/member-profile-view";
import {
  getActiveMembers,
  getMemberBySlug,
  getMemberDisplayName,
} from "@/lib/members";

export const dynamic = "force-dynamic";

type MemberProfilePageProps = PageProps<"/directory/[slug]">;

export async function generateMetadata({
  params,
}: MemberProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);

  if (!member || member.status !== "active") {
    return {
      title: "Member not found | BNI Dabbers",
    };
  }

  const name = getMemberDisplayName(member);
  const description =
    member.profilePublished && member.profileHeadline
      ? member.profileHeadline
      : `${member.company} · ${member.bniSeat} · BNI Dabbers member directory`;

  return {
    title: `${name} | BNI Dabbers`,
    description,
    openGraph: {
      title: `${name} | BNI Dabbers`,
      description,
      images: member.headshotUrl ? [{ url: member.headshotUrl }] : undefined,
    },
  };
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);

  if (!member || member.status !== "active") {
    notFound();
  }

  const activeMembers = await getActiveMembers();
  const relatedMembers = activeMembers
    .filter((item) => item.id !== member.id)
    .slice(0, 4);

  return <MemberProfileView member={member} relatedMembers={relatedMembers} />;
}
