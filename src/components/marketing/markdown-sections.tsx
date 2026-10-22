import type { PageSection } from "@/db/schema";
import { MarkdownContent } from "@/components/marketing/markdown-content";

type MarkdownSectionsProps = {
  sections: PageSection[];
};

export function MarkdownSections({ sections }: MarkdownSectionsProps) {
  if (sections.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-6">
        {sections.map((section) => (
          <article key={section.id} className="marketing-section-card">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
              {section.heading}
            </h2>
            <MarkdownContent content={section.body} />
          </article>
        ))}
      </div>
    </section>
  );
}
