import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberProfileView } from "@/components/directory/member-profile-view";
import { getAuthContext } from "@/lib/auth";
import { getCurrentMember } from "@/lib/member-access";
import { getMarkdownUrlForHtmlPath } from "@/lib/ai/markdown-paths";
import {
  getActiveMembers,
  getMemberBySlug,
  getMemberDisplayName,
  getMemberProfilePath,
} from "@/lib/members";
import { buildMemberProfileJsonLd } from "@/lib/marketing/structured-data";
import { absoluteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/marketing/json-ld";

export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  const { safeGenerateStaticParams } = await import("@/lib/build-time-db");
  return safeGenerateStaticParams(async () => {
    const members = await getActiveMembers();
    return members.filter((m) => m.slug).map((m) => ({ slug: m.slug! }));
  });
}

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

  const profilePath = getMemberProfilePath(member);
  const markdownUrl = getMarkdownUrlForHtmlPath(profilePath);

  return {
    title: { absolute: `${name} | BNI Dabbers` },
    description,
    alternates: {
      canonical: absoluteUrl(profilePath),
      ...(markdownUrl
        ? {
            types: {
              "text/markdown": markdownUrl,
            },
          }
        : {}),
    },
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

  const { role } = await getAuthContext();
  const currentMember = await getCurrentMember();

  let editHref: string | undefined;
  if (role === "admin") {
    editHref = `/members/${member.id}/edit`;
  } else if (currentMember?.id === member.id) {
    editHref = "/my-profile";
  }

  return (
    <>
      <JsonLd data={buildMemberProfileJsonLd(member)} />
      <MemberProfileView
        member={member}
        relatedMembers={relatedMembers}
        editHref={editHref}
      />
    </>
  );
}
