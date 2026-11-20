import type { ReactNode } from "react";

type Props = {
  title: string;
  lead: string;
  children?: ReactNode;
};

/** The frame both reminder landing pages sit in. */
export function ReminderShell({ title, lead, children }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">{lead}</p>
      {children}
    </div>
  );
}
