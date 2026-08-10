"use client";

import { Input, Select } from "@/components/ui/form-fields";
import { SettingsSection } from "@/components/settings/settings-section";
import { CHARITY_LINK_PLACEMENTS } from "@/lib/charity-links";

export type CharityLinkDraft = {
  id?: string;
  label: string;
  url: string;
  sortOrder: number;
  placement: "charity" | "cover";
};

type CharityLinksFieldsProps = {
  links: CharityLinkDraft[];
  onChange: (links: CharityLinkDraft[]) => void;
};

export function CharityLinksFields({ links, onChange }: CharityLinksFieldsProps) {
  function updateLink(
    index: number,
    field: keyof CharityLinkDraft,
    value: string | number,
  ) {
    onChange(
      links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    );
  }

  function addLink() {
    onChange([
      ...links,
      { label: "", url: "", sortOrder: links.length, placement: "charity" },
    ]);
  }

  function removeLink(index: number) {
    onChange(
      links
        .filter((_, i) => i !== index)
        .map((link, i) => ({ ...link, sortOrder: i })),
    );
  }

  return (
    <SettingsSection
      title="Charity QR links"
      description="Genie's Wish links print in the charity badge on page 2. Set a link to Front cover for the chapter page QR."
    >
      {links.length > 0 ? (
        <div className="space-y-4">
          {links.map((link, index) => (
            <div
              key={link.id ?? `new-${index}`}
              className="grid gap-3 rounded-lg border border-border p-4 lg:grid-cols-[1fr_2fr_1fr_auto_auto] lg:items-end"
            >
              <Input
                label="Label"
                name={`charityLink-${index}-label`}
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                placeholder="Donate via..."
              />
              <Input
                label="URL"
                name={`charityLink-${index}-url`}
                type="url"
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                placeholder="https://..."
              />
              <Select
                label="Print on"
                name={`charityLink-${index}-placement`}
                value={link.placement}
                onChange={(e) =>
                  updateLink(
                    index,
                    "placement",
                    e.target.value as CharityLinkDraft["placement"],
                  )
                }
                options={CHARITY_LINK_PLACEMENTS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <Input
                label="Order"
                name={`charityLink-${index}-sortOrder`}
                type="number"
                min={0}
                value={link.sortOrder}
                onChange={(e) =>
                  updateLink(index, "sortOrder", Number(e.target.value))
                }
                className="w-20"
              />
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="rounded-md px-3 py-2 text-sm text-muted transition hover:text-bni"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No charity links yet. Add one below — they will be saved when you click
          Save all changes.
        </p>
      )}

      <button
        type="button"
        onClick={addLink}
        className="rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
      >
        Add link
      </button>
    </SettingsSection>
  );
}
