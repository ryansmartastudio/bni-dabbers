"use client";

import type { PageFaq } from "@/db/schema";
import { Input, Textarea } from "@/components/ui/form-fields";

type PageFaqFieldsProps = {
  values: PageFaq[];
  onChange: (values: PageFaq[]) => void;
};

export function PageFaqFields({ values, onChange }: PageFaqFieldsProps) {
  function updateFaq(index: number, patch: Partial<PageFaq>) {
    onChange(values.map((value, i) => (i === index ? { ...value, ...patch } : value)));
  }

  function addFaq() {
    onChange([...values, { question: "", answer: "" }]);
  }

  function removeFaq(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          FAQ entries appear on the page and in FAQ structured data.
        </p>
        <button
          type="button"
          onClick={addFaq}
          className="text-sm font-medium text-bni hover:underline"
        >
          Add FAQ
        </button>
      </div>

      {values.map((faq, index) => (
        <div
          key={`${faq.question}-${index}`}
          className="rounded-lg border border-border bg-surface-muted/40 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">FAQ {index + 1}</p>
            <button
              type="button"
              onClick={() => removeFaq(index)}
              className="text-xs font-medium text-bni hover:underline"
            >
              Remove
            </button>
          </div>
          <Input
            label="Question"
            name={`faq-${index}-question`}
            value={faq.question}
            onChange={(event) => updateFaq(index, { question: event.target.value })}
          />
          <div className="mt-4">
            <Textarea
              label="Answer"
              name={`faq-${index}-answer`}
              value={faq.answer}
              onChange={(event) => updateFaq(index, { answer: event.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
