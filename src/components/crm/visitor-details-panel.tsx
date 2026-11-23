"use client";

import { useState, useTransition } from "react";
import { editVisitor } from "@/actions/crm";

type Details = {
  id: string;
  name: string;
  company: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  visitBookedFor: string | null;
  createdAt: string;
};

const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "company", label: "Company", type: "text" },
  { key: "category", label: "What they do", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "website", label: "Website", type: "url" },
  { key: "visitBookedFor", label: "Visit booked for", type: "date" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readable(value: string | null): string {
  if (!value) return "";
  return value;
}

/**
 * The details, and the way to correct them.
 *
 * Any member of the chapter can edit, like notes and unlike the stage. A
 * wrong number is a fact about a person rather than a claim on them, and a
 * correction that has to wait for whoever took them on is a correction that
 * does not happen. Every change lands on the timeline with the old value.
 */
export function VisitorDetailsPanel({ visitor }: { visitor: Details }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<FieldKey, string>>(() => ({
    name: visitor.name,
    company: readable(visitor.company),
    category: readable(visitor.category),
    phone: readable(visitor.phone),
    email: readable(visitor.email),
    website: readable(visitor.website),
    visitBookedFor: readable(visitor.visitBookedFor),
  }));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    // Start from what is on screen now, not from whatever was typed and
    // abandoned last time.
    setValues({
      name: visitor.name,
      company: readable(visitor.company),
      category: readable(visitor.category),
      phone: readable(visitor.phone),
      email: readable(visitor.email),
      website: readable(visitor.website),
      visitBookedFor: readable(visitor.visitBookedFor),
    });
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await editVisitor(visitor.id, values);
      if (result.ok) setEditing(false);
      else setError(result.error);
    });
  }

  if (!editing) {
    return (
      <section className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Details
          </h2>
          <button
            type="button"
            onClick={open}
            className="text-xs font-bold text-bni underline-offset-2 hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="mt-2 space-y-1.5 text-sm">
          {(
            [
              ["Phone", visitor.phone, visitor.phone ? `tel:${visitor.phone}` : null],
              ["Email", visitor.email, visitor.email ? `mailto:${visitor.email}` : null],
              ["Website", visitor.website, visitor.website],
            ] as const
          ).map(([label, value, href]) => (
            <div key={label}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                {label}
              </dt>
              <dd className="break-words text-foreground">
                {value ? (
                  href ? (
                    <a className="underline underline-offset-2" href={href}>
                      {value}
                    </a>
                  ) : (
                    value
                  )
                ) : (
                  <span className="text-ink-muted">Not recorded</span>
                )}
              </dd>
            </div>
          ))}
          {visitor.visitBookedFor ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                Visit booked for
              </dt>
              <dd className="text-foreground">
                {new Date(visitor.visitBookedFor).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Added
            </dt>
            <dd className="text-foreground">{when(visitor.createdAt)}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        Editing details
      </h2>
      <p className="mt-1 text-xs text-muted">
        Anyone in the chapter can fix these. The change is recorded on the
        timeline.
      </p>

      <div className="mt-3 space-y-2.5">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              {field.label}
            </span>
            <input
              type={field.type}
              value={values[field.key]}
              disabled={pending}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  [field.key]: event.target.value,
                }))
              }
              className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25 disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-bni">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="flex-1 rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
