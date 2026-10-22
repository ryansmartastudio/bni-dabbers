"use client";

import { useId, useState } from "react";
import type { PageFaq } from "@/db/schema";
import { cn } from "@/lib/utils";

type FaqListProps = {
  faqs: PageFaq[];
  heading?: string;
};

export function FaqList({ faqs, heading = "Frequently asked questions" }: FaqListProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section className="border-t border-border bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="marketing-eyebrow">FAQ</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {heading}
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div
                key={`${faq.question}-${index}`}
                className={cn(
                  "overflow-hidden rounded-2xl border border-border bg-white transition",
                  isOpen && "border-[color-mix(in_srgb,var(--color-bni-red)_30%,var(--color-border))] shadow-[0_18px_40px_-34px_rgba(23,20,18,0.35)]",
                )}
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-muted/50"
                >
                  <span className="text-base font-medium text-foreground">
                    {faq.question}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted transition",
                      isOpen && "rotate-45 border-bni text-bni",
                    )}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className={cn(
                    "border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted",
                    !isOpen && "sr-only",
                  )}
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
