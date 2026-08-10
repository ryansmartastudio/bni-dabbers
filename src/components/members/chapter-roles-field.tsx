"use client";

import { CHAPTER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ChapterRolesFieldProps = {
  presetRoles: string[];
  otherRoles: string[];
  onPresetRolesChange: (roles: string[]) => void;
  onOtherRolesChange: (roles: string[]) => void;
};

export function ChapterRolesField({
  presetRoles,
  otherRoles,
  onPresetRolesChange,
  onOtherRolesChange,
}: ChapterRolesFieldProps) {
  function togglePreset(role: string) {
    onPresetRolesChange(
      presetRoles.includes(role)
        ? presetRoles.filter((item) => item !== role)
        : [...presetRoles, role],
    );
  }

  function updateOtherRole(index: number, value: string) {
    onOtherRolesChange(
      otherRoles.map((role, i) => (i === index ? value : role)),
    );
  }

  function addOtherRole() {
    onOtherRolesChange([...otherRoles, ""]);
  }

  function removeOtherRole(index: number) {
    onOtherRolesChange(otherRoles.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div>
        <p className="text-sm font-medium text-foreground">Chapter roles</p>
        <p className="mt-0.5 text-xs text-muted">
          Select all that apply. Shown on the directory and meeting sheet.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {CHAPTER_ROLES.map((role) => {
          const checked = presetRoles.includes(role);
          return (
            <label
              key={role}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                checked
                  ? "border-bni/30 bg-red-50 text-foreground"
                  : "border-border bg-white text-foreground hover:bg-surface-muted",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => togglePreset(role)}
                className="accent-bni"
              />
              <span>{role}</span>
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Other roles</p>
          <button
            type="button"
            onClick={addOtherRole}
            className="text-sm font-medium text-bni hover:underline"
          >
            Add other role
          </button>
        </div>
        {otherRoles.length > 0 ? (
          <div className="space-y-2">
            {otherRoles.map((role, index) => (
              <div key={`other-role-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => updateOtherRole(index, e.target.value)}
                  placeholder="Enter role..."
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-bni/20 transition focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => removeOtherRole(index)}
                  className="shrink-0 rounded-md px-3 py-2 text-sm text-muted transition hover:text-bni"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Use this for custom roles not listed above.
          </p>
        )}
      </div>
    </div>
  );
}
