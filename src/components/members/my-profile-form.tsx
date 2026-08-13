"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Member } from "@/db/schema";
import { updateOwnMember } from "@/actions/member-access";
import { MemberProfileFields } from "@/components/members/member-profile-fields";
import {
  MyProfileTabs,
  type MyProfileTabId,
} from "@/components/members/member-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  formatChapterRoles,
  getMemberDisplayName,
  getMemberProfilePath,
  hasChapterRoles,
} from "@/lib/members";
import { MEMBER_STATUSES, ROLE_GROUPS } from "@/lib/constants";
import { resolveProfileVisibility } from "@/lib/profile-visibility";
import { cn } from "@/lib/utils";
import type { ProfileVisibilityFormValues } from "@/lib/validations";
import { ProfileVisibilityFields } from "@/components/members/profile-visibility-fields";

type MyProfileFormProps = {
  member: Member;
};

function TabPanel({
  tab,
  activeTab,
  children,
}: {
  tab: MyProfileTabId;
  activeTab: MyProfileTabId;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("space-y-6", activeTab !== tab && "hidden")}
      role="tabpanel"
    >
      {children}
    </div>
  );
}

export function MyProfileForm({ member }: MyProfileFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MyProfileTabId>("contact");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState(member.headshotUrl ?? "");
  const [profileHeadline, setProfileHeadline] = useState(
    member.profileHeadline ?? "",
  );
  const [profileSummary, setProfileSummary] = useState(
    member.profileSummary ?? "",
  );
  const [profileServices, setProfileServices] = useState<string[]>(
    member.profileServices ?? [],
  );
  const [profileIdealReferral, setProfileIdealReferral] = useState(
    member.profileIdealReferral ?? "",
  );
  const [profileSourceUrl, setProfileSourceUrl] = useState(
    member.profileSourceUrl ?? "",
  );
  const [profileGeneratedAt, setProfileGeneratedAt] = useState(
    member.profileGeneratedAt?.toISOString() ?? "",
  );
  const [profilePublished, setProfilePublished] = useState(
    member.profilePublished ?? false,
  );
  const [profileVisibility, setProfileVisibility] =
    useState<ProfileVisibilityFormValues>(
      resolveProfileVisibility(member.profileVisibility),
    );

  async function handleSubmit(formData: FormData) {
    setError(null);

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      company: String(formData.get("company") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      headshotUrl,
      profileHeadline,
      profileSummary,
      profileServices: profileServices
        .map((service) => service.trim())
        .filter(Boolean),
      profileIdealReferral,
      profileSourceUrl,
      profileGeneratedAt: profileGeneratedAt || null,
      profilePublished,
      profileVisibility,
    };

    startTransition(async () => {
      try {
        await updateOwnMember(payload);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const profilePath = getMemberProfilePath(member);
  const statusLabel =
    MEMBER_STATUSES.find((item) => item.value === member.status)?.label ??
    member.status;
  const roleGroupLabel =
    ROLE_GROUPS.find((item) => item.value === member.roleGroup)?.label ??
    member.roleGroup;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">My profile</h1>
        <p className="mt-1 text-sm text-muted">
          Update your directory contact details, headshot and public profile
          copy for {getMemberDisplayName(member)}.
        </p>
      </div>

      <MyProfileTabs activeTab={activeTab} onChange={setActiveTab} />

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

        <TabPanel tab="contact" activeTab={activeTab}>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Contact details
            </h2>
            <p className="mt-1 text-sm text-muted">
              These appear on the member roster and your public directory page.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              defaultValue={member.firstName}
              required
            />
            <Input
              label="Last name"
              name="lastName"
              defaultValue={member.lastName}
              required
            />
            <Input
              label="Company"
              name="company"
              defaultValue={member.company}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={member.email}
              required
            />
            <Input
              label="Phone"
              name="phone"
              defaultValue={member.phone}
              required
            />
            <Input
              label="LinkedIn URL"
              name="linkedinUrl"
              type="url"
              defaultValue={member.linkedinUrl ?? ""}
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              label="Website URL"
              name="websiteUrl"
              type="url"
              defaultValue={member.websiteUrl ?? ""}
              placeholder="https://www.example.com"
              className="sm:col-span-2"
            />
          </div>

          <p className="text-xs text-muted">
            Changing your email here updates your directory contact address
            only. It does not change the email you use to sign in.
          </p>

          <ImageUpload
            label="Headshot"
            description="Used on the member directory, roster and meeting sheet booklet."
            value={headshotUrl}
            onChange={setHeadshotUrl}
            folder="headshots"
            aspect="square"
          />

          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Chapter details
              </h2>
              <p className="mt-1 text-sm text-muted">
                Managed by the chapter leadership team.
              </p>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  BNI seat
                </dt>
                <dd className="mt-1 text-sm text-foreground">{member.bniSeat}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-foreground">{statusLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Role group
                </dt>
                <dd className="mt-1 text-sm text-foreground">{roleGroupLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Public profile
                </dt>
                <dd className="mt-1 text-sm">
                  <Link
                    href={profilePath}
                    className="font-medium text-bni hover:underline"
                    target="_blank"
                  >
                    {member.slug ?? "View page"}
                  </Link>
                </dd>
              </div>
              {hasChapterRoles(member.chapterRoles) ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Chapter roles
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatChapterRoles(member.chapterRoles)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
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
          />
        </TabPanel>

        <TabPanel tab="visibility" activeTab={activeTab}>
          <ProfileVisibilityFields
            visibility={profileVisibility}
            onChange={setProfileVisibility}
          />
        </TabPanel>

        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save profile"}
          </Button>
          <Link href={profilePath}>
            <Button type="button" variant="secondary">
              View public page
            </Button>
          </Link>
          <Link href="/exports">
            <Button type="button" variant="secondary">
              Meeting sheet
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
