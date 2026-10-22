import { revalidatePath } from "next/cache";
import type { Member, Page } from "@/db/schema";
import {
  PUBLIC_MARKDOWN_ROUTES,
  getMarkdownPathForMember,
  getMarkdownPathForPage,
} from "@/lib/ai/markdown-paths";

export function revalidateAiDiscovery() {
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");

  for (const mdPath of Object.values(PUBLIC_MARKDOWN_ROUTES)) {
    revalidatePath(mdPath);
  }
}

export function revalidateMarkdownForPage(page: Pick<Page, "kind" | "slug">) {
  revalidatePath(getMarkdownPathForPage(page));
  revalidateAiDiscovery();
}

export function revalidateMarkdownForMember(member: Pick<Member, "id" | "slug">) {
  const mdPath = getMarkdownPathForMember(member);
  if (mdPath) {
    revalidatePath(mdPath);
  }
  revalidatePath(PUBLIC_MARKDOWN_ROUTES.directory);
  revalidateAiDiscovery();
}
