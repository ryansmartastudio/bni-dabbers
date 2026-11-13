"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

/** What we would like, in the order we would like it. */
const WANTED = ["name", "tel", "email"] as const;

/** The picker's availability never changes within a session. */
function subscribeNoop() {
  return () => {};
}

/**
 * The canonical feature test from the spec.
 *
 * Checks ContactsManager as well as navigator.contacts: Safari behind its
 * feature flag, Chrome on Android and Samsung Internet have each at times
 * exposed one without a working other.
 */
function hasContactsApi(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return (
    "contacts" in navigator &&
    "ContactsManager" in window &&
    typeof (navigator as Navigator & { contacts?: ContactsApi }).contacts?.select ===
      "function"
  );
}

function getContactsApi(): ContactsApi | null {
  if (!hasContactsApi()) return null;
  return (navigator as Navigator & { contacts?: ContactsApi }).contacts ?? null;
}

/**
 * Two ways in, because the platforms are not equal.
 *
 * Android Chrome has the picker outright. Safari has it too, but only once the
 * Contact Picker API flag is switched on in Settings, so it appears for some
 * iPhones and not others — which is why this is a feature test rather than a
 * check of the platform.
 *
 * The contact-card option stays on every device: a browser that reports no
 * picker but reads files perfectly well should not be left with no import.
 */
export function ContactImport({ onImport }: ContactImportProps) {
  const hasPicker = useSyncExternalStore(subscribeNoop, hasContactsApi, () => false);
  // ?diag=1 reports what this handset actually offers, so a device we can't
  // test here can tell us itself rather than us inferring from the symptom.
  const showDiagnostics = useSyncExternalStore(
    subscribeNoop,
    () => new URLSearchParams(window.location.search).has("diag"),
    () => false,
  );
  const [reported, setReported] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Which properties this browser will actually return. Safari's
  // implementation supports fewer than Chrome's, and asking for one it does
  // not know about makes select() reject outright.
  const supported = useRef<string[]>([...WANTED]);

  useEffect(() => {
    if (!hasPicker) return;
    let cancelled = false;

    void (async () => {
      try {
        const props = await getContactsApi()?.getProperties?.();
        if (cancelled) return;
        if (Array.isArray(props) && props.length > 0) {
          supported.current = props;
          setReported(props.join(", "));
        } else {
          setReported("getProperties() returned nothing");
        }
      } catch (error) {
        // Keep the defaults; select() will tell us if they're wrong.
        setReported(`getProperties() failed: ${String(error)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasPicker]);

  async function pickFromPhone() {
    const api = getContactsApi();
    if (!api) {
      setNote("This browser won't open your contacts. Use a contact card or type below.");
      return;
    }

    // Resolved from a cached list rather than awaiting getProperties() here:
    // an await before select() breaks the user-gesture chain the picker needs.
    const props = WANTED.filter((p) => supported.current.includes(p));
    if (props.length === 0) props.push("name");

    try {
      const results = await api.select(props, { multiple: false });
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
    } catch (error) {
      console.error("Contact picker failed", error);
      setNote("Couldn't open your contacts. Type the details below instead.");
    }
  }

  async function readVCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = parseVCard(await file.text());
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
        returned the file. No `accept` filter either: a strict one greys out
        the card people are trying to pick, and the file is validated by
        parsing it anyway.
      */}
      <label className={hasPicker ? "workshop-import is-secondary" : "workshop-import"}>
        <input ref={fileRef} type="file" onChange={readVCard} className="sr-only" />
        {hasPicker ? "Or use a contact card" : "Import a contact card"}
      </label>

      {showDiagnostics ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
          Picker: {hasPicker ? "available" : "not available"}
          <br />
          Fields: {reported ?? (hasPicker ? "checking…" : "—")}
        </p>
      ) : null}

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
