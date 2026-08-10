"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Member } from "@/db/schema";
import {
  createMember,
  updateMember,
  deleteMember,
} from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  CHAPTER_ROLES,
  MEMBER_STATUSES,
  ROLE_GROUPS,
} from "@/lib/constants";

type MemberFormProps = {
  member?: Member;
};

export function MemberForm({ member }: MemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState(member?.headshotUrl ?? "");

  async function handleSubmit(formData: FormData) {
    setError(null);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      company: String(formData.get("company") ?? ""),
      bniSeat: String(formData.get("bniSeat") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      headshotUrl,
      chapterRole: String(formData.get("chapterRole") ?? ""),
      roleGroup: String(formData.get("roleGroup") ?? "none") as
        | "leadership"
        | "support"
        | "committee"
        | "none",
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "active") as
        | "active"
        | "on_leave"
        | "former",
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    };

    startTransition(async () => {
      try {
        if (member) {
          await updateMember(member.id, payload);
        } else {
          await createMember(payload);
        }
        router.push("/members");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleDelete() {
    if (!member) return;
    if (!confirm("Remove this member from the roster?")) return;
    startTransition(async () => {
      await deleteMember(member.id);
      router.push("/members");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-6"
    >
      {error ? (
        <p className="rounded-md border border-bni/20 bg-red-50 px-4 py-3 text-sm text-bni">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          defaultValue={member?.firstName}
          required
        />
        <Input
          label="Last name"
          name="lastName"
          defaultValue={member?.lastName}
          required
        />
        <Input
          label="Company"
          name="company"
          defaultValue={member?.company}
          required
        />
        <Input
          label="BNI seat"
          name="bniSeat"
          defaultValue={member?.bniSeat}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={member?.email}
          required
        />
        <Input
          label="Phone"
          name="phone"
          defaultValue={member?.phone}
          required
        />
        <Input
          label="LinkedIn URL"
          name="linkedinUrl"
          type="url"
          defaultValue={member?.linkedinUrl ?? ""}
          placeholder="https://linkedin.com/in/..."
        />
        <Input
          label="Sort order"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={member?.sortOrder ?? 0}
        />
        <Select
          label="Chapter role"
          name="chapterRole"
          defaultValue={member?.chapterRole ?? ""}
          options={[
            { value: "", label: "None" },
            ...CHAPTER_ROLES.map((role) => ({ value: role, label: role })),
          ]}
        />
        <Select
          label="Role group"
          name="roleGroup"
          defaultValue={member?.roleGroup ?? "none"}
          options={ROLE_GROUPS.map((g) => ({ value: g.value, label: g.label }))}
        />
        <Select
          label="Status"
          name="status"
          defaultValue={member?.status ?? "active"}
          options={MEMBER_STATUSES.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
      </div>

      <Textarea
        label="Notes"
        name="notes"
        defaultValue={member?.notes ?? ""}
        placeholder="Internal notes for admin and exports"
      />

      <ImageUpload
        label="Headshot"
        description="Used on the member directory, roster and meeting sheet booklet."
        value={headshotUrl}
        onChange={setHeadshotUrl}
        folder="headshots"
        aspect="square"
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : member ? "Update member" : "Add member"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/members")}
        >
          Cancel
        </Button>
        {member ? (
          <Button type="button" variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
