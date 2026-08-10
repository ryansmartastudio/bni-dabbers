"use client";

import { useTransition } from "react";
import type { ChapterSettings, CharityLink } from "@/db/schema";
import {
  updateSettings,
  upsertCharityLink,
  deleteCharityLink,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-fields";

type SettingsFormProps = {
  settings: ChapterSettings;
  charityLinks: CharityLink[];
};

export function SettingsForm({ settings, charityLinks }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSettingsSubmit(formData: FormData) {
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
        charityLogoUrl: String(formData.get("charityLogoUrl") ?? ""),
        bniDabbersBankDetails: String(formData.get("bniDabbersBankDetails") ?? ""),
        bniGlobalBankDetails: String(formData.get("bniGlobalBankDetails") ?? ""),
        guestPageCount: Number(formData.get("guestPageCount") ?? 2),
        chapterLogoUrl: String(formData.get("chapterLogoUrl") ?? ""),
      });
    });
  }

  function handleLinkSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertCharityLink({
        id: String(formData.get("id") ?? "") || undefined,
        label: String(formData.get("label") ?? ""),
        url: String(formData.get("url") ?? ""),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      });
    });
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSettingsSubmit(new FormData(e.currentTarget));
        }}
        className="space-y-6 rounded-xl border border-border bg-white p-6"
      >
        <h2 className="text-lg font-semibold">Chapter details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Chapter name" name="chapterName" defaultValue={settings.chapterName} />
          <Input label="Website URL" name="websiteUrl" defaultValue={settings.websiteUrl} />
          <Input label="Venue name" name="venueName" defaultValue={settings.venueName} />
          <Input label="Venue address" name="venueAddress" defaultValue={settings.venueAddress} />
          <Input label="Meeting day" name="meetingDay" defaultValue={settings.meetingDay} />
          <Input label="Start time" name="meetingStart" defaultValue={settings.meetingStart} />
          <Input label="End time" name="meetingEnd" defaultValue={settings.meetingEnd} />
          <Input label="Guest pages" name="guestPageCount" type="number" min={1} max={10} defaultValue={settings.guestPageCount} />
          <Input label="Chapter logo URL" name="chapterLogoUrl" defaultValue={settings.chapterLogoUrl ?? ""} />
        </div>

        <h2 className="text-lg font-semibold">This week (page 3)</h2>
        <div className="grid gap-4">
          <Textarea label="10-minute presentation" name="presentationSlot" defaultValue={settings.presentationSlot ?? ""} />
          <Textarea label="Education slot" name="educationSlot" defaultValue={settings.educationSlot ?? ""} />
          <Textarea label="Training & events" name="trainingEvents" defaultValue={settings.trainingEvents ?? ""} />
        </div>

        <h2 className="text-lg font-semibold">Charity block (page 2)</h2>
        <div className="grid gap-4">
          <Input label="Charity name" name="charityName" defaultValue={settings.charityName} />
          <Textarea label="Charity paragraph" name="charityParagraph" defaultValue={settings.charityParagraph ?? ""} />
          <Input label="Charity logo URL" name="charityLogoUrl" defaultValue={settings.charityLogoUrl ?? ""} />
          <Textarea label="BNI Dabbers bank details" name="bniDabbersBankDetails" defaultValue={settings.bniDabbersBankDetails ?? ""} />
          <Textarea label="BNI Global bank details" name="bniGlobalBankDetails" defaultValue={settings.bniGlobalBankDetails ?? ""} />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save settings"}
        </Button>
      </form>

      <section className="space-y-4 rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold">Charity QR links</h2>
        {charityLinks.map((link) => (
          <form
            key={link.id}
            onSubmit={(e) => {
              e.preventDefault();
              handleLinkSubmit(new FormData(e.currentTarget));
            }}
            className="grid gap-3 border-b border-border pb-4 sm:grid-cols-4"
          >
            <input type="hidden" name="id" value={link.id} />
            <Input label="Label" name="label" defaultValue={link.label} />
            <Input label="URL" name="url" defaultValue={link.url} />
            <Input label="Sort" name="sortOrder" type="number" defaultValue={link.sortOrder} />
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isPending}>Update</Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteCharityLink(link.id);
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </form>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLinkSubmit(new FormData(e.currentTarget));
          }}
          className="grid gap-3 sm:grid-cols-4"
        >
          <Input label="New label" name="label" placeholder="Donate via..." />
          <Input label="New URL" name="url" placeholder="https://..." />
          <Input label="Sort" name="sortOrder" type="number" defaultValue={charityLinks.length} />
          <div className="flex items-end">
            <Button type="submit" disabled={isPending}>Add link</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
