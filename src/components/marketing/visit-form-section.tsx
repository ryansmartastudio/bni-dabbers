import { TyfcbBanner } from "@/components/marketing/tyfcb-banner";
import { VisitForm } from "@/components/marketing/visit-form";
import type { ChapterSettings } from "@/db/schema";

type VisitFormSectionProps = {
  sourcePath: string;
  pageSlug?: string;
  heading?: string;
  settings?: ChapterSettings;
  showTyfcb?: boolean;
};

export function VisitFormSection({
  sourcePath,
  pageSlug,
  heading = "Request a guest visit",
  settings,
  showTyfcb = true,
}: VisitFormSectionProps) {
  const meetingDay = settings?.meetingDay ?? "chapter";
  return (
    <section className="border-t border-border bg-surface-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:py-16">
        {showTyfcb && settings ? (
          <div className="lg:col-span-2">
            <TyfcbBanner settings={settings} variant="compact" />
          </div>
        ) : null}
        <div>
          <p className="marketing-eyebrow">Guest enquiry</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {heading}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Tell us a little about your business and we&apos;ll arrange a guest visit to
            the next suitable {meetingDay} morning meeting.
          </p>
        </div>
        <VisitForm sourcePath={sourcePath} pageSlug={pageSlug} />
      </div>
    </section>
  );
}
