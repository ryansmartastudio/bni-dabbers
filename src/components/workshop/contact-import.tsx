"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getContactsApi,
  hasContactsApi,
  isAndroid,
  isChrome,
  isSamsungInternet,
  subscribeNoop,
  type ContactsApi,
} from "@/lib/workshop/contacts-api";
import { parseVCard, type ParsedContact } from "@/lib/workshop/vcard";

type ContactImportProps = {
  onImport: (contact: ParsedContact) => void;
};

/** What we would like, in the order we would like it. */
const WANTED = ["name", "tel", "email"] as const;

/**
 * `File.text()` rejects on some Android content providers. FileReader goes
 * through a different path and tends to succeed where it doesn't.
 */
function readFileText(file: File): Promise<string> {
  return file.text().catch(
    () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("read failed"));
        reader.readAsText(file);
      }),
  );
}

/** The address to read out, without the scheme. */
function joinHost(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.host}${window.location.pathname === "/" ? "" : window.location.pathname}`;
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
  const android = useSyncExternalStore(subscribeNoop, isAndroid, () => false);
  const samsung = useSyncExternalStore(subscribeNoop, isSamsungInternet, () => false);
  const chrome = useSyncExternalStore(subscribeNoop, isChrome, () => false);
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

    // Asking for a property a browser doesn't know makes select() reject
    // outright, and the browsers that report nothing from getProperties() are
    // exactly the ones likely to support fewer. So narrow and try again rather
    // than give up on a phone that would have managed the name.
    const attempts = [props, ["name", "tel"], ["name"]];

    try {
      let results: Awaited<ReturnType<ContactsApi["select"]>> | null = null;
      let lastError: unknown = null;

      for (const attempt of attempts) {
        try {
          results = await api.select(attempt, { multiple: false });
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!results) throw lastError ?? new Error("select() failed");

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
      setNote("Couldn't open your contacts. Use a contact card or type the details below.");
    }
  }

  async function readVCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    // Named in the message because "couldn't read that file" with no idea
    // which file sent us round in circles for a week.
    const what = `${file.name || "that file"} (${file.type || "no type"}, ${file.size} bytes)`;

    // Sharing a contact out of Samsung's Contacts app into a file input hands
    // over an empty stub named after the contact's row id. There is nothing to
    // read and no amount of retrying will produce one, so say so plainly
    // rather than making it look like a failure they can fix by trying again.
    if (file.size === 0) {
      setNote(
        "Your phone handed over an empty file, which is what it does when sharing a contact straight into a browser. Type the name below — or open this page in Chrome, where you can pick from your contacts in one tap.",
      );
      return;
    }

    try {
      const parsed = parseVCard(await readFileText(file));
      if (!parsed) {
        setNote(
          `${what} isn't a contact card. Share the person from your Contacts app and save it as a .vcf first — or just type the name below.`,
        );
        return;
      }
      onImport(parsed);
      setNote(null);
    } catch (error) {
      console.error("Contact card read failed", error);
      setNote(`Couldn't open ${what}. Type the details below instead.`);
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
        returned the file.

        The `accept` filter is what puts the Contacts app in Android's chooser:
        it resolves apps that can hand over a vCard, and Contacts is one. Take
        it away and the chooser offers the camera and a file browser instead,
        and sharing a contact through those hands back an empty stub. It stays
        off on iOS, where a strict filter greys out the very card people are
        trying to pick.
      */}
      <label className={hasPicker ? "workshop-import is-secondary" : "workshop-import"}>
        <input
          ref={fileRef}
          type="file"
          accept={android ? ".vcf,text/vcard,text/x-vcard,text/directory" : undefined}
          onChange={readVCard}
          className="sr-only"
        />
        {hasPicker ? "Or use a contact card" : "Import a contact card"}
      </label>

      {showDiagnostics ? (
        <p className="rounded-lg bg-surface-muted px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
          Picker: {hasPicker ? "available" : "not available"}
          <br />
          ContactsManager:{" "}
          {typeof window === "undefined" ? "—" : "ContactsManager" in window ? "yes" : "no"}
          <br />
          Fields: {reported ?? (hasPicker ? "checking…" : "—")}
          <br />
          UA: {typeof navigator === "undefined" ? "—" : navigator.userAgent}
        </p>
      ) : null}

      {/* Telling a Chrome user to open Chrome is the fastest way to lose them,
          so the nudge only appears for the browsers that actually lack it. */}
      {!hasPicker && android && !chrome ? (
        <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs leading-relaxed text-foreground">
          <strong className="font-bold">
            {samsung ? "Samsung Internet" : "This browser"} has no one-tap contact picker.
          </strong>{" "}
          Tap <span className="font-semibold">Import a contact card</span> above and choose
          Contacts. For one-tap, open{" "}
          <span className="font-semibold">{joinHost()}</span> in Chrome instead.
        </p>
      ) : null}

      {note ? (
        <p className="text-xs font-semibold leading-relaxed text-bni">{note}</p>
      ) : (
        <p className="text-xs leading-relaxed text-ink-muted">
          {hasPicker
            ? "Typing their name is usually quickest."
            : android
              ? "Typing their name is usually quickest."
              : "iPhone: in Contacts, share the person → Save to Files, then pick it here. Typing their name is usually quicker."}
        </p>
      )}
    </div>
  );
}
