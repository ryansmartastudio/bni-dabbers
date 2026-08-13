import { requireAuth } from "@/lib/auth";
import { getCurrentMember } from "@/lib/member-access";
import { MemberLinkPending } from "@/components/members/member-link-pending";
import { MyProfileForm } from "@/components/members/my-profile-form";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  await requireAuth();
  const member = await getCurrentMember();

  if (!member || member.status !== "active") {
    return <MemberLinkPending />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <MyProfileForm member={member} />
    </div>
  );
}
