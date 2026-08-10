"use client";

import { useState, useTransition } from "react";
import type { ChapterSettings, CharityLink } from "@/db/schema";
import { updateSettings } from "@/actions/settings";
import {
  uploadChapterLogo,
  uploadCharityLogo,
} from "@/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-fields";
import { ImageUpload } from "@/components/ui/image-upload";
import { CharityLinksSection } from "@/components/settings/charity-links-section";
import { SettingsSection } from "@/components/settings/settings-section";

type SettingsFormProps = {
  settings: ChapterSettings;
  charityLinks: CharityLink[];
};

export function SettingsForm({ settings, charityLinks }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [chapterLogoUrl, setChapterLogoUrl] = useState(
    settings.chapterLogoUrl ?? "",
  );
  const [charityLogoUrl, setCharityLogoUrl] = useState(
    settings.charityLogoUrl ?? "",
  );

  function handleSettingsSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateSettings({
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
        bniDabbersBankDetails: String(formData.get("bniDabbersBankDetails") ?? ""),
        bniGlobalBankDetails: String(formData.get("bniGlobalBankDetails") ?? ""),
        guestPageCount: Number(formData.get("guestPageCount") ?? 2),
        chapterLogoUrl,
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSettingsSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-6"
      >
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
            onUpload={uploadChapterLogo}
            aspect="square"
          />
        </SettingsSection>

        <SettingsSection
          title="Meeting & venue"
          description="Printed on the cover and used across the public directory."
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
            onUpload={uploadCharityLogo}
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

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 sm:px-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save all settings"}
          </Button>
          {saved ? (
            <span className="text-sm text-muted">Settings saved.</span>
          ) : null}
        </div>
      </form>

      <CharityLinksSection charityLinks={charityLinks} />
    </div>
  );
}
