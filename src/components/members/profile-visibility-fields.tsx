"use client";

import type { ProfileVisibilityKey } from "@/lib/profile-visibility";
import { PROFILE_VISIBILITY_GROUPS } from "@/lib/profile-visibility";
import type { ProfileVisibilityFormValues } from "@/lib/validations";

type ProfileVisibilityFieldsProps = {
  visibility: ProfileVisibilityFormValues;
  onChange: (next: ProfileVisibilityFormValues) => void;
};

export function ProfileVisibilityFields({
  visibility,
  onChange,
}: ProfileVisibilityFieldsProps) {
  function toggleField(key: ProfileVisibilityKey, checked: boolean) {
    onChange({
      ...visibility,
      [key]: checked,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Public page visibility
        </h3>
        <p className="mt-1 text-sm text-muted">
          Choose what visitors see on your public directory profile. Your details
          are always kept on the signed-in member roster.
        </p>
      </div>

      {PROFILE_VISIBILITY_GROUPS.map((group) => (
        <div
          key={group.title}
          className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{group.title}</p>
            <p className="mt-1 text-xs text-muted">{group.description}</p>
          </div>
          <ul className="space-y-2">
            {group.fields.map((field) => (
              <li key={field.key}>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-white px-4 py-3">
                  <span className="text-sm text-foreground">{field.label}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span>Show publicly</span>
                    <input
                      type="checkbox"
                      checked={visibility[field.key]}
                      onChange={(event) =>
                        toggleField(field.key, event.target.checked)
                      }
                      className="accent-bni"
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
