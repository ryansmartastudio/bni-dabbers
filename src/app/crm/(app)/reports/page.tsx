import type { Metadata } from "next";
import { ChapterReportView } from "@/components/crm/chapter-report";
import { getChapterReport } from "@/lib/crm/reports";
import { requireChapterAdmin } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function CrmReportsPage() {
  // Doubled guard: the proxy checks the role too, on both hosts. These are
  // other members' figures, not just visitors' details.
  const { member } = await requireChapterAdmin();
  const report = await getChapterReport(member.chapterId);

  return <ChapterReportView report={report} />;
}
