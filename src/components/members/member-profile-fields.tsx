"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Member } from "@/db/schema";
import { draftMemberProfile } from "@/actions/member-profile";
import { saveMemberProfile } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-fields";
import { ProfileVisibilityFields } from "@/components/members/profile-visibility-fields";
import { getMemberProfilePath } from "@/lib/members";
import type { MemberProfileFormValues } from "@/lib/member-profile";
import type { ProfileVisibilityFormValues } from "@/lib/validations";

type MemberProfileFieldsProps = {
  member?: Member;
  headline: string;
  summary: string;
  services: string[];
  idealReferral: string;
  sourceUrl: string;
  generatedAt: string;
  published: boolean;
  visibility?: ProfileVisibilityFormValues;
  onHeadlineChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onServicesChange: (value: string[]) => void;
  onIdealReferralChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onGeneratedAtChange: (value: string) => void;
  onPublishedChange: (value: boolean) => void;
  onVisibilityChange?: (value: ProfileVisibilityFormValues) => void;
};

function formatGeneratedAt(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildProfilePayload(
  headline: string,
  summary: string,
  services: string[],
  idealReferral: string,
  sourceUrl: string,
  generatedAt: string,
  published: boolean,
  visibility?: ProfileVisibilityFormValues,
): MemberProfileFormValues {
  return {
    profileHeadline: headline,
    profileSummary: summary,
    profileServices: services.map((service) => service.trim()).filter(Boolean),
    profileIdealReferral: idealReferral,
    profileSourceUrl: sourceUrl,
    profileGeneratedAt: generatedAt || null,
    profilePublished: published,
    ...(visibility ? { profileVisibility: visibility } : {}),
  };
}

export function MemberProfileFields({
  member,
  headline,
  summary,
  services,
  idealReferral,
  sourceUrl,
  generatedAt,
  published,
  visibility,
  onHeadlineChange,
  onSummaryChange,
  onServicesChange,
  onIdealReferralChange,
  onSourceUrlChange,
  onGeneratedAtChange,
  onPublishedChange,
  onVisibilityChange,
}: MemberProfileFieldsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasDraftContent = Boolean(
    headline.trim() ||
      summary.trim() ||
      services.some((service) => service.trim()) ||
      idealReferral.trim(),
  );

  async function persistProfile(nextPublished: boolean) {
    if (!member) return;

    await saveMemberProfile(
      member.id,
      buildProfilePayload(
        headline,
        summary,
        services,
        idealReferral,
        sourceUrl,
        generatedAt,
        nextPublished,
        visibility,
      ),
    );
    onPublishedChange(nextPublished);
    router.refresh();
  }

  function handleGenerate() {
    if (!member) return;

    const hasExistingCopy =
      headline.trim() ||
      summary.trim() ||
      services.length ||
      idealReferral.trim();
    if (
      hasExistingCopy &&
      !confirm(
        "Generate new copy from the website? This will replace the current draft (you still need to publish).",
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await draftMemberProfile(member.id);
      if (!result.success) {
        setError(result.message);
        return;
      }

      onHeadlineChange(result.draft.headline);
      onSummaryChange(result.draft.summary);
      onServicesChange(result.draft.services);
      onIdealReferralChange(result.draft.idealReferral);
      onSourceUrlChange(result.sourceUrl);
      onGeneratedAtChange(result.generatedAt);

      try {
        await saveMemberProfile(member.id, {
          profileHeadline: result.draft.headline,
          profileSummary: result.draft.summary,
          profileServices: result.draft.services,
          profileIdealReferral: result.draft.idealReferral,
          profileSourceUrl: result.sourceUrl,
          profileGeneratedAt: result.generatedAt,
          profilePublished: false,
          ...(visibility ? { profileVisibility: visibility } : {}),
        });
        onPublishedChange(false);
        router.refresh();
        setMessage(
          "Draft saved. Click Publish profile to show this on the public page.",
        );
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Draft generated but could not be saved.",
        );
      }
    });
  }

  function handlePublish() {
    if (!member) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        await persistProfile(true);
        setMessage("Profile published. It is now live on the public directory.");
      } catch (publishError) {
        setError(
          publishError instanceof Error
            ? publishError.message
            : "Could not publish this profile.",
        );
      }
    });
  }

  function updateService(index: number, value: string) {
    onServicesChange(services.map((service, i) => (i === index ? value : service)));
  }

  function addService() {
    onServicesChange([...services, ""]);
  }

  function removeService(index: number) {
    onServicesChange(services.filter((_, i) => i !== index));
  }

  const profilePath = member ? getMemberProfilePath(member) : null;
  const generatedLabel = formatGeneratedAt(generatedAt);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-muted/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Public profile copy
            </h2>
            <p className="text-sm text-muted">
              Generate a draft from the member&apos;s website, review it, then
              publish when you&apos;re happy. Until you publish, visitors only
              see basic contact details.
            </p>
            {generatedLabel ? (
              <p className="text-xs text-muted">
                Last generated {generatedLabel}
                {sourceUrl ? (
                  <>
                    {" "}
                    from{" "}
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-bni hover:underline"
                    >
                      {sourceUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {profilePath ? (
              <Link href={profilePath} target="_blank">
                <Button type="button" variant="secondary">
                  View public page
                </Button>
              </Link>
            ) : null}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!member || isPending}
            >
              {isPending ? "Generating..." : "Generate from website"}
            </Button>
            {member && hasDraftContent ? (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isPending || published}
              >
                {published ? "Published" : "Publish profile"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {hasDraftContent && !published ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This profile is saved as a draft and is not live yet. Click{" "}
          <strong>Publish profile</strong> to show the company story, services
          and referral text on the public page.
        </p>
      ) : null}

      {published ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          This profile is live on the public directory.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-bni/20 bg-red-50 px-4 py-3 text-sm text-bni">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-border bg-white px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => onPublishedChange(event.target.checked)}
          className="mt-0.5 accent-bni"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">
            Publish on public directory
          </span>
          <span className="block text-xs text-muted">
            When off, visitors see name, company, seat and contact details only.
            Use Publish profile above, or tick this and click Update member.
          </span>
        </span>
      </label>

      <Input
        label="Profile headline"
        name="profileHeadline"
        value={headline}
        onChange={(event) => onHeadlineChange(event.target.value)}
        placeholder="One-line summary of what this member's company does"
      />

      <Textarea
        label="Company story"
        name="profileSummary"
        value={summary}
        onChange={(event) => onSummaryChange(event.target.value)}
        placeholder="Two or three short paragraphs about the company"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Services</p>
            <p className="text-xs text-muted">Specific specialisms to show on the profile page.</p>
          </div>
          <Button type="button" variant="secondary" onClick={addService}>
            Add service
          </Button>
        </div>
        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted">
              No services yet. Generate from the website or add them manually.
            </p>
          ) : (
            services.map((service, index) => (
              <div key={`service-${index}`} className="flex gap-2">
                <Input
                  label={`Service ${index + 1}`}
                  name={`profileService-${index}`}
                  value={service}
                  onChange={(event) => updateService(index, event.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeService(index)}
                  className="mt-6 shrink-0"
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Textarea
        label="Ideal referral"
        name="profileIdealReferral"
        value={idealReferral}
        onChange={(event) => onIdealReferralChange(event.target.value)}
        placeholder="Who should other members refer to this business?"
      />

      {visibility && onVisibilityChange ? (
        <ProfileVisibilityFields
          visibility={visibility}
          onChange={onVisibilityChange}
        />
      ) : null}

      <input type="hidden" name="profileSourceUrl" value={sourceUrl} />
      <input type="hidden" name="profileGeneratedAt" value={generatedAt} />
      <input type="hidden" name="profilePublished" value={published ? "on" : "off"} />
    </div>
  );
}
