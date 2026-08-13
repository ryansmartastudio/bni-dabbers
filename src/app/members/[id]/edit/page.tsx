import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMemberAccessState } from "@/lib/member-invites";
import { getMemberById } from "@/lib/members";
import { MemberForm } from "@/components/members/member-form";

type EditMemberPageProps = PageProps<"/members/[id]/edit">;

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  await requireAdmin();
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const accessState = await getMemberAccessState(member);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Edit member</h1>
      <MemberForm member={member} accessState={accessState} />
    </div>
  );
}
