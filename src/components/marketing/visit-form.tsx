"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { submitEnquiry } from "@/actions/enquiries";
import { Input, Textarea } from "@/components/ui/form-fields";

type VisitFormProps = {
  sourcePath: string;
  pageSlug?: string;
  compact?: boolean;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  website: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "I'd like to visit as a guest and learn more about BNI Dabbers.",
  website: "",
};

export function VisitForm({ sourcePath, pageSlug, compact = false }: VisitFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitEnquiry({
        ...form,
        sourcePath,
        pageSlug: pageSlug ?? "",
      });

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      track("enquiry_submitted", {
        sourcePath,
        pageSlug: pageSlug ?? "",
      });

      router.push("/visit/thank-you");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "rounded-2xl border border-border bg-white p-6 shadow-[0_18px_40px_-34px_rgba(23,20,18,0.35)]"
          : "rounded-2xl border border-border bg-white p-6 shadow-[0_22px_50px_-38px_rgba(23,20,18,0.42)] sm:p-8"
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          autoComplete="tel"
        />
        <Input
          label="Company"
          name="company"
          value={form.company}
          onChange={(event) => updateField("company", event.target.value)}
          autoComplete="organization"
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Message"
          name="message"
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          required
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <Input
          label="Website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>

      {error ? <p className="mt-4 text-sm text-bni">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="marketing-primary-button mt-6 disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
