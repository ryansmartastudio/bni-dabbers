"use client";

import { useTransition } from "react";
import type { CharityLink } from "@/db/schema";
import {
  upsertCharityLink,
  deleteCharityLink,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { SettingsSection } from "@/components/settings/settings-section";

type CharityLinksSectionProps = {
  charityLinks: CharityLink[];
};

export function CharityLinksSection({ charityLinks }: CharityLinksSectionProps) {
  const [isPending, startTransition] = useTransition();

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
    <SettingsSection
      title="Charity QR links"
      description="Three QR codes on page 2 of the meeting sheet booklet. Labels appear under each code."
    >
      {charityLinks.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charityLinks.map((link) => (
                <tr key={link.id} className="border-t border-border">
                  <td colSpan={4} className="p-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLinkSubmit(new FormData(e.currentTarget));
                      }}
                      className="grid gap-3 p-4 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end"
                    >
                      <input type="hidden" name="id" value={link.id} />
                      <Input label="Label" name="label" defaultValue={link.label} />
                      <Input label="URL" name="url" type="url" defaultValue={link.url} />
                      <Input
                        label="Order"
                        name="sortOrder"
                        type="number"
                        defaultValue={link.sortOrder}
                        className="w-20"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isPending} variant="secondary">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">No charity links yet. Add one below.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLinkSubmit(new FormData(e.currentTarget));
        }}
        className="rounded-lg border border-dashed border-border bg-surface-muted/50 p-4"
      >
        <p className="mb-3 text-sm font-medium text-foreground">Add link</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
          <Input label="Label" name="label" placeholder="Donate via..." required />
          <Input label="URL" name="url" type="url" placeholder="https://..." required />
          <Input
            label="Order"
            name="sortOrder"
            type="number"
            defaultValue={charityLinks.length}
          />
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
