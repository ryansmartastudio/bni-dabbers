import type { Metadata } from "next";
import { CrmSidebar } from "@/components/crm/crm-sidebar";
import { countPipeline } from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";
import { getChapterSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Visitor CRM", template: "%s · Visitor CRM" },
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
  openGraph: undefined,
  twitter: undefined,
};

/**
 * The CRM's own shell.
 *
 * `#crm-root` is what hides the marketing site's header and footer, the same
 * trick the workshop uses: doing it in CSS keeps `headers()` out of the root
 * layout, which would otherwise drag every statically generated page into
 * dynamic rendering.
 *
 * The reminder pages at /crm/r/... are deliberately NOT inside this layout --
 * they are reached from an email without signing in, and this layout requires
 * a member. They live in their own segment.
 */
export default async function CrmLayout({ children }: LayoutProps<"/crm">) {
  const { member, role } = await requireChapterMember();
  const [counts, settings] = await Promise.all([
    countPipeline(member.chapterId, member.id),
    getChapterSettings(),
  ]);

  return (
    <div id="crm-root" className="flex h-dvh flex-col overflow-hidden bg-background lg:flex-row">
      <CrmSidebar
        meName={`${member.firstName} ${member.lastName}`.trim()}
        chapterName={settings.chapterName}
        counts={counts}
        isAdmin={role === "admin"}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
