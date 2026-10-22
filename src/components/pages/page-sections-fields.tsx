"use client";

import type { PageSection } from "@/db/schema";
import { Input, Textarea } from "@/components/ui/form-fields";

type PageSectionsFieldsProps = {
  values: PageSection[];
  onChange: (values: PageSection[]) => void;
};

export function PageSectionsFields({ values, onChange }: PageSectionsFieldsProps) {
  function updateSection(index: number, patch: Partial<PageSection>) {
    onChange(values.map((value, i) => (i === index ? { ...value, ...patch } : value)));
  }

  function addSection() {
    onChange([
      ...values,
      {
        id: crypto.randomUUID(),
        heading: "",
        body: "",
      },
    ]);
  }

  function removeSection(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Add H2 sections with Markdown body copy. Use tokens like{" "}
          <code className="rounded bg-surface-muted px-1">{`{{meetingFacts}}`}</code> so meeting
          details stay in sync with Settings.
        </p>
        <button
          type="button"
          onClick={addSection}
          className="text-sm font-medium text-bni hover:underline"
        >
          Add section
        </button>
      </div>

      {values.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
          No sections yet.
        </p>
      ) : null}

      {values.map((section, index) => (
        <div
          key={section.id}
          className="rounded-lg border border-border bg-surface-muted/40 p-4"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Section {index + 1}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => moveSection(index, -1)}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 1)}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => removeSection(index)}
                className="text-xs font-medium text-bni hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
          <Input
            label="Heading"
            name={`section-${section.id}-heading`}
            value={section.heading}
            onChange={(event) => updateSection(index, { heading: event.target.value })}
          />
          <div className="mt-4">
            <Textarea
              label="Body (Markdown)"
              name={`section-${section.id}-body`}
              value={section.body}
              onChange={(event) => updateSection(index, { body: event.target.value })}
              className="min-h-40 font-mono text-[13px]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
