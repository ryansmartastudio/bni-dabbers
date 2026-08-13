"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Member } from "@/db/schema";
import {
  createMember,
  updateMember,
  deleteMember,
} from "@/actions/members";
import { ChapterRolesField } from "@/components/members/chapter-roles-field";
import { MemberAccessPanel } from "@/components/members/member-access-panel";
import { MemberProfileFields } from "@/components/members/member-profile-fields";
import {
  MemberTabs,
  MEMBER_TABS,
  type MemberTabId,
} from "@/components/members/member-tabs";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  getChapterRolesFormState,
  MEMBER_STATUSES,
  ROLE_GROUPS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MemberAccessState } from "@/lib/member-invites";
import { resolveProfileVisibility } from "@/lib/profile-visibility";
import type { ProfileVisibilityFormValues } from "@/lib/validations";

type MemberFormProps = {
  member?: Member;
  accessState?: MemberAccessState;
};

function TabPanel({
  tab,
  activeTab,
  children,
}: {
  tab: MemberTabId;
  activeTab: MemberTabId;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-6", activeTab !== tab && "hidden")} role="tabpanel">
      {children}
    </div>
  );
}

export function MemberForm({ member, accessState }: MemberFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MemberTabId>("details");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState(member?.headshotUrl ?? "");
  const initialRoles = getChapterRolesFormState(member?.chapterRoles);
  const [presetRoles, setPresetRoles] = useState<string[]>([
    ...initialRoles.presetRoles,
  ]);
  const [otherRoles, setOtherRoles] = useState(initialRoles.otherRoles);
  const [profileHeadline, setProfileHeadline] = useState(
    member?.profileHeadline ?? "",
  );
  const [profileSummary, setProfileSummary] = useState(
    member?.profileSummary ?? "",
  );
  const [profileServices, setProfileServices] = useState<string[]>(
    member?.profileServices ?? [],
  );
  const [profileIdealReferral, setProfileIdealReferral] = useState(
    member?.profileIdealReferral ?? "",
  );
  const [profileSourceUrl, setProfileSourceUrl] = useState(
    member?.profileSourceUrl ?? "",
  );
  const [profileGeneratedAt, setProfileGeneratedAt] = useState(
    member?.profileGeneratedAt?.toISOString() ?? "",
  );
  const [profilePublished, setProfilePublished] = useState(
    member?.profilePublished ?? false,
  );
  const [profileVisibility, setProfileVisibility] =
    useState<ProfileVisibilityFormValues>(
      resolveProfileVisibility(member?.profileVisibility),
    );

  const tabs = member
    ? MEMBER_TABS
    : MEMBER_TABS.filter((tab) => tab.id !== "access");

  async function handleSubmit(formData: FormData) {
    setError(null);

    const chapterRoles = [
      ...presetRoles,
      ...otherRoles.map((role) => role.trim()).filter(Boolean),
    ];

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      company: String(formData.get("company") ?? ""),
      bniSeat: String(formData.get("bniSeat") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      headshotUrl,
      chapterRoles,
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
      bookletAtBottom: formData.get("bookletAtBottom") === "on",
      slug: String(formData.get("slug") ?? ""),
      profileHeadline,
      profileSummary,
      profileServices: profileServices.map((service) => service.trim()).filter(Boolean),
      profileIdealReferral,
      profileSourceUrl,
      profileGeneratedAt: profileGeneratedAt || null,
      profilePublished,
      profileVisibility,
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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <MemberTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === "access" && member && accessState ? (
        <div className="space-y-6 p-5 sm:p-6">
          <MemberAccessPanel
            memberId={member.id}
            defaultEmail={member.email}
            accessState={accessState}
          />
        </div>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-6 p-5 sm:p-6"
      >
        {error ? (
          <p className="rounded-md border border-bni/20 bg-red-50 px-4 py-3 text-sm text-bni">
            {error}
          </p>
        ) : null}

        <TabPanel tab="details" activeTab={activeTab}>
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
              label="Website URL"
              name="websiteUrl"
              type="url"
              defaultValue={member?.websiteUrl ?? ""}
              placeholder="https://www.example.com"
            />
            <Input
              label="Public profile slug"
              name="slug"
              defaultValue={member?.slug ?? ""}
              placeholder="auto-generated on save if blank"
            />
            <Input
              label="Sort order"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={member?.sortOrder ?? 0}
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
            <ChapterRolesField
              presetRoles={presetRoles}
              otherRoles={otherRoles}
              onPresetRolesChange={setPresetRoles}
              onOtherRolesChange={setOtherRoles}
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-white px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                name="bookletAtBottom"
                defaultChecked={member?.bookletAtBottom ?? false}
                className="mt-0.5 accent-bni"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">
                  Pin to bottom of meeting sheet
                </span>
                <span className="block text-xs text-muted">
                  Use for Director Consultant, Ambassador and similar roles. They
                  still appear in leadership sections but print after regular members
                  on the member pages.
                </span>
              </span>
            </label>
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
        </TabPanel>

        <TabPanel tab="profile" activeTab={activeTab}>
          <MemberProfileFields
            member={member}
            headline={profileHeadline}
            summary={profileSummary}
            services={profileServices}
            idealReferral={profileIdealReferral}
            sourceUrl={profileSourceUrl}
            generatedAt={profileGeneratedAt}
            published={profilePublished}
            onHeadlineChange={setProfileHeadline}
            onSummaryChange={setProfileSummary}
            onServicesChange={setProfileServices}
            onIdealReferralChange={setProfileIdealReferral}
            onSourceUrlChange={setProfileSourceUrl}
            onGeneratedAtChange={setProfileGeneratedAt}
            onPublishedChange={setProfilePublished}
            visibility={profileVisibility}
            onVisibilityChange={setProfileVisibility}
          />
        </TabPanel>

        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
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
      )}
    </div>
  );
}
