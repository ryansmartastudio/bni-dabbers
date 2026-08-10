"use client";

import type { CoreValue } from "@/db/schema";
import {
  CORE_VALUE_ICON_OPTIONS,
  DEFAULT_CORE_VALUES,
} from "@/lib/core-values";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input, Select, Textarea } from "@/components/ui/form-fields";

export type CoreValueDraft = CoreValue;

type CoreValuesFieldsProps = {
  values: CoreValueDraft[];
  onChange: (values: CoreValueDraft[]) => void;
};

export function CoreValuesFields({ values, onChange }: CoreValuesFieldsProps) {
  function updateValue(index: number, patch: Partial<CoreValueDraft>) {
    onChange(values.map((value, i) => (i === index ? { ...value, ...patch } : value)));
  }

  function resetDefaults() {
    onChange(DEFAULT_CORE_VALUES.map((value) => ({ ...value })));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Shown on the meeting sheet cover. Choose a preset icon or upload your
          own for each value.
        </p>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-sm font-medium text-bni hover:underline"
        >
          Reset to BNI defaults
        </button>
      </div>

      <div className="space-y-4">
        {values.map((value, index) => (
          <div
            key={value.id}
            className="rounded-lg border border-border bg-surface-muted/40 p-4"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label={`Value ${index + 1} title`}
                name={`coreValue-${index}-title`}
                value={value.title}
                onChange={(e) => updateValue(index, { title: e.target.value })}
              />
              <Select
                label="Icon"
                name={`coreValue-${index}-iconKey`}
                value={value.iconKey}
                onChange={(e) =>
                  updateValue(index, { iconKey: e.target.value })
                }
                options={CORE_VALUE_ICON_OPTIONS.map((option) => ({
                  value: option.key,
                  label: option.label,
                }))}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Description"
                name={`coreValue-${index}-description`}
                value={value.description}
                onChange={(e) =>
                  updateValue(index, { description: e.target.value })
                }
                placeholder="Short description for the meeting sheet cover..."
              />
            </div>
            <div className="mt-4">
              <ImageUpload
                label="Custom icon (optional)"
                description="Overrides the preset icon above. Small square PNG or SVG works best."
                value={value.iconUrl ?? ""}
                onChange={(url) => updateValue(index, { iconUrl: url || null })}
                folder="icons/core-values"
                aspect="square"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
