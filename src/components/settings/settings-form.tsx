"use client";

import { useState, useTransition } from "react";
import type { ChapterSettings, CharityLink } from "@/db/schema";
import { saveAllSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-fields";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  CharityLinksFields,
  type CharityLinkDraft,
} from "@/components/settings/charity-links-fields";
import {
  CoreValuesFields,
  type CoreValueDraft,
} from "@/components/settings/core-values-fields";
import { SettingsSection } from "@/components/settings/settings-section";
import { normalizeCoreValues } from "@/lib/core-values";

type SettingsFormProps = {
  settings: ChapterSettings;
  charityLinks: CharityLink[];
};

function toLinkDrafts(links: CharityLink[]): CharityLinkDraft[] {
  return links.map(({ id, label, url, sortOrder }) => ({
    id,
    label,
    url,
    sortOrder,
  }));
}

export function SettingsForm({ settings, charityLinks }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapterLogoUrl, setChapterLogoUrl] = useState(
    settings.chapterLogoUrl ?? "",
  );
  const [charityLogoUrl, setCharityLogoUrl] = useState(
    settings.charityLogoUrl ?? "",
  );
  const [venueLogoUrl, setVenueLogoUrl] = useState(settings.venueLogoUrl ?? "");
  const [venuePhotoUrl, setVenuePhotoUrl] = useState(
    settings.venuePhotoUrl ?? "",
  );
  const [coreValues, setCoreValues] = useState<CoreValueDraft[]>(() =>
    normalizeCoreValues(settings.coreValues),
  );
  const [links, setLinks] = useState<CharityLinkDraft[]>(() =>
    toLinkDrafts(charityLinks),
  );

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError(null);

    const filledLinks = links.filter(
      (link) => link.label.trim() || link.url.trim(),
    );

    for (const link of filledLinks) {
      if (!link.label.trim() || !link.url.trim()) {
        setError("Each charity link needs both a label and a URL, or remove the row.");
        return;
      }
    }

    startTransition(async () => {
      try {
        await saveAllSettings({
          settings: {
            chapterName: String(formData.get("chapterName") ?? ""),
            websiteUrl: String(formData.get("websiteUrl") ?? ""),
            venueName: String(formData.get("venueName") ?? ""),
            venueAddress: String(formData.get("venueAddress") ?? ""),
            meetingDay: String(formData.get("meetingDay") ?? ""),
            meetingStart: String(formData.get("meetingStart") ?? ""),
            meetingEnd: String(formData.get("meetingEnd") ?? ""),
            presentationSlot: String(formData.get("presentationSlot") ?? ""),
            educationSlot: String(formData.get("educationSlot") ?? ""),
            trainingEvents: String(formData.get("trainingEvents") ?? ""),
            charityName: String(formData.get("charityName") ?? ""),
            charityParagraph: String(formData.get("charityParagraph") ?? ""),
            charityLogoUrl,
            bniDabbersBankDetails: String(
              formData.get("bniDabbersBankDetails") ?? "",
            ),
            bniGlobalBankDetails: String(
              formData.get("bniGlobalBankDetails") ?? "",
            ),
            guestPageCount: Number(formData.get("guestPageCount") ?? 2),
            chapterLogoUrl,
            venueLogoUrl,
            venuePhotoUrl,
            feedbackQrUrl: String(formData.get("feedbackQrUrl") ?? ""),
            feedbackQrLabel: String(formData.get("feedbackQrLabel") ?? "Feedback"),
            coreValues: coreValues.map((value) => ({
              id: value.id,
              title: value.title.trim(),
              description: value.description.trim(),
              iconKey: value.iconKey,
              iconUrl: value.iconUrl || null,
            })),
          },
          charityLinks: filledLinks.map((link) => ({
            id: link.id,
            label: link.label.trim(),
            url: link.url.trim(),
            sortOrder: link.sortOrder,
          })),
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-6"
    >
      {error ? (
        <p className="rounded-md border border-bni/20 bg-red-50 px-4 py-3 text-sm text-bni">
          {error}
        </p>
      ) : null}

      <SettingsSection
        title="Chapter identity"
        description="Name, website and logo used on the meeting sheet cover and header."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Chapter name"
            name="chapterName"
            defaultValue={settings.chapterName}
            required
          />
          <Input
            label="Website URL"
            name="websiteUrl"
            defaultValue={settings.websiteUrl}
            placeholder="www.bni-ce.co.uk/cheshire-east-dabbers"
          />
        </div>
        <ImageUpload
          label="Chapter logo"
          description="Shown on the booklet cover. PNG or SVG with transparent background works best."
          value={chapterLogoUrl}
          onChange={setChapterLogoUrl}
          folder="logos/chapter"
          aspect="square"
        />
      </SettingsSection>

      <SettingsSection
        title="Meeting & venue"
        description="Printed on the meeting sheet cover with venue branding and a venue photo."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Venue name"
            name="venueName"
            defaultValue={settings.venueName}
          />
          <Input
            label="Venue address"
            name="venueAddress"
            defaultValue={settings.venueAddress}
          />
          <Input
            label="Meeting day"
            name="meetingDay"
            defaultValue={settings.meetingDay}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              name="meetingStart"
              defaultValue={settings.meetingStart}
              placeholder="06:45"
            />
            <Input
              label="End time"
              name="meetingEnd"
              defaultValue={settings.meetingEnd}
              placeholder="08:30"
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ImageUpload
            label="Venue logo"
            description="Wychwood Park logo for the meeting sheet cover."
            value={venueLogoUrl}
            onChange={setVenueLogoUrl}
            folder="logos/venue"
            aspect="wide"
          />
          <ImageUpload
            label="Venue photo"
            description="A photo of the venue shown alongside the address and meeting times."
            value={venuePhotoUrl}
            onChange={setVenuePhotoUrl}
            folder="venue/photos"
            aspect="wide"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Meeting sheet cover"
        description="Core values, feedback QR badge and cover-only content for page 1 of the booklet."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Feedback QR URL"
            name="feedbackQrUrl"
            type="url"
            defaultValue={settings.feedbackQrUrl ?? ""}
            placeholder="https://forms.example.com/feedback"
          />
          <Input
            label="Feedback badge label"
            name="feedbackQrLabel"
            defaultValue={settings.feedbackQrLabel ?? "Feedback"}
            placeholder="Feedback"
          />
        </div>
        <CoreValuesFields values={coreValues} onChange={setCoreValues} />
      </SettingsSection>

      <SettingsSection
        title="This week"
        description="Page 3 of the meeting sheet. Leave blank to print ruled boxes for handwriting."
      >
        <Textarea
          label="10-minute presentation"
          name="presentationSlot"
          defaultValue={settings.presentationSlot ?? ""}
          placeholder="Speaker name and topic for this week..."
        />
        <Textarea
          label="Education slot"
          name="educationSlot"
          defaultValue={settings.educationSlot ?? ""}
        />
        <Textarea
          label="Training & events"
          name="trainingEvents"
          defaultValue={settings.trainingEvents ?? ""}
        />
      </SettingsSection>

      <SettingsSection
        title="Charity — Genie's Wish"
        description="Page 2 of the booklet: logo, paragraph and bank details alongside the QR codes."
      >
        <Input
          label="Charity name"
          name="charityName"
          defaultValue={settings.charityName}
        />
        <ImageUpload
          label="Charity logo"
          description="Genie's Wish logo for the charity block on page 2."
          value={charityLogoUrl}
          onChange={setCharityLogoUrl}
          folder="logos/charity"
          aspect="wide"
        />
        <Textarea
          label="Charity paragraph"
          name="charityParagraph"
          defaultValue={settings.charityParagraph ?? ""}
          placeholder="Brief description of Genie's Wish and why BNI Dabbers supports it..."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            label="BNI Dabbers bank details"
            name="bniDabbersBankDetails"
            defaultValue={settings.bniDabbersBankDetails ?? ""}
            placeholder="Sort code, account number, account name..."
          />
          <Textarea
            label="BNI Global bank details"
            name="bniGlobalBankDetails"
            defaultValue={settings.bniGlobalBankDetails ?? ""}
            placeholder="Sort code, account number, account name..."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Booklet options"
        description="Controls how many blank guest pages are appended to the meeting sheet PDF."
      >
        <Input
          label="Guest & visitor pages"
          name="guestPageCount"
          type="number"
          min={1}
          max={10}
          defaultValue={settings.guestPageCount}
          className="max-w-xs"
        />
      </SettingsSection>

      <CharityLinksFields links={links} onChange={setLinks} />

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm sm:px-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save all changes"}
        </Button>
        {saved ? (
          <span className="text-sm text-muted">All settings saved.</span>
        ) : null}
      </div>
    </form>
  );
}
