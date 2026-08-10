"use client";

import { Button } from "@/components/ui/button";

const exportsList = [
  {
    id: "directory",
    title: "Export directory PDF",
    description: "Printable member directory with headshots and LinkedIn QR codes.",
    href: "/api/export/directory",
  },
  {
    id: "excel",
    title: "Export Excel roster",
    description: "Full member roster with all fields including notes.",
    href: "/api/export/excel",
  },
  {
    id: "booklet",
    title: "Generate meeting sheet",
    description: "A4 booklet for the secretary to print each week.",
    href: "/api/export/booklet",
  },
];

export function ExportButtons() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {exportsList.map((item) => (
        <article
          key={item.id}
          className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 flex-1 text-sm text-muted">{item.description}</p>
          <Button
            className="mt-4 w-full"
            onClick={() => window.open(item.href, "_blank")}
          >
            Download
          </Button>
        </article>
      ))}
    </div>
  );
}
