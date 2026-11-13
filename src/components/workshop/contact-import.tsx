"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { parseVCard, type ParsedContact } from "@/lib/workshop/vcard";

type ContactImportProps = {
  onImport: (contact: ParsedContact) => void;
};

type ContactsApi = {
  select: (
    props: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
};

/** The picker's availability never changes within a session. */
function subscribeNoop() {
  return () => {};
}

function getContactsApi(): ContactsApi | null {
  if (typeof navigator === "undefined") return null;
  const api = (navigator as Navigator & { contacts?: ContactsApi }).contacts;
  return api && typeof api.select === "function" ? api : null;
}

/**
 * Two ways in, because the platforms are not equal.
 *
 * Android Chrome gets the real Contact Picker — one tap, no permission prompt,
 * because the picker runs out of process. Apple has never shipped that API in
 * WebKit, and every iOS browser is WebKit, so iPhones fall back to a contact
 * card from Files.
 *
 * The card option is offered on every device, not only where the picker is
 * missing: detection is a feature test, and a browser that reports no picker
 * but is perfectly capable of reading a file would otherwise be left with
 * nothing. Typing stays the prominent path either way — on a phone it is
 * genuinely the quickest of the three.
 */
export function ContactImport({ onImport }: ContactImportProps) {
  const hasPicker = useSyncExternalStore(
    subscribeNoop,
    () => getContactsApi() !== null,
    () => false,
  );
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFromPhone() {
    const api = getContactsApi();
    if (!api) {
      setNote("This browser won't open your contacts. Use a contact card or type below.");
      return;
    }
    try {
      const results = await api.select(["name", "tel", "email"], { multiple: false });
      const first = results[0];
      // An empty result means they backed out, which is not an error.
      if (!first) return;
      onImport({
        name: first.name?.[0] ?? "",
        company: "",
        phone: first.tel?.[0] ?? "",
        email: first.email?.[0] ?? "",
      });
      setNote(null);
    } catch {
      setNote("Couldn't open your contacts. Type the details below instead.");
    }
  }

  async function readVCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseVCard(text);
      if (!parsed) {
        setNote(
          `"${file.name}" isn't a contact card. In Contacts, share the person and choose Save to Files, then pick that file.`,
        );
        return;
      }
      onImport(parsed);
      setNote(null);
    } catch {
      setNote("Couldn't read that file. Type the details below instead.");
    }
  }

  return (
    <div className="space-y-2">
      {hasPicker ? (
        <button type="button" onClick={pickFromPhone} className="workshop-import">
          Choose from my contacts
        </button>
      ) : null}

      {/*
        A label wrapping a visually hidden input, rather than display:none plus
        a programmatic click. A file input hidden with display:none is skipped
        by some mobile browsers, so the chooser either never opened or never
        returned the file — which is what "it did nothing" looks like.
        No `accept` filter either: a strict one greys out the card people are
        trying to pick, and the file is validated by parsing it anyway.
      */}
      <label className={hasPicker ? "workshop-import is-secondary" : "workshop-import"}>
        <input
          ref={fileRef}
          type="file"
          onChange={readVCard}
          className="sr-only"
        />
        {hasPicker ? "Or use a contact card" : "Import a contact card"}
      </label>

      {note ? (
        <p className="text-xs font-semibold leading-relaxed text-bni">{note}</p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-muted">
          {hasPicker
            ? "Typing their name is usually quickest."
            : "iPhone: in Contacts, share the person → Save to Files, then pick it here. Typing their name is usually quicker."}
        </p>
      )}
    </div>
  );
}
