import { requireLinkedMember } from "@/lib/member-access";
import { MyProfileForm } from "@/components/members/my-profile-form";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const { member } = await requireLinkedMember();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <MyProfileForm member={member} />
    </div>
  );
}
