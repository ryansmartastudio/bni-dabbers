import { PickerCheck } from "@/components/workshop/picker-check";
import { IOS_VERSION_PATH, IPHONE_STEPS, WEB_ARROW } from "@/lib/workshop/picker-setup";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Before the workshop",
};

/**
 * The page the table card points at.
 *
 * Open to anyone with the link — there is nothing here but a feature test and
 * some instructions, and putting a sign-in in front of a page whose whole job
 * is "do this before you arrive" would defeat it.
 */
export default function WorkshopCheckPage() {
  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-8 sm:px-6">
      <p className="marketing-eyebrow">BNI Dabbers · Growth Workshop</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-foreground">
        Can your phone share contacts?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        On the day you&rsquo;ll add people you could invite as visitors. iPhones can pull
        them straight from your contacts, but only once you switch one setting on. Androids
        already can.
      </p>

      <PickerCheck />

      <h2 className="mt-9 text-xl font-bold text-foreground">iPhone: how to switch it on</h2>
      <p className="mt-1 text-sm text-muted">
        Check which iOS you&rsquo;re on first: {IOS_VERSION_PATH.join(WEB_ARROW)}.
      </p>

      <div className="mt-4 space-y-3">
        {IPHONE_STEPS.map((group) => (
          <div key={group.version} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              {group.version}
            </p>
            <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-foreground">
              {group.path.join(WEB_ARROW)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-surface-muted p-4">
        <p className="text-sm font-bold text-foreground">Then</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Scroll down the list to <strong className="text-foreground">Contact Picker API</strong>{" "}
            and turn it on.
          </li>
          <li>Fully close Safari: swipe up from the bottom and flick Safari away.</li>
          <li>Come back to this page and tap Try it now.</li>
        </ol>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Can&rsquo;t find Feature Flags? Look for <strong>Experimental Features</strong> in
        the same place — older iOS calls it that. If it isn&rsquo;t there at all, don&rsquo;t
        worry: you can still type names in on the day, which most people do anyway.
      </p>
    </div>
  );
}
