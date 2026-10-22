"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Page } from "@/db/schema";
import { createPage, updatePage } from "@/actions/pages";
import { PageFaqFields } from "@/components/pages/page-faq-fields";
import { PageSectionsFields } from "@/components/pages/page-sections-fields";
import { PageTabs, type PageTabId } from "@/components/pages/page-tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { getPagePublicPath } from "@/lib/pages";
import type { PageFormValues } from "@/lib/validations";

type PageFormProps = {
  page?: Page;
};

function pageToFormValues(page?: Page): PageFormValues {
  if (!page) {
    return {
      slug: "",
      kind: "location",
      locationName: "",
      title: "",
      metaTitle: "",
      metaDescription: "",
      heroEyebrow: "",
      heroImageUrl: "",
      intro: "",
      sections: [],
      faqs: [],
      ctaHeading: "",
      ctaBody: "",
      published: false,
      publishedAt: null,
      excerpt: "",
      sortOrder: 0,
    };
  }

  return {
    slug: page.slug,
    kind: page.kind,
    locationName: page.locationName ?? "",
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    heroEyebrow: page.heroEyebrow ?? "",
    heroImageUrl: page.heroImageUrl ?? "",
    intro: page.intro,
    sections: page.sections,
    faqs: page.faqs,
    ctaHeading: page.ctaHeading ?? "",
    ctaBody: page.ctaBody ?? "",
    published: page.published,
    publishedAt: page.publishedAt ?? null,
    excerpt: page.excerpt ?? "",
    sortOrder: page.sortOrder,
  };
}

