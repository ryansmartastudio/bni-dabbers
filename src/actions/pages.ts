"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { revalidateMarkdownForPage } from "@/lib/ai/revalidate-discovery";
import { getPageById, getPagePublicPath } from "@/lib/pages";
import { pageSchema, type PageFormValues } from "@/lib/validations";

function revalidatePagePaths(page: { kind: string; slug: string }) {
  revalidatePath("/");
  revalidatePath("/networking-groups");
  revalidatePath("/visit");
  revalidatePath("/directory");
  revalidatePath("/insights");
  revalidatePath("/trades");
  revalidateMarkdownForPage(page as Parameters<typeof revalidateMarkdownForPage>[0]);

  const publicPath = getPagePublicPath(
    page as Parameters<typeof getPagePublicPath>[0],
  );
  if (publicPath !== "/") {
    revalidatePath(publicPath);
  }
}

function normalizePageValues(values: PageFormValues) {
  return {
    ...values,
    locationName: values.locationName?.trim() || null,
    heroEyebrow: values.heroEyebrow?.trim() || null,
    heroImageUrl: values.heroImageUrl?.trim() || null,
    ctaHeading: values.ctaHeading?.trim() || null,
    ctaBody: values.ctaBody?.trim() || null,
    excerpt: values.excerpt?.trim() || null,
    publishedAt: values.publishedAt ?? null,
    intro: values.intro ?? "",
  };
}

export async function createPage(values: PageFormValues) {
  await requireAdmin();
  const parsed = pageSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid page data",
    };
  }
  const payload = normalizePageValues(parsed.data);

  const [created] = await db.insert(pages).values(payload).returning();
  revalidatePagePaths(created);
  return { success: true, id: created.id };
}

export async function updatePage(id: string, values: PageFormValues) {
  await requireAdmin();
  const parsed = pageSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid page data",
    };
  }
  const payload = normalizePageValues(parsed.data);

  const [updated] = await db
    .update(pages)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Page not found" };
  }

  revalidatePagePaths(updated);
  return { success: true };
}

export async function deletePage(id: string) {
  await requireAdmin();
  const existing = await getPageById(id);
  if (!existing) {
    return { success: false, error: "Page not found" };
  }

  await db.delete(pages).where(eq(pages.id, id));
  revalidatePagePaths(existing);
  return { success: true };
}

export async function setPagePublished(id: string, published: boolean) {
  await requireAdmin();
  const [updated] = await db
    .update(pages)
    .set({ published, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Page not found" };
  }

  revalidatePagePaths(updated);
  return { success: true };
}
