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
  getProperties?: () => Promise<string[]>;
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
 * because the picker runs out of process and hands back only what was chosen.
 * iOS Safari has no equivalent (Apple has never shipped the Contact Picker API
 * in WebKit, and every iOS browser is WebKit), so the honest fallback is a
 * .vcf shared out of Contacts. Typing is still the fastest path on iPhone,
 * which is why manual entry sits directly below this and is never hidden.
 */
export function ContactImport({ onImport }: ContactImportProps) {
  // Read through an external store so the server renders the iPhone branch and
  // the client corrects it on hydration, without an effect forcing a re-render.
  const hasPicker = useSyncExternalStore(
    subscribeNoop,
    () => getContactsApi() !== null,
    () => false,
  );
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFromPhone() {
    const api = getContactsApi();
    if (!api) return;
    try {
      const results = await api.select(["name", "tel", "email"], { multiple: false });
      const first = results[0];
      if (!first) return;
      onImport({
        name: first.name?.[0] ?? "",
        company: "",
        phone: first.tel?.[0] ?? "",
        email: first.email?.[0] ?? "",
      });
      setNote(null);
    } catch {
      setNote("Couldn't open your contacts. Type the details instead.");
    }
  }

  async function readVCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const parsed = parseVCard(await file.text());
    if (!parsed) {
      setNote("That file wasn't a contact card. Type the details instead.");
      return;
    }
    onImport(parsed);
    setNote(null);
  }

  return (
    <div className="space-y-2">
      {hasPicker ? (
        <button type="button" onClick={pickFromPhone} className="workshop-import">
          Choose from my contacts
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="workshop-import"
          >
            Import a contact card
          </button>
          <p className="text-xs leading-relaxed text-ink-muted">
            iPhone: Contacts → share the person → Save to Files, then pick it here.
            Typing their name is usually quicker.
          </p>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        onChange={readVCard}
        className="hidden"
        tabIndex={-1}
      />
      {note ? <p className="text-xs font-semibold text-bni">{note}</p> : null}
    </div>
  );
}