export function PageForm({ page }: PageFormProps) {
  const [activeTab, setActiveTab] = useState<PageTabId>("seo");
  const [values, setValues] = useState<PageFormValues>(() => pageToFormValues(page));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewPath = useMemo(() => {
    if (!values.published) return null;
    return getPagePublicPath({
      kind: values.kind,
      slug: values.slug,
    } as Page);
  }, [values.kind, values.published, values.slug]);

  function updateValues(patch: Partial<PageFormValues>) {
    setValues((current) => {
      const next = { ...current, ...patch };
      if (patch.kind === "home") {
        next.slug = "home";
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = page
        ? await updatePage(page.id, values)
        : await createPage(values);

      if (!result.success) {
        setError(result.error ?? "Could not save page");
        return;
      }

      if (!page && "id" in result && result.id) {
        window.location.href = `/pages/${result.id}/edit`;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <PageTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/40 px-4 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(event) => updateValues({ published: event.target.checked })}
            />
            Published
          </label>
          {previewPath ? (
            <Link href={previewPath} className="text-sm font-medium text-bni hover:underline">
              View live page
            </Link>
          ) : null}
        </div>

        {activeTab === "seo" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Page kind"
                name="kind"
                value={values.kind}
                onChange={(event) =>
                  updateValues({
                    kind: event.target.value as PageFormValues["kind"],
                  })
                }
                options={[
                  { value: "home", label: "Homepage" },
                  { value: "location", label: "Location landing page" },
                  { value: "standard", label: "Standard page (root URL)" },
                  { value: "article", label: "Insights article" },
                ]}
              />
              <Input
                label="Sort order"
                name="sortOrder"
                type="number"
                min={0}
                value={values.sortOrder}
                onChange={(event) =>
                  updateValues({ sortOrder: Number(event.target.value) })
                }
              />
            </div>
            <Input
              label="Slug"
              name="slug"
              value={values.slug}
              disabled={values.kind === "home"}
              onChange={(event) => updateValues({ slug: event.target.value })}
            />
            <Input
              label="Location name"
              name="locationName"
              value={values.locationName ?? ""}
              onChange={(event) => updateValues({ locationName: event.target.value })}
              placeholder="Nantwich"
            />
            <Input
              label="Page title (H1)"
              name="title"
              value={values.title}
              onChange={(event) => updateValues({ title: event.target.value })}
            />
            <Input
              label="Meta title"
              name="metaTitle"
              value={values.metaTitle}
              onChange={(event) => updateValues({ metaTitle: event.target.value })}
            />
            <p className="-mt-2 text-xs text-muted">{values.metaTitle.length}/70 characters</p>
            <Textarea
              label="Meta description"
              name="metaDescription"
              value={values.metaDescription}
              onChange={(event) =>
                updateValues({ metaDescription: event.target.value })
              }
            />
            <p className="-mt-2 text-xs text-muted">
              {values.metaDescription.length}/160 characters
            </p>
            {values.kind === "article" ? (
              <>
                <Textarea
                  label="Excerpt (card summary)"
                  name="excerpt"
                  value={values.excerpt ?? ""}
                  onChange={(event) => updateValues({ excerpt: event.target.value })}
                />
                <Input
                  label="Published date"
                  name="publishedAt"
                  type="date"
                  value={
                    values.publishedAt
                      ? new Date(values.publishedAt).toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(event) =>
                    updateValues({
                      publishedAt: event.target.value
                        ? new Date(event.target.value)
                        : null,
                    })
                  }
                />
              </>
            ) : null}
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Search preview
              </p>
              <p className="mt-3 text-lg text-[#1a0dab]">
                {values.metaTitle || "Meta title preview"}
              </p>
              <p className="text-sm text-[#006621]">www.bnidabbers.co.uk{previewPath ?? "/"}</p>
              <p className="mt-1 text-sm text-muted">
                {values.metaDescription || "Meta description preview"}
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "hero" ? (
          <div className="space-y-4">
            <Input
              label="Hero eyebrow"
              name="heroEyebrow"
              value={values.heroEyebrow ?? ""}
              onChange={(event) => updateValues({ heroEyebrow: event.target.value })}
            />
            <Textarea
              label="Intro (Markdown)"
              name="intro"
              value={values.intro}
              onChange={(event) => updateValues({ intro: event.target.value })}
              className="min-h-40 font-mono text-[13px]"
            />
            <p className="text-xs text-muted">
              Use chapter tokens so copy stays in sync with Settings:{" "}
              <code className="rounded bg-surface-muted px-1">{`{{meetingFacts}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{meetingDay}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{meetingStart}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{meetingEnd}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{venueName}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{venueAddress}}`}</code>,{" "}
              <code className="rounded bg-surface-muted px-1">{`{{venueLine}}`}</code>.
            </p>
            <ImageUpload
              label="Hero image"
              folder="marketing/pages"
              value={values.heroImageUrl ?? ""}
              onChange={(url) => updateValues({ heroImageUrl: url })}
            />
          </div>
        ) : null}

        {activeTab === "sections" ? (
          <PageSectionsFields
            values={values.sections}
            onChange={(sections) => updateValues({ sections })}
          />
        ) : null}

        {activeTab === "faq" ? (
          <PageFaqFields
            values={values.faqs}
            onChange={(faqs) => updateValues({ faqs })}
          />
        ) : null}

        {activeTab === "cta" ? (
          <div className="space-y-4">
            <Input
              label="CTA heading"
              name="ctaHeading"
              value={values.ctaHeading ?? ""}
              onChange={(event) => updateValues({ ctaHeading: event.target.value })}
            />
            <Textarea
              label="CTA body"
              name="ctaBody"
              value={values.ctaBody ?? ""}
              onChange={(event) => updateValues({ ctaBody: event.target.value })}
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-bni">{error}</p> : null}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-bni px-5 py-3 text-sm font-semibold text-white transition hover:bg-bni-dark disabled:opacity-60"
          >
            {isPending ? "Saving..." : page ? "Save page" : "Create page"}
          </button>
          <Link
            href="/pages"
            className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
          >
            Back to pages
          </Link>
        </div>
      </div>
    </form>
  );
}
