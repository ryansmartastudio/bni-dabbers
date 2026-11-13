import Link from "next/link";

export const metadata = {
  title: "Visitor workshop",
};

const AGENDA = [
  {
    eyebrow: "Before we start",
    heading: "Open this on your own phone",
    body: "Everything in the session runs in your browser. No app, no sign-up, nothing to install.",
  },
  {
    eyebrow: "During the session",
    heading: "Work through it at your own pace",
    body: "You will be prompted step by step. Take as long as you need on each one — nobody is watching your screen.",
  },
  {
    eyebrow: "Afterwards",
    heading: "Take your answers with you",
    body: "What you write is yours to keep, and gives you something concrete to talk about over coffee.",
  },
];

export default function WorkshopHomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="marketing-eyebrow">BNI Dabbers · Cheshire East</p>
      <h1 className="mt-3 text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
        The visitor workshop
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        A short, hands-on session for guests of the chapter. The workshop opens
        here on the morning it runs — this page is the front door.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {AGENDA.map((item) => (
          <div key={item.heading} className="marketing-fact-card px-5 py-5">
            <p className="marketing-eyebrow">{item.eyebrow}</p>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {item.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="marketing-section-card mt-10">
        <p className="marketing-eyebrow">Not here for the workshop?</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          The chapter lives on the main site
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Meeting times, the member directory and guest visit requests are all
          over on bnidabbers.co.uk.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="https://www.bnidabbers.co.uk/visit"
            className="marketing-primary-button"
          >
            Request a guest visit
          </Link>
          <Link
            href="https://www.bnidabbers.co.uk/directory"
            className="marketing-secondary-button"
          >
            Browse members
          </Link>
        </div>
      </div>
    </div>
  );
}
