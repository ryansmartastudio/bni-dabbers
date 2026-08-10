import { requireAdmin } from "@/lib/auth";
import { MemberForm } from "@/components/members/member-form";

export default async function NewMemberPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">Add member</h1>
      <MemberForm />
    </div>
  );
}
