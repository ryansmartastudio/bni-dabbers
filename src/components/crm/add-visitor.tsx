"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addVisitor, checkForDuplicates } from "@/actions/crm";
import { STAGE_LABELS, type DuplicateMatch } from "@/lib/crm/visitors";

type Field = "name" | "company" | "phone" | "email" | "category";

const EMPTY: Record<Field, string> = {
  name: "",
  company: "",
  phone: "",
  email: "",
  category: "",
};

const FIELDS: { key: Field; label: string; hint?: string; type?: string }[] = [
  { key: "name", label: "Name" },
  { key: "company", label: "Company" },
  { key: "category", label: "What they do", hint: "The seat they'd fill" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
];

/**
 * Add somebody who didn't come out of a workshop.
 *
 * Only the name is required, matching the workshop form: a name and "I know
 * a plumber" is a real lead, and demanding an email address is how leads get
 * left in someone's head instead of the pipeline.
 */
export function AddVisitor({ full = false }: { full?: boolean } = {}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [claim, setClaim] = useState(true);
  const [dupes, setDupes] = useState<DuplicateMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // The native dialog gives Escape and a focus trap without reimplementing
  // either, but it has to be opened through the API rather than an attribute.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function reset() {
    setValues(EMPTY);
    setClaim(true);
    setDupes(null);
    setError(null);
  }

  function set(key: Field, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setDupes(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await addVisitor({ ...values, claimForMe: claim });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      router.push(`/crm/visitor/${result.data.id}`);
    });
  }

  function submit() {
    if (!values.name.trim()) {
      setError("A name is needed.");
      return;
    }
    setError(null);

    // Checked once, then the same button saves. Two people really can share a
    // name, so this warns and never refuses.
    startTransition(async () => {
      const found = await checkForDuplicates(values);
      if (found.ok && found.data.length > 0) {
        setDupes(found.data);
        return;
      }
      save();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl bg-bni px-4 py-2 text-sm font-bold text-white ${
          full ? "w-full py-2.5" : ""
        }`}
      >
        Add a visitor
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 backdrop:bg-black/40"
      >
        <div className="p-5">
          <h2 className="text-lg font-bold text-foreground">Add a visitor</h2>
          <p className="mt-0.5 text-sm text-muted">
            Anyone worth inviting. Only the name is needed.
          </p>

          <div className="mt-4 space-y-3">
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  {field.label}
                  {field.key === "name" ? "" : " (optional)"}
                </span>
                <input
                  type={field.type ?? "text"}
                  value={values[field.key]}
                  onChange={(event) => set(field.key, event.target.value)}
                  placeholder={field.hint}
                  className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2.5 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
                />
              </label>
            ))}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={claim}
                onChange={(event) => setClaim(event.target.checked)}
                className="size-4 accent-[#CF2030]"
              />
              <span className="text-sm font-semibold text-foreground">
                I&rsquo;ll be the one inviting them
              </span>
            </label>
          </div>

          {dupes ? (
            <div className="mt-4 rounded-xl border border-border bg-surface-muted p-3">
              <p className="text-sm font-bold text-foreground">
                {dupes.length === 1
                  ? "Somebody similar is already in the pipeline"
                  : "A few similar people are already in the pipeline"}
              </p>
              <ul className="mt-2 space-y-1.5">
                {dupes.map((dupe) => (
                  <li key={dupe.id} className="text-sm">
                    <Link
                      href={`/crm/visitor/${dupe.id}`}
                      className="font-semibold text-foreground underline underline-offset-2"
                    >
                      {dupe.name}
                    </Link>
                    <span className="text-muted">
                      {dupe.company ? ` · ${dupe.company}` : ""} ·{" "}
                      {STAGE_LABELS[dupe.stage]}
                      {dupe.sourceLabel ? ` · from ${dupe.sourceLabel}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                Open one of those, or add this person anyway if they&rsquo;re
                somebody different.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-bni">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={dupes ? save : submit}
              className="rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {dupes ? "Add anyway" : "Add visitor"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
